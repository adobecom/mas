import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { MasRepository } from '../src/mas-repository.js';
import { ROOT_PATH } from '../src/constants.js';
import { SURFACES } from '../src/editors/variant-picker.js';

describe('MasRepository dictionary helpers', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    const createRepository = () => Object.create(MasRepository.prototype);

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

    const dictPath = (surface, locale = 'en_US') => `${ROOT_PATH}/${surface}/${locale}/dictionary`;
    const indexPath = (dictPath) => `${dictPath}/index`;

    describe('parseDictionaryPath', () => {
        it('extracts locale and surface path for a valid dictionary path', () => {
            const repository = createRepository();
            const dictionaryPath = `${ROOT_PATH}/${SURFACES.ACOM}/surface/segment/en_US/dictionary`;

            const result = repository.parseDictionaryPath(dictionaryPath);

            expect(result).to.deep.equal({
                locale: 'en_US',
                surfacePath: `${SURFACES.ACOM}/surface/segment`,
                surfaceRoot: SURFACES.ACOM,
            });
        });

        it('returns an empty object when the path is not under the root', () => {
            const repository = createRepository();

            expect(repository.parseDictionaryPath('/not/the/root')).to.deep.equal({});
        });
    });

    describe('getDictionaryFolderPath', () => {
        it('builds the folder path for the provided surface and locale', () => {
            const repository = createRepository();
            const path = repository.getDictionaryFolderPath(`${SURFACES.ACOM}/surface`, 'fr_FR');

            expect(path).to.equal(`${ROOT_PATH}/${SURFACES.ACOM}/surface/fr_FR/dictionary`);
        });

        it('trims extra slashes and handles empty surface paths', () => {
            const repository = createRepository();

            expect(repository.getDictionaryFolderPath(`/${SURFACES.ACOM}/`, 'en_US')).to.equal(
                `${ROOT_PATH}/${SURFACES.ACOM}/en_US/dictionary`,
            );
            expect(repository.getDictionaryFolderPath('', 'en_US')).to.equal(`${ROOT_PATH}/en_US/dictionary`);
        });

        it('returns null when locale is missing', () => {
            const repository = createRepository();

            expect(repository.getDictionaryFolderPath(SURFACES.ACOM, null)).to.be.null;
        });
    });

    describe('getFallbackLocale', () => {
        it('prefers a locale with the same language code', () => {
            const repository = createRepository();

            expect(repository.getFallbackLocale('fr_CA')).to.equal('fr_FR');
        });

        it('returns null when no matching language code is found', () => {
            const repository = createRepository();

            expect(repository.getFallbackLocale('ja_JP')).to.be.null;
        });

        it('returns null when locale is empty', () => {
            const repository = createRepository();

            expect(repository.getFallbackLocale()).to.be.null;
        });
    });

    describe('ensureReferenceField', () => {
        it('adds a missing reference field', () => {
            const repository = createRepository();
            const parentPath = '/content/dam/mas/acom/en_US/dictionary/index';
            const { fields: updatedFields, changed } = repository.ensureReferenceField([], 'parent', parentPath);

            expect(changed).to.be.true;
            expect(updatedFields).to.have.lengthOf(1);
            expect(updatedFields[0]).to.include({
                name: 'parent',
                type: 'content-fragment',
                multiple: false,
            });
            expect(updatedFields[0].values).to.deep.equal([parentPath]);
        });

        it('does not update the field when values already match', () => {
            const repository = createRepository();
            const fields = [
                {
                    name: 'parent',
                    type: 'content-fragment',
                    multiple: false,
                    locked: false,
                    values: ['/existing'],
                },
            ];

            const result = repository.ensureReferenceField(fields, 'parent', '/existing');

            expect(result.changed).to.be.false;
            expect(result.fields[0].values).to.deep.equal(['/existing']);
        });
    });

    describe('ensureIndexFallbackFields', () => {
        it('saves when the parent field needs to be updated', async () => {
            const repository = createRepository();
            const original = createFragment({ id: 'index-id', path: '/index' });
            const savedFragment = { ...original, fields: [{ name: 'parent', values: ['/parent'] }] };

            repository.aem = createAemMock({
                fragments: {
                    save: sandbox.stub().resolves(savedFragment),
                },
            });
            sandbox.stub(repository, 'ensureReferenceField').callsFake((fields, fieldName, value) => {
                fields.push({ name: fieldName, type: 'content-fragment', multiple: false, locked: false, values: [value] });
                return { fields, changed: true };
            });

            const result = await repository.ensureIndexFallbackFields(original, '/parent');

            expect(repository.aem.sites.cf.fragments.save.calledOnce).to.be.true;
            expect(result).to.equal(savedFragment);
        });

        it('skips saving when there are no changes', async () => {
            const repository = createRepository();
            const original = createFragment({ id: 'index-id', path: '/index' });

            repository.aem = createAemMock({
                fragments: {
                    getById: sandbox.stub().resolves(original),
                },
            });
            sandbox.stub(repository, 'ensureReferenceField').returns({ fields: [], changed: false });

            const result = await repository.ensureIndexFallbackFields(original, '/parent');

            expect(repository.aem.sites.cf.fragments.save.called).to.be.false;
            expect(result).to.equal(original);
        });
    });

    describe('createDictionaryIndexFragment', () => {
        it('creates and publishes a new dictionary index with parent reference and empty entries', async () => {
            const repository = createRepository();
            const createdFragment = createFragment({ id: '123', path: '/index' });
            const createStub = sandbox.stub().resolves(createdFragment);

            repository.aem = createAemMock({ fragments: { create: createStub } });
            repository.publishFragment = sandbox.stub().resolves();

            const result = await repository.createDictionaryIndexFragment({
                parentPath: dictPath('acom'),
                parentReference: '/parent/index',
            });

            expect(createStub.calledOnce).to.be.true;
            const payload = createStub.firstCall.args[0];
            expect(payload.fields).to.have.lengthOf(2);
            expect(payload.fields[0]).to.deep.equal({
                name: 'parent',
                type: 'content-fragment',
                multiple: false,
                locked: false,
                values: ['/parent/index'],
            });
            expect(payload.fields[1]).to.deep.include({ name: 'entries', type: 'content-fragment', multiple: true });
            expect(payload.fields[1].values).to.deep.equal([]); // Entries are always empty on creation
            expect(repository.publishFragment.calledWith(createdFragment, [], false)).to.be.true;
            expect(result).to.equal(createdFragment);
        });

        it('creates index with empty entries and skips publishing when publish is false', async () => {
            const repository = createRepository();
            const createdFragment = createFragment({ id: '123', path: '/index' });
            const createStub = sandbox.stub().resolves(createdFragment);

            repository.aem = createAemMock({ fragments: { create: createStub } });
            repository.publishFragment = sandbox.stub().resolves();

            const result = await repository.createDictionaryIndexFragment({
                parentPath: dictPath('acom'),
                parentReference: '/parent/index',
                publish: false,
            });

            expect(createStub.calledOnce).to.be.true;
            expect(repository.publishFragment.called).to.be.false;
            expect(result).to.equal(createdFragment);
        });
    });

    describe('ensureDictionaryIndex', () => {
        const createFolderListStub = (pathsWithChildren = {}) =>
            sandbox.stub().callsFake(async (path) => ({
                children: pathsWithChildren[path]?.map((name) => ({ name, path: `${path}/${name}` })) || [],
            }));

        // Test: When creating a dictionary index (e.g., acom/surface/fr_CA), if the same-surface fallback exists
        // (e.g., acom/surface/fr_FR), it should use that as the parent reference.
        it('creates a missing index using a same-surface fallback locale', async () => {
            const repository = createRepository();
            const dictionaryPath = dictPath(`${SURFACES.ACOM}/surface`, 'fr_CA');
            const fallbackDictPath = dictPath(`${SURFACES.ACOM}/surface`, 'fr_FR');
            const fallbackIndex = createFragment({ id: 'fallback', path: indexPath(fallbackDictPath) });
            const createdIndex = createFragment({ id: 'new-index', path: indexPath(dictionaryPath) });
            const parentPath = dictionaryPath.replace(/\/dictionary$/, '');

            repository.aem = createAemMock({
                folders: {
                    list: createFolderListStub({ [fallbackDictPath.replace(/\/dictionary$/, '')]: ['dictionary'] }),
                    create: sandbox.stub().resolves({}),
                },
            });
            sandbox
                .stub(repository, 'fetchIndexFragment')
                .callsFake(async (path) => (path === indexPath(fallbackDictPath) ? fallbackIndex : null));
            sandbox.stub(repository, 'ensureIndexFallbackFields').resolvesArg(0);
            const createStub = sandbox.stub(repository, 'createDictionaryIndexFragment').resolves(createdIndex);

            const result = await repository.ensureDictionaryIndex(dictionaryPath);

            expect(createStub.calledOnce).to.be.true;
            expect(createStub.firstCall.args[0]).to.deep.include({
                parentPath: dictionaryPath,
                parentReference: fallbackIndex.path,
            });
            expect(result).to.equal(createdIndex);
            expect(repository.aem.folders.list.calledWith(parentPath)).to.be.true;
            expect(repository.aem.folders.create.calledWith(parentPath, 'dictionary', 'dictionary')).to.be.true;
        });

        // Test: When creating a dictionary index (e.g., ccd/fr_CA), if the same-surface fallback exists
        // (e.g., ccd/fr_FR), it should use that as the parent reference, even if ACOM fallback also exists.
        it('derives the parent reference from the surface fallback locale', async () => {
            const repository = createRepository();
            const dictionaryPath = dictPath(SURFACES.CCD, 'fr_CA');
            const fallbackDictPath = dictPath(SURFACES.CCD, 'fr_FR');
            const acomDictPath = dictPath(SURFACES.ACOM, 'fr_FR');
            const acomIndex = createFragment({ id: 'acom-index', path: indexPath(acomDictPath) });
            const fallbackIndex = createFragment({ id: 'fallback-index', path: indexPath(fallbackDictPath) });
            const createdIndex = createFragment({ id: 'ccd-index', path: indexPath(dictionaryPath) });
            const parentPath = dictionaryPath.replace(/\/dictionary$/, '');

            repository.aem = createAemMock({
                folders: {
                    list: createFolderListStub({
                        [acomDictPath.replace(/\/dictionary$/, '')]: ['dictionary'],
                        [fallbackDictPath.replace(/\/dictionary$/, '')]: ['dictionary'],
                    }),
                    create: sandbox.stub().resolves({}),
                },
            });
            sandbox.stub(repository, 'fetchIndexFragment').callsFake(async (path) => {
                if (path === indexPath(acomDictPath)) return acomIndex;
                if (path === indexPath(fallbackDictPath)) return fallbackIndex;
                return null;
            });
            sandbox.stub(repository, 'ensureIndexFallbackFields').resolvesArg(0);
            const createStub = sandbox.stub(repository, 'createDictionaryIndexFragment').resolves(createdIndex);

            const result = await repository.ensureDictionaryIndex(dictionaryPath);

            expect(createStub.calledOnce).to.be.true;
            expect(createStub.firstCall.args[0]).to.deep.include({
                parentPath: dictionaryPath,
                parentReference: fallbackIndex.path,
            });
            expect(result).to.equal(createdIndex);
            expect(repository.aem.folders.list.calledWith(parentPath)).to.be.true;
            expect(repository.aem.folders.create.calledWith(parentPath, 'dictionary', 'dictionary')).to.be.true;
        });

        // Test: When creating a dictionary index (e.g., ccd/fr_CA), if the same-surface fallback doesn't exist
        // (e.g., ccd/fr_FR), it should recursively create it first. During that creation, since fr_FR has no
        // fallback locale, it should use the ACOM fallback (acom/fr_FR) as parent. Then ccd/fr_CA uses ccd/fr_FR.
        it('recursively creates surface fallback when missing, then uses ACOM fallback for it', async () => {
            const repository = createRepository();
            const dictionaryPath = dictPath(SURFACES.CCD, 'fr_CA');
            const fallbackDictPath = dictPath(SURFACES.CCD, 'fr_FR');
            const acomDictPath = dictPath(SURFACES.ACOM, 'fr_FR');
            const acomIndex = createFragment({ id: 'acom-index', path: indexPath(acomDictPath) });
            const createdFallbackIndex = createFragment({ id: 'fallback-index', path: indexPath(fallbackDictPath) });
            const createdIndex = createFragment({ id: 'ccd-index', path: indexPath(dictionaryPath) });
            const fallbackParentPath = fallbackDictPath.replace(/\/dictionary$/, '');

            repository.aem = createAemMock({
                folders: {
                    list: createFolderListStub({
                        [acomDictPath.replace(/\/dictionary$/, '')]: ['dictionary'],
                    }),
                    create: sandbox.stub().resolves({}),
                },
            });
            // Surface fallback (ccd/fr_FR) doesn't exist, only ACOM fallback (acom/fr_FR) exists
            sandbox.stub(repository, 'fetchIndexFragment').callsFake(async (path) => {
                if (path === indexPath(acomDictPath)) return acomIndex;
                return null; // ccd/fr_FR doesn't exist yet
            });
            sandbox.stub(repository, 'ensureIndexFallbackFields').resolvesArg(0);
            const createStub = sandbox.stub(repository, 'createDictionaryIndexFragment').callsFake(async (args) => {
                if (args.parentPath === fallbackDictPath) return createdFallbackIndex;
                return createdIndex;
            });

            const result = await repository.ensureDictionaryIndex(dictionaryPath);

            // First creates ccd/fr_FR with acom/fr_FR as parent (step 3)
            expect(createStub.calledTwice).to.be.true;
            expect(createStub.firstCall.args[0]).to.deep.include({
                parentPath: fallbackDictPath,
                parentReference: acomIndex.path,
            });
            // Then creates ccd/fr_CA with ccd/fr_FR as parent (step 2)
            expect(createStub.secondCall.args[0]).to.deep.include({
                parentPath: dictionaryPath,
                parentReference: createdFallbackIndex.path,
            });
            expect(result).to.equal(createdIndex);
            expect(repository.aem.folders.list.calledWith(fallbackParentPath)).to.be.true;
            expect(repository.aem.folders.create.calledWith(fallbackParentPath, 'dictionary', 'dictionary')).to.be.true;
        });

        // Test: When a dictionary index already exists and has a parent reference set, we should return it
        // immediately without checking folders or creating anything. This is the happy path optimization.
        it('returns existing index without touching folders when parent reference is present', async () => {
            const repository = createRepository();
            const dictionaryPath = dictPath(`${SURFACES.ACOM}/surface`, 'en_US');
            const existingIndex = createFragment({
                id: 'existing',
                path: indexPath(dictionaryPath),
                fields: [{ name: 'parent', values: [indexPath(dictionaryPath)] }],
            });

            repository.aem = createAemMock({
                folders: {
                    list: sandbox.stub().rejects(new Error('should not be called')),
                    create: sandbox.stub().rejects(new Error('should not be called')),
                },
            });
            sandbox.stub(repository, 'fetchIndexFragment').resolves(existingIndex);
            const ensureFallbackFieldsStub = sandbox.stub(repository, 'ensureIndexFallbackFields');
            const createIndexStub = sandbox.stub(repository, 'createDictionaryIndexFragment');

            const result = await repository.ensureDictionaryIndex(dictionaryPath);

            expect(result).to.equal(existingIndex);
            expect(ensureFallbackFieldsStub.called).to.be.false;
            expect(createIndexStub.called).to.be.false;
            expect(repository.aem.folders.list.called).to.be.false;
            expect(repository.aem.folders.create.called).to.be.false;
        });

        // Test: When dictionary indices exist but are missing parent references in the fallback chain,
        // it should repair the entire chain. For example, if ccd/fr_LU exists but has no parent,
        // and ccd/fr_FR exists but has no parent, it should:
        // 1. First repair ccd/fr_FR to point to acom/fr_FR
        // 2. Then repair ccd/fr_LU to point to ccd/fr_FR
        // This ensures the complete fallback chain is properly linked.
        it('repairs missing parent references up to ACOM without publishing', async () => {
            const repository = createRepository();
            const surfacePath = SURFACES.CCD;
            const dictionaryPath = dictPath(surfacePath, 'fr_LU');
            const fallbackDictPath = dictPath(surfacePath, 'fr_FR');
            const acomDictPath = dictPath(SURFACES.ACOM, 'fr_FR');

            const frLuIndex = createFragment({ id: 'fr_LU', path: indexPath(dictionaryPath) });
            const frFrIndex = createFragment({ id: 'fr_FR', path: indexPath(fallbackDictPath) });
            const acomIndex = createFragment({
                id: 'acom',
                path: indexPath(acomDictPath),
                fields: [{ name: 'parent', values: [indexPath(acomDictPath)] }],
            });

            const indexMap = {
                [indexPath(dictionaryPath)]: frLuIndex,
                [indexPath(fallbackDictPath)]: frFrIndex,
                [indexPath(acomDictPath)]: acomIndex,
            };
            repository.aem = createAemMock({ folders: {} });
            sandbox.stub(repository, 'fetchIndexFragment').callsFake(async (path) => indexMap[path] || null);
            sandbox.stub(repository, 'ensureDictionaryFolder').rejects(new Error('unexpected'));
            const ensureFallbackFieldsStub = sandbox
                .stub(repository, 'ensureIndexFallbackFields')
                .callsFake(async (index, parentRef) => ({ ...index, fields: [{ name: 'parent', values: [parentRef] }] }));
            sandbox.stub(repository, 'createDictionaryIndexFragment').rejects(new Error('should not create'));
            sandbox.stub(repository, 'publishFragment');

            const result = await repository.ensureDictionaryIndex(dictionaryPath);

            expect(result.fields[0].values[0]).to.equal(indexPath(fallbackDictPath));
            expect(ensureFallbackFieldsStub.callCount).to.equal(2);
            expect(ensureFallbackFieldsStub.firstCall.args).to.deep.equal([frFrIndex, indexPath(acomDictPath)]);
            expect(ensureFallbackFieldsStub.secondCall.args).to.deep.equal([frLuIndex, indexPath(fallbackDictPath)]);
            expect(repository.createDictionaryIndexFragment.called).to.be.false;
            expect(repository.ensureDictionaryFolder.called).to.be.false;
            expect(repository.publishFragment.called).to.be.false;
        });

        // Test: When ensuring a dictionary index (e.g., ccd/fr_LU) that already has the correct parent
        // reference (e.g., ccd/fr_FR), but the parent (ccd/fr_FR) itself is missing its parent reference,
        // it should still repair the parent's chain. This ensures the entire fallback chain is always complete,
        // even if the current index is already correct.
        it('updates fallback chain even when current locale already references it', async () => {
            const repository = createRepository();
            const surfacePath = SURFACES.CCD;
            const dictionaryPath = dictPath(surfacePath, 'fr_LU');
            const fallbackDictPath = dictPath(surfacePath, 'fr_FR');
            const acomDictPath = dictPath(SURFACES.ACOM, 'fr_FR');

            const frLuIndex = createFragment({
                id: 'fr_LU',
                path: indexPath(dictionaryPath),
                fields: [{ name: 'parent', values: [indexPath(fallbackDictPath)] }],
            });
            const frFrIndex = createFragment({ id: 'fr_FR', path: indexPath(fallbackDictPath) });
            const acomIndex = createFragment({ id: 'acom', path: indexPath(acomDictPath) });

            const indexMap = {
                [indexPath(dictionaryPath)]: frLuIndex,
                [indexPath(fallbackDictPath)]: frFrIndex,
                [indexPath(acomDictPath)]: acomIndex,
            };
            repository.aem = createAemMock({ folders: {} });
            sandbox.stub(repository, 'fetchIndexFragment').callsFake(async (path) => indexMap[path] || null);
            sandbox.stub(repository, 'ensureDictionaryFolder').rejects(new Error('unexpected'));
            const ensureFallbackFieldsStub = sandbox
                .stub(repository, 'ensureIndexFallbackFields')
                .callsFake(async (index, parentRef) => ({ ...index, fields: [{ name: 'parent', values: [parentRef] }] }));
            sandbox.stub(repository, 'createDictionaryIndexFragment').rejects(new Error('should not create'));

            const result = await repository.ensureDictionaryIndex(dictionaryPath);

            expect(result).to.equal(frLuIndex);
            expect(result.fields[0].values[0]).to.equal(indexPath(fallbackDictPath));
            expect(ensureFallbackFieldsStub.calledOnce).to.be.true;
            expect(ensureFallbackFieldsStub.firstCall.args).to.deep.equal([frFrIndex, indexPath(acomDictPath)]);
            expect(repository.createDictionaryIndexFragment.called).to.be.false;
            expect(repository.ensureDictionaryFolder.called).to.be.false;
        });
    });
});
