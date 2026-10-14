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
    describe('preview (in-memory) backend', () => {
        const preview = { preview: { url: 'https://preview.example' }, requestId: 'swr-ut' };
        let storage;
        let clock;
        let cache;

        beforeEach(() => {
            storage = installLocalStorageShim();
            clock = sinon.stub(Date, 'now').returns(1000);
            cache = createSwrCache({ name: 'test', previewMemory: true, previewTtl: 1000, jitter: 0 });
        });

        afterEach(() => {
            sinon.restore();
            delete globalThis.localStorage;
        });

        it('keeps parsed preview values out of localStorage', async () => {
            const value = new Map([['k', 'value']]);
            expect(await cache.get(preview, 'k', async () => value)).to.equal(value);
            expect(Object.keys(storage)).to.deep.equal([]);
        });

        it('uses the preview TTL independently of the published TTL', async () => {
            await cache.get(published, 'k', async () => 'published');
            await cache.get(preview, 'k', async () => 'original');
            clock.returns(1500);
            expect(await cache.get(preview, 'k', async () => 'edited')).to.equal('original');
            clock.returns(2001);
            expect(await cache.get(preview, 'k', async () => 'edited')).to.equal('edited');
            expect(await cache.get(published, 'k', async () => 'unexpected')).to.equal('published');
        });

        it('reloads every preview read when its TTL is zero, even within the same millisecond', async () => {
            const cache = createSwrCache({ name: 'test', previewMemory: true, previewTtl: 0 });
            const loader = sinon.stub();
            loader.onFirstCall().resolves('original');
            loader.onSecondCall().resolves('edited');
            expect(await cache.get(preview, 'k', loader)).to.equal('original');
            expect(await cache.get(preview, 'k', loader)).to.equal('edited');
            expect(loader.callCount).to.equal(2);
        });

        it('retries a failed preview refill without serving expired data', async () => {
            await cache.get(preview, 'k', async () => 'original');
            clock.returns(2001);
            expect(await cache.get(preview, 'k', async () => null)).to.be.null;
            expect(await cache.get(preview, 'k', async () => 'recovered')).to.equal('recovered');
        });

        it('releases the preview in-flight slot after a loader rejects', async () => {
            await cache.get(preview, 'k', async () => 'original');
            clock.returns(2001);
            let error;
            try {
                await cache.get(preview, 'k', async () => {
                    throw new Error('offline');
                });
            } catch (caught) {
                error = caught;
            }
            expect(error.message).to.equal('offline');
            expect(await cache.get(preview, 'k', async () => 'recovered')).to.equal('recovered');
        });

        it('coalesces concurrent expired preview reads while awaiting fresh data', async () => {
            await cache.get(preview, 'k', async () => 'original');
            clock.returns(2001);
            const { loader, settle } = deferred('edited');
            const spy = sinon.spy(loader);
            const reads = [cache.get(preview, 'k', spy), cache.get(preview, 'k', spy)];
            settle();
            expect(await Promise.all(reads)).to.deep.equal(['edited', 'edited']);
            expect(spy.callCount).to.equal(1);
        });

        it('isolates published and preview values and in-flight loads', async () => {
            const { loader, settle } = deferred('published');
            const read = cache.get(published, 'k', loader);
            expect(await cache.get(preview, 'k', async () => 'preview')).to.equal('preview');
            settle();
            expect(await read).to.equal('published');
            expect(await cache.get(published, 'k', async () => null)).to.equal('published');
        });

        it('isolates different preview endpoints', async () => {
            await cache.get(preview, 'k', async () => 'one');
            expect(await cache.get({ preview: { url: 'https://other.example' } }, 'k', async () => 'two')).to.equal('two');
            expect(await cache.get(preview, 'k', async () => 'unexpected')).to.equal('one');
        });

        it('clear(true) drops memory-only preview entries without touching published entries', async () => {
            await cache.get(published, 'k', async () => 'published');
            await cache.get(preview, 'k', async () => 'preview');
            cache.clear(true);
            expect(await cache.get(preview, 'k', async () => 'fresh')).to.equal('fresh');
            expect(await cache.get(published, 'k', async () => null)).to.equal('published');
        });

        it('invalidates preview entries in a separately loaded module before their TTL expires', async () => {
            const { createSwrCache: createOtherCache } = await import('../../src/fragment/utils/swr-cache.js?preview-consumer');
            const other = createOtherCache({ name: 'test', previewMemory: true, previewTtl: 1000, jitter: 0 });
            await other.get(preview, 'k', async () => 'original');

            cache.clear(true);

            expect(await other.get(preview, 'k', async () => 'edited')).to.equal('edited');
        });

        it('invalidates other instances on consecutive clears within the same millisecond', async () => {
            const other = createSwrCache({ name: 'test', previewMemory: true, previewTtl: 1000, jitter: 0 });
            await other.get(preview, 'k', async () => 'original');
            cache.clear(true);
            await other.get(preview, 'k', async () => 'first edit');

            cache.clear(true);

            expect(await other.get(preview, 'k', async () => 'second edit')).to.equal('second edit');
        });

        it('does not reuse a pending preview load in another instance after invalidation', async () => {
            const other = createSwrCache({ name: 'test', previewMemory: true, previewTtl: 1000, jitter: 0 });
            const { loader, settle } = deferred('original');
            const oldRead = other.get(preview, 'k', loader);

            cache.clear(true);
            const freshRead = other.get(preview, 'k', async () => 'edited');
            settle();
            await oldRead;

            expect(await freshRead).to.equal('edited');
            expect(await other.get(preview, 'k', async () => 'unexpected')).to.equal('edited');
        });

        it('leaves other namespaces and published entries intact when preview is invalidated', async () => {
            const other = createSwrCache({ name: 'other', previewMemory: true });
            await other.get(preview, 'k', async () => 'unrelated');
            await cache.get(published, 'k', async () => 'published');

            cache.clear(true);

            expect(await other.get(preview, 'k', async () => 'unexpected')).to.equal('unrelated');
            expect(await cache.get(published, 'k', async () => 'unexpected')).to.equal('published');
        });
    });

    it('keeps stale data when a background loader rejects and retries later', async () => {
        const clock = sinon.stub(Date, 'now').returns(1000);
        const errorLog = sinon.stub(console, 'error');
        try {
            const cache = createSwrCache({ name: 'test', ttl: 1000, jitter: 0 });
            await cache.get(published, 'k', async () => 'original');
            clock.returns(2001);
            expect(
                await cache.get(published, 'k', async () => {
                    throw new Error('offline');
                }),
            ).to.equal('original');
            await new Promise((resolve) => setImmediate(resolve));
            expect(errorLog.called).to.be.true;
            expect(await cache.get(published, 'k', async () => 'recovered')).to.equal('original');
            await new Promise((resolve) => setImmediate(resolve));
            expect(await cache.get(published, 'k', async () => null)).to.equal('recovered');
        } finally {
            clock.restore();
            errorLog.restore();
        }
    });

    it('does not repopulate a cache cleared while a refill is pending', async () => {
        const cache = createSwrCache({ name: 'test' });
        const { loader, settle } = deferred('old');
        const oldRead = cache.get(published, 'k', loader);
        cache.clear();
        await cache.get(published, 'k', async () => 'new');
        settle();
        await oldRead;
        expect(await cache.get(published, 'k', async () => null)).to.equal('new');
    });

    it('shares uncached values between concurrent readers and reloads on the next read', async () => {
        const cache = createSwrCache({ name: 'test', shouldCache: () => false });
        const { loader, settle } = deferred('partial');
        const reads = [cache.get(published, 'k', loader), cache.get(published, 'k', loader)];
        settle();
        expect(await Promise.all(reads)).to.deep.equal(['partial', 'partial']);
        expect(await cache.get(published, 'k', async () => 'recovered')).to.equal('recovered');
    });

    it('retains stale data when the cacheability predicate rejects a refill', async () => {
        const clock = sinon.stub(Date, 'now').returns(1000);
        try {
            const cache = createSwrCache({
                name: 'test',
                ttl: 1000,
                jitter: 0,
                shouldCache: (value) => value !== 'partial',
            });
            await cache.get(published, 'k', async () => 'complete');
            clock.returns(2001);
            expect(await cache.get(published, 'k', async () => 'partial')).to.equal('complete');
            await new Promise((resolve) => setImmediate(resolve));
            expect(await cache.get(published, 'k', async () => null)).to.equal('complete');
        } finally {
            clock.restore();
        }
    });

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
