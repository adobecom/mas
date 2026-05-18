import { expect } from 'chai';
import sinon from 'sinon';
import { transformer as promotionsTransformer, clearPromoCache } from '../../src/fragment/transformers/promotions.js';
import { createResponse } from './mocks/MockFetch.js';

const FOLDER_URL = 'https://odin.adobe.com/adobe/contentFragments/?path=/content/dam/mas/promotions';
const hydrateUrl = (id) => `https://odin.adobe.com/adobe/contentFragments/${id}?references=all-hydrated`;

const START = '2020-01-01T00:00:00Z';
const END = '2099-12-31T23:59:59Z';
const EXPIRED_END = '2020-03-01T00:00:00Z';
// Fixed instant for preview-only time-travel tests
const PREVIEW_INSTANT = new Date('2020-02-01T00:00:00Z').getTime();

const DEFAULT_LANG_PROMISE = Promise.resolve({
    status: 200,
    defaultLocale: 'en_US',
    regionLocale: 'en_US',
    surface: 'acom',
});

let fetchStub;

function createContext(overrides = {}) {
    const { promises: promiseOverrides, ...rest } = overrides;
    return {
        surface: 'acom',
        locale: 'en_US',
        country: undefined,
        regionLocale: undefined,
        preview: undefined,
        networkConfig: { retries: 1, retryDelay: 1, fetchTimeout: 500 },
        promises: { defaultLanguage: DEFAULT_LANG_PROMISE, ...promiseOverrides },
        ...rest,
    };
}

const PROMO_TAG = 'mas:promotion/black-friday';

function makeProject({
    id = 'proj-1',
    path = '/content/dam/mas/promotions/black-friday',
    surfaces = ['acom'],
    geos = [],
    startDate = START,
    endDate = END,
    tags = [PROMO_TAG],
    offers = [],
} = {}) {
    return { id, path, fields: { surfaces, geos, startDate, endDate, tags, offers } };
}

function makeHydratedProject({
    fragmentId = 'frag-1',
    fragmentPath = '/content/dam/mas/acom/en_US/offers/offer-1',
    promoCode = 'PROMO10',
} = {}) {
    return {
        fields: { fragments: [fragmentId], promoCode },
        references: {
            [fragmentId]: {
                type: 'content-fragment',
                value: { id: fragmentId, path: fragmentPath, fields: {} },
            },
        },
    };
}

function installLocalStorageShim() {
    const storage = {};
    globalThis.localStorage = {
        getItem: (key) => storage[key] ?? null,
        setItem: (key, val) => {
            storage[key] = val;
        },
        removeItem: (key) => {
            delete storage[key];
        },
    };
    return storage;
}

export { makeProject, makeHydratedProject, FOLDER_URL, hydrateUrl, DEFAULT_LANG_PROMISE };

