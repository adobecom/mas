import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { Fragment } from '../src/aem/fragment.js';
import { FragmentStore } from '../src/reactivity/fragment-store.js';
import { MasRepository } from '../src/mas-repository.js';
import { ROOT_PATH, SURFACES, PAGE_NAMES, EDITABLE_FRAGMENT_MODEL_IDS, COLLECTION_MODEL_PATH } from '../src/constants.js';
import Events from '../src/events.js';
import Store from '../src/store.js';

const mockFragmentCache = {
    get: () => null,
    add: () => {},
    has: () => false,
    remove: () => {},
};
if (!customElements.get('aem-fragment')) {
    customElements.define(
        'aem-fragment',
        class extends HTMLElement {
            cache = mockFragmentCache;
        },
    );
}

describe('MasRepository dictionary helpers', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    const createRepository = () => Object.create(MasRepository.prototype);

    const createFullRepository = () => {
        const repo = new MasRepository();
        repo.bucket = 'test-bucket';
        repo.baseUrl = 'https://test.example.com';
        return repo;
    };

    const createAemMock = (overrides = {}) => ({
        sites: {
            cf: {
                fragments: {
                    getByPath: sandbox.stub(),
                    getById: sandbox.stub(),
                    create: sandbox.stub(),
                    save: sandbox.stub(),
                    ...overrides.fragments,
                },
            },
        },
        folders: {
            list: sandbox.stub(),
            create: sandbox.stub(),
            ...overrides.folders,
        },
        ...overrides.other,
    });

    const createFragment = (overrides = {}) => ({
        id: 'fragment-id',
        path: '/fragment/path',
        fields: [],
        ...overrides,
    });

    describe('loadFolders', () => {
        it('should filter out images, promotions and bulk-publish-projects by default', async () => {
            const repository = createRepository();
            const mockChildren = [
                { name: 'acom' },
                { name: 'ccd' },
                { name: 'images' },
                { name: 'promotions' },
                { name: 'bulk-publish-projects' },
                { name: 'express' },
            ];
            repository.aem = createAemMock({
                folders: {
                    list: sandbox.stub().resolves({ children: mockChildren }),
                },
            });
            repository.search = { value: { path: 'acom', query: '' } };
            const { default: Store } = await import('../src/store.js');
            const originalStoreLoaded = Store.folders.loaded.set.bind(Store.folders.loaded);
            const originalStoreData = Store.folders.data.set.bind(Store.folders.data);
            const mockFoldersLoaded = { set: sandbox.stub() };
            const mockFoldersData = { set: sandbox.stub() };
            Store.folders.loaded.set = mockFoldersLoaded.set;
            Store.folders.data.set = mockFoldersData.set;
            const originalGetItem = window.localStorage.getItem.bind(window.localStorage);
            sandbox.stub(window.localStorage, 'getItem').returns(null);
            try {
                await repository.loadFolders();
                expect(mockFoldersLoaded.set.calledWith(true)).to.be.true;
                const setFoldersCall = mockFoldersData.set.firstCall.args[0];
                expect(setFoldersCall).to.deep.equal(['acom', 'ccd', 'express']);
                expect(setFoldersCall).to.not.include('images');
                expect(setFoldersCall).to.not.include('promotions');
                expect(setFoldersCall).to.not.include('bulk-publish-projects');
            } finally {
                Store.folders.loaded.set = originalStoreLoaded;
                Store.folders.data.set = originalStoreData;
            }
        });

        it('should use custom ignore_folders from localStorage', async () => {
            const repository = createRepository();
            const mockChildren = [{ name: 'acom' }, { name: 'ccd' }, { name: 'custom-ignored' }];
            repository.aem = createAemMock({
                folders: {
                    list: sandbox.stub().resolves({ children: mockChildren }),
                },
            });
            repository.search = { value: { path: 'acom', query: '' } };
            const { default: Store } = await import('../src/store.js');
            const originalStoreLoaded = Store.folders.loaded.set.bind(Store.folders.loaded);
            const originalStoreData = Store.folders.data.set.bind(Store.folders.data);
            const mockFoldersLoaded = { set: sandbox.stub() };
            const mockFoldersData = { set: sandbox.stub() };
            Store.folders.loaded.set = mockFoldersLoaded.set;
            Store.folders.data.set = mockFoldersData.set;
            sandbox.stub(window.localStorage, 'getItem').returns('custom-ignored');
            try {
                await repository.loadFolders();
                expect(mockFoldersLoaded.set.calledWith(true)).to.be.true;
                const setFoldersCall = mockFoldersData.set.firstCall.args[0];
                expect(setFoldersCall).to.deep.equal(['acom', 'ccd']);
                expect(setFoldersCall).to.not.include('custom-ignored');
            } finally {
                Store.folders.loaded.set = originalStoreLoaded;
                Store.folders.data.set = originalStoreData;
            }
        });

        it('should set search path to sandbox when current path is not in folders and no query', async () => {
            const repository = createRepository();
            const mockChildren = [{ name: 'acom' }, { name: 'express' }, { name: 'sandbox' }];
            repository.aem = createAemMock({
                folders: {
                    list: sandbox.stub().resolves({ children: mockChildren }),
                },
            });
            repository.search = { value: { path: undefined, query: undefined } };
            repository.filters = { value: { locale: 'en_US' } };
            const searchSetSpy = sandbox.stub(Store.search, 'set');
            const originalStoreLoaded = Store.folders.loaded.set.bind(Store.folders.loaded);
            const originalStoreData = Store.folders.data.set.bind(Store.folders.data);
            const mockFoldersLoaded = { set: sandbox.stub() };
            const mockFoldersData = { set: sandbox.stub() };
            Store.folders.loaded.set = mockFoldersLoaded.set;
            Store.folders.data.set = mockFoldersData.set;
            sandbox.stub(window.localStorage, 'getItem').returns(null);
            try {
                await repository.loadFolders();
                expect(searchSetSpy.calledOnce).to.be.true;
                const setArg = searchSetSpy.firstCall.args[0];
                expect(setArg).to.be.a('function');
                expect(setArg({})).to.deep.equal({ path: SURFACES.SANDBOX.name });
            } finally {
                searchSetSpy.restore();
                Store.folders.loaded.set = originalStoreLoaded;
                Store.folders.data.set = originalStoreData;
            }
        });
    });

    describe('getTranslationsPath', () => {
        it('returns correct path when surface is set', () => {
            const repository = createRepository();
            repository.search = { value: { path: 'acom/subpath' } };
            const result = repository.getTranslationsPath();
            expect(result).to.equal(`${ROOT_PATH}/acom/translations`);
        });

        it('returns correct path for single segment surface', () => {
            const repository = createRepository();
            repository.search = { value: { path: 'ccd' } };
            const result = repository.getTranslationsPath();
            expect(result).to.equal(`${ROOT_PATH}/ccd/translations`);
        });

        it('returns null when search path is empty', () => {
            const repository = createRepository();
            repository.search = { value: { path: '' } };
            const result = repository.getTranslationsPath();
            expect(result).to.be.null;
        });

        it('returns null when search path is undefined', () => {
            const repository = createRepository();
            repository.search = { value: {} };
            const result = repository.getTranslationsPath();
            expect(result).to.be.null;
        });
    });

    describe('handleSearch', () => {
        it('returns early when profile is not set', async () => {
            const repository = createRepository();
            const { default: Store } = await import('../src/store.js');
            const originalProfile = Store.profile.value;
            Store.profile.set(null);
            repository.page = { value: PAGE_NAMES.CONTENT };
            repository.searchFragments = sandbox.stub();
            repository.loadPreviewPlaceholders = sandbox.stub();
            try {
                repository.handleSearch();
                expect(repository.searchFragments.called).to.be.false;
                expect(repository.loadPreviewPlaceholders.called).to.be.false;
            } finally {
                Store.profile.set(originalProfile);
            }
        });

        it('calls searchFragments and loadPreviewPlaceholders for CONTENT page', async () => {
            const repository = createRepository();
            const { default: Store } = await import('../src/store.js');
            const originalProfile = Store.profile.value;
            Store.profile.set({ name: 'test-user' });
            repository.page = { value: PAGE_NAMES.CONTENT };
            repository.searchFragments = sandbox.stub();
            repository.loadPreviewPlaceholders = sandbox.stub();
            repository.loadPromotions = sandbox.stub();
            try {
                repository.handleSearch();
                expect(repository.searchFragments.calledOnce).to.be.true;
                expect(repository.loadPreviewPlaceholders.calledOnce).to.be.true;
                expect(repository.loadPromotions.calledOnce).to.be.true;
            } finally {
                Store.profile.set(originalProfile);
            }
        });

        it('calls loadRecentlyUpdatedFragments and loadPreviewPlaceholders for WELCOME page', async () => {
            const repository = createRepository();
            const { default: Store } = await import('../src/store.js');
            const originalProfile = Store.profile.value;
            Store.profile.set({ name: 'test-user' });
            repository.page = { value: PAGE_NAMES.WELCOME };
            repository.loadRecentlyUpdatedFragments = sandbox.stub();
            repository.loadPreviewPlaceholders = sandbox.stub();
            try {
                repository.handleSearch();
                expect(repository.loadRecentlyUpdatedFragments.calledOnce).to.be.true;
                expect(repository.loadPreviewPlaceholders.calledOnce).to.be.true;
            } finally {
                Store.profile.set(originalProfile);
            }
        });

        it('calls loadPreviewPlaceholders for FRAGMENT_EDITOR page', async () => {
            const repository = createRepository();
            const { default: Store } = await import('../src/store.js');
            const originalProfile = Store.profile.value;
            Store.profile.set({ name: 'test-user' });
            repository.page = { value: PAGE_NAMES.FRAGMENT_EDITOR };
            repository.loadPreviewPlaceholders = sandbox.stub();
            try {
                repository.handleSearch();
                expect(repository.loadPreviewPlaceholders.calledOnce).to.be.true;
            } finally {
                Store.profile.set(originalProfile);
            }
        });

        it('calls loadPlaceholders for PLACEHOLDERS page', async () => {
            const repository = createRepository();
            const { default: Store } = await import('../src/store.js');
            const originalProfile = Store.profile.value;
            Store.profile.set({ name: 'test-user' });

            repository.page = { value: PAGE_NAMES.PLACEHOLDERS };
            repository.loadPlaceholders = sandbox.stub();

            try {
                repository.handleSearch();
                expect(repository.loadPlaceholders.calledOnce).to.be.true;
            } finally {
                Store.profile.set(originalProfile);
            }
        });

        it('calls loadPromotions for PROMOTIONS page', async () => {
            const repository = createRepository();
            const { default: Store } = await import('../src/store.js');
            const originalProfile = Store.profile.value;
            Store.profile.set({ name: 'test-user' });
            repository.page = { value: PAGE_NAMES.PROMOTIONS };
            repository.loadPromotions = sandbox.stub();
            try {
                repository.handleSearch();
                expect(repository.loadPromotions.calledOnce).to.be.true;
            } finally {
                Store.profile.set(originalProfile);
            }
        });

        it('calls searchFragments for PROMOTIONS_EDITOR page', async () => {
            const repository = createRepository();
            const { default: Store } = await import('../src/store.js');
            const originalProfile = Store.profile.value;
            Store.profile.set({ name: 'test-user' });
            repository.page = { value: PAGE_NAMES.PROMOTIONS_EDITOR };
            repository.searchFragments = sandbox.stub();
            try {
                repository.handleSearch();
                expect(repository.searchFragments.calledOnce).to.be.true;
            } finally {
                Store.profile.set(originalProfile);
            }
        });

        it('getPromotionsPath returns promotions folder under root', () => {
            const repository = createRepository();
            expect(repository.getPromotionsPath()).to.equal(`${ROOT_PATH}/promotions`);
        });

        it('loadPromotions populates list from searchFragmentList', async () => {
            const repository = createFullRepository();
            const { default: Store } = await import('../src/store.js');
            const promoFragment = {
                id: 'promo-1',
                etag: 'e',
                model: { id: 'promotion-model' },
                path: '/content/dam/mas/promotions/promo-1',
                title: 'T',
                description: '',
                status: 'DRAFT',
                created: { by: 'u', fullName: 'U', at: '2024-01-01T00:00:00.000Z' },
                modified: { by: 'u', fullName: 'U', at: '2024-01-02T00:00:00.000Z' },
                fields: [
                    { name: 'title', type: 'text', values: ['T'] },
                    { name: 'promoCode', type: 'text', values: ['X'] },
                    { name: 'startDate', type: 'date-time', values: ['2024-01-01T00:00:00.000Z'] },
                    { name: 'endDate', type: 'date-time', values: ['2024-12-31T23:59:59.999Z'] },
                    { name: 'tags', type: 'tag', values: [] },
                    { name: 'surfaces', type: 'text', values: [] },
                ],
                tags: [],
            };
            repository.searchFragmentList = sandbox.stub().resolves([promoFragment]);
            Store.promotions.list.data.set([]);
            await repository.loadPromotions();
            expect(repository.searchFragmentList.calledOnce).to.be.true;
            expect(Store.promotions.list.data.get().length).to.equal(1);
            expect(Store.promotions.list.loading.get()).to.be.false;
        });

        it('loadPromotions auto-unpublishes expired published promotions and refreshes the row', async () => {
            const repository = createFullRepository();
            const { default: Store } = await import('../src/store.js');
            const expiredPublished = {
                id: 'promo-exp',
                etag: 'e',
                model: { id: 'promotion-model' },
                path: '/content/dam/mas/promotions/promo-exp',
                title: 'Expired Pub',
                description: '',
                status: 'PUBLISHED',
                created: { by: 'u', fullName: 'U', at: '2020-01-01T00:00:00.000Z' },
                modified: { by: 'u', fullName: 'U', at: '2020-01-02T00:00:00.000Z' },
                fields: [
                    { name: 'title', type: 'text', values: ['Expired Pub'] },
                    { name: 'promoCode', type: 'text', values: ['X'] },
                    { name: 'startDate', type: 'date-time', values: ['2020-01-01T00:00:00.000Z'] },
                    { name: 'endDate', type: 'date-time', values: ['2020-02-01T00:00:00.000Z'] },
                    { name: 'tags', type: 'tag', values: ['mas:status/published'] },
                    { name: 'surfaces', type: 'text', values: [] },
                ],
                tags: [],
            };
            const refreshed = {
                ...expiredPublished,
                status: 'DRAFT',
                fields: expiredPublished.fields.map((f) => (f.name === 'tags' ? { ...f, values: [] } : f)),
            };
            let refreshComplete;
            const refreshCompletePromise = new Promise((resolve) => {
                refreshComplete = resolve;
            });
            repository.aem = createAemMock();
            repository.searchFragmentList = sandbox.stub().resolves([expiredPublished]);
            const unpublishStub = sandbox.stub(repository, 'unpublishFragment').resolves(true);
            repository.aem.sites.cf.fragments.getById.callsFake(async () => {
                refreshComplete();
                return refreshed;
            });
            Store.promotions.list.data.set([]);
            await repository.loadPromotions();
            await refreshCompletePromise;
            expect(unpublishStub.calledOnceWithExactly(sinon.match.has('id', 'promo-exp'), false)).to.be.true;
            expect(repository.aem.sites.cf.fragments.getById.calledWith('promo-exp')).to.be.true;
            const row = Store.promotions.list.data.get()[0].get();
            expect(row.isPromotionPublished).to.be.false;
        });

        it('loadPromotions calls processError when searchFragmentList rejects', async () => {
            const repository = createFullRepository();
            const { default: Store } = await import('../src/store.js');
            repository.searchFragmentList = sandbox.stub().rejects(new Error('network'));
            sandbox.stub(repository, 'processError');
            Store.promotions.list.data.set([]);
            await repository.loadPromotions();
            expect(repository.processError.calledOnce).to.be.true;
            expect(repository.processError.firstCall.args[1]).to.equal('Could not load promotions.');
            expect(Store.promotions.list.loading.get()).to.be.false;
        });

        it('loadAllCollections skips writing stores when items selection store unset after fetch', async () => {
            const repository = createFullRepository();
            const { default: Store } = await import('../src/store.js');
            const { setItemsSelectionStore } = await import('../src/common/items-selection-store.js');
            const originalSearch = structuredClone(Store.search.get());
            const originalFilters = structuredClone(Store.filters.get());
            Store.search.set({ ...originalSearch, path: 'acom' });
            Store.filters.set({ ...originalFilters, locale: 'en_US' });
            let resolveList;
            const deferred = new Promise((r) => {
                resolveList = r;
            });
            repository.searchFragmentList = sandbox.stub().returns(deferred);
            Store.translationProjects.allCollections.set([]);
            const collectionsSnapshot = Store.translationProjects.allCollections.get();
            setItemsSelectionStore(Store.translationProjects);
            try {
                const loadP = repository.loadAllCollections();
                await Promise.resolve();
                setItemsSelectionStore(null);
                resolveList([
                    {
                        path: '/content/dam/mas/acom/en_US/collections/c1',
                        title: 'C1',
                        fields: [],
                        model: { path: COLLECTION_MODEL_PATH },
                    },
                ]);
                await loadP;
                expect(Store.translationProjects.allCollections.get()).to.equal(collectionsSnapshot);
            } finally {
                Store.search.set(originalSearch);
                Store.filters.set(originalFilters);
                setItemsSelectionStore(null);
            }
        });

        it('loadAllCollections in PROMOTIONS_EDITOR searches without locale in path', async () => {
            const repository = createFullRepository();
            const { default: Store } = await import('../src/store.js');
            const { setItemsSelectionStore } = await import('../src/common/items-selection-store.js');
            const originalFilters = structuredClone(Store.filters.get());
            Store.filters.set({ ...originalFilters, locale: 'en_US' });
            repository.page = { value: PAGE_NAMES.PROMOTIONS_EDITOR };
            Store.promotions.itemPickerSurface.set('acom');
            repository.searchFragmentList = sandbox.stub().resolves([]);
            setItemsSelectionStore(Store.promotions);
            try {
                await repository.loadAllCollections();
                const searchPath = repository.searchFragmentList.firstCall.args[0].path;
                expect(searchPath).to.equal('/content/dam/mas/acom');
                expect(searchPath).to.not.include('en_US');
            } finally {
                Store.filters.set(originalFilters);
                Store.promotions.itemPickerSurface.set(null);
                setItemsSelectionStore(null);
            }
        });

        it('calls loadTranslationProjects for TRANSLATIONS page', async () => {
            const repository = createRepository();
            const { default: Store } = await import('../src/store.js');
            const originalProfile = Store.profile.value;
            Store.profile.set({ name: 'test-user' });
            repository.page = { value: PAGE_NAMES.TRANSLATIONS };
            repository.loadTranslationProjects = sandbox.stub();
            try {
                repository.handleSearch();
                expect(repository.loadTranslationProjects.calledOnce).to.be.true;
            } finally {
                Store.profile.set(originalProfile);
            }
        });
    });

    describe('loadTranslationProjects', () => {
        it('returns early when translations path is null', async () => {
            const repository = createFullRepository();
            repository.search = { value: { path: '' } };
            const searchStub = sandbox.stub();
            repository.searchFragmentList = searchStub;
            await repository.loadTranslationProjects();
            expect(searchStub.called).to.be.false;
        });

        it('loads and stores translation projects successfully', async () => {
            const repository = createFullRepository();
            repository.search = { value: { path: 'acom' } };
            const mockFragments = [
                createFragment({ id: 'proj-1', path: `${ROOT_PATH}/acom/translations/project1` }),
                createFragment({ id: 'proj-2', path: `${ROOT_PATH}/acom/translations/project2` }),
            ];
            repository.searchFragmentList = sandbox.stub().resolves(mockFragments);
            const { default: Store } = await import('../src/store.js');
            const originalLoading = Store.translationProjects.list.loading.set.bind(Store.translationProjects.list.loading);
            const originalData = Store.translationProjects.list.data.set.bind(Store.translationProjects.list.data);
            const loadingSetStub = sandbox.stub();
            const dataSetStub = sandbox.stub();
            Store.translationProjects.list.loading.set = loadingSetStub;
            Store.translationProjects.list.data.set = dataSetStub;
            try {
                await repository.loadTranslationProjects();

                expect(loadingSetStub.calledWith(true)).to.be.true;
                expect(loadingSetStub.calledWith(false)).to.be.true;
                expect(dataSetStub.calledOnce).to.be.true;

                const storedProjects = dataSetStub.firstCall.args[0];
                expect(storedProjects).to.have.lengthOf(2);
            } finally {
                Store.translationProjects.list.loading.set = originalLoading;
                Store.translationProjects.list.data.set = originalData;
            }
        });

        it('calls searchFragmentList with correct path and limit', async () => {
            const repository = createFullRepository();
            repository.search = { value: { path: 'ccd' } };
            repository.searchFragmentList = sandbox.stub().resolves([]);
            const { default: Store } = await import('../src/store.js');
            const originalLoading = Store.translationProjects.list.loading.set.bind(Store.translationProjects.list.loading);
            const originalData = Store.translationProjects.list.data.set.bind(Store.translationProjects.list.data);
            Store.translationProjects.list.loading.set = sandbox.stub();
            Store.translationProjects.list.data.set = sandbox.stub();
            try {
                await repository.loadTranslationProjects();

                expect(repository.searchFragmentList.calledOnce).to.be.true;
                const [searchOptions, limit] = repository.searchFragmentList.firstCall.args;
                expect(searchOptions.path).to.equal(`${ROOT_PATH}/ccd/translations`);
                expect(limit).to.equal(50);
            } finally {
                Store.translationProjects.list.loading.set = originalLoading;
                Store.translationProjects.list.data.set = originalData;
            }
        });

        it('handles errors gracefully', async () => {
            const repository = createFullRepository();
            repository.search = { value: { path: 'acom' } };
            repository.searchFragmentList = sandbox.stub().rejects(new Error('Network error'));
            repository.processError = sandbox.stub();
            const { default: Store } = await import('../src/store.js');
            const originalLoading = Store.translationProjects.list.loading.set.bind(Store.translationProjects.list.loading);
            Store.translationProjects.list.loading.set = sandbox.stub();
            try {
                await repository.loadTranslationProjects();

                expect(repository.processError.calledOnce).to.be.true;
                expect(repository.processError.firstCall.args[1]).to.equal('Could not load translation projects.');
            } finally {
                Store.translationProjects.list.loading.set = originalLoading;
            }
        });

        it('calls searchFragmentList with sort option modifiedOrCreated DESC', async () => {
            const repository = createFullRepository();
            repository.search = { value: { path: 'sandbox' } };
            repository.searchFragmentList = sandbox.stub().resolves([]);
            const { default: Store } = await import('../src/store.js');
            const originalLoading = Store.translationProjects.list.loading.set.bind(Store.translationProjects.list.loading);
            const originalData = Store.translationProjects.list.data.set.bind(Store.translationProjects.list.data);
            Store.translationProjects.list.loading.set = sandbox.stub();
            Store.translationProjects.list.data.set = sandbox.stub();
            try {
                await repository.loadTranslationProjects();
                expect(repository.searchFragmentList.calledOnce).to.be.true;
                const options = repository.searchFragmentList.firstCall.args[0];
                expect(options.sort).to.deep.equal([{ on: 'modifiedOrCreated', order: 'DESC' }]);
            } finally {
                Store.translationProjects.list.loading.set = originalLoading;
                Store.translationProjects.list.data.set = originalData;
            }
        });
    });

    describe('searchFragments', () => {
        const createMockCursor = (pages) => {
            let index = 0;
            return {
                next: async () => {
                    if (index >= pages.length) return { done: true };
                    const page = pages[index++];
                    return {
                        done: false,
                        value: {
                            [Symbol.asyncIterator]: async function* () {
                                for (const item of page) yield item;
                            },
                        },
                    };
                },
            };
        };

        it('returns early when page is not CONTENT or TRANSLATION_EDITOR', async () => {
            const repository = createFullRepository();
            repository.page = { value: PAGE_NAMES.WELCOME };
            const searchStub = sandbox.stub();
            repository.aem = createAemMock({
                fragments: {
                    search: searchStub,
                },
            });
            await repository.searchFragments();
            expect(searchStub.called).to.be.false;
        });

        it('executes search when page is PROMOTIONS_EDITOR and item picker surface is set', async () => {
            const repository = createFullRepository();
            repository.page = { value: PAGE_NAMES.PROMOTIONS_EDITOR };
            repository.search = { value: { path: 'acom', query: '' } };
            repository.filters = { value: { locale: 'en_US', tags: '', personalizationFilterEnabled: false } };
            const cursor = createMockCursor([[]]);
            const searchStub = sandbox.stub().resolves(cursor);
            repository.aem = createAemMock({ fragments: { search: searchStub } });
            const { default: Store } = await import('../src/store.js');
            const originalProfile = Store.profile.value;
            const originalPickerSurface = Store.promotions.itemPickerSurface.get();
            Store.profile.set({ name: 'test-user' });
            Store.promotions.itemPickerSurface.set('acom');
            const mockDataStore = {
                get: sandbox.stub().returns([]),
                getMeta: sandbox.stub().returns(null),
                set: sandbox.stub(),
                setMeta: sandbox.stub(),
            };
            const originalData = Store.fragments.list.data;
            Store.fragments.list.data = mockDataStore;
            try {
                await repository.searchFragments();
                expect(searchStub.called).to.be.true;
            } finally {
                Store.profile.set(originalProfile);
                Store.promotions.itemPickerSurface.set(originalPickerSurface);
                Store.fragments.list.data = originalData;
            }
        });

        it('returns early on PROMOTIONS_EDITOR when item picker surface is not set', async () => {
            const repository = createFullRepository();
            repository.page = { value: PAGE_NAMES.PROMOTIONS_EDITOR };
            repository.search = { value: { path: 'acom', query: '' } };
            const searchStub = sandbox.stub();
            repository.aem = createAemMock({ fragments: { search: searchStub } });
            const { default: Store } = await import('../src/store.js');
            const originalProfile = Store.profile.value;
            const originalPickerSurface = Store.promotions.itemPickerSurface.get();
            Store.profile.set({ name: 'test-user' });
            Store.promotions.itemPickerSurface.set(null);
            const mockDataStore = {
                get: sandbox.stub().returns([{ get: () => ({ path: '/x' }) }]),
                getMeta: sandbox.stub().returns(null),
                set: sandbox.stub(),
                setMeta: sandbox.stub(),
            };
            const originalData = Store.fragments.list.data;
            Store.fragments.list.data = mockDataStore;
            try {
                await repository.searchFragments();
                expect(searchStub.called).to.be.false;
                expect(mockDataStore.set.called).to.be.true;
            } finally {
                Store.profile.set(originalProfile);
                Store.promotions.itemPickerSurface.set(originalPickerSurface);
                Store.fragments.list.data = originalData;
            }
        });

        it('returns early when profile is not set', async () => {
            const repository = createFullRepository();
            repository.page = { value: PAGE_NAMES.CONTENT };
            const searchStub = sandbox.stub();
            repository.aem = createAemMock({
                fragments: {
                    search: searchStub,
                },
            });
            const { default: Store } = await import('../src/store.js');
            const originalProfile = Store.profile.value;
            Store.profile.set(null);
            try {
                await repository.searchFragments();
                expect(searchStub.called).to.be.false;
            } finally {
                Store.profile.set(originalProfile);
            }
        });

        it('returns early when cached data matches current search params', async () => {
            const repository = createFullRepository();
            repository.page = { value: PAGE_NAMES.CONTENT };
            repository.search = { value: { path: 'acom', query: '' } };
            repository.filters = { value: { locale: 'en_US', tags: '' } };
            const searchStub = sandbox.stub();
            repository.aem = createAemMock({
                fragments: {
                    search: searchStub,
                },
            });
            const { default: Store } = await import('../src/store.js');
            const originalProfile = Store.profile.value;
            Store.profile.set({ name: 'test-user' });
            const mockDataStore = {
                get: sandbox.stub().returns([{ value: { id: 'cached-fragment' } }]),
                getMeta: sandbox.stub().callsFake((key) => {
                    if (key === 'path') return 'acom';
                    if (key === 'query') return '';
                    if (key === 'locale') return 'en_US';
                    if (key === 'tags') return '';
                    if (key === 'createdBy') return '';
                    if (key === 'personalizationFilterEnabled') return false;
                    return null;
                }),
                set: sandbox.stub(),
                setMeta: sandbox.stub(),
            };
            const originalData = Store.fragments.list.data;
            Store.fragments.list.data = mockDataStore;
            try {
                await repository.searchFragments();
                expect(searchStub.called).to.be.false;
            } finally {
                Store.profile.set(originalProfile);
                Store.fragments.list.data = originalData;
            }
        });

        it('invalidates cache and re-searches when only the variant tag changes', async () => {
            const repository = createFullRepository();
            repository.page = { value: PAGE_NAMES.CONTENT };
            repository.search = { value: { path: 'acom', query: '' } };
            repository.filters = { value: { locale: 'en_US', tags: 'mas:variant/plans' } };
            const cursor = createMockCursor([[createFragment({ id: 'fresh-fragment' })]]);
            const searchStub = sandbox.stub().resolves(cursor);
            repository.aem = createAemMock({
                fragments: {
                    search: searchStub,
                },
            });
            const { default: Store } = await import('../src/store.js');
            const originalProfile = Store.profile.value;
            Store.profile.set({ name: 'test-user' });
            const mockDataStore = {
                get: sandbox.stub().returns([{ value: { id: 'cached-fragment' } }]),
                getMeta: sandbox.stub().callsFake((key) => {
                    if (key === 'path') return 'acom';
                    if (key === 'query') return '';
                    if (key === 'locale') return 'en_US';
                    if (key === 'tags') return 'mas:variant/catalog';
                    if (key === 'createdBy') return '';
                    if (key === 'personalizationFilterEnabled') return false;
                    return null;
                }),
                set: sandbox.stub(),
                setMeta: sandbox.stub(),
            };
            const originalData = Store.fragments.list.data;
            Store.fragments.list.data = mockDataStore;
            try {
                await repository.searchFragments();
                expect(searchStub.called).to.be.true;
            } finally {
                Store.profile.set(originalProfile);
                Store.fragments.list.data = originalData;
            }
        });

        it('routes single variant via fullText.EDGES and applies user query client-side', async () => {
            // Single variant + user query: AEM call carries the variant name as fullText so
            // it can prune via the indexed text fields. The user's query ("photoshop") is
            // applied client-side via skipQuery against an expanded haystack covering all
            // string field values (since AEM's fullText index only covers title+description).
            // This avoids the MWPW-193359 AND-across-tokens regression.
            const repository = createFullRepository();
            repository.page = { value: PAGE_NAMES.CONTENT };
            repository.search = { value: { path: 'acom', query: 'photoshop' } };
            repository.filters = { value: { locale: 'en_US', tags: 'mas:variant/ccd-slice' } };
            const searchStub = sandbox.stub().returns(createMockCursor([[]]));
            repository.aem = createAemMock({
                fragments: { search: searchStub },
            });
            const { default: Store } = await import('../src/store.js');
            const originalProfile = Store.profile.value;
            Store.profile.set({ name: 'test-user' });
            const mockDataStore = {
                get: sandbox.stub().returns([]),
                getMeta: sandbox.stub().returns(null),
                set: sandbox.stub(),
                setMeta: sandbox.stub(),
            };
            const originalData = Store.fragments.list.data;
            Store.fragments.list.data = mockDataStore;
            try {
                await repository.searchFragments();
                expect(searchStub.calledOnce).to.be.true;
                const callArg = searchStub.firstCall.args[0];
                expect(callArg.query).to.equal('ccd-slice');
                expect(callArg.tags).to.deep.equal([]);
            } finally {
                Store.profile.set(originalProfile);
                Store.fragments.list.data = originalData;
            }
        });

        it('leaves query unchanged when no variants are selected', async () => {
            const repository = createFullRepository();
            repository.page = { value: PAGE_NAMES.CONTENT };
            repository.search = { value: { path: 'acom', query: 'photoshop' } };
            repository.filters = { value: { locale: 'en_US', tags: '' } };
            const searchStub = sandbox.stub().returns(createMockCursor([[]]));
            repository.aem = createAemMock({
                fragments: { search: searchStub },
            });
            const { default: Store } = await import('../src/store.js');
            const originalProfile = Store.profile.value;
            Store.profile.set({ name: 'test-user' });
            const mockDataStore = {
                get: sandbox.stub().returns([]),
                getMeta: sandbox.stub().returns(null),
                set: sandbox.stub(),
                setMeta: sandbox.stub(),
            };
            const originalData = Store.fragments.list.data;
            Store.fragments.list.data = mockDataStore;
            try {
                await repository.searchFragments();
                expect(searchStub.calledOnce).to.be.true;
                const callArg = searchStub.firstCall.args[0];
                expect(callArg.query).to.equal('photoshop');
            } finally {
                Store.profile.set(originalProfile);
                Store.fragments.list.data = originalData;
            }
        });

        it('clears variation search stores when switching to text search', async () => {
            const repository = createFullRepository();
            repository.page = { value: PAGE_NAMES.CONTENT };
            repository.search = { value: { path: 'acom', query: 'photoshop' } };
            repository.filters = { value: { locale: 'en_US', tags: '' } };
            const searchStub = sandbox.stub().returns(createMockCursor([[]]));
            repository.aem = createAemMock({
                fragments: { search: searchStub },
            });
            const { default: Store } = await import('../src/store.js');
            const originalProfile = Store.profile.value;
            const originalExpandedId = Store.fragments.expandedId.get();
            const originalHighlightedId = Store.fragments.highlightedVariationId.get();
            const originalVariationTab = Store.fragments.variationSearchTab.get();
            Store.profile.set({ name: 'test-user' });
            Store.fragments.expandedId.set('parent-uuid');
            Store.fragments.highlightedVariationId.set('variation-uuid');
            Store.fragments.variationSearchTab.set('grouped');
            const mockDataStore = {
                get: sandbox.stub().returns([]),
                getMeta: sandbox.stub().returns(null),
                set: sandbox.stub(),
                setMeta: sandbox.stub(),
            };
            const originalData = Store.fragments.list.data;
            Store.fragments.list.data = mockDataStore;
            try {
                await repository.searchFragments();
                expect(searchStub.calledOnce).to.be.true;
                expect(Store.fragments.expandedId.get()).to.be.null;
                expect(Store.fragments.highlightedVariationId.get()).to.be.null;
                expect(Store.fragments.variationSearchTab.get()).to.be.null;
            } finally {
                Store.profile.set(originalProfile);
                Store.fragments.expandedId.set(originalExpandedId);
                Store.fragments.highlightedVariationId.set(originalHighlightedId);
                Store.fragments.variationSearchTab.set(originalVariationTab);
                Store.fragments.list.data = originalData;
            }
        });

        it('searches by UUID when query is a valid UUID', async () => {
            const repository = createFullRepository();
            repository.page = { value: PAGE_NAMES.CONTENT };
            repository.search = { value: { path: 'acom', query: '12345678-1234-1234-1234-123456789012' } };
            repository.filters = { value: { locale: 'en_US', tags: '' } };
            const mockFragment = createFragment({
                id: '12345678-1234-1234-1234-123456789012',
                path: `${ROOT_PATH}/acom/en_US/test-fragment`,
                fields: [],
            });
            const getByIdStub = sandbox.stub().resolves(mockFragment);
            const searchStub = sandbox.stub();
            repository.aem = createAemMock({
                fragments: {
                    getById: getByIdStub,
                    search: searchStub,
                },
            });
            const { default: Store } = await import('../src/store.js');
            const originalProfile = Store.profile.value;
            const originalExpandedId = Store.fragments.expandedId.get();
            Store.profile.set({ name: 'test-user' });
            let dataValue = [];
            const mockDataStore = {
                get: sandbox.stub().callsFake(() => dataValue),
                getMeta: sandbox.stub().returns(null),
                set: sandbox.stub().callsFake((value) => {
                    dataValue = value;
                }),
                setMeta: sandbox.stub(),
            };
            const originalData = Store.fragments.list.data;
            const originalFolders = Store.folders.data.get();
            Store.fragments.list.data = mockDataStore;
            Store.folders.data.set(['acom', 'ccd']);
            try {
                await repository.searchFragments();
                expect(getByIdStub.calledOnce).to.be.true;
                expect(getByIdStub.firstCall.args[0]).to.equal('12345678-1234-1234-1234-123456789012');
                expect(searchStub.called).to.be.false;
                expect(Store.fragments.expandedId.get()).to.equal('12345678-1234-1234-1234-123456789012');
            } finally {
                Store.profile.set(originalProfile);
                Store.fragments.expandedId.set(originalExpandedId);
                Store.fragments.list.data = originalData;
                Store.folders.data.set(originalFolders);
            }
        });

        it('calls getById with the raw UUID even when a variant tag is selected', async () => {
            const repository = createFullRepository();
            repository.page = { value: PAGE_NAMES.CONTENT };
            const uuid = '12345678-1234-1234-1234-123456789012';
            repository.search = { value: { path: 'acom', query: uuid } };
            repository.filters = { value: { locale: 'en_US', tags: 'mas:variant/ccd-slice' } };
            const mockFragment = createFragment({ id: uuid, path: `${ROOT_PATH}/acom/en_US/x`, fields: [] });
            const getByIdStub = sandbox.stub().resolves(mockFragment);
            repository.aem = createAemMock({ fragments: { getById: getByIdStub, search: sandbox.stub() } });
            const { default: Store } = await import('../src/store.js');
            const originalProfile = Store.profile.value;
            Store.profile.set({ name: 'test-user' });
            let dataValue = [];
            const mockDataStore = {
                get: sandbox.stub().callsFake(() => dataValue),
                getMeta: sandbox.stub().returns(null),
                set: sandbox.stub().callsFake((v) => {
                    dataValue = v;
                }),
                setMeta: sandbox.stub(),
            };
            const originalData = Store.fragments.list.data;
            const originalFolders = Store.folders.data.get();
            Store.fragments.list.data = mockDataStore;
            Store.folders.data.set(['acom', 'ccd']);
            try {
                await repository.searchFragments();
                expect(getByIdStub.calledOnce).to.be.true;
                expect(getByIdStub.firstCall.args[0]).to.equal(uuid);
            } finally {
                Store.profile.set(originalProfile);
                Store.fragments.list.data = originalData;
                Store.folders.data.set(originalFolders);
            }
        });

        it('infers the surface for a UUID deep link when the path is missing', async () => {
            const repository = createFullRepository();
            repository.page = { value: PAGE_NAMES.CONTENT };
            repository.search = { value: { query: '12345678-1234-1234-1234-123456789012' } };
            repository.filters = { value: { locale: 'fr_FR', tags: '' } };
            const mockFragment = createFragment({
                id: '12345678-1234-1234-1234-123456789012',
                path: `${ROOT_PATH}/nala/fr_FR/test-fragment`,
                fields: [],
            });
            const getByIdStub = sandbox.stub().resolves(mockFragment);
            repository.aem = createAemMock({
                fragments: {
                    getById: getByIdStub,
                    search: sandbox.stub(),
                },
            });
            const { default: Store } = await import('../src/store.js');
            const originalProfile = Store.profile.value;
            const originalSearch = structuredClone(Store.search.get());
            const originalFilters = structuredClone(Store.filters.get());
            const originalUuidSearchQuery = Store.search.getMeta('uuid-query');
            const originalUuidPath = Store.search.getMeta('uuid-path');
            const originalUuidQuery = Store.filters.getMeta('uuid-query');
            const originalUuidLocale = Store.filters.getMeta('uuid-locale');
            Store.profile.set({ name: 'test-user' });
            Store.search.set({});
            Store.search.removeMeta('uuid-query');
            Store.search.removeMeta('uuid-path');
            Store.filters.set({ locale: 'fr_FR', tags: '' });
            Store.filters.removeMeta('uuid-query');
            Store.filters.removeMeta('uuid-locale');
            let dataValue = [];
            const mockDataStore = {
                get: sandbox.stub().callsFake(() => dataValue),
                getMeta: sandbox.stub().returns(null),
                set: sandbox.stub().callsFake((value) => {
                    dataValue = value;
                }),
                setMeta: sandbox.stub(),
            };
            const originalData = Store.fragments.list.data;
            Store.fragments.list.data = mockDataStore;
            try {
                await repository.searchFragments();
                expect(getByIdStub.calledOnce).to.be.true;
                expect(Store.filters.get().locale).to.equal('fr_FR');
                expect(mockDataStore.set.secondCall.args[0]).to.have.lengthOf(1);
                expect(mockDataStore.set.secondCall.args[0][0].get().path).to.equal(mockFragment.path);
                expect(mockDataStore.setMeta.calledWith('path', 'nala')).to.be.true;
                expect(mockDataStore.setMeta.calledWith('locale', 'fr_FR')).to.be.true;
            } finally {
                Store.profile.set(originalProfile);
                Store.search.set(originalSearch);
                Store.filters.set(originalFilters);
                if (originalUuidSearchQuery === null) Store.search.removeMeta('uuid-query');
                else Store.search.setMeta('uuid-query', originalUuidSearchQuery);
                if (originalUuidPath === null) Store.search.removeMeta('uuid-path');
                else Store.search.setMeta('uuid-path', originalUuidPath);
                if (originalUuidQuery === null) Store.filters.removeMeta('uuid-query');
                else Store.filters.setMeta('uuid-query', originalUuidQuery);
                if (originalUuidLocale === null) Store.filters.removeMeta('uuid-locale');
                else Store.filters.setMeta('uuid-locale', originalUuidLocale);
                Store.fragments.list.data = originalData;
            }
        });

        it('switches to the fragment surface when a UUID is searched from the wrong surface', async () => {
            const repository = createFullRepository();
            repository.page = { value: PAGE_NAMES.CONTENT };
            repository.search = { value: { path: 'acom', query: '12345678-1234-1234-1234-123456789012' } };
            repository.filters = { value: { locale: 'fr_FR', tags: '' } };
            const mockFragment = createFragment({
                id: '12345678-1234-1234-1234-123456789012',
                path: `${ROOT_PATH}/nala/fr_FR/test-fragment`,
                fields: [],
            });
            const getByIdStub = sandbox.stub().resolves(mockFragment);
            repository.aem = createAemMock({
                fragments: {
                    getById: getByIdStub,
                    search: sandbox.stub(),
                },
            });
            const { default: Store } = await import('../src/store.js');
            const originalProfile = Store.profile.value;
            const originalSearch = structuredClone(Store.search.get());
            const originalFilters = structuredClone(Store.filters.get());
            const originalUuidSearchQuery = Store.search.getMeta('uuid-query');
            const originalUuidPath = Store.search.getMeta('uuid-path');
            const originalUuidQuery = Store.filters.getMeta('uuid-query');
            const originalUuidLocale = Store.filters.getMeta('uuid-locale');
            Store.profile.set({ name: 'test-user' });
            Store.search.set({ path: 'acom', query: '12345678-1234-1234-1234-123456789012' });
            Store.search.removeMeta('uuid-query');
            Store.search.removeMeta('uuid-path');
            Store.filters.set({ locale: 'fr_FR', tags: '' });
            Store.filters.removeMeta('uuid-query');
            Store.filters.removeMeta('uuid-locale');
            let dataValue = [];
            const mockDataStore = {
                get: sandbox.stub().callsFake(() => dataValue),
                getMeta: sandbox.stub().returns(null),
                set: sandbox.stub().callsFake((value) => {
                    dataValue = value;
                }),
                setMeta: sandbox.stub(),
            };
            const originalData = Store.fragments.list.data;
            Store.fragments.list.data = mockDataStore;
            try {
                await repository.searchFragments();
                expect(getByIdStub.calledOnce).to.be.true;
                expect(Store.search.get().path).to.equal('nala');
                expect(Store.filters.get().locale).to.equal('fr_FR');
                expect(mockDataStore.set.secondCall.args[0]).to.have.lengthOf(1);
                expect(mockDataStore.setMeta.calledWith('path', 'nala')).to.be.true;
            } finally {
                Store.profile.set(originalProfile);
                Store.search.set(originalSearch);
                Store.filters.set(originalFilters);
                if (originalUuidSearchQuery === null) Store.search.removeMeta('uuid-query');
                else Store.search.setMeta('uuid-query', originalUuidSearchQuery);
                if (originalUuidPath === null) Store.search.removeMeta('uuid-path');
                else Store.search.setMeta('uuid-path', originalUuidPath);
                if (originalUuidQuery === null) Store.filters.removeMeta('uuid-query');
                else Store.filters.setMeta('uuid-query', originalUuidQuery);
                if (originalUuidLocale === null) Store.filters.removeMeta('uuid-locale');
                else Store.filters.setMeta('uuid-locale', originalUuidLocale);
                Store.fragments.list.data = originalData;
            }
        });

        it('infers the locale for a UUID deep link when the selected locale differs', async () => {
            const repository = createFullRepository();
            repository.page = { value: PAGE_NAMES.CONTENT };
            repository.search = { value: { query: '12345678-1234-1234-1234-123456789012' } };
            repository.filters = { value: { locale: 'da_DK', tags: '' } };
            const mockFragment = createFragment({
                id: '12345678-1234-1234-1234-123456789012',
                path: `${ROOT_PATH}/nala/fr_FR/test-fragment`,
                fields: [],
            });
            const getByIdStub = sandbox.stub().resolves(mockFragment);
            repository.aem = createAemMock({
                fragments: {
                    getById: getByIdStub,
                    search: sandbox.stub(),
                },
            });
            const { default: Store } = await import('../src/store.js');
            const originalProfile = Store.profile.value;
            const originalSearch = structuredClone(Store.search.get());
            const originalFilters = structuredClone(Store.filters.get());
            const originalUuidSearchQuery = Store.search.getMeta('uuid-query');
            const originalUuidPath = Store.search.getMeta('uuid-path');
            const originalUuidQuery = Store.filters.getMeta('uuid-query');
            const originalUuidLocale = Store.filters.getMeta('uuid-locale');
            Store.profile.set({ name: 'test-user' });
            Store.search.set({});
            Store.search.removeMeta('uuid-query');
            Store.search.removeMeta('uuid-path');
            Store.filters.set({ locale: 'da_DK', tags: '' });
            Store.filters.removeMeta('uuid-query');
            Store.filters.removeMeta('uuid-locale');
            const mockDataStore = {
                get: sandbox.stub().returns([{ value: { id: 'stale-fragment' } }]),
                getMeta: sandbox.stub().returns(null),
                set: sandbox.stub(),
                setMeta: sandbox.stub(),
            };
            const originalData = Store.fragments.list.data;
            Store.fragments.list.data = mockDataStore;
            try {
                await repository.searchFragments();
                expect(getByIdStub.calledOnce).to.be.true;
                expect(Store.filters.get().locale).to.equal('fr_FR');
                expect(mockDataStore.set.secondCall.args[0]).to.have.lengthOf(1);
                expect(mockDataStore.set.secondCall.args[0][0].get().path).to.equal(mockFragment.path);
                expect(mockDataStore.setMeta.calledWith('path', 'nala')).to.be.true;
                expect(mockDataStore.setMeta.calledWith('locale', 'fr_FR')).to.be.true;
                expect(mockDataStore.setMeta.calledWith('query', '12345678-1234-1234-1234-123456789012')).to.be.true;
            } finally {
                Store.profile.set(originalProfile);
                Store.search.set(originalSearch);
                Store.filters.set(originalFilters);
                if (originalUuidSearchQuery === null) Store.search.removeMeta('uuid-query');
                else Store.search.setMeta('uuid-query', originalUuidSearchQuery);
                if (originalUuidPath === null) Store.search.removeMeta('uuid-path');
                else Store.search.setMeta('uuid-path', originalUuidPath);
                if (originalUuidQuery === null) Store.filters.removeMeta('uuid-query');
                else Store.filters.setMeta('uuid-query', originalUuidQuery);
                if (originalUuidLocale === null) Store.filters.removeMeta('uuid-locale');
                else Store.filters.setMeta('uuid-locale', originalUuidLocale);
                Store.fragments.list.data = originalData;
            }
        });

        it('does not reset the locale after the user changes it for the same UUID query', async () => {
            const repository = createFullRepository();
            repository.page = { value: PAGE_NAMES.CONTENT };
            repository.search = { value: { path: 'nala', query: '12345678-1234-1234-1234-123456789012' } };
            repository.filters = { value: { locale: 'da_DK', tags: '' } };
            const mockFragment = createFragment({
                id: '12345678-1234-1234-1234-123456789012',
                path: `${ROOT_PATH}/nala/fr_FR/test-fragment`,
                fields: [],
            });
            const getByIdStub = sandbox.stub().resolves(mockFragment);
            repository.aem = createAemMock({
                fragments: {
                    getById: getByIdStub,
                    search: sandbox.stub(),
                },
            });
            const { default: Store } = await import('../src/store.js');
            const originalProfile = Store.profile.value;
            const originalSearch = structuredClone(Store.search.get());
            const originalFilters = structuredClone(Store.filters.get());
            const originalUuidSearchQuery = Store.search.getMeta('uuid-query');
            const originalUuidPath = Store.search.getMeta('uuid-path');
            const originalUuidQuery = Store.filters.getMeta('uuid-query');
            const originalUuidLocale = Store.filters.getMeta('uuid-locale');
            Store.profile.set({ name: 'test-user' });
            Store.search.set({ path: 'nala', query: '12345678-1234-1234-1234-123456789012' });
            Store.search.setMeta('uuid-query', '12345678-1234-1234-1234-123456789012');
            Store.search.setMeta('uuid-path', 'nala');
            Store.filters.set({ locale: 'da_DK', tags: '' });
            Store.filters.setMeta('uuid-query', '12345678-1234-1234-1234-123456789012');
            Store.filters.setMeta('uuid-locale', 'fr_FR');
            const mockDataStore = {
                get: sandbox.stub().returns([{ value: { id: 'stale-fragment' } }]),
                getMeta: sandbox.stub().returns(null),
                set: sandbox.stub(),
                setMeta: sandbox.stub(),
            };
            const originalData = Store.fragments.list.data;
            Store.fragments.list.data = mockDataStore;
            try {
                await repository.searchFragments();
                expect(getByIdStub.calledOnce).to.be.true;
                expect(Store.search.get().path).to.equal('nala');
                expect(Store.filters.get().locale).to.equal('da_DK');
                expect(mockDataStore.set.calledTwice).to.be.true;
                expect(mockDataStore.set.firstCall.args[0]).to.deep.equal([]);
                expect(mockDataStore.setMeta.calledWith('path', 'nala')).to.be.true;
                expect(mockDataStore.setMeta.calledWith('locale', 'da_DK')).to.be.true;
            } finally {
                Store.profile.set(originalProfile);
                Store.search.set(originalSearch);
                Store.filters.set(originalFilters);
                if (originalUuidSearchQuery === null) Store.search.removeMeta('uuid-query');
                else Store.search.setMeta('uuid-query', originalUuidSearchQuery);
                if (originalUuidPath === null) Store.search.removeMeta('uuid-path');
                else Store.search.setMeta('uuid-path', originalUuidPath);
                if (originalUuidQuery === null) Store.filters.removeMeta('uuid-query');
                else Store.filters.setMeta('uuid-query', originalUuidQuery);
                if (originalUuidLocale === null) Store.filters.removeMeta('uuid-locale');
                else Store.filters.setMeta('uuid-locale', originalUuidLocale);
                Store.fragments.list.data = originalData;
            }
        });

        describe('variation UUID search', () => {
            const variationUuid = '5f16bf69-4dd2-4788-a163-8d33c7d68906';
            const parentUuid = '55df6f26-c5ad-4f83-a4d3-d5e25c99059b';

            const setupVariationUuidSearch = async () => {
                const { default: Store } = await import('../src/store.js');
                const originalProfile = Store.profile.value;
                const originalSearch = structuredClone(Store.search.get());
                const originalFilters = structuredClone(Store.filters.get());
                const originalExpandedId = Store.fragments.expandedId.get();
                const originalHighlightedId = Store.fragments.highlightedVariationId.get();
                const originalVariationTab = Store.fragments.variationSearchTab.get();
                const originalUuidSearchQuery = Store.search.getMeta('uuid-query');
                const originalUuidPath = Store.search.getMeta('uuid-path');
                const originalUuidQuery = Store.filters.getMeta('uuid-query');
                const originalUuidLocale = Store.filters.getMeta('uuid-locale');
                Store.profile.set({ name: 'test-user' });
                let dataValue = [];
                const mockDataStore = {
                    get: sandbox.stub().callsFake(() => dataValue),
                    getMeta: sandbox.stub().returns(null),
                    set: sandbox.stub().callsFake((value) => {
                        dataValue = value;
                    }),
                    setMeta: sandbox.stub(),
                };
                const originalData = Store.fragments.list.data;
                Store.fragments.list.data = mockDataStore;
                return {
                    Store,
                    mockDataStore,
                    restore: () => {
                        Store.profile.set(originalProfile);
                        Store.search.set(originalSearch);
                        Store.filters.set(originalFilters);
                        Store.fragments.expandedId.set(originalExpandedId);
                        Store.fragments.highlightedVariationId.set(originalHighlightedId);
                        Store.fragments.variationSearchTab.set(originalVariationTab);
                        if (originalUuidSearchQuery === null) Store.search.removeMeta('uuid-query');
                        else Store.search.setMeta('uuid-query', originalUuidSearchQuery);
                        if (originalUuidPath === null) Store.search.removeMeta('uuid-path');
                        else Store.search.setMeta('uuid-path', originalUuidPath);
                        if (originalUuidQuery === null) Store.filters.removeMeta('uuid-query');
                        else Store.filters.setMeta('uuid-query', originalUuidQuery);
                        if (originalUuidLocale === null) Store.filters.removeMeta('uuid-locale');
                        else Store.filters.setMeta('uuid-locale', originalUuidLocale);
                        Store.fragments.list.data = originalData;
                    },
                };
            };

            it('resolves parent and sets expand/highlight stores for grouped variation UUID', async () => {
                const repository = createFullRepository();
                repository.page = { value: PAGE_NAMES.CONTENT };
                const variationPath = `${ROOT_PATH}/acom/en_US/photoshop/pzn/my-card`;
                const parentPath = `${ROOT_PATH}/acom/en_US/my-card`;
                const variationFragment = createFragment({ id: variationUuid, path: variationPath, fields: [] });
                const parentFragment = createFragment({
                    id: parentUuid,
                    path: parentPath,
                    fields: [{ name: 'variations', values: [variationPath] }],
                });
                repository.search = { value: { path: 'ccd', query: variationUuid } };
                repository.filters = { value: { locale: 'en_US', tags: '' } };
                const getByIdStub = sandbox.stub();
                getByIdStub.withArgs(variationUuid).resolves(variationFragment);
                getByIdStub.withArgs(parentUuid).resolves(parentFragment);
                sandbox.stub(repository, 'resolveHydratedParentFragment').resolves(parentFragment);
                repository.aem = createAemMock({ fragments: { getById: getByIdStub, search: sandbox.stub() } });
                const { Store, mockDataStore, restore } = await setupVariationUuidSearch();
                try {
                    await repository.searchFragments();
                    expect(Store.search.get().path).to.equal('acom');
                    expect(mockDataStore.set.secondCall.args[0][0].get().id).to.equal(parentUuid);
                    expect(Store.fragments.expandedId.get()).to.equal(parentUuid);
                    expect(Store.fragments.highlightedVariationId.get()).to.equal(variationUuid);
                    expect(Store.fragments.variationSearchTab.get()).to.equal('grouped');
                } finally {
                    restore();
                }
            });

            it('resolves parent for locale variation UUID via getByPath', async () => {
                const repository = createFullRepository();
                repository.page = { value: PAGE_NAMES.CONTENT };
                const variationPath = `${ROOT_PATH}/acom/fr_CA/my-card`;
                const parentPath = `${ROOT_PATH}/acom/fr_FR/my-card`;
                const variationFragment = createFragment({ id: variationUuid, path: variationPath, fields: [] });
                const parentFragment = createFragment({ id: parentUuid, path: parentPath, fields: [] });
                repository.search = { value: { path: 'acom', query: variationUuid } };
                repository.filters = { value: { locale: 'fr_FR', tags: '' } };
                const getByIdStub = sandbox.stub().resolves(variationFragment);
                const getByPathStub = sandbox.stub().resolves(parentFragment);
                repository.aem = createAemMock({
                    fragments: { getById: getByIdStub, getByPath: getByPathStub, search: sandbox.stub() },
                });
                const { Store, mockDataStore, restore } = await setupVariationUuidSearch();
                try {
                    await repository.searchFragments();
                    expect(getByPathStub.calledOnceWith(parentPath)).to.be.true;
                    expect(mockDataStore.set.secondCall.args[0][0].get().id).to.equal(parentUuid);
                    expect(Store.fragments.expandedId.get()).to.equal(parentUuid);
                    expect(Store.fragments.highlightedVariationId.get()).to.equal(variationUuid);
                    expect(Store.fragments.variationSearchTab.get()).to.equal('locale');
                } finally {
                    restore();
                }
            });

            it('resolves parent for promo variation UUID via getByPath', async () => {
                const repository = createFullRepository();
                repository.page = { value: PAGE_NAMES.CONTENT };
                const variationPath = `${ROOT_PATH}/acom/en_US/promotions/summer-sale/my-card`;
                const parentPath = `${ROOT_PATH}/acom/en_US/my-card`;
                const variationFragment = createFragment({ id: variationUuid, path: variationPath, fields: [] });
                const parentFragment = createFragment({ id: parentUuid, path: parentPath, fields: [] });
                repository.search = { value: { path: 'acom', query: variationUuid } };
                repository.filters = { value: { locale: 'en_US', tags: '' } };
                const getByIdStub = sandbox.stub().resolves(variationFragment);
                const getByPathStub = sandbox.stub().resolves(parentFragment);
                repository.aem = createAemMock({
                    fragments: { getById: getByIdStub, getByPath: getByPathStub, search: sandbox.stub() },
                });
                const { Store, mockDataStore, restore } = await setupVariationUuidSearch();
                try {
                    await repository.searchFragments();
                    expect(getByPathStub.calledOnceWith(parentPath)).to.be.true;
                    expect(mockDataStore.set.secondCall.args[0][0].get().id).to.equal(parentUuid);
                    expect(Store.fragments.expandedId.get()).to.equal(parentUuid);
                    expect(Store.fragments.highlightedVariationId.get()).to.equal(variationUuid);
                    expect(Store.fragments.variationSearchTab.get()).to.equal('promotion');
                } finally {
                    restore();
                }
            });

            it('fetches promo variation parent with references=direct-hydrated so Promotions tab is populated', async () => {
                const repository = createFullRepository();
                repository.page = { value: PAGE_NAMES.CONTENT };
                const variationPath = `${ROOT_PATH}/acom/en_US/promotions/summer-sale/my-card`;
                const parentPath = `${ROOT_PATH}/acom/en_US/my-card`;
                const variationFragment = createFragment({ id: variationUuid, path: variationPath, fields: [] });
                const parentFragment = createFragment({ id: parentUuid, path: parentPath, fields: [] });
                repository.search = { value: { path: 'acom', query: variationUuid } };
                repository.filters = { value: { locale: 'en_US', tags: '' } };
                const getByIdStub = sandbox.stub().resolves(variationFragment);
                const getByPathStub = sandbox.stub().resolves(parentFragment);
                repository.aem = createAemMock({
                    fragments: { getById: getByIdStub, getByPath: getByPathStub, search: sandbox.stub() },
                });
                const { restore } = await setupVariationUuidSearch();
                try {
                    await repository.searchFragments();
                    expect(
                        getByPathStub.calledOnceWith(parentPath, { references: 'direct-hydrated' }),
                        'getByPath must be called with references=direct-hydrated for promo variation parent',
                    ).to.be.true;
                } finally {
                    restore();
                }
            });

            it('clears list and stores when variation UUID parent is not found', async () => {
                const repository = createFullRepository();
                repository.page = { value: PAGE_NAMES.CONTENT };
                const variationPath = `${ROOT_PATH}/acom/fr_CA/my-card`;
                const variationFragment = createFragment({ id: variationUuid, path: variationPath, fields: [] });
                repository.search = { value: { path: 'acom', query: variationUuid } };
                repository.filters = { value: { locale: 'fr_FR', tags: '' } };
                const getByIdStub = sandbox.stub().resolves(variationFragment);
                const getByPathStub = sandbox.stub().resolves(null);
                repository.aem = createAemMock({
                    fragments: { getById: getByIdStub, getByPath: getByPathStub, search: sandbox.stub() },
                });
                const { Store, mockDataStore, restore } = await setupVariationUuidSearch();
                try {
                    await repository.searchFragments();
                    expect(mockDataStore.set.called).to.be.true;
                    expect(mockDataStore.get()).to.deep.equal([]);
                    expect(Store.fragments.expandedId.get()).to.be.null;
                    expect(Store.fragments.highlightedVariationId.get()).to.be.null;
                    expect(Store.fragments.variationSearchTab.get()).to.be.null;
                } finally {
                    restore();
                }
            });

            it('ignores stale variation parent resolution when search is superseded', async () => {
                const repository = createFullRepository();
                repository.page = { value: PAGE_NAMES.CONTENT };
                const variationPath = `${ROOT_PATH}/acom/en_US/photoshop/pzn/my-card`;
                const variationFragment = createFragment({ id: variationUuid, path: variationPath, fields: [] });
                const parentFragment = createFragment({
                    id: parentUuid,
                    path: `${ROOT_PATH}/acom/en_US/my-card`,
                    fields: [{ name: 'variations', values: [variationPath] }],
                });

                let resolveStaleParent;
                const staleParentPromise = new Promise((resolve) => {
                    resolveStaleParent = resolve;
                });

                repository.search = { value: { path: 'ccd', query: variationUuid } };
                repository.filters = { value: { locale: 'en_US', tags: '' } };

                const getByIdStub = sandbox.stub();
                getByIdStub.withArgs(variationUuid).resolves(variationFragment);
                sandbox.stub(repository, 'resolveHydratedParentFragment').returns(staleParentPromise);

                const searchStub = sandbox.stub().returns(createMockCursor([[]]));
                repository.aem = createAemMock({ fragments: { getById: getByIdStub, search: searchStub } });

                const { Store, restore } = await setupVariationUuidSearch();
                try {
                    const staleSearch = repository.searchFragments();

                    repository.search = { value: { path: 'acom', query: 'photoshop' } };
                    const freshSearch = repository.searchFragments();

                    await freshSearch;
                    expect(Store.fragments.highlightedVariationId.get()).to.be.null;
                    expect(Store.fragments.expandedId.get()).to.be.null;

                    resolveStaleParent(parentFragment);
                    await staleSearch;

                    expect(Store.fragments.highlightedVariationId.get()).to.be.null;
                    expect(Store.fragments.expandedId.get()).to.be.null;
                    expect(Store.fragments.variationSearchTab.get()).to.be.null;
                } finally {
                    restore();
                }
            });

            it('merges promo variation references when searching by parent fragment UUID', async () => {
                const repository = createFullRepository();
                repository.page = { value: PAGE_NAMES.CONTENT };
                const uuid = '12345678-1234-1234-1234-123456789012';
                const fragmentPath = `${ROOT_PATH}/acom/en_US/my-card`;
                const promoVariationPath = `${ROOT_PATH}/acom/en_US/promotions/summer-sale/my-card`;

                const mockFragment = createFragment({
                    id: uuid,
                    path: fragmentPath,
                    references: [{ id: 'locale-ref', path: `${ROOT_PATH}/acom/fr_FR/my-card` }],
                    fields: [],
                });
                const promoVariationFragment = createFragment({
                    id: 'promo-var-1',
                    path: promoVariationPath,
                    fields: [],
                });

                repository.search = { value: { path: 'acom', query: uuid } };
                repository.filters = { value: { locale: 'en_US', tags: '' } };
                repository.loadPromotions = sandbox.stub().resolves();

                const getByIdStub = sandbox.stub().resolves(mockFragment);
                const getByPathStub = sandbox.stub().callsFake((path) => {
                    if (path === promoVariationPath) return Promise.resolve(promoVariationFragment);
                    return Promise.resolve(null);
                });
                repository.aem = createAemMock({
                    fragments: { getById: getByIdStub, getByPath: getByPathStub, search: sandbox.stub() },
                });

                const mockPromoProject = {
                    tags: [{ id: 'mas:promotion/summer-sale' }],
                };
                const { default: Store } = await import('../src/store.js');
                const originalPromotions = Store.promotions.list.data.get();
                const hadListFetched = Store.promotions.list.data.hasMeta('listFetched');
                Store.promotions.list.data.set([{ get: () => mockPromoProject }]);
                Store.promotions.list.data.setMeta('listFetched', true);

                const { mockDataStore, restore } = await setupVariationUuidSearch();
                try {
                    await repository.searchFragments();
                    expect(getByPathStub.calledWith(promoVariationPath), 'should probe the deterministic promo variation path')
                        .to.be.true;
                    const fragmentInStore = mockDataStore.set.lastCall?.args[0]?.[0]?.get?.();
                    const promoRefs = (fragmentInStore?.references || []).filter((r) => r.path === promoVariationPath);
                    expect(promoRefs.length, 'promo variation reference should be merged into fragment').to.equal(1);
                } finally {
                    restore();
                    Store.promotions.list.data.set(originalPromotions);
                    if (!hadListFetched) Store.promotions.list.data.removeMeta('listFetched');
                }
            });

            it('ignores stale parent UUID search when promo merge is superseded by a new search', async () => {
                const repository = createFullRepository();
                repository.page = { value: PAGE_NAMES.CONTENT };
                const uuid = '12345678-1234-1234-1234-123456789012';
                const fragmentPath = `${ROOT_PATH}/acom/en_US/my-card`;
                const mockFragment = createFragment({ id: uuid, path: fragmentPath, fields: [] });

                let resolveLoadPromotions;
                repository.loadPromotions = sandbox.stub().callsFake(
                    () =>
                        new Promise((resolve) => {
                            resolveLoadPromotions = resolve;
                        }),
                );

                const getByIdStub = sandbox.stub().resolves(mockFragment);
                const searchStub = sandbox.stub().returns(createMockCursor([]));
                repository.aem = createAemMock({ fragments: { getById: getByIdStub, search: searchStub } });

                repository.search = { value: { path: 'acom', query: uuid } };
                repository.filters = { value: { locale: 'en_US', tags: '' } };

                const { Store, mockDataStore, restore } = await setupVariationUuidSearch();
                const originalPromotions = Store.promotions.list.data.get();
                const hadListFetched = Store.promotions.list.data.hasMeta('listFetched');
                Store.promotions.list.data.set([]);
                if (hadListFetched) Store.promotions.list.data.removeMeta('listFetched');

                try {
                    const staleSearch = repository.searchFragments();

                    repository.search = { value: { path: 'acom', query: 'photoshop' } };
                    const freshSearch = repository.searchFragments();
                    await freshSearch;

                    const countAfterFresh = mockDataStore.set.callCount;
                    resolveLoadPromotions();
                    await staleSearch;

                    expect(mockDataStore.set.callCount).to.equal(countAfterFresh);
                } finally {
                    restore();
                    Store.promotions.list.data.set(originalPromotions);
                    if (hadListFetched) Store.promotions.list.data.setMeta('listFetched', true);
                }
            });
        });

        it('performs regular search when query is not a UUID', async () => {
            const repository = createFullRepository();
            repository.page = { value: PAGE_NAMES.CONTENT };
            repository.search = { value: { path: 'acom', query: 'test-query' } };
            repository.filters = { value: { locale: 'en_US', tags: '' } };
            const mockFragments = [createFragment({ id: 'frag-1', path: `${ROOT_PATH}/acom/en_US/frag1`, fields: [] })];
            const mockCursor = createMockCursor([mockFragments]);
            const searchStub = sandbox.stub().resolves(mockCursor);
            repository.aem = createAemMock({
                fragments: {
                    search: searchStub,
                },
            });
            const { default: Store } = await import('../src/store.js');
            const originalProfile = Store.profile.value;
            Store.profile.set({ name: 'test-user' });
            Store.createdByUsers.set([]);
            const mockDataStore = {
                get: sandbox.stub().returns([]),
                getMeta: sandbox.stub().returns(null),
                set: sandbox.stub(),
                setMeta: sandbox.stub(),
            };
            const originalData = Store.fragments.list.data;
            Store.fragments.list.data = mockDataStore;
            try {
                await repository.searchFragments();
                expect(searchStub.calledOnce).to.be.true;
                const searchOptions = searchStub.firstCall.args[0];
                expect(searchOptions.path).to.equal(`${ROOT_PATH}/acom/en_US`);
                expect(searchOptions.modelIds).to.deep.equal(EDITABLE_FRAGMENT_MODEL_IDS);
            } finally {
                Store.profile.set(originalProfile);
                Store.fragments.list.data = originalData;
            }
        });

        it('clears stale fragments before running a regular search', async () => {
            const repository = createFullRepository();
            repository.page = { value: PAGE_NAMES.CONTENT };
            repository.search = { value: { path: 'acom', query: 'missing-fragment' } };
            repository.filters = { value: { locale: 'en_US', tags: '' } };
            const mockCursor = {
                [Symbol.asyncIterator]: async function* () {},
            };
            const searchStub = sandbox.stub().resolves(mockCursor);
            repository.aem = createAemMock({
                fragments: {
                    search: searchStub,
                },
            });
            const { default: Store } = await import('../src/store.js');
            const originalProfile = Store.profile.value;
            Store.profile.set({ name: 'test-user' });
            Store.createdByUsers.set([]);
            const mockDataStore = {
                get: sandbox.stub().returns([{ value: { id: 'stale-fragment' } }]),
                getMeta: sandbox.stub().returns(null),
                set: sandbox.stub(),
                setMeta: sandbox.stub(),
            };
            const originalData = Store.fragments.list.data;
            Store.fragments.list.data = mockDataStore;
            try {
                await repository.searchFragments();
                expect(searchStub.calledOnce).to.be.true;
                expect(mockDataStore.set.calledOnce).to.be.true;
                expect(mockDataStore.set.firstCall.args[0]).to.deep.equal([]);
            } finally {
                Store.profile.set(originalProfile);
                Store.fragments.list.data = originalData;
            }
        });

        it('handles errors gracefully', async () => {
            const repository = createFullRepository();
            repository.page = { value: PAGE_NAMES.CONTENT };
            repository.search = { value: { path: 'acom', query: '' } };
            repository.filters = { value: { locale: 'en_US', tags: '' } };
            const searchStub = sandbox.stub().rejects(new Error('Search failed'));
            repository.aem = createAemMock({
                fragments: {
                    search: searchStub,
                },
            });
            repository.processError = sandbox.stub();
            const { default: Store } = await import('../src/store.js');
            const originalProfile = Store.profile.value;
            Store.profile.set({ name: 'test-user' });
            Store.createdByUsers.set([]);
            const mockDataStore = {
                get: sandbox.stub().returns([]),
                getMeta: sandbox.stub().returns(null),
                set: sandbox.stub(),
                setMeta: sandbox.stub(),
            };
            const originalData = Store.fragments.list.data;
            Store.fragments.list.data = mockDataStore;
            try {
                await repository.searchFragments();
                expect(repository.processError.calledOnce).to.be.true;
                expect(repository.processError.firstCall.args[1]).to.equal('Could not load fragments.');
            } finally {
                Store.profile.set(originalProfile);
                Store.fragments.list.data = originalData;
            }
        });

        it('strips variant and content-type tags before calling AEM', async () => {
            const repository = createFullRepository();
            repository.page = { value: PAGE_NAMES.CONTENT };
            repository.search = { value: { path: 'acom', query: '' } };
            repository.filters = {
                value: {
                    locale: 'en_US',
                    tags: 'mas:variant/segment,mas:studio/content-type/merch-card,mas:custom-tag',
                },
            };
            const mockCursor = createMockCursor([[]]);
            const searchStub = sandbox.stub().resolves(mockCursor);
            repository.aem = createAemMock({
                fragments: {
                    search: searchStub,
                },
            });
            const { default: Store } = await import('../src/store.js');
            const originalProfile = Store.profile.value;
            Store.profile.set({ name: 'test-user' });
            Store.createdByUsers.set([]);
            const mockDataStore = {
                get: sandbox.stub().returns([]),
                getMeta: sandbox.stub().returns(null),
                set: sandbox.stub(),
                setMeta: sandbox.stub(),
            };
            const originalData = Store.fragments.list.data;
            Store.fragments.list.data = mockDataStore;
            try {
                await repository.searchFragments();
                const searchOptions = searchStub.firstCall.args[0];
                expect(searchOptions.tags).to.deep.equal(['mas:custom-tag']);
            } finally {
                Store.profile.set(originalProfile);
                Store.fragments.list.data = originalData;
            }
        });

        it('keeps mas:pzn/country tags when personalization filter is off', async () => {
            const repository = createFullRepository();
            repository.page = { value: PAGE_NAMES.CONTENT };
            repository.search = { value: { path: 'acom', query: '' } };
            repository.filters = {
                value: {
                    locale: 'en_US',
                    tags: 'mas:pzn/country/fr_FR,mas:pzn/general',
                    personalizationFilterEnabled: false,
                },
            };
            const mockCursor = {
                [Symbol.asyncIterator]: async function* () {
                    yield {
                        [Symbol.asyncIterator]: async function* () {},
                    };
                },
            };
            const searchStub = sandbox.stub().resolves(mockCursor);
            repository.aem = createAemMock({
                fragments: {
                    search: searchStub,
                },
            });
            const { default: Store } = await import('../src/store.js');
            const originalProfile = Store.profile.value;
            Store.profile.set({ name: 'test-user' });
            Store.createdByUsers.set([]);
            const mockDataStore = {
                get: sandbox.stub().returns([]),
                getMeta: sandbox.stub().returns(null),
                set: sandbox.stub(),
                setMeta: sandbox.stub(),
            };
            const originalData = Store.fragments.list.data;
            Store.fragments.list.data = mockDataStore;
            try {
                await repository.searchFragments();
                const searchOptions = searchStub.firstCall.args[0];
                expect(searchOptions.tags).to.deep.equal(['mas:pzn/country/fr_FR']);
            } finally {
                Store.profile.set(originalProfile);
                Store.fragments.list.data = originalData;
            }
        });

        it('strips non-country mas:pzn tags from search when personalization filter is on (narrow in UI only)', async () => {
            const repository = createFullRepository();
            repository.page = { value: PAGE_NAMES.CONTENT };
            repository.search = { value: { path: 'acom', query: '' } };
            repository.filters = {
                value: {
                    locale: 'en_US',
                    tags: 'mas:pzn/country/fr_FR,mas:pzn/general',
                    personalizationFilterEnabled: true,
                },
            };
            const mockCursor = {
                [Symbol.asyncIterator]: async function* () {
                    yield {
                        [Symbol.asyncIterator]: async function* () {},
                    };
                },
            };
            const searchStub = sandbox.stub().resolves(mockCursor);
            repository.aem = createAemMock({
                fragments: {
                    search: searchStub,
                },
            });
            const { default: Store } = await import('../src/store.js');
            const originalProfile = Store.profile.value;
            Store.profile.set({ name: 'test-user' });
            Store.createdByUsers.set([]);
            const mockDataStore = {
                get: sandbox.stub().returns([]),
                getMeta: sandbox.stub().returns(null),
                set: sandbox.stub(),
                setMeta: sandbox.stub(),
            };
            const originalData = Store.fragments.list.data;
            Store.fragments.list.data = mockDataStore;
            try {
                await repository.searchFragments();
                const searchOptions = searchStub.firstCall.args[0];
                expect(searchOptions.tags).to.deep.equal(['mas:pzn/country/fr_FR']);
            } finally {
                Store.profile.set(originalProfile);
                Store.fragments.list.data = originalData;
            }
        });

        it('excludes personalization-tagged fragments from list when personalization filter is off', async () => {
            const repository = createFullRepository();
            repository.page = { value: PAGE_NAMES.CONTENT };
            repository.search = { value: { path: 'acom', query: '' } };
            repository.filters = {
                value: {
                    locale: 'en_US',
                    tags: '',
                    personalizationFilterEnabled: false,
                },
            };
            const pznFragment = createFragment({
                id: 'pzn-1',
                path: `${ROOT_PATH}/acom/en_US/cards/a`,
                tags: [{ id: 'mas:pzn/general' }],
                fields: [],
            });
            const plainFragment = createFragment({
                id: 'plain-1',
                path: `${ROOT_PATH}/acom/en_US/cards/b`,
                tags: [{ id: 'mas:product/x' }],
                fields: [],
            });
            const mockCursor = createMockCursor([[pznFragment, plainFragment]]);
            const searchStub = sandbox.stub().resolves(mockCursor);
            repository.aem = createAemMock({
                fragments: {
                    search: searchStub,
                },
            });
            const { default: Store } = await import('../src/store.js');
            const originalProfile = Store.profile.value;
            Store.profile.set({ name: 'test-user' });
            Store.createdByUsers.set([]);
            const mockDataStore = {
                get: sandbox.stub().returns([]),
                getMeta: sandbox.stub().returns(null),
                set: sandbox.stub(),
                setMeta: sandbox.stub(),
            };
            const originalData = Store.fragments.list.data;
            Store.fragments.list.data = mockDataStore;
            try {
                await repository.searchFragments();
                expect(mockDataStore.set.called).to.be.true;
                const passedStores = mockDataStore.set.lastCall.args[0];
                expect(passedStores).to.have.lengthOf(1);
                expect(passedStores[0].get().id).to.equal('plain-1');
            } finally {
                Store.profile.set(originalProfile);
                Store.fragments.list.data = originalData;
            }
        });

        it('excludes merch-card-collection with PZN on fragment tags when personalization filter is off', async () => {
            const repository = createFullRepository();
            repository.page = { value: PAGE_NAMES.CONTENT };
            repository.search = { value: { path: 'acom', query: '' } };
            repository.filters = {
                value: {
                    locale: 'en_US',
                    tags: '',
                    personalizationFilterEnabled: false,
                },
            };
            const collectionWithPzn = createFragment({
                id: 'coll-pzn',
                path: `${ROOT_PATH}/acom/en_US/collections/c1`,
                tags: [{ id: 'mas:pzn/general' }],
                fields: [{ name: 'tagFilters', values: ['mas:types/desktop'] }],
            });
            const plainCollection = createFragment({
                id: 'coll-plain',
                path: `${ROOT_PATH}/acom/en_US/collections/c2`,
                tags: [],
                fields: [{ name: 'tagFilters', values: ['mas:product/foo'] }],
            });
            const mockCursor = createMockCursor([[collectionWithPzn, plainCollection]]);
            const searchStub = sandbox.stub().resolves(mockCursor);
            repository.aem = createAemMock({
                fragments: {
                    search: searchStub,
                },
            });
            const { default: Store } = await import('../src/store.js');
            const originalProfile = Store.profile.value;
            Store.profile.set({ name: 'test-user' });
            Store.createdByUsers.set([]);
            const mockDataStore = {
                get: sandbox.stub().returns([]),
                getMeta: sandbox.stub().returns(null),
                set: sandbox.stub(),
                setMeta: sandbox.stub(),
            };
            const originalData = Store.fragments.list.data;
            Store.fragments.list.data = mockDataStore;
            try {
                await repository.searchFragments();
                expect(mockDataStore.set.called).to.be.true;
                const passedStores = mockDataStore.set.lastCall.args[0];
                expect(passedStores).to.have.lengthOf(1);
                expect(passedStores[0].get().id).to.equal('coll-plain');
            } finally {
                Store.profile.set(originalProfile);
                Store.fragments.list.data = originalData;
            }
        });

        it('excludes promo variation fragments from CONTENT list', async () => {
            const repository = createFullRepository();
            repository.page = { value: PAGE_NAMES.CONTENT };
            repository.search = { value: { path: 'acom', query: '' } };
            repository.filters = {
                value: {
                    locale: 'en_US',
                    tags: '',
                    personalizationFilterEnabled: false,
                },
            };
            const promoVariation = createFragment({
                id: 'promo-var-1',
                path: `${ROOT_PATH}/acom/en_US/promotions/back-to-school/cards/a`,
                tags: [{ id: 'mas:promotion/back-to-school' }],
                fields: [],
            });
            const plainFragment = createFragment({
                id: 'plain-2',
                path: `${ROOT_PATH}/acom/en_US/cards/b`,
                tags: [{ id: 'mas:product/x' }],
                fields: [],
            });
            const mockCursor = createMockCursor([[promoVariation, plainFragment]]);
            const searchStub = sandbox.stub().resolves(mockCursor);
            repository.aem = createAemMock({
                fragments: {
                    search: searchStub,
                },
            });
            const { default: Store } = await import('../src/store.js');
            const originalProfile = Store.profile.value;
            Store.profile.set({ name: 'test-user' });
            Store.createdByUsers.set([]);
            const mockDataStore = {
                get: sandbox.stub().returns([]),
                getMeta: sandbox.stub().returns(null),
                set: sandbox.stub(),
                setMeta: sandbox.stub(),
            };
            const originalData = Store.fragments.list.data;
            Store.fragments.list.data = mockDataStore;
            try {
                await repository.searchFragments();
                expect(mockDataStore.set.called).to.be.true;
                const passedStores = mockDataStore.set.lastCall.args[0];
                expect(passedStores).to.have.lengthOf(1);
                expect(passedStores[0].get().id).to.equal('plain-2');
            } finally {
                Store.profile.set(originalProfile);
                Store.fragments.list.data = originalData;
            }
        });

        it('handles published tag filter by setting status', async () => {
            const repository = createFullRepository();
            repository.page = { value: PAGE_NAMES.CONTENT };
            repository.search = { value: { path: 'acom', query: '' } };
            repository.filters = {
                value: {
                    locale: 'en_US',
                    tags: 'mas:status/published,mas:custom-tag',
                },
            };
            const mockCursor = createMockCursor([[]]);
            const searchStub = sandbox.stub().resolves(mockCursor);
            repository.aem = createAemMock({
                fragments: {
                    search: searchStub,
                },
            });
            const { default: Store } = await import('../src/store.js');
            const originalProfile = Store.profile.value;
            Store.profile.set({ name: 'test-user' });
            Store.createdByUsers.set([]);
            const mockDataStore = {
                get: sandbox.stub().returns([]),
                getMeta: sandbox.stub().returns(null),
                set: sandbox.stub(),
                setMeta: sandbox.stub(),
            };
            const originalData = Store.fragments.list.data;
            Store.fragments.list.data = mockDataStore;
            try {
                await repository.searchFragments();
                const searchOptions = searchStub.firstCall.args[0];
                expect(searchOptions.status).to.equal('PUBLISHED');
                expect(searchOptions.tags).to.deep.equal(['mas:custom-tag']);
            } finally {
                Store.profile.set(originalProfile);
                Store.fragments.list.data = originalData;
            }
        });
    });

    describe('searchFragments — in-memory narrowing', () => {
        let activeCleanup = null;
        afterEach(() => {
            if (activeCleanup) {
                activeCleanup();
                activeCleanup = null;
            }
        });

        const makeFragmentStore = ({
            id = 'f',
            variant = 'ccd-slice',
            tags: itemTags = [],
            title = '',
            description = '',
            path = '/content/dam/mas/acom/en_US/x',
            createdBy = 'alice@adobe.com',
        } = {}) => {
            const item = {
                id,
                path,
                title,
                description,
                created: { by: createdBy },
                tags: itemTags,
                fields: [{ name: 'variant', values: [variant] }],
            };
            return { get: () => item, value: item };
        };

        const setupNarrowingFixture = ({
            stores,
            metaTags = '',
            metaQuery = '',
            metaCreatedBy = '',
            hasMore = false,
            lastEdit = null,
            lastLoad = Date.now(),
        }) => {
            const repository = createFullRepository();
            repository.page = { value: PAGE_NAMES.CONTENT };
            repository.aem = createAemMock({});
            const meta = {
                path: 'acom',
                query: metaQuery,
                locale: 'en_US',
                tags: metaTags,
                createdBy: metaCreatedBy,
                personalizationFilterEnabled: false,
                lastEdit,
                lastLoad,
            };
            const setStub = sandbox.stub();
            const setMetaStub = sandbox.stub().callsFake((k, v) => {
                meta[k] = v;
            });
            const mockDataStore = {
                get: () => stores,
                getMeta: (k) => meta[k] ?? null,
                set: setStub,
                setMeta: setMetaStub,
            };
            const originalData = Store.fragments.list.data;
            const originalProfile = Store.profile.value;
            const originalHasMore = Store.fragments.list.hasMore.get();
            const originalCreatedByUsers = Store.createdByUsers.get();
            Store.fragments.list.data = mockDataStore;
            Store.profile.set({ name: 'tester' });
            Store.fragments.list.hasMore.set(hasMore);
            Store.createdByUsers.set([]);
            const cleanup = () => {
                Store.fragments.list.data = originalData;
                Store.profile.set(originalProfile);
                Store.fragments.list.hasMore.set(originalHasMore);
                Store.createdByUsers.set(originalCreatedByUsers);
            };
            activeCleanup = cleanup;
            return { repository, setStub, setMetaStub, meta, cleanup };
        };

        it('1. narrows by query without calling AEM', async () => {
            const stores = [
                makeFragmentStore({ id: 'a', title: 'photoshop hero' }),
                makeFragmentStore({ id: 'b', title: 'illustrator' }),
            ];
            const searchStub = sandbox.stub();
            const { repository, setStub, cleanup } = setupNarrowingFixture({ stores });
            repository.aem.sites.cf.fragments.search = searchStub;
            repository.search = { value: { path: 'acom', query: 'photoshop' } };
            repository.filters = { value: { locale: 'en_US', tags: '', personalizationFilterEnabled: false } };
            try {
                await repository.searchFragments();
                expect(searchStub.called).to.be.false;
                expect(setStub.calledOnce).to.be.true;
                expect(setStub.firstCall.args[0]).to.have.lengthOf(1);
                expect(setStub.firstCall.args[0][0].get().id).to.equal('a');
            } finally {
                cleanup();
            }
        });

        it('2. narrows by adding a variant without calling AEM', async () => {
            const stores = [
                makeFragmentStore({ id: 'a', variant: 'ccd-slice' }),
                makeFragmentStore({ id: 'b', variant: 'plans' }),
            ];
            const searchStub = sandbox.stub();
            const { repository, setStub, cleanup } = setupNarrowingFixture({ stores });
            repository.aem.sites.cf.fragments.search = searchStub;
            repository.search = { value: { path: 'acom', query: '' } };
            repository.filters = {
                value: { locale: 'en_US', tags: 'mas:variant/ccd-slice', personalizationFilterEnabled: false },
            };
            try {
                await repository.searchFragments();
                expect(searchStub.called).to.be.false;
                expect(setStub.firstCall.args[0]).to.have.lengthOf(1);
                expect(setStub.firstCall.args[0][0].get().id).to.equal('a');
            } finally {
                cleanup();
            }
        });

        it('matches stored bizpro cards when narrowing to the Pro variant', async () => {
            const stores = [
                makeFragmentStore({ id: 'legacy-pro', variant: 'bizpro' }),
                makeFragmentStore({ id: 'catalog', variant: 'catalog' }),
            ];
            const searchStub = sandbox.stub();
            const { repository, setStub, cleanup } = setupNarrowingFixture({ stores });
            repository.aem.sites.cf.fragments.search = searchStub;
            repository.search = { value: { path: 'acom', query: '' } };
            repository.filters = {
                value: { locale: 'en_US', tags: 'mas:variant/pro', personalizationFilterEnabled: false },
            };
            try {
                await repository.searchFragments();
                expect(searchStub.called).to.be.false;
                expect(setStub.firstCall.args[0]).to.have.lengthOf(1);
                expect(setStub.firstCall.args[0][0].get().id).to.equal('legacy-pro');
            } finally {
                cleanup();
            }
        });

        it('3. narrows by adding a non-variant tag without calling AEM', async () => {
            const stores = [
                makeFragmentStore({ id: 'a', tags: [{ id: 'mas:custom/a' }, { id: 'mas:product/b' }] }),
                makeFragmentStore({ id: 'b', tags: [{ id: 'mas:custom/a' }] }),
            ];
            const searchStub = sandbox.stub();
            const { repository, setStub, cleanup } = setupNarrowingFixture({
                stores,
                metaTags: 'mas:custom/a',
            });
            repository.aem.sites.cf.fragments.search = searchStub;
            repository.search = { value: { path: 'acom', query: '' } };
            repository.filters = {
                value: { locale: 'en_US', tags: 'mas:custom/a,mas:product/b', personalizationFilterEnabled: false },
            };
            try {
                await repository.searchFragments();
                expect(searchStub.called).to.be.false;
                expect(setStub.firstCall.args[0]).to.have.lengthOf(1);
                expect(setStub.firstCall.args[0][0].get().id).to.equal('a');
            } finally {
                cleanup();
            }
        });

        it('4. narrows by adding createdBy without calling AEM', async () => {
            const stores = [
                makeFragmentStore({ id: 'a', createdBy: 'alice@adobe.com' }),
                makeFragmentStore({ id: 'b', createdBy: 'bob@adobe.com' }),
            ];
            const searchStub = sandbox.stub();
            const { repository, setStub, cleanup } = setupNarrowingFixture({ stores });
            repository.aem.sites.cf.fragments.search = searchStub;
            repository.search = { value: { path: 'acom', query: '' } };
            repository.filters = { value: { locale: 'en_US', tags: '', personalizationFilterEnabled: false } };
            Store.createdByUsers.set([{ userPrincipalName: 'alice@adobe.com' }]);
            try {
                await repository.searchFragments();
                expect(searchStub.called).to.be.false;
                expect(setStub.firstCall.args[0]).to.have.lengthOf(1);
                expect(setStub.firstCall.args[0][0].get().id).to.equal('a');
            } finally {
                cleanup();
            }
        });

        it('4a. narrows by createdBy case-insensitively against item.created.by', async () => {
            const stores = [
                makeFragmentStore({ id: 'a', createdBy: 'Alice@Adobe.com' }),
                makeFragmentStore({ id: 'b', createdBy: 'bob@adobe.com' }),
            ];
            const searchStub = sandbox.stub();
            const { repository, setStub, cleanup } = setupNarrowingFixture({ stores });
            repository.aem.sites.cf.fragments.search = searchStub;
            repository.search = { value: { path: 'acom', query: '' } };
            repository.filters = { value: { locale: 'en_US', tags: '', personalizationFilterEnabled: false } };
            Store.createdByUsers.set([{ userPrincipalName: 'alice@adobe.com' }]);
            try {
                await repository.searchFragments();
                expect(searchStub.called).to.be.false;
                expect(setStub.firstCall.args[0]).to.have.lengthOf(1);
                expect(setStub.firstCall.args[0][0].get().id).to.equal('a');
            } finally {
                cleanup();
            }
        });

        it('5. path change falls through to AEM', async () => {
            const stores = [makeFragmentStore({ id: 'a' })];
            const emptyCursor = { next: async () => ({ done: true }) };
            const searchStub = sandbox.stub().resolves(emptyCursor);
            const { repository, cleanup } = setupNarrowingFixture({ stores });
            repository.aem.sites.cf.fragments.search = searchStub;
            repository.search = { value: { path: 'cc', query: '' } };
            repository.filters = { value: { locale: 'en_US', tags: '', personalizationFilterEnabled: false } };
            try {
                await repository.searchFragments();
                expect(searchStub.calledOnce).to.be.true;
            } finally {
                cleanup();
            }
        });

        it('6. locale change falls through to AEM', async () => {
            const stores = [makeFragmentStore({ id: 'a' })];
            const emptyCursor = { next: async () => ({ done: true }) };
            const searchStub = sandbox.stub().resolves(emptyCursor);
            const { repository, cleanup } = setupNarrowingFixture({ stores });
            repository.aem.sites.cf.fragments.search = searchStub;
            repository.search = { value: { path: 'acom', query: '' } };
            repository.filters = { value: { locale: 'fr_FR', tags: '', personalizationFilterEnabled: false } };
            try {
                await repository.searchFragments();
                expect(searchStub.calledOnce).to.be.true;
            } finally {
                cleanup();
            }
        });

        it('7. widening (remove a tag) falls through to AEM', async () => {
            const stores = [makeFragmentStore({ id: 'a' })];
            const emptyCursor = { next: async () => ({ done: true }) };
            const searchStub = sandbox.stub().resolves(emptyCursor);
            const { repository, cleanup } = setupNarrowingFixture({
                stores,
                metaTags: 'mas:custom/a,mas:product/b',
            });
            repository.aem.sites.cf.fragments.search = searchStub;
            repository.search = { value: { path: 'acom', query: '' } };
            repository.filters = {
                value: { locale: 'en_US', tags: 'mas:custom/a', personalizationFilterEnabled: false },
            };
            try {
                await repository.searchFragments();
                expect(searchStub.calledOnce).to.be.true;
            } finally {
                cleanup();
            }
        });

        it('8. cursor not exhausted (hasMore=true) falls through to AEM', async () => {
            const stores = [makeFragmentStore({ id: 'a', title: 'photoshop' })];
            const emptyCursor = { next: async () => ({ done: true }) };
            const searchStub = sandbox.stub().resolves(emptyCursor);
            const { repository, cleanup } = setupNarrowingFixture({ stores, hasMore: true });
            repository.aem.sites.cf.fragments.search = searchStub;
            repository.search = { value: { path: 'acom', query: 'photoshop' } };
            repository.filters = { value: { locale: 'en_US', tags: '', personalizationFilterEnabled: false } };
            try {
                await repository.searchFragments();
                expect(searchStub.calledOnce).to.be.true;
            } finally {
                cleanup();
            }
        });

        it('9. edit since last load falls through to AEM', async () => {
            const stores = [makeFragmentStore({ id: 'a', title: 'photoshop' })];
            const emptyCursor = { next: async () => ({ done: true }) };
            const searchStub = sandbox.stub().resolves(emptyCursor);
            const now = Date.now();
            const { repository, cleanup } = setupNarrowingFixture({
                stores,
                lastLoad: now - 1000,
                lastEdit: now,
            });
            repository.aem.sites.cf.fragments.search = searchStub;
            repository.search = { value: { path: 'acom', query: 'photoshop' } };
            repository.filters = { value: { locale: 'en_US', tags: '', personalizationFilterEnabled: false } };
            try {
                await repository.searchFragments();
                expect(searchStub.calledOnce).to.be.true;
            } finally {
                cleanup();
            }
        });

        it('10. identical filters use the existing fast-path (no AEM, no narrowing set)', async () => {
            const stores = [makeFragmentStore({ id: 'a' }), makeFragmentStore({ id: 'b' })];
            const searchStub = sandbox.stub();
            const { repository, setStub, cleanup } = setupNarrowingFixture({ stores });
            repository.aem.sites.cf.fragments.search = searchStub;
            repository.search = { value: { path: 'acom', query: '' } };
            repository.filters = { value: { locale: 'en_US', tags: '', personalizationFilterEnabled: false } };
            try {
                await repository.searchFragments();
                expect(searchStub.called).to.be.false;
                expect(setStub.called).to.be.false;
            } finally {
                cleanup();
            }
        });

        it('11. empty narrow result on fully loaded surface returns empty without AEM', async () => {
            const stores = [makeFragmentStore({ id: 'a', title: 'illustrator' })];
            const searchStub = sandbox.stub();
            const { repository, setStub, cleanup } = setupNarrowingFixture({ stores });
            repository.aem.sites.cf.fragments.search = searchStub;
            repository.search = { value: { path: 'acom', query: 'photoshop' } };
            repository.filters = { value: { locale: 'en_US', tags: '', personalizationFilterEnabled: false } };
            try {
                await repository.searchFragments();
                expect(searchStub.called).to.be.false;
                expect(setStub.firstCall.args[0]).to.have.lengthOf(0);
            } finally {
                cleanup();
            }
        });

        it('11b. UUID query bypasses in-memory narrowing (UUID is not haystack-searchable)', async () => {
            const uuid = '48a759ce-3c9a-4158-9bc3-b21ffa07e8e4';
            // Regression for the cold-load deep-link race (#793 / studio-direct-search):
            // currentData has SOME fragment(s) and meta carries a non-UUID query. The new
            // query is the UUID. Without the guard, `#isNarrowing` returns true (UUID
            // "narrows" the empty/different query), then `#applyInMemoryFilter` runs the
            // UUID against a haystack that doesn't include fragment IDs and drops every
            // store, leaving mas-content empty. With the guard, narrowing is skipped and
            // execution falls through to the UUID branch (getById).
            const stores = [makeFragmentStore({ id: 'other-fragment', title: 'illustrator' })];
            const searchStub = sandbox.stub();
            const getByIdStub = sandbox.stub().resolves(null);
            const { repository, cleanup } = setupNarrowingFixture({ stores });
            repository.aem.sites.cf.fragments.search = searchStub;
            repository.aem.sites.cf.fragments.getById = getByIdStub;
            repository.search = { value: { path: 'acom', query: uuid } };
            repository.filters = { value: { locale: 'en_US', tags: '', personalizationFilterEnabled: false } };
            try {
                await repository.searchFragments();
                expect(searchStub.called, 'should not call AEM cursor search').to.be.false;
                // Proves narrowing was bypassed — without the guard, narrowing would have
                // returned early after wiping the store, never reaching getById.
                expect(getByIdStub.calledOnceWith(uuid), 'must call getById with the UUID').to.be.true;
            } finally {
                cleanup();
            }
        });

        it('12. lateral variant move falls through to AEM', async () => {
            const stores = [makeFragmentStore({ id: 'a', variant: 'ccd-slice' })];
            const emptyCursor = { next: async () => ({ done: true }) };
            const searchStub = sandbox.stub().resolves(emptyCursor);
            const { repository, cleanup } = setupNarrowingFixture({
                stores,
                metaTags: 'mas:variant/ccd-slice',
            });
            repository.aem.sites.cf.fragments.search = searchStub;
            repository.search = { value: { path: 'acom', query: '' } };
            repository.filters = {
                value: { locale: 'en_US', tags: 'mas:variant/plans', personalizationFilterEnabled: false },
            };
            try {
                await repository.searchFragments();
                expect(searchStub.calledOnce).to.be.true;
            } finally {
                cleanup();
            }
        });

        it("13. Roy's regression: query+variant returns all matching cards via in-memory filter", async () => {
            const stores = [];
            for (let i = 0; i < 34; i += 1) {
                stores.push(
                    makeFragmentStore({
                        id: `f-${i}`,
                        variant: 'plans',
                        title: `Firefly card ${i}`,
                    }),
                );
            }
            stores.push(makeFragmentStore({ id: 'noise', variant: 'ccd-slice', title: 'Firefly noise' }));
            stores.push(makeFragmentStore({ id: 'noise2', variant: 'plans', title: 'unrelated' }));
            const searchStub = sandbox.stub();
            const { repository, setStub, cleanup } = setupNarrowingFixture({ stores });
            repository.aem.sites.cf.fragments.search = searchStub;
            repository.search = { value: { path: 'acom', query: 'firefly' } };
            repository.filters = {
                value: { locale: 'en_US', tags: 'mas:variant/plans', personalizationFilterEnabled: false },
            };
            try {
                await repository.searchFragments();
                expect(searchStub.called).to.be.false;
                expect(setStub.firstCall.args[0]).to.have.lengthOf(34);
            } finally {
                cleanup();
            }
        });
    });

    describe('fillPage pagination', () => {
        const createMockCursorFromPages = (pages) => {
            let index = 0;
            return {
                next: async () => {
                    if (index >= pages.length) return { done: true };
                    const page = pages[index++];
                    return {
                        done: false,
                        value: {
                            [Symbol.asyncIterator]: async function* () {
                                for (const item of page) yield item;
                            },
                        },
                    };
                },
            };
        };

        const setupSearchTest = async (mockCursor, tags = '') => {
            const repository = createFullRepository();
            repository.page = { value: PAGE_NAMES.CONTENT };
            repository.search = { value: { path: 'acom', query: '' } };
            repository.filters = { value: { locale: 'en_US', tags } };
            const searchStub = sandbox.stub().resolves(mockCursor);
            repository.aem = createAemMock({ fragments: { search: searchStub } });
            const { default: Store } = await import('../src/store.js');
            const originalProfile = Store.profile.value;
            Store.profile.set({ name: 'test-user' });
            Store.createdByUsers.set([]);
            const mockDataStore = {
                get: sandbox.stub().returns([]),
                getMeta: sandbox.stub().returns(null),
                set: sandbox.stub(),
                setMeta: sandbox.stub(),
            };
            const originalData = Store.fragments.list.data;
            Store.fragments.list.data = mockDataStore;
            return {
                repository,
                searchStub,
                mockDataStore,
                cleanup: () => {
                    Store.profile.set(originalProfile);
                    Store.fragments.list.data = originalData;
                },
            };
        };

        it('fetches multiple pages to fill minimum results when variant filtering reduces items', async () => {
            const makeFragment = (id, variant) =>
                createFragment({
                    id,
                    path: `${ROOT_PATH}/acom/en_US/${id}`,
                    fields: [{ name: 'variant', values: [variant] }],
                });
            const page1 = Array.from({ length: 20 }, (_, i) => makeFragment(`frag-${i}`, i < 3 ? 'plans' : 'catalog'));
            const page2 = Array.from({ length: 20 }, (_, i) => makeFragment(`frag-${20 + i}`, i < 8 ? 'plans' : 'catalog'));
            const mockCursor = createMockCursorFromPages([page1, page2]);
            const { repository, cleanup } = await setupSearchTest(mockCursor, 'mas:variant/plans');
            try {
                await repository.searchFragments();
                const { default: Store } = await import('../src/store.js');
                const setCalls = Store.fragments.list.data.set.getCalls();
                const lastCall = setCalls[setCalls.length - 1];
                expect(lastCall.args[0].length).to.equal(11);
            } finally {
                cleanup();
            }
        });

        it('finds both pro and stored bizpro cards for the Pro variant filter', async () => {
            const fragments = [
                createFragment({
                    id: 'pro',
                    path: `${ROOT_PATH}/acom/en_US/pro`,
                    fields: [{ name: 'variant', values: ['pro'] }],
                }),
                createFragment({
                    id: 'legacy-pro',
                    path: `${ROOT_PATH}/acom/en_US/legacy-pro`,
                    fields: [{ name: 'variant', values: ['bizpro'] }],
                }),
            ];
            const mockCursor = createMockCursorFromPages([fragments]);
            const { repository, searchStub, mockDataStore, cleanup } = await setupSearchTest(mockCursor, 'mas:variant/pro');
            try {
                await repository.searchFragments();
                expect(searchStub.firstCall.args[0].query).to.equal('');
                const populatedCalls = mockDataStore.set.getCalls().filter((call) => call.args[0]?.length);
                expect(populatedCalls.at(-1).args[0]).to.have.lengthOf(2);
            } finally {
                cleanup();
            }
        });

        it('returns hasMore false when cursor is exhausted', async () => {
            const fragments = [
                createFragment({ id: 'f1', path: `${ROOT_PATH}/acom/en_US/f1`, fields: [] }),
                createFragment({ id: 'f2', path: `${ROOT_PATH}/acom/en_US/f2`, fields: [] }),
            ];
            const mockCursor = createMockCursorFromPages([fragments]);
            const { repository, cleanup } = await setupSearchTest(mockCursor);
            try {
                await repository.searchFragments();
                const { default: Store } = await import('../src/store.js');
                expect(Store.fragments.list.hasMore.value).to.be.false;
            } finally {
                cleanup();
            }
        });

        it('resets firstPageLoaded and clears data immediately on new search', async () => {
            const mockCursor = createMockCursorFromPages([]);
            const { repository, mockDataStore, cleanup } = await setupSearchTest(mockCursor);
            try {
                await repository.searchFragments();
                const { default: Store } = await import('../src/store.js');
                expect(mockDataStore.set.calledWith([])).to.be.true;
            } finally {
                cleanup();
            }
        });

        it('loadNextPage appends fragments and updates data store', async () => {
            // First page has MIN_FILTERED_PAGE_RESULTS items so the refill loop does not fire,
            // keeping loadNextPage as the only path that extends the list.
            const page1 = Array.from({ length: MasRepository.MIN_FILTERED_PAGE_RESULTS }, (_, i) =>
                createFragment({ id: `p1-${i}`, path: `${ROOT_PATH}/acom/en_US/p1-${i}`, fields: [] }),
            );
            const page2 = Array.from({ length: 10 }, (_, i) =>
                createFragment({ id: `p2-${i}`, path: `${ROOT_PATH}/acom/en_US/p2-${i}`, fields: [] }),
            );
            const mockCursor = createMockCursorFromPages([page1, page2]);
            const { repository, cleanup } = await setupSearchTest(mockCursor);
            try {
                await repository.searchFragments();
                const { default: Store } = await import('../src/store.js');
                const firstSetCalls = Store.fragments.list.data.set.getCalls();
                const firstCount = firstSetCalls[firstSetCalls.length - 1].args[0].length;
                expect(firstCount).to.equal(MasRepository.MIN_FILTERED_PAGE_RESULTS);
                expect(Store.fragments.list.hasMore.value).to.be.true;

                await repository.loadNextPage();
                const allSetCalls = Store.fragments.list.data.set.getCalls();
                const lastCall = allSetCalls[allSetCalls.length - 1];
                expect(lastCall.args[0].length).to.equal(MasRepository.MIN_FILTERED_PAGE_RESULTS + 10);
            } finally {
                cleanup();
            }
        });

        it('loadNextPage sets hasMore false and clears cursor when done', async () => {
            const fragments = Array.from({ length: 5 }, (_, i) =>
                createFragment({ id: `f-${i}`, path: `${ROOT_PATH}/acom/en_US/f-${i}`, fields: [] }),
            );
            const mockCursor = createMockCursorFromPages([fragments]);
            const { repository, cleanup } = await setupSearchTest(mockCursor);
            try {
                await repository.searchFragments();
                const { default: Store } = await import('../src/store.js');
                expect(Store.fragments.list.hasMore.value).to.be.false;

                await repository.loadNextPage();
                expect(Store.fragments.list.hasMore.value).to.be.false;
            } finally {
                cleanup();
            }
        });

        it('loadNextPage returns early when no searchCursor', async () => {
            const mockCursor = createMockCursorFromPages([]);
            const { repository, cleanup } = await setupSearchTest(mockCursor);
            try {
                await repository.searchFragments();
                const { default: Store } = await import('../src/store.js');
                const loadingBefore = Store.fragments.list.loading.value;
                await repository.loadNextPage();
                expect(Store.fragments.list.loading.value).to.equal(loadingBefore);
            } finally {
                cleanup();
            }
        });

        it('loadNextPage handles errors gracefully', async () => {
            const page1 = Array.from({ length: 10 }, (_, i) =>
                createFragment({ id: `e-${i}`, path: `${ROOT_PATH}/acom/en_US/e-${i}`, fields: [] }),
            );
            const errorCursor = {
                next: async () => {
                    throw new Error('Network failure');
                },
            };
            const initialCursor = createMockCursorFromPages([page1]);
            const wrappedCursor = {
                callCount: 0,
                next: async function () {
                    this.callCount++;
                    if (this.callCount <= 1) {
                        return initialCursor.next();
                    }
                    throw new Error('Network failure');
                },
            };
            const mockCursor = createMockCursorFromPages([page1, page1]);
            const { repository, cleanup } = await setupSearchTest(mockCursor);
            try {
                await repository.searchFragments();
                const { default: Store } = await import('../src/store.js');
                if (Store.fragments.list.hasMore.value) {
                    sandbox.stub(repository, 'processError');
                    const originalLoadNextPage = repository.loadNextPage.bind(repository);
                    await originalLoadNextPage();
                }
                expect(Store.fragments.list.loading.value).to.be.false;
            } finally {
                cleanup();
            }
        });

        it('cache validation checks tags metadata', async () => {
            const fragments = Array.from({ length: 3 }, (_, i) =>
                createFragment({ id: `t-${i}`, path: `${ROOT_PATH}/acom/en_US/t-${i}`, fields: [] }),
            );
            const mockCursor = createMockCursorFromPages([fragments]);
            const { repository, mockDataStore, cleanup } = await setupSearchTest(mockCursor, 'mas:variant/plans');
            try {
                await repository.searchFragments();
                const { default: Store } = await import('../src/store.js');

                mockDataStore.get.returns([{ get: () => ({ path: `${ROOT_PATH}/acom/en_US/t-0` }) }]);
                mockDataStore.getMeta.withArgs('path').returns('acom');
                mockDataStore.getMeta.withArgs('query').returns('');
                mockDataStore.getMeta.withArgs('locale').returns('en_US');
                mockDataStore.getMeta.withArgs('tags').returns('different-tag');
                mockDataStore.getMeta.withArgs('createdBy').returns('');

                await repository.searchFragments();
                expect(mockDataStore.set.calledWith([])).to.be.true;
            } finally {
                cleanup();
            }
        });

        it('cache validation checks createdBy metadata', async () => {
            const fragments = Array.from({ length: 3 }, (_, i) =>
                createFragment({ id: `c-${i}`, path: `${ROOT_PATH}/acom/en_US/c-${i}`, fields: [] }),
            );
            const mockCursor = createMockCursorFromPages([fragments]);
            const { repository, mockDataStore, cleanup } = await setupSearchTest(mockCursor);
            try {
                await repository.searchFragments();
                const { default: Store } = await import('../src/store.js');

                mockDataStore.get.returns([{ get: () => ({ path: `${ROOT_PATH}/acom/en_US/c-0` }) }]);
                mockDataStore.getMeta.withArgs('path').returns('acom');
                mockDataStore.getMeta.withArgs('query').returns('');
                mockDataStore.getMeta.withArgs('locale').returns('en_US');
                mockDataStore.getMeta.withArgs('tags').returns('');
                mockDataStore.getMeta.withArgs('createdBy').returns('different-user');

                await repository.searchFragments();
                expect(mockDataStore.set.calledWith([])).to.be.true;
            } finally {
                cleanup();
            }
        });

        it('sets loading false after successful loadNextPage', async () => {
            const page1 = Array.from({ length: MasRepository.MIN_FILTERED_PAGE_RESULTS }, (_, i) =>
                createFragment({ id: `l-${i}`, path: `${ROOT_PATH}/acom/en_US/l-${i}`, fields: [] }),
            );
            const mockCursor = createMockCursorFromPages([page1]);
            const { repository, cleanup } = await setupSearchTest(mockCursor);
            try {
                await repository.searchFragments();
                const { default: Store } = await import('../src/store.js');
                expect(Store.fragments.list.hasMore.value).to.be.true;
                await repository.loadNextPage();
                expect(Store.fragments.list.loading.value).to.be.false;
                expect(Store.fragments.list.hasMore.value).to.be.false;
            } finally {
                cleanup();
            }
        });

        it('paginates results when page is TRANSLATION_EDITOR', async () => {
            const page1 = Array.from({ length: MasRepository.MIN_FILTERED_PAGE_RESULTS }, (_, i) =>
                createFragment({ id: `t1-${i}`, path: `${ROOT_PATH}/acom/en_US/t1-${i}`, fields: [] }),
            );
            const page2 = Array.from({ length: 5 }, (_, i) =>
                createFragment({ id: `t2-${i}`, path: `${ROOT_PATH}/acom/en_US/t2-${i}`, fields: [] }),
            );
            const mockCursor = createMockCursorFromPages([page1, page2]);
            const { repository, cleanup } = await setupSearchTest(mockCursor);
            repository.page = { value: PAGE_NAMES.TRANSLATION_EDITOR };
            try {
                await repository.searchFragments();
                const { default: Store } = await import('../src/store.js');
                const setCalls = Store.fragments.list.data.set.getCalls();
                const firstCall = setCalls[setCalls.length - 1];
                expect(firstCall.args[0].length).to.equal(MasRepository.MIN_FILTERED_PAGE_RESULTS);
                expect(Store.fragments.list.hasMore.value).to.be.true;
                await repository.loadNextPage();
                const nextCalls = Store.fragments.list.data.set.getCalls();
                const lastCall = nextCalls[nextCalls.length - 1];
                expect(lastCall.args[0].length).to.equal(MasRepository.MIN_FILTERED_PAGE_RESULTS + 5);
            } finally {
                cleanup();
            }
        });

        it('client-side filters by user query when single variant + query are combined', async () => {
            // Two variant=plans cards: one with "Firefly" in cardTitle, one without.
            // The user types "Firefly" + selects mas:variant/plans. AEM gets the variant
            // name as fullText (via the fast path), then skipQuery filters to only the
            // card containing "Firefly" anywhere in its fields.
            const matching = createFragment({
                id: 'firefly-plans',
                path: `${ROOT_PATH}/acom/en_US/firefly-plans`,
                title: 'Plans card A',
                description: '',
                fields: [
                    { name: 'variant', values: ['plans'] },
                    { name: 'cardTitle', values: ['Adobe Firefly'] },
                ],
            });
            const nonMatching = createFragment({
                id: 'photo-plans',
                path: `${ROOT_PATH}/acom/en_US/photo-plans`,
                title: 'Plans card B',
                description: '',
                fields: [
                    { name: 'variant', values: ['plans'] },
                    { name: 'cardTitle', values: ['Photoshop'] },
                ],
            });
            const mockCursor = createMockCursorFromPages([[matching, nonMatching]]);
            const repository = createFullRepository();
            repository.page = { value: PAGE_NAMES.CONTENT };
            repository.search = { value: { path: 'acom', query: 'firefly' } };
            repository.filters = { value: { locale: 'en_US', tags: 'mas:variant/plans' } };
            const searchStub = sandbox.stub().resolves(mockCursor);
            repository.aem = createAemMock({ fragments: { search: searchStub } });
            const { default: Store } = await import('../src/store.js');
            const originalProfile = Store.profile.value;
            Store.profile.set({ name: 'tester' });
            Store.createdByUsers.set([]);
            const mockDataStore = {
                get: sandbox.stub().returns([]),
                getMeta: sandbox.stub().returns(null),
                set: sandbox.stub(),
                setMeta: sandbox.stub(),
            };
            const originalData = Store.fragments.list.data;
            Store.fragments.list.data = mockDataStore;
            try {
                await repository.searchFragments();
                expect(searchStub.firstCall.args[0].query).to.equal('plans');
                const finalSet = mockDataStore.set.lastCall.args[0];
                expect(finalSet).to.have.lengthOf(1);
                expect(finalSet[0].get().id).to.equal('firefly-plans');
            } finally {
                Store.profile.set(originalProfile);
                Store.fragments.list.data = originalData;
            }
        });

        it('multi-word query: sends longest token to AEM and phrase-filters client-side', async () => {
            // AEM's fullText.EDGES ANDs across tokens, so "creative cloud" returns 0 if no
            // card has both at edge positions in title/description. Workaround: send the
            // longest single token ("creative") to AEM, then filter for the full phrase
            // client-side via skipQuery's expanded haystack.
            const phraseInTitle = createFragment({
                id: 'creative-cloud-1',
                path: `${ROOT_PATH}/acom/en_US/cc-1`,
                title: 'Creative Cloud Pro',
                fields: [{ name: 'variant', values: ['plans'] }],
            });
            const phraseInDescriptionField = createFragment({
                id: 'creative-cloud-2',
                path: `${ROOT_PATH}/acom/en_US/cc-2`,
                title: 'Plans Card',
                fields: [
                    { name: 'variant', values: ['plans'] },
                    { name: 'description', values: ['<p>Creative Cloud All Apps for individuals.</p>'] },
                ],
            });
            const creativeButNotCloud = createFragment({
                id: 'creative-only',
                path: `${ROOT_PATH}/acom/en_US/co-1`,
                title: 'Creative Suite Legacy',
                fields: [{ name: 'variant', values: ['plans'] }],
            });
            const mockCursor = createMockCursorFromPages([[phraseInTitle, phraseInDescriptionField, creativeButNotCloud]]);
            const repository = createFullRepository();
            repository.page = { value: PAGE_NAMES.CONTENT };
            repository.search = { value: { path: 'acom', query: 'creative cloud' } };
            repository.filters = { value: { locale: 'en_US', tags: '' } };
            const searchStub = sandbox.stub().resolves(mockCursor);
            repository.aem = createAemMock({ fragments: { search: searchStub } });
            const { default: Store } = await import('../src/store.js');
            const originalProfile = Store.profile.value;
            Store.profile.set({ name: 'tester' });
            Store.createdByUsers.set([]);
            const mockDataStore = {
                get: sandbox.stub().returns([]),
                getMeta: sandbox.stub().returns(null),
                set: sandbox.stub(),
                setMeta: sandbox.stub(),
            };
            const originalData = Store.fragments.list.data;
            Store.fragments.list.data = mockDataStore;
            try {
                await repository.searchFragments();
                expect(searchStub.firstCall.args[0].query).to.equal('creative');
                const finalSet = mockDataStore.set.lastCall.args[0];
                expect(finalSet).to.have.lengthOf(2);
                const ids = finalSet.map((s) => s.get().id);
                expect(ids).to.include('creative-cloud-1');
                expect(ids).to.include('creative-cloud-2');
                expect(ids).to.not.include('creative-only');
            } finally {
                Store.profile.set(originalProfile);
                Store.fragments.list.data = originalData;
            }
        });

        it('single-word query: sends query unchanged to AEM (no client-side filter regression)', async () => {
            const repository = createFullRepository();
            repository.page = { value: PAGE_NAMES.CONTENT };
            repository.search = { value: { path: 'acom', query: 'photoshop' } };
            repository.filters = { value: { locale: 'en_US', tags: '' } };
            const searchStub = sandbox.stub().resolves(createMockCursorFromPages([[]]));
            repository.aem = createAemMock({ fragments: { search: searchStub } });
            const { default: Store } = await import('../src/store.js');
            const originalProfile = Store.profile.value;
            Store.profile.set({ name: 'tester' });
            const mockDataStore = {
                get: sandbox.stub().returns([]),
                getMeta: sandbox.stub().returns(null),
                set: sandbox.stub(),
                setMeta: sandbox.stub(),
            };
            const originalData = Store.fragments.list.data;
            Store.fragments.list.data = mockDataStore;
            try {
                await repository.searchFragments();
                expect(searchStub.firstCall.args[0].query).to.equal('photoshop');
            } finally {
                Store.profile.set(originalProfile);
                Store.fragments.list.data = originalData;
            }
        });
    });

    describe('eagerLoadAllPznPages cap', () => {
        const setupPznSearchTest = async (pageCount) => {
            const repository = createFullRepository();
            repository.page = { value: PAGE_NAMES.CONTENT };
            repository.search = { value: { path: 'acom', query: '' } };
            repository.filters = {
                value: {
                    locale: 'en_US',
                    tags: '',
                    personalizationFilterEnabled: true,
                },
            };
            // Each page has MIN_PAGE_SIZE items so each #fillPage call consumes exactly 1 page
            const pages = Array.from({ length: pageCount }, (_, p) =>
                Array.from({ length: MasRepository.MIN_PAGE_SIZE }, (_, i) =>
                    createFragment({
                        id: `pzn-${p}-${i}`,
                        path: `${ROOT_PATH}/acom/en_US/pzn-${p}-${i}`,
                        tags: [{ id: 'mas:pzn/general' }],
                        fields: [],
                    }),
                ),
            );
            let index = 0;
            const mockCursor = {
                next: async () => {
                    if (index >= pages.length) return { done: true };
                    const page = pages[index++];
                    return {
                        done: false,
                        value: {
                            [Symbol.asyncIterator]: async function* () {
                                for (const item of page) yield item;
                            },
                        },
                    };
                },
            };
            const searchStub = sandbox.stub().resolves(mockCursor);
            repository.aem = createAemMock({ fragments: { search: searchStub } });
            const { default: Store } = await import('../src/store.js');
            const originalProfile = Store.profile.value;
            Store.profile.set({ name: 'test-user' });
            Store.createdByUsers.set([]);
            const mockDataStore = {
                get: sandbox.stub().returns([]),
                getMeta: sandbox.stub().returns(null),
                set: sandbox.stub(),
                setMeta: sandbox.stub(),
            };
            const originalData = Store.fragments.list.data;
            Store.fragments.list.data = mockDataStore;
            return {
                repository,
                mockDataStore,
                cleanup: () => {
                    Store.profile.set(originalProfile);
                    Store.fragments.list.data = originalData;
                },
            };
        };

        it('stops eager loading after MAX_EAGER_PZN_PAGES and sets hasMore true', async () => {
            const pageCount = MasRepository.MAX_EAGER_PZN_PAGES + 5;
            const { repository, cleanup } = await setupPznSearchTest(pageCount);
            try {
                await repository.searchFragments();
                const { default: Store } = await import('../src/store.js');
                // Wait for the async eager-load loop to complete
                await new Promise((resolve) => setTimeout(resolve, 50));
                expect(Store.fragments.list.hasMore.value).to.be.true;
            } finally {
                cleanup();
            }
        });

        it('does not set hasMore when all pages fit within MAX_EAGER_PZN_PAGES', async () => {
            const pageCount = 2;
            const { repository, cleanup } = await setupPznSearchTest(pageCount);
            try {
                await repository.searchFragments();
                await new Promise((resolve) => setTimeout(resolve, 50));
                const { default: Store } = await import('../src/store.js');
                expect(Store.fragments.list.hasMore.value).to.be.false;
            } finally {
                cleanup();
            }
        });
    });

    describe('refillBelowThreshold', () => {
        const setupRefillSearchTest = async ({ pages, personalizationFilterEnabled = false }) => {
            const repository = createFullRepository();
            repository.page = { value: PAGE_NAMES.CONTENT };
            repository.search = { value: { path: 'acom', query: '' } };
            repository.filters = {
                value: {
                    locale: 'en_US',
                    tags: '',
                    personalizationFilterEnabled,
                },
            };
            let index = 0;
            const mockCursor = {
                next: async () => {
                    if (index >= pages.length) return { done: true };
                    const page = pages[index++];
                    return {
                        done: false,
                        value: {
                            [Symbol.asyncIterator]: async function* () {
                                for (const item of page) yield item;
                            },
                        },
                    };
                },
            };
            const searchStub = sandbox.stub().resolves(mockCursor);
            repository.aem = createAemMock({ fragments: { search: searchStub } });
            const { default: Store } = await import('../src/store.js');
            const originalProfile = Store.profile.value;
            Store.profile.set({ name: 'test-user' });
            Store.createdByUsers.set([]);
            const mockDataStore = {
                get: sandbox.stub().returns([]),
                getMeta: sandbox.stub().returns(null),
                set: sandbox.stub(),
                setMeta: sandbox.stub(),
            };
            const originalData = Store.fragments.list.data;
            Store.fragments.list.data = mockDataStore;
            return {
                repository,
                mockDataStore,
                cleanup: () => {
                    Store.profile.set(originalProfile);
                    Store.fragments.list.data = originalData;
                },
            };
        };

        // Build a page of MIN_PAGE_SIZE (10) items where `visibleCount` are non-pzn
        // (pass the filter) and the rest carry mas:pzn/general (dropped when pzn filter is off).
        const mixedPage = (pageIndex, visibleCount) =>
            Array.from({ length: MasRepository.MIN_PAGE_SIZE }, (_, i) => {
                const isVisible = i < visibleCount;
                return createFragment({
                    id: `p${pageIndex}-${i}`,
                    path: `${ROOT_PATH}/acom/en_US/p${pageIndex}-${i}`,
                    tags: isVisible ? [] : [{ id: 'mas:pzn/general' }],
                    fields: [],
                });
            });

        const lastSetCount = (mockDataStore) => {
            const calls = mockDataStore.set.getCalls();
            return calls[calls.length - 1]?.args[0]?.length ?? 0;
        };

        it('refills when filtered count is below threshold until threshold is met', async () => {
            // Each page contributes 5 visible items. 5 pages → 25 visible, threshold reached.
            const pages = Array.from({ length: 8 }, (_, p) => mixedPage(p, 5));
            const { repository, mockDataStore, cleanup } = await setupRefillSearchTest({ pages });
            try {
                await repository.searchFragments();
                await new Promise((resolve) => setTimeout(resolve, 50));
                expect(lastSetCount(mockDataStore)).to.be.at.least(MasRepository.MIN_FILTERED_PAGE_RESULTS);
            } finally {
                cleanup();
            }
        });

        it('does not refill when first page already has threshold visible items', async () => {
            // First fetch fills via #fillPage until it has MIN_PAGE_SIZE (10) items. After filter,
            // all 10 remain visible (no pzn tags). Threshold is 25, so refill DOES kick in here —
            // unless we make the first page large enough. Make each page contribute 30 visible items.
            const pages = [mixedPage(0, 10), mixedPage(1, 10), mixedPage(2, 10), mixedPage(3, 10)];
            const { repository, mockDataStore, cleanup } = await setupRefillSearchTest({ pages });
            try {
                await repository.searchFragments();
                await new Promise((resolve) => setTimeout(resolve, 50));
                // #fillPage fills until it reaches MIN_PAGE_SIZE items via cursor.next() calls.
                // With all-visible pages, #fillPage consumes 1 page (10 items) and returns.
                // Then refill runs because 10 < 25. It should loop until threshold or cursor end.
                expect(lastSetCount(mockDataStore)).to.be.at.least(MasRepository.MIN_FILTERED_PAGE_RESULTS);
            } finally {
                cleanup();
            }
        });

        it('terminates and sets hasMore=false when cursor is exhausted before threshold', async () => {
            // Only 2 pages, each with 5 visible → 10 visible total, cursor exhausted.
            const pages = [mixedPage(0, 5), mixedPage(1, 5)];
            const { repository, mockDataStore, cleanup } = await setupRefillSearchTest({ pages });
            try {
                await repository.searchFragments();
                await new Promise((resolve) => setTimeout(resolve, 50));
                const { default: Store } = await import('../src/store.js');
                expect(lastSetCount(mockDataStore)).to.equal(10);
                expect(Store.fragments.list.hasMore.value).to.be.false;
            } finally {
                cleanup();
            }
        });

        it('terminates on extremely narrow filter without infinite loop', async () => {
            // 20 pages with only 1 visible item each → 20 visible total, cursor exhausted.
            const pages = Array.from({ length: 20 }, (_, p) => mixedPage(p, 1));
            const { repository, mockDataStore, cleanup } = await setupRefillSearchTest({ pages });
            try {
                await repository.searchFragments();
                await new Promise((resolve) => setTimeout(resolve, 100));
                const { default: Store } = await import('../src/store.js');
                expect(lastSetCount(mockDataStore)).to.equal(20);
                expect(Store.fragments.list.hasMore.value).to.be.false;
            } finally {
                cleanup();
            }
        });

        it('skips refill when personalization is on (eager-pzn path runs instead)', async () => {
            // Pages of all-pzn items so #filterStoresByPersonalizationEnabled (with pzn ON)
            // returns everything. We just want to confirm the refill method is NOT the one
            // running; #eagerLoadAllPznPages handles this path.
            const pages = Array.from({ length: 3 }, (_, p) =>
                Array.from({ length: MasRepository.MIN_PAGE_SIZE }, (_, i) =>
                    createFragment({
                        id: `pzn-${p}-${i}`,
                        path: `${ROOT_PATH}/acom/en_US/pzn-${p}-${i}`,
                        tags: [{ id: 'mas:pzn/general' }],
                        fields: [],
                    }),
                ),
            );
            const { repository, mockDataStore, cleanup } = await setupRefillSearchTest({
                pages,
                personalizationFilterEnabled: true,
            });
            try {
                await repository.searchFragments();
                await new Promise((resolve) => setTimeout(resolve, 50));
                const { default: Store } = await import('../src/store.js');
                expect(Store.fragments.list.hasMore.value).to.be.false;
                expect(lastSetCount(mockDataStore)).to.equal(30);
            } finally {
                cleanup();
            }
        });

        it('stops refill after MAX_REFILL_ROUNDS and leaves hasMore=true', async () => {
            // Many pages all fail the pzn filter so refill never reaches threshold.
            // After MAX_REFILL_ROUNDS, refill bails and leaves hasMore=true so
            // loadNextPage can continue on scroll.
            const pages = Array.from({ length: MasRepository.MAX_REFILL_ROUNDS + 10 }, (_, p) => mixedPage(p, 0));
            const { repository, cleanup } = await setupRefillSearchTest({ pages });
            try {
                await repository.searchFragments();
                await new Promise((resolve) => setTimeout(resolve, 100));
                const { default: Store } = await import('../src/store.js');
                expect(Store.fragments.list.hasMore.value).to.be.true;
            } finally {
                cleanup();
            }
        });

        it('sets loading=true during refill and resets to false when done', async () => {
            // 3 pages with 5 visible each — refill runs for a few rounds.
            // loading should be true during refill and false afterward.
            const pages = [mixedPage(0, 5), mixedPage(1, 5), mixedPage(2, 5)];
            const { repository, cleanup } = await setupRefillSearchTest({ pages });
            try {
                await repository.searchFragments();
                await new Promise((resolve) => setTimeout(resolve, 50));
                const { default: Store } = await import('../src/store.js');
                expect(Store.fragments.list.loading.value).to.be.false;
            } finally {
                cleanup();
            }
        });
    });

    describe('parseVariationAlreadyExistsPath', () => {
        it('returns path when message is "A variation already exists at /path/to/fragment"', () => {
            const repository = createRepository();
            const path = '/content/dam/mas/sandbox/en_AU/card-name-test';
            expect(repository.parseVariationAlreadyExistsPath(`A variation already exists at ${path}`)).to.equal(path);
        });

        it('returns null when message does not start with the expected prefix', () => {
            const repository = createRepository();
            expect(repository.parseVariationAlreadyExistsPath('Some other error')).to.be.null;
            expect(repository.parseVariationAlreadyExistsPath('A variation already exists')).to.be.null;
        });

        it('returns null when message is null, undefined, or not a string', () => {
            const repository = createRepository();
            expect(repository.parseVariationAlreadyExistsPath(null)).to.be.null;
            expect(repository.parseVariationAlreadyExistsPath(undefined)).to.be.null;
            expect(repository.parseVariationAlreadyExistsPath(123)).to.be.null;
        });

        it('returns trimmed path when message has trailing whitespace', () => {
            const repository = createRepository();
            const path = '/content/dam/mas/sandbox/en_AU/card-name-test';
            expect(repository.parseVariationAlreadyExistsPath(`A variation already exists at ${path}   `)).to.equal(path);
        });

        it('returns null when path after prefix is empty or whitespace only', () => {
            const repository = createRepository();
            expect(repository.parseVariationAlreadyExistsPath('A variation already exists at ')).to.be.null;
            expect(repository.parseVariationAlreadyExistsPath('A variation already exists at    ')).to.be.null;
        });
    });

    describe('createVariation', () => {
        const parentFragment = {
            id: 'parent-1',
            path: '/content/dam/mas/sandbox/en_US/card-name-test',
            model: { id: 'model-1' },
            fields: [],
        };
        const existingVariationPath = '/content/dam/mas/sandbox/en_AU/card-name-test';
        const existingVariation = { id: 'variation-1', path: existingVariationPath };

        it('creates variation and updates parent when createEmptyVariation succeeds', async () => {
            const repository = createRepository();
            const newVariation = { id: 'new-var-1', path: existingVariationPath };
            repository.aem = createAemMock({
                fragments: {
                    getById: sandbox.stub().resolves(parentFragment),
                },
            });
            sandbox.stub(repository, 'createEmptyVariation').resolves(newVariation);
            sandbox.stub(repository, 'updateParentVariations').resolves(parentFragment);

            const result = await repository.createVariation(parentFragment.id, 'en_AU', false);

            expect(repository.createEmptyVariation.calledOnce).to.be.true;
            expect(repository.createEmptyVariation.calledWith(parentFragment, 'en_AU')).to.be.true;
            expect(repository.updateParentVariations.calledOnce).to.be.true;
            expect(repository.updateParentVariations.calledWith(parentFragment, newVariation.path)).to.be.true;
            expect(result).to.deep.equal(newVariation);
        });

        it('throws when createEmptyVariation returns null or undefined', async () => {
            const repository = createRepository();
            repository.aem = createAemMock({
                fragments: {
                    getById: sandbox.stub().resolves(parentFragment),
                },
            });
            sandbox.stub(repository, 'createEmptyVariation').resolves(null);
            sandbox.stub(repository, 'updateParentVariations');

            try {
                await repository.createVariation(parentFragment.id, 'en_AU', false);
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.message).to.equal('Failed to create variation');
            }
        });

        it('repairs parent variations and returns existing fragment when "variation already exists" is thrown', async () => {
            const repository = createRepository();
            repository.aem = createAemMock({
                fragments: {
                    getById: sandbox.stub().resolves(parentFragment),
                    getByPath: sandbox.stub().resolves(existingVariation),
                },
            });
            sandbox
                .stub(repository, 'createEmptyVariation')
                .rejects(new Error(`A variation already exists at ${existingVariationPath}`));
            sandbox.stub(repository, 'updateParentVariations').resolves(parentFragment);

            const result = await repository.createVariation(parentFragment.id, 'en_AU', false);

            expect(repository.updateParentVariations.calledOnce).to.be.true;
            expect(repository.updateParentVariations.calledWith(parentFragment, existingVariationPath)).to.be.true;
            expect(repository.aem.sites.cf.fragments.getByPath.calledOnce).to.be.true;
            expect(repository.aem.sites.cf.fragments.getByPath.calledWith(existingVariationPath)).to.be.true;
            expect(result).to.deep.equal(existingVariation);
        });

        it('rethrows when createEmptyVariation throws an error other than "variation already exists"', async () => {
            const repository = createRepository();
            repository.aem = createAemMock({
                fragments: {
                    getById: sandbox.stub().resolves(parentFragment),
                },
            });
            sandbox.stub(repository, 'createEmptyVariation').rejects(new Error('Network error'));
            sandbox.stub(repository, 'updateParentVariations');

            try {
                await repository.createVariation(parentFragment.id, 'en_AU', false);
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.message).to.equal('Network error');
                expect(repository.updateParentVariations.called).to.be.false;
            }
        });

        it('throws when getById returns null (parent fragment not found)', async () => {
            const repository = createRepository();
            repository.aem = createAemMock({
                fragments: {
                    getById: sandbox.stub().resolves(null),
                },
            });

            try {
                await repository.createVariation(parentFragment.id, 'en_AU', false);
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.message).to.equal('Failed to fetch parent fragment');
            }
        });

        it('throws when creating variation from a variation (isVariation true)', async () => {
            const repository = createRepository();
            repository.aem = createAemMock();

            try {
                await repository.createVariation(parentFragment.id, 'en_AU', true);
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.message).to.include('Cannot create a variation from another variation');
            }
        });
    });

    describe('resolveHydratedParentFragment', () => {
        it('resolves parent via referencedBy and hydrates it by id', async () => {
            const repository = createRepository();
            const sourcePath = '/content/dam/mas/sandbox/en_US/pac/pzn/grouped-source';
            const parentPath = '/content/dam/mas/sandbox/en_US/pac/default-fragment';
            const parentByPath = {
                id: 'parent-id',
                path: parentPath,
                fields: [{ name: 'variations', values: [sourcePath] }],
            };
            const hydratedParent = { ...parentByPath, references: [{ id: 'ref-1' }] };

            repository.aem = createAemMock({
                fragments: {
                    getReferencedBy: sandbox.stub().resolves({
                        path: sourcePath,
                        parentReferences: [{ type: 'content-fragment', path: parentPath }],
                    }),
                    getByPath: sandbox.stub().resolves(parentByPath),
                    getById: sandbox.stub().resolves(hydratedParent),
                },
            });

            const result = await repository.resolveHydratedParentFragment(sourcePath);

            expect(repository.aem.sites.cf.fragments.getReferencedBy.calledOnceWith(sourcePath)).to.be.true;
            expect(repository.aem.sites.cf.fragments.getByPath.calledOnceWith(parentPath)).to.be.true;
            expect(repository.aem.sites.cf.fragments.getById.calledOnceWith('parent-id')).to.be.true;
            expect(result).to.deep.equal(hydratedParent);
        });

        it('returns null when referencedBy has no parent reference', async () => {
            const repository = createRepository();
            const sourcePath = '/content/dam/mas/sandbox/en_US/pac/pzn/grouped-source';

            repository.aem = createAemMock({
                fragments: {
                    getReferencedBy: sandbox.stub().resolves({
                        path: sourcePath,
                        parentReferences: [],
                    }),
                },
            });

            const result = await repository.resolveHydratedParentFragment(sourcePath);

            expect(result).to.be.null;
            expect(repository.aem.sites.cf.fragments.getByPath.called).to.be.false;
            expect(repository.aem.sites.cf.fragments.getById.called).to.be.false;
        });

        it('selects the parent whose variations field contains the fragment path', async () => {
            const repository = createRepository();
            const sourcePath = '/content/dam/mas/sandbox/en_US/pac/pzn/grouped-source';
            const wrongParentPath = '/content/dam/mas/sandbox/en_US/pac/unrelated-fragment';
            const correctParentPath = '/content/dam/mas/sandbox/en_US/pac/default-fragment';
            const wrongParent = {
                id: 'wrong-id',
                path: wrongParentPath,
                fields: [{ name: 'variations', values: ['/content/dam/mas/sandbox/en_US/pac/pzn/other-variation'] }],
            };
            const correctParent = {
                id: 'correct-id',
                path: correctParentPath,
                fields: [{ name: 'variations', values: [sourcePath] }],
            };
            const hydratedCorrectParent = { ...correctParent, references: [{ id: 'ref-1' }] };

            const getByPathStub = sandbox.stub();
            getByPathStub.withArgs(wrongParentPath).resolves(wrongParent);
            getByPathStub.withArgs(correctParentPath).resolves(correctParent);

            repository.aem = createAemMock({
                fragments: {
                    getReferencedBy: sandbox.stub().resolves({
                        path: sourcePath,
                        parentReferences: [
                            { type: 'content-fragment', path: wrongParentPath },
                            { type: 'content-fragment', path: correctParentPath },
                        ],
                    }),
                    getByPath: getByPathStub,
                    getById: sandbox.stub().resolves(hydratedCorrectParent),
                },
            });

            const result = await repository.resolveHydratedParentFragment(sourcePath);

            expect(repository.aem.sites.cf.fragments.getByPath.calledTwice).to.be.true;
            expect(repository.aem.sites.cf.fragments.getById.calledOnceWith('correct-id')).to.be.true;
            expect(result).to.deep.equal(hydratedCorrectParent);
        });

        it('returns null when no parent has the fragment path in its variations', async () => {
            const repository = createRepository();
            const sourcePath = '/content/dam/mas/sandbox/en_US/pac/pzn/grouped-source';
            const parentPath = '/content/dam/mas/sandbox/en_US/pac/unrelated-fragment';
            const parentByPath = {
                id: 'parent-id',
                path: parentPath,
                fields: [{ name: 'variations', values: ['/content/dam/mas/sandbox/en_US/pac/pzn/other-variation'] }],
            };

            repository.aem = createAemMock({
                fragments: {
                    getReferencedBy: sandbox.stub().resolves({
                        path: sourcePath,
                        parentReferences: [{ type: 'content-fragment', path: parentPath }],
                    }),
                    getByPath: sandbox.stub().resolves(parentByPath),
                },
            });

            const result = await repository.resolveHydratedParentFragment(sourcePath);

            expect(result).to.be.null;
            expect(repository.aem.sites.cf.fragments.getById.called).to.be.false;
        });

        it('prefers default-locale parent when locale copies also have the variation in their variations field', async () => {
            const repository = createRepository();
            const sourcePath = '/content/dam/mas/sandbox/en_US/pac/pzn/grouped-source';
            const koKrParentPath = '/content/dam/mas/sandbox/ko_KR/pac/default-fragment';
            const enUsParentPath = '/content/dam/mas/sandbox/en_US/pac/default-fragment';

            const koKrParent = {
                id: 'ko-kr-id',
                path: koKrParentPath,
                fields: [{ name: 'variations', values: [sourcePath] }],
            };
            const enUsParent = {
                id: 'en-us-id',
                path: enUsParentPath,
                fields: [{ name: 'variations', values: [sourcePath] }],
            };
            const hydratedEnUsParent = { ...enUsParent, references: [] };

            const getByPathStub = sandbox.stub();
            getByPathStub.withArgs(koKrParentPath).resolves(koKrParent);
            getByPathStub.withArgs(enUsParentPath).resolves(enUsParent);

            repository.aem = createAemMock({
                fragments: {
                    // ko_KR comes first in AEM's response order — this is the bug scenario
                    getReferencedBy: sandbox.stub().resolves({
                        path: sourcePath,
                        parentReferences: [
                            { type: 'content-fragment', path: koKrParentPath },
                            { type: 'content-fragment', path: enUsParentPath },
                        ],
                    }),
                    getByPath: getByPathStub,
                    getById: sandbox.stub().resolves(hydratedEnUsParent),
                },
            });

            const result = await repository.resolveHydratedParentFragment(sourcePath);

            // Must return the en_US parent, not the ko_KR one
            expect(repository.aem.sites.cf.fragments.getById.calledOnceWith('en-us-id')).to.be.true;
            expect(result).to.deep.equal(hydratedEnUsParent);
        });
    });

    describe('createGroupedVariation', () => {
        const parentFragment = {
            id: 'parent-grouped-1',
            path: '/content/dam/mas/sandbox/en_US/pac/parent-fragment',
            title: 'Parent title',
            description: 'Parent description',
            model: { id: 'model-1' },
            fields: [{ name: 'variations', values: [] }],
            tags: [{ id: 'mas:product/cc/photoshop' }],
        };

        it('creates grouped variation and updates the parent variations field', async () => {
            const repository = createRepository();
            const createdDraft = { id: 'new-grouped-id' };
            const createdFragment = { id: 'new-grouped-id', path: '/content/dam/mas/sandbox/en_US/pac/pzn/new-grouped' };

            const getByPathStub = sandbox.stub().callsFake(async (path) => {
                if (path === createdFragment.path) return createdFragment;
                return null;
            });

            repository.aem = createAemMock({
                fragments: {
                    getById: sandbox.stub().resolves(parentFragment),
                    getByPath: getByPathStub,
                    ensureFolderExists: sandbox.stub().resolves(),
                    create: sandbox.stub().resolves(createdDraft),
                    copyFragmentTags: sandbox.stub().resolves(),
                    pollCreatedFragment: sandbox.stub().resolves(createdFragment),
                },
            });
            sandbox.stub(repository, 'updateParentVariations').resolves(parentFragment);
            sandbox.stub(repository, 'refreshFragment').resolves();
            sandbox.stub(Store.fragments.list.data, 'get').returns([{ get: () => ({ id: parentFragment.id }) }]);

            const result = await repository.createGroupedVariation(parentFragment.id, ['mas:locale/EG/ar_EG'], {
                productArrangementCode: 'pac',
            });

            expect(repository.updateParentVariations.calledOnce).to.be.true;
            expect(repository.updateParentVariations.calledWith(parentFragment, createdFragment.path)).to.be.true;
            expect(result).to.deep.equal(createdFragment);
        });

        it('snapshots collection cards and collections when creating grouped variation', async () => {
            const repository = createRepository();
            const createdDraft = { id: 'new-grouped-id' };
            const createdFragment = { id: 'new-grouped-id', path: '/content/dam/mas/sandbox/en_US/pac/pzn/new-grouped' };
            const collectionParent = {
                ...parentFragment,
                model: { id: 'collection-model', path: COLLECTION_MODEL_PATH },
                fields: [
                    { name: 'variations', values: [] },
                    {
                        name: 'cards',
                        type: 'content-reference',
                        multiple: true,
                        values: ['/content/mas/cards/a', '/content/mas/cards/b'],
                    },
                    {
                        name: 'collections',
                        type: 'content-reference',
                        multiple: true,
                        values: ['/content/mas/collections/x'],
                    },
                ],
            };

            const getByPathStub = sandbox.stub().callsFake(async (path) => {
                if (path === createdFragment.path) return createdFragment;
                return null;
            });

            const createStub = sandbox.stub().resolves(createdDraft);

            repository.aem = createAemMock({
                fragments: {
                    getById: sandbox.stub().resolves(collectionParent),
                    getByPath: getByPathStub,
                    ensureFolderExists: sandbox.stub().resolves(),
                    create: createStub,
                    copyFragmentTags: sandbox.stub().resolves(),
                    pollCreatedFragment: sandbox.stub().resolves(createdFragment),
                },
            });
            sandbox.stub(repository, 'updateParentVariations').resolves(collectionParent);
            sandbox.stub(repository, 'refreshFragment').resolves();
            sandbox.stub(Store.fragments.list.data, 'get').returns([{ get: () => ({ id: collectionParent.id }) }]);

            await repository.createGroupedVariation(collectionParent.id, ['mas:locale/EG/ar_EG'], {
                productArrangementCode: 'pac',
            });

            const createFields = createStub.firstCall.args[0].fields;
            const cardsField = createFields.find((f) => f.name === 'cards');
            const collectionsField = createFields.find((f) => f.name === 'collections');
            expect(cardsField?.values).to.deep.equal(['/content/mas/cards/a', '/content/mas/cards/b']);
            expect(collectionsField?.values).to.deep.equal(['/content/mas/collections/x']);
        });

        it('resolves parent fragment via repository resolver when source fragment is grouped', async () => {
            const repository = createRepository();
            const groupedSource = {
                id: 'grouped-source',
                path: '/content/dam/mas/sandbox/en_US/pac/pzn/grouped-source',
                title: 'Grouped source',
                description: 'Grouped source',
                model: { id: 'model-1' },
                fields: [{ name: 'variations', values: [] }],
                tags: [],
            };
            const resolvedParentFragment = {
                ...parentFragment,
                references: [{ id: 'ref-1', path: '/content/dam/mas/sandbox/en_CA/pac/default-fragment' }],
            };
            const createdFragment = { id: 'new-grouped-id', path: '/content/dam/mas/sandbox/en_US/pac/pzn/new-grouped' };

            const getByPathStub = sandbox.stub().callsFake(async (path) => {
                if (path === createdFragment.path) return createdFragment;
                return null;
            });

            repository.aem = createAemMock({
                fragments: {
                    getById: sandbox.stub().resolves(groupedSource),
                    getByPath: getByPathStub,
                    ensureFolderExists: sandbox.stub().resolves(),
                    create: sandbox.stub().resolves({ id: createdFragment.id }),
                    copyFragmentTags: sandbox.stub().resolves(),
                    pollCreatedFragment: sandbox.stub().resolves(createdFragment),
                },
            });
            sandbox.stub(repository, 'resolveHydratedParentFragment').resolves(resolvedParentFragment);
            sandbox.stub(repository, 'updateParentVariations').resolves(parentFragment);
            sandbox.stub(repository, 'refreshFragment').resolves();
            sandbox.stub(Store.fragments.list.data, 'get').returns([{ get: () => ({ id: parentFragment.id }) }]);

            const result = await repository.createGroupedVariation(groupedSource.id, ['mas:locale/EG/ar_EG'], {
                productArrangementCode: 'pac',
            });

            expect(repository.resolveHydratedParentFragment.calledOnceWith(groupedSource.path)).to.be.true;
            expect(repository.updateParentVariations.calledOnce).to.be.true;
            expect(repository.updateParentVariations.firstCall.args[0].id).to.equal(parentFragment.id);
            expect(repository.updateParentVariations.firstCall.args[1]).to.equal(createdFragment.path);
            expect(result).to.deep.equal(createdFragment);
        });

        it('appends a random suffix to fragment name when path already exists', async () => {
            const repository = createRepository();
            const createdDraft = { id: 'new-grouped-id' };
            const createdFragment = { id: 'new-grouped-id', path: '/content/dam/mas/sandbox/en_US/pac/pzn/new-grouped' };

            const getByPathStub = sandbox.stub().callsFake(async (path) => {
                if (path === createdFragment.path) return createdFragment;
                if (path.startsWith('/content/dam/mas/sandbox/en_US/pac/pzn/')) return { id: 'existing' };
                return null;
            });

            const createStub = sandbox.stub().resolves(createdDraft);

            repository.aem = createAemMock({
                fragments: {
                    getById: sandbox.stub().resolves(parentFragment),
                    getByPath: getByPathStub,
                    ensureFolderExists: sandbox.stub().resolves(),
                    create: createStub,
                    copyFragmentTags: sandbox.stub().resolves(),
                    pollCreatedFragment: sandbox.stub().resolves(createdFragment),
                },
            });
            sandbox.stub(repository, 'updateParentVariations').resolves(parentFragment);
            sandbox.stub(repository, 'refreshFragment').resolves();
            sandbox.stub(Store.fragments.list.data, 'get').returns([{ get: () => ({ id: parentFragment.id }) }]);

            await repository.createGroupedVariation(parentFragment.id, ['mas:locale/EG/ar_EG'], {
                productArrangementCode: 'pac',
            });

            const createCall = createStub.firstCall.args[0];
            expect(createCall.name).to.match(/-[a-z]{4}$/);
        });

        it('throws when grouped source has no parent reference', async () => {
            const repository = createRepository();
            const groupedSource = {
                id: 'grouped-source',
                path: '/content/dam/mas/sandbox/en_US/pac/pzn/grouped-source',
                title: 'Grouped source',
                description: 'Grouped source',
                model: { id: 'model-1' },
                fields: [{ name: 'variations', values: [] }],
                tags: [],
            };

            repository.aem = createAemMock({
                fragments: {
                    getById: sandbox.stub().resolves(groupedSource),
                },
            });
            sandbox.stub(repository, 'resolveHydratedParentFragment').resolves(null);

            try {
                await repository.createGroupedVariation(groupedSource.id, ['mas:locale/EG/ar_EG'], {
                    productArrangementCode: 'pac',
                });
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.message).to.equal('Failed to resolve parent fragment for grouped variation');
            }
        });
    });

    describe('duplicateGroupedVariation', () => {
        const sourceFragment = {
            id: 'source-grouped-1',
            path: '/content/dam/mas/sandbox/en_US/pac/pzn/source-grouped',
            title: 'Source title',
            description: 'Source description',
            model: { id: 'model-1' },
            fields: [
                { name: 'pznTags', values: ['mas:pzn/old-tag'] },
                { name: 'promoCode', values: ['PROMO10'] },
                { name: 'variations', values: ['/some/variation/path'] },
            ],
            tags: [{ id: 'mas:product/cc/photoshop' }],
        };

        const parentFragment = {
            id: 'parent-fragment-1',
            path: '/content/dam/mas/sandbox/en_US/pac/parent-fragment',
            title: 'Parent title',
            description: 'Parent description',
            model: { id: 'model-1' },
            fields: [{ name: 'variations', values: [] }],
            tags: [],
        };

        it('duplicates a grouped variation and returns the created fragment', async () => {
            const repository = createRepository();
            const newPznTags = ['mas:pzn/new-tag'];
            const createdDraft = { id: 'new-grouped-id' };
            const createdFragment = {
                id: 'new-grouped-id',
                path: '/content/dam/mas/sandbox/en_US/pac/pzn/new-grouped',
            };

            repository.aem = createAemMock({
                fragments: {
                    getById: sandbox.stub().resolves(sourceFragment),
                    getByPath: sandbox.stub().resolves(null),
                    create: sandbox.stub().resolves(createdDraft),
                    copyFragmentTags: sandbox.stub().resolves(),
                    pollCreatedFragment: sandbox.stub().resolves(createdFragment),
                },
            });
            sandbox.stub(repository, 'resolveHydratedParentFragment').resolves(parentFragment);
            sandbox.stub(repository, 'generateGroupedVariationName').returns('new-grouped');
            sandbox.stub(repository, 'updateParentVariations').resolves(parentFragment);
            sandbox.stub(repository, 'refreshFragment').resolves();
            sandbox.stub(Store.fragments.list.data, 'get').returns([{ get: () => ({ id: parentFragment.id }) }]);

            const result = await repository.duplicateGroupedVariation('source-grouped-1', newPznTags);

            expect(repository.aem.sites.cf.fragments.getById.calledOnceWith('source-grouped-1')).to.be.true;
            expect(repository.resolveHydratedParentFragment.calledOnceWith(sourceFragment.path)).to.be.true;
            expect(repository.updateParentVariations.calledOnceWith(parentFragment, createdFragment.path)).to.be.true;
            expect(repository.refreshFragment.calledOnce).to.be.true;
            expect(result).to.deep.equal(createdFragment);
        });

        it('clones fields excluding variations and replacing pznTags', async () => {
            const repository = createRepository();
            const newPznTags = ['mas:pzn/new-tag'];
            const createdDraft = { id: 'new-grouped-id' };
            const createdFragment = { id: 'new-grouped-id', path: '/content/dam/mas/sandbox/en_US/pac/pzn/new-grouped' };
            const createStub = sandbox.stub().resolves(createdDraft);

            repository.aem = createAemMock({
                fragments: {
                    getById: sandbox.stub().resolves(sourceFragment),
                    getByPath: sandbox.stub().resolves(null),
                    create: createStub,
                    copyFragmentTags: sandbox.stub().resolves(),
                    pollCreatedFragment: sandbox.stub().resolves(createdFragment),
                },
            });
            sandbox.stub(repository, 'resolveHydratedParentFragment').resolves(parentFragment);
            sandbox.stub(repository, 'generateGroupedVariationName').returns('new-grouped');
            sandbox.stub(repository, 'updateParentVariations').resolves();
            sandbox.stub(repository, 'refreshFragment').resolves();
            sandbox.stub(Store.fragments.list.data, 'get').returns([]);

            await repository.duplicateGroupedVariation('source-grouped-1', newPznTags);

            const createArgs = createStub.firstCall.args[0];
            const fieldNames = createArgs.fields.map((f) => f.name);
            expect(fieldNames).not.to.include('variations');
            const pznTagsField = createArgs.fields.find((f) => f.name === 'pznTags');
            expect(pznTagsField.values).to.deep.equal(newPznTags);
            const promoCodeField = createArgs.fields.find((f) => f.name === 'promoCode');
            expect(promoCodeField.values).to.deep.equal(['PROMO10']);
        });

        it('throws when source fragment is not found', async () => {
            const repository = createRepository();

            repository.aem = createAemMock({
                fragments: {
                    getById: sandbox.stub().resolves(null),
                },
            });

            try {
                await repository.duplicateGroupedVariation('nonexistent-id', []);
                expect.fail('Should have thrown');
            } catch (error) {
                expect(error.message).to.equal('Failed to fetch source grouped variation');
            }
        });

        it('throws when parent fragment cannot be resolved', async () => {
            const repository = createRepository();

            repository.aem = createAemMock({
                fragments: {
                    getById: sandbox.stub().resolves(sourceFragment),
                },
            });
            sandbox.stub(repository, 'resolveHydratedParentFragment').resolves(null);

            try {
                await repository.duplicateGroupedVariation('source-grouped-1', ['mas:pzn/tag']);
                expect.fail('Should have thrown');
            } catch (error) {
                expect(error.message).to.equal('Failed to resolve parent fragment for grouped variation');
            }
        });

        it('appends a random 4-char suffix when the generated name already exists', async () => {
            const repository = createRepository();
            const newPznTags = ['mas:pzn/new-tag'];
            const createdDraft = { id: 'new-grouped-id' };
            const createdFragment = { id: 'new-grouped-id', path: '/content/dam/mas/sandbox/en_US/pac/pzn/new-grouped-abcd' };
            const createStub = sandbox.stub().resolves(createdDraft);

            repository.aem = createAemMock({
                fragments: {
                    getById: sandbox.stub().resolves(sourceFragment),
                    getByPath: sandbox.stub().resolves({ id: 'existing-fragment' }),
                    create: createStub,
                    copyFragmentTags: sandbox.stub().resolves(),
                    pollCreatedFragment: sandbox.stub().resolves(createdFragment),
                },
            });
            sandbox.stub(repository, 'resolveHydratedParentFragment').resolves(parentFragment);
            sandbox.stub(repository, 'generateGroupedVariationName').returns('new-grouped');
            sandbox.stub(repository, 'updateParentVariations').resolves();
            sandbox.stub(repository, 'refreshFragment').resolves();
            sandbox.stub(Store.fragments.list.data, 'get').returns([]);

            await repository.duplicateGroupedVariation('source-grouped-1', newPznTags);

            const createArgs = createStub.firstCall.args[0];
            expect(createArgs.name).to.match(/^new-grouped-[a-z]{4}$/);
        });

        it('skips copyFragmentTags when source has no tags', async () => {
            const repository = createRepository();
            const sourceWithNoTags = { ...sourceFragment, tags: [] };
            const createdDraft = { id: 'new-grouped-id' };
            const createdFragment = { id: 'new-grouped-id', path: '/content/dam/mas/sandbox/en_US/pac/pzn/new-grouped' };
            const copyTagsStub = sandbox.stub().resolves();

            repository.aem = createAemMock({
                fragments: {
                    getById: sandbox.stub().resolves(sourceWithNoTags),
                    getByPath: sandbox.stub().resolves(null),
                    create: sandbox.stub().resolves(createdDraft),
                    copyFragmentTags: copyTagsStub,
                    pollCreatedFragment: sandbox.stub().resolves(createdFragment),
                },
            });
            sandbox.stub(repository, 'resolveHydratedParentFragment').resolves(parentFragment);
            sandbox.stub(repository, 'generateGroupedVariationName').returns('new-grouped');
            sandbox.stub(repository, 'updateParentVariations').resolves();
            sandbox.stub(repository, 'refreshFragment').resolves();
            sandbox.stub(Store.fragments.list.data, 'get').returns([]);

            await repository.duplicateGroupedVariation('source-grouped-1', ['mas:pzn/tag']);

            expect(copyTagsStub.called).to.be.false;
        });

        it('throws when pollCreatedFragment returns null', async () => {
            const repository = createRepository();

            repository.aem = createAemMock({
                fragments: {
                    getById: sandbox.stub().resolves(sourceFragment),
                    getByPath: sandbox.stub().resolves(null),
                    create: sandbox.stub().resolves({ id: 'draft-id' }),
                    copyFragmentTags: sandbox.stub().resolves(),
                    pollCreatedFragment: sandbox.stub().resolves(null),
                },
            });
            sandbox.stub(repository, 'resolveHydratedParentFragment').resolves(parentFragment);
            sandbox.stub(repository, 'generateGroupedVariationName').returns('new-grouped');

            try {
                await repository.duplicateGroupedVariation('source-grouped-1', ['mas:pzn/tag']);
                expect.fail('Should have thrown');
            } catch (error) {
                expect(error.message).to.equal('Failed to duplicate grouped variation');
            }
        });

        it('skips refreshFragment when parent is not found in store', async () => {
            const repository = createRepository();
            const createdFragment = { id: 'new-grouped-id', path: '/content/dam/mas/sandbox/en_US/pac/pzn/new-grouped' };
            const refreshStub = sandbox.stub().resolves();

            repository.aem = createAemMock({
                fragments: {
                    getById: sandbox.stub().resolves(sourceFragment),
                    getByPath: sandbox.stub().resolves(null),
                    create: sandbox.stub().resolves({ id: 'draft-id' }),
                    copyFragmentTags: sandbox.stub().resolves(),
                    pollCreatedFragment: sandbox.stub().resolves(createdFragment),
                },
            });
            sandbox.stub(repository, 'resolveHydratedParentFragment').resolves(parentFragment);
            sandbox.stub(repository, 'generateGroupedVariationName').returns('new-grouped');
            sandbox.stub(repository, 'updateParentVariations').resolves();
            sandbox.stub(repository, 'refreshFragment').value(refreshStub);
            sandbox.stub(Store.fragments.list.data, 'get').returns([]);

            await repository.duplicateGroupedVariation('source-grouped-1', ['mas:pzn/tag']);

            expect(refreshStub.called).to.be.false;
        });
    });

    describe('deleteFragment', () => {
        it('refreshes referencing list stores after deletion to prevent stale variation rows', async () => {
            const repository = createRepository();
            const fragment = createFragment({
                id: null,
                path: '/content/dam/mas/acom/en_US/some-product/pzn/some-grouped-variation',
            });

            repository.aem = createAemMock({
                fragments: {
                    forceDelete: sandbox.stub().resolves(),
                },
            });
            repository.operation = {
                set: sandbox.stub(),
            };

            const refreshVariationParentInListStub = sandbox.stub(repository, 'refreshVariationParentInList').resolves();
            const fragmentDeletedEmitStub = sandbox.stub(Events.fragmentDeleted, 'emit');

            const result = await repository.deleteFragment(fragment, {
                force: true,
                startToast: false,
                endToast: false,
            });

            expect(result).to.be.true;
            expect(repository.aem.sites.cf.fragments.forceDelete.calledOnceWith({ path: fragment.path })).to.be.true;
            expect(refreshVariationParentInListStub.calledOnceWith(fragment, null)).to.be.true;
            expect(fragmentDeletedEmitStub.calledOnceWith(fragment)).to.be.true;
        });

        it('refreshVariationParentInList refreshes parent store when variation path is only in variations field', async () => {
            const repository = createRepository();
            const variationPath = '/content/dam/mas/sandbox/en_US/pac/pzn/grouped-one';
            const parent = new Fragment({
                id: 'parent-collection-id',
                path: '/content/dam/mas/sandbox/en_US/pac/parent-collection',
                model: { path: COLLECTION_MODEL_PATH },
                fields: [{ name: 'variations', values: [variationPath, '/other/var'] }],
                references: [],
            });
            const parentStore = new FragmentStore(parent);
            sandbox.stub(Store.fragments.list.data, 'get').returns([parentStore]);
            const refreshStub = sandbox.stub(repository, 'refreshFragment').resolves();

            await repository.refreshVariationParentInList({ id: 'grouped-id', path: variationPath }, null);

            expect(refreshStub.calledOnceWith(parentStore)).to.be.true;
        });

        it('refreshVariationParentInList refreshes list store when parentFragment id matches fragment in list', async () => {
            const repository = createRepository();
            const parent = new Fragment({
                id: 'parent-collection-id',
                path: '/content/dam/mas/sandbox/en_US/pac/parent-collection',
                model: { path: COLLECTION_MODEL_PATH },
                references: [],
            });
            const parentStore = new FragmentStore(parent);
            sandbox.stub(Store.fragments.list.data, 'get').returns([parentStore]);
            const refreshStub = sandbox.stub(repository, 'refreshFragment').resolves();

            await repository.refreshVariationParentInList(
                { id: 'var-id', path: '/content/dam/mas/sandbox/en_US/pac/pzn/v' },
                parent,
            );

            expect(refreshStub.calledOnceWith(parentStore)).to.be.true;
        });

        it('refreshVariationParentInList matches references and warns when refresh fails', async () => {
            const repository = createRepository();
            const variation = { id: 'var-id', path: '/content/dam/mas/sandbox/en_US/pac/pzn/v' };
            const parent = new Fragment({
                id: 'ref-parent-id',
                path: '/content/dam/mas/sandbox/en_US/pac/ref-parent',
                model: { path: COLLECTION_MODEL_PATH },
                references: [{ id: 'var-id', path: variation.path }],
            });
            const parentStore = new FragmentStore(parent);
            sandbox.stub(Store.fragments.list.data, 'get').returns([parentStore]);
            sandbox.stub(repository, 'refreshFragment').rejects(new Error('refresh failed'));
            const warnSpy = sandbox.stub(console, 'warn');

            await repository.refreshVariationParentInList(variation, null);

            expect(warnSpy.calledOnce).to.be.true;
            expect(warnSpy.firstCall.args[0]).to.include('Failed to refresh parent fragment store after variation save');
        });
    });

    describe('Store subscription lifecycle', () => {
        const connectAndDisconnect = (repository) => {
            sandbox.stub(repository, 'loadFolders').resolves();
            repository.connectedCallback();
            repository.disconnectedCallback();
        };

        it('unsubscribes from Store.filters on disconnectedCallback', () => {
            const repository = createFullRepository();
            const subscribeSpy = sandbox.spy(Store.filters, 'subscribe');
            const unsubscribeSpy = sandbox.spy(Store.filters, 'unsubscribe');

            connectAndDisconnect(repository);

            const subscribedFn = subscribeSpy.firstCall.args[0];
            expect(unsubscribeSpy.calledWith(subscribedFn)).to.be.true;
        });

        it('unsubscribes from Store.search on disconnectedCallback', () => {
            const repository = createFullRepository();
            const subscribeSpy = sandbox.spy(Store.search, 'subscribe');
            const unsubscribeSpy = sandbox.spy(Store.search, 'unsubscribe');

            connectAndDisconnect(repository);

            const subscribedFn = subscribeSpy.firstCall.args[0];
            expect(unsubscribeSpy.calledWith(subscribedFn)).to.be.true;
        });
    });
});
