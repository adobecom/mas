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

        it('returns no active projects when folder fetch fails', async () => {
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(404, null, 'Not Found'));
            const result = await promotionsTransformer.init(createContext());
            expect(result).to.deep.equal({ status: 200, activeProjects: [] });
        });

        it('returns no active projects when folder is empty', async () => {
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [] }));
            const result = await promotionsTransformer.init(createContext());
            expect(result).to.deep.equal({ status: 200, activeProjects: [] });
        });

        it('returns no active projects when project has no promotion tag', async () => {
            const project = makeProject({ tags: ['some-other-tag'] });
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [project] }));
            const result = await promotionsTransformer.init(createContext());
            expect(result).to.deep.equal({ status: 200, activeProjects: [] });
        });

        it('returns no active projects when no project matches surface', async () => {
            const project = makeProject({ surfaces: ['express'] });
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [project] }));
            const result = await promotionsTransformer.init(createContext({ surface: 'acom' }));
            expect(result).to.deep.equal({ status: 200, activeProjects: [] });
        });

        it('returns no active projects when project end date has passed', async () => {
            const project = makeProject({ surfaces: ['acom'], endDate: EXPIRED_END });
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [project] }));
            const result = await promotionsTransformer.init(createContext());
            expect(result).to.deep.equal({ status: 200, activeProjects: [] });
        });

        it('returns no active projects when project start date is in the future', async () => {
            const project = makeProject({
                surfaces: ['acom'],
                geos: [],
                startDate: '2099-01-01T00:00:00Z',
                endDate: '2099-12-31T00:00:00Z',
            });
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [project] }));
            const result = await promotionsTransformer.init(createContext());
            expect(result).to.deep.equal({ status: 200, activeProjects: [] });
        });

        it('returns no active projects when geo does not match', async () => {
            const project = makeProject({ surfaces: ['acom'], geos: ['/content/cq:tags/mas/locale/fr_FR'] });
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [project] }));
            const result = await promotionsTransformer.init(createContext({ regionLocale: 'en_US' }));
            expect(result).to.deep.equal({ status: 200, activeProjects: [] });
        });

        it('selects active project matching surface, geo and date range', async () => {
            const project = makeProject({ id: 'proj-1', surfaces: ['acom'], geos: ['/content/cq:tags/mas/locale/en_US'] });
            const hydrated = makeHydratedProject({ promoCode: 'SAVE20' });
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [project] }));
            fetchStub.withArgs(hydrateUrl('proj-1')).returns(createResponse(200, hydrated));

            const result = await promotionsTransformer.init(createContext({ regionLocale: 'en_US' }));
            expect(result.status).to.equal(200);
            expect(result.activeProjects).to.have.length(1);
            expect(result.activeProjects[0].id).to.equal('proj-1');
            expect(result.activeProjects[0].fragmentPaths).to.have.length(1);
            expect(result.activeProjects[0].promoCode).to.equal('SAVE20');
        });

        it('ignores instant when not in preview mode', async () => {
            const project = makeProject({ surfaces: ['acom'], geos: [], startDate: START, endDate: EXPIRED_END });
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [project] }));

            // EXPIRED_END is in the past — without preview, instant is ignored and Date.now() is used
            const result = await promotionsTransformer.init(createContext({ instant: PREVIEW_INSTANT }));
            expect(result).to.deep.equal({ status: 200, activeProjects: [] });
        });

        it('matches project by country when locale does not match geos', async () => {
            const project = makeProject({ surfaces: ['acom'], geos: ['/content/cq:tags/mas/country/CH'] });
            const hydrated = makeHydratedProject();
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [project] }));
            fetchStub.withArgs(hydrateUrl('proj-1')).returns(createResponse(200, hydrated));

            const result = await promotionsTransformer.init(createContext({ locale: 'fr_FR', country: 'CH' }));
            expect(result.activeProjects).to.have.length(1);
        });

        it('matches project by regionLocale resolved from defaultLanguage promise', async () => {
            const project = makeProject({ surfaces: ['acom'], geos: ['/content/cq:tags/mas/locale/fr_CH'] });
            const hydrated = makeHydratedProject();
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [project] }));
            fetchStub.withArgs(hydrateUrl('proj-1')).returns(createResponse(200, hydrated));

            // regionLocale must come from the defaultLanguage promise, not the init-phase context
            const result = await promotionsTransformer.init(
                createContext({
                    locale: 'fr_FR',
                    country: 'CH',
                    promises: {
                        defaultLanguage: Promise.resolve({
                            status: 200,
                            defaultLocale: 'fr_FR',
                            regionLocale: 'fr_CH',
                            surface: 'acom',
                        }),
                    },
                }),
            );
            expect(result.activeProjects).to.have.length(1);
        });

        it('applies en_GR project when locale=en_US and country=GR (regionLocale resolved by defaultLanguage)', async () => {
            const project = makeProject({ surfaces: ['acom'], geos: ['/content/cq:tags/mas/locale/en_GR'] });
            const hydrated = makeHydratedProject();
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [project] }));
            fetchStub.withArgs(hydrateUrl('proj-1')).returns(createResponse(200, hydrated));

            const result = await promotionsTransformer.init(
                createContext({
                    locale: 'en_US',
                    country: 'GR',
                    promises: {
                        defaultLanguage: Promise.resolve({
                            status: 200,
                            defaultLocale: 'en_US',
                            regionLocale: 'en_GR',
                            surface: 'acom',
                        }),
                    },
                }),
            );
            expect(result.activeProjects).to.have.length(1);
        });

        it('does not apply en_US project when locale=en_US and country=GR', async () => {
            const project = makeProject({ surfaces: ['acom'], geos: ['/content/cq:tags/mas/locale/en_US'] });
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [project] }));

            const result = await promotionsTransformer.init(
                createContext({
                    locale: 'en_US',
                    country: 'GR',
                    promises: {
                        defaultLanguage: Promise.resolve({
                            status: 200,
                            defaultLocale: 'en_US',
                            regionLocale: 'en_GR',
                            surface: 'acom',
                        }),
                    },
                }),
            );
            expect(result.activeProjects).to.have.length(0);
        });

        it('returns all matching projects in folder order', async () => {
            const p1 = makeProject({
                id: 'proj-1',
                path: '/content/dam/mas/promotions/p1',
                surfaces: ['acom'],
                geos: ['/content/cq:tags/mas/locale/en_US'],
                tags: ['mas:promotion/p1'],
            });
            const p2 = makeProject({
                id: 'proj-2',
                path: '/content/dam/mas/promotions/p2',
                surfaces: ['acom'],
                geos: ['/content/cq:tags/mas/locale/en_US'],
                tags: ['mas:promotion/p2'],
            });
            const hydrated1 = makeHydratedProject({ fragmentId: 'f1', fragmentPath: '/content/dam/mas/acom/en_US/offers/a' });
            const hydrated2 = makeHydratedProject({ fragmentId: 'f2', fragmentPath: '/content/dam/mas/acom/en_US/offers/b' });
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [p1, p2] }));
            fetchStub.withArgs(hydrateUrl('proj-1')).returns(createResponse(200, hydrated1));
            fetchStub.withArgs(hydrateUrl('proj-2')).returns(createResponse(200, hydrated2));

            const result = await promotionsTransformer.init(createContext({ regionLocale: 'en_US' }));
            expect(result.activeProjects).to.have.length(2);
            expect(result.activeProjects.map((p) => p.id)).to.deep.equal(['proj-1', 'proj-2']);
            expect(result.activeProjects[0].fragmentPaths).to.deep.equal(['offers/a']);
            expect(result.activeProjects[1].fragmentPaths).to.deep.equal(['offers/b']);
        });

        it('skips a project whose hydration fails but keeps the others', async () => {
            const p1 = makeProject({
                id: 'proj-1',
                surfaces: ['acom'],
                geos: ['/content/cq:tags/mas/locale/en_US'],
                tags: ['mas:promotion/p1'],
            });
            const p2 = makeProject({
                id: 'proj-2',
                path: '/content/dam/mas/promotions/p2',
                surfaces: ['acom'],
                geos: ['/content/cq:tags/mas/locale/en_US'],
                tags: ['mas:promotion/p2'],
            });
            const hydrated2 = makeHydratedProject({ fragmentId: 'f2', fragmentPath: '/content/dam/mas/acom/en_US/offers/b' });
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [p1, p2] }));
            fetchStub.withArgs(hydrateUrl('proj-1')).returns(createResponse(500, null, 'Error'));
            fetchStub.withArgs(hydrateUrl('proj-2')).returns(createResponse(200, hydrated2));

            const result = await promotionsTransformer.init(createContext({ regionLocale: 'en_US' }));
            expect(result.activeProjects).to.have.length(1);
            expect(result.activeProjects[0].id).to.equal('proj-2');
        });

        it('returns no active projects when hydration fails', async () => {
            const project = makeProject({ surfaces: ['acom'], geos: ['/content/cq:tags/mas/locale/en_US'] });
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [project] }));
            fetchStub.withArgs(hydrateUrl('proj-1')).returns(createResponse(500, null, 'Error'));

            const result = await promotionsTransformer.init(createContext({ regionLocale: 'en_US' }));
            expect(result).to.deep.equal({ status: 200, activeProjects: [] });
        });

        it('handles folder response without items field', async () => {
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, {}));
            const result = await promotionsTransformer.init(createContext());
            expect(result).to.deep.equal({ status: 200, activeProjects: [] });
        });

        it('handles project items with missing fields', async () => {
            // Project with no fields — should not match any surface
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [{ id: 'proj-no-fields' }] }));
            const result = await promotionsTransformer.init(createContext());
            expect(result).to.deep.equal({ status: 200, activeProjects: [] });
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
            expect(result.activeProjects).to.have.length(1);
        });

        it('handles project with null startDate and endDate', async () => {
            const project = makeProject({ surfaces: ['acom'], geos: [], startDate: null, endDate: null });
            const hydrated = makeHydratedProject();
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [project] }));
            fetchStub.withArgs(hydrateUrl('proj-1')).returns(createResponse(200, hydrated));

            const result = await promotionsTransformer.init(createContext());
            expect(result.activeProjects).to.have.length(1);
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
            expect(result.activeProjects[0].fragmentPaths).to.have.length(2);
            expect(result.activeProjects[0].fragmentPaths).to.include('offers/offer-1');
            expect(result.activeProjects[0].fragmentPaths).to.include('offers/offer-3');
        });

        it('returns no active projects when hydrated project has no fragments', async () => {
            const hydrated = { fields: {}, references: {} };
            const project = makeProject({ surfaces: ['acom'], geos: [] });
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [project] }));
            fetchStub.withArgs(hydrateUrl('proj-1')).returns(createResponse(200, hydrated));

            const result = await promotionsTransformer.init(createContext());
            expect(result).to.deep.equal({ status: 200, activeProjects: [] });
        });

        it('returns no active projects when hydrated project has empty fragments list', async () => {
            const hydrated = { fields: { fragments: [] } };
            const project = makeProject({ surfaces: ['acom'], geos: [] });
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [project] }));
            fetchStub.withArgs(hydrateUrl('proj-1')).returns(createResponse(200, hydrated));

            const result = await promotionsTransformer.init(createContext());
            expect(result).to.deep.equal({ status: 200, activeProjects: [] });
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

        it('falls back to locale when defaultLanguage resolves without regionLocale', async () => {
            const project = makeProject({ surfaces: ['acom'], geos: [] });
            const hydrated = makeHydratedProject();
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [project] }));
            fetchStub.withArgs(hydrateUrl('proj-1')).returns(createResponse(200, hydrated));

            const result = await promotionsTransformer.init(
                createContext({
                    promises: {
                        defaultLanguage: Promise.resolve({ status: 200, defaultLocale: 'en_US' }),
                    },
                }),
            );
            expect(result.activeProjects).to.have.length(1);
        });

        it('returns no active projects when defaultLanguage resolves without defaultLocale', async () => {
            const project = makeProject({ surfaces: ['acom'], geos: [] });
            const hydrated = makeHydratedProject();
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [project] }));
            fetchStub.withArgs(hydrateUrl('proj-1')).returns(createResponse(200, hydrated));

            const result = await promotionsTransformer.init(
                createContext({ promises: { defaultLanguage: Promise.resolve({ status: 200 }) } }),
            );
            expect(result).to.deep.equal({ status: 200, activeProjects: [] });
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
            expect(result.activeProjects).to.have.length(1);
            expect(result.activeProjects[0].defaultVariations).to.deep.equal({});
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
            expect(result.activeProjects).to.have.length(1);
            expect(result.activeProjects[0].id).to.equal('proj-1');
        });

        it('supports instant as an ISO string in preview mode', async () => {
            const project = makeProject({ surfaces: ['acom'], geos: [], startDate: START, endDate: EXPIRED_END });
            const hydrated = makeHydratedProject();
            fetchStub.withArgs(FOLDER_URL).returns(createResponse(200, { items: [project] }));
            fetchStub.withArgs(hydrateUrl('proj-1')).returns(createResponse(200, hydrated));

            const result = await promotionsTransformer.init(createContext({ preview: true, instant: '2020-02-01T00:00:00Z' }));
            expect(result.activeProjects).to.have.length(1);
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
            expect(result.activeProjects).to.have.length(1);

            clearPromoCache(true);
            expect(storage['promotions']).to.be.undefined;
        });
    });

    describe('process', () => {
        it('returns no promoProjects when promises.promotions is absent', async () => {
            const context = createContext({});
            const result = await promotionsTransformer.process(context);
            expect(result.status).to.equal(200);
            expect(result.promoProjects).to.be.undefined;
        });

        it('returns no promoProjects when activeProjects is empty', async () => {
            const context = createContext({
                promises: { promotions: Promise.resolve({ status: 200, activeProjects: [] }) },
            });
            const result = await promotionsTransformer.process(context);
            expect(result.status).to.equal(200);
            expect(result.promoProjects).to.be.undefined;
        });

        it('builds per-project promoMap and fragmentPaths Set', async () => {
            const context = createContext({
                promises: {
                    promotions: Promise.resolve({
                        status: 200,
                        activeProjects: [
                            {
                                id: 'proj-1',
                                fragmentPaths: ['offers/offer-1', 'offers/offer-2'],
                                offerOverrides: [],
                                promoCode: 'SUMMER25',
                            },
                        ],
                    }),
                },
            });
            const result = await promotionsTransformer.process(context);
            expect(result.promoProjects).to.have.length(1);
            expect(result.promoProjects[0].promoMap).to.deep.equal({ '*': 'SUMMER25' });
            expect([...result.promoProjects[0].fragmentPaths]).to.have.members(['offers/offer-1', 'offers/offer-2']);
        });

        it('preserves project order in promoProjects', async () => {
            const context = createContext({
                promises: {
                    promotions: Promise.resolve({
                        status: 200,
                        activeProjects: [
                            { id: 'proj-1', fragmentPaths: ['a'], offerOverrides: [], promoCode: 'A' },
                            { id: 'proj-2', fragmentPaths: ['b'], offerOverrides: [], promoCode: 'B' },
                        ],
                    }),
                },
            });
            const result = await promotionsTransformer.process(context);
            expect(result.promoProjects.map((p) => p.project.id)).to.deep.equal(['proj-1', 'proj-2']);
            expect(result.promoProjects[0].promoMap).to.deep.equal({ '*': 'A' });
            expect(result.promoProjects[1].promoMap).to.deep.equal({ '*': 'B' });
        });

        it('uses project-level promoCode as wildcard in promoMap', async () => {
            const context = createContext({
                promises: {
                    promotions: Promise.resolve({
                        status: 200,
                        activeProjects: [
                            {
                                id: 'proj-1',
                                fragmentPaths: [],
                                offerOverrides: [],
                                promoCode: 'NICOPROMO',
                            },
                        ],
                    }),
                },
            });
            const result = await promotionsTransformer.process(context);
            expect(result.promoProjects[0].promoMap).to.deep.equal({ '*': 'NICOPROMO' });
        });
    });

    describe('promoMap building', () => {
        function makeCtx(country, offerOverrides, promoCode) {
            return createContext({
                country,
                promises: {
                    promotions: Promise.resolve({
                        status: 200,
                        activeProjects: [{ id: 'proj-1', fragmentPaths: [], offerOverrides, promoCode }],
                    }),
                },
            });
        }

        function firstPromoMap(result) {
            return result.promoProjects[0].promoMap;
        }

        it('maps specific OSI override when OSI and country match', async () => {
            const result = await promotionsTransformer.process(
                makeCtx('US', [{ osis: ['OSI-1'], promoCode: 'OVERRIDE', countries: ['US'] }]),
            );
            expect(firstPromoMap(result)).to.deep.equal({ 'OSI-1': 'OVERRIDE' });
        });

        it('maps specific OSI override when countries is empty (any country)', async () => {
            const result = await promotionsTransformer.process(
                makeCtx('DE', [{ osis: ['OSI-1'], promoCode: 'GLOBAL', countries: [] }]),
            );
            expect(firstPromoMap(result)).to.deep.equal({ 'OSI-1': 'GLOBAL' });
        });

        it('maps wildcard when osis is empty and country matches', async () => {
            const result = await promotionsTransformer.process(
                makeCtx('FR', [{ osis: [], promoCode: 'FRANCE', countries: ['FR'] }]),
            );
            expect(firstPromoMap(result)).to.deep.equal({ '*': 'FRANCE' });
        });

        it('maps wildcard when both osis and countries are empty', async () => {
            const result = await promotionsTransformer.process(
                makeCtx(undefined, [{ osis: [], promoCode: 'UNIVERSAL', countries: [] }]),
            );
            expect(firstPromoMap(result)).to.deep.equal({ '*': 'UNIVERSAL' });
        });

        it('skips override when country does not match', async () => {
            const result = await promotionsTransformer.process(
                makeCtx('CA', [{ osis: ['OSI-1'], promoCode: 'NOPE', countries: ['US'] }]),
            );
            expect(firstPromoMap(result)).to.deep.equal({});
        });

        it('override takes priority over project-level promoCode for same OSI', async () => {
            const result = await promotionsTransformer.process(
                makeCtx('US', [{ osis: ['OSI-1'], promoCode: 'OVERRIDE', countries: ['US'] }], 'DEFAULT'),
            );
            const promoMap = firstPromoMap(result);
            expect(promoMap['OSI-1']).to.equal('OVERRIDE');
            expect(promoMap['*']).to.equal('DEFAULT');
        });

        it('falls back to project-level promoCode when override country does not match', async () => {
            const result = await promotionsTransformer.process(
                makeCtx('CA', [{ osis: ['OSI-1'], promoCode: 'US-ONLY', countries: ['US'] }], 'DEFAULT'),
            );
            const promoMap = firstPromoMap(result);
            expect(promoMap['OSI-1']).to.be.undefined;
            expect(promoMap['*']).to.equal('DEFAULT');
        });

        it('parses offerLines from project folder and includes offerOverrides on activeProjects', async () => {
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

            expect(result.activeProjects[0].offerOverrides).to.deep.equal([
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

            expect(result.activeProjects[0].offerOverrides).to.deep.equal([
                { osis: ['OSI-2'], promoCode: 'VALID', countries: [] },
            ]);
        });

        it('logs when wildcard override shadows project-level promoCode with a different value', async () => {
            const logStub = sinon.stub(console, 'log');
            const result = await promotionsTransformer.process(
                makeCtx(undefined, [{ osis: [], promoCode: 'OOPS', countries: [] }], 'PROJ'),
            );
            expect(firstPromoMap(result)).to.deep.equal({ '*': 'OOPS' });
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
            expect(firstPromoMap(result)).to.deep.equal({ '*': 'SAME' });
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
                expect(result.activeProjects).to.have.length(1);
            });
        }
    });
});
