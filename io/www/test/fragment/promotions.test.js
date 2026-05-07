import { expect } from 'chai';
import sinon from 'sinon';
import { transformer as promotionsTransformer, clearPromoCache } from '../../src/fragment/transformers/promotions.js';
import { createResponse } from './mocks/MockFetch.js';

const FOLDER_URL = 'https://odin.adobe.com/adobe/contentFragments?path=/content/dam/mas/promotions';
const hydrateUrl = (id) => `https://odin.adobe.com/adobe/contentFragments/${id}?references=all-hydrated`;

// Fixed reference instant: 2025-06-15 12:00 UTC
const NOW = new Date('2025-06-15T12:00:00Z').getTime();
const START = '2025-01-01T00:00:00Z';
const END = '2025-12-31T23:59:59Z';
const EXPIRED_END = '2025-03-01T00:00:00Z';

let fetchStub;

function createContext(overrides = {}) {
    return {
        surface: 'acom',
        locale: 'en_US',
        country: undefined,
        regionLocale: undefined,
        preview: undefined,
        'mas.instant': NOW,
        networkConfig: { retries: 1, retryDelay: 1, fetchTimeout: 500 },
        promises: {},
        ...overrides,
    };
}

const PROMO_TAG = '/content/cq:tags/mas/promotion/black-friday';

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

function makeHydratedProject({ fragmentId = 'frag-1', osi = 'OSI-123', promoCode = 'PROMO10', variations = [] } = {}) {
    return {
        fields: { fragments: [fragmentId], variations },
        references: {
            [fragmentId]: {
                type: 'content-fragment',
                value: { id: fragmentId, fields: { osi, promoCode } },
            },
        },
    };
}

export { makeProject, makeHydratedProject, FOLDER_URL, hydrateUrl };

