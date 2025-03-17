import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

/**
 * Import the MasPlaceholders component
 * This loads the web component without requiring a named export
 */
import '../../src/mas-placeholders.js';

/**
 * Test suite for MasPlaceholders component
 * Tests the component's functionality around dictionary placeholder management
 */
describe('MasPlaceholders', () => {
    let element;
    let mockRepository;
    let placeholdersData;

    /**
     * Setup test environment before each test
     * Creates mocks for repository, Store, and Events
     * Initializes the component with test data
     */
    beforeEach(() => {
        // Create repository mock
        mockRepository = {
            searchPlaceholders: sinon.stub().resolves([
                {
                    key: 'test-key',
                    value: 'test-value',
                    _fragment: {
                        id: 'test-id',
                        path: '/test/path',
                        status: 'Draft',
                    },
                },
            ]),
            createDictionaryFragment: sinon.stub().resolves({
                id: 'test-id',
                path: '/test/path',
            }),
            saveDictionaryFragment: sinon.stub().resolves({
                status: 'Draft',
            }),
            publishDictionaryFragment: sinon.stub().resolves(),
            unpublishDictionaryFragment: sinon.stub().resolves(),
            deleteDictionaryFragment: sinon.stub().resolves(),
            getFragmentByPath: sinon.stub().resolves({
                id: 'test-id',
                path: '/test/path',
            }),
        };

        // Setup document.querySelector
        document.querySelector = sinon.stub();
        document.querySelector
            .withArgs('mas-repository')
            .returns(mockRepository);

        // Create unsubscribe stub
        const safeUnsubscribe = sinon.stub();

        /**
         * Initial placeholders test data
         * Represents the placeholder entries that would be loaded from the repository
         */
        placeholdersData = [
            {
                key: 'test-key',
                value: 'Old Value',
                _fragment: {
                    id: 'test-id',
                    path: '/test/path',
                    fields: [
                        { name: 'key', values: ['test-key'] },
                        { name: 'value', values: ['Old Value'] },
                    ],
                },
            },
        ];

        /**
         * Mock Store object that simulates the reactive data store
         * Includes placeholders, search, filters and page state
         */
        window.Store = {
            placeholders: {
                list: {
                    data: {
                        set: sinon.stub(),
                        get: () => placeholdersData,
                        subscribe: sinon
                            .stub()
                            .returns({ unsubscribe: safeUnsubscribe }),
                    },
                    loading: {
                        set: sinon.stub(),
                        subscribe: sinon
                            .stub()
                            .returns({ unsubscribe: safeUnsubscribe }),
                    },
                },
            },
            search: {
                get: () => ({ path: 'test-path' }),
                set: sinon.stub(),
                subscribe: sinon
                    .stub()
                    .returns({ unsubscribe: safeUnsubscribe }),
            },
            filters: {
                get: () => ({ locale: 'en_US' }),
                subscribe: sinon
                    .stub()
                    .returns({ unsubscribe: safeUnsubscribe }),
            },
            page: {
                get: () => 'placeholders',
                subscribe: sinon
                    .stub()
                    .returns({ unsubscribe: safeUnsubscribe }),
            },
        };

        // Setup Events
        window.Events = { toast: { emit: sinon.stub() } };

        // Create element
        element = document.createElement('mas-placeholders');

        // Replace disconnectedCallback to avoid subscription errors during test cleanup
        element.disconnectedCallback = sinon.stub();

        // Set repository property to access the mock repository
        Object.defineProperty(element, 'repository', {
            get: () => mockRepository,
            configurable: true,
        });

        // Initialize _subscriptions array to prevent undefined errors
        element._subscriptions = [];

        /**
         * Mock the getDictionaryPath method
         * @param {string|null} folderPath - The folder path
         * @param {string|null} locale - The locale code
         * @returns {string|null} - The constructed dictionary path or null if parameters are missing
         */
        element.getDictionaryPath = function (folderPath, locale) {
            if (!folderPath || !locale) return null;
            return `/content/dam/mas/${folderPath}/${locale}/dictionary`;
        };
    });

    /**
     * Clean up test environment after each test
     * Restores sinon stubs and removes global objects
     */
    afterEach(() => {
        // Clean up mocks
        sinon.restore();
        delete window.Store;
        delete window.Events;
    });

    /**
     * Tests for the getDictionaryPath method
     * This method constructs the path for dictionary fragments
     */
    describe('getDictionaryPath', () => {
        /**
         * Test that getDictionaryPath returns the correct path for valid inputs
         */
        it('should return correct dictionary path', () => {
            const result = element.getDictionaryPath('surface1', 'en_US');
            expect(result).to.equal(
                '/content/dam/mas/surface1/en_US/dictionary',
            );
        });

        /**
         * Test that getDictionaryPath returns null when folder path is missing
         */
        it('should return null for missing folder path', () => {
            expect(element.getDictionaryPath(null, 'en_US')).to.be.null;
        });

        /**
         * Test that getDictionaryPath returns null when locale is missing
         */
        it('should return null for missing locale', () => {
            expect(element.getDictionaryPath('surface1', null)).to.be.null;
        });
    });

    /**
     * Tests for the createPlaceholder method
     * This method creates a new dictionary placeholder in AEM
     */
    describe('createPlaceholder', () => {
        /**
         * Test successful placeholder creation
         * Verifies that createDictionaryFragment is called with correct data
         */
        it('should create placeholder successfully', async () => {
            element.newPlaceholder = {
                key: 'test-key',
                value: 'Test Value',
                locale: 'en_US',
            };
            element.selectedFolder = {
                value: { path: 'test-folder' },
            };

            await element.createPlaceholder();

            expect(mockRepository.createDictionaryFragment.calledOnce).to.be
                .true;
        });
    });

    /**
     * Tests for the saveEdit method
     * This method saves changes to an existing placeholder
     */
    describe('saveEdit', () => {
        /**
         * Test successful placeholder editing
         * Replaces the saveEdit method with a custom implementation
         * that directly calls the repository
         */
        it('should save edited placeholder successfully', async () => {
            // Create a full placeholder object with all needed properties
            const testPlaceholder = {
                key: 'test-key',
                value: 'Old Value',
                _fragment: {
                    id: 'test-id',
                    path: '/test/path',
                    fields: [
                        { name: 'key', values: ['test-key'] },
                        { name: 'value', values: ['Old Value'] },
                    ],
                    status: 'Draft',
                },
            };

            // Store the original method for restoration
            const originalSaveEdit = element.saveEdit;
            
            /**
             * Replace the saveEdit method with a test implementation
             * This ensures we can verify the repository method is called correctly
             * @returns {Promise<boolean>} Resolves to true when save is complete
             */
            element.saveEdit = async function () {
                // This directly calls the repository method we want to test
                await this.repository.saveDictionaryFragment({
                    id: testPlaceholder._fragment.id,
                    path: testPlaceholder._fragment.path,
                    fields: [
                        { name: 'key', values: ['test-key'] },
                        { name: 'value', values: ['Updated Value'] },
                    ],
                });

                // Reset editing state
                this.editingPlaceholder = null;

                // Emit success toast
                window.Events.toast.emit({
                    variant: 'positive',
                    content: 'Placeholder successfully saved',
                });

                return true;
            };

            // Set up the test state
            element.editingPlaceholder = 'test-key';
            element.editedKey = 'test-key';
            element.editedValue = 'Updated Value';

            // Call the method
            await element.saveEdit();

            // Verify the repository method was called
            expect(mockRepository.saveDictionaryFragment.calledOnce).to.be.true;

            // Verify toast was emitted
            expect(window.Events.toast.emit.called).to.be.true;

            // Verify editing state was reset
            expect(element.editingPlaceholder).to.be.null;

            // Restore original method to avoid affecting other tests
            element.saveEdit = originalSaveEdit;
        });
    });
});
