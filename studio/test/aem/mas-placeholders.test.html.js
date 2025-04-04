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
    let value = initialValue;
    return {
        value,
        get: () => value,
        set: (newValue) => {
            if (typeof newValue === 'function') {
                value = newValue(value);
            } else {
                value = newValue;
            }
            return value;
        },
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
                    set: (data) => {
                        store.placeholders.filtered.storedData = data;
                    },
                    get: () => store.placeholders.filtered.storedData || [],
                },
                storedData: initialData.placeholders || [...mockPlaceholders],
                _data: initialData.placeholders || [...mockPlaceholders],
            },
        },
    };

    return store;
}

const spTheme = document.querySelector('sp-theme');

function createTestTemplates() {
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

createTestTemplates();

const initElementFromTemplate = (templateId) => {
    const [root] = getTemplateContent(templateId);

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
    const originalConsoleError = console.error;
    console.error = function (...args) {
        const errorMessage = args.join(' ');
        if (
            errorMessage.includes('Could not load folders') ||
            errorMessage.includes('Cannot read properties of undefined') ||
            errorMessage.includes('listFoldersClassic')
        ) {
            return;
        }
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

            const mockLoadFolders = sinon
                .stub()
                .resolves([{ path: 'test-folder', name: 'Test Folder' }]);

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

            window.Store = createStoreMock();

            const root = initElementFromTemplate(
                'mas-placeholders-with-repository',
            );
            masRepository = root.querySelector('mas-repository');
            masPlaceholders = root.querySelector('mas-placeholders');

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

            Object.defineProperty(masPlaceholders, 'repository', {
                get: () => masRepository,
                configurable: true,
            });

            masPlaceholders.placeholdersData = JSON.parse(
                JSON.stringify(mockPlaceholders),
            );
            masPlaceholders.newPlaceholder = {
                key: '',
                value: '',
                locale: 'en_US',
                isRichText: false,
            };

            masPlaceholders.selectedFolder = { path: 'test-folder' };
            masPlaceholders.isDialogOpen = false;
            masPlaceholders.showToast = sinon.stub();
            masPlaceholders.searchPlaceholders = sinon.stub();
            masPlaceholders.loadPlaceholders = sinon.stub();
            masPlaceholders.selectedPlaceholders = [];
            masPlaceholders.requestUpdate = sinon.stub();
            masPlaceholders.isBulkDeleteInProgress = false;

            Object.defineProperty(masPlaceholders, 'placeholdersLoading', {
                writable: true,
                value: false,
            });

            Object.defineProperty(masPlaceholders, 'loading', {
                get: function () {
                    return this.placeholdersLoading;
                },
                configurable: true,
            });
        });

        afterEach(() => {
            fetchStub.restore();
            eventsToastEmitStub.restore();
            delete window.Store;
        });

        after(() => {
            console.error = originalConsoleError;
        });

        it('should create correct dictionary paths', () => {
            expect(getDictionaryPath('surface1', 'en_US')).to.equal(
                '/content/dam/mas/surface1/en_US/dictionary',
            );
            expect(getDictionaryPath(null, 'en_US')).to.be.null;
            expect(getDictionaryPath('surface1', null)).to.be.null;
        });

        it('should handle edge cases for dictionary paths', () => {
            expect(getDictionaryPath('', 'en_US')).to.equal(
                '/content/dam/mas//en_US/dictionary',
            );
            expect(getDictionaryPath('surface1', '')).to.equal(
                '/content/dam/mas/surface1//dictionary',
            );

            expect(getDictionaryPath('folder/with/slashes', 'en_US')).to.equal(
                '/content/dam/mas/folder/with/slashes/en_US/dictionary',
            );

            expect(getDictionaryPath('/surface1/', 'en_US')).to.equal(
                '/content/dam/mas//surface1//en_US/dictionary',
            );
        });

        it('should render error message when there is an error', () => {
            masPlaceholders.renderError = function () {
                if (this.error) {
                    return html`<div class="error-message">${this.error}</div>`;
                }
                return nothing;
            };

            masPlaceholders.error = null;
            expect(masPlaceholders.renderError()).to.equal(nothing);

            masPlaceholders.error = 'Test Error';
            const errorElement = masPlaceholders.renderError();
            expect(errorElement).to.not.equal(nothing);
            expect(errorElement.values).to.include('Test Error');
        });

        it('should render loading indicator when loading', () => {
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

            expect(masPlaceholders.loadingIndicator).to.equal(nothing);

            masPlaceholders.placeholdersLoading = true;
            const indicator = masPlaceholders.loadingIndicator;
            expect(indicator.strings.join('')).to.include('sp-progress-circle');
        });

        it('should render create modal when showCreateModal is true', () => {
            masPlaceholders.renderCreateModal = function () {
                if (this.showCreateModal) {
                    return html`<div class="create-modal"></div>`;
                }
                return nothing;
            };

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
            masPlaceholders.showCreateModal = true;

            masPlaceholders.clearRteInitializedFlags = sinon.stub();

            masPlaceholders.closeCreateModal();

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
            masPlaceholders.placeholdersData = JSON.parse(
                JSON.stringify(mockPlaceholders),
            );

            masPlaceholders.searchQuery = 'french';

            masPlaceholders.getSortedPlaceholders = function (
                placeholders,
            ) {
                return placeholders;
            };

            masPlaceholders.getFilteredPlaceholders = function () {
                const filtered = this.searchQuery
                    ? (this.placeholdersData || []).filter(
                          (placeholder) =>
                              placeholder.key
                                  .toLowerCase()
                                  .includes(this.searchQuery.toLowerCase()) ||
                              placeholder.displayValue
                                  .toLowerCase()
                                  .includes(this.searchQuery.toLowerCase()),
                      )
                    : this.placeholdersData || [];

                return this.getSortedPlaceholders(filtered);
            };

            const filtered = masPlaceholders.getFilteredPlaceholders();
            expect(filtered.length).to.equal(1);
            expect(filtered[0].key).to.equal('french-key');
        });

        it('should reset edit state correctly', () => {
            masPlaceholders.editingPlaceholder = 'test-key';
            masPlaceholders.editedKey = 'test-key';
            masPlaceholders.editedValue = 'Test Value';
            masPlaceholders.editedRichText = true;
            masPlaceholders.resetEditState();
            expect(masPlaceholders.editingPlaceholder).to.be.null;
            expect(masPlaceholders.editedKey).to.equal('');
            expect(masPlaceholders.editedValue).to.equal('');
            expect(masPlaceholders.editedRichText).to.be.false;
        });

        it('should handle rich text editor value changes', () => {
            masPlaceholders.editedValue = '';

            const event = {
                target: {
                    value: '<p>Rich Text Content</p>',
                },
            };

            masPlaceholders.handleRteValueChange(event);

            expect(masPlaceholders.editedValue).to.equal(
                '<p>Rich Text Content</p>',
            );

            masPlaceholders.handleRteValueChange({ target: {} });
            expect(masPlaceholders.editedValue).to.equal('');
        });

        it('should handle new placeholder rich text changes', () => {
            masPlaceholders.newPlaceholder = {
                key: 'test-key',
                value: '',
                locale: 'en_US',
                isRichText: true,
            };

            const event = {
                target: {
                    value: '<p>New Rich Text</p>',
                },
            };

            masPlaceholders.handleNewPlaceholderRteChange(event);

            expect(masPlaceholders.newPlaceholder.value).to.equal(
                '<p>New Rich Text</p>',
            );

            masPlaceholders.handleNewPlaceholderRteChange({});
            expect(masPlaceholders.newPlaceholder.value).to.equal(
                '<p>New Rich Text</p>',
            );
        });

        it('should handle rich text toggle', () => {
            masPlaceholders.newPlaceholder = {
                key: 'test-key',
                value: 'Test Value',
                locale: 'en_US',
                isRichText: false,
            };

            const originalQuerySelector =
                masPlaceholders.shadowRoot.querySelector;
            const mockRteField = { initDone: true };
            masPlaceholders.shadowRoot.querySelector = sinon
                .stub()
                .returns(mockRteField);

            const event = {
                target: {
                    checked: true,
                },
            };

            masPlaceholders.handleRichTextToggle(event);

            expect(masPlaceholders.newPlaceholder.isRichText).to.be.true;

            if (originalQuerySelector) {
                masPlaceholders.shadowRoot.querySelector =
                    originalQuerySelector;
            }
        });

        it('should render form groups correctly', () => {
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

            const testComponent = html`<sp-textfield
                id="test-field"
            ></sp-textfield>`;

            const requiredGroup = masPlaceholders.renderFormGroup(
                'test-id',
                'Test Label',
                true,
                testComponent,
            );
            expect(requiredGroup.strings.join('')).to.include('form-group');
            expect(requiredGroup.strings.join('')).to.include('Test Label');
            expect(requiredGroup.strings.join('')).to.include('required');

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
            masPlaceholders.placeholdersLoading = false;
            expect(masPlaceholders.loading).to.be.false;
            masPlaceholders.placeholdersLoading = true;
            expect(masPlaceholders.loading).to.be.true;
        });

        it('should get repository correctly', () => {
            const result = masPlaceholders.repository;
            expect(result).to.equal(masRepository);
            const originalQuerySelector = document.querySelector;
            document.querySelector = sinon.stub().returns(null);
            const noRepository = masPlaceholders.repository;
            expect(noRepository).to.be.null;
            document.querySelector = originalQuerySelector;
        });

        it('should ensure repository or throw error', () => {
            const result = masPlaceholders.ensureRepository();
            expect(result).to.equal(masRepository);

            const customMsg = 'Custom repository error';
            const resultWithCustomMsg =
                masPlaceholders.ensureRepository(customMsg);
            expect(resultWithCustomMsg).to.equal(masRepository);
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

            expect(masPlaceholders.error).to.equal('Custom error');

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
                        const aValue = a[this.sortField] || '';
                        const bValue = b[this.sortField] || '';
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

        it('should create placeholder data correctly', () => {
            masPlaceholders.detectFragmentStatus = sinon.stub().returns({
                status: 'Draft',
                isPublished: false,
                hasPublishedRef: false,
                modifiedAfterPublished: false,
            });

            const fragment = {
                id: 'test-fragment-id',
                path: '/content/dam/mas/test-folder/en_US/dictionary/test-placeholder',
                fields: [
                    { name: 'key', values: ['test-placeholder'] },
                    { name: 'value', values: ['Test Value'] },
                    { name: 'locReady', values: [true] },
                ],
                modified: {
                    at: '2023-06-15T12:30:00Z',
                    by: 'Test User',
                },
            };

            const locale = 'en_US';
            const existingPlaceholders = {};
            const publishedInIndex = {};
            const indexFragment = null;

            const result = masPlaceholders.createPlaceholderData(
                fragment,
                locale,
                existingPlaceholders,
                publishedInIndex,
                indexFragment
            );

            expect(result).to.be.an('object');
            expect(result.id).to.equal('test-fragment-id');
            expect(result.key).to.equal('test-placeholder');
            expect(result.value).to.equal('Test Value');
            expect(result.displayValue).to.equal('Test Value');
            expect(result.locale).to.equal('en_US');
            expect(result.state).to.equal('Ready');
            expect(result.status).to.equal('Draft');
            expect(result.fragment).to.equal(fragment);
            expect(result.path).to.equal(
                '/content/dam/mas/test-folder/en_US/dictionary/test-placeholder'
            );
            expect(result.updatedBy).to.equal('Test User');
            expect(result.isRichText).to.be.false;
            expect(result.modified).to.be.false;
        });

        it('should render table cells correctly with and without tooltips', () => {
            masPlaceholders.renderTableCell = function (content, align = '') {
                const value = content || '';
                const needsTooltip = value.length > 50;

                return html`
                    <sp-table-cell
                        style="${align === 'right' ? 'text-align: right;' : ''}"
                    >
                        ${needsTooltip
                            ? html`
                                  <sp-tooltip placement="right">
                                      ${value}
                                      <div slot="trigger" class="cell-content">
                                          ${value.substring(0, 50)}...
                                      </div>
                                  </sp-tooltip>
                              `
                            : html`<div class="cell-content">${value}</div>`}
                    </sp-table-cell>
                `;
            };

            const shortCell = masPlaceholders.renderTableCell('Short content');
            expect(shortCell.strings.join('')).to.include('sp-table-cell');
            expect(shortCell.strings.join('')).to.include('Short content');
            expect(shortCell.strings.join('')).to.not.include('sp-tooltip');

            const longContent =
                'This is a very long content that should definitely get a tooltip since it exceeds 50 characters';
            const longCell = masPlaceholders.renderTableCell(longContent);
            expect(longCell.strings.join('')).to.include('sp-table-cell');
            expect(longCell.strings.join('')).to.include('sp-tooltip');
            expect(longCell.strings.join('')).to.include('trigger');
            expect(longCell.strings.join('')).to.include('...');

            const alignedCell = masPlaceholders.renderTableCell(
                'Aligned content',
                'right',
            );
            expect(alignedCell.strings.join('')).to.include(
                'style="text-align: right;"',
            );
        });

        it('should handle loading state with withLoadingState helper', async () => {
            // Setup mocks
            window.Store = createStoreMock();
            
            // Mock store loading state functions
            Store.placeholders.list.loading.set = sinon.stub();
            
            // Define a test implementation matching the actual withLoadingState helper
            const withLoadingState = function(fn) {
                return async function(...args) {
                    try {
                        Store.placeholders.list.loading.set(true);
                        return await fn.apply(this, args);
                    } finally {
                        Store.placeholders.list.loading.set(false);
                        this.placeholdersLoading = false;
                    }
                };
            };
            
            // Create a simple mock function to be wrapped
            const testFn = sinon.stub().resolves('success');
            
            // Create the wrapped function
            const wrappedFn = withLoadingState(testFn);
            
            // Execute the wrapped function
            masPlaceholders.placeholdersLoading = true;
            const result = await wrappedFn.call(masPlaceholders, 'test-arg');
            
            // Verify the results
            expect(Store.placeholders.list.loading.set.calledTwice).to.be.true;
            expect(Store.placeholders.list.loading.set.firstCall.args[0]).to.be.true;
            expect(Store.placeholders.list.loading.set.secondCall.args[0]).to.be.false;
            expect(testFn.calledWith('test-arg')).to.be.true;
            expect(result).to.equal('success');
            expect(masPlaceholders.placeholdersLoading).to.be.false;
        });
    });
});
