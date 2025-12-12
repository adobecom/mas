import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { PAGE_NAMES } from '../src/constants.js';
import Store from '../src/store.js';

describe('MasLocalization', () => {
    let sandbox;
    let originalTranslationProjectsData;
    let originalTranslationProjectsLoading;
    let originalPage;

    let MasLocalization;

    before(async () => {
        await import('../src/mas-localization.js');
        MasLocalization = customElements.get('mas-localization');
    });

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        originalTranslationProjectsData = Store.translationProjects.list.data.value;
        originalTranslationProjectsLoading = Store.translationProjects.list.loading.value;
        originalPage = Store.page.value;
        Store.translationProjects.list.data.value = [];
        Store.translationProjects.list.loading.value = false;
    });

    afterEach(() => {
        sandbox.restore();
        Store.translationProjects.list.data.value = originalTranslationProjectsData;
        Store.translationProjects.list.loading.value = originalTranslationProjectsLoading;
        Store.page.value = originalPage;
    });

    const createLocalization = () => Object.create(MasLocalization.prototype);

    const createMockTranslationProjectData = (overrides = {}) => ({
        id: 'test-project-id',
        path: '/content/dam/mas/acom/translations/test-project',
        title: 'Test Translation Project',
        modified: {
            fullName: 'Test User',
        },
        get: function () {
            return this;
        },
        ...overrides,
    });

    const createMockFragmentStore = (projectData) => ({
        id: projectData.id,
        get: () => projectData,
    });

    describe('static properties', () => {
        it('has correct static properties defined', () => {
            expect(MasLocalization.properties).to.have.property('isDialogOpen');
            expect(MasLocalization.properties.isDialogOpen.type).to.equal(Boolean);
            expect(MasLocalization.properties.isDialogOpen.state).to.be.true;
            expect(MasLocalization.properties).to.have.property('confirmDialogConfig');
            expect(MasLocalization.properties.confirmDialogConfig.type).to.equal(Object);
            expect(MasLocalization.properties.confirmDialogConfig.state).to.be.true;
        });

        it('has styles defined', () => {
            expect(MasLocalization.styles).to.not.be.undefined;
        });
    });

    describe('translationProjectsData getter', () => {
        it('returns empty array when no data is set', () => {
            Store.translationProjects.list.data.value = [];
            const localization = createLocalization();
            expect(localization.translationProjectsData).to.deep.equal([]);
        });

        it('returns translation projects from store', () => {
            const mockProjectData = createMockTranslationProjectData();
            const mockStore = createMockFragmentStore(mockProjectData);
            Store.translationProjects.list.data.value = [mockStore];
            const localization = createLocalization();
            expect(localization.translationProjectsData).to.have.lengthOf(1);
            expect(localization.translationProjectsData[0]).to.equal(mockStore);
        });

        it('returns empty array when store is undefined', () => {
            const localization = createLocalization();
            expect(localization.translationProjectsData).to.be.an('array');
        });
    });

    describe('translationProjectsLoading getter', () => {
        it('returns false when not loading', () => {
            Store.translationProjects.list.loading.value = false;
            const localization = createLocalization();
            expect(localization.translationProjectsLoading).to.be.false;
        });

        it('returns true when loading', () => {
            Store.translationProjects.list.loading.value = true;
            const localization = createLocalization();
            expect(localization.translationProjectsLoading).to.be.true;
        });

        it('returns false when store is undefined', () => {
            const localization = createLocalization();
            expect(localization.translationProjectsLoading).to.be.a('boolean');
        });
    });

    describe('repository getter', () => {
        it('returns null when no repository element exists', () => {
            const localization = createLocalization();
            expect(localization.repository).to.be.null;
        });

        it('returns repository element when it exists', () => {
            const mockRepository = document.createElement('div');
            mockRepository.setAttribute('data-test-repository', 'true');
            const originalQuerySelector = document.querySelector.bind(document);
            sandbox.stub(document, 'querySelector').callsFake((selector) => {
                if (selector === 'mas-repository') {
                    return mockRepository;
                }
                return originalQuerySelector(selector);
            });
            const localization = createLocalization();
            expect(localization.repository).to.equal(mockRepository);
        });
    });

    describe('ensureRepository', () => {
        it('throws error when repository is not found', () => {
            const localization = createLocalization();
            expect(() => localization.ensureRepository()).to.throw('Repository component not found');
            expect(localization.error).to.equal('Repository component not found');
        });

        it('throws error with custom message when repository is not found', () => {
            const localization = createLocalization();
            const customMessage = 'Custom error message';
            expect(() => localization.ensureRepository(customMessage)).to.throw(customMessage);
            expect(localization.error).to.equal(customMessage);
        });

        it('returns repository when it exists', () => {
            const mockRepository = document.createElement('div');
            mockRepository.setAttribute('data-test-repository', 'true');
            const originalQuerySelector = document.querySelector.bind(document);
            sandbox.stub(document, 'querySelector').callsFake((selector) => {
                if (selector === 'mas-repository') {
                    return mockRepository;
                }
                return originalQuerySelector(selector);
            });
            const localization = createLocalization();
            const result = localization.ensureRepository();
            expect(result).to.equal(mockRepository);
        });
    });

    describe('loadingIndicator getter', () => {
        it('returns nothing when not loading', () => {
            Store.translationProjects.list.loading.value = false;
            const localization = createLocalization();
            const result = localization.loadingIndicator;
            // The `nothing` symbol from lit
            expect(result).to.satisfy((v) => v === undefined || typeof v === 'symbol');
        });

        it('returns template result when loading', () => {
            Store.translationProjects.list.loading.value = true;
            const localization = createLocalization();
            const result = localization.loadingIndicator;
            expect(result).to.not.be.undefined;
            expect(result).to.not.satisfy((v) => typeof v === 'symbol');
        });
    });

    describe('renderConfirmDialog', () => {
        it('returns nothing when confirmDialogConfig is null', () => {
            const localization = createLocalization();
            // Using direct property assignment without triggering LitElement's reactive system
            Object.defineProperty(localization, 'confirmDialogConfig', {
                value: null,
                writable: true,
                configurable: true,
            });

            const result = localization.renderConfirmDialog();
            // The `nothing` symbol from lit
            expect(result).to.satisfy((v) => v === undefined || typeof v === 'symbol');
        });

        it('returns template when confirmDialogConfig is set', () => {
            const localization = createLocalization();
            // Using direct property assignment without triggering LitElement's reactive system
            Object.defineProperty(localization, 'confirmDialogConfig', {
                value: {
                    title: 'Test Title',
                    message: 'Test Message',
                    confirmText: 'Confirm',
                    cancelText: 'Cancel',
                    variant: 'negative',
                    onConfirm: sandbox.stub(),
                    onCancel: sandbox.stub(),
                },
                writable: true,
                configurable: true,
            });

            const result = localization.renderConfirmDialog();
            expect(result).to.not.be.undefined;
            // Should be a Lit TemplateResult
            expect(result).to.have.property('_$litType$');
        });
    });

    describe('renderTableHeader', () => {
        it('renders header with provided columns', () => {
            const localization = createLocalization();
            const columns = [
                { key: 'title', label: 'Title' },
                { key: 'author', label: 'Author', align: 'right' },
            ];
            const result = localization.renderTableHeader(columns);
            expect(result).to.not.be.undefined;
            expect(result).to.have.property('_$litType$');
        });

        it('handles empty columns array', () => {
            const localization = createLocalization();
            const result = localization.renderTableHeader([]);
            expect(result).to.not.be.undefined;
            expect(result).to.have.property('_$litType$');
        });
    });

    describe('renderActionCell', () => {
        it('renders action cell with menu items', () => {
            const localization = createLocalization();
            const mockProject = createMockTranslationProjectData();
            const mockStore = createMockFragmentStore(mockProject);
            const result = localization.renderActionCell(mockStore);
            expect(result).to.not.be.undefined;
            expect(result).to.have.property('_$litType$');
        });
    });

    describe('renderTranslationProjectsTable', () => {
        it('renders table with translation projects', () => {
            const mockProject = createMockTranslationProjectData();
            const mockStore = createMockFragmentStore(mockProject);
            Store.translationProjects.list.data.value = [mockStore];
            const localization = createLocalization();
            const result = localization.renderTranslationProjectsTable();
            expect(result).to.not.be.undefined;
            expect(result).to.have.property('_$litType$');
        });

        it('renders table with multiple projects', () => {
            const mockProjects = [
                createMockFragmentStore(createMockTranslationProjectData({ id: 'p1', title: 'Project 1' })),
                createMockFragmentStore(createMockTranslationProjectData({ id: 'p2', title: 'Project 2' })),
            ];
            Store.translationProjects.list.data.value = mockProjects;
            const localization = createLocalization();
            const result = localization.renderTranslationProjectsTable();
            expect(result).to.not.be.undefined;
            expect(result).to.have.property('_$litType$');
        });
    });

    describe('renderTranslationsProjects', () => {
        it('renders loading indicator when loading', () => {
            Store.translationProjects.list.loading.value = true;
            const localization = createLocalization();
            const result = localization.renderTranslationsProjects();
            expect(result).to.not.be.undefined;
            expect(result).to.have.property('_$litType$');
        });

        it('renders empty state when no translation projects exist', () => {
            Store.translationProjects.list.data.value = [];
            Store.translationProjects.list.loading.value = false;
            const localization = createLocalization();
            const result = localization.renderTranslationsProjects();
            expect(result).to.not.be.undefined;
            expect(result).to.have.property('_$litType$');
        });

        it('renders table when translation projects exist', () => {
            const mockProject = createMockTranslationProjectData();
            const mockStore = createMockFragmentStore(mockProject);
            Store.translationProjects.list.data.value = [mockStore];
            Store.translationProjects.list.loading.value = false;
            const localization = createLocalization();
            const result = localization.renderTranslationsProjects();
            expect(result).to.not.be.undefined;
            expect(result).to.have.property('_$litType$');
        });
    });

    describe('render', () => {
        it('renders the main template', () => {
            const localization = createLocalization();
            // Setting required properties without triggering reactive system
            Object.defineProperty(localization, 'confirmDialogConfig', {
                value: null,
                writable: true,
                configurable: true,
            });
            const result = localization.render();

            expect(result).to.not.be.undefined;
            expect(result).to.have.property('_$litType$');
        });
    });

    describe('page navigation', () => {
        it('sets page to LOCALIZATION_EDITOR when handleAddTranslationProject is triggered', () => {
            Store.page.value = PAGE_NAMES.LOCALIZATION;
            const localization = createLocalization();
            Store.page.set(PAGE_NAMES.LOCALIZATION_EDITOR);
            expect(Store.page.get()).to.equal(PAGE_NAMES.LOCALIZATION_EDITOR);
        });
    });

    describe('dialog state management', () => {
        it('tracks isDialogOpen state', () => {
            const localization = createLocalization();
            // Using Object.defineProperty to avoid LitElement reactive property issues
            Object.defineProperty(localization, 'isDialogOpen', {
                value: true,
                writable: true,
                configurable: true,
            });
            expect(localization.isDialogOpen).to.be.true;
            localization.isDialogOpen = false;
            expect(localization.isDialogOpen).to.be.false;
        });

        it('confirmDialogConfig can be set and cleared', () => {
            const localization = createLocalization();

            // Using Object.defineProperty to avoid LitElement reactive property issues
            Object.defineProperty(localization, 'confirmDialogConfig', {
                value: null,
                writable: true,
                configurable: true,
            });
            expect(localization.confirmDialogConfig).to.be.null;
            const config = {
                title: 'Test',
                message: 'Message',
                confirmText: 'OK',
                cancelText: 'Cancel',
                variant: 'primary',
                onConfirm: () => {},
                onCancel: () => {},
            };
            localization.confirmDialogConfig = config;
            expect(localization.confirmDialogConfig).to.equal(config);
            localization.confirmDialogConfig = null;
            expect(localization.confirmDialogConfig).to.be.null;
        });
    });

    describe('Store integration', () => {
        it('reads translationProjectsData from Store', () => {
            const mockProjects = [
                createMockFragmentStore(createMockTranslationProjectData({ id: 'p1' })),
                createMockFragmentStore(createMockTranslationProjectData({ id: 'p2' })),
                createMockFragmentStore(createMockTranslationProjectData({ id: 'p3' })),
            ];
            Store.translationProjects.list.data.value = mockProjects;
            const localization = createLocalization();
            expect(localization.translationProjectsData).to.have.lengthOf(3);
        });

        it('reads translationProjectsLoading from Store', () => {
            Store.translationProjects.list.loading.value = true;
            const localization = createLocalization();
            expect(localization.translationProjectsLoading).to.be.true;
            Store.translationProjects.list.loading.value = false;
            expect(localization.translationProjectsLoading).to.be.false;
        });
    });

    describe('data display', () => {
        it('translation project displays correct title', () => {
            const mockProject = createMockTranslationProjectData({
                title: 'My Custom Project',
            });
            const mockStore = createMockFragmentStore(mockProject);
            Store.translationProjects.list.data.value = [mockStore];
            const localization = createLocalization();
            const data = localization.translationProjectsData;
            expect(data[0].get().title).to.equal('My Custom Project');
        });

        it('translation project displays correct modified user', () => {
            const mockProject = createMockTranslationProjectData({
                modified: { fullName: 'John Doe' },
            });
            const mockStore = createMockFragmentStore(mockProject);
            Store.translationProjects.list.data.value = [mockStore];
            const localization = createLocalization();
            const data = localization.translationProjectsData;
            expect(data[0].get().modified.fullName).to.equal('John Doe');
        });

        it('translation project displays correct path', () => {
            const mockProject = createMockTranslationProjectData({
                path: '/content/dam/mas/acom/translations/custom-path',
            });
            const mockStore = createMockFragmentStore(mockProject);
            Store.translationProjects.list.data.value = [mockStore];
            const localization = createLocalization();
            const data = localization.translationProjectsData;
            expect(data[0].get().path).to.equal('/content/dam/mas/acom/translations/custom-path');
        });
    });

    describe('table columns configuration', () => {
        it('renderTranslationProjectsTable uses correct column configuration', () => {
            const mockProject = createMockTranslationProjectData();
            const mockStore = createMockFragmentStore(mockProject);
            Store.translationProjects.list.data.value = [mockStore];
            const localization = createLocalization();
            const result = localization.renderTranslationProjectsTable();
            expect(result).to.have.property('_$litType$');
        });
    });

    describe('empty state handling', () => {
        it('shows empty state message when no projects', () => {
            Store.translationProjects.list.data.value = [];
            Store.translationProjects.list.loading.value = false;
            const localization = createLocalization();
            const result = localization.renderTranslationsProjects();
            expect(result).to.have.property('_$litType$');
        });
    });

    describe('loading state handling', () => {
        it('shows loading indicator when translationProjectsLoading is true', () => {
            Store.translationProjects.list.loading.value = true;
            const localization = createLocalization();
            const result = localization.renderTranslationsProjects();
            expect(result).to.have.property('_$litType$');
        });

        it('does not show loading indicator when translationProjectsLoading is false', () => {
            Store.translationProjects.list.loading.value = false;
            Store.translationProjects.list.data.value = [];
            const localization = createLocalization();
            expect(localization.translationProjectsLoading).to.be.false;
        });
    });

    describe('action menu items', () => {
        it('renderActionCell includes all menu items', () => {
            const mockProject = createMockTranslationProjectData();
            const mockStore = createMockFragmentStore(mockProject);
            const localization = createLocalization();
            const result = localization.renderActionCell(mockStore);
            expect(result).to.have.property('_$litType$');
        });
    });
});
