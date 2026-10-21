import { expect } from 'chai';
import sinon from 'sinon';
import zlib from 'zlib';
import { main as action, resetCache } from '../../src/fragment/pipeline.js';
import { clearSettingsCache } from '../../src/fragment/transformers/settings.js';
import {
    clearBaselineCache,
    offersUrl,
    resolveOfferInfos,
    transformer as offerTransformer,
} from '../../src/fragment/transformers/offer.js';
import { mockDictionary } from './replace.test.js';
import SETTINGS_RESPONSE from './mocks/settings-sandbox.json' with { type: 'json' };
import FRAGMENT_RESPONSE_EN from './mocks/fragment-en-default.json' with { type: 'json' };
import { MockState } from './mocks/MockState.js';
import { createResponse } from './mocks/MockFetch.js';

const ODIN = 'https://odin.adobe.com/adobe/contentFragments';
const OSI = 'A1xn6EL4pK93bWjM8flffQpfEL-bnvtoQKQAvkx574M';
const PA = 'phsp_direct_individual';
const CARD_MODEL = { id: 'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL2NhcmQ' };
const COLLECTION_MODEL_ID = 'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL2NvbGxlY3Rpb24';
const OFFER_MODEL = { id: 'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL29mZmVy' };

const PS_ICON = 'https://mcs.odin.adobe.com/content/dam/mcs/en/icons/raw/svg/ps_appicon.svg';

const OFFER_BASELINE = {
    id: 'offer-baseline-id',
    path: `/content/dam/mas/offers/en_US/baselines/${PA}/baseline`,
    model: OFFER_MODEL,
    fields: {
        name: 'Photoshop',
        description: 'Photoshop',
        shortDescription: 'Edit photos and create art with Photoshop.',
        icons: [PS_ICON, 'https://mcs.odin.adobe.com/content/dam/mcs/en/icons/raw/48x48/ps_appicon_48x48.png'],
        paCode: PA,
    },
};

const FRAGMENT_BASELINE = {
    id: 'fragment-baseline-id',
    path: `/content/dam/mas/sandbox/en_US/baselines/plans/${PA}/baseline`,
    model: CARD_MODEL,
    fields: {
        variant: 'plans',
        cardTitle: 'Photoshop baseline',
        prices: `<span is="inline-price" data-wcs-osi="${OSI}"></span>`,
        variations: ['some-variation'],
    },
};

const EDU_BASELINE = {
    id: 'edu-baseline-id',
    path: `/content/dam/mas/sandbox/en_US/baselines/plans/${PA}/edu/baseline`,
    model: CARD_MODEL,
    fields: { cardTitle: 'Photoshop for students', eduNote: 'Students & teachers', variations: ['some-edu-variation'] },
};

const PLANS_FOLDER = '/content/dam/mas/sandbox/en_US/baselines/plans';
const listing = (folder, cursor) => `${ODIN}/?path=${folder}&limit=50${cursor ? `&cursor=${cursor}` : ''}`;
// template folders may hold other fragments, only `<pa>/baseline` & `<pa>/<segment>/baseline` are baselines
const noise = (folder) => [
    { id: 'nested', path: `${folder}/${PA}/nested/fragment`, fields: {} },
    { id: 'other', path: `${folder}/${PA}/other`, fields: {} },
    { id: 'legacy', path: `${folder}/${PA}`, fields: {} },
    { id: 'too-deep', path: `${folder}/${PA}/edu/nested/baseline`, fields: {} },
];

const RESOLVED_OFFERS = [{ offerSelectorIds: [OSI], productArrangementCode: PA, marketSegments: ['COM'] }];
const EDU_RESOLVED_OFFERS = [{ offerSelectorIds: [OSI], productArrangementCode: PA, marketSegments: ['EDU'] }];

let fetchStub;
let state;

const isWcsCall = (url, osi = OSI) =>
    typeof url === 'string' && url.includes('web_commerce_artifact') && url.includes(`offer_selector_ids=${osi}`);

const wcsCalls = (osi = OSI) => fetchStub.getCalls().filter(({ args: [url] }) => isWcsCall(url, osi));

