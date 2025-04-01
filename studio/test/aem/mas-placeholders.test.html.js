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

        beforeEach(async () => {
            while (spTheme.firstChild) {
                spTheme.removeChild(spTheme.firstChild);
            }

            fetchStub = sinon.stub(window, 'fetch').resolves({
                ok: true,
                json: async () => ({ items: [] }),
                headers: { get: () => null },
            });

            eventsToastEmitStub = sinon
                .stub(Events.toast, 'emit')
                .callsFake(() => {});

            window.Store = {
                search: {
                    get: () => ({ path: '/content/dam/mas/test-folder' }),
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
                                path: '/content/dam/mas/test-folder',
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
                },
            };

            const root = initElementFromTemplate(
                'mas-placeholders-with-repository',
            );
            masRepository = root.querySelector('mas-repository');
            masPlaceholders = root.querySelector('mas-placeholders');
            masRepository.baseUrl = '/test-url';
            masRepository.bucket = 'test-bucket';
            masRepository.searchPlaceholders = sinon
                .stub()
                .resolves(mockPlaceholders);
            masRepository.createDictionaryFragment = sinon.stub().resolves({
                id: 'new-id',
                path: '/content/dam/mas/test-folder/en_US/dictionary/new-key',
            });
            masRepository.getFragmentByPath = sinon
                .stub()
                .resolves(mockPlaceholders[0].fragment);
            masRepository.saveFragment = sinon
                .stub()
                .resolves({ id: '123', status: 'Draft' });
            masRepository.publishDictionaryFragment = sinon.stub().resolves({});
            masRepository.unpublishDictionaryFragment = sinon
                .stub()
                .resolves({});
            masRepository.deleteFragment = sinon.stub().resolves({});
            masRepository.loadFolders = sinon.stub().resolves();
            masRepository.processError = sinon.stub();
            Object.defineProperty(masPlaceholders, 'repository', {
                get: () => masRepository,
                set: () => {},
                configurable: true,
            });
            masPlaceholders.placeholders = [...mockPlaceholders];
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
                path: '/content/dam/mas/test-folder',
            };
            await masPlaceholders.createPlaceholder();
            expect(eventsToastEmitStub.called).to.be.true;
            const firstCall = eventsToastEmitStub.getCall(0);
            expect(firstCall && firstCall.args[0].variant).to.equal('negative');
        });

        it('should create a placeholder when all values are provided', async () => {
            masPlaceholders.newPlaceholder = {
                key: 'new-key',
                value: 'New Value',
                locale: 'en_US',
            };
            masPlaceholders.selectedFolder = {
                path: '/content/dam/mas/test-folder',
            };
            await masPlaceholders.createPlaceholder();
            expect(masRepository.createDictionaryFragment.called).to.be.true;
            const positiveToast = eventsToastEmitStub
                .getCalls()
                .find((call) => call.args[0].variant === 'positive');
            expect(positiveToast).to.not.be.undefined;
        });

        it('should handle edit operations correctly', () => {
            const placeholder = mockPlaceholders[0];
            masPlaceholders.startEditing(placeholder);
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

            it('should update new placeholder key and value on input events', () => {
                const keyEvent = { target: { value: 'newKey' } };
                const valueEvent = { target: { value: 'newValue' } };
                masPlaceholders.handleNewPlaceholderKeyChange(keyEvent);
                masPlaceholders.handleNewPlaceholderValueChange(valueEvent);
                expect(masPlaceholders.newPlaceholder.key).to.equal('newKey');
                expect(masPlaceholders.newPlaceholder.value).to.equal(
                    'newValue',
                );
            });

            it('should update new placeholder locale on locale change event', () => {
                const localeEvent = { detail: { locale: 'fr_FR' } };
                masPlaceholders.handleNewPlaceholderLocaleChange(localeEvent);
                expect(masPlaceholders.newPlaceholder.locale).to.equal('fr_FR');
            });

            it('should update selectedLocale and trigger repository search on handleLocaleChange', () => {
                const localeEvent = { detail: { locale: 'fr_FR' } };
                masPlaceholders.handleLocaleChange(localeEvent);
                expect(masPlaceholders.selectedLocale).to.equal('fr_FR');
                expect(masRepository.searchPlaceholders.called).to.be.true;
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

            it('getStatusBadge renders proper badge for Published, Draft, and custom statuses', () => {
                const pubBadge = masPlaceholders.getStatusBadge('Published');
                expect(pubBadge.strings.join('')).to.include('PUBLISHED');
                expect(pubBadge.strings.join('')).to.include(
                    'variant="positive"',
                );

                const draftBadge = masPlaceholders.getStatusBadge('Draft');
                expect(draftBadge.strings.join('')).to.include('DRAFT');
                const customBadge = masPlaceholders.getStatusBadge('Custom');
                expect(customBadge.values[0]).to.equal('CUSTOM');
            });

            it('renderPlaceholdersTable returns table markup when placeholders exist', () => {
                masPlaceholders.foldersLoaded = true;
                masPlaceholders.selectedFolder = {
                    path: '/content/dam/mas/test-folder',
                };
                const tableOutput = masPlaceholders.renderPlaceholdersTable();
                expect(tableOutput.strings.join('')).to.include('sp-table');
            });

            it('loadingIndicator returns progress indicator when loading is true', () => {
                masPlaceholders.loading = true;
                const indicator = masPlaceholders.loadingIndicator;
                expect(indicator.strings.join('')).to.include(
                    'sp-progress-circle',
                );
            });

            it('renderCreateModal returns modal markup when showCreateModal is true', () => {
                masPlaceholders.showCreateModal = true;
                const modalOutput = masPlaceholders.renderCreateModal();
                expect(modalOutput.strings.join('')).to.include('create-modal');
            });
        });
    });
});
