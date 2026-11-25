import { expect } from 'chai';
import sinon from 'sinon';
import {
    clearRequestCaches,
    getRequestMetadata,
    getStoredResponse,
    rereadRequestMetadata,
    storeRequestMetadata,
} from '../../src/fragment/utils/cache.js';
import { MockFiles } from './mocks/MockFiles.js';
import { MockState } from './mocks/MockState.js';

const requestKey = async (params) => (await getRequestMetadata({ state: new MockState(), ...params })).requestKey;

describe('request metadata key', () => {
    it('keeps latest fragment response metadata apart from normal responses', async () => {
        const params = { id: 'some-id', locale: 'en_US', wcsConfiguration: [{ env: 'prod' }, { env: 'stage' }] };
        const latest = await requestKey({ ...params, serveLatest: 'true' });
        expect(latest).to.equal('req-some-id-en_US-latest');
        expect(await requestKey(params)).to.equal('req-some-id-en_US-stage-legacy');
    });

    it('uses the same latest key for boolean and query-string flags', async () => {
        const params = { id: 'some-id', locale: 'en_US', wcsConfiguration: [{ env: 'stage' }] };
        expect(await requestKey({ ...params, serveLatest: true })).to.equal(
            await requestKey({ ...params, serveLatest: 'true' }),
        );
    });

    for (const serveLatest of [false, 'false']) {
        it(`reuses stage-only legacy metadata for explicit ${JSON.stringify(serveLatest)}`, async () => {
            const params = { id: 'some-id', locale: 'en_US', wcsConfiguration: [{ env: 'stage' }] };
            expect(await requestKey({ ...params, serveLatest })).to.equal(await requestKey(params));
        });
    }

    for (const serveLatest of [undefined, 'on', 'TRUE']) {
        it(`preserves the normal key when latest mode is ${JSON.stringify(serveLatest)}`, async () => {
            const params = { id: 'some-id', locale: 'en_US', wcsConfiguration: [{ env: 'stage' }] };
            expect(await requestKey({ ...params, serveLatest })).to.equal(await requestKey(params));
        });
    }

    for (const wcsConfiguration of [undefined, []]) {
        for (const serveLatest of [true, 'true']) {
            it(`preserves the normal key without Stage configuration ${JSON.stringify(wcsConfiguration)} for ${JSON.stringify(serveLatest)}`, async () => {
                const params = { id: 'some-id', locale: 'en_US', wcsConfiguration };
                expect(await requestKey({ ...params, serveLatest })).to.equal(await requestKey(params));
            });
        }
    }

    for (const serveLatest of [false, 'false', true, 'true']) {
        it(`isolates explicit production selection ${JSON.stringify(serveLatest)}`, async () => {
            const params = { id: 'some-id', locale: 'en_US', wcsConfiguration: [{ env: 'prod' }] };
            const normal = await requestKey(params);
            const suffix = String(serveLatest) === 'true' ? 'latest' : 'legacy';
            expect(await requestKey({ ...params, serveLatest })).to.equal(`${normal}-${suffix}`);
        });
    }

    it('does not reuse implicit mixed-environment responses for explicit legacy mode', async () => {
        const params = { id: 'some-id', locale: 'en_US', wcsConfiguration: [{ env: 'prod' }, { env: 'stage' }] };
        expect(await requestKey(params)).not.to.equal(await requestKey({ ...params, serveLatest: false }));
    });

    it('keys a fragment id request by id, locale & country', async () => {
        expect(await requestKey({ id: 'some-id', locale: 'fr_FR', country: 'CA' })).to.equal('req-some-id-fr_FR-CA');
    });

    it('keys a request without id by its offer, template & surface', async () => {
        const key = await requestKey({ offer: 'some-osi', template: 'plans', surface: 'acom', locale: 'en_US' });
        expect(key).to.equal('req-.offer-en_US.o-some-osi.t-plans.s-acom');
    });

    it('keeps an offer override of a fragment apart from the fragment itself', async () => {
        const fragment = await requestKey({ id: 'some-id', locale: 'en_US' });
        const overridden = await requestKey({ id: 'some-id', locale: 'en_US', offer: 'some-osi' });
        expect(overridden).to.equal('req-some-id-en_US.o-some-osi');
        expect(overridden).to.not.equal(fragment);
    });

    it('never collides between offer requests on distinct templates or surfaces', async () => {
        const keys = await Promise.all([
            requestKey({ offer: 'some-osi', template: 'plans', surface: 'acom', locale: 'en_US' }),
            requestKey({ offer: 'some-osi', template: 'catalog', surface: 'acom', locale: 'en_US' }),
            requestKey({ offer: 'some-osi', template: 'plans', surface: 'ccd', locale: 'en_US' }),
        ]);
        expect(new Set(keys).size).to.equal(3);
    });

    it('never collides when a parameter value contains another tagged parameter', async () => {
        const masked = await requestKey({ id: 'some-id', locale: 'en_US', pzn: 'edu', mask: 'catalog' });
        const unmasked = await requestKey({ id: 'some-id', locale: 'en_US', pzn: 'edu-m_catalog' });
        expect(masked).to.equal('req-some-id-en_US.p-edu.m-catalog');
        expect(unmasked).to.equal('req-some-id-en_US.p-edu-m_catalog');
    });

    it('escapes the separator and characters not allowed in State keys', async () => {
        const key = await requestKey({ id: 'some.id', locale: 'en_US', pzn: 'edu,team', mask: 'a.m-b' });
        expect(key).to.equal('req-some.2Eid-en_US.p-edu.2Cteam.m-a.2Em-b');
        expect(key).to.match(/^[a-zA-Z0-9_.-]+$/);
        expect(await requestKey({ id: 'offer', locale: 'en_US', offer: 'o' })).to.not.equal(
            await requestKey({ locale: 'en_US', offer: 'o' }),
        );
    });
});