function mockOdin({
    offerBaseline = OFFER_BASELINE,
    fragmentBaseline = FRAGMENT_BASELINE,
    offerLocale = 'en_US',
    resolvedOffers = RESOLVED_OFFERS,
} = {}) {
    mockDictionary(false, fetchStub);
    fetchStub
        .withArgs(`${ODIN}/byPath?path=/content/dam/mas/sandbox/settings/index`)
        .returns(createResponse(200, { id: 'settings-id' }));
    fetchStub.withArgs(`${ODIN}/settings-id?references=all-hydrated`).returns(createResponse(200, SETTINGS_RESPONSE));
    fetchStub.withArgs(`${ODIN}/?path=/content/dam/mas/promotions`).returns(createResponse(200, { items: [] }));
    fetchStub
        .withArgs(sinon.match((url) => typeof url === 'string' && url.includes('web_commerce_artifact')))
        .returns(createResponse(200, { resolvedOffers: [] }));
    fetchStub.withArgs(sinon.match((url) => isWcsCall(url))).returns(createResponse(200, { resolvedOffers }));
    if (offerBaseline) fetchStub.withArgs(offersUrl(offerLocale)).returns(createResponse(200, { [PA]: offerBaseline }));
    const plansItems = [...noise(PLANS_FOLDER), ...(fragmentBaseline ? [fragmentBaseline] : []), EDU_BASELINE];
    fetchStub.withArgs(listing(PLANS_FOLDER)).returns(createResponse(200, { items: plansItems }));
    fetchStub
        .withArgs(`${ODIN}/some-en-us-fragment?references=all-hydrated`)
        .returns(createResponse(200, FRAGMENT_RESPONSE_EN));
}

async function getFragment(params) {
    const response = await action({ api_key: 'wcms-commerce-ims-ro-user-milo', state, ...params });
    const body =
        response.body?.length > 0
            ? JSON.parse(zlib.brotliDecompressSync(Buffer.from(response.body, 'base64')).toString('utf-8'))
            : undefined;
    return { ...response, body };
}

