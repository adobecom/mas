import { expect } from 'chai';
import sinon from 'sinon';
import zlib from 'zlib';
import {
    clearOffersCache,
    main,
    offerStateKey,
    offersBundleStateKey,
    offersIndexStateKey,
    OFFERS_LOCALES_STATE_KEY,
} from '../src/offers/index.js';
import { resetCache } from '../src/fragment/utils/configuration.js';
import { MockState } from './fragment/mocks/MockState.js';
import { createResponse } from './fragment/mocks/MockFetch.js';

const ODIN = 'https://odin.adobe.com/adobe/contentFragments';
const OFFERS = '/content/dam/mas/offers';
const listing = (folder, cursor) => `${ODIN}/?path=${folder}&limit=50${cursor ? `&cursor=${cursor}` : ''}`;
const baseline = (locale, pa, name = pa) => ({
    id: `${locale}-${pa}`,
    path: `${OFFERS}/${locale}/baselines/${pa}/baseline`,
    model: { id: 'offer-model' },
    fields: { name },
    extra: 'not stored',
});
const stored = ({ id, path, model, fields }) => JSON.stringify({ id, path, model, fields });
const compress = (json) => zlib.brotliCompressSync(JSON.stringify(json)).toString('base64');
const decompress = (value) => JSON.parse(zlib.brotliDecompressSync(Buffer.from(value, 'base64')).toString('utf-8'));

