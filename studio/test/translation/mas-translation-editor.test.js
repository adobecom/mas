import sinon from 'sinon';
import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, fixtureCleanup } from '@open-wc/testing-helpers/pure';
import { PAGE_NAMES, QUICK_ACTION, TRANSLATION_PROJECT_MODEL_ID } from '../../src/constants.js';
import Store from '../../src/store.js';
import router from '../../src/router.js';
import Events from '../../src/events.js';
import { Fragment } from '../../src/aem/fragment.js';
import { FragmentStore } from '../../src/reactivity/fragment-store.js';
import { SURFACES } from '../../src/constants.js';
import '../../src/swc.js';
import '../../src/translation/mas-translation-editor.js';

describe('MasTranslationEditor', () => {
    let sandbox;
    let toastEmitStub;
    let originalQuerySelector;

    const createMockFragment = (overrides = {}) => ({
        id: 'test-fragment-id',
        title: 'Test Translation Project',
        path: '/content/dam/mas/translations/test-project',
        fields: [
            { name: 'title', type: 'text', multiple: false, values: ['Test Translation Project'] },
            { name: 'status', type: 'text', multiple: false, values: ['draft'] },
            { name: 'fragments', type: 'content-fragment', multiple: true, values: [] },
            {
                name: 'placeholders',
                type: 'content-fragment',
                multiple: true,
                values: ['/content/dam/mas/sandbox/en_US/individual-plans-all'],
            },
            {
                name: 'collections',
                type: 'content-fragment',
                multiple: true,
                values: ['/content/dam/mas/sandbox/en_US/individual-plans-all'],
            },
            { name: 'targetLocales', type: 'text', multiple: true, values: ['pl_PL'] },
            { name: 'submissionDate', type: 'date-time', multiple: false, values: [] },
        ],
        modified: { fullName: 'Test User' },
        ...overrides,
    });

    const createMockRepository = (overrides = {}) => ({
        aem: {
            sites: {
                cf: {
                    fragments: {
                        getById: sandbox.stub().resolves(createMockFragment()),
                        create: sandbox.stub().resolves(createMockFragment()),
                        save: sandbox.stub().resolves(createMockFragment()),
                        delete: sandbox.stub().resolves(),
                    },
                },
            },
        },
        getTranslationsPath: sandbox.stub().returns('/content/dam/mas/translations'),
        createFragment: sandbox.stub().resolves(new Fragment(createMockFragment())),
        saveFragment: sandbox.stub().resolves(),
        deleteFragment: sandbox.stub().resolves(),
        refreshFragment: sandbox.stub().resolves(),
        searchFragments: sandbox.stub().resolves({ items: [] }),
        loadPlaceholders: sandbox.stub().resolves([]),
        ...overrides,
    });

    const resetStores = () => {
        Store.translationProjects.inEdit.value = null;
        Store.translationProjects.translationProjectId.value = null;
        Store.translationProjects.selectedCards.value = [];
        Store.translationProjects.selectedCollections.value = [];
        Store.translationProjects.selectedPlaceholders.value = [];
        Store.translationProjects.targetLocales.value = [];
        Store.translationProjects.showSelected.value = false;
        Store.search.set({ path: SURFACES.ACOM.name });
    };

    let defaultMockRepository;
    let querySelectorStub;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        toastEmitStub = sandbox.stub(Events.toast, 'emit');
        originalQuerySelector = document.querySelector.bind(document);
        defaultMockRepository = {
            aem: {
                sites: {
                    cf: {
                        fragments: {
                            getById: sandbox.stub().resolves(null),
                        },
                    },
                },
            },
            getTranslationsPath: sandbox.stub().returns('/content/dam/mas/translations'),
            searchFragments: sandbox.stub().resolves({ items: [] }),
            loadPlaceholders: sandbox.stub().resolves([]),
        };
        querySelectorStub = sandbox.stub(document, 'querySelector').callsFake((selector) => {
            if (selector === 'mas-repository') return defaultMockRepository;
            return originalQuerySelector(selector);
        });
        resetStores();
    });

    afterEach(() => {
        fixtureCleanup();
        sandbox.restore();
        resetStores();
    });

    describe('initialization', () => {
        it('should initialize with default values for new project', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            expect(el.isLoading).to.be.false;
            expect(el.isDialogOpen).to.be.false;
            expect(el.confirmDialogConfig).to.be.null;
            expect(el.isSelectedItemsOpen).to.be.false;
            expect(el.isSelectedLangsOpen).to.be.false;
            expect(el.isProjectReadonly).to.be.false;
        });

        it('should initialize as new translation project when no ID in store', async () => {
            Store.translationProjects.translationProjectId.set(null);
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            expect(el.isNewTranslationProject).to.be.true;
            expect(el.showSelectedEmptyState).to.be.true;
            expect(el.showLangSelectedEmptyState).to.be.true;
        });

        it('should have save, discard, delete and loc actions disabled for new project by default', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            expect(el.disabledActions.has(QUICK_ACTION.SAVE)).to.be.true;
            expect(el.disabledActions.has(QUICK_ACTION.DISCARD)).to.be.true;
            expect(el.disabledActions.has(QUICK_ACTION.DELETE)).to.be.true;
            expect(el.disabledActions.has(QUICK_ACTION.LOC)).to.be.true;
        });

        it('should load existing project when translationProjectId is set', async () => {
            const mockFragment = createMockFragment();
            const mockRepository = createMockRepository();
            mockRepository.aem.sites.cf.fragments.getById.resolves(mockFragment);
            querySelectorStub.callsFake((selector) => {
                if (selector === 'mas-repository') return mockRepository;
                return originalQuerySelector(selector);
            });
            Store.translationProjects.translationProjectId.set('test-fragment-id');
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            await el.updateComplete;
            expect(el.isNewTranslationProject).to.be.false;
        });
    });

    describe('connectedCallback', () => {
        it('should call repository.searchFragments on connect if repository exists', async () => {
            const searchFragmentsSpy = sinon.spy();
            const loadPlaceholdersSpy = sinon.spy();
            const mockRepository = {
                searchFragments: searchFragmentsSpy,
                loadPlaceholders: loadPlaceholdersSpy,
            };
            querySelectorStub.callsFake((selector) => {
                if (selector === 'mas-repository') {
                    return mockRepository;
                }
                return originalQuerySelector(selector);
            });
            await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            expect(searchFragmentsSpy.calledOnce).to.be.true;
        });

        it('should call repository.loadPlaceholders on connect if repository exists', async () => {
            const searchFragmentsSpy = sinon.spy();
            const loadPlaceholdersSpy = sinon.spy();
            const mockRepository = {
                searchFragments: searchFragmentsSpy,
                loadPlaceholders: loadPlaceholdersSpy,
            };
            querySelectorStub.callsFake((selector) => {
                if (selector === 'mas-repository') {
                    return mockRepository;
                }
                return originalQuerySelector(selector);
            });
            await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            expect(loadPlaceholdersSpy.calledOnce).to.be.true;
        });

        it('should not throw when repository is null', async () => {
            let error = null;
            try {
                await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            } catch (e) {
                error = e;
            }
            expect(error).to.be.null;
        });
    });

    describe('translationProject getter', () => {
        it('should return null when no project is in edit', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            Store.translationProjects.inEdit.set(null);
            expect(el.translationProject).to.be.undefined;
        });

        it('should return the fragment from store when project is in edit', async () => {
            const mockFragment = new Fragment(createMockFragment());
            const fragmentStore = new FragmentStore(mockFragment);
            Store.translationProjects.inEdit.set(fragmentStore);
            Store.translationProjects.translationProjectId.set('test-fragment-id');
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            await el.updateComplete;
            expect(el.translationProjectStore).to.exist;
            expect(el.translationProjectStore.get().id).to.equal(mockFragment.id);
        });
    });

    describe('selectedCount getter', () => {
        it('should return 0 when no items selected', async () => {
            Store.translationProjects.selectedCards.set([]);
            Store.translationProjects.selectedPlaceholders.set([]);
            Store.translationProjects.selectedCollections.set([]);
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            expect(el.selectedCount).to.equal(0);
        });

        it('should return total count of all selected items', async () => {
            Store.translationProjects.selectedCards.set(['card1', 'card2']);
            Store.translationProjects.selectedPlaceholders.set(['ph1']);
            Store.translationProjects.selectedCollections.set(['col1', 'col2', 'col3']);
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            expect(el.selectedCount).to.equal(6);
        });
    });

    describe('targetLocalesCount getter', () => {
        it('should return 0 when no locales selected', async () => {
            Store.translationProjects.targetLocales.set([]);
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            expect(el.targetLocalesCount).to.equal(0);
        });

        it('should return count of selected locales', async () => {
            Store.translationProjects.targetLocales.set(['en_US', 'fr_FR', 'de_DE']);
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            expect(el.targetLocalesCount).to.equal(3);
        });
    });

    describe('selectedLangsList getter', () => {
        it('should return empty string when no locales selected', async () => {
            Store.translationProjects.targetLocales.set([]);
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            expect(el.selectedLangsList).to.equal('');
        });

        it('should return sorted comma-separated list of locales', async () => {
            Store.translationProjects.targetLocales.set(['fr_FR', 'en_US', 'de_DE']);
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            expect(el.selectedLangsList).to.equal('de_DE, en_US, fr_FR');
        });
    });

    describe('repository getter', () => {
        it('should return mas-repository element from document', async () => {
            const mockRepository = createMockRepository();
            querySelectorStub.callsFake((selector) => {
                if (selector === 'mas-repository') return mockRepository;
                return originalQuerySelector(selector);
            });
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            expect(el.repository).to.equal(mockRepository);
        });

        it('should return null when mas-repository is not found', async () => {
            querySelectorStub.callsFake((selector) => {
                if (selector === 'mas-repository') return null;
                return originalQuerySelector(selector);
            });
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            expect(el.repository).to.be.null;
        });
    });

    describe('rendering', () => {
        it('should render breadcrumbs', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            const breadcrumbs = el.shadowRoot.querySelector('sp-breadcrumbs');
            expect(breadcrumbs).to.exist;
            const breadcrumbItems = el.shadowRoot.querySelectorAll('sp-breadcrumb-item');
            expect(breadcrumbItems.length).to.equal(2);
            expect(breadcrumbItems[0].textContent).to.equal('Translations');
        });

        it('should render "Create new project" header for new project', async () => {
            Store.translationProjects.translationProjectId.set(null);
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            const header = el.shadowRoot.querySelector('.header h1');
            expect(header.textContent).to.equal('Create new project');
        });

        it('should render "Edit project" header for existing project', async () => {
            const mockFragment = new Fragment(createMockFragment());
            const fragmentStore = new FragmentStore(mockFragment);
            Store.translationProjects.inEdit.set(fragmentStore);
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            el.isNewTranslationProject = false;
            el.isProjectReadonly = false;
            await el.updateComplete;
            const header = el.shadowRoot.querySelector('.header h1');
            expect(header.textContent).to.equal('Edit project');
        });

        it('should render title text field', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            const titleField = el.shadowRoot.querySelector('#title');
            expect(titleField).to.exist;
            expect(titleField.tagName.toLowerCase()).to.equal('sp-textfield');
        });

        it('should render quick actions toolbar', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            const quickActions = el.shadowRoot.querySelector('mas-quick-actions');
            expect(quickActions).to.exist;
        });
    });

    describe('loading state', () => {
        it('should show loading indicator when isLoading is true', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            el.isLoading = true;
            await el.updateComplete;
            const progressCircle = el.shadowRoot.querySelector('sp-progress-circle');
            expect(progressCircle).to.exist;
        });

        it('should hide loading indicator when isLoading is false', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            el.isLoading = false;
            await el.updateComplete;
            const progressCircle = el.shadowRoot.querySelector('sp-progress-circle');
            expect(progressCircle).to.be.null;
        });
    });

    describe('empty states', () => {
        it('should show languages empty state when no languages selected', async () => {
            Store.translationProjects.targetLocales.set([]);
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            el.showLangSelectedEmptyState = true;
            await el.updateComplete;
            const emptyState = el.shadowRoot.querySelector('.languages-empty-state');
            expect(emptyState).to.exist;
            expect(emptyState.textContent).to.include('Add languages');
        });

        it('should show items empty state when no items selected', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            el.showSelectedEmptyState = true;
            await el.updateComplete;
            const emptyState = el.shadowRoot.querySelector('.items-empty-state');
            expect(emptyState).to.exist;
            expect(emptyState.textContent).to.include('Add Items');
        });

        it('should show selected languages section when languages are selected', async () => {
            Store.translationProjects.targetLocales.set(['en_US', 'fr_FR']);
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            el.showLangSelectedEmptyState = false;
            await el.updateComplete;
            const selectedLangs = el.shadowRoot.querySelector('.selected-langs');
            expect(selectedLangs).to.exist;
            const header = selectedLangs.querySelector('h2');
            expect(header.textContent).to.include('Selected languages');
        });

        it('should show selected items section when items are selected', async () => {
            Store.translationProjects.selectedCards.set(['card1']);
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            el.showSelectedEmptyState = false;
            await el.updateComplete;
            const selectedItems = el.shadowRoot.querySelector('.selected-items');
            expect(selectedItems).to.exist;
            const header = selectedItems.querySelector('h2');
            expect(header.textContent).to.include('Selected items');
        });
    });

    describe('title input handling', () => {
        it('should update fragment when title changes', async () => {
            const mockFragment = new Fragment(createMockFragment());
            const fragmentStore = new FragmentStore(mockFragment);
            Store.translationProjects.inEdit.set(fragmentStore);
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            await el.updateComplete;
            const titleField = el.shadowRoot.querySelector('#title');
            titleField.value = 'New Title';
            titleField.dispatchEvent(new Event('input', { bubbles: true }));
            await el.updateComplete;
            expect(el.disabledActions.has(QUICK_ACTION.SAVE)).to.be.false;
            expect(el.disabledActions.has(QUICK_ACTION.DISCARD)).to.be.false;
        });
    });

    describe('confirmation dialog', () => {
        it('should not render confirmation dialog when config is null', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            el.confirmDialogConfig = null;
            await el.updateComplete;
            const dialog = el.shadowRoot.querySelector('.confirm-dialog-overlay');
            expect(dialog).to.be.null;
        });

        it('should render confirmation dialog when config is set', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            el.confirmDialogConfig = {
                title: 'Test Title',
                message: 'Test Message',
                confirmText: 'OK',
                cancelText: 'Cancel',
                variant: 'confirmation',
                onConfirm: () => {},
                onCancel: () => {},
            };
            await el.updateComplete;
            const dialog = el.shadowRoot.querySelector('.confirm-dialog-overlay');
            expect(dialog).to.exist;
        });

        it('should call onConfirm and close dialog when confirmed', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            let confirmed = false;
            el.confirmDialogConfig = {
                title: 'Test',
                message: 'Test',
                confirmText: 'OK',
                cancelText: 'Cancel',
                variant: 'confirmation',
                onConfirm: () => {
                    confirmed = true;
                },
                onCancel: () => {},
            };
            el.isDialogOpen = true;
            await el.updateComplete;
            const dialogWrapper = el.shadowRoot.querySelector('sp-dialog-wrapper');
            dialogWrapper.dispatchEvent(new CustomEvent('confirm'));
            await el.updateComplete;
            expect(confirmed).to.be.true;
            expect(el.confirmDialogConfig).to.be.null;
            expect(el.isDialogOpen).to.be.false;
        });

        it('should call onCancel and close dialog when cancelled', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            let cancelled = false;
            el.confirmDialogConfig = {
                title: 'Test',
                message: 'Test',
                confirmText: 'OK',
                cancelText: 'Cancel',
                variant: 'confirmation',
                onConfirm: () => {},
                onCancel: () => {
                    cancelled = true;
                },
            };
            el.isDialogOpen = true;
            await el.updateComplete;
            const dialogWrapper = el.shadowRoot.querySelector('sp-dialog-wrapper');
            dialogWrapper.dispatchEvent(new CustomEvent('cancel'));
            await el.updateComplete;
            expect(cancelled).to.be.true;
            expect(el.confirmDialogConfig).to.be.null;
            expect(el.isDialogOpen).to.be.false;
        });
    });

    describe('breadcrumb navigation', () => {
        it('should navigate to translations page when breadcrumb is clicked', async () => {
            const navigateStub = sandbox.stub(router, 'navigateToPage').returns(() => {});
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            const breadcrumbItem = el.shadowRoot.querySelector('sp-breadcrumb-item');
            breadcrumbItem.click();
            await el.updateComplete;
            expect(navigateStub.calledWith(PAGE_NAMES.TRANSLATIONS)).to.be.true;
        });
    });

    describe('toggle selected languages', () => {
        it('should toggle isSelectedLangsOpen when toggle button is clicked', async () => {
            Store.translationProjects.targetLocales.set(['en_US']);
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            el.showLangSelectedEmptyState = false;
            await el.updateComplete;
            const toggleBtn = el.shadowRoot.querySelector('.selected-langs .toggle-btn');
            expect(el.isSelectedLangsOpen).to.be.false;
            toggleBtn.click();
            await el.updateComplete;
            expect(el.isSelectedLangsOpen).to.be.true;
            toggleBtn.click();
            await el.updateComplete;
            expect(el.isSelectedLangsOpen).to.be.false;
        });

        it('should show languages list when expanded', async () => {
            Store.translationProjects.targetLocales.set(['en_US', 'fr_FR']);
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            el.showLangSelectedEmptyState = false;
            el.isSelectedLangsOpen = true;
            await el.updateComplete;
            const langsList = el.shadowRoot.querySelector('.selected-langs-list');
            expect(langsList).to.exist;
            expect(langsList.textContent).to.include('en_US');
        });
    });

    describe('toggle selected items', () => {
        it('should toggle isSelectedItemsOpen when toggle button is clicked', async () => {
            Store.translationProjects.selectedCards.set(['card1']);
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            el.showSelectedEmptyState = false;
            await el.updateComplete;
            const toggleBtn = el.shadowRoot.querySelector('.selected-items .toggle-btn');
            expect(el.isSelectedItemsOpen).to.be.false;
            toggleBtn.click();
            await el.updateComplete;
            expect(el.isSelectedItemsOpen).to.be.true;
        });

        it('should render mas-items-selector when items section is expanded', async () => {
            Store.translationProjects.selectedCards.set(['card1']);
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            el.showSelectedEmptyState = false;
            el.isSelectedItemsOpen = true;
            await el.updateComplete;
            const itemsSelector = el.shadowRoot.querySelector('mas-items-selector');
            expect(itemsSelector).to.exist;
        });
    });

    describe('promptDiscardChanges', () => {
        it('should return true when no changes and no selections', async () => {
            const mockFragment = new Fragment(createMockFragment());
            mockFragment.hasChanges = false;
            const fragmentStore = new FragmentStore(mockFragment);
            Store.translationProjects.inEdit.set(fragmentStore);
            Store.translationProjects.selectedCards.set([]);
            Store.translationProjects.selectedPlaceholders.set([]);
            Store.translationProjects.selectedCollections.set([]);
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            const result = await el.promptDiscardChanges();
            expect(result).to.be.true;
        });
    });

    describe('readonly mode', () => {
        it('should set isProjectReadonly when submissionDate is present', async () => {
            const mockFragment = new Fragment(
                createMockFragment({
                    fields: [
                        { name: 'title', type: 'text', multiple: false, values: ['Test'] },
                        { name: 'submissionDate', type: 'date-time', multiple: false, values: ['2024-01-15T10:00:00Z'] },
                        { name: 'fragments', type: 'content-fragment', multiple: true, values: [] },
                        { name: 'placeholders', type: 'content-fragment', multiple: true, values: [] },
                        { name: 'collections', type: 'content-fragment', multiple: true, values: [] },
                        { name: 'targetLocales', type: 'text', multiple: true, values: [] },
                    ],
                }),
            );
            expect(mockFragment.getFieldValue('submissionDate')).to.equal('2024-01-15T10:00:00Z');
            expect(!!mockFragment.getFieldValue('submissionDate')).to.be.true;
        });

        it('should render metadata info in readonly mode', async () => {
            const mockFragment = new Fragment(
                createMockFragment({
                    fields: [
                        { name: 'title', type: 'text', multiple: false, values: ['Test'] },
                        { name: 'submissionDate', type: 'date-time', multiple: false, values: ['2024-01-15T10:00:00Z'] },
                        { name: 'fragments', type: 'content-fragment', multiple: true, values: [] },
                        { name: 'placeholders', type: 'content-fragment', multiple: true, values: [] },
                        { name: 'collections', type: 'content-fragment', multiple: true, values: [] },
                        { name: 'targetLocales', type: 'text', multiple: true, values: [] },
                    ],
                    modified: { fullName: 'John Doe' },
                }),
            );
            const fragmentStore = new FragmentStore(mockFragment);
            Store.translationProjects.inEdit.set(fragmentStore);
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            el.isProjectReadonly = true;
            el.isNewTranslationProject = false;
            await el.updateComplete;
            const metadataInfo = el.shadowRoot.querySelector('.metadata-info');
            expect(metadataInfo).to.exist;
        });

        it('should make title field readonly in readonly mode', async () => {
            const mockFragment = new Fragment(createMockFragment());
            const fragmentStore = new FragmentStore(mockFragment);
            Store.translationProjects.inEdit.set(fragmentStore);
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            el.isProjectReadonly = true;
            await el.updateComplete;
            const titleField = el.shadowRoot.querySelector('#title');
            expect(titleField.readonly).to.be.true;
        });
    });

    describe('create translation project', () => {
        it('should show error toast when title is missing', async () => {
            const mockFragment = new Fragment(
                createMockFragment({
                    fields: [
                        { name: 'title', type: 'text', multiple: false, values: [] },
                        { name: 'fragments', type: 'content-fragment', multiple: true, values: [] },
                        { name: 'placeholders', type: 'content-fragment', multiple: true, values: [] },
                        { name: 'collections', type: 'content-fragment', multiple: true, values: [] },
                        { name: 'targetLocales', type: 'text', multiple: true, values: [] },
                    ],
                }),
            );
            const fragmentStore = new FragmentStore(mockFragment);
            Store.translationProjects.inEdit.set(fragmentStore);
            const mockRepository = createMockRepository();
            querySelectorStub.callsFake((selector) => {
                if (selector === 'mas-repository') return mockRepository;
                return originalQuerySelector(selector);
            });
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            el.isNewTranslationProject = true;
            await el.updateComplete;
            const quickActions = el.shadowRoot.querySelector('mas-quick-actions');
            quickActions.dispatchEvent(new CustomEvent('save'));
            await el.updateComplete;
            expect(
                toastEmitStub.calledWith({
                    variant: 'negative',
                    content: 'Please fill in all required fields.',
                }),
            ).to.be.true;
        });

        it('should have createFragment method on repository', async () => {
            const mockRepository = createMockRepository();
            expect(mockRepository.createFragment).to.exist;
            expect(typeof mockRepository.createFragment).to.equal('function');
        });

        it('should initialize with correct model ID constant', () => {
            expect(TRANSLATION_PROJECT_MODEL_ID).to.exist;
            expect(typeof TRANSLATION_PROJECT_MODEL_ID).to.equal('string');
        });
    });

    describe('update translation project', () => {
        it('should have saveFragment method on repository', async () => {
            const mockRepository = createMockRepository();
            expect(mockRepository.saveFragment).to.exist;
            expect(typeof mockRepository.saveFragment).to.equal('function');
        });

        it('should properly set isNewTranslationProject to false for existing project', async () => {
            const mockFragment = new Fragment(createMockFragment({ id: 'existing-id' }));
            const fragmentStore = new FragmentStore(mockFragment);
            Store.translationProjects.inEdit.set(fragmentStore);
            Store.translationProjects.translationProjectId.set('existing-id');
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            el.isNewTranslationProject = false;
            await el.updateComplete;
            expect(el.isNewTranslationProject).to.be.false;
        });
    });

    describe('delete translation project', () => {
        it('should show confirmation dialog when delete action is triggered', async () => {
            const mockFragment = new Fragment(createMockFragment({ id: 'delete-id' }));
            const fragmentStore = new FragmentStore(mockFragment);
            Store.translationProjects.inEdit.set(fragmentStore);
            const mockRepository = createMockRepository();
            querySelectorStub.callsFake((selector) => {
                if (selector === 'mas-repository') return mockRepository;
                return originalQuerySelector(selector);
            });
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            el.isNewTranslationProject = false;
            el.disabledActions = new Set();
            await el.updateComplete;
            const quickActions = el.shadowRoot.querySelector('mas-quick-actions');
            quickActions.dispatchEvent(new CustomEvent('delete'));
            await el.updateComplete;
            expect(el.isDialogOpen).to.be.true;
            expect(el.confirmDialogConfig).to.not.be.null;
            expect(el.confirmDialogConfig.title).to.equal('Delete Translation Project');
        });

        it('should not open dialog if already open', async () => {
            const mockFragment = new Fragment(createMockFragment({ id: 'delete-id' }));
            const fragmentStore = new FragmentStore(mockFragment);
            Store.translationProjects.inEdit.set(fragmentStore);
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            el.isDialogOpen = true;
            el.confirmDialogConfig = { title: 'Existing' };
            await el.updateComplete;
            const quickActions = el.shadowRoot.querySelector('mas-quick-actions');
            quickActions.dispatchEvent(new CustomEvent('delete'));
            await el.updateComplete;
            expect(el.confirmDialogConfig.title).to.equal('Existing');
        });

        it('should call repository.deleteFragment when confirmed', async () => {
            const mockFragment = new Fragment(createMockFragment({ id: 'delete-id' }));
            const fragmentStore = new FragmentStore(mockFragment);
            Store.translationProjects.inEdit.set(fragmentStore);
            const mockRepository = createMockRepository();
            querySelectorStub.callsFake((selector) => {
                if (selector === 'mas-repository') return mockRepository;
                return originalQuerySelector(selector);
            });
            const navigateStub = sandbox.stub(router, 'navigateToPage').returns(() => {});
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            el.isNewTranslationProject = false;
            el.disabledActions = new Set();
            await el.updateComplete;
            const quickActions = el.shadowRoot.querySelector('mas-quick-actions');
            quickActions.dispatchEvent(new CustomEvent('delete'));
            await el.updateComplete;
            const dialogWrapper = el.shadowRoot.querySelector('.confirm-dialog-overlay sp-dialog-wrapper');
            dialogWrapper.dispatchEvent(new CustomEvent('confirm'));
            await el.updateComplete;
            await new Promise((resolve) => setTimeout(resolve, 0));
            expect(mockRepository.deleteFragment.calledOnce).to.be.true;
            expect(navigateStub.calledWith(PAGE_NAMES.TRANSLATIONS)).to.be.true;
        });

        it('should navigate to translations page after successful delete', async () => {
            const mockFragment = new Fragment(createMockFragment({ id: 'delete-id' }));
            const fragmentStore = new FragmentStore(mockFragment);
            Store.translationProjects.inEdit.set(fragmentStore);
            const mockRepository = createMockRepository();
            querySelectorStub.callsFake((selector) => {
                if (selector === 'mas-repository') return mockRepository;
                return originalQuerySelector(selector);
            });
            const navigateStub = sandbox.stub(router, 'navigateToPage').returns(() => {});
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            el.isNewTranslationProject = false;
            el.disabledActions = new Set();
            await el.updateComplete;
            const quickActions = el.shadowRoot.querySelector('mas-quick-actions');
            quickActions.dispatchEvent(new CustomEvent('delete'));
            await el.updateComplete;
            const dialogWrapper = el.shadowRoot.querySelector('.confirm-dialog-overlay sp-dialog-wrapper');
            dialogWrapper.dispatchEvent(new CustomEvent('confirm'));
            await el.updateComplete;
            await new Promise((resolve) => setTimeout(resolve, 0));
            expect(navigateStub.calledWith(PAGE_NAMES.TRANSLATIONS)).to.be.true;
        });

        it('should reset stores after successful delete', async () => {
            Store.translationProjects.selectedCards.set(['card1']);
            Store.translationProjects.selectedCollections.set(['col1']);
            Store.translationProjects.selectedPlaceholders.set(['ph1']);
            const mockFragment = new Fragment(createMockFragment({ id: 'delete-id' }));
            const fragmentStore = new FragmentStore(mockFragment);
            Store.translationProjects.inEdit.set(fragmentStore);
            const mockRepository = createMockRepository();
            querySelectorStub.callsFake((selector) => {
                if (selector === 'mas-repository') return mockRepository;
                return originalQuerySelector(selector);
            });
            sandbox.stub(router, 'navigateToPage').returns(() => {});
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            el.isNewTranslationProject = false;
            el.disabledActions = new Set();
            await el.updateComplete;
            const quickActions = el.shadowRoot.querySelector('mas-quick-actions');
            quickActions.dispatchEvent(new CustomEvent('delete'));
            await el.updateComplete;
            const dialogWrapper = el.shadowRoot.querySelector('.confirm-dialog-overlay sp-dialog-wrapper');
            dialogWrapper.dispatchEvent(new CustomEvent('confirm'));
            await el.updateComplete;
            await new Promise((resolve) => setTimeout(resolve, 0));
            expect(Store.translationProjects.selectedCards.get()).to.deep.equal([]);
            expect(Store.translationProjects.selectedCollections.get()).to.deep.equal([]);
            expect(Store.translationProjects.selectedPlaceholders.get()).to.deep.equal([]);
        });

        it('should handle delete error gracefully', async () => {
            const consoleErrorStub = sandbox.stub(console, 'error');
            const mockFragment = new Fragment(createMockFragment({ id: 'delete-id' }));
            const fragmentStore = new FragmentStore(mockFragment);
            Store.translationProjects.inEdit.set(fragmentStore);
            const mockRepository = createMockRepository();
            mockRepository.deleteFragment.rejects(new Error('Delete failed'));
            querySelectorStub.callsFake((selector) => {
                if (selector === 'mas-repository') return mockRepository;
                return originalQuerySelector(selector);
            });
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            el.isNewTranslationProject = false;
            el.disabledActions = new Set();
            await el.updateComplete;
            const quickActions = el.shadowRoot.querySelector('mas-quick-actions');
            quickActions.dispatchEvent(new CustomEvent('delete'));
            await el.updateComplete;
            const dialogWrapper = el.shadowRoot.querySelector('.confirm-dialog-overlay sp-dialog-wrapper');
            dialogWrapper.dispatchEvent(new CustomEvent('confirm'));
            await el.updateComplete;
            await new Promise((resolve) => setTimeout(resolve, 0));
            expect(
                toastEmitStub.calledWith({
                    variant: 'negative',
                    content: 'Failed to delete translation project.',
                }),
            ).to.be.true;
            expect(consoleErrorStub.called).to.be.true;
        });
    });

    describe('discard changes', () => {
        it('should have discardChanges method on FragmentStore', () => {
            const mockFragment = new Fragment(createMockFragment());
            const fragmentStore = new FragmentStore(mockFragment);
            expect(fragmentStore.discardChanges).to.exist;
            expect(typeof fragmentStore.discardChanges).to.equal('function');
        });

        it('should track hasChanges on fragment', () => {
            const mockFragment = new Fragment(createMockFragment());
            mockFragment.hasChanges = true;
            expect(mockFragment.hasChanges).to.be.true;
            mockFragment.discardChanges();
            expect(mockFragment.hasChanges).to.be.false;
        });
    });

    describe('send to localization', () => {
        it('should have ioBaseUrl property', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            // ioBaseUrl is read from meta tag
            expect(el).to.have.property('ioBaseUrl');
        });

        it('should have LOC action in quick actions', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            const quickActions = el.shadowRoot.querySelector('mas-quick-actions');
            expect(quickActions.actions).to.include(QUICK_ACTION.LOC);
        });

        it('should have LOC disabled for new project', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            expect(el.disabledActions.has(QUICK_ACTION.LOC)).to.be.true;
        });
    });

    describe('quick actions configuration', () => {
        it('should render quick actions with correct actions list', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            const quickActions = el.shadowRoot.querySelector('mas-quick-actions');
            expect(quickActions.actions).to.include(QUICK_ACTION.SAVE);
            expect(quickActions.actions).to.include(QUICK_ACTION.DISCARD);
            expect(quickActions.actions).to.include(QUICK_ACTION.DELETE);
            expect(quickActions.actions).to.include(QUICK_ACTION.LOC);
        });

        it('should have delete and loc actions disabled by default', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            await el.updateComplete;
            expect(el.disabledActions.has(QUICK_ACTION.DELETE)).to.be.true;
            expect(el.disabledActions.has(QUICK_ACTION.LOC)).to.be.true;
        });
    });

    describe('load existing project error handling', () => {
        it('should have getById method on repository', async () => {
            const mockRepository = createMockRepository();
            expect(mockRepository.aem.sites.cf.fragments.getById).to.exist;
            expect(typeof mockRepository.aem.sites.cf.fragments.getById).to.equal('function');
        });

        it('should be able to set loading state', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            el.isLoading = true;
            await el.updateComplete;
            expect(el.isLoading).to.be.true;
            const progressCircle = el.shadowRoot.querySelector('sp-progress-circle');
            expect(progressCircle).to.exist;
        });

        it('should handle loading state correctly', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            el.isLoading = true;
            await el.updateComplete;
            expect(el.isLoading).to.be.true;
            const progressCircle = el.shadowRoot.querySelector('sp-progress-circle');
            expect(progressCircle).to.exist;
            el.isLoading = false;
            await el.updateComplete;
            expect(el.isLoading).to.be.false;
        });
    });

    describe('handleFragmentUpdate', () => {
        it('should handle multiline values', async () => {
            const mockFragment = new Fragment(createMockFragment());
            const fragmentStore = new FragmentStore(mockFragment);
            Store.translationProjects.inEdit.set(fragmentStore);
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            await el.updateComplete;
            const titleField = el.shadowRoot.querySelector('#title');
            titleField.multiline = true;
            titleField.value = 'value1,value2,value3';
            titleField.dispatchEvent(new Event('input', { bubbles: true }));
            await el.updateComplete;
            expect(el.disabledActions.has(QUICK_ACTION.SAVE)).to.be.false;
        });

        it('should handle detail value from event', async () => {
            const mockFragment = new Fragment(createMockFragment());
            const fragmentStore = new FragmentStore(mockFragment);
            Store.translationProjects.inEdit.set(fragmentStore);
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            await el.updateComplete;
            const titleField = el.shadowRoot.querySelector('#title');
            titleField.value = '';
            titleField.dispatchEvent(new CustomEvent('input', { bubbles: true, detail: { value: 'Detail Value' } }));
            await el.updateComplete;
            expect(el.disabledActions.has(QUICK_ACTION.SAVE)).to.be.false;
        });

        it('should handle checkbox checked property', async () => {
            const mockFragment = new Fragment(createMockFragment());
            const fragmentStore = new FragmentStore(mockFragment);
            Store.translationProjects.inEdit.set(fragmentStore);
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            await el.updateComplete;
            const titleField = el.shadowRoot.querySelector('#title');
            titleField.value = '';
            titleField.checked = true;
            titleField.dispatchEvent(new Event('input', { bubbles: true }));
            await el.updateComplete;
            expect(el.disabledActions.has(QUICK_ACTION.SAVE)).to.be.false;
        });
    });

    describe('create translation project success', () => {
        it('should create project successfully with valid data', async () => {
            const newFragment = new Fragment(createMockFragment({ id: 'new-id', title: 'New Project' }));
            const mockRepository = createMockRepository();
            mockRepository.createFragment.resolves(newFragment);
            querySelectorStub.callsFake((selector) => {
                if (selector === 'mas-repository') return mockRepository;
                return originalQuerySelector(selector);
            });
            Store.translationProjects.translationProjectId.set(null);
            Store.translationProjects.targetLocales.set(['pl_PL']);
            Store.translationProjects.selectedCards.set(['card1']);
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            await el.updateComplete;
            expect(el.isNewTranslationProject).to.be.true;
            const titleField = el.shadowRoot.querySelector('#title');
            titleField.value = 'Valid Title';
            titleField.dispatchEvent(new Event('input', { bubbles: true }));
            await el.updateComplete;
            const quickActions = el.shadowRoot.querySelector('mas-quick-actions');
            quickActions.dispatchEvent(new CustomEvent('save'));
            await new Promise((resolve) => setTimeout(resolve, 100));
            await el.updateComplete;
            expect(mockRepository.createFragment.calledOnce).to.be.true;
            expect(
                toastEmitStub.calledWith({
                    variant: 'positive',
                    content: 'Translation project created successfully.',
                }),
            ).to.be.true;
        });

        it('should handle create failure gracefully', async () => {
            const consoleErrorStub = sandbox.stub(console, 'error');
            const mockRepository = createMockRepository();
            mockRepository.createFragment.rejects(new Error('Create failed'));
            querySelectorStub.callsFake((selector) => {
                if (selector === 'mas-repository') return mockRepository;
                return originalQuerySelector(selector);
            });
            Store.translationProjects.translationProjectId.set(null);
            Store.translationProjects.targetLocales.set(['pl_PL']);
            Store.translationProjects.selectedCards.set(['card1']);
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            await el.updateComplete;
            expect(el.isNewTranslationProject).to.be.true;
            const titleField = el.shadowRoot.querySelector('#title');
            titleField.value = 'Valid Title';
            titleField.dispatchEvent(new Event('input', { bubbles: true }));
            await el.updateComplete;
            const quickActions = el.shadowRoot.querySelector('mas-quick-actions');
            quickActions.dispatchEvent(new CustomEvent('save'));
            await new Promise((resolve) => setTimeout(resolve, 100));
            await el.updateComplete;
            expect(
                toastEmitStub.calledWith({
                    variant: 'negative',
                    content: 'Failed to create translation project.',
                }),
            ).to.be.true;
            expect(consoleErrorStub.called).to.be.true;
        });
    });

    describe('update translation project', () => {
        it('should update project successfully with valid data', async () => {
            const mockRepository = createMockRepository();
            querySelectorStub.callsFake((selector) => {
                if (selector === 'mas-repository') return mockRepository;
                return originalQuerySelector(selector);
            });
            Store.translationProjects.translationProjectId.set(null);
            Store.translationProjects.targetLocales.set(['pl_PL']);
            Store.translationProjects.selectedCards.set(['card1']);
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            await el.updateComplete;
            const titleField = el.shadowRoot.querySelector('#title');
            titleField.value = 'Existing Title';
            titleField.dispatchEvent(new Event('input', { bubbles: true }));
            await el.updateComplete;
            el.isNewTranslationProject = false;
            await el.updateComplete;
            const quickActions = el.shadowRoot.querySelector('mas-quick-actions');
            quickActions.dispatchEvent(new CustomEvent('save'));
            await new Promise((resolve) => setTimeout(resolve, 100));
            await el.updateComplete;
            expect(mockRepository.saveFragment.calledOnce).to.be.true;
            expect(
                toastEmitStub.calledWith({
                    variant: 'positive',
                    content: 'Translation project updated successfully.',
                }),
            ).to.be.true;
        });

        it('should show validation error when title is missing on update', async () => {
            const mockRepository = createMockRepository();
            querySelectorStub.callsFake((selector) => {
                if (selector === 'mas-repository') return mockRepository;
                return originalQuerySelector(selector);
            });
            Store.translationProjects.translationProjectId.set(null);
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            await el.updateComplete;
            el.isNewTranslationProject = false;
            await el.updateComplete;
            const quickActions = el.shadowRoot.querySelector('mas-quick-actions');
            quickActions.dispatchEvent(new CustomEvent('save'));
            await el.updateComplete;
            expect(
                toastEmitStub.calledWith({
                    variant: 'negative',
                    content: 'Please fill in all required fields.',
                }),
            ).to.be.true;
        });

        it('should handle update failure gracefully', async () => {
            const consoleErrorStub = sandbox.stub(console, 'error');
            const mockRepository = createMockRepository();
            mockRepository.saveFragment.rejects(new Error('Update failed'));
            querySelectorStub.callsFake((selector) => {
                if (selector === 'mas-repository') return mockRepository;
                return originalQuerySelector(selector);
            });
            Store.translationProjects.translationProjectId.set(null);
            Store.translationProjects.targetLocales.set(['pl_PL']);
            Store.translationProjects.selectedCards.set(['card1']);
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            await el.updateComplete;
            const titleField = el.shadowRoot.querySelector('#title');
            titleField.value = 'Valid Title';
            titleField.dispatchEvent(new Event('input', { bubbles: true }));
            await el.updateComplete;
            el.isNewTranslationProject = false;
            await el.updateComplete;
            const quickActions = el.shadowRoot.querySelector('mas-quick-actions');
            quickActions.dispatchEvent(new CustomEvent('save'));
            await new Promise((resolve) => setTimeout(resolve, 100));
            await el.updateComplete;
            expect(
                toastEmitStub.calledWith({
                    variant: 'negative',
                    content: 'Failed to update translation project.',
                }),
            ).to.be.true;
            expect(consoleErrorStub.called).to.be.true;
        });
    });

    describe('send to localization', () => {
        it('should send project to localization successfully', async () => {
            const mockRepository = createMockRepository();
            querySelectorStub.callsFake((selector) => {
                if (selector === 'mas-repository') return mockRepository;
                return originalQuerySelector(selector);
            });
            const mockFragment = new Fragment(createMockFragment({ id: 'loc-id' }));
            const fragmentStore = new FragmentStore(mockFragment);
            Store.translationProjects.inEdit.set(fragmentStore);
            sandbox.stub(window, 'fetch').resolves({
                ok: true,
                json: () => Promise.resolve({ submissionDate: '2024-01-01T00:00:00Z' }),
            });
            window.adobeIMS = { getAccessToken: () => ({ token: 'test-token' }) };
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            el.isNewTranslationProject = false;
            el.disabledActions = new Set();
            el.ioBaseUrl = 'https://test-io.com';
            await el.updateComplete;
            const quickActions = el.shadowRoot.querySelector('mas-quick-actions');
            quickActions.dispatchEvent(new CustomEvent('loc'));
            await el.updateComplete;
            await new Promise((resolve) => setTimeout(resolve, 0));
            expect(
                toastEmitStub.calledWith({
                    variant: 'positive',
                    content: 'Translation project sent to localization successfully.',
                }),
            ).to.be.true;
            expect(el.isProjectReadonly).to.be.true;
            delete window.adobeIMS;
        });

        it('should handle localization failure gracefully', async () => {
            const consoleErrorStub = sandbox.stub(console, 'error');
            const mockRepository = createMockRepository();
            querySelectorStub.callsFake((selector) => {
                if (selector === 'mas-repository') return mockRepository;
                return originalQuerySelector(selector);
            });
            const mockFragment = new Fragment(createMockFragment({ id: 'loc-id' }));
            const fragmentStore = new FragmentStore(mockFragment);
            Store.translationProjects.inEdit.set(fragmentStore);
            sandbox.stub(window, 'fetch').resolves({ ok: false });
            window.adobeIMS = { getAccessToken: () => ({ token: 'test-token' }) };
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            el.isNewTranslationProject = false;
            el.disabledActions = new Set();
            el.ioBaseUrl = 'https://test-io.com';
            await el.updateComplete;
            const quickActions = el.shadowRoot.querySelector('mas-quick-actions');
            quickActions.dispatchEvent(new CustomEvent('loc'));
            await el.updateComplete;
            await new Promise((resolve) => setTimeout(resolve, 0));
            expect(
                toastEmitStub.calledWith({
                    variant: 'negative',
                    content: 'Failed to send translation project to localization.',
                }),
            ).to.be.true;
            expect(consoleErrorStub.called).to.be.true;
            delete window.adobeIMS;
        });

        it('should handle network error when sending to localization', async () => {
            const consoleErrorStub = sandbox.stub(console, 'error');
            const mockRepository = createMockRepository();
            querySelectorStub.callsFake((selector) => {
                if (selector === 'mas-repository') return mockRepository;
                return originalQuerySelector(selector);
            });
            const mockFragment = new Fragment(createMockFragment({ id: 'loc-id' }));
            const fragmentStore = new FragmentStore(mockFragment);
            Store.translationProjects.inEdit.set(fragmentStore);
            sandbox.stub(window, 'fetch').rejects(new Error('Network error'));
            window.adobeIMS = { getAccessToken: () => ({ token: 'test-token' }) };
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            el.isNewTranslationProject = false;
            el.disabledActions = new Set();
            el.ioBaseUrl = 'https://test-io.com';
            await el.updateComplete;
            const quickActions = el.shadowRoot.querySelector('mas-quick-actions');
            quickActions.dispatchEvent(new CustomEvent('loc'));
            await el.updateComplete;
            await new Promise((resolve) => setTimeout(resolve, 0));
            expect(
                toastEmitStub.calledWith({
                    variant: 'negative',
                    content: 'Failed to send translation project to localization.',
                }),
            ).to.be.true;
            expect(consoleErrorStub.called).to.be.true;
            delete window.adobeIMS;
        });
    });

    describe('discard changes', () => {
        it('should discard changes without confirmation when no changes exist', async () => {
            const mockFragment = new Fragment(createMockFragment({ id: 'discard-id' }));
            const fragmentStore = new FragmentStore(mockFragment);
            Store.translationProjects.inEdit.set(fragmentStore);
            Store.translationProjects.selectedCards.set([]);
            Store.translationProjects.selectedCollections.set([]);
            Store.translationProjects.selectedPlaceholders.set([]);
            Store.translationProjects.targetLocales.set([]);
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            el.isNewTranslationProject = false;
            el.disabledActions = new Set();
            await el.updateComplete;
            const quickActions = el.shadowRoot.querySelector('mas-quick-actions');
            quickActions.dispatchEvent(new CustomEvent('discard'));
            await el.updateComplete;
            // Check that stores are properly reset after discard
            expect(el.disabledActions.has(QUICK_ACTION.DISCARD)).to.be.true;
        });

        it('should show confirmation dialog when items are selected', async () => {
            const mockFragment = new Fragment(createMockFragment({ id: 'discard-id' }));
            const fragmentStore = new FragmentStore(mockFragment);
            Store.translationProjects.inEdit.set(fragmentStore);
            Store.translationProjects.selectedCards.set(['card1']);
            Store.translationProjects.selectedCollections.set([]);
            Store.translationProjects.selectedPlaceholders.set([]);
            Store.translationProjects.targetLocales.set([]);
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            el.isNewTranslationProject = false;
            el.disabledActions = new Set();
            await el.updateComplete;
            const quickActions = el.shadowRoot.querySelector('mas-quick-actions');
            quickActions.dispatchEvent(new CustomEvent('discard'));
            await el.updateComplete;
            expect(el.isDialogOpen).to.be.true;
        });

        it('should show confirmation dialog when target locales are selected', async () => {
            const mockFragment = new Fragment(createMockFragment({ id: 'discard-id' }));
            const fragmentStore = new FragmentStore(mockFragment);
            Store.translationProjects.inEdit.set(fragmentStore);
            Store.translationProjects.selectedCards.set([]);
            Store.translationProjects.selectedCollections.set([]);
            Store.translationProjects.selectedPlaceholders.set([]);
            Store.translationProjects.targetLocales.set(['en_US']);
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            el.isNewTranslationProject = false;
            el.disabledActions = new Set();
            await el.updateComplete;
            const quickActions = el.shadowRoot.querySelector('mas-quick-actions');
            quickActions.dispatchEvent(new CustomEvent('discard'));
            await el.updateComplete;
            expect(el.isDialogOpen).to.be.true;
        });

        it('should close dialog and reset actions when discard is confirmed', async () => {
            // Initialize as new project first
            Store.translationProjects.translationProjectId.set(null);
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            await el.updateComplete;
            // Set some values
            const titleField = el.shadowRoot.querySelector('#title');
            titleField.value = 'Original Title';
            titleField.dispatchEvent(new Event('input', { bubbles: true }));
            await el.updateComplete;
            // Set some selected items to trigger the condition for showing dialog
            Store.translationProjects.selectedCards.set(['modified-card']);
            Store.translationProjects.selectedCollections.set([]);
            Store.translationProjects.selectedPlaceholders.set([]);
            Store.translationProjects.targetLocales.set([]);
            el.isNewTranslationProject = false;
            el.disabledActions = new Set();
            await el.updateComplete;
            const quickActions = el.shadowRoot.querySelector('mas-quick-actions');
            quickActions.dispatchEvent(new CustomEvent('discard'));
            await el.updateComplete;
            expect(el.isDialogOpen).to.be.true;
            const dialogWrapper = el.shadowRoot.querySelector('.confirm-dialog-overlay sp-dialog-wrapper');
            dialogWrapper.dispatchEvent(new CustomEvent('confirm'));
            await el.updateComplete;
            expect(el.isDialogOpen).to.be.false;
        });
    });

    describe('item selection dialog', () => {
        it('should confirm item selection and close dialog', async () => {
            Store.translationProjects.selectedCards.set(['card1']);
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            el.showSelectedEmptyState = true;
            await el.updateComplete;
            const overlayTrigger = el.shadowRoot.querySelector('#add-items-overlay');
            overlayTrigger.dispatchEvent(new CustomEvent('sp-opened'));
            await el.updateComplete;
            const dialogWrapper = el.shadowRoot.querySelector('.add-items-dialog');
            let closeEventFired = false;
            dialogWrapper.addEventListener('close', () => {
                closeEventFired = true;
            });
            dialogWrapper.dispatchEvent(new CustomEvent('confirm'));
            await el.updateComplete;
            expect(closeEventFired).to.be.true;
            expect(el.disabledActions.has(QUICK_ACTION.SAVE)).to.be.false;
        });

        it('should cancel item selection and restore snapshot', async () => {
            Store.translationProjects.selectedCards.set(['card1']);
            Store.translationProjects.selectedCollections.set(['col1']);
            Store.translationProjects.selectedPlaceholders.set(['ph1']);
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            el.showSelectedEmptyState = true;
            await el.updateComplete;
            const overlayTrigger = el.shadowRoot.querySelector('#add-items-overlay');
            overlayTrigger.dispatchEvent(new CustomEvent('sp-opened'));
            await el.updateComplete;
            // Modify selection after opening
            Store.translationProjects.selectedCards.set(['card2', 'card3']);
            const dialogWrapper = el.shadowRoot.querySelector('.add-items-dialog');
            let closeEventFired = false;
            dialogWrapper.addEventListener('close', () => {
                closeEventFired = true;
            });
            dialogWrapper.dispatchEvent(new CustomEvent('cancel'));
            await el.updateComplete;
            expect(closeEventFired).to.be.true;
            expect(Store.translationProjects.selectedCards.get()).to.deep.equal(['card1']);
        });
    });

    describe('language selection dialog', () => {
        it('should confirm language selection and close dialog', async () => {
            Store.translationProjects.targetLocales.set(['en_US']);
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            el.showLangSelectedEmptyState = true;
            await el.updateComplete;
            const overlayTrigger = el.shadowRoot.querySelector('#add-languages-overlay');
            overlayTrigger.dispatchEvent(new CustomEvent('sp-opened'));
            await el.updateComplete;
            const dialogWrapper = el.shadowRoot.querySelector('.add-langs-dialog');
            let closeEventFired = false;
            dialogWrapper.addEventListener('close', () => {
                closeEventFired = true;
            });
            dialogWrapper.dispatchEvent(new CustomEvent('confirm'));
            await el.updateComplete;
            expect(closeEventFired).to.be.true;
            expect(el.disabledActions.has(QUICK_ACTION.SAVE)).to.be.false;
        });

        it('should cancel language selection and restore snapshot', async () => {
            Store.translationProjects.targetLocales.set(['en_US']);
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            el.showLangSelectedEmptyState = true;
            await el.updateComplete;
            const overlayTrigger = el.shadowRoot.querySelector('#add-languages-overlay');
            overlayTrigger.dispatchEvent(new CustomEvent('sp-opened'));
            await el.updateComplete;
            Store.translationProjects.targetLocales.set(['fr_FR', 'de_DE']);
            const dialogWrapper = el.shadowRoot.querySelector('.add-langs-dialog');
            let closeEventFired = false;
            dialogWrapper.addEventListener('close', () => {
                closeEventFired = true;
            });
            dialogWrapper.dispatchEvent(new CustomEvent('cancel'));
            await el.updateComplete;
            expect(closeEventFired).to.be.true;
            expect(Store.translationProjects.targetLocales.get()).to.deep.equal(['en_US']);
        });
    });

    describe('promptDiscardChanges', () => {
        it('should show dialog and return true when confirmed with selected items', async () => {
            const mockFragment = new Fragment(createMockFragment());
            const fragmentStore = new FragmentStore(mockFragment);
            Store.translationProjects.inEdit.set(fragmentStore);
            Store.translationProjects.selectedCards.set(['card1']);
            Store.translationProjects.selectedCollections.set([]);
            Store.translationProjects.selectedPlaceholders.set([]);
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            await el.updateComplete;
            const promptPromise = el.promptDiscardChanges();
            await el.updateComplete;
            expect(el.isDialogOpen).to.be.true;
            const dialogWrapper = el.shadowRoot.querySelector('.confirm-dialog-overlay sp-dialog-wrapper');
            dialogWrapper.dispatchEvent(new CustomEvent('confirm'));
            await el.updateComplete;
            const result = await promptPromise;
            expect(result).to.be.true;
        });

        it('should show dialog and return false when cancelled with selected items', async () => {
            const mockFragment = new Fragment(createMockFragment());
            const fragmentStore = new FragmentStore(mockFragment);
            Store.translationProjects.inEdit.set(fragmentStore);
            Store.translationProjects.selectedCards.set(['card1']);
            Store.translationProjects.selectedCollections.set([]);
            Store.translationProjects.selectedPlaceholders.set([]);
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            await el.updateComplete;
            const promptPromise = el.promptDiscardChanges();
            await el.updateComplete;
            expect(el.isDialogOpen).to.be.true;
            const dialogWrapper = el.shadowRoot.querySelector('.confirm-dialog-overlay sp-dialog-wrapper');
            dialogWrapper.dispatchEvent(new CustomEvent('cancel'));
            await el.updateComplete;
            const result = await promptPromise;
            expect(result).to.be.false;
        });
    });

    describe('readonly mode edit buttons', () => {
        it('should not show edit button for languages when in readonly mode', async () => {
            Store.translationProjects.targetLocales.set(['en_US']);
            const mockFragment = new Fragment(createMockFragment());
            const fragmentStore = new FragmentStore(mockFragment);
            Store.translationProjects.inEdit.set(fragmentStore);
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            el.isProjectReadonly = true;
            el.showLangSelectedEmptyState = false;
            await el.updateComplete;
            const editButton = el.shadowRoot.querySelector('.selected-langs sp-action-button');
            expect(editButton).to.be.null;
        });

        it('should not show edit button for items when in readonly mode', async () => {
            Store.translationProjects.selectedCards.set(['card1']);
            const mockFragment = new Fragment(createMockFragment());
            const fragmentStore = new FragmentStore(mockFragment);
            Store.translationProjects.inEdit.set(fragmentStore);
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            el.isProjectReadonly = true;
            el.showSelectedEmptyState = false;
            await el.updateComplete;
            const editButton = el.shadowRoot.querySelector('.selected-items sp-action-button');
            expect(editButton).to.be.null;
        });

        it('should show edit button for languages when not in readonly mode', async () => {
            Store.translationProjects.targetLocales.set(['en_US']);
            const mockFragment = new Fragment(createMockFragment());
            const fragmentStore = new FragmentStore(mockFragment);
            Store.translationProjects.inEdit.set(fragmentStore);
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            el.isProjectReadonly = false;
            el.showLangSelectedEmptyState = false;
            await el.updateComplete;
            const editButton = el.shadowRoot.querySelector('.selected-langs sp-action-button');
            expect(editButton).to.exist;
        });

        it('should show edit button for items when not in readonly mode', async () => {
            Store.translationProjects.selectedCards.set(['card1']);
            const mockFragment = new Fragment(createMockFragment());
            const fragmentStore = new FragmentStore(mockFragment);
            Store.translationProjects.inEdit.set(fragmentStore);
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            el.isProjectReadonly = false;
            el.showSelectedEmptyState = false;
            await el.updateComplete;
            const editButton = el.shadowRoot.querySelector('.selected-items sp-action-button');
            expect(editButton).to.exist;
        });
    });

    describe('showDialog prevention', () => {
        it('should return true immediately when no changes and no selections', async () => {
            const mockFragment = new Fragment(createMockFragment());
            const fragmentStore = new FragmentStore(mockFragment);
            Store.translationProjects.inEdit.set(fragmentStore);
            Store.translationProjects.selectedCards.set([]);
            Store.translationProjects.selectedCollections.set([]);
            Store.translationProjects.selectedPlaceholders.set([]);
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            await el.updateComplete;
            const result = await el.promptDiscardChanges();
            expect(result).to.be.true;
            expect(el.isDialogOpen).to.be.false;
        });
    });

    describe('translationProjectStore setter', () => {
        it('should update Store.translationProjects.inEdit when set', async () => {
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            const mockFragment = new Fragment(createMockFragment());
            const fragmentStore = new FragmentStore(mockFragment);
            el.translationProjectStore = fragmentStore;
            expect(Store.translationProjects.inEdit.get()).to.equal(fragmentStore);
        });
    });

    describe('ioBaseUrl initialization', () => {
        it('should read ioBaseUrl from meta tag', async () => {
            const metaTag = document.createElement('meta');
            metaTag.name = 'io-base-url';
            metaTag.content = 'https://custom-io.com';
            document.head.appendChild(metaTag);
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            expect(el.ioBaseUrl).to.equal('https://custom-io.com');
            document.head.removeChild(metaTag);
        });
    });

    describe('empty state transitions', () => {
        it('should update showSelectedEmptyState when items are confirmed', async () => {
            Store.translationProjects.selectedCards.set([]);
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            el.showSelectedEmptyState = true;
            await el.updateComplete;
            const overlayTrigger = el.shadowRoot.querySelector('#add-items-overlay');
            overlayTrigger.dispatchEvent(new CustomEvent('sp-opened'));
            await el.updateComplete;
            const dialogWrapper = el.shadowRoot.querySelector('.add-items-dialog');
            dialogWrapper.dispatchEvent(new CustomEvent('confirm'));
            await el.updateComplete;
            expect(el.showSelectedEmptyState).to.be.true;
        });

        it('should update showLangSelectedEmptyState when languages are confirmed', async () => {
            Store.translationProjects.targetLocales.set([]);
            const el = await fixture(html`<mas-translation-editor></mas-translation-editor>`);
            el.showLangSelectedEmptyState = true;
            await el.updateComplete;
            const overlayTrigger = el.shadowRoot.querySelector('#add-languages-overlay');
            overlayTrigger.dispatchEvent(new CustomEvent('sp-opened'));
            await el.updateComplete;
            const dialogWrapper = el.shadowRoot.querySelector('.add-langs-dialog');
            dialogWrapper.dispatchEvent(new CustomEvent('confirm'));
            await el.updateComplete;
            expect(el.showLangSelectedEmptyState).to.be.true;
        });
    });
});
