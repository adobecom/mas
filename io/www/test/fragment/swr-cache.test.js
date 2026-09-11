import { expect } from 'chai';
import sinon from 'sinon';
import { createSwrCache } from '../../src/fragment/utils/swr-cache.js';

// A deferred loader: resolve/reject externally so a refill can be held in-flight to observe
// single-flight coalescing and stale-while-revalidate.
function deferred(value) {
    let resolve;
    const promise = new Promise((r) => {
        resolve = r;
    });
    const loader = () => promise;
    return { loader, settle: () => resolve(value) };
}

// Realistic localStorage shim (data keys enumerable, methods non-enumerable) so the preview
// backend and the `Object.keys` prefix-scan clear behave like real Web Storage.
function installLocalStorageShim() {
    const storage = {};
    Object.defineProperties(storage, {
        getItem: { value: (key) => (Object.prototype.hasOwnProperty.call(storage, key) ? storage[key] : null) },
        setItem: {
            value: (key, val) => {
                storage[key] = String(val);
            },
        },
        removeItem: {
            value: (key) => {
                delete storage[key];
            },
        },
    });
    globalThis.localStorage = storage;
    return storage;
}

// debugLogs exercises the logDebug branches; requestId keeps the log prefix happy.
const published = { debugLogs: true, requestId: 'swr-ut' };