describe('offers action', () => {
    let fetchStub;
    let state;

    beforeEach(() => {
        clearOffersCache();
        state = new MockState();
        sinon.spy(state, 'put');
        sinon.spy(state, 'delete');
        fetchStub = sinon.stub(globalThis, 'fetch').callsFake(() => createResponse(404, { detail: 'Not Found' }, 'Not Found'));
    });

    afterEach(() => {
        fetchStub.restore();
    });

    const keysPut = () => state.put.getCalls().map(({ args: [key] }) => key);

    it('syncs offer baselines of every locale, one state key per locale & product arrangement', async () => {
        const phsp = baseline('en_US', 'phsp_direct_individual');
        const ilst = baseline('en_US', 'ilst_direct_individual');
        const phspFr = baseline('fr_FR', 'phsp_direct_individual');
        fetchStub.withArgs(listing(OFFERS)).returns(
            createResponse(200, {
                items: [
                    phsp,
                    { path: `${OFFERS}/en_US/baselines/phsp_direct_individual/other` },
                    { path: `${OFFERS}/en_US/baselines/phsp_direct_individual/edu/baseline` },
                    { path: `${OFFERS}/en_US/phsp_direct_individual/baseline` },
                ],
                cursor: 'c1',
            }),
        );
        fetchStub.withArgs(listing(OFFERS, 'c1')).returns(createResponse(200, { items: [ilst, phspFr] }));

        const { statusCode, body } = await main({ state });

        expect(statusCode).to.equal(200);
        expect(body.locales).to.deep.equal([
            { locale: 'en_US', total: 2, updated: 2, removed: 0 },
            { locale: 'fr_FR', total: 1, updated: 1, removed: 0 },
        ]);
        expect(state.store[offerStateKey('en_US', 'phsp_direct_individual')]).to.equal(stored(phsp));
        expect(state.store[offerStateKey('en_US', 'ilst_direct_individual')]).to.equal(stored(ilst));
        expect(state.store[offerStateKey('fr_FR', 'phsp_direct_individual')]).to.equal(stored(phspFr));
        expect(Object.keys(JSON.parse(state.store[offersIndexStateKey('en_US')]).hashes)).to.have.length(2);
        expect(JSON.parse(state.store[OFFERS_LOCALES_STATE_KEY])).to.deep.equal(['en_US', 'fr_FR']);
        expect(decompress(state.store[offersBundleStateKey('en_US')])).to.deep.equal({
            phsp_direct_individual: JSON.parse(stored(phsp)),
            ilst_direct_individual: JSON.parse(stored(ilst)),
        });
        expect(decompress(state.store[offersBundleStateKey('fr_FR')])).to.deep.equal({
            phsp_direct_individual: JSON.parse(stored(phspFr)),
        });
        expect(state.put.firstCall.args[2]).to.deep.equal({ ttl: 365 * 24 * 60 * 60 });
    });

    it('only writes changed baselines and deletes removed ones', async () => {
        const phsp = baseline('en_US', 'phsp_direct_individual');
        const ilst = baseline('en_US', 'ilst_direct_individual');
        fetchStub.withArgs(listing(`${OFFERS}/en_US`)).returns(createResponse(200, { items: [phsp, ilst] }));
        await main({ state, locale: 'en_US' });
        state.put.resetHistory();

        await main({ state, locale: 'en_US' });
        expect(keysPut()).to.deep.equal([OFFERS_LOCALES_STATE_KEY]);
        state.put.resetHistory();

        delete state.store[offersBundleStateKey('en_US')];
        await main({ state, locale: 'en_US' });
        expect(keysPut()).to.deep.equal([
            offersBundleStateKey('en_US'),
            offersIndexStateKey('en_US'),
            OFFERS_LOCALES_STATE_KEY,
        ]);
        state.put.resetHistory();

        const updated = baseline('en_US', 'phsp_direct_individual', 'Photoshop');
        fetchStub.withArgs(listing(`${OFFERS}/en_US`)).returns(createResponse(200, { items: [updated] }));
        const { body } = await main({ state, locale: 'en_US' });

        expect(body.locales).to.deep.equal([{ locale: 'en_US', total: 1, updated: 1, removed: 1 }]);
        expect(keysPut()).to.deep.equal([
            offerStateKey('en_US', 'phsp_direct_individual'),
            offersBundleStateKey('en_US'),
            offersIndexStateKey('en_US'),
            OFFERS_LOCALES_STATE_KEY,
        ]);
        expect(state.store[offerStateKey('en_US', 'phsp_direct_individual')]).to.equal(stored(updated));
        expect(state.store[offerStateKey('en_US', 'ilst_direct_individual')]).to.be.undefined;
    });

    it('deletes every baseline, the index & bundle of a requested locale that has none anymore', async () => {
        const phsp = baseline('de_DE', 'phsp_direct_individual');
        fetchStub.withArgs(listing(`${OFFERS}/de_DE`)).returns(createResponse(200, { items: [phsp] }));
        await main({ state, locale: 'de_DE' });
        fetchStub.withArgs(listing(`${OFFERS}/de_DE`)).returns(createResponse(200, { items: [] }));

        const { body } = await main({ state, locale: 'de_DE' });

        expect(body.locales).to.deep.equal([{ locale: 'de_DE', total: 0, updated: 0, removed: 1 }]);
        expect(state.delete.calledWith(offerStateKey('de_DE', 'phsp_direct_individual'))).to.be.true;
        expect(state.store[offersIndexStateKey('de_DE')]).to.be.undefined;
        expect(state.store[offersBundleStateKey('de_DE')]).to.be.undefined;
        expect(JSON.parse(state.store[OFFERS_LOCALES_STATE_KEY])).to.deep.equal([]);
    });

    it('reconciles previously synced locales that have no baseline anymore on a full sync', async () => {
        const phsp = baseline('en_US', 'phsp_direct_individual');
        const phspFr = baseline('fr_FR', 'phsp_direct_individual');
        fetchStub.withArgs(listing(OFFERS)).returns(createResponse(200, { items: [phsp, phspFr] }));
        await main({ state });
        fetchStub.withArgs(listing(OFFERS)).returns(createResponse(200, { items: [phsp] }));

        const { body } = await main({ state });

        expect(body.locales).to.deep.equal([
            { locale: 'en_US', total: 1, updated: 0, removed: 0 },
            { locale: 'fr_FR', total: 0, updated: 0, removed: 1 },
        ]);
        expect(state.store[offerStateKey('fr_FR', 'phsp_direct_individual')]).to.be.undefined;
        expect(state.store[offersBundleStateKey('fr_FR')]).to.be.undefined;
        expect(state.store[offersIndexStateKey('fr_FR')]).to.be.undefined;
        expect(JSON.parse(state.store[OFFERS_LOCALES_STATE_KEY])).to.deep.equal(['en_US']);
    });

    it('tracks listed locales before writing their entries, so a sync failing midway is reconciled later', async () => {
        const phsp = baseline('en_US', 'phsp_direct_individual');
        const phspFr = baseline('fr_FR', 'phsp_direct_individual');
        fetchStub.withArgs(listing(OFFERS)).returns(createResponse(200, { items: [phsp, phspFr] }));
        state.put.restore();
        const put = sinon.stub(state, 'put').callThrough();
        // the tracked locales update closing the first sync fails
        put.withArgs(OFFERS_LOCALES_STATE_KEY).onSecondCall().rejects(new Error('state unavailable'));
        await main({ state }).then(
            () => expect.fail('sync should fail'),
            ({ message }) => expect(message).to.equal('state unavailable'),
        );
        expect(state.store[offerStateKey('fr_FR', 'phsp_direct_individual')]).to.equal(stored(phspFr));
        expect(JSON.parse(state.store[OFFERS_LOCALES_STATE_KEY])).to.deep.equal(['en_US', 'fr_FR']);
        fetchStub.withArgs(listing(OFFERS)).returns(createResponse(200, { items: [phsp] }));

        const { body } = await main({ state });

        expect(body.locales).to.deep.equal([
            { locale: 'en_US', total: 1, updated: 0, removed: 0 },
            { locale: 'fr_FR', total: 0, updated: 0, removed: 1 },
        ]);
        expect(state.store[offerStateKey('fr_FR', 'phsp_direct_individual')]).to.be.undefined;
        expect(state.store[offersBundleStateKey('fr_FR')]).to.be.undefined;
        expect(JSON.parse(state.store[OFFERS_LOCALES_STATE_KEY])).to.deep.equal(['en_US']);
    });

    it('rewrites unchanged baselines once their refresh deadline is passed, so they never expire', async () => {
        const day = 24 * 60 * 60 * 1000;
        const phsp = baseline('en_US', 'phsp_direct_individual');
        fetchStub.withArgs(listing(`${OFFERS}/en_US`)).returns(createResponse(200, { items: [phsp] }));
        const before = Date.now();
        await main({ state, locale: 'en_US' });
        const { refreshAt } = JSON.parse(state.store[offersIndexStateKey('en_US')]);
        expect(refreshAt).to.be.within(before + 30 * day, Date.now() + 60 * day);
        state.put.resetHistory();

        const clock = sinon.useFakeTimers({ now: refreshAt + 1, toFake: ['Date'] });
        try {
            const { body } = await main({ state, locale: 'en_US' });
            expect(body.locales).to.deep.equal([{ locale: 'en_US', total: 1, updated: 1, removed: 0 }]);
            expect(keysPut()).to.deep.equal([
                offerStateKey('en_US', 'phsp_direct_individual'),
                offersBundleStateKey('en_US'),
                offersIndexStateKey('en_US'),
                OFFERS_LOCALES_STATE_KEY,
            ]);
            expect(JSON.parse(state.store[offersIndexStateKey('en_US')]).refreshAt).to.be.above(refreshAt + 30 * day);
        } finally {
            clock.restore();
        }
    });

    it('writes nothing when the listing fails', async () => {
        fetchStub.withArgs(listing(OFFERS)).returns(createResponse(500, { detail: 'boom' }, 'Internal Server Error'));
        const { statusCode } = await main({ state });
        expect(statusCode).to.equal(503);
        expect(state.put.called).to.be.false;
    });

    it('rejects invalid locales', async () => {
        const { statusCode } = await main({ state, locale: '../en_US' });
        expect(statusCode).to.equal(400);
        expect(fetchStub.called).to.be.false;
    });

    describe('web GET', () => {
        const PHSP = baseline('en_US', 'phsp_direct_individual');
        const PHSP_FR = baseline('fr_FR', 'phsp_direct_individual', 'Photoshop FR');
        const ILST = baseline('en_US', 'ilst_direct_individual');
        const get = (params, headers = {}) =>
            main({ state, __ow_method: 'get', __ow_headers: headers, api_key: 'AdobeExpressWeb', ...params });
        const decode = ({ body }) => JSON.parse(zlib.brotliDecompressSync(Buffer.from(body, 'base64')).toString('utf-8'));

        beforeEach(() => {
            resetCache();
            state.store[offerStateKey('en_US', 'phsp_direct_individual')] = stored(PHSP);
            state.store[offerStateKey('fr_FR', 'phsp_direct_individual')] = stored(PHSP_FR);
            state.store[offerStateKey('en_US', 'ilst_direct_individual')] = stored(ILST);
            state.store[offersBundleStateKey('en_US')] = compress({
                phsp_direct_individual: JSON.parse(stored(PHSP)),
                ilst_direct_individual: JSON.parse(stored(ILST)),
            });
            state.store[offersBundleStateKey('fr_FR')] = compress({ phsp_direct_individual: JSON.parse(stored(PHSP_FR)) });
        });

        it('serves requested offer baselines, brotli compressed with an ETag, falling back to en_US', async () => {
            const response = await get({ locale: 'fr_FR', pa: 'phsp_direct_individual,ilst_direct_individual,unknown_pa' });
            expect(response.statusCode).to.equal(200);
            expect(response.headers).to.include({
                'Content-Type': 'application/json',
                'Content-Encoding': 'br',
                'Access-Control-Allow-Headers': 'If-None-Match',
                'Access-Control-Expose-Headers': 'ETag',
            });
            expect(response.headers.ETag).to.match(/^"[\w-]+"$/);
            expect(decode(response)).to.deep.equal({
                phsp_direct_individual: JSON.parse(stored(PHSP_FR)),
                ilst_direct_individual: JSON.parse(stored(ILST)),
            });
            expect(fetchStub.called).to.be.false;
        });

        it('responds 304 when If-None-Match matches the ETag', async () => {
            const { headers } = await get({ locale: 'en_US', pa: 'phsp_direct_individual' });
            const response = await get({ locale: 'en_US', pa: 'phsp_direct_individual' }, { 'if-none-match': headers.ETag });
            expect(response.statusCode).to.equal(304);
            expect(response.body).to.be.undefined;
            expect(response.headers.ETag).to.equal(headers.ETag);
            const changed = await get({ locale: 'en_US', pa: 'phsp_direct_individual' }, { 'if-none-match': '"stale"' });
            expect(changed.statusCode).to.equal(200);
        });

        it('requires an api key accepted by the fragment pipeline configuration', async () => {
            const missing = await get({ locale: 'en_US', pa: 'phsp_direct_individual', api_key: undefined });
            expect(missing.statusCode).to.equal(400);
            expect(decode(missing).message).to.equal('missing api_key');
            expect((await get({ locale: 'en_US', pa: 'phsp_direct_individual', api_key: 'unknown' })).statusCode).to.equal(401);
            resetCache();
            state.store.configuration = JSON.stringify({ apiKeys: ['/^custom_v\\d+$/'] });
            expect((await get({ locale: 'en_US', pa: 'phsp_direct_individual', api_key: 'custom_v2' })).statusCode).to.equal(
                200,
            );
        });

        it('serves every offer baseline of a locale without pa, falling back to en_US', async () => {
            const response = await get({ locale: 'fr_FR' });
            expect(response.statusCode).to.equal(200);
            expect(response.headers.ETag).to.match(/^"[\w-]+"$/);
            expect(decode(response)).to.deep.equal({
                phsp_direct_individual: JSON.parse(stored(PHSP_FR)),
                ilst_direct_individual: JSON.parse(stored(ILST)),
            });
            const notModified = await get({ locale: 'fr_FR' }, { 'if-none-match': response.headers.ETag });
            expect(notModified.statusCode).to.equal(304);
            expect(Object.keys(decode(await get({ locale: 'en_US' })))).to.have.length(2);
        });

        it('responds 404 for a locale without any offer baseline', async () => {
            delete state.store[offersBundleStateKey('en_US')];
            const response = await get({ locale: 'ja_JP' });
            expect(response.statusCode).to.equal(404);
            expect(decode(response).message).to.equal('no offer baseline found for any product arrangement in ja_JP');
        });

        it('responds 404 when no requested offer baseline exists', async () => {
            const response = await get({ locale: 'en_US', pa: 'unknown_pa' });
            expect(response.statusCode).to.equal(404);
            expect(decode(response).message).to.equal('no offer baseline found for unknown_pa in en_US');
        });

        it('responds 400 on missing, invalid or too many parameters', async () => {
            expect((await get({ pa: 'phsp_direct_individual' })).statusCode).to.equal(400);
            expect(decode(await get({ locale: 'en_US', pa: 'phsp,../x' })).message).to.equal("invalid parameter value '../x'");
            const pa = Array.from({ length: 51 }, (_, i) => `pa_${i}`).join(',');
            expect((await get({ locale: 'en_US', pa })).statusCode).to.equal(400);
        });

        it('never syncs on web requests', async () => {
            await get({ locale: 'en_US', pa: 'phsp_direct_individual' });
            expect(fetchStub.called).to.be.false;
            expect(state.put.called).to.be.false;
        });

        it('caches state reads in container memory, absent offer baselines included', async () => {
            sinon.spy(state, 'get');
            const pa = 'phsp_direct_individual,unknown_pa';
            const first = await get({ locale: 'fr_FR', pa });
            const locale = await get({ locale: 'fr_FR' });
            state.get.resetHistory();

            expect(decode(await get({ locale: 'fr_FR', pa }))).to.deep.equal(decode(first));
            expect(decode(await get({ locale: 'fr_FR', preview: 'true' }))).to.deep.equal(decode(locale));
            expect((await get({ locale: 'fr_FR' }, { 'if-none-match': locale.headers.ETag })).statusCode).to.equal(304);
            // only the configuration may be read again
            expect(state.get.getCalls().filter(({ args: [key] }) => key !== 'configuration')).to.be.empty;
        });

        it('serves what a sync of the same container just wrote', async () => {
            expect(
                decode(await get({ locale: 'en_US', pa: 'phsp_direct_individual' })).phsp_direct_individual.fields.name,
            ).to.equal('phsp_direct_individual');
            const updated = baseline('en_US', 'phsp_direct_individual', 'Photoshop');
            fetchStub.withArgs(listing(`${OFFERS}/en_US`)).returns(createResponse(200, { items: [updated, ILST] }));
            await main({ state, locale: 'en_US' });

            const response = await get({ locale: 'en_US', pa: 'phsp_direct_individual' });
            expect(decode(response).phsp_direct_individual.fields.name).to.equal('Photoshop');
            expect(decode(await get({ locale: 'en_US' })).phsp_direct_individual.fields.name).to.equal('Photoshop');
        });

        it('stops serving offer baselines another container deleted once the cached response expires', async () => {
            expect((await get({ locale: 'en_US' })).statusCode).to.equal(200);
            // another container's sync deleted every bundle: this container's cache is not cleared
            delete state.store[offersBundleStateKey('en_US')];
            delete state.store[offersBundleStateKey('fr_FR')];
            expect((await get({ locale: 'en_US' })).statusCode).to.equal(200);

            const clock = sinon.useFakeTimers({ now: Date.now() + 10 * 60 * 1000, toFake: ['Date'] });
            try {
                // expired: served stale while refilling in the background
                expect((await get({ locale: 'en_US' })).statusCode).to.equal(200);
                await new Promise((resolve) => setImmediate(resolve));
                expect((await get({ locale: 'en_US' })).statusCode).to.equal(404);
            } finally {
                clock.restore();
            }
        });
    });
});
