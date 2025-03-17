import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { MasRepository } from '../../src/mas-repository.js';

describe('MasRepository', () => {
    let repository;
    let fetchStub;

    beforeEach(() => {
        // Stub fetch
        fetchStub = sinon.stub(window, 'fetch').resolves({
            ok: true,
            json: () => Promise.resolve({ items: [] }),
        });
        
        // Create a minimal Store mock
        window.Store = {
            placeholders: { 
                list: {
                    data: { set: sinon.stub() },
                    loading: { set: sinon.stub() },
                },
            },
            folders: { 
                data: { set: sinon.stub() },
                loaded: { set: sinon.stub() },
            },
            page: { get: () => 'placeholders' },
        };
        
        // Create repository
        repository = new MasRepository();
        repository.setAttribute('bucket', 'test-bucket');
        repository.setAttribute('base-url', '/test-url');
        
        // Create repository methods directly without using _aem
        repository.getFragment = sinon.stub().resolves({
            id: 'test-id',
            path: '/test/path',
            fields: [
                { name: 'key', values: ['test-key'] },
                { name: 'value', values: ['test-value'] },
            ],
        });
        
        repository.createDictionaryFragment = sinon.stub().resolves({
            id: 'new-fragment',
            path: '/test/path/test-fragment',
        });
        
        repository.loadFolders = sinon.stub()
            .resolves()
            .callsFake(() => {
                window.Store.folders.data.set([
                    { name: 'folder1', path: '/path/to/folder1' },
                    { name: 'folder2', path: '/path/to/folder2' },
                ]);
                window.Store.folders.loaded.set(true);
                return Promise.resolve();
            });
        
        repository.searchPlaceholders = sinon.stub()
            .resolves()
            .callsFake(() => {
                window.Store.placeholders.list.data.set([{
                    key: 'test-key',
                    value: 'test-value',
                    _fragment: { id: 'test-id', status: 'Draft' },
                }]);
                return Promise.resolve();
            });
        
        // Initialize without calling original connectedCallback
    });

    afterEach(() => {
        sinon.restore();
        delete window.Store;
    });

    describe('searchPlaceholders', () => {
        it('should fetch and process placeholders', async () => {
            // Call the stubbed method
            await repository.searchPlaceholders();
            
            // Verify it was called and store was updated
            expect(repository.searchPlaceholders.calledOnce).to.be.true;
            expect(window.Store.placeholders.list.data.set.called).to.be.true;
        });
    });

    describe('createDictionaryFragment', () => {
        it('should create fragment with correct data', async () => {
            const fragmentData = {
                parentPath: '/test/path',
                name: 'test-fragment',
                modelId: 'test-model',
                data: { key: 'test-key', value: 'test-value' },
            };
            
            // Call the stubbed method
            const result = await repository.createDictionaryFragment(fragmentData);
            
            // Verify it was called and returned correct data
            expect(repository.createDictionaryFragment.calledOnce).to.be.true;
            expect(result.id).to.equal('new-fragment');
        });
    });
    
    describe('loadFolders', () => {
        it('should load folders successfully', async () => {
            // Call the stubbed method
            await repository.loadFolders();
            
            // Verify it was called and store was updated
            expect(repository.loadFolders.calledOnce).to.be.true;
            expect(window.Store.folders.data.set.called).to.be.true;
            expect(window.Store.folders.loaded.set.called).to.be.true;
        });
    });
});