describe('promotions', () => {
    describe('init', () => {
        beforeEach(() => {
            fetchStub = sinon.stub(globalThis, 'fetch');
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
            const project = makeProject({ surfaces: ['acom'], geos: ['/content/cq:tags/mas/geo/fr_FR'] });
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [project] }));
            const result = await promotionsTransformer.init(createContext({ regionLocale: 'en_US' }));
            expect(result).to.deep.equal({ status: 200, activeProject: null });
        });

        it('selects active project matching surface, geo and date range', async () => {
            const project = makeProject({ id: 'proj-1', surfaces: ['acom'], geos: ['/content/cq:tags/mas/geo/en_US'] });
            const hydrated = makeHydratedProject({ osi: 'OSI-123', promoCode: 'SAVE20' });
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [project] }));
            fetchStub.withArgs(hydrateUrl('proj-1')).returns(createResponse(200, hydrated));

            const result = await promotionsTransformer.init(createContext({ regionLocale: 'en_US' }));
            expect(result.status).to.equal(200);
            expect(result.activeProject.id).to.equal('proj-1');
            expect(result.activeProject.fragments).to.have.length(1);
            expect(result.activeProject.fragments[0]).to.deep.include({ osi: 'OSI-123', promoCode: 'SAVE20' });
        });

        it('supports mas.instant for time-travel testing', async () => {
            const project = makeProject({ surfaces: ['acom'], geos: [], startDate: START, endDate: EXPIRED_END });
            const hydrated = makeHydratedProject();
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [project] }));
            fetchStub.withArgs(hydrateUrl('proj-1')).returns(createResponse(200, hydrated));

            // Travel back to within the expired window
            const pastInstant = new Date('2025-02-01T00:00:00Z').getTime();
            const result = await promotionsTransformer.init(createContext({ 'mas.instant': pastInstant }));
            expect(result.activeProject).to.not.be.null;
            expect(result.activeProject.id).to.equal('proj-1');
        });

        it('matches project by country when locale does not match geos', async () => {
            const project = makeProject({ surfaces: ['acom'], geos: ['/content/cq:tags/mas/geo/CH'] });
            const hydrated = makeHydratedProject();
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [project] }));
            fetchStub.withArgs(hydrateUrl('proj-1')).returns(createResponse(200, hydrated));

            const result = await promotionsTransformer.init(createContext({ locale: 'fr_FR', country: 'CH' }));
            expect(result.activeProject).to.not.be.null;
        });

        it('matches project by regionLocale', async () => {
            const project = makeProject({ surfaces: ['acom'], geos: ['/content/cq:tags/mas/geo/fr_CH'] });
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
            const p1 = makeProject({ id: 'proj-1', surfaces: ['acom'], geos: ['/content/cq:tags/mas/geo/en_US'] });
            const p2 = makeProject({ id: 'proj-2', surfaces: ['acom'], geos: ['/content/cq:tags/mas/geo/en_US'] });
            const hydrated = makeHydratedProject();
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [p1, p2] }));
            fetchStub.withArgs(hydrateUrl('proj-1')).returns(createResponse(200, hydrated));

            const result = await promotionsTransformer.init(createContext({ regionLocale: 'en_US' }));
            expect(result.activeProject.id).to.equal('proj-1');
            expect(logStub.calledWithMatch(sinon.match(/Multiple promotion projects matched/))).to.be.true;
            logStub.restore();
        });

        it('returns no active project when hydration fails', async () => {
            const project = makeProject({ surfaces: ['acom'], geos: ['/content/cq:tags/mas/geo/en_US'] });
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

        it('uses Date.now() when mas.instant is not provided', async () => {
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
            delete ctx['mas.instant']; // let toInstant fall back to Date.now()
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

        it('skips offer refs missing from references or with no osi/promoCode', async () => {
            const hydrated = {
                fields: { fragments: ['valid-ref', 'missing-ref', 'no-osi-ref', 'no-fields-ref'] },
                references: {
                    'valid-ref': { type: 'content-fragment', value: { id: 'v', fields: { osi: 'OSI-1', promoCode: 'P1' } } },
                    // 'missing-ref' not present — ref will be null
                    'no-osi-ref': { type: 'content-fragment', value: { id: 'n', fields: { promoCode: 'P2' } } },
                    'no-fields-ref': { type: 'content-fragment', value: { id: 'nf' } }, // no fields property
                },
            };
            const project = makeProject({ surfaces: ['acom'], geos: [] });
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [project] }));
            fetchStub.withArgs(hydrateUrl('proj-1')).returns(createResponse(200, hydrated));

            const result = await promotionsTransformer.init(createContext());
            expect(result.activeProject.fragments).to.have.length(1);
            expect(result.activeProject.fragments[0].osi).to.equal('OSI-1');
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

        it('supports mas.instant as an ISO string for time-travel testing', async () => {
            const project = makeProject({ surfaces: ['acom'], geos: [], startDate: START, endDate: EXPIRED_END });
            const hydrated = makeHydratedProject();
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [project] }));
            fetchStub.withArgs(hydrateUrl('proj-1')).returns(createResponse(200, hydrated));

            const result = await promotionsTransformer.init(createContext({ 'mas.instant': '2025-02-01T00:00:00Z' }));
            expect(result.activeProject).to.not.be.null;
        });

        it('uses cache on second call without re-fetching folder', async () => {
            const project = makeProject({ surfaces: ['acom'], geos: ['/content/cq:tags/mas/geo/en_US'] });
            const hydrated = makeHydratedProject();
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [project] }));
            fetchStub.withArgs(hydrateUrl('proj-1')).returns(createResponse(200, hydrated));

            await promotionsTransformer.init(createContext({ regionLocale: 'en_US' }));
            await promotionsTransformer.init(createContext({ regionLocale: 'en_US' }));

            expect(fetchStub.withArgs(FOLDER_URL).callCount).to.equal(1);
        });

        it('uses localStorage cache in preview mode', async () => {
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

            const project = makeProject({ surfaces: ['acom'], geos: ['/content/cq:tags/mas/geo/en_US'] });
            const hydrated = makeHydratedProject();
            const previewCtx = createContext({
                regionLocale: 'en_US',
                preview: { url: 'https://odin.adobe.com/adobe/contentFragments' },
            });
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [project] }));
            fetchStub.withArgs(hydrateUrl('proj-1')).returns(createResponse(200, hydrated));

            await promotionsTransformer.init(previewCtx);
            expect(storage['promotions']).to.exist;

            // Second call should read from localStorage
            const result = await promotionsTransformer.init(previewCtx);
            expect(fetchStub.withArgs(FOLDER_URL).callCount).to.equal(1);
            expect(result.activeProject).to.not.be.null;

            clearPromoCache(true);
            expect(storage['promotions']).to.be.undefined;

            delete globalThis.localStorage;
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

        it('builds promoMap and promoFragmentIds from active project fragments', async () => {
            const context = createContext({
                promises: {
                    promotions: Promise.resolve({
                        status: 200,
                        activeProject: {
                            fragments: [
                                { id: 'f1', osi: 'OSI-123', promoCode: 'SUMMER25' },
                                { id: 'f2', osi: 'OSI-456', promoCode: 'FALL30' },
                            ],
                            offerOverrides: [],
                        },
                    }),
                },
            });
            const result = await promotionsTransformer.process(context);
            expect(result.promoMap).to.deep.equal({ 'OSI-123': 'SUMMER25', 'OSI-456': 'FALL30' });
            expect([...result.promoFragmentIds]).to.have.members(['f1', 'f2']);
        });
    });

    describe('promoMap building', () => {
        function makeCtx(country, offerOverrides, refFragments = []) {
            return createContext({
                country,
                promises: {
                    promotions: Promise.resolve({
                        status: 200,
                        activeProject: { fragments: refFragments, offerOverrides },
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

        it('override takes priority over fragment entry for same OSI', async () => {
            const result = await promotionsTransformer.process(
                makeCtx(
                    'US',
                    [{ osis: ['OSI-1'], promoCode: 'OVERRIDE', countries: ['US'] }],
                    [{ osi: 'OSI-1', promoCode: 'REF-PROMO' }],
                ),
            );
            expect(result.promoMap['OSI-1']).to.equal('OVERRIDE');
        });

        it('preserves fragment entry when override country does not match', async () => {
            const result = await promotionsTransformer.process(
                makeCtx(
                    'CA',
                    [{ osis: ['OSI-1'], promoCode: 'US-ONLY', countries: ['US'] }],
                    [{ osi: 'OSI-1', promoCode: 'REF-PROMO' }],
                ),
            );
            expect(result.promoMap['OSI-1']).to.equal('REF-PROMO');
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
    });
});