describe('stored response', () => {
    const KEY = 'req-some-id-en_US';
    const metadata = (props) => ({
        hash: 'h1',
        lastModified: 'Fri, 06 Nov 2026 10:29:22 GMT',
        refreshedAt: Date.now(),
        ...props,
    });
    const RESPONSE_PATH = 'fragment-cache/res-some-id-en_US.json';
    let state;
    let files;
    let clock;

    beforeEach(() => {
        clearRequestCaches();
        state = new MockState();
        files = new MockFiles();
        clock = sinon.useFakeTimers({ now: Date.now(), toFake: ['Date'] });
    });

    afterEach(() => {
        clock.restore();
    });

    const store = (context, cachedMetadata, hash, options) =>
        storeRequestMetadata({ state, files, id: 'some-id', locale: 'en_US', ...context }, KEY, cachedMetadata, hash, options);
    const read = (context) => getRequestMetadata({ state, files, id: 'some-id', locale: 'en_US', measures: [], ...context });

    it('serves a recently refreshed body matching the metadata hash', () => {
        expect(getStoredResponse(metadata(), { hash: 'h1', body: 'b1' })).to.equal('b1');
    });

    it('ignores a missing, mismatching or stale stored response', () => {
        expect(getStoredResponse(metadata(), null)).to.be.null;
        expect(getStoredResponse(null, { hash: 'h1', body: 'b1' })).to.be.null;
        expect(getStoredResponse(metadata({ hash: 'h2' }), { hash: 'h1', body: 'b1' })).to.be.null;
        expect(getStoredResponse(metadata({ refreshedAt: Date.now() - 5 * 60 * 1000 - 1 }), { hash: 'h1', body: 'b1' })).to.be
            .null;
        expect(getStoredResponse(metadata({ refreshedAt: undefined }), { hash: 'h1', body: 'b1' })).to.be.null;
    });

    it('stores metadata in State and body in Files, then reads them back from memory', async () => {
        await store({}, null, 'h1', { body: 'b1' });
        expect(JSON.parse(state.store[KEY])).to.include({ hash: 'h1', refreshedAt: Date.now() });
        expect(Object.keys(state.store)).to.deep.equal([KEY]);
        expect(JSON.parse(files.store[RESPONSE_PATH])).to.deep.equal({ hash: 'h1', body: 'b1' });
        state.store = {};
        files.store = {};
        const { cachedMetadata, cachedResponse } = await read();
        expect(getStoredResponse(cachedMetadata, cachedResponse)).to.equal('b1');
    });

    it('reads the stored body from Files', async () => {
        state.store[KEY] = JSON.stringify(metadata());
        files.store[RESPONSE_PATH] = JSON.stringify({ hash: 'h1', body: 'b1' });
        const { cachedMetadata, cachedResponse, fromState } = await read();
        expect(getStoredResponse(cachedMetadata, cachedResponse)).to.equal('b1');
        expect(fromState).to.be.true;
        files.store[RESPONSE_PATH] = JSON.stringify({ hash: 'h2', body: 'b2' });
        expect((await rereadRequestMetadata({ state, files }, KEY)).cachedResponse).to.deep.equal({ hash: 'h2', body: 'b2' });
    });

    it('treats a failed Files read as a miss', async () => {
        state.store[KEY] = JSON.stringify(metadata());
        files.read = sinon.stub().rejects(new Error('503'));
        const { cachedMetadata, cachedResponse } = await read();
        expect(cachedMetadata.hash).to.equal('h1');
        expect(cachedResponse).to.be.null;
    });

    it('gives up a slow Files read or write', async () => {
        clock.restore();
        clock = sinon.useFakeTimers({ now: Date.now(), toFake: ['Date', 'setTimeout', 'clearTimeout'] });
        files.read = () => new Promise(() => {});
        files.write = sinon.stub().returns(new Promise(() => {}));
        const reading = read();
        await clock.tickAsync(500);
        expect((await reading).cachedResponse).to.be.null;
        const storing = store({ measures: [] }, null, 'h1', { body: 'b1' });
        await clock.tickAsync(500);
        expect((await storing).hash).to.equal('h1');
        expect(files.write.calledOnce).to.be.true;
    });

    it('neither reads nor writes the body without a Files client', async () => {
        await store({ files: undefined }, null, 'h1', { body: 'b1' });
        expect(Object.keys(state.store)).to.deep.equal([KEY]);
        clearRequestCaches();
        expect((await read({ files: undefined })).cachedResponse).to.be.null;
    });

    it('only refreshes the metadata when the hash is unchanged', async () => {
        const previous = metadata({ refreshedAt: 0 });
        const { lastModified } = await store({}, previous, 'h1', { body: 'b1', cachedResponse: { hash: 'h1', body: 'b1' } });
        expect(lastModified.toUTCString()).to.equal(previous.lastModified);
        expect(JSON.parse(state.store[KEY]).refreshedAt).to.equal(Date.now());
        expect(state.store).to.not.have.property('res-some-id-en_US');
    });

    it('sets a new last modified date when the previous metadata lacks one', async () => {
        const { lastModified } = await store({}, metadata({ lastModified: undefined }), 'h1');
        expect(lastModified.getTime()).to.equal(Date.now());
    });

    it('does not store a body exceeding the stored response limit', async () => {
        await store({}, null, 'h1', { body: 'x'.repeat(900 * 1024 + 1) });
        expect(files.store).to.deep.equal({});
    });

    it('writes nothing for instant requests', async () => {
        const { hash } = await store({ instant: '2026-01-01' }, null, 'h1', { body: 'b1' });
        expect(hash).to.equal('h1');
        expect(state.store).to.deep.equal({});
        expect(files.store).to.deep.equal({});
    });

    it('keeps preview requests away from memory and the stored response', async () => {
        const preview = { preview: { url: 'https://preview' } };
        await store(preview, null, 'h1', { body: 'b1' });
        expect(Object.keys(state.store)).to.deep.equal([KEY]);
        expect(files.store).to.deep.equal({});
        const { cachedMetadata, cachedResponse } = await read(preview);
        expect(cachedMetadata.hash).to.equal('h1');
        expect(cachedResponse).to.be.null;
    });

    it('does not fail when State or Files rejects a write', async () => {
        state.put = sinon.stub().rejects(new Error('429'));
        files.write = sinon.stub().rejects(new Error('503'));
        const context = { measures: [] };
        const { hash } = await store(context, null, 'h1', { body: 'b1' });
        expect(hash).to.equal('h1');
        expect(state.put.calledOnce).to.be.true;
        expect(files.write.calledOnce).to.be.true;
    });

    it('uploads an unchanged body again until a Files write succeeds', async () => {
        const write = files.write.bind(files);
        files.write = sinon.stub().rejects(new Error('503'));
        await store({ measures: [] }, null, 'h1', { body: 'b1' });
        let { cachedMetadata, cachedResponse } = await read();
        expect(getStoredResponse(cachedMetadata, cachedResponse)).to.equal('b1');
        files.write = sinon.stub().callsFake(write);
        await store({ measures: [] }, cachedMetadata, 'h1', { body: 'b1', cachedResponse });
        expect(JSON.parse(files.store[RESPONSE_PATH])).to.deep.equal({ hash: 'h1', body: 'b1' });
        ({ cachedMetadata, cachedResponse } = await read());
        await store({ measures: [] }, cachedMetadata, 'h1', { body: 'b1', cachedResponse });
        expect(files.write.calledOnce).to.be.true;
    });
});
