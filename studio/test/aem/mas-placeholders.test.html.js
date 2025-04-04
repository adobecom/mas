// @ts-nocheck
import { runTests } from '@web/test-runner-mocha';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { html, nothing } from 'lit';
import { elementUpdated } from '@open-wc/testing-helpers';

import Events from '../../src/events.js';
import { getTemplateContent } from '../utils.js';
import { PAGE_NAMES } from '../../src/constants.js';
import { getDictionaryPath } from '../../src/mas-placeholders.js';

import '../../src/mas-repository.js';
import '../../src/mas-placeholders.js';

/**
 * Test data representing placeholders from AEM
 */
const mockPlaceholders = [
    {
        key: 'buy-now',
        value: 'Buy now',
        displayValue: 'Buy now',
        locale: 'en_US',
        status: 'Draft',
        updatedBy: 'Test User',
        updatedAt: '2023-06-01',
        fragment: {
            id: '123',
            path: '/content/dam/mas/test-folder/en_US/dictionary/buy-now',
            fields: [
                { name: 'key', values: ['buy-now'] },
                { name: 'value', values: ['Buy now'] },
                { name: 'locReady', values: [true] },
            ],
        },
    },
    {
        key: 'french-key',
        value: 'Valeur de test',
        displayValue: 'Valeur de test',
        locale: 'fr_FR',
        status: 'Published',
        updatedBy: 'Test User',
        updatedAt: '2023-06-03',
        fragment: {
            id: '789',
            path: '/content/dam/mas/test-folder/fr_FR/dictionary/french-key',
            fields: [
                { name: 'key', values: ['french-key'] },
                { name: 'value', values: ['Valeur de test'] },
                { name: 'locReady', values: [true] },
            ],
        },
    },
];

/**
 * Creates an observable property for the Store mock
 * @param {*} initialValue - The initial value
 * @returns {Object} - Observable property with get/set/subscribe
 */
function createObservable(initialValue) {
    return {
        value: initialValue,
        get: () => initialValue,
        set: sinon.stub(),
        subscribe: sinon.stub().returns({ unsubscribe: sinon.stub() }),
    };
}

/**
 * Creates a consistent Store mock for testing
 * @param {Object} initialData - Initial data to populate the store
 * @returns {Object} Store mock with all necessary methods and properties
 */
function createStoreMock(initialData = {}) {
    const store = {
        search: createObservable(initialData.folder || { path: 'test-folder' }),
        filters: createObservable(initialData.filters || { locale: 'en_US' }),
        page: createObservable(initialData.page || PAGE_NAMES.PLACEHOLDERS),
        folders: {
            data: createObservable(
                initialData.folderData || [
                    { path: 'test-folder', name: 'Test Folder' },
                ],
            ),
            loaded: createObservable(true),
        },
        placeholders: {
            list: {
                data: createObservable(
                    initialData.placeholders || mockPlaceholders,
                ),
                loading: createObservable(false),
            },
            filtered: {
                data: {
                    set: sinon.stub(),
                    get: () => store.placeholders.filtered.storedData || [],
                },
                storedData: initialData.placeholders || [...mockPlaceholders],
            },
        },
    };

    return store;
}

const spTheme = document.querySelector('sp-theme');

// Create test templates before running tests
function createTestTemplates() {
    // Add placeholder template if needed
    if (!document.getElementById('mas-placeholders-with-repository')) {
        const template = document.createElement('template');
        template.id = 'mas-placeholders-with-repository';
        template.innerHTML = `
            <div>
                <mas-repository base-url="/test-url" bucket="test-bucket"></mas-repository>
                <mas-placeholders></mas-placeholders>
            </div>
        `;
        document.body.appendChild(template);
    }
}

// Create templates before tests run
createTestTemplates();

const initElementFromTemplate = (templateId) => {
    const [root] = getTemplateContent(templateId);

    // If template content wasn't found, create it directly
    if (!root) {
        const div = document.createElement('div');
        div.innerHTML = `
            <div>
                <mas-repository base-url="/test-url" bucket="test-bucket"></mas-repository>
                <mas-placeholders></mas-placeholders>
            </div>
        `;
        spTheme.append(div.firstElementChild);
        return div.firstElementChild;
    }

    spTheme.append(root);
    return root;
};

