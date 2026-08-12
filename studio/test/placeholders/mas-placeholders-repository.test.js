import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import '../../src/mas-repository.js';
import { Fragment } from '../../src/aem/fragment.js';
import { ROOT_PATH, SURFACES } from '../../src/constants.js';
import Store from '../../src/store.js';
import {
    parseDictionaryPath,
    ensureReferenceField,
    getParentPath,
    getDictionaryFolderPath,
    fetchIndexFragment,
    getIndexFragment,
    ensureDictionaryFolder,
    createDictionaryIndexFragment,
    ensureIndexFallbackFields,
    ensureDictionaryIndex,
    addToIndexFragment,
    removeFromIndexFragment,
    createPlaceholder,
    publishPlaceholder,
    clearDictionaryCache,
    loadPlaceholders,
    loadPreviewPlaceholders,
} from '../../src/placeholders/mas-placeholders-repository.js';

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

describe('mas-placeholders-repository', () => {
    let sandbox;
    let repo;

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
        saveTags: sandbox.stub().resolves(),
        ...overrides.other,
    });

    const createFragment = (overrides = {}) => ({
        id: 'fragment-id',
        path: '/fragment/path',
        fields: [],
        ...overrides,
    });

    const dictPath = (surface, locale = 'en_US') => `${ROOT_PATH}/${surface}/${locale}/dictionary`;
    const indexPath = (dict) => `${dict}/index`;
    const notFound = () => Promise.reject(new Error('404 Not Found'));

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        repo = document.createElement('mas-repository');
        repo.setAttribute('base-url', 'http://localhost:2023/test/mocks');
        // Prevent connectedCallback from triggering a real folder load.
        repo.loadFolders = () => {};
        document.body.appendChild(repo);
        repo.aem = createAemMock();
        repo.publishFragment = sandbox.stub().resolves(true);
        sandbox.stub(repo, 'processError');
    });

    afterEach(() => {
        repo.remove();
        sandbox.restore();
    });

    describe('parseDictionaryPath', () => {
        it('extracts locale and surface path for a valid dictionary path', () => {
            const dictionaryPath = `${ROOT_PATH}/${SURFACES.ACOM.name}/surface/segment/en_US/dictionary`;
            expect(parseDictionaryPath(dictionaryPath)).to.deep.equal({
                locale: 'en_US',
                surfacePath: `${SURFACES.ACOM.name}/surface/segment`,
                surfaceRoot: SURFACES.ACOM.name,
            });
        });

        it('returns an empty object when the path is not under the root', () => {
            expect(parseDictionaryPath('/not/the/root')).to.deep.equal({});
        });
    });

    describe('getDictionaryFolderPath', () => {
        it('builds folder path and handles edge cases', () => {
            expect(getDictionaryFolderPath(`${SURFACES.ACOM.name}/surface`, 'fr_FR')).to.equal(
                `${ROOT_PATH}/${SURFACES.ACOM.name}/surface/fr_FR/dictionary`,
            );
            expect(getDictionaryFolderPath(`/${SURFACES.ACOM.name}/`, 'en_US')).to.equal(
                `${ROOT_PATH}/${SURFACES.ACOM.name}/en_US/dictionary`,
            );
            expect(getDictionaryFolderPath('', 'en_US')).to.equal(`${ROOT_PATH}/en_US/dictionary`);
            expect(getDictionaryFolderPath(SURFACES.ACOM.name, null)).to.be.null;
        });
    });

    describe('getParentPath', () => {
        it('returns the parent path of a fragment', () => {
            expect(getParentPath({ path: `${dictPath('acom')}/save-today` })).to.equal(dictPath('acom'));
        });

        it('throws when a parent path cannot be derived', () => {
            expect(() => getParentPath({ path: 'no-slash' })).to.throw('Failed to determine dictionary path');
        });
    });

    describe('ensureReferenceField', () => {
        it('adds a missing reference field', () => {
            const parentPath = `${dictPath('acom')}/index`;
            const { fields: updatedFields, changed } = ensureReferenceField([], 'parent', parentPath);

            expect(changed).to.be.true;
            expect(updatedFields).to.have.lengthOf(1);
            expect(updatedFields[0]).to.include({ name: 'parent', type: 'content-fragment', multiple: false });
            expect(updatedFields[0].values).to.deep.equal([parentPath]);
        });

        it('does not update the field when values already match', () => {
            const fields = [
                { name: 'parent', type: 'content-fragment', multiple: false, locked: false, values: ['/existing'] },
            ];
            const result = ensureReferenceField(fields, 'parent', '/existing');

            expect(result.changed).to.be.false;
            expect(result.fields[0].values).to.deep.equal(['/existing']);
        });
    });

    describe('fetchIndexFragment', () => {
        it('returns the fragment when it exists', async () => {
            const fragment = createFragment({ id: 'idx', path: indexPath(dictPath('acom')) });
            repo.aem.sites.cf.fragments.getByPath.resolves(fragment);
            expect(await fetchIndexFragment(indexPath(dictPath('acom')))).to.equal(fragment);
        });

        it('returns null on a 404 and rethrows other errors', async () => {
            repo.aem.sites.cf.fragments.getByPath.callsFake(notFound);
            expect(await fetchIndexFragment(indexPath(dictPath('acom')))).to.be.null;

            repo.aem.sites.cf.fragments.getByPath.rejects(new Error('500 Server Error'));
            let thrown;
            try {
                await fetchIndexFragment(indexPath(dictPath('acom')));
            } catch (error) {
                thrown = error;
            }
            expect(thrown?.message).to.include('500');
        });
    });

    describe('getIndexFragment', () => {
        it('wraps the result in a Fragment', async () => {
            const path = indexPath(dictPath('acom'));
            repo.aem.sites.cf.fragments.getByPath.resolves(createFragment({ id: 'idx', path }));
            const result = await getIndexFragment(path);
            expect(result).to.be.instanceOf(Fragment);
            expect(result.path).to.equal(path);
        });

        it('returns null when the fetch fails', async () => {
            repo.aem.sites.cf.fragments.getByPath.callsFake(notFound);
            expect(await getIndexFragment(indexPath(dictPath('acom')))).to.be.null;
        });
    });

    describe('ensureDictionaryFolder', () => {
        it('handles invalid paths and existing folders', async () => {
            const dictionaryPath = '/content/dam/mas/acom/en_US/dictionary';

            expect(await ensureDictionaryFolder(null)).to.be.false;
            expect(await ensureDictionaryFolder('')).to.be.false;

            repo.aem.folders.list.resolves({ children: [{ name: 'dictionary', path: dictionaryPath }] });
            expect(await ensureDictionaryFolder(dictionaryPath)).to.be.true;
            expect(repo.aem.folders.create.called).to.be.false;
        });

        it('creates dictionary folder and handles errors', async () => {
            const dictionaryPath = '/content/dam/mas/acom/en_US/dictionary';
            const parentPath = '/content/dam/mas/acom/en_US';

            repo.aem.folders.list.resolves({ children: [] });
            repo.aem.folders.create.resolves({});
            expect(await ensureDictionaryFolder(dictionaryPath)).to.be.true;
            expect(repo.aem.folders.create.calledWith(parentPath, 'dictionary', 'dictionary')).to.be.true;

            const consoleWarnStub = sandbox.stub(console, 'warn');
            repo.aem.folders.list.rejects(new Error('Parent folder not found'));
            expect(await ensureDictionaryFolder(dictionaryPath)).to.be.false;
            expect(consoleWarnStub.calledOnce).to.be.true;
            expect(consoleWarnStub.firstCall.args[0]).to.include('Placeholder feature may be degraded');
        });
    });

    describe('createDictionaryIndexFragment', () => {
        it('creates dictionary index with parent reference and handles publishing', async () => {
            const createdFragment = createFragment({ id: '123', path: '/index' });
            repo.aem.sites.cf.fragments.create.resolves(createdFragment);

            const result = await createDictionaryIndexFragment({
                parentPath: dictPath('acom'),
                parentReference: '/parent/index',
            });

            const payload = repo.aem.sites.cf.fragments.create.firstCall.args[0];
            expect(payload.fields).to.have.lengthOf(2);
            expect(payload.fields[0].values).to.deep.equal(['/parent/index']);
            expect(payload.fields[1].values).to.deep.equal([]);
            expect(repo.publishFragment.called).to.be.true;
            expect(result).to.equal(createdFragment);

            repo.publishFragment.resetHistory();
            await createDictionaryIndexFragment({
                parentPath: dictPath('acom'),
                parentReference: '/parent/index',
                publish: false,
            });
            expect(repo.publishFragment.called).to.be.false;
        });
    });

    describe('ensureIndexFallbackFields', () => {
        it('saves when the parent field needs to be updated', async () => {
            const original = createFragment({ id: 'index-id', path: '/index' });
            repo.aem.sites.cf.fragments.save.callsFake(async (fragment) => fragment);

            const result = await ensureIndexFallbackFields(original, '/parent');

            expect(repo.aem.sites.cf.fragments.save.calledOnce).to.be.true;
            expect(result.fields.find((f) => f.name === 'parent').values).to.deep.equal(['/parent']);
        });

        it('skips saving when there are no changes', async () => {
            const original = createFragment({
                id: 'index-id',
                path: '/index',
                fields: [{ name: 'parent', type: 'content-fragment', multiple: false, locked: false, values: ['/parent'] }],
            });

            const result = await ensureIndexFallbackFields(original, '/parent');

            expect(repo.aem.sites.cf.fragments.save.called).to.be.false;
            expect(result).to.equal(original);
        });
    });

    describe('ensureDictionaryIndex', () => {
        const keyedGetByPath = (indexMap) =>
            sandbox.stub().callsFake(async (path) => {
                if (path in indexMap) return indexMap[path];
                throw new Error('404 Not Found');
            });

        const keyedFolderList = (pathsWithChildren = {}) =>
            sandbox.stub().callsFake(async (path) => ({
                children: pathsWithChildren[path]?.map((name) => ({ name, path: `${path}/${name}` })) || [],
            }));

        // fr_CA → same-surface fallback fr_FR (already exists) used as parent for the new index.
        it('creates a missing index using a same-surface fallback locale', async () => {
            const dictionaryPath = dictPath(`${SURFACES.ACOM.name}/surface`, 'fr_CA');
            const fallbackDictPath = dictPath(`${SURFACES.ACOM.name}/surface`, 'fr_FR');
            const fallbackIndex = createFragment({ id: 'fallback', path: indexPath(fallbackDictPath) });
            const createdIndex = createFragment({ id: 'new-index', path: indexPath(dictionaryPath) });
            const parentPath = dictionaryPath.replace(/\/dictionary$/, '');

            repo.aem.sites.cf.fragments.getByPath = keyedGetByPath({ [indexPath(fallbackDictPath)]: fallbackIndex });
            repo.aem.folders.list = keyedFolderList();
            repo.aem.folders.create.resolves({});
            repo.aem.sites.cf.fragments.create.resolves(createdIndex);

            const result = await ensureDictionaryIndex(dictionaryPath);

            expect(repo.aem.sites.cf.fragments.create.calledOnce).to.be.true;
            const payload = repo.aem.sites.cf.fragments.create.firstCall.args[0];
            expect(payload.parentPath).to.equal(dictionaryPath);
            expect(payload.fields[0].values).to.deep.equal([fallbackIndex.path]);
            expect(result).to.equal(createdIndex);
            expect(repo.aem.folders.list.calledWith(parentPath)).to.be.true;
            expect(repo.aem.folders.create.calledWith(parentPath, 'dictionary', 'dictionary')).to.be.true;
        });

        // ccd/fr_CA → surface fallback ccd/fr_FR is missing, created first using ACOM fallback acom/fr_FR.
        it('recursively creates surface fallback when missing, then uses ACOM fallback for it', async () => {
            const dictionaryPath = dictPath(SURFACES.CCD.name, 'fr_CA');
            const fallbackDictPath = dictPath(SURFACES.CCD.name, 'fr_FR');
            const acomDictPath = dictPath(SURFACES.ACOM.name, 'fr_FR');
            const acomIndex = createFragment({ id: 'acom-index', path: indexPath(acomDictPath) });
            const createdFallbackIndex = createFragment({ id: 'fallback-index', path: indexPath(fallbackDictPath) });
            const createdIndex = createFragment({ id: 'ccd-index', path: indexPath(dictionaryPath) });
            const fallbackParentPath = fallbackDictPath.replace(/\/dictionary$/, '');

            repo.aem.sites.cf.fragments.getByPath = keyedGetByPath({ [indexPath(acomDictPath)]: acomIndex });
            repo.aem.folders.list = keyedFolderList();
            repo.aem.folders.create.resolves({});
            repo.aem.sites.cf.fragments.create.callsFake(async (args) =>
                args.parentPath === fallbackDictPath ? createdFallbackIndex : createdIndex,
            );

            const result = await ensureDictionaryIndex(dictionaryPath);

            const createStub = repo.aem.sites.cf.fragments.create;
            expect(createStub.calledTwice).to.be.true;
            expect(createStub.firstCall.args[0].parentPath).to.equal(fallbackDictPath);
            expect(createStub.firstCall.args[0].fields[0].values).to.deep.equal([acomIndex.path]);
            expect(createStub.secondCall.args[0].parentPath).to.equal(dictionaryPath);
            expect(createStub.secondCall.args[0].fields[0].values).to.deep.equal([createdFallbackIndex.path]);
            expect(result).to.equal(createdIndex);
            expect(repo.aem.folders.create.calledWith(fallbackParentPath, 'dictionary', 'dictionary')).to.be.true;
        });

        it('returns existing index without touching folders when parent reference is present', async () => {
            const dictionaryPath = dictPath(`${SURFACES.ACOM.name}/surface`, 'en_US');
            const existingIndex = createFragment({
                id: 'existing',
                path: indexPath(dictionaryPath),
                fields: [{ name: 'parent', values: [indexPath(dictionaryPath)] }],
            });

            repo.aem.sites.cf.fragments.getByPath = keyedGetByPath({ [indexPath(dictionaryPath)]: existingIndex });
            repo.aem.folders.list.rejects(new Error('should not be called'));
            repo.aem.folders.create.rejects(new Error('should not be called'));

            const result = await ensureDictionaryIndex(dictionaryPath);

            expect(result).to.equal(existingIndex);
            expect(repo.aem.sites.cf.fragments.create.called).to.be.false;
            expect(repo.aem.sites.cf.fragments.save.called).to.be.false;
            expect(repo.aem.folders.list.called).to.be.false;
            expect(repo.aem.folders.create.called).to.be.false;
        });

        // ccd/fr_LU and ccd/fr_FR exist but lack parent references; repair the chain up to ACOM without publishing.
        it('repairs missing parent references up to ACOM without publishing', async () => {
            const dictionaryPath = dictPath(SURFACES.CCD.name, 'fr_LU');
            const fallbackDictPath = dictPath(SURFACES.CCD.name, 'fr_FR');
            const acomDictPath = dictPath(SURFACES.ACOM.name, 'fr_FR');

            const frLuIndex = createFragment({ id: 'fr_LU', path: indexPath(dictionaryPath) });
            const frFrIndex = createFragment({ id: 'fr_FR', path: indexPath(fallbackDictPath) });
            const acomIndex = createFragment({
                id: 'acom',
                path: indexPath(acomDictPath),
                fields: [
                    {
                        name: 'parent',
                        type: 'content-fragment',
                        multiple: false,
                        locked: false,
                        values: [indexPath(acomDictPath)],
                    },
                ],
            });

            repo.aem.sites.cf.fragments.getByPath = keyedGetByPath({
                [indexPath(dictionaryPath)]: frLuIndex,
                [indexPath(fallbackDictPath)]: frFrIndex,
                [indexPath(acomDictPath)]: acomIndex,
            });
            repo.aem.sites.cf.fragments.save.callsFake(async (fragment) => fragment);
            repo.aem.sites.cf.fragments.create.rejects(new Error('should not create'));

            const result = await ensureDictionaryIndex(dictionaryPath);

            const saveStub = repo.aem.sites.cf.fragments.save;
            expect(saveStub.callCount).to.equal(2);
            expect(saveStub.firstCall.args[0].fields.find((f) => f.name === 'parent').values).to.deep.equal([
                indexPath(acomDictPath),
            ]);
            expect(saveStub.secondCall.args[0].fields.find((f) => f.name === 'parent').values).to.deep.equal([
                indexPath(fallbackDictPath),
            ]);
            expect(result.fields.find((f) => f.name === 'parent').values[0]).to.equal(indexPath(fallbackDictPath));
            expect(repo.aem.sites.cf.fragments.create.called).to.be.false;
            expect(repo.aem.folders.create.called).to.be.false;
            expect(repo.publishFragment.called).to.be.false;
        });
    });

    describe('addToIndexFragment', () => {
        it('adds the fragment path to the index entries and republishes', async () => {
            const placeholder = createFragment({ id: 'ph', path: `${dictPath('acom')}/save-today` });
            const index = createFragment({
                id: 'idx',
                path: indexPath(dictPath('acom')),
                fields: [{ name: 'entries', type: 'content-fragment', multiple: true, values: [] }],
            });
            repo.aem.sites.cf.fragments.getByPath.resolves(index);
            repo.aem.sites.cf.fragments.save.callsFake(async (fragment) => fragment);

            const result = await addToIndexFragment(placeholder);

            expect(result).to.be.true;
            const savedFragment = repo.aem.sites.cf.fragments.save.firstCall.args[0];
            expect(savedFragment.getField('entries').values).to.deep.equal([placeholder.path]);
            expect(repo.publishFragment.calledOnce).to.be.true;
        });

        it('returns false when the index fragment is missing', async () => {
            const placeholder = createFragment({ id: 'ph', path: `${dictPath('acom')}/save-today` });
            repo.aem.sites.cf.fragments.getByPath.callsFake(notFound);
            const consoleErrorStub = sandbox.stub(console, 'error');

            expect(await addToIndexFragment(placeholder)).to.be.false;
            expect(repo.aem.sites.cf.fragments.save.called).to.be.false;
            expect(consoleErrorStub.called).to.be.true;
        });
    });

    describe('removeFromIndexFragment', () => {
        it('removes the fragment paths from the index entries and republishes', async () => {
            const placeholder = createFragment({ id: 'ph', path: `${dictPath('acom')}/save-today` });
            const index = createFragment({
                id: 'idx',
                path: indexPath(dictPath('acom')),
                fields: [{ name: 'entries', type: 'content-fragment', multiple: true, values: [placeholder.path, '/keep'] }],
            });
            repo.aem.sites.cf.fragments.getByPath.resolves(index);
            repo.aem.sites.cf.fragments.save.callsFake(async (fragment) => fragment);

            const result = await removeFromIndexFragment(placeholder);

            expect(result).to.be.true;
            const savedFragment = repo.aem.sites.cf.fragments.save.firstCall.args[0];
            expect(savedFragment.getField('entries').values).to.deep.equal(['/keep']);
            expect(repo.publishFragment.calledOnce).to.be.true;
        });

        it('returns false when the index fragment is missing', async () => {
            const placeholder = createFragment({ id: 'ph', path: `${dictPath('acom')}/save-today` });
            repo.aem.sites.cf.fragments.getByPath.callsFake(notFound);
            expect(await removeFromIndexFragment(placeholder)).to.be.false;
        });
    });

    describe('createPlaceholder', () => {
        it('creates the placeholder, tags it as draft and adds it to the index', async () => {
            const previousList = Store.placeholders.list.data.get();
            repo.search = { value: { path: 'acom' } };
            repo.filters = { value: { locale: 'en_US' } };
            sandbox.stub(repo, 'getDictionaryPath').returns(dictPath('acom'));
            const createdFragment = createFragment({ id: 'created', path: `${dictPath('acom')}/save-today`, fields: [] });
            repo.createFragment = sandbox.stub().resolves(createdFragment);

            const index = createFragment({
                id: 'idx',
                path: indexPath(dictPath('acom')),
                fields: [{ name: 'entries', type: 'content-fragment', multiple: true, values: [] }],
            });
            repo.aem.sites.cf.fragments.getByPath.resolves(index);
            repo.aem.sites.cf.fragments.save.callsFake(async (fragment) => fragment);

            try {
                const result = await createPlaceholder({ key: 'save-today', value: 'Save today', isRichText: false });

                expect(result).to.be.true;
                expect(repo.createFragment.calledOnce).to.be.true;
                expect(repo.aem.saveTags.calledOnce).to.be.true;
                expect(Store.placeholders.list.data.get()).to.have.lengthOf(previousList.length + 1);
            } finally {
                Store.placeholders.list.data.set(previousList);
            }
        });

        it('returns false when folder path or locale is missing', async () => {
            repo.search = { value: { path: '' } };
            repo.filters = { value: { locale: 'en_US' } };
            expect(await createPlaceholder({ key: 'x', value: 'y', isRichText: false })).to.be.false;
        });
    });

    describe('publishPlaceholder', () => {
        const placeholderPath = `${dictPath('acom')}/save-today`;
        const expectedIndexPath = `${dictPath('acom')}/index`;

        it('publishes the placeholder then republishes the index with no references', async () => {
            const placeholder = createFragment({ id: 'ph-id', path: placeholderPath });
            repo.aem.sites.cf.fragments.getByPath.resolves(createFragment({ id: 'index-id', path: expectedIndexPath }));

            const result = await publishPlaceholder(placeholder);

            expect(result).to.be.true;
            expect(repo.publishFragment.callCount).to.equal(2);
            expect(repo.publishFragment.firstCall.args[0]).to.equal(placeholder);
            expect(repo.publishFragment.secondCall.args[0].path).to.equal(expectedIndexPath);
            expect(repo.publishFragment.secondCall.args.slice(1)).to.deep.equal([{}, false]);
        });

        it('bails out and skips the index publish when the placeholder publish fails', async () => {
            const placeholder = createFragment({ id: 'ph-id', path: placeholderPath });
            repo.publishFragment.resolves(false);

            const result = await publishPlaceholder(placeholder);

            expect(result).to.be.false;
            expect(repo.publishFragment.calledOnce).to.be.true;
            expect(repo.aem.sites.cf.fragments.getByPath.called).to.be.false;
        });

        it('returns false when the index publish fails', async () => {
            const placeholder = createFragment({ id: 'ph-id', path: placeholderPath });
            repo.publishFragment.onFirstCall().resolves(true);
            repo.publishFragment.onSecondCall().resolves(false);
            repo.aem.sites.cf.fragments.getByPath.resolves(createFragment({ id: 'index-id', path: expectedIndexPath }));

            const result = await publishPlaceholder(placeholder);

            expect(result).to.be.false;
            expect(repo.publishFragment.callCount).to.equal(2);
        });

        it('fails with an explicit error when the dictionary index is missing', async () => {
            const placeholder = createFragment({ id: 'ph-id', path: placeholderPath });
            repo.publishFragment.resolves(true);
            repo.aem.sites.cf.fragments.getByPath.callsFake(notFound);

            const result = await publishPlaceholder(placeholder);

            expect(result).to.be.false;
            expect(repo.publishFragment.calledOnce).to.be.true;
            expect(repo.processError.calledOnce).to.be.true;
            const [reportedError, userMessage] = repo.processError.firstCall.args;
            expect(reportedError).to.be.an.instanceOf(Error);
            expect(reportedError.message).to.include(expectedIndexPath);
            expect(userMessage).to.equal(
                'Could not load placeholders index at /content/dam/mas/acom/en_US/dictionary/index, please report to administrator.',
            );
        });
    });

    describe('loadPreviewPlaceholders', () => {
        let previousSearch;
        let previousFilters;
        let previousPreview;

        beforeEach(() => {
            previousSearch = structuredClone(Store.search.get());
            previousFilters = structuredClone(Store.filters.get());
            previousPreview = Store.placeholders.previewByLocale.get();
            clearDictionaryCache();
        });

        afterEach(() => {
            clearDictionaryCache();
            Store.search.value = previousSearch;
            Store.filters.value = previousFilters;
            Store.placeholders.previewByLocale.value = previousPreview;
        });

        it('uses Store.localeOrRegion() for the cache key and fetchDictionary locale, then serves from cache', async () => {
            repo.search = { value: { path: 'sandbox' } };
            Store.search.value = {};
            Store.filters.value = { locale: 'fr_FR' };
            repo.fetchDictionary = sandbox.stub().resolves({ dictKey: 'dictVal' });

            await loadPreviewPlaceholders();

            expect(repo.fetchDictionary.calledOnce).to.be.true;
            expect(repo.fetchDictionary.firstCall.args[1]).to.equal('fr_FR');
            expect(Store.placeholders.previewByLocale.get().fr_FR).to.deep.equal({ dictKey: 'dictVal' });

            // Second call for the same locale/surface is served from the module cache.
            await loadPreviewPlaceholders();
            expect(repo.fetchDictionary.calledOnce).to.be.true;
        });

        it('falls back to en_US when the localized dictionary is empty', async () => {
            repo.search = { value: { path: 'sandbox' } };
            Store.search.value = {};
            Store.filters.value = { locale: 'fr_FR' };
            repo.fetchDictionary = sandbox.stub();
            repo.fetchDictionary.onFirstCall().resolves({});
            repo.fetchDictionary.onSecondCall().resolves({ fromFallback: true });

            await loadPreviewPlaceholders();

            expect(repo.fetchDictionary.callCount).to.equal(2);
            expect(repo.fetchDictionary.secondCall.args[1]).to.equal('en_US');
            expect(Store.placeholders.previewByLocale.get().fr_FR).to.deep.equal({ fromFallback: true });
        });

        it('returns early when no surface path is set', async () => {
            repo.search = { value: { path: '' } };
            repo.fetchDictionary = sandbox.stub();
            await loadPreviewPlaceholders();
            expect(repo.fetchDictionary.called).to.be.false;
        });
    });

    describe('loadPlaceholders', () => {
        let previousData;
        let previousIndex;

        beforeEach(() => {
            previousData = Store.placeholders.list.data.get();
            previousIndex = Store.placeholders.index.get();
        });

        afterEach(() => {
            Store.placeholders.list.data.set(previousData);
            Store.placeholders.index.set(previousIndex);
        });

        it('loads the dictionary index and placeholder entries into the store', async () => {
            repo.page = { value: 'content' };
            repo.search = { value: { path: 'acom' } };
            sandbox.stub(repo, 'getDictionaryPath').returns(dictPath('acom'));
            repo.aem.sites.cf.fragments.getByPath.resolves(
                createFragment({
                    id: 'idx',
                    path: indexPath(dictPath('acom')),
                    fields: [{ name: 'parent', values: [indexPath(dictPath('acom'))] }],
                }),
            );
            const indexFragment = createFragment({ id: 'idx', path: indexPath(dictPath('acom')) });
            const entry = createFragment({ id: 'ph', path: `${dictPath('acom')}/save-today` });
            repo.searchFragmentList = sandbox.stub().resolves([indexFragment, entry]);

            await loadPlaceholders();

            expect(repo.searchFragmentList.calledOnce).to.be.true;
            expect(Store.placeholders.index.get()).to.equal(indexFragment);
            expect(Store.placeholders.list.data.get()).to.have.lengthOf(1);
            expect(Store.placeholders.list.loading.get()).to.be.false;
        });

        it('returns early when the surface is not set', async () => {
            repo.page = { value: 'content' };
            repo.search = { value: { path: '' } };
            repo.searchFragmentList = sandbox.stub();
            await loadPlaceholders();
            expect(repo.searchFragmentList.called).to.be.false;
        });
    });
});
