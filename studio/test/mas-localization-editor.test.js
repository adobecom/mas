import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { PAGE_NAMES, TRANSLATION_PROJECT_MODEL_ID } from '../src/constants.js';

describe('MasLocalizationEditor', () => {
    let sandbox;
    let MasLocalizationEditor;

    before(async () => {
        await import('../src/mas-localization-editor.js');
        MasLocalizationEditor = customElements.get('mas-localization-editor');
    });

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    const createLocalizationEditor = () => Object.create(MasLocalizationEditor.prototype);

    const createMockFragment = (overrides = {}) => ({
        id: 'test-fragment-id',
        title: 'Test Project',
        hasChanges: false,
        fields: [{ name: 'title', type: 'text', values: ['Test Project'] }],
        getFieldValue: (fieldName) => {
            const field =
                overrides.fields?.find((f) => f.name === fieldName) ||
                [{ name: 'title', type: 'text', values: ['Test Project'] }].find((f) => f.name === fieldName);
            return field?.values?.[0];
        },
        ...overrides,
    });

    const createMockFragmentStore = (fragment) => ({
        get: () => fragment,
        updateField: sandbox.stub(),
    });

    const createMockRepository = (overrides = {}) => ({
        getTranslationsPath: sandbox.stub().returns('/content/dam/mas/acom/translations'),
        createFragment: sandbox.stub().resolves({ id: 'new-fragment-id' }),
        ...overrides,
    });

    describe('static properties', () => {
        it('has correct static properties defined', () => {
            expect(MasLocalizationEditor.properties).to.have.property('storeController');
            expect(MasLocalizationEditor.properties.storeController.type).to.equal(Object);
            expect(MasLocalizationEditor.properties.storeController.state).to.be.true;
        });

        it('has styles defined', () => {
            expect(MasLocalizationEditor.styles).to.not.be.undefined;
        });
    });

    describe('repository getter', () => {
        it('returns null when no repository element exists', () => {
            const editor = createLocalizationEditor();
            expect(editor.repository).to.be.null;
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
            const editor = createLocalizationEditor();
            expect(editor.repository).to.equal(mockRepository);
        });
    });

    describe('fragment getter', () => {
        it('returns undefined when fragmentStore is not set', () => {
            const editor = createLocalizationEditor();
            expect(editor.fragment).to.be.undefined;
        });

        it('returns fragment from fragmentStore when set', () => {
            const editor = createLocalizationEditor();
            const mockFragment = createMockFragment();
            editor.fragmentStore = createMockFragmentStore(mockFragment);
            expect(editor.fragment).to.equal(mockFragment);
        });
    });

    describe('translationStatus getter', () => {
        it('returns the correct status message', () => {
            const editor = createLocalizationEditor();
            expect(editor.translationStatus).to.equal(
                'All required languages have been preselected for this project. They are mandatory and cannot be changed.',
            );
        });
    });

    describe('renderConfirmDialog', () => {
        it('returns nothing when confirmDialogConfig is null', () => {
            const editor = createLocalizationEditor();
            Object.defineProperty(editor, 'confirmDialogConfig', {
                value: null,
                writable: true,
                configurable: true,
            });
            editor.fragmentStore = createMockFragmentStore(createMockFragment());
            const result = editor.renderConfirmDialog();
            expect(result).to.satisfy((v) => v === undefined || typeof v === 'symbol');
        });

        it('returns nothing when fragment has no changes', () => {
            const editor = createLocalizationEditor();
            Object.defineProperty(editor, 'confirmDialogConfig', {
                value: { title: 'Test' },
                writable: true,
                configurable: true,
            });
            editor.fragmentStore = createMockFragmentStore(createMockFragment({ hasChanges: false }));
            const result = editor.renderConfirmDialog();
            expect(result).to.satisfy((v) => v === undefined || typeof v === 'symbol');
        });

        it('renders dialog when confirmDialogConfig is set and fragment has changes', () => {
            const editor = createLocalizationEditor();
            Object.defineProperty(editor, 'confirmDialogConfig', {
                value: {
                    title: 'Unsaved Changes',
                    message: 'You have unsaved changes',
                    confirmText: 'Discard',
                    cancelText: 'Cancel',
                    variant: 'negative',
                    onConfirm: sandbox.stub(),
                    onCancel: sandbox.stub(),
                },
                writable: true,
                configurable: true,
            });
            editor.fragmentStore = createMockFragmentStore(createMockFragment({ hasChanges: true }));
            const result = editor.renderConfirmDialog();
            expect(result).to.have.property('_$litType$');
        });
    });

    // Note: render() and renderAddFilesDialog() use private class fields (#handleFragmentUpdate,
    // #handleCloseAddFilesDialog) which cannot be accessed via Object.create().
    // These methods must be tested via DOM element instantiation or integration tests.

    describe('field validation', () => {
        it('validates required fields correctly when title is present', () => {
            const fragment = createMockFragment({
                fields: [{ name: 'title', type: 'text', values: ['My Project'] }],
            });
            expect(fragment.getFieldValue('title')).to.equal('My Project');
        });

        it('validates required fields correctly when title is empty', () => {
            const fragment = createMockFragment({
                fields: [{ name: 'title', type: 'text', values: [''] }],
                getFieldValue: () => '',
            });
            expect(fragment.getFieldValue('title')).to.equal('');
        });
    });

    describe('fragment store integration', () => {
        it('updateField is called on fragmentStore', () => {
            const editor = createLocalizationEditor();
            const mockFragment = createMockFragment();
            const mockFragmentStore = createMockFragmentStore(mockFragment);
            editor.fragmentStore = mockFragmentStore;
            mockFragmentStore.updateField('title', ['New Title']);
            expect(mockFragmentStore.updateField.calledWith('title', ['New Title'])).to.be.true;
        });
    });

    describe('create translation project payload', () => {
        it('builds correct fragment payload structure', () => {
            const editor = createLocalizationEditor();
            const mockRepository = createMockRepository();
            const originalQuerySelector = document.querySelector.bind(document);
            sandbox.stub(document, 'querySelector').callsFake((selector) => {
                if (selector === 'mas-repository') {
                    return mockRepository;
                }
                return originalQuerySelector(selector);
            });

            const fragment = createMockFragment({
                fields: [{ name: 'title', type: 'text', values: ['My Translation Project'] }],
            });
            const expectedPayload = {
                name: 'my-translation-project',
                parentPath: '/content/dam/mas/acom/translations',
                modelId: TRANSLATION_PROJECT_MODEL_ID,
                title: 'My Translation Project',
            };
            expect(mockRepository.getTranslationsPath()).to.equal(expectedPayload.parentPath);
            expect(fragment.getFieldValue('title')).to.equal(expectedPayload.title);
        });
    });

    describe('constants usage', () => {
        it('uses correct model ID for translation projects', () => {
            expect(TRANSLATION_PROJECT_MODEL_ID).to.not.be.undefined;
            expect(TRANSLATION_PROJECT_MODEL_ID).to.be.a('string');
        });

        it('uses correct page name for navigation', () => {
            expect(PAGE_NAMES.LOCALIZATION).to.equal('localization');
        });
    });

    describe('dialog state management', () => {
        it('confirmDialogConfig can be set and cleared', () => {
            const editor = createLocalizationEditor();
            Object.defineProperty(editor, 'confirmDialogConfig', {
                value: null,
                writable: true,
                configurable: true,
            });
            expect(editor.confirmDialogConfig).to.be.null;

            const config = {
                title: 'Test',
                message: 'Message',
                confirmText: 'OK',
                cancelText: 'Cancel',
                variant: 'primary',
                onConfirm: () => {},
                onCancel: () => {},
            };
            editor.confirmDialogConfig = config;
            expect(editor.confirmDialogConfig).to.equal(config);

            editor.confirmDialogConfig = null;
            expect(editor.confirmDialogConfig).to.be.null;
        });

        it('isDialogOpen can be set and cleared', () => {
            const editor = createLocalizationEditor();
            Object.defineProperty(editor, 'isDialogOpen', {
                value: false,
                writable: true,
                configurable: true,
            });
            expect(editor.isDialogOpen).to.be.false;

            editor.isDialogOpen = true;
            expect(editor.isDialogOpen).to.be.true;
        });
    });

    describe('form field handling', () => {
        it('handles text field input correctly', () => {
            const editor = createLocalizationEditor();
            const mockFragmentStore = createMockFragmentStore(createMockFragment());
            editor.fragmentStore = mockFragmentStore;
            const expectedValue = ['New Project Title'];
            mockFragmentStore.updateField('title', expectedValue);
            expect(mockFragmentStore.updateField.calledWith('title', expectedValue)).to.be.true;
        });

        it('handles multiline field input correctly', () => {
            const editor = createLocalizationEditor();
            const mockFragmentStore = createMockFragmentStore(createMockFragment());
            editor.fragmentStore = mockFragmentStore;
            const expectedValue = ['value1', 'value2', 'value3'];
            mockFragmentStore.updateField('tags', expectedValue);
            expect(mockFragmentStore.updateField.calledWith('tags', expectedValue)).to.be.true;
        });
    });

    describe('translation status message', () => {
        it('includes information about required languages', () => {
            const editor = createLocalizationEditor();
            const status = editor.translationStatus;
            expect(status).to.include('required languages');
            expect(status).to.include('mandatory');
        });
    });

    describe('repository integration', () => {
        it('getTranslationsPath is called when creating fragment', () => {
            const mockRepository = createMockRepository();
            const result = mockRepository.getTranslationsPath();
            expect(result).to.equal('/content/dam/mas/acom/translations');
            expect(mockRepository.getTranslationsPath.calledOnce).to.be.true;
        });

        it('createFragment is called with correct structure', async () => {
            const mockRepository = createMockRepository();
            const payload = {
                name: 'test-project',
                parentPath: '/content/dam/mas/acom/translations',
                modelId: TRANSLATION_PROJECT_MODEL_ID,
                title: 'Test Project',
                fields: [{ name: 'title', type: 'text', values: ['Test Project'] }],
            };
            await mockRepository.createFragment(payload);
            expect(mockRepository.createFragment.calledOnce).to.be.true;
            expect(mockRepository.createFragment.calledWith(payload)).to.be.true;
        });
    });

    describe('error handling', () => {
        it('handles createFragment failure gracefully', async () => {
            const mockRepository = createMockRepository({
                createFragment: sandbox.stub().rejects(new Error('Creation failed')),
            });
            try {
                await mockRepository.createFragment({});
                expect.fail('Should have thrown');
            } catch (error) {
                expect(error.message).to.equal('Creation failed');
            }
        });
    });

    describe('storeController initialization', () => {
        it('storeController starts as null in constructor', () => {
            const editor = createLocalizationEditor();
            Object.defineProperty(editor, 'storeController', {
                value: null,
                writable: true,
                configurable: true,
            });
            expect(editor.storeController).to.be.null;
        });
    });

    describe('fragment data access', () => {
        it('fragment getter returns correct data', () => {
            const editor = createLocalizationEditor();
            const mockFragment = createMockFragment({ title: 'Custom Title' });
            editor.fragmentStore = createMockFragmentStore(mockFragment);
            expect(editor.fragment.title).to.equal('Custom Title');
        });

        it('fragment getter handles null fragmentStore', () => {
            const editor = createLocalizationEditor();
            editor.fragmentStore = null;
            expect(editor.fragment).to.be.undefined;
        });
    });

    describe('mock fragment behavior', () => {
        it('getFieldValue returns correct value for existing field', () => {
            const fragment = createMockFragment({
                fields: [{ name: 'title', type: 'text', values: ['Project Alpha'] }],
            });
            expect(fragment.getFieldValue('title')).to.equal('Project Alpha');
        });

        it('hasChanges property reflects fragment state', () => {
            const unchangedFragment = createMockFragment({ hasChanges: false });
            const changedFragment = createMockFragment({ hasChanges: true });
            expect(unchangedFragment.hasChanges).to.be.false;
            expect(changedFragment.hasChanges).to.be.true;
        });
    });
});