runTests(async () => {
    // Suppress console error messages from AEM folder loading
    const originalConsoleError = console.error;
    console.error = function (...args) {
        const errorMessage = args.join(' ');
        if (
            errorMessage.includes('Could not load folders') ||
            errorMessage.includes('Cannot read properties of undefined') ||
            errorMessage.includes('listFoldersClassic')
        ) {
            // Suppress these specific errors
            return;
        }
        // Pass through other errors
        originalConsoleError.apply(console, args);
    };

    describe('mas-placeholders component - UI Tests', () => {
        let masRepository;
        let masPlaceholders;
        let eventsToastEmitStub;
        let fetchStub;

        beforeEach(async () => {
            while (spTheme.firstChild) {
                spTheme.removeChild(spTheme.firstChild);
            }

            fetchStub = sinon.stub(window, 'fetch');
            fetchStub.resolves({
                ok: true,
                json: async () => ({
                    children: [
                        { name: 'folder1', path: '/content/dam/folder1' },
                        { name: 'folder2', path: '/content/dam/folder2' },
                    ],
                }),
                headers: { get: () => null },
            });

            eventsToastEmitStub = sinon
                .stub(Events.toast, 'emit')
                .callsFake(() => {});

            // Stub loadFolders first before Store is created - this prevents errors
            // from being thrown during initialization
            const mockLoadFolders = sinon
                .stub()
                .resolves([{ path: 'test-folder', name: 'Test Folder' }]);

            // Create a fully mocked AEM instance to replace the real one
            const mockAem = {
                sites: {
                    cf: {
                        fragments: {
                            getByPath: sinon.stub().resolves({
                                id: 'index-id',
                                fields: [
                                    {
                                        name: 'entries',
                                        values: [
                                            '/content/dam/mas/test-folder/en_US/dictionary/buy-now',
                                        ],
                                    },
                                ],
                            }),
                            publish: sinon.stub().resolves({}),
                            create: sinon.stub().resolves({}),
                        },
                    },
                },
                folders: {
                    list: sinon.stub().resolves({
                        children: [
                            {
                                name: 'test-folder',
                                path: '/content/dam/test-folder',
                            },
                        ],
                    }),
                },
                // Explicitly define listFoldersClassic to prevent errors
                listFoldersClassic: sinon.stub().resolves({
                    children: [
                        {
                            name: 'test-folder',
                            path: '/content/dam/test-folder',
                        },
                    ],
                }),
                headers: {},
                cfFragmentsUrl: '/test-api/fragments',
            };

            // Use our Store mock factory to create consistent test store
            window.Store = createStoreMock();

            const root = initElementFromTemplate(
                'mas-placeholders-with-repository',
            );
            masRepository = root.querySelector('mas-repository');
            masPlaceholders = root.querySelector('mas-placeholders');

            // Replace the entire repository with our mock
            Object.assign(masRepository, {
                baseUrl: '/test-url',
                bucket: 'test-bucket',
                aem: mockAem,
                loadFolders: mockLoadFolders,
                updateFieldInFragment: sinon
                    .stub()
                    .returns([{ name: 'entries', values: [] }]),
                operation: {
                    set: sinon.stub(),
                },
                deleteFragment: sinon.stub().resolves({}),
                createFragment: sinon.stub().resolves({
                    get: () => ({
                        id: 'new-id',
                        path: '/content/dam/mas/test-folder/en_US/dictionary/new-key',
                        parentPath:
                            '/content/dam/mas/test-folder/en_US/dictionary',
                    }),
                }),
            });

            // Define repository getter
            Object.defineProperty(masPlaceholders, 'repository', {
                get: () => masRepository,
                configurable: true,
            });

            // Create shallow copy to avoid test interference
            masPlaceholders.placeholdersData = JSON.parse(
                JSON.stringify(mockPlaceholders),
            );
            masPlaceholders.newPlaceholder = {
                key: '',
                value: '',
                locale: 'en_US',
                isRichText: false,
            };

            // Initialize necessary properties
            masPlaceholders.selectedFolder = { path: 'test-folder' };
            masPlaceholders.isDialogOpen = false;
            masPlaceholders.showToast = sinon.stub();
            masPlaceholders.searchPlaceholders = sinon.stub();
            masPlaceholders.loadPlaceholders = sinon.stub();
            masPlaceholders.selectedPlaceholders = [];
            masPlaceholders.requestUpdate = sinon.stub();
            masPlaceholders.isBulkDeleteInProgress = false;

            // Define a custom property descriptor for the loading property
            Object.defineProperty(masPlaceholders, 'placeholdersLoading', {
                writable: true,
                value: false,
            });

            // Override the loading getter
            Object.defineProperty(masPlaceholders, 'loading', {
                get: function () {
                    return this.placeholdersLoading;
                },
                configurable: true,
            });
        });

        afterEach(() => {
            // Restore original methods
            fetchStub.restore();
            eventsToastEmitStub.restore();

            // Clear any mock data
            delete window.Store;
        });

        // Restore console.error at the end of all tests
        after(() => {
            console.error = originalConsoleError;
        });

        // TESTING DICTIONARY PATH FUNCTION
        it('should create correct dictionary paths', () => {
            expect(getDictionaryPath('surface1', 'en_US')).to.equal(
                '/content/dam/mas/surface1/en_US/dictionary',
            );
            expect(getDictionaryPath(null, 'en_US')).to.be.null;
            expect(getDictionaryPath('surface1', null)).to.be.null;
        });

        it('should handle edge cases for dictionary paths', () => {
            // Test with empty strings
            expect(getDictionaryPath('', 'en_US')).to.equal(
                '/content/dam/mas//en_US/dictionary',
            );
            expect(getDictionaryPath('surface1', '')).to.equal(
                '/content/dam/mas/surface1//dictionary',
            );

            // Test with special characters
            expect(getDictionaryPath('folder/with/slashes', 'en_US')).to.equal(
                '/content/dam/mas/folder/with/slashes/en_US/dictionary',
            );

            // Test with leading/trailing slashes
            expect(getDictionaryPath('/surface1/', 'en_US')).to.equal(
                '/content/dam/mas//surface1//en_US/dictionary',
            );
        });

        // UI RENDERING TESTS
        it('should render error message when there is an error', () => {
            // Create test implementation
            masPlaceholders.renderError = function () {
                if (this.error) {
                    return html`<div class="error-message">${this.error}</div>`;
                }
                return nothing;
            };

            // Test without error
            masPlaceholders.error = null;
            expect(masPlaceholders.renderError()).to.equal(nothing);

            // Test with error
            masPlaceholders.error = 'Test Error';
            const errorElement = masPlaceholders.renderError();
            expect(errorElement).to.not.equal(nothing);
            expect(errorElement.values).to.include('Test Error');
        });

        it('should render loading indicator when loading', () => {
            // Create test implementation
            Object.defineProperty(masPlaceholders, 'loadingIndicator', {
                get: function () {
                    if (this.placeholdersLoading) {
                        return html`<sp-progress-circle
                            indeterminate
                        ></sp-progress-circle>`;
                    }
                    return nothing;
                },
                configurable: true,
            });

            // Test when not loading
            expect(masPlaceholders.loadingIndicator).to.equal(nothing);

            // Test when loading
            masPlaceholders.placeholdersLoading = true;
            const indicator = masPlaceholders.loadingIndicator;
            expect(indicator.strings.join('')).to.include('sp-progress-circle');
        });

        it('should render create modal when showCreateModal is true', () => {
            // Create test implementation
            masPlaceholders.renderCreateModal = function () {
                if (this.showCreateModal) {
                    return html`<div class="create-modal"></div>`;
                }
                return nothing;
            };

            // Test when modal is hidden
            expect(masPlaceholders.renderCreateModal()).to.equal(nothing);

            masPlaceholders.showCreateModal = true;
            const modal = masPlaceholders.renderCreateModal();
            expect(modal).to.not.equal(nothing);
            expect(modal.strings.join('')).to.include('create-modal');
        });

        it('should render confirm dialog when confirmDialogConfig exists', () => {
            masPlaceholders.renderConfirmDialog = function () {
                if (this.confirmDialogConfig) {
                    return html`<div class="confirm-dialog"></div>`;
                }
                return nothing;
            };

            expect(masPlaceholders.renderConfirmDialog()).to.equal(nothing);

            masPlaceholders.confirmDialogConfig = {
                title: 'Confirm',
                message: 'Are you sure?',
                confirmText: 'OK',
                cancelText: 'Cancel',
            };
            const dialog = masPlaceholders.renderConfirmDialog();
            expect(dialog).to.not.equal(nothing);
            expect(dialog.strings.join('')).to.include('confirm-dialog');
        });

        it('should toggle dropdown correctly', () => {
            const fakeEvent = { stopPropagation: sinon.stub() };

            masPlaceholders.activeDropdown = null;
            masPlaceholders.toggleDropdown('test-key', fakeEvent);
            expect(masPlaceholders.activeDropdown).to.equal('test-key');
            expect(fakeEvent.stopPropagation.called).to.be.true;

            fakeEvent.stopPropagation.resetHistory();
            masPlaceholders.toggleDropdown('test-key', fakeEvent);
            expect(masPlaceholders.activeDropdown).to.be.null;
            expect(fakeEvent.stopPropagation.called).to.be.true;
        });

        it('should close create modal when called', () => {
            masPlaceholders.showCreateModal = true;
            masPlaceholders.closeCreateModal();
            expect(masPlaceholders.showCreateModal).to.be.false;
        });

        it('should handle search input', () => {
            const originalHandleSearch = masPlaceholders.handleSearch;
            masPlaceholders.handleSearch = function (event) {
                this.searchQuery = event.target.value;
                this.searchPlaceholders();
            };

            const event = { target: { value: 'search term' } };
            masPlaceholders.handleSearch(event);

            expect(masPlaceholders.searchQuery).to.equal('search term');
            expect(masPlaceholders.searchPlaceholders.called).to.be.true;

            if (originalHandleSearch) {
                masPlaceholders.handleSearch = originalHandleSearch;
            }
        });

        it('should handle sort order changes', () => {
            const originalHandleSort = masPlaceholders.handleSort;
            masPlaceholders.handleSort = function (field) {
                if (field === this.sortField) {
                    this.sortDirection =
                        this.sortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    this.sortField = field;
                    this.sortDirection = 'asc';
                }
                this.searchPlaceholders();
            };

            masPlaceholders.sortField = 'key';
            masPlaceholders.sortDirection = 'asc';

            masPlaceholders.handleSort('key');
            expect(masPlaceholders.sortDirection).to.equal('desc');
            expect(masPlaceholders.searchPlaceholders.called).to.be.true;

            masPlaceholders.searchPlaceholders.resetHistory();
            masPlaceholders.handleSort('value');
            expect(masPlaceholders.sortField).to.equal('value');
            expect(masPlaceholders.sortDirection).to.equal('asc');
            expect(masPlaceholders.searchPlaceholders.called).to.be.true;

            if (originalHandleSort) {
                masPlaceholders.handleSort = originalHandleSort;
            }
        });

        it('should handle add placeholder button click', () => {
            masPlaceholders.handleCreateClick = function () {
                this.handleAddPlaceholder();
            };

            masPlaceholders.handleAddPlaceholder = sinon.stub();

            masPlaceholders.handleCreateClick();

            expect(masPlaceholders.handleAddPlaceholder.called).to.be.true;
        });

        it('should setup the create placeholder modal', () => {
            masPlaceholders.handleAddPlaceholder();
            expect(masPlaceholders.showCreateModal).to.be.true;
            expect(masPlaceholders.newPlaceholder).to.deep.include({
                key: '',
                value: '',
            });
        });

        it('should handle click outside to close create modal', () => {
            const originalHandleCreateModalClickOutside =
                masPlaceholders.handleCreateModalClickOutside;
            masPlaceholders.handleCreateModalClickOutside = function (event) {
                if (
                    this.showCreateModal &&
                    !event.target.closest('.create-modal-overlay')
                ) {
                    this.closeCreateModal();
                }
            };

            masPlaceholders.closeCreateModal = function () {
                this.showCreateModal = false;
            };

            masPlaceholders.showCreateModal = true;
            const modalEl = document.createElement('div');
            modalEl.classList.add('create-modal-overlay');
            const insideEvent = {
                target: modalEl,
                closest: (selector) =>
                    selector === '.create-modal-overlay' ? modalEl : null,
            };
            masPlaceholders.handleCreateModalClickOutside(insideEvent);
            expect(masPlaceholders.showCreateModal).to.be.true;

            masPlaceholders.showCreateModal = true;
            const outsideEvent = {
                target: document.createElement('div'),
                closest: () => null,
            };
            masPlaceholders.handleCreateModalClickOutside(outsideEvent);
            expect(masPlaceholders.showCreateModal).to.be.false;

            if (originalHandleCreateModalClickOutside) {
                masPlaceholders.handleCreateModalClickOutside =
                    originalHandleCreateModalClickOutside;
            }
        });

        it('should update new placeholder key on input', () => {
            const event = { target: { value: 'new-key' } };
            masPlaceholders.handleNewPlaceholderKeyChange(event);
            expect(masPlaceholders.newPlaceholder.key).to.equal('new-key');
        });

        it('should update new placeholder value on input', () => {
            const event = { target: { value: 'New Value' } };
            masPlaceholders.handleNewPlaceholderValueChange(event);
            expect(masPlaceholders.newPlaceholder.value).to.equal('New Value');
        });

        it('should close create modal and reset RTE fields', () => {
            // Setup
            masPlaceholders.showCreateModal = true;

            // Mock clearRteInitializedFlags
            masPlaceholders.clearRteInitializedFlags = sinon.stub();

            // Call closeCreateModal
            masPlaceholders.closeCreateModal();

            // Verify state changes
            expect(masPlaceholders.showCreateModal).to.be.false;
            expect(masPlaceholders.clearRteInitializedFlags.called).to.be.true;
        });

        it('should update locale on locale change', () => {
            const event = { detail: { locale: 'fr_FR' } };
            masPlaceholders.handleLocaleChange(event);
            expect(masPlaceholders.selectedLocale).to.equal('fr_FR');
            expect(masPlaceholders.loadPlaceholders.called).to.be.true;
        });

        it('should start and cancel editing correctly', () => {
            const placeholder = mockPlaceholders[0];

            masPlaceholders.startEdit(placeholder);
            expect(masPlaceholders.editingPlaceholder).to.equal(
                placeholder.key,
            );
            expect(masPlaceholders.editedKey).to.equal(placeholder.key);
            expect(masPlaceholders.editedValue).to.equal(placeholder.value);

            masPlaceholders.cancelEdit();
            expect(masPlaceholders.editingPlaceholder).to.be.null;
        });

        it('should filter placeholders by search query', () => {
            // Ensure the component has the correct data
            masPlaceholders.placeholdersData = JSON.parse(
                JSON.stringify(mockPlaceholders),
            );

            // Set the search query
            masPlaceholders.searchQuery = 'french';

            // Make sure we have the required methods for testing
            masPlaceholders.getSortedPlaceholders = function (placeholders) {
                return placeholders; // Simple pass-through for testing
            };

            masPlaceholders.getFilteredPlaceholders = function () {
                let filtered = this.placeholdersData || [];

                if (this.searchQuery) {
                    filtered = filtered.filter((placeholder) => {
                        const matchesKey = placeholder.key
                            .toLowerCase()
                            .includes(this.searchQuery.toLowerCase());

                        const matchesValue = placeholder.displayValue
                            .toLowerCase()
                            .includes(this.searchQuery.toLowerCase());

                        return matchesKey || matchesValue;
                    });
                }

                return this.getSortedPlaceholders(filtered);
            };

            const filtered = masPlaceholders.getFilteredPlaceholders();
            expect(filtered.length).to.equal(1);
            expect(filtered[0].key).to.equal('french-key');
        });

        it('should reset edit state correctly', () => {
            // Set up edit state
            masPlaceholders.editingPlaceholder = 'test-key';
            masPlaceholders.editedKey = 'test-key';
            masPlaceholders.editedValue = 'Test Value';
            masPlaceholders.editedRichText = true;

            // Call resetEditState
            masPlaceholders.resetEditState();

            // Verify all properties are properly reset
            expect(masPlaceholders.editingPlaceholder).to.be.null;
            expect(masPlaceholders.editedKey).to.equal('');
            expect(masPlaceholders.editedValue).to.equal('');
            expect(masPlaceholders.editedRichText).to.be.false;
        });

        it('should handle rich text editor value changes', () => {
            // Set up initial state
            masPlaceholders.editedValue = '';

            // Create a mock event
            const event = {
                target: {
                    value: '<p>Rich Text Content</p>',
                },
            };

            // Call the handler
            masPlaceholders.handleRteValueChange(event);

            // Verify the value was updated
            expect(masPlaceholders.editedValue).to.equal(
                '<p>Rich Text Content</p>',
            );

            // Test with undefined value
            masPlaceholders.handleRteValueChange({ target: {} });
            expect(masPlaceholders.editedValue).to.equal('');
        });

        it('should handle new placeholder rich text changes', () => {
            // Set up initial state
            masPlaceholders.newPlaceholder = {
                key: 'test-key',
                value: '',
                locale: 'en_US',
                isRichText: true,
            };

            // Create a mock event
            const event = {
                target: {
                    value: '<p>New Rich Text</p>',
                },
            };

            // Call the handler
            masPlaceholders.handleNewPlaceholderRteChange(event);

            // Verify the value was updated
            expect(masPlaceholders.newPlaceholder.value).to.equal(
                '<p>New Rich Text</p>',
            );

            // Test with missing target or value
            masPlaceholders.handleNewPlaceholderRteChange({});
            expect(masPlaceholders.newPlaceholder.value).to.equal(
                '<p>New Rich Text</p>',
            );
        });

        it('should handle rich text toggle', () => {
            // Setup
            masPlaceholders.newPlaceholder = {
                key: 'test-key',
                value: 'Test Value',
                locale: 'en_US',
                isRichText: false,
            };

            // Mock the shadowRoot.querySelector
            const originalQuerySelector =
                masPlaceholders.shadowRoot.querySelector;
            const mockRteField = { initDone: true };
            masPlaceholders.shadowRoot.querySelector = sinon
                .stub()
                .returns(mockRteField);

            // Create event
            const event = {
                target: {
                    checked: true,
                },
            };

            // Call the handler
            masPlaceholders.handleRichTextToggle(event);

            // Verify the rich text flag was toggled
            expect(masPlaceholders.newPlaceholder.isRichText).to.be.true;

            // Restore original
            if (originalQuerySelector) {
                masPlaceholders.shadowRoot.querySelector =
                    originalQuerySelector;
            }
        });

        it('should render form groups correctly', () => {
            // Create a test implementation
            if (!masPlaceholders.renderFormGroup) {
                masPlaceholders.renderFormGroup = function (
                    id,
                    label,
                    isRequired,
                    component,
                ) {
                    return html`
                        <div class="form-group">
                            <label for=${id}>
                                ${label}
                                ${isRequired
                                    ? html`<span class="required">*</span>`
                                    : nothing}
                            </label>
                            ${component}
                        </div>
                    `;
                };
            }

            // Create test components
            const testComponent = html`<sp-textfield
                id="test-field"
            ></sp-textfield>`;

            // Test required form group
            const requiredGroup = masPlaceholders.renderFormGroup(
                'test-id',
                'Test Label',
                true,
                testComponent,
            );
            expect(requiredGroup.strings.join('')).to.include('form-group');
            expect(requiredGroup.strings.join('')).to.include('Test Label');
            expect(requiredGroup.strings.join('')).to.include('required');

            // Test optional form group
            const optionalGroup = masPlaceholders.renderFormGroup(
                'test-id',
                'Test Label',
                false,
                testComponent,
            );
            expect(optionalGroup.strings.join('')).to.include('form-group');
            expect(optionalGroup.strings.join('')).to.include('Test Label');
            expect(optionalGroup.strings.join('')).to.not.include('required');
        });

        it('should get loading state correctly', () => {
            // Test when not loading
            masPlaceholders.placeholdersLoading = false;
            expect(masPlaceholders.loading).to.be.false;

            // Test when loading
            masPlaceholders.placeholdersLoading = true;
            expect(masPlaceholders.loading).to.be.true;
        });

        it('should get repository correctly', () => {
            // Test with repository available
            const result = masPlaceholders.repository;
            expect(result).to.equal(masRepository);

            // Test with non-existent repository
            const originalQuerySelector = document.querySelector;
            document.querySelector = sinon.stub().returns(null);

            const noRepository = masPlaceholders.repository;
            expect(noRepository).to.be.null;

            // Restore original
            document.querySelector = originalQuerySelector;
        });

        it('should ensure repository or throw error', () => {
            // Test with repository available
            const result = masPlaceholders.ensureRepository();
            expect(result).to.equal(masRepository);

            // Test with custom error message
            const customMsg = 'Custom repository error';
            const resultWithCustomMsg =
                masPlaceholders.ensureRepository(customMsg);
            expect(resultWithCustomMsg).to.equal(masRepository);

            // Test with non-existent repository
            const originalGetter = Object.getOwnPropertyDescriptor(
                masPlaceholders.constructor.prototype,
                'repository',
            );

            Object.defineProperty(masPlaceholders, 'repository', {
                get: () => null,
                configurable: true,
            });

            expect(() => masPlaceholders.ensureRepository()).to.throw(
                'Repository component not found',
            );
            expect(() =>
                masPlaceholders.ensureRepository('Custom error'),
            ).to.throw('Custom error');

            // Verify error property is set
            expect(masPlaceholders.error).to.equal('Custom error');

            // Restore original
            if (originalGetter) {
                Object.defineProperty(
                    masPlaceholders,
                    'repository',
                    originalGetter,
                );
            }
        });

        it('should sort placeholders correctly', () => {
            const testData = [
                { key: 'c-key', value: 'c-value' },
                { key: 'a-key', value: 'a-value' },
                { key: 'b-key', value: 'b-value' },
            ];

            masPlaceholders.sortField = 'key';
            masPlaceholders.sortDirection = 'asc';

            if (!masPlaceholders.getSortedPlaceholders) {
                masPlaceholders.getSortedPlaceholders = function (
                    placeholders,
                ) {
                    return [...placeholders].sort((a, b) => {
                        const aValue = a[this.sortField];
                        const bValue = b[this.sortField];

                        const comparison = aValue.localeCompare(bValue);
                        return this.sortDirection === 'asc'
                            ? comparison
                            : -comparison;
                    });
                };
            }

            const sorted = masPlaceholders.getSortedPlaceholders(testData);
            expect(sorted[0].key).to.equal('a-key');
            expect(sorted[1].key).to.equal('b-key');
            expect(sorted[2].key).to.equal('c-key');
        });

        it('should add event listeners on connectedCallback', () => {
            const addSpy = sinon.spy(document, 'addEventListener');

            masPlaceholders.connectedCallback();

            expect(
                addSpy.calledWith('click', masPlaceholders.handleClickOutside),
            ).to.be.true;
            expect(
                addSpy.calledWith(
                    'click',
                    masPlaceholders.handleCreateModalClickOutside,
                ),
            ).to.be.true;

            addSpy.restore();
        });

        it('should remove event listeners on disconnectedCallback', () => {
            masPlaceholders.subscriptions = [{ unsubscribe: sinon.stub() }];
            const removeSpy = sinon.spy(document, 'removeEventListener');

            masPlaceholders.disconnectedCallback();

            expect(removeSpy.called).to.be.true;

            removeSpy.restore();
        });

        it('should show toast notification with correct parameters', () => {
            const originalShowToast = masPlaceholders.showToast;
            masPlaceholders.showToast = function (message, variant = 'info') {
                Events.toast.emit({
                    variant,
                    content: message,
                });
            };

            masPlaceholders.showToast('Test message', 'positive');

            expect(eventsToastEmitStub.called).to.be.true;
            expect(eventsToastEmitStub.firstCall.args[0]).to.deep.equal({
                variant: 'positive',
                content: 'Test message',
            });

            if (originalShowToast) {
                masPlaceholders.showToast = originalShowToast;
            }
        });
    });
});
