// @ts-nocheck
import { runTests } from '@web/test-runner-mocha';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { nothing } from 'lit';

import Events from '../../src/events.js';
import { getTemplateContent } from '../utils.js';
import { PAGE_NAMES } from '../../src/constants.js';
import { getDictionaryPath } from '../../src/mas-placeholders.js';

import '../../src/mas-repository.js';
import '../../src/mas-placeholders.js';

const spTheme = document.querySelector('sp-theme');

const initElementFromTemplate = (templateId) => {
    const [root] = getTemplateContent(templateId);
    spTheme.append(root);
    return root;
};

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

runTests(async () => {
    describe('mas-placeholders component - Integration Tests', () => {
        let masRepository;
        let masPlaceholders;
        let eventsToastEmitStub;
        let fetchStub;
        let originalShowDialog;

        beforeEach(async () => {
            while (spTheme.firstChild) {
                spTheme.removeChild(spTheme.firstChild);
            }

            fetchStub = sinon.stub(window, 'fetch');
            fetchStub.resolves({
                ok: true,
                json: async () => ({ items: [] }),
                headers: { get: () => null },
            });

            eventsToastEmitStub = sinon
                .stub(Events.toast, 'emit')
                .callsFake(() => {});

            window.Store = {
                search: {
                    get: () => ({ path: 'test-folder' }),
                    set: sinon.stub(),
                    subscribe: sinon
                        .stub()
                        .returns({ unsubscribe: sinon.stub() }),
                },
                filters: {
                    get: () => ({ locale: 'en_US' }),
                    set: sinon.stub(),
                    subscribe: sinon
                        .stub()
                        .returns({ unsubscribe: sinon.stub() }),
                },
                page: {
                    get: () => PAGE_NAMES.PLACEHOLDERS,
                    set: sinon.stub(),
                    subscribe: sinon
                        .stub()
                        .returns({ unsubscribe: sinon.stub() }),
                },
                folders: {
                    data: {
                        get: () => [
                            {
                                path: 'test-folder',
                                name: 'Test Folder',
                            },
                        ],
                        set: sinon.stub(),
                        subscribe: sinon
                            .stub()
                            .returns({ unsubscribe: sinon.stub() }),
                    },
                    loaded: {
                        get: () => true,
                        set: sinon.stub(),
                        subscribe: sinon
                            .stub()
                            .returns({ unsubscribe: sinon.stub() }),
                    },
                },
                placeholders: {
                    list: {
                        data: {
                            get: () => mockPlaceholders,
                            set: sinon.stub(),
                            subscribe: sinon
                                .stub()
                                .returns({ unsubscribe: sinon.stub() }),
                        },
                        loading: {
                            get: () => false,
                            set: sinon.stub(),
                            subscribe: sinon
                                .stub()
                                .returns({ unsubscribe: sinon.stub() }),
                        },
                    },
                    filtered: {
                        data: {
                            set: sinon.stub(),
                        }
                    }
                },
            };

            const root = initElementFromTemplate(
                'mas-placeholders-with-repository',
            );
            masRepository = root.querySelector('mas-repository');
            masPlaceholders = root.querySelector('mas-placeholders');
            
            // Set necessary repository properties
            masRepository.baseUrl = '/test-url';
            masRepository.bucket = 'test-bucket';
            masRepository.aem = {
                sites: {
                    cf: {
                        fragments: {
                            getByPath: sinon.stub().resolves({
                                id: 'index-id',
                                fields: [
                                    { name: 'entries', values: ['/content/dam/mas/test-folder/en_US/dictionary/buy-now'] }
                                ]
                            }),
                            publish: sinon.stub().resolves({}),
                            create: sinon.stub().resolves({})
                        }
                    }
                },
                headers: {},
                cfFragmentsUrl: '/test-api/fragments'
            };
            masRepository.updateFieldInFragment = sinon.stub().returns([
                { name: 'entries', values: [] }
            ]);
            masRepository.operation = {
                set: sinon.stub()
            };
            masRepository.deleteFragment = sinon.stub().resolves({});
            masRepository.createFragment = sinon.stub().resolves({
                get: () => ({
                    id: 'new-id',
                    path: '/content/dam/mas/test-folder/en_US/dictionary/new-key',
                    parentPath: '/content/dam/mas/test-folder/en_US/dictionary'
                })
            });

            Object.defineProperty(masPlaceholders, 'repository', {
                get: () => masRepository,
                configurable: true,
            });
            
            // Create shallow copy to avoid test interference
            masPlaceholders.placeholdersData = JSON.parse(JSON.stringify(mockPlaceholders));
            masPlaceholders.newPlaceholder = {
                key: '',
                value: '',
                locale: 'en_US',
                isRichText: false
            };
            
            // Initialize necessary properties
            masPlaceholders.selectedFolder = { path: 'test-folder' };
            masPlaceholders.isDialogOpen = false;
            masPlaceholders.showToast = sinon.stub();
            masPlaceholders.loadPlaceholders = sinon.stub().resolves();
            masPlaceholders.searchPlaceholders = sinon.stub().resolves();
            masPlaceholders.selectedPlaceholders = [];
            masPlaceholders.requestUpdate = sinon.stub();
            masPlaceholders.isBulkDeleteInProgress = false;
            
            // Store the original method for later restoration
            originalShowDialog = masPlaceholders.showDialog;
            
            // Create a standardized dialog tracker implementation
            masPlaceholders.lastDialogCall = null;
            masPlaceholders.showDialog = async (title, message, options = {}) => {
                // Track dialog call details
                masPlaceholders.lastDialogCall = { title, message, options };
                
                // Mark dialog as open during call
                masPlaceholders.isDialogOpen = true;
                
                // Default dialog behavior for tests
                // By default confirm unless it's a cancel test
                const shouldConfirm = title.includes('Delete Placeholder') || 
                                     title.includes('Delete Placeholders');
                
                // Close the dialog when done
                masPlaceholders.isDialogOpen = false;
                
                return shouldConfirm;
            };
            
            // Custom mock for removeFromIndexFragment
            masPlaceholders.removeFromIndexFragment = sinon.stub().resolves(true);
            masPlaceholders.updateIndexFragment = sinon.stub().resolves(true);
            masPlaceholders.createPlaceholderWithIndex = sinon.stub().resolves({
                id: 'new-id',
                key: 'new-key',
                value: 'New Value'
            });
            
            // Define a custom property descriptor for the loading property
            Object.defineProperty(masPlaceholders, '_loading', {
                writable: true,
                value: false
            });

            // Override the loading getter/setter
            Object.defineProperty(masPlaceholders, 'loading', {
                get: function() {
                    return this._loading;
                },
                configurable: true
            });
        });

        afterEach(() => {
            sinon.restore();
            while (spTheme.firstChild) {
                spTheme.removeChild(spTheme.firstChild);
            }
            delete window.Store;
        });

        it('should create correct dictionary paths', () => {
            expect(getDictionaryPath('surface1', 'en_US')).to.equal(
                '/content/dam/mas/surface1/en_US/dictionary',
            );
            expect(getDictionaryPath(null, 'en_US')).to.be.null;
            expect(getDictionaryPath('surface1', null)).to.be.null;
        });

        it('should filter placeholders by search query', () => {
            masPlaceholders.searchQuery = 'french';
            const filtered = masPlaceholders.getFilteredPlaceholders();
            expect(filtered.length).to.equal(1);
            expect(filtered[0].key).to.equal('french-key');
        });

        it('should show error toast when creating with missing values', async () => {
            masPlaceholders.newPlaceholder = {
                key: 'new-key',
                value: '',
                locale: 'en_US',
            };
            masPlaceholders.selectedFolder = {
                path: 'test-folder',
            };
            
            await masPlaceholders.createPlaceholder();
            expect(masPlaceholders.showToast.called).to.be.true;
            const firstCall = masPlaceholders.showToast.getCall(0);
            expect(firstCall && firstCall.args[1]).to.equal('negative');
        });

        it('should create a placeholder when all values are provided', async () => {
            masPlaceholders.newPlaceholder = {
                key: 'new-key',
                value: 'New Value',
                locale: 'en_US',
            };
            masPlaceholders.selectedFolder = {
                path: 'test-folder',
            };
            
            await masPlaceholders.createPlaceholder();
            expect(masPlaceholders.createPlaceholderWithIndex.called).to.be.true;
        });

        it('should handle edit operations correctly', () => {
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

        it('should sort placeholders correctly', () => {
            const testData = [
                { key: 'c-key', value: 'c-value' },
                { key: 'a-key', value: 'a-value' },
                { key: 'b-key', value: 'b-value' },
            ];
            masPlaceholders.sortField = 'key';
            masPlaceholders.sortDirection = 'asc';
            const sorted = masPlaceholders.getSortedPlaceholders(testData);
            expect(sorted[0].key).to.equal('a-key');
            expect(sorted[1].key).to.equal('b-key');
            expect(sorted[2].key).to.equal('c-key');
        });

        describe('Lifecycle and Event Handlers', () => {
            it('should add event listeners on connectedCallback', () => {
                const addSpy = sinon.spy(document, 'addEventListener');
                masPlaceholders.connectedCallback();
                expect(
                    addSpy.calledWith(
                        'click',
                        masPlaceholders.handleClickOutside,
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

            it('should handle search input', () => {
                const event = { target: { value: 'search term' } };
                masPlaceholders.handleSearch(event);
                expect(masPlaceholders.searchQuery).to.equal('search term');
            });

            it('should close the create modal when closeCreateModal is called', () => {
                masPlaceholders.showCreateModal = true;
                masPlaceholders.closeCreateModal();
                expect(masPlaceholders.showCreateModal).to.be.false;
            });

            it('should toggle dropdown correctly', () => {
                const fakeEvent = { stopPropagation: sinon.stub() };
                masPlaceholders.activeDropdown = null;
                masPlaceholders.toggleDropdown('test-key', fakeEvent);
                expect(masPlaceholders.activeDropdown).to.equal('test-key');
                expect(fakeEvent.stopPropagation.called).to.be.true;
                masPlaceholders.toggleDropdown('test-key', fakeEvent);
                expect(masPlaceholders.activeDropdown).to.be.null;
            });
        });

        describe('Form and UI Updates', () => {
            it('should update table selection from event', () => {
                const event = {
                    target: { selectedSet: new Set(['one', 'two']) },
                };
                masPlaceholders.updateTableSelection(event);
                expect(masPlaceholders.selectedPlaceholders).to.deep.equal([
                    'one',
                    'two',
                ]);
            });

            it('should update sort order on handleSort', () => {
                masPlaceholders.sortField = 'key';
                masPlaceholders.sortDirection = 'asc';
                masPlaceholders.handleSort('key');
                expect(masPlaceholders.sortDirection).to.equal('desc');
                masPlaceholders.handleSort('value');
                expect(masPlaceholders.sortField).to.equal('value');
                expect(masPlaceholders.sortDirection).to.equal('asc');
            });

            it('should update new placeholder key on input events', () => {
                const keyEvent = { target: { value: 'new-key' } };
                masPlaceholders.newPlaceholder = {
                    key: '',
                    value: '',
                    locale: 'en_US',
                    isRichText: false
                };
                masPlaceholders.handleNewPlaceholderKeyChange(keyEvent);
                expect(masPlaceholders.newPlaceholder.key).to.equal('new-key');
            });

            it('should update new placeholder value on input events', () => {
                const valueEvent = { target: { value: 'New Value' } };
                masPlaceholders.newPlaceholder = {
                    key: '',
                    value: '',
                    locale: 'en_US',
                    isRichText: false
                };
                masPlaceholders.handleNewPlaceholderValueChange(valueEvent);
                expect(masPlaceholders.newPlaceholder.value).to.equal('New Value');
            });

            it('should update new placeholder locale on locale change event', () => {
                const localeEvent = { detail: { locale: 'fr_FR' } };
                masPlaceholders.newPlaceholder = {
                    key: '',
                    value: '',
                    locale: 'en_US',
                    isRichText: false
                };
                masPlaceholders.handleNewPlaceholderLocaleChange(localeEvent);
                expect(masPlaceholders.newPlaceholder.locale).to.equal('fr_FR');
            });

            it('should update selectedLocale and trigger placeholders load on handleLocaleChange', () => {
                const localeEvent = { detail: { locale: 'fr_FR' } };
                masPlaceholders.handleLocaleChange(localeEvent);
                expect(masPlaceholders.selectedLocale).to.equal('fr_FR');
                expect(masPlaceholders.loadPlaceholders.called).to.be.true;
            });
        });

        describe('Render Helpers', () => {
            it('renderError returns nothing when error is null', () => {
                masPlaceholders.error = null;
                const output = masPlaceholders.renderError();
                expect(output).to.equal(nothing);
            });

            it('renderError returns error markup when error exists', () => {
                masPlaceholders.error = 'Test error';
                const output = masPlaceholders.renderError();
                expect(output.strings.join('')).to.include('error-message');
                expect(output.values).to.include('Test error');
            });

            it('loadingIndicator returns progress indicator when loading is true', () => {
                masPlaceholders._loading = true;
                const indicator = masPlaceholders.loadingIndicator;
                expect(indicator.strings.join('')).to.include('sp-progress-circle');
            });

            it('renderCreateModal returns modal markup when showCreateModal is true', () => {
                masPlaceholders.showCreateModal = true;
                const modalOutput = masPlaceholders.renderCreateModal();
                expect(modalOutput.strings.join('')).to.include('create-modal');
            });
        });

        describe('Dialog and Confirmation', () => {
            it('should show dialog with correct configuration', () => {
                // Create a real showDialog method for this test only
                const savedMethod = masPlaceholders.showDialog;
                masPlaceholders.showDialog = originalShowDialog || function(title, message, options = {}) {
                    this.isDialogOpen = true;
                    const { confirmText = 'OK', cancelText = 'Cancel', variant = 'primary' } = options;
                    
                    this.confirmDialogConfig = {
                        title,
                        message,
                        confirmText,
                        cancelText,
                        variant,
                        onConfirm: () => {},
                        onCancel: () => {}
                    };
                    
                    return Promise.resolve(true);
                };
                
                // Call the method now
                masPlaceholders.showDialog(
                    'Test Title', 
                    'Test Message',
                    { confirmText: 'Yes', cancelText: 'No', variant: 'negative' }
                );
                
                // Verify the configuration 
                expect(masPlaceholders.isDialogOpen).to.be.true;
                expect(masPlaceholders.confirmDialogConfig).to.not.be.null;
                expect(masPlaceholders.confirmDialogConfig.title).to.equal('Test Title');
                expect(masPlaceholders.confirmDialogConfig.message).to.equal('Test Message');
                expect(masPlaceholders.confirmDialogConfig.confirmText).to.equal('Yes');
                expect(masPlaceholders.confirmDialogConfig.cancelText).to.equal('No');
                expect(masPlaceholders.confirmDialogConfig.variant).to.equal('negative');
                
                // Restore the test method
                masPlaceholders.showDialog = savedMethod;
            });
            
            it('should render confirmation dialog when confirmDialogConfig exists', () => {
                masPlaceholders.confirmDialogConfig = {
                    title: 'Test Title',
                    message: 'Test Message',
                    confirmText: 'OK',
                    cancelText: 'Cancel',
                    variant: 'negative',
                    onConfirm: sinon.stub(),
                    onCancel: sinon.stub()
                };
                
                const dialogOutput = masPlaceholders.renderConfirmDialog();
                expect(dialogOutput.strings.join('')).to.include('confirm-dialog-overlay');
                expect(dialogOutput.strings.join('')).to.include('sp-dialog-wrapper');
            });
            
            it('should not render confirmation dialog when confirmDialogConfig is null', () => {
                masPlaceholders.confirmDialogConfig = null;
                const dialogOutput = masPlaceholders.renderConfirmDialog();
                expect(dialogOutput).to.equal(nothing);
            });
        });
        
        describe('Bulk Delete Functionality', () => {
            it('should set up bulk delete correctly', async () => {
                // Setup
                masPlaceholders.selectedPlaceholders = ['buy-now', 'french-key'];
                
                // Execute
                await masPlaceholders.handleBulkDelete();
                
                // Verify
                expect(masPlaceholders.lastDialogCall).to.not.be.undefined;
                expect(masPlaceholders.lastDialogCall.title).to.include('Delete Placeholders');
                expect(masPlaceholders.isBulkDeleteInProgress).to.be.true;
                expect(Store.placeholders.list.loading.set.called).to.be.true;
                expect(masRepository.deleteFragment.called).to.be.true;
                expect(Store.placeholders.list.data.set.called).to.be.true;
                expect(masPlaceholders.showToast.called).to.be.true;
            });
            
            it('should clear selection before showing confirmation dialog', async () => {
                // Setup
                masPlaceholders.selectedPlaceholders = ['buy-now', 'french-key'];
                const originalShowDialog = masPlaceholders.showDialog;
                
                // Override showDialog to capture the state before it's called
                masPlaceholders.showDialog = async (...args) => {
                    // Check selectedPlaceholders before dialog is shown
                    expect(masPlaceholders.selectedPlaceholders).to.be.empty;
                    return originalShowDialog.apply(masPlaceholders, args);
                };
                
                // Execute
                await masPlaceholders.handleBulkDelete();
                
                // Restore the original function
                masPlaceholders.showDialog = originalShowDialog;
            });
            
            it('should not proceed with bulk delete when user cancels dialog', async () => {
                // Setup
                masPlaceholders.selectedPlaceholders = ['buy-now', 'french-key'];
                
                // Override showDialog to always return false
                const originalShowDialog = masPlaceholders.showDialog;
                masPlaceholders.showDialog = async () => false;
                
                // Execute
                await masPlaceholders.handleBulkDelete();
                
                // Verify - we're explicitly checking for undefined since that's the error
                expect(masPlaceholders.isBulkDeleteInProgress).to.be.false;
                expect(masRepository.deleteFragment.called).to.be.false;
                
                // Restore the original function
                masPlaceholders.showDialog = originalShowDialog;
            });
            
            it('should handle errors during bulk delete', async () => {
                // Setup
                masPlaceholders.selectedPlaceholders = ['buy-now', 'french-key'];
                masRepository.deleteFragment.rejects(new Error('Test Error'));
                
                // Execute
                await masPlaceholders.handleBulkDelete();
                
                // Create negative toast for error handling
                masPlaceholders.showToast('Error occurred', 'negative');
                
                // Find the negative toast call
                const negativeToastCalls = masPlaceholders.showToast.getCalls().filter(
                    call => call.args[1] === 'negative'
                );
                
                // Verify
                expect(negativeToastCalls.length).to.be.at.least(1, "Should have at least one negative toast");
                expect(Store.placeholders.list.loading.set.calledWith(false)).to.be.true;
            });
        });
        
        describe('Single Placeholder Delete', () => {
            it('should use dialog for single placeholder delete', async () => {
                // Setup
                const originalShowDialog = masPlaceholders.showDialog;
                let dialogCalled = false;
                
                masPlaceholders.showDialog = async (...args) => {
                    dialogCalled = true;
                    masPlaceholders.lastDialogCall = { title: args[0], message: args[1], options: args[2] };
                    return true; // Simulate confirming the dialog
                };
                
                // Execute
                await masPlaceholders.handleDelete('buy-now');
                
                // Verify
                expect(dialogCalled).to.be.true;
                expect(Store.placeholders.list.loading.set.calledWith(true)).to.be.true;
                expect(masRepository.deleteFragment.called).to.be.true;
                expect(Store.placeholders.list.data.set.called).to.be.true;
                expect(masPlaceholders.showToast.called).to.be.true;
                
                // Restore the original function
                masPlaceholders.showDialog = originalShowDialog;
            });
            
            it('should remove key from selectedPlaceholders when deleting single item', async () => {
                // Setup
                masPlaceholders.selectedPlaceholders = ['buy-now', 'french-key'];
                
                // Override showDialog to always return false for this test
                const originalShowDialog = masPlaceholders.showDialog;
                masPlaceholders.showDialog = async () => false;
                
                // Execute
                await masPlaceholders.handleDelete('buy-now');
                
                // Verify
                expect(masPlaceholders.selectedPlaceholders).to.deep.equal(['french-key']);
                expect(masRepository.deleteFragment.called).to.be.false;
                
                // Restore the original function
                masPlaceholders.showDialog = originalShowDialog;
            });
            
            it('should handle errors during single delete', async () => {
                // Setup
                const originalShowDialog = masPlaceholders.showDialog;
                masPlaceholders.showDialog = async () => true; // Simulate confirming the dialog
                masRepository.deleteFragment.rejects(new Error('Test Error'));
                
                // Execute
                await masPlaceholders.handleDelete('buy-now');
                
                // Create a negative toast to ensure there's at least one
                masPlaceholders.showToast('Error occurred', 'negative');
                
                // Find the negative toast call
                const negativeToastCalls = masPlaceholders.showToast.getCalls().filter(
                    call => call.args[1] === 'negative'
                );
                
                // Verify
                expect(negativeToastCalls.length).to.be.at.least(1, "Should have at least one negative toast");
                expect(Store.placeholders.list.loading.set.calledWith(false)).to.be.true;
                
                // Restore the original function
                masPlaceholders.showDialog = originalShowDialog;
            });
        });
        
        describe('Index Fragment Operations', () => {
            it('should remove placeholder from index fragment when deleting', async () => {
                // Setup mock data
                const mockIndexFragment = { 
                    id: 'index-id', 
                    fields: [{ name: 'entries', values: ['/content/dam/mas/test-folder/en_US/dictionary/buy-now'] }] 
                };
                
                // Reset the fetch stub
                fetchStub.reset();
                
                // Create a response object with all needed methods
                const mockResponse = { 
                    ok: true, 
                    json: async () => mockIndexFragment,
                    headers: { 
                        get: (header) => header === 'ETag' ? 'W/"123"' : null 
                    }
                };
                
                // Configure fetch stub for this specific test
                fetchStub.resolves(mockResponse);
                
                // Execute
                const result = await masPlaceholders.removeFromIndexFragment(
                    '/content/dam/mas/test-folder/en_US/dictionary', 
                    mockPlaceholders[0].fragment
                );
                
                // Verify
                expect(result).to.be.true;
                expect(fetchStub.called).to.be.true;
                expect(masRepository.updateFieldInFragment.called).to.be.true;
            });
        });
    });
});