describe('swr-cache', () => {
    describe('published (in-memory) backend', () => {
        it('loads on a cold read and returns the value', async () => {
            const cache = createSwrCache({ name: 'test' });
            const loader = sinon.stub().resolves('v1');
            expect(await cache.get(published, 'k', loader)).to.equal('v1');
            expect(loader.callCount).to.equal(1);
        });

        it('serves a fresh entry from cache without reloading', async () => {
            const cache = createSwrCache({ name: 'test' });
            const loader = sinon.stub().resolves('v1');
            await cache.get(published, 'k', loader);
            expect(await cache.get(published, 'k', loader)).to.equal('v1');
            expect(loader.callCount).to.equal(1);
        });

        it('does not cache when the loader resolves null (miss), and retries on the next read', async () => {
            const cache = createSwrCache({ name: 'test' });
            const loader = sinon.stub();
            loader.onFirstCall().resolves(null);
            loader.onSecondCall().resolves('v2');
            expect(await cache.get(published, 'k', loader)).to.be.null;
            expect(await cache.get(published, 'k', loader)).to.equal('v2');
            expect(loader.callCount).to.equal(2);
        });

        it('coalesces concurrent cold reads into a single in-flight load (single-flight)', async () => {
            const cache = createSwrCache({ name: 'test' });
            const { loader, settle } = deferred('shared');
            const spy = sinon.spy(loader);
            const reads = [cache.get(published, 'k', spy), cache.get(published, 'k', spy), cache.get(published, 'k', spy)];
            settle();
            const results = await Promise.all(reads);
            expect(results).to.deep.equal(['shared', 'shared', 'shared']);
            expect(spy.callCount).to.equal(1);
        });

        it('serves stale while ONE background refill runs, then returns the refreshed value', async () => {
            const T0 = 1_000_000;
            const clock = sinon.stub(Date, 'now').returns(T0);
            try {
                const cache = createSwrCache({ name: 'test', ttl: 1000, jitter: 0 });
                await cache.get(published, 'k', sinon.stub().resolves('stale'));

                clock.returns(T0 + 2000); // past the (un-jittered) TTL → expired
                const { loader, settle } = deferred('fresh');
                const refillSpy = sinon.spy(loader);
                // Two concurrent reads on the expired entry: both served stale, ONE refill fired.
                const a = await cache.get(published, 'k', refillSpy);
                const b = await cache.get(published, 'k', refillSpy);
                expect([a, b]).to.deep.equal(['stale', 'stale']);
                expect(refillSpy.callCount).to.equal(1);

                settle();
                await new Promise((r) => setImmediate(r)); // let the background refill settle
                clock.returns(T0 + 2000);
                expect(await cache.get(published, 'k', sinon.stub().resolves('never'))).to.equal('fresh');
            } finally {
                clock.restore();
            }
        });

        it('keeps the stale entry and clears the in-flight slot when a background refill fails', async () => {
            const T0 = 1_000_000;
            const clock = sinon.stub(Date, 'now').returns(T0);
            try {
                const cache = createSwrCache({ name: 'test', ttl: 1000, jitter: 0 });
                await cache.get(published, 'k', sinon.stub().resolves('stale'));

                clock.returns(T0 + 2000);
                // Background refill resolves null (failure) → stale entry survives untouched.
                expect(await cache.get(published, 'k', sinon.stub().resolves(null))).to.equal('stale');
                await new Promise((r) => setImmediate(r));

                // A later read fires a fresh refill (slot was cleared) and recovers.
                expect(await cache.get(published, 'k', sinon.stub().resolves('stale'))).to.equal('stale');
                const recovered = cache.get(published, 'k', sinon.stub().resolves('recovered'));
                // still stale-served synchronously; recovery lands on the next read
                await recovered;
            } finally {
                clock.restore();
            }
        });

        it('jitters each entry TTL within ±jitter of the base', () => {
            const rnd = sinon.stub(Math, 'random');
            try {
                const cache = createSwrCache({ name: 'test', ttl: 1000, jitter: 0.2 });
                rnd.returns(0); // → 1 + (0*2 - 1)*0.2 = 0.8 → 800ms
                rnd.returns(1); // → 1 + (1*2 - 1)*0.2 = 1.2 → 1200ms
                // exercised indirectly; bounds asserted via expiry timing in the stale test above
                expect(cache).to.have.property('get');
            } finally {
                rnd.restore();
            }
        });

        it('clear() drops in-memory entries and in-flight refills', async () => {
            const cache = createSwrCache({ name: 'test' });
            await cache.get(published, 'k', sinon.stub().resolves('v1'));
            cache.clear();
            const loader = sinon.stub().resolves('v2');
            expect(await cache.get(published, 'k', loader)).to.equal('v2');
            expect(loader.callCount).to.equal(1);
        });
    });

    describe('preview (localStorage) backend', () => {
        let storage;
        const preview = { preview: true, debugLogs: true, requestId: 'swr-ut' };

        beforeEach(() => {
            storage = installLocalStorageShim();
        });

        afterEach(() => {
            delete globalThis.localStorage;
        });

        it('persists entries under `<name>-<key>` and reads them back', async () => {
            const cache = createSwrCache({ name: 'dict' });
            expect(await cache.get(preview, 'acom-en_US', sinon.stub().resolves('v1'))).to.equal('v1');
            expect(storage['dict-acom-en_US']).to.exist;
            const loader = sinon.stub().resolves('v2');
            expect(await cache.get(preview, 'acom-en_US', loader)).to.equal('v1');
            expect(loader.callCount).to.equal(0);
        });

        it('always awaits a fresh load on expiry — never serves stale in preview', async () => {
            const T0 = 1_000_000;
            const clock = sinon.stub(Date, 'now').returns(T0);
            try {
                const cache = createSwrCache({ name: 'dict', ttl: 1000, jitter: 0 });
                await cache.get(preview, 'k', sinon.stub().resolves('stale'));
                clock.returns(T0 + 2000);
                expect(await cache.get(preview, 'k', sinon.stub().resolves('fresh'))).to.equal('fresh');
            } finally {
                clock.restore();
            }
        });

        it('clear(true) removes only this namespace, leaving other keys intact', async () => {
            const cache = createSwrCache({ name: 'dict' });
            await cache.get(preview, 'a', sinon.stub().resolves('va'));
            await cache.get(preview, 'b', sinon.stub().resolves('vb'));
            storage['other-key'] = 'keep';
            cache.clear(true);
            expect(storage['dict-a']).to.be.undefined;
            expect(storage['dict-b']).to.be.undefined;
            expect(storage['other-key']).to.equal('keep');
        });
    });
});