describe('promotions', () => {
    describe('init', () => {
        beforeEach(() => {
            fetchStub = sinon.stub(globalThis, 'fetch');
            // Default: any unmocked URL returns 404 (avoids TypeError on undefined response)
            fetchStub.returns(createResponse(404, null, 'Not Found'));
        });

        afterEach(() => {
            fetchStub.restore();
            clearPromoCache();
        });

        it('returns no active project when folder fetch fails', async () => {
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(404, null, 'Not Found'));
            const result = await promotionsTransformer.init(createContext());
            expect(result).to.deep.equal({ status: 200, activeProject: null });
        });

        it('returns no active project when folder is empty', async () => {
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [] }));
            const result = await promotionsTransformer.init(createContext());
            expect(result).to.deep.equal({ status: 200, activeProject: null });
        });

        it('returns no active project when project has no promotion tag', async () => {
            const project = makeProject({ tags: ['some-other-tag'] });
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [project] }));
            const result = await promotionsTransformer.init(createContext());
            expect(result).to.deep.equal({ status: 200, activeProject: null });
        });

        it('returns no active project when no project matches surface', async () => {
            const project = makeProject({ surfaces: ['express'] });
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [project] }));
            const result = await promotionsTransformer.init(createContext({ surface: 'acom' }));
            expect(result).to.deep.equal({ status: 200, activeProject: null });
        });

        it('returns no active project when project end date has passed', async () => {
            const project = makeProject({ surfaces: ['acom'], endDate: EXPIRED_END });
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [project] }));
            const result = await promotionsTransformer.init(createContext());
            expect(result).to.deep.equal({ status: 200, activeProject: null });
        });

        it('returns no active project when project start date is in the future', async () => {
            const project = makeProject({
                surfaces: ['acom'],
                geos: [],
                startDate: '2099-01-01T00:00:00Z',
                endDate: '2099-12-31T00:00:00Z',
            });
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [project] }));
            const result = await promotionsTransformer.init(createContext());
            expect(result).to.deep.equal({ status: 200, activeProject: null });
        });

        it('returns no active project when geo does not match', async () => {
            const project = makeProject({ surfaces: ['acom'], geos: ['/content/cq:tags/mas/locale/fr_FR'] });
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [project] }));
            const result = await promotionsTransformer.init(createContext({ regionLocale: 'en_US' }));
            expect(result).to.deep.equal({ status: 200, activeProject: null });
        });

        it('selects active project matching surface, geo and date range', async () => {
            const project = makeProject({ id: 'proj-1', surfaces: ['acom'], geos: ['/content/cq:tags/mas/locale/en_US'] });
            const hydrated = makeHydratedProject({ promoCode: 'SAVE20' });
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [project] }));
            fetchStub.withArgs(hydrateUrl('proj-1')).returns(createResponse(200, hydrated));

            const result = await promotionsTransformer.init(createContext({ regionLocale: 'en_US' }));
            expect(result.status).to.equal(200);
            expect(result.activeProject.id).to.equal('proj-1');
            expect(result.activeProject.fragmentPaths).to.have.length(1);
            expect(result.activeProject.promoCode).to.equal('SAVE20');
        });

        it('ignores instant when not in preview mode', async () => {
            const project = makeProject({ surfaces: ['acom'], geos: [], startDate: START, endDate: EXPIRED_END });
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [project] }));

            // EXPIRED_END is in the past — without preview, instant is ignored and Date.now() is used
            const result = await promotionsTransformer.init(createContext({ instant: PREVIEW_INSTANT }));
            expect(result).to.deep.equal({ status: 200, activeProject: null });
        });

        it('matches project by country when locale does not match geos', async () => {
            const project = makeProject({ surfaces: ['acom'], geos: ['/content/cq:tags/mas/country/CH'] });
            const hydrated = makeHydratedProject();
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [project] }));
            fetchStub.withArgs(hydrateUrl('proj-1')).returns(createResponse(200, hydrated));

            const result = await promotionsTransformer.init(createContext({ locale: 'fr_FR', country: 'CH' }));
            expect(result.activeProject).to.not.be.null;
        });

        it('matches project by regionLocale', async () => {
            const project = makeProject({ surfaces: ['acom'], geos: ['/content/cq:tags/mas/locale/fr_CH'] });
            const hydrated = makeHydratedProject();
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [project] }));
            fetchStub.withArgs(hydrateUrl('proj-1')).returns(createResponse(200, hydrated));

            const result = await promotionsTransformer.init(
                createContext({ locale: 'fr_FR', country: 'CH', regionLocale: 'fr_CH' }),
            );
            expect(result.activeProject).to.not.be.null;
        });

        it('uses first match and logs warning when multiple projects match', async () => {
            const logStub = sinon.stub(console, 'log');
            try {
                const p1 = makeProject({ id: 'proj-1', surfaces: ['acom'], geos: ['/content/cq:tags/mas/locale/en_US'] });
                const p2 = makeProject({ id: 'proj-2', surfaces: ['acom'], geos: ['/content/cq:tags/mas/locale/en_US'] });
                const hydrated = makeHydratedProject();
                fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [p1, p2] }));
                fetchStub.withArgs(hydrateUrl('proj-1')).returns(createResponse(200, hydrated));

                const result = await promotionsTransformer.init(createContext({ regionLocale: 'en_US', debugLogs: true }));
                expect(result.activeProject.id).to.equal('proj-1');
                expect(logStub.calledWithMatch(sinon.match(/Multiple promotion projects matched/))).to.be.true;
            } finally {
                logStub.restore();
            }
        });

        it('returns no active project when hydration fails', async () => {
            const project = makeProject({ surfaces: ['acom'], geos: ['/content/cq:tags/mas/locale/en_US'] });
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [project] }));
            fetchStub.withArgs(hydrateUrl('proj-1')).returns(createResponse(500, null, 'Error'));

            const result = await promotionsTransformer.init(createContext({ regionLocale: 'en_US' }));
            expect(result).to.deep.equal({ status: 200, activeProject: null });
        });

        it('handles folder response without items field', async () => {
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, {}));
            const result = await promotionsTransformer.init(createContext());
            expect(result).to.deep.equal({ status: 200, activeProject: null });
        });

        it('handles project items with missing fields', async () => {
            // Project with no fields — should not match any surface
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [{ id: 'proj-no-fields' }] }));
            const result = await promotionsTransformer.init(createContext());
            expect(result).to.deep.equal({ status: 200, activeProject: null });
        });

        it('uses Date.now() when instant is not provided', async () => {
            // Wide date range that includes any current Date.now()
            const project = makeProject({
                surfaces: ['acom'],
                geos: [],
                startDate: '2000-01-01T00:00:00Z',
                endDate: '2099-12-31T00:00:00Z',
            });
            const hydrated = makeHydratedProject();
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [project] }));
            fetchStub.withArgs(hydrateUrl('proj-1')).returns(createResponse(200, hydrated));

            const ctx = createContext();
            delete ctx.instant; // let toInstant fall back to Date.now()
            const result = await promotionsTransformer.init(ctx);
            expect(result.activeProject).to.not.be.null;
        });

        it('handles project with null startDate and endDate', async () => {
            const project = makeProject({ surfaces: ['acom'], geos: [], startDate: null, endDate: null });
            const hydrated = makeHydratedProject();
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [project] }));
            fetchStub.withArgs(hydrateUrl('proj-1')).returns(createResponse(200, hydrated));

            const result = await promotionsTransformer.init(createContext());
            expect(result.activeProject).to.not.be.null;
        });

        it('skips refs missing from references or with no parseable path', async () => {
            const hydrated = {
                fields: {
                    fragments: ['valid-ref', 'missing-ref', 'no-fields-ref', 'no-path-ref'],
                    promoCode: 'P1',
                },
                references: {
                    'valid-ref': {
                        type: 'content-fragment',
                        value: { id: 'v', path: '/content/dam/mas/acom/en_US/offers/offer-1', fields: {} },
                    },
                    // 'missing-ref' not present — ref will be null
                    'no-fields-ref': {
                        type: 'content-fragment',
                        value: { id: 'nf', path: '/content/dam/mas/acom/en_US/offers/offer-3' },
                    },
                    'no-path-ref': { type: 'content-fragment', value: { id: 'np', fields: {} } },
                },
            };
            const project = makeProject({ surfaces: ['acom'], geos: [] });
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [project] }));
            fetchStub.withArgs(hydrateUrl('proj-1')).returns(createResponse(200, hydrated));

            const result = await promotionsTransformer.init(createContext());
            // valid-ref and no-fields-ref have parseable paths; missing-ref and no-path-ref are skipped
            expect(result.activeProject.fragmentPaths).to.have.length(2);
            expect(result.activeProject.fragmentPaths).to.include('offers/offer-1');
            expect(result.activeProject.fragmentPaths).to.include('offers/offer-3');
        });

        it('returns no active project when hydrated project has no fragments', async () => {
            const hydrated = { fields: {}, references: {} };
            const project = makeProject({ surfaces: ['acom'], geos: [] });
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [project] }));
            fetchStub.withArgs(hydrateUrl('proj-1')).returns(createResponse(200, hydrated));

            const result = await promotionsTransformer.init(createContext());
            expect(result).to.deep.equal({ status: 200, activeProject: null });
        });

        it('returns no active project when hydrated project has empty fragments list', async () => {
            const hydrated = { fields: { fragments: [] } };
            const project = makeProject({ surfaces: ['acom'], geos: [] });
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [project] }));
            fetchStub.withArgs(hydrateUrl('proj-1')).returns(createResponse(200, hydrated));

            const result = await promotionsTransformer.init(createContext());
            expect(result).to.deep.equal({ status: 200, activeProject: null });
        });

        it('uses cache on second call without re-fetching folder', async () => {
            const project = makeProject({ surfaces: ['acom'], geos: ['/content/cq:tags/mas/locale/en_US'] });
            const hydrated = makeHydratedProject();
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [project] }));
            fetchStub.withArgs(hydrateUrl('proj-1')).returns(createResponse(200, hydrated));

            await promotionsTransformer.init(createContext({ regionLocale: 'en_US' }));
            await promotionsTransformer.init(createContext({ regionLocale: 'en_US' }));

            expect(fetchStub.withArgs(FOLDER_URL).callCount).to.equal(1);
        });

        it('returns no active project when defaultLanguage resolves without defaultLocale', async () => {
            const project = makeProject({ surfaces: ['acom'], geos: [] });
            const hydrated = makeHydratedProject();
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [project] }));
            fetchStub.withArgs(hydrateUrl('proj-1')).returns(createResponse(200, hydrated));

            const result = await promotionsTransformer.init(
                createContext({ promises: { defaultLanguage: Promise.resolve({ status: 200 }) } }),
            );
            expect(result).to.deep.equal({ status: 200, activeProject: null });
        });

        it('handles variation folder response with missing items field', async () => {
            const project = makeProject({ surfaces: ['acom'], geos: [] });
            const hydrated = makeHydratedProject();
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [project] }));
            fetchStub.withArgs(hydrateUrl('proj-1')).returns(createResponse(200, hydrated));

            // Variation folder returns 200 but no items field
            const varUrl =
                'https://odin.adobe.com/adobe/contentFragments/?path=/content/dam/mas/acom/en_US/promotions/black-friday';
            fetchStub.withArgs(varUrl).returns(createResponse(200, {}));

            const result = await promotionsTransformer.init(createContext());
            expect(result.activeProject).to.not.be.null;
            expect(result.activeProject.defaultVariations).to.deep.equal({});
        });
    });

    describe('preview mode', () => {
        let storage;
        beforeEach(() => {
            fetchStub = sinon.stub(globalThis, 'fetch');
            fetchStub.returns(createResponse(404, null, 'Not Found'));
            storage = installLocalStorageShim();
        });

        afterEach(() => {
            fetchStub.restore();
            clearPromoCache(true);
            clearPromoCache();
            delete globalThis.localStorage;
        });

        it('supports instant for time-travel testing in preview mode', async () => {
            const project = makeProject({ surfaces: ['acom'], geos: [], startDate: START, endDate: EXPIRED_END });
            const hydrated = makeHydratedProject();
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [project] }));
            fetchStub.withArgs(hydrateUrl('proj-1')).returns(createResponse(200, hydrated));

            const result = await promotionsTransformer.init(createContext({ preview: true, instant: PREVIEW_INSTANT }));
            expect(result.activeProject).to.not.be.null;
            expect(result.activeProject.id).to.equal('proj-1');
        });

        it('supports instant as an ISO string in preview mode', async () => {
            const project = makeProject({ surfaces: ['acom'], geos: [], startDate: START, endDate: EXPIRED_END });
            const hydrated = makeHydratedProject();
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [project] }));
            fetchStub.withArgs(hydrateUrl('proj-1')).returns(createResponse(200, hydrated));

            const result = await promotionsTransformer.init(createContext({ preview: true, instant: '2020-02-01T00:00:00Z' }));
            expect(result.activeProject).to.not.be.null;
        });

        it('uses localStorage cache in preview mode', async () => {
            const project = makeProject({ surfaces: ['acom'], geos: ['/content/cq:tags/mas/locale/en_US'] });
            const hydrated = makeHydratedProject();
            const previewCtx = createContext({
                regionLocale: 'en_US',
                preview: { url: 'https://odin.adobe.com/adobe/contentFragments' },
            });
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [project] }));
            fetchStub.withArgs(hydrateUrl('proj-1')).returns(createResponse(200, hydrated));

            await promotionsTransformer.init(previewCtx);
            expect(storage['promotions']).to.exist;

            const result = await promotionsTransformer.init(previewCtx);
            expect(fetchStub.withArgs(FOLDER_URL).callCount).to.equal(1);
            expect(result.activeProject).to.not.be.null;

            clearPromoCache(true);
            expect(storage['promotions']).to.be.undefined;
        });
    });

    describe('process', () => {
        it('returns no promoMap when promises.promotions is absent', async () => {
            const context = createContext({});
            const result = await promotionsTransformer.process(context);
            expect(result.status).to.equal(200);
            expect(result.promoMap).to.be.undefined;
        });

        it('returns no promoMap when no active project', async () => {
            const context = createContext({
                promises: { promotions: Promise.resolve({ status: 200, activeProject: null }) },
            });
            const result = await promotionsTransformer.process(context);
            expect(result.status).to.equal(200);
            expect(result.promoMap).to.be.undefined;
        });

        it('builds promoMap from project promoCode and promoFragmentPaths from fragmentPaths', async () => {
            const context = createContext({
                promises: {
                    promotions: Promise.resolve({
                        status: 200,
                        activeProject: {
                            fragmentPaths: ['offers/offer-1', 'offers/offer-2'],
                            offerOverrides: [],
                            promoCode: 'SUMMER25',
                        },
                    }),
                },
            });
            const result = await promotionsTransformer.process(context);
            expect(result.promoMap).to.deep.equal({ '*': 'SUMMER25' });
            expect([...result.promoFragmentPaths]).to.have.members(['offers/offer-1', 'offers/offer-2']);
        });

        it('uses project-level promoCode as wildcard in promoMap', async () => {
            const context = createContext({
                promises: {
                    promotions: Promise.resolve({
                        status: 200,
                        activeProject: {
                            fragments: [],
                            offerOverrides: [],
                            promoCode: 'NICOPROMO',
                        },
                    }),
                },
            });
            const result = await promotionsTransformer.process(context);
            expect(result.promoMap).to.deep.equal({ '*': 'NICOPROMO' });
        });
    });

    describe('promoMap building', () => {
        function makeCtx(country, offerOverrides, promoCode) {
            return createContext({
                country,
                promises: {
                    promotions: Promise.resolve({
                        status: 200,
                        activeProject: { fragmentPaths: [], offerOverrides, promoCode },
                    }),
                },
            });
        }

        it('maps specific OSI override when OSI and country match', async () => {
            const result = await promotionsTransformer.process(
                makeCtx('US', [{ osis: ['OSI-1'], promoCode: 'OVERRIDE', countries: ['US'] }]),
            );
            expect(result.promoMap).to.deep.equal({ 'OSI-1': 'OVERRIDE' });
        });

        it('maps specific OSI override when countries is empty (any country)', async () => {
            const result = await promotionsTransformer.process(
                makeCtx('DE', [{ osis: ['OSI-1'], promoCode: 'GLOBAL', countries: [] }]),
            );
            expect(result.promoMap).to.deep.equal({ 'OSI-1': 'GLOBAL' });
        });

        it('maps wildcard when osis is empty and country matches', async () => {
            const result = await promotionsTransformer.process(
                makeCtx('FR', [{ osis: [], promoCode: 'FRANCE', countries: ['FR'] }]),
            );
            expect(result.promoMap).to.deep.equal({ '*': 'FRANCE' });
        });

        it('maps wildcard when both osis and countries are empty', async () => {
            const result = await promotionsTransformer.process(
                makeCtx(undefined, [{ osis: [], promoCode: 'UNIVERSAL', countries: [] }]),
            );
            expect(result.promoMap).to.deep.equal({ '*': 'UNIVERSAL' });
        });

        it('skips override when country does not match', async () => {
            const result = await promotionsTransformer.process(
                makeCtx('CA', [{ osis: ['OSI-1'], promoCode: 'NOPE', countries: ['US'] }]),
            );
            expect(result.promoMap).to.deep.equal({});
        });

        it('override takes priority over project-level promoCode for same OSI', async () => {
            const result = await promotionsTransformer.process(
                makeCtx('US', [{ osis: ['OSI-1'], promoCode: 'OVERRIDE', countries: ['US'] }], 'DEFAULT'),
            );
            expect(result.promoMap['OSI-1']).to.equal('OVERRIDE');
            expect(result.promoMap['*']).to.equal('DEFAULT');
        });

        it('falls back to project-level promoCode when override country does not match', async () => {
            const result = await promotionsTransformer.process(
                makeCtx('CA', [{ osis: ['OSI-1'], promoCode: 'US-ONLY', countries: ['US'] }], 'DEFAULT'),
            );
            expect(result.promoMap['OSI-1']).to.be.undefined;
            expect(result.promoMap['*']).to.equal('DEFAULT');
        });

        it('parses offerLines from project folder and includes offerOverrides on activeProject', async () => {
            fetchStub = sinon.stub(globalThis, 'fetch');
            const project = makeProject({
                surfaces: ['acom'],
                geos: [],
                offers: ['OSI-1:BLACKFRIDAY:US,CA', ':GLOBAL:', 'OSI-2:SPECIAL:'],
            });
            const hydrated = makeHydratedProject();
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [project] }));
            fetchStub.withArgs(hydrateUrl('proj-1')).returns(createResponse(200, hydrated));

            const result = await promotionsTransformer.init(createContext());
            fetchStub.restore();
            clearPromoCache();

            expect(result.activeProject.offerOverrides).to.deep.equal([
                { osis: ['OSI-1'], promoCode: 'BLACKFRIDAY', countries: ['US', 'CA'] },
                { osis: [], promoCode: 'GLOBAL', countries: [] },
                { osis: ['OSI-2'], promoCode: 'SPECIAL', countries: [] },
            ]);
        });

        it('skips offerLines with missing promoCode', async () => {
            fetchStub = sinon.stub(globalThis, 'fetch');
            const project = makeProject({ surfaces: ['acom'], geos: [], offers: ['OSI-1::US', 'OSI-2:VALID:'] });
            const hydrated = makeHydratedProject();
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [project] }));
            fetchStub.withArgs(hydrateUrl('proj-1')).returns(createResponse(200, hydrated));

            const result = await promotionsTransformer.init(createContext());
            fetchStub.restore();
            clearPromoCache();

            expect(result.activeProject.offerOverrides).to.deep.equal([{ osis: ['OSI-2'], promoCode: 'VALID', countries: [] }]);
        });

        it('logs when wildcard override shadows project-level promoCode with a different value', async () => {
            const logStub = sinon.stub(console, 'log');
            const result = await promotionsTransformer.process(
                makeCtx(undefined, [{ osis: [], promoCode: 'OOPS', countries: [] }], 'PROJ'),
            );
            expect(result.promoMap).to.deep.equal({ '*': 'OOPS' });
            expect(
                logStub.calledWithMatch(sinon.match(/Project promoCode "PROJ" overridden by wildcard offer override "OOPS"/)),
            ).to.be.true;
            logStub.restore();
        });

        it('does not log when wildcard override equals project-level promoCode', async () => {
            const logStub = sinon.stub(console, 'log');
            const result = await promotionsTransformer.process(
                makeCtx(undefined, [{ osis: [], promoCode: 'SAME', countries: [] }], 'SAME'),
            );
            expect(result.promoMap).to.deep.equal({ '*': 'SAME' });
            expect(logStub.calledWithMatch(sinon.match(/overridden by wildcard/))).to.be.false;
            logStub.restore();
        });
    });

    describe('toInstant', () => {
        beforeEach(() => {
            fetchStub = sinon.stub(globalThis, 'fetch');
            fetchStub.returns(createResponse(404, null, 'Not Found'));
            installLocalStorageShim();
        });
        afterEach(() => {
            fetchStub.restore();
            clearPromoCache(true);
            clearPromoCache();
            delete globalThis.localStorage;
        });

        async function runInstant(value) {
            const project = makeProject({
                surfaces: ['acom'],
                geos: [],
                startDate: '2000-01-01T00:00:00Z',
                endDate: '2099-12-31T00:00:00Z',
            });
            const hydrated = makeHydratedProject();
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [project] }));
            fetchStub.withArgs(hydrateUrl('proj-1')).returns(createResponse(200, hydrated));
            return promotionsTransformer.init(createContext({ preview: true, instant: value }));
        }

        for (const garbage of ['lol', '2026-13-99', null]) {
            it(`falls back to Date.now() when instant is ${JSON.stringify(garbage)}`, async () => {
                const result = await runInstant(garbage);
                expect(result.activeProject).to.not.be.null;
            });
        }
    });
});