describe('offer transformer', () => {
    beforeEach(() => {
        state = new MockState();
        fetchStub = sinon.stub(globalThis, 'fetch').callsFake(() => createResponse(404, { detail: 'Not Found' }, 'Not Found'));
        clearSettingsCache();
        clearBaselineCache();
        resetCache();
    });

    afterEach(() => {
        fetchStub.restore();
    });

    describe('without fragment id', () => {
        it('uses the fragment baseline as main body, merged over the offer baseline', async () => {
            mockOdin();
            const { statusCode, body } = await getFragment({
                offer: OSI,
                template: 'plans',
                surface: 'sandbox',
                locale: 'en_US',
            });
            expect(statusCode).to.equal(200);
            expect(body.id).to.equal('fragment-baseline-id');
            expect(body.offerBaselineId).to.equal('offer-baseline-id');
            expect(body.fields.cardTitle).to.equal('Photoshop baseline');
            expect(body.fields.mnemonicIcon).to.deep.equal([PS_ICON]);
            expect(body.fields.osi).to.equal(OSI);
            expect(body.wcs.prod[`${OSI}-us-mult`]).to.deep.equal(RESOLVED_OFFERS);
            expect(wcsCalls()).to.have.length(1);
            const fetched = (url) => fetchStub.getCalls().filter(({ args: [called] }) => called === url);
            expect(fetched(listing(PLANS_FOLDER))).to.have.length(1);
            expect(fetched(listing(PLANS_FOLDER))).to.have.length(1);
        });

        it('uses the market segment override of the fragment baseline as main body (EDU offer)', async () => {
            mockOdin({ resolvedOffers: EDU_RESOLVED_OFFERS });
            const { statusCode, body } = await getFragment({
                offer: OSI,
                template: 'plans',
                surface: 'sandbox',
                locale: 'en_US',
            });
            expect(statusCode).to.equal(200);
            expect(body.id).to.equal('edu-baseline-id');
            expect(body.offerBaselineId).to.equal('offer-baseline-id');
            expect(body.fragmentBaselineId).to.equal('fragment-baseline-id');
            expect(body.fields.cardTitle).to.equal('Photoshop for students');
            expect(body.fields.variant).to.equal('plans');
            expect(body.fields.mnemonicIcon).to.deep.equal([PS_ICON]);
        });

        it('uses the market segment override even without fragment baseline', async () => {
            mockOdin({ resolvedOffers: EDU_RESOLVED_OFFERS, fragmentBaseline: null });
            const { statusCode, body } = await getFragment({
                offer: OSI,
                template: 'plans',
                surface: 'sandbox',
                locale: 'en_US',
            });
            expect(statusCode).to.equal(200);
            expect(body.id).to.equal('edu-baseline-id');
            expect(body.fragmentBaselineId).to.be.undefined;
            expect(body.fields.mnemonicIcon).to.deep.equal([PS_ICON]);
        });

        it('ignores market segment overrides of other segments', async () => {
            mockOdin({ resolvedOffers: [{ ...RESOLVED_OFFERS[0], marketSegments: ['GOV'] }] });
            const { body } = await getFragment({ offer: OSI, template: 'plans', surface: 'sandbox', locale: 'en_US' });
            expect(body.id).to.equal('fragment-baseline-id');
            expect(body.fragmentSegmentBaselineId).to.be.undefined;
        });

        it('falls back to the offer baseline as main body', async () => {
            mockOdin({ fragmentBaseline: null });
            const { statusCode, body } = await getFragment({
                offer: OSI,
                template: 'plans',
                surface: 'sandbox',
                locale: 'en_US',
            });
            expect(statusCode).to.equal(200);
            expect(body.id).to.equal('offer-baseline-id');
            // MCS fields are mapped to card fields, the others (e.g. MCS description & blurb) are dropped
            expect(body.fields).to.deep.equal({
                cardTitle: 'Photoshop',
                mnemonicIcon: [PS_ICON],
                mnemonicAlt: ['Photoshop'],
                osi: OSI,
            });
            expect(body.fields.osi).to.equal(OSI);
            expect(body.wcs.prod[`${OSI}-us-mult`]).to.deep.equal(RESOLVED_OFFERS);
            expect(wcsCalls()).to.have.length(1);
        });

        it('only maps the MCS fields an offer baseline has', async () => {
            const fields = { paCode: PA, description: 'Photoshop', icons: [PS_ICON] };
            mockOdin({ offerBaseline: { ...OFFER_BASELINE, fields } });
            const { statusCode, body } = await getFragment({
                offer: OSI,
                template: 'plans',
                surface: 'sandbox',
                locale: 'en_US',
            });
            expect(statusCode).to.equal(200);
            expect(body.offerBaselineId).to.equal('offer-baseline-id');
            expect(body.fields.cardTitle).to.equal('Photoshop baseline');
            // no name: no alt text for the icon
            expect(body.fields.mnemonicIcon).to.deep.equal([PS_ICON]);
            expect(body.fields).to.not.have.any.keys('mnemonicAlt', 'description', 'paCode', 'name');
        });

        it('maps an offer baseline without icons', async () => {
            mockOdin({ fragmentBaseline: null, offerBaseline: { ...OFFER_BASELINE, fields: { name: 'Photoshop' } } });
            const { body } = await getFragment({ offer: OSI, template: 'plans', surface: 'sandbox', locale: 'en_US' });
            expect(body.fields).to.deep.equal({ cardTitle: 'Photoshop', osi: OSI });
        });

        it('fetches the offer baselines of the default locale, en_US fallback included', async () => {
            mockOdin({ fragmentBaseline: null, offerLocale: 'fr_FR' });
            const { statusCode, body } = await getFragment({
                offer: OSI,
                template: 'plans',
                surface: 'sandbox',
                locale: 'fr_FR',
            });
            expect(statusCode).to.equal(200);
            expect(body.id).to.equal('offer-baseline-id');
        });

        it('lists every page of a baselines folder', async () => {
            mockOdin({ fragmentBaseline: null });
            fetchStub
                .withArgs(listing(PLANS_FOLDER))
                .returns(createResponse(200, { items: noise(PLANS_FOLDER), cursor: 'next' }));
            fetchStub.withArgs(listing(PLANS_FOLDER, 'next')).returns(createResponse(200, { items: [FRAGMENT_BASELINE] }));
            const { statusCode, body } = await getFragment({
                offer: OSI,
                template: 'plans',
                surface: 'sandbox',
                locale: 'en_US',
            });
            expect(statusCode).to.equal(200);
            expect(body.id).to.equal('fragment-baseline-id');
        });

        it('falls back to the offer baseline when the fragment baseline fails to load', async () => {
            mockOdin();
            fetchStub.withArgs(listing(PLANS_FOLDER)).returns(createResponse(500, { detail: 'boom' }, 'Internal Server Error'));
            const { statusCode, body } = await getFragment({
                offer: OSI,
                template: 'plans',
                surface: 'sandbox',
                locale: 'en_US',
            });
            expect(statusCode).to.equal(200);
            expect(body.id).to.equal('offer-baseline-id');
        });

        it('returns 404 when no baseline exists', async () => {
            mockOdin({ fragmentBaseline: null, offerBaseline: null });
            const { statusCode } = await getFragment({ offer: OSI, template: 'plans', surface: 'sandbox', locale: 'en_US' });
            expect(statusCode).to.equal(404);
        });

        it('returns 404 when the offer does not resolve', async () => {
            mockOdin();
            const { statusCode } = await getFragment({
                offer: 'unknown-osi',
                template: 'plans',
                surface: 'sandbox',
                locale: 'en_US',
            });
            expect(statusCode).to.equal(404);
        });

        it('returns 400 when template or surface is missing', async () => {
            expect((await getFragment({ offer: OSI, surface: 'sandbox', locale: 'en_US' })).statusCode).to.equal(400);
            expect((await getFragment({ offer: OSI, template: 'plans', locale: 'en_US' })).statusCode).to.equal(400);
            expect(fetchStub.called).to.be.false;
        });

        it('returns 400 on invalid parameter values', async () => {
            const { statusCode, body } = await getFragment({
                offer: OSI,
                template: '../plans',
                surface: 'sandbox',
                locale: 'en_US',
            });
            expect(statusCode).to.equal(400);
            expect(body.message).to.equal("invalid parameter 'template'");
        });

        it('returns 400 when the locale has no default locale on the surface', async () => {
            const result = await resolveOfferInfos({ offer: OSI, template: 'plans', surface: 'unknown', locale: 'xx_XX' });
            expect(result.status).to.equal(400);
        });
    });

    describe('with fragment id', () => {
        it('merges offer and fragment baselines under the requested fragment', async () => {
            mockOdin();
            const { statusCode, body } = await getFragment({ id: 'some-en-us-fragment', offer: OSI, locale: 'en_US' });
            expect(statusCode).to.equal(200);
            expect(body.id).to.equal(FRAGMENT_RESPONSE_EN.id);
            expect(body.offerBaselineId).to.equal('offer-baseline-id');
            expect(body.fragmentBaselineId).to.equal('fragment-baseline-id');
            expect(body.fields.cardTitle).to.equal(FRAGMENT_RESPONSE_EN.fields.cardTitle ?? 'Photoshop baseline');
            // the fragment's own icons win over the offer baseline's, and so does their alt text
            expect(body.fields.mnemonicIcon).to.deep.equal(FRAGMENT_RESPONSE_EN.fields.mnemonicIcon);
            expect(body.fields.mnemonicAlt).to.deep.equal(FRAGMENT_RESPONSE_EN.fields.mnemonicAlt);
            expect(body.fields.osi).to.equal(OSI);
            expect(body.fields.variations).to.deep.equal(FRAGMENT_RESPONSE_EN.fields.variations);
            expect(wcsCalls()).to.have.length(1);
        });

        it('layers the market segment override between the fragment baseline and the fragment (EDU offer)', async () => {
            mockOdin({ resolvedOffers: EDU_RESOLVED_OFFERS });
            const { statusCode, body } = await getFragment({ id: 'some-en-us-fragment', offer: OSI, locale: 'en_US' });
            expect(statusCode).to.equal(200);
            expect(body.id).to.equal(FRAGMENT_RESPONSE_EN.id);
            expect(body.fragmentBaselineId).to.equal('fragment-baseline-id');
            expect(body.fragmentSegmentBaselineId).to.equal('edu-baseline-id');
            expect(body.fields.eduNote).to.equal('Students & teachers');
            expect(body.fields.cardTitle).to.equal(FRAGMENT_RESPONSE_EN.fields.cardTitle);
            // the fragment's own icons win over the offer baseline's, and so does their alt text
            expect(body.fields.mnemonicIcon).to.deep.equal(FRAGMENT_RESPONSE_EN.fields.mnemonicIcon);
            expect(body.fields.mnemonicAlt).to.deep.equal(FRAGMENT_RESPONSE_EN.fields.mnemonicAlt);
            expect(body.fields.variations).to.deep.equal(FRAGMENT_RESPONSE_EN.fields.variations);
        });

        it("resolves the fragment's own osi when only a template is requested", async () => {
            mockOdin();
            const fragmentOsi = FRAGMENT_RESPONSE_EN.fields.osi;
            fetchStub
                .withArgs(sinon.match((url) => isWcsCall(url, fragmentOsi)))
                .returns(createResponse(200, { resolvedOffers: [{ productArrangementCode: PA }] }));
            const { statusCode, body } = await getFragment({ id: 'some-en-us-fragment', template: 'plans', locale: 'en_US' });
            expect(statusCode).to.equal(200);
            expect(body.fields.osi).to.equal(fragmentOsi);
            expect(body.fragmentBaselineId).to.equal('fragment-baseline-id');
            expect(wcsCalls(fragmentOsi)).to.have.length(1);
        });

        it('ignores baselines when the offer does not resolve', async () => {
            mockOdin();
            const { statusCode, body } = await getFragment({
                id: 'some-en-us-fragment',
                offer: 'unknown-osi',
                locale: 'en_US',
            });
            expect(statusCode).to.equal(200);
            expect(body.offerBaselineId).to.be.undefined;
            expect(body.fields.osi).to.equal('unknown-osi');
        });

        it("looks baselines up with the fragment's own osi & variant", async () => {
            mockOdin();
            const fragmentOsi = FRAGMENT_RESPONSE_EN.fields.osi;
            fetchStub
                .withArgs(sinon.match((url) => isWcsCall(url, fragmentOsi)))
                .returns(createResponse(200, { resolvedOffers: [{ productArrangementCode: PA }] }));
            const { statusCode, body } = await getFragment({ id: 'some-en-us-fragment', locale: 'en_US' });
            expect(statusCode).to.equal(200);
            expect(body.offerBaselineId).to.equal('offer-baseline-id');
            expect(body.fragmentBaselineId).to.equal('fragment-baseline-id');
            expect(body.fields.osi).to.equal(fragmentOsi);
            expect(wcsCalls(fragmentOsi)).to.have.length(1);
        });

        it("skips baselines when the fragment's offer does not resolve", async () => {
            mockOdin();
            const { statusCode, body } = await getFragment({ id: 'some-en-us-fragment', locale: 'en_US' });
            expect(statusCode).to.equal(200);
            expect(body.offerBaselineId).to.be.undefined;
            expect(body.fields.osi).to.equal(FRAGMENT_RESPONSE_EN.fields.osi);
        });

        it('skips baselines when the fragment has no osi', async () => {
            const promises = {
                requestInfos: Promise.resolve({ status: 200 }),
                defaultLanguage: Promise.resolve({ status: 200, body: { fields: {} } }),
            };
            expect(await offerTransformer.init({ id: 'some', promises })).to.be.null;
        });

        it('skips baselines when the fragment fails to load', async () => {
            const promises = { defaultLanguage: Promise.resolve({ status: 404 }) };
            expect(await offerTransformer.init({ id: 'some', offer: OSI, promises })).to.be.null;
        });
    });

    describe('surface resolution', () => {
        const stateWithSurfaces = async () => {
            await state.put(
                'configuration',
                JSON.stringify({ apiKeySurfaces: { 'wcms-commerce-ims-ro-user-milo': 'sandbox' } }),
            );
            return state;
        };

        it("falls back on the api key's surface without id nor surface parameter", async () => {
            mockOdin();
            const state = await stateWithSurfaces();
            const { statusCode, body } = await getFragment({ offer: OSI, template: 'plans', locale: 'en_US', state });
            expect(statusCode).to.equal(200);
            expect(body.id).to.equal('fragment-baseline-id');
        });

        it("returns 404 when the requested surface differs from the api key's", async () => {
            const state = await stateWithSurfaces();
            const { statusCode, body } = await getFragment({
                offer: OSI,
                template: 'plans',
                surface: 'acom',
                locale: 'en_US',
                state,
            });
            expect(statusCode).to.equal(404);
            expect(body.message).to.equal("surface 'acom' is not available for this api_key");
            expect(fetchStub.called).to.be.false;
        });

        it("returns 404 when the requested surface differs from the fragment's", async () => {
            mockOdin();
            const { statusCode } = await getFragment({ id: 'some-en-us-fragment', surface: 'acom', locale: 'en_US' });
            expect(statusCode).to.equal(404);
        });

        it("serves the fragment when the requested surface is the fragment's", async () => {
            mockOdin();
            const { statusCode } = await getFragment({ id: 'some-en-us-fragment', surface: 'sandbox', locale: 'en_US' });
            expect(statusCode).to.equal(200);
        });

        it("prefers the fragment's surface over the api key's", async () => {
            mockOdin();
            await state.put('configuration', JSON.stringify({ apiKeySurfaces: { 'wcms-commerce-ims-ro-user-milo': 'acom' } }));
            const { statusCode, body } = await getFragment({ id: 'some-en-us-fragment', locale: 'en_US', state });
            expect(statusCode).to.equal(200);
            expect(body.path).to.equal(FRAGMENT_RESPONSE_EN.path);
        });
    });

    describe('collection', () => {
        const OTHER_OSI = 'other-photoshop-osi';
        const card = (id, fields) => ({
            type: 'content-fragment',
            value: { id, path: `/content/dam/mas/sandbox/en_US/${id}`, model: CARD_MODEL, fields },
        });
        const COLLECTION = {
            id: 'collection-id',
            path: '/content/dam/mas/sandbox/en_US/my-collection',
            model: { id: COLLECTION_MODEL_ID },
            fields: { cards: ['card-1', 'card-2', 'card-3', 'card-4'] },
            references: {
                'card-1': card('card-1', { variant: 'plans', osi: OSI, cardTitle: 'own title' }),
                'card-2': card('card-2', { variant: 'plans', osi: OSI }),
                'card-3': card('card-3', { variant: 'mini', osi: OTHER_OSI }),
                'card-4': card('card-4', { variant: 'plans' }),
            },
            referencesTree: ['card-1', 'card-2', 'card-3', 'card-4', 'missing-card'].map((identifier) => ({
                fieldName: 'cards',
                identifier,
                referencesTree: [],
            })),
        };
        const MINI_LISTING = listing('/content/dam/mas/sandbox/en_US/baselines/mini');
        const callsTo = (url) => fetchStub.getCalls().filter(({ args: [called] }) => called === url);

        beforeEach(() => {
            mockOdin();
            fetchStub.withArgs(`${ODIN}/collection-id?references=all-hydrated`).returns(createResponse(200, COLLECTION));
            fetchStub
                .withArgs(sinon.match((url) => isWcsCall(url, OTHER_OSI)))
                .returns(createResponse(200, { resolvedOffers: RESOLVED_OFFERS }));
            fetchStub.withArgs(MINI_LISTING).returns(createResponse(200, { items: [] }));
        });

        it('resolves baselines of each card, requesting each offer & baseline once', async () => {
            const { statusCode, body } = await getFragment({ id: 'collection-id', locale: 'en_US' });
            expect(statusCode).to.equal(200);
            const [card1, card2, card3, card4] = ['card-1', 'card-2', 'card-3', 'card-4'].map(
                (id) => body.references[id].value,
            );
            expect(card1.fields.cardTitle).to.equal('own title');
            expect(card1.fragmentBaselineId).to.equal('fragment-baseline-id');
            expect(card2.fields.cardTitle).to.equal('Photoshop baseline');
            expect(card2.fields.mnemonicIcon).to.deep.equal([PS_ICON]);
            expect(card3.offerBaselineId).to.equal('offer-baseline-id');
            expect(card3.fragmentBaselineId).to.be.undefined;
            expect(card4.offerBaselineId).to.be.undefined;
            expect(body.offerBaselineId).to.be.undefined;
            expect(wcsCalls()).to.have.length(1);
            expect(wcsCalls(OTHER_OSI)).to.have.length(1);
            expect(callsTo(listing(PLANS_FOLDER))).to.have.length(1);
            expect(callsTo(MINI_LISTING)).to.have.length(1);
            expect(callsTo(offersUrl('en_US'))).to.have.length(1);
        });

        it('caches baselines and their absence across requests', async () => {
            await getFragment({ id: 'collection-id', locale: 'en_US' });
            await getFragment({ id: 'collection-id', locale: 'en_US' });
            expect(callsTo(MINI_LISTING)).to.have.length(1);
            expect(callsTo(listing(PLANS_FOLDER))).to.have.length(1);
            expect(callsTo(offersUrl('en_US'))).to.have.length(1);
        });

        it('retries offer baselines that failed to load on the next request', async () => {
            fetchStub.withArgs(offersUrl('en_US')).returns(createResponse(500, { detail: 'boom' }, 'Internal Server Error'));
            const failed = await getFragment({ id: 'collection-id', locale: 'en_US' });
            expect(failed.statusCode).to.equal(200);
            expect(failed.body.references['card-3'].value.offerBaselineId).to.be.undefined;
            expect(failed.body.references['card-2'].value.fragmentBaselineId).to.equal('fragment-baseline-id');
            fetchStub.withArgs(offersUrl('en_US')).returns(createResponse(200, { [PA]: OFFER_BASELINE }));
            const { body } = await getFragment({ id: 'collection-id', locale: 'en_US' });
            expect(body.references['card-3'].value.offerBaselineId).to.equal('offer-baseline-id');
        });
    });

    it('process leaves context untouched without init result', async () => {
        const context = { promises: { offer: Promise.resolve(null) } };
        expect(await offerTransformer.process(context)).to.equal(context);
    });
});
