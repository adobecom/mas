import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, fixtureCleanup } from '@open-wc/testing-helpers/pure';
import sinon from 'sinon';
import Store from '../src/store.js';
import router from '../src/router.js';
import { PAGE_NAMES, WCS_LANDSCAPE_DRAFT, WCS_LANDSCAPE_PUBLISHED } from '../src/constants.js';
import { delay } from './utils.js';
import '../src/swc.js';
import '../src/mas-top-nav.js';

describe('MasTopNav', () => {
    let sandbox;
    let originalPageValue;
    let originalLandscapeValue;
    let originalSettingsFragmentId;
    let originalSettingsCreating;
    let originalVersionFragmentId;
    let originalPromotionId;
    let originalTranslationProjectId;
    let originalTranslationInEdit;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        originalPageValue = Store.page.value;
        originalLandscapeValue = Store.landscape.value;
        originalSettingsFragmentId = Store.settings.fragmentId.value;
        originalSettingsCreating = Store.settings.creating.value;
        originalVersionFragmentId = Store.version.fragmentId.value;
        originalPromotionId = Store.promotions.promotionId.value;
        originalTranslationProjectId = Store.translationProjects.translationProjectId.value;
        originalTranslationInEdit = Store.translationProjects.inEdit.value;
        window.adobeIMS = {
            getAccessToken: () => ({ token: 'mock-token' }),
            getProfile: () => Promise.resolve({ displayName: 'Test User', email: 'test@example.com' }),
            signOut: sandbox.stub(),
        };
        sandbox.stub(window, 'fetch').resolves({
            json: () => Promise.resolve({ user: { avatar: 'https://example.com/avatar.png' } }),
        });
        Store.search.value = { path: 'acom' };
    });

    afterEach(() => {
        fixtureCleanup();
        sandbox.restore();
        Store.page.value = originalPageValue;
        Store.landscape.value = originalLandscapeValue;
        Store.settings.fragmentId.value = originalSettingsFragmentId;
        Store.settings.creating.value = originalSettingsCreating;
        Store.version.fragmentId.value = originalVersionFragmentId;
        Store.promotions.promotionId.value = originalPromotionId;
        Store.translationProjects.translationProjectId.value = originalTranslationProjectId;
        Store.translationProjects.inEdit.value = originalTranslationInEdit;
        delete window.adobeIMS;
    });

    describe('isFragmentEditorPage getter', () => {
        it('should return true when on fragment editor page', async () => {
            Store.page.value = PAGE_NAMES.FRAGMENT_EDITOR;
            const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
            expect(el.isFragmentEditorPage).to.be.true;
        });

        it('should return false when not on fragment editor page', async () => {
            Store.page.value = PAGE_NAMES.CONTENT;
            const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
            expect(el.isFragmentEditorPage).to.be.false;
        });
    });

    describe('isTranslationEditorPage getter', () => {
        it('should return true when on translation editor page', async () => {
            Store.page.value = PAGE_NAMES.TRANSLATION_EDITOR;
            const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
            expect(el.isTranslationEditorPage).to.be.true;
        });

        it('should return false when not on translation editor page', async () => {
            Store.page.value = PAGE_NAMES.CONTENT;
            const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
            expect(el.isTranslationEditorPage).to.be.false;
        });
    });

    describe('isTranslationsPage getter', () => {
        it('should return true when on translations page', async () => {
            Store.page.value = PAGE_NAMES.TRANSLATIONS;
            const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
            expect(el.isTranslationsPage).to.be.true;
        });

        it('should return false when not on translations page', async () => {
            Store.page.value = PAGE_NAMES.CONTENT;
            const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
            expect(el.isTranslationsPage).to.be.false;
        });
    });

    describe('breadcrumbs', () => {
        it('should render fragment editor breadcrumbs and navigate to content from first crumb', async () => {
            Store.page.value = PAGE_NAMES.FRAGMENT_EDITOR;
            const navigateStub = sandbox.stub(router, 'navigateToPage').returns(() => {});
            const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
            const items = [...el.querySelectorAll('.nav-breadcrumbs sp-breadcrumb-item')].map((item) =>
                item.textContent.trim(),
            );

            expect(items).to.deep.equal(['Fragments', 'Editor']);
            el.querySelector('.nav-breadcrumbs sp-breadcrumb-item').click();
            expect(navigateStub.calledWith(PAGE_NAMES.CONTENT)).to.be.true;
        });

        it('should render version breadcrumbs and navigate to editor from second crumb', async () => {
            Store.page.value = PAGE_NAMES.VERSION;
            Store.version.fragmentId.value = 'fragment-1';
            const navigateSpy = sandbox.stub(router, 'navigateToFragmentEditor');
            const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
            const breadcrumbs = [...el.querySelectorAll('.nav-breadcrumbs sp-breadcrumb-item')];
            const items = breadcrumbs.map((item) => item.textContent.trim());

            expect(items).to.deep.equal(['Fragments', 'Editor', 'Version history']);
            breadcrumbs[1].click();
            expect(navigateSpy.calledWith('fragment-1')).to.be.true;
        });

        it('should not navigate to editor from version breadcrumb when fragmentId is empty', async () => {
            Store.page.value = PAGE_NAMES.VERSION;
            Store.version.fragmentId.value = null;
            const navigateSpy = sandbox.stub(router, 'navigateToFragmentEditor');
            const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
            const breadcrumbs = [...el.querySelectorAll('.nav-breadcrumbs sp-breadcrumb-item')];

            breadcrumbs[1].click();
            expect(navigateSpy.called).to.be.false;
        });

        it('should render setting editor breadcrumbs and label for create flow', async () => {
            Store.page.value = PAGE_NAMES.SETTINGS_EDITOR;
            Store.settings.fragmentId.value = null;
            Store.settings.creating.value = true;
            const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
            const items = [...el.querySelectorAll('.nav-breadcrumbs sp-breadcrumb-item')].map((item) =>
                item.textContent.trim(),
            );
            expect(items).to.deep.equal(['Settings', 'Create new setting']);
        });

        it('should render setting editor breadcrumbs and label for edit flow', async () => {
            Store.page.value = PAGE_NAMES.SETTINGS_EDITOR;
            Store.settings.fragmentId.set('setting-1');
            Store.settings.creating.set(false);
            const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
            const items = [...el.querySelectorAll('.nav-breadcrumbs sp-breadcrumb-item')].map((item) =>
                item.textContent.trim(),
            );
            expect(items).to.deep.equal(['Settings', 'Edit setting']);
        });

        it('should not render settings breadcrumbs when no setting id and not creating', async () => {
            Store.page.value = PAGE_NAMES.SETTINGS_EDITOR;
            Store.settings.fragmentId.value = null;
            Store.settings.creating.value = false;
            const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
            const breadcrumbs = el.querySelector('.nav-breadcrumbs');
            expect(breadcrumbs).to.not.exist;
        });

        it('should render promotions editor breadcrumbs and label for edit flow', async () => {
            Store.page.value = PAGE_NAMES.PROMOTIONS_EDITOR;
            Store.promotions.promotionId.value = 'promo-1';
            const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
            const items = [...el.querySelectorAll('.nav-breadcrumbs sp-breadcrumb-item')].map((item) =>
                item.textContent.trim(),
            );
            expect(items).to.deep.equal(['Promotions', 'Edit project']);
        });

        it('should render promotions editor breadcrumbs and label for create flow', async () => {
            Store.page.value = PAGE_NAMES.PROMOTIONS_EDITOR;
            Store.promotions.promotionId.value = null;
            const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
            const items = [...el.querySelectorAll('.nav-breadcrumbs sp-breadcrumb-item')].map((item) =>
                item.textContent.trim(),
            );
            expect(items).to.deep.equal(['Promotions', 'Create new project']);
        });

        it('should navigate to promotions page when promotions breadcrumb is clicked', async () => {
            Store.page.value = PAGE_NAMES.PROMOTIONS_EDITOR;
            Store.promotions.promotionId.value = 'promo-1';
            const navigateStub = sandbox.stub(router, 'navigateToPage').returns(() => {});
            const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
            const firstBreadcrumb = el.querySelector('.nav-breadcrumbs sp-breadcrumb-item');

            firstBreadcrumb.click();
            expect(navigateStub.calledWith(PAGE_NAMES.PROMOTIONS)).to.be.true;
        });

        it('should render translation editor breadcrumbs and readonly label', async () => {
            Store.page.value = PAGE_NAMES.TRANSLATION_EDITOR;
            Store.translationProjects.translationProjectId.value = 'project-1';
            Store.translationProjects.inEdit.value = {
                get: () => ({
                    getFieldValue: (fieldName) => (fieldName === 'submissionDate' ? '2026-02-20T00:00:00Z' : null),
                }),
            };
            const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
            const items = [...el.querySelectorAll('.nav-breadcrumbs sp-breadcrumb-item')].map((item) =>
                item.textContent.trim(),
            );
            expect(items).to.deep.equal(['Translations', 'Translation Project']);
        });

        it('should render translation editor breadcrumbs and edit label when project has no submission date', async () => {
            Store.page.value = PAGE_NAMES.TRANSLATION_EDITOR;
            Store.translationProjects.translationProjectId.value = 'project-1';
            Store.translationProjects.inEdit.value = {
                get: () => ({
                    getFieldValue: () => null,
                }),
            };
            const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
            const items = [...el.querySelectorAll('.nav-breadcrumbs sp-breadcrumb-item')].map((item) =>
                item.textContent.trim(),
            );
            expect(items).to.deep.equal(['Translations', 'Edit project']);
        });

        it('should render translation editor breadcrumbs and create label when no project id exists', async () => {
            Store.page.value = PAGE_NAMES.TRANSLATION_EDITOR;
            Store.translationProjects.translationProjectId.value = null;
            Store.translationProjects.inEdit.value = null;
            const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
            const items = [...el.querySelectorAll('.nav-breadcrumbs sp-breadcrumb-item')].map((item) =>
                item.textContent.trim(),
            );
            expect(items).to.deep.equal(['Translations', 'Create new project']);
        });

        it('should navigate to translations page when translations breadcrumb is clicked', async () => {
            Store.page.value = PAGE_NAMES.TRANSLATION_EDITOR;
            Store.translationProjects.translationProjectId.value = 'project-1';
            const navigateStub = sandbox.stub(router, 'navigateToPage').returns(() => {});
            const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
            const firstBreadcrumb = el.querySelector('.nav-breadcrumbs sp-breadcrumb-item');

            firstBreadcrumb.click();
            expect(navigateStub.calledWith(PAGE_NAMES.TRANSLATIONS)).to.be.true;
        });

        it('should navigate to settings page when first breadcrumb is clicked', async () => {
            Store.page.value = PAGE_NAMES.SETTINGS_EDITOR;
            Store.settings.fragmentId.value = null;
            Store.settings.creating.value = true;
            const navigateStub = sandbox.stub(router, 'navigateToPage').returns(() => {});
            const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
            const firstBreadcrumb = el.querySelector('.nav-breadcrumbs sp-breadcrumb-item');
            firstBreadcrumb.click();
            expect(navigateStub.calledWith(PAGE_NAMES.SETTINGS)).to.be.true;
        });

        it('repairs hidden first breadcrumb after saving a newly created setting', async () => {
            Store.page.value = PAGE_NAMES.SETTINGS_EDITOR;
            Store.settings.fragmentId.value = null;
            Store.settings.creating.value = true;
            const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
            const firstBreadcrumb = el.querySelector('.nav-breadcrumbs sp-breadcrumb-item');
            expect(firstBreadcrumb).to.exist;
            firstBreadcrumb.setAttribute('hidden', '');

            Store.settings.fragmentId.set('setting-1');
            Store.settings.creating.set(false);
            expect(Store.settings.fragmentId.get()).to.equal('setting-1');
            expect(Store.settings.creating.get()).to.equal(false);
            await el.updateComplete;
            await delay(0);
            await el.updateComplete;
            await delay(0);

            const repairedBreadcrumbs = [...el.querySelectorAll('.nav-breadcrumbs sp-breadcrumb-item')];
            const repairedFirstBreadcrumb = repairedBreadcrumbs[0];
            expect(repairedFirstBreadcrumb.hasAttribute('hidden')).to.equal(false);
            expect(repairedBreadcrumbs.map((item) => item.textContent.trim())).to.deep.equal(['Settings', 'Edit setting']);
        });

        it('should not render breadcrumbs on content page', async () => {
            Store.page.value = PAGE_NAMES.CONTENT;
            const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
            const breadcrumbs = el.querySelector('.nav-breadcrumbs');
            expect(breadcrumbs).to.not.exist;
        });
    });

    describe('history navigation visuals', () => {
        it('should render history navigation buttons with forward disabled', async () => {
            const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
            const buttons = el.querySelectorAll('.history-navigation .history-nav-button');
            expect(buttons.length).to.equal(2);
            expect(buttons[0].hasAttribute('disabled')).to.be.false;
            expect(buttons[1].hasAttribute('disabled')).to.be.true;
        });
    });

    describe('picker disabled states', () => {
        it('should disable folder picker on fragment editor page', async () => {
            Store.page.value = PAGE_NAMES.FRAGMENT_EDITOR;
            const el = await fixture(html`<mas-top-nav show-pickers></mas-top-nav>`);
            await el.updateComplete;
            const folderPicker = el.querySelector('mas-nav-folder-picker');
            expect(folderPicker).to.exist;
            expect(folderPicker.hasAttribute('disabled')).to.be.true;
        });

        it('should disable folder picker on translation editor page', async () => {
            Store.page.value = PAGE_NAMES.TRANSLATION_EDITOR;
            const el = await fixture(html`<mas-top-nav show-pickers></mas-top-nav>`);
            await el.updateComplete;
            const folderPicker = el.querySelector('mas-nav-folder-picker');
            expect(folderPicker).to.exist;
            expect(folderPicker.hasAttribute('disabled')).to.be.true;
        });

        it('should not disable folder picker on content page', async () => {
            Store.page.value = PAGE_NAMES.CONTENT;
            const el = await fixture(html`<mas-top-nav show-pickers></mas-top-nav>`);
            await el.updateComplete;
            const folderPicker = el.querySelector('mas-nav-folder-picker');
            expect(folderPicker).to.exist;
            expect(folderPicker.hasAttribute('disabled')).to.be.false;
        });

        it('should enable locale picker on fragment editor page', async () => {
            Store.page.value = PAGE_NAMES.FRAGMENT_EDITOR;
            const el = await fixture(html`<mas-top-nav show-pickers></mas-top-nav>`);
            await el.updateComplete;
            const localePicker = el.querySelector('mas-locale-picker');
            expect(localePicker).to.exist;
            expect(localePicker.hasAttribute('disabled')).to.be.false;
        });

        it('should disable locale picker on translation editor page', async () => {
            Store.page.value = PAGE_NAMES.TRANSLATION_EDITOR;
            const el = await fixture(html`<mas-top-nav show-pickers></mas-top-nav>`);
            await el.updateComplete;
            const localePicker = el.querySelector('mas-locale-picker');
            expect(localePicker).to.exist;
            expect(localePicker.hasAttribute('disabled')).to.be.true;
        });

        it('should disable locale picker on translations page', async () => {
            Store.page.value = PAGE_NAMES.TRANSLATIONS;
            const el = await fixture(html`<mas-top-nav show-pickers></mas-top-nav>`);
            await el.updateComplete;
            const localePicker = el.querySelector('mas-locale-picker');
            expect(localePicker).to.exist;
            expect(localePicker.hasAttribute('disabled')).to.be.true;
        });

        it('should not disable locale picker on content page', async () => {
            Store.page.value = PAGE_NAMES.CONTENT;
            const el = await fixture(html`<mas-top-nav show-pickers></mas-top-nav>`);
            await el.updateComplete;
            const localePicker = el.querySelector('mas-locale-picker');
            expect(localePicker).to.exist;
            expect(localePicker.hasAttribute('disabled')).to.be.false;
        });
    });

    describe('shouldShowPickers getter', () => {
        it('should return true when showPickers is true', async () => {
            const el = await fixture(html`<mas-top-nav show-pickers></mas-top-nav>`);
            expect(el.shouldShowPickers).to.be.true;
        });

        it('should return false when showPickers is false', async () => {
            const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
            el.showPickers = false;
            expect(el.shouldShowPickers).to.be.false;
        });
    });

    describe('isDraftLandscape getter', () => {
        it('should return true when landscape is draft', async () => {
            Store.landscape.value = WCS_LANDSCAPE_DRAFT;
            const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
            expect(el.isDraftLandscape).to.be.true;
        });

        it('should return false when landscape is published', async () => {
            Store.landscape.value = WCS_LANDSCAPE_PUBLISHED;
            const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
            expect(el.isDraftLandscape).to.be.false;
        });
    });

    describe('locale picker region awareness', () => {
        it('should pass Store.localeOrRegion() to locale picker', async () => {
            Store.page.value = PAGE_NAMES.CONTENT;
            Store.search.set((prev) => ({ ...prev, region: null }));
            Store.filters.set((prev) => ({ ...prev, locale: 'en_US' }));

            const el = await fixture(html`<mas-top-nav show-pickers></mas-top-nav>`);
            await el.updateComplete;
            const localePicker = el.querySelector('mas-locale-picker');
            expect(localePicker.getAttribute('locale')).to.equal('en_US');
        });

        it('should reflect region override in locale picker when no variation is loaded', async () => {
            Store.page.value = PAGE_NAMES.FRAGMENT_EDITOR;
            Store.search.set((prev) => ({ ...prev, region: 'en_GB' }));

            const el = await fixture(html`<mas-top-nav show-pickers></mas-top-nav>`);
            await el.updateComplete;
            const localePicker = el.querySelector('mas-locale-picker');
            expect(localePicker.getAttribute('locale')).to.equal('en_GB');
        });

        it('should show parent locale when viewing a variation fragment', async () => {
            const variationFragment = { id: 'variation-id' };
            Store.page.value = PAGE_NAMES.FRAGMENT_EDITOR;
            Store.search.set((prev) => ({ ...prev, region: 'en_IN' }));
            Store.fragments.inEdit.value = { get: () => variationFragment };

            const editorContext = Store.fragmentEditor.editorContext;
            editorContext.isVariationByPath = true;
            editorContext.localeDefaultFragment = { path: '/content/dam/mas/sandbox/en_GB/card' };

            const el = await fixture(html`<mas-top-nav show-pickers></mas-top-nav>`);
            await el.updateComplete;
            const localePicker = el.querySelector('mas-locale-picker');
            expect(localePicker.getAttribute('locale')).to.equal('en_GB');

            editorContext.isVariationByPath = false;
            editorContext.localeDefaultFragment = null;
        });
    });

    describe('onLocaleChanged', () => {
        it('should update filters locale on content page', async () => {
            Store.page.value = PAGE_NAMES.CONTENT;
            const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
            const filtersSetSpy = sandbox.spy(Store.filters, 'set');

            await el.onLocaleChanged({ detail: { locale: 'de_DE' } });

            expect(filtersSetSpy.calledOnce).to.be.true;
            const updateFn = filtersSetSpy.firstCall.args[0];
            expect(updateFn({ locale: 'en_US' })).to.deep.equal({ locale: 'de_DE' });
        });

        it('should handle locale change in fragment editor with same fragmentId', async () => {
            const currentFragment = { id: 'test-id' };
            Store.page.value = PAGE_NAMES.FRAGMENT_EDITOR;

            // Bypass structuredClone by setting value directly
            Store.fragments.inEdit.value = { get: () => currentFragment };

            const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
            const searchSetSpy = sandbox.spy(Store.search, 'set');
            const filtersSetSpy = sandbox.spy(Store.filters, 'set');

            await el.onLocaleChanged({ detail: { locale: 'fr_FR', fragmentId: 'test-id' } });

            expect(searchSetSpy.calledOnce).to.be.true;
            expect(searchSetSpy.firstCall.args[0]({ region: 'en_US' })).to.deep.equal({ region: null });
            expect(filtersSetSpy.calledOnce).to.be.true;
            expect(filtersSetSpy.firstCall.args[0]({ locale: 'en_US' })).to.deep.equal({ locale: 'fr_FR' });
        });

        it('should handle locale change in fragment editor with different fragmentId and no changes', async () => {
            const currentFragment = { id: 'test-id', hasChanges: false };
            Store.page.value = PAGE_NAMES.FRAGMENT_EDITOR;
            Store.fragments.inEdit.value = { get: () => currentFragment };

            const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
            const searchSetSpy = sandbox.spy(Store.search, 'set');
            const navigateSpy = sandbox.stub(router, 'navigateToFragmentEditor');

            await el.onLocaleChanged({ detail: { locale: 'fr_FR', fragmentId: 'other-id' } });

            expect(searchSetSpy.calledOnce).to.be.true;
            expect(navigateSpy.calledWith('other-id')).to.be.true;
        });

        it('should handle locale change in fragment editor with different fragmentId and unsaved changes (confirmed)', async () => {
            const currentFragment = { id: 'test-id', hasChanges: true };
            Store.page.value = PAGE_NAMES.FRAGMENT_EDITOR;
            Store.fragments.inEdit.value = { get: () => currentFragment };

            const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
            const mockEditor = { promptDiscardChanges: sandbox.stub().resolves(true) };
            sandbox.stub(document, 'querySelector').withArgs('mas-fragment-editor').returns(mockEditor);
            const navigateSpy = sandbox.stub(router, 'navigateToFragmentEditor');

            await el.onLocaleChanged({ detail: { locale: 'fr_FR', fragmentId: 'other-id' } });

            expect(mockEditor.promptDiscardChanges.calledOnce).to.be.true;
            expect(navigateSpy.calledWith('other-id')).to.be.true;
        });

        it('should handle locale change in fragment editor with different fragmentId and unsaved changes (cancelled)', async () => {
            const currentFragment = { id: 'test-id', hasChanges: true };
            Store.page.value = PAGE_NAMES.FRAGMENT_EDITOR;
            Store.fragments.inEdit.value = { get: () => currentFragment };

            const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
            const mockEditor = { promptDiscardChanges: sandbox.stub().resolves(false) };
            sandbox.stub(document, 'querySelector').withArgs('mas-fragment-editor').returns(mockEditor);
            const navigateSpy = sandbox.stub(router, 'navigateToFragmentEditor');
            const requestUpdateSpy = sandbox.spy(el, 'requestUpdate');

            await el.onLocaleChanged({ detail: { locale: 'fr_FR', fragmentId: 'other-id' } });

            expect(mockEditor.promptDiscardChanges.calledOnce).to.be.true;
            expect(navigateSpy.called).to.be.false;
            expect(requestUpdateSpy.calledOnce).to.be.true;
        });

        it('should handle locale change in fragment editor when no fragmentId provided (missing variation, with en_US translation)', async () => {
            const currentFragment = { id: 'test-id' };
            Store.page.value = PAGE_NAMES.FRAGMENT_EDITOR;
            Store.fragments.inEdit.value = { get: () => currentFragment };
            Store.fragmentEditor.translatedLocales.set([{ locale: 'en_US', id: 'en-us-id' }]);

            const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
            const navigateSpy = sandbox.stub(router, 'navigateToFragmentEditor');

            await el.onLocaleChanged({ detail: { locale: 'tr_TR', fragmentId: null } });

            expect(navigateSpy.calledWith('en-us-id')).to.be.true;
            expect(Store.search.value.region).to.equal('tr_TR');
        });

        it('should handle locale change in fragment editor when no fragmentId provided (missing variation, no en_US translation)', async () => {
            const currentFragment = { id: 'test-id' };
            Store.page.value = PAGE_NAMES.FRAGMENT_EDITOR;
            Store.fragments.inEdit.value = { get: () => currentFragment };
            Store.fragmentEditor.translatedLocales.set([]); // No en_US

            const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
            const navigateSpy = sandbox.stub(router, 'navigateToFragmentEditor');

            await el.onLocaleChanged({ detail: { locale: 'tr_TR', fragmentId: null } });

            expect(navigateSpy.calledWith('test-id')).to.be.true;
            expect(Store.search.value.region).to.equal('tr_TR');
        });
    });

    describe('environmentIndicator', () => {
        it('should return nothing for prod', async () => {
            const el = await fixture(html`<mas-top-nav aem-env="prod"></mas-top-nav>`);
            expect(el.environmentIndicator).to.deep.equal(html``);
        });

        it('should return badge for non-prod', async () => {
            const el = await fixture(html`<mas-top-nav aem-env="stage"></mas-top-nav>`);
            const badge = el.environmentIndicator;
            expect(badge).to.not.be.null;
        });
    });

    describe('profileBuilder', () => {
        it('should fetch profile once across rerenders', async () => {
            const getProfileSpy = sandbox.spy(window.adobeIMS, 'getProfile');
            const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
            await delay(200);

            expect(window.fetch.calledOnce).to.be.true;
            expect(getProfileSpy.calledOnce).to.be.true;

            el.requestUpdate();
            await el.updateComplete;
            await delay(50);

            expect(window.fetch.calledOnce).to.be.true;
            expect(getProfileSpy.calledOnce).to.be.true;
        });

        it('should refetch profile when aem-env changes', async () => {
            const el = await fixture(html`<mas-top-nav aem-env="prod"></mas-top-nav>`);
            await delay(200);
            expect(window.fetch.calledOnce).to.be.true;

            el.aemEnv = 'stage';
            await el.updateComplete;
            await delay(200);

            expect(window.fetch.calledTwice).to.be.true;
        });

        it('should toggle profile menu on click', async () => {
            const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
            // Wait for profile to be built (it's async via until)
            await delay(200);

            const profileButton = el.querySelector('.profile-button');
            const profileBody = el.querySelector('.profile-body');

            expect(profileBody.classList.contains('show')).to.be.false;
            profileButton.click();
            expect(profileBody.classList.contains('show')).to.be.true;
            profileButton.click();
            expect(profileBody.classList.contains('show')).to.be.false;
        });

        it('should close profile menu on studio content click', async () => {
            const studioContent = document.createElement('div');
            studioContent.classList.add('studio-content');
            document.body.appendChild(studioContent);

            const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
            await delay(200);

            const profileButton = el.querySelector('.profile-button');
            const profileBody = el.querySelector('.profile-body');

            profileButton.click();
            expect(profileBody.classList.contains('show')).to.be.true;

            studioContent.click();
            expect(profileBody.classList.contains('show')).to.be.false;

            studioContent.remove();
        });

        it('should call signOut on signout link click', async () => {
            const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
            await delay(200);

            const signOutLink = el.querySelector('.signout-link');
            signOutLink.click();

            expect(window.adobeIMS.signOut.calledOnce).to.be.true;
        });

        it('should show error message on fetch failure', async () => {
            window.fetch.restore();
            sandbox.stub(window, 'fetch').rejects(new Error('Fetch failed'));

            const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
            await delay(200);

            expect(el.textContent).to.contain('Profile unavailable');
        });
    });

    describe('landscape switch', () => {
        it('should render landscape switch when pickers are shown', async () => {
            const el = await fixture(html`<mas-top-nav show-pickers></mas-top-nav>`);
            await el.updateComplete;
            const landscapeSwitch = el.querySelector('sp-switch.landscape-switch');
            expect(landscapeSwitch).to.exist;
        });

        it('should not render landscape switch when pickers are hidden', async () => {
            const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
            el.showPickers = false;
            await el.updateComplete;
            const landscapeSwitch = el.querySelector('sp-switch.landscape-switch');
            expect(landscapeSwitch).to.not.exist;
        });

        it('should be checked when landscape is draft', async () => {
            Store.landscape.value = WCS_LANDSCAPE_DRAFT;
            const el = await fixture(html`<mas-top-nav show-pickers></mas-top-nav>`);
            await el.updateComplete;
            const landscapeSwitch = el.querySelector('sp-switch.landscape-switch');
            expect(landscapeSwitch.checked).to.be.true;
        });

        it('should be unchecked when landscape is published', async () => {
            Store.landscape.value = WCS_LANDSCAPE_PUBLISHED;
            const el = await fixture(html`<mas-top-nav show-pickers></mas-top-nav>`);
            await el.updateComplete;
            const landscapeSwitch = el.querySelector('sp-switch.landscape-switch');
            expect(landscapeSwitch.checked).to.be.false;
        });

        it('should set landscape to DRAFT when switch is checked', async () => {
            Store.landscape.value = WCS_LANDSCAPE_PUBLISHED;
            const el = await fixture(html`<mas-top-nav show-pickers></mas-top-nav>`);
            await el.updateComplete;
            const landscapeSwitch = el.querySelector('sp-switch.landscape-switch');

            landscapeSwitch.checked = true;
            landscapeSwitch.dispatchEvent(new Event('change'));

            expect(Store.landscape.value).to.equal(WCS_LANDSCAPE_DRAFT);
        });

        it('should set landscape to PUBLISHED when switch is unchecked', async () => {
            Store.landscape.value = WCS_LANDSCAPE_DRAFT;
            const el = await fixture(html`<mas-top-nav show-pickers></mas-top-nav>`);
            await el.updateComplete;
            const landscapeSwitch = el.querySelector('sp-switch.landscape-switch');

            landscapeSwitch.checked = false;
            landscapeSwitch.dispatchEvent(new Event('change'));

            expect(Store.landscape.value).to.equal(WCS_LANDSCAPE_PUBLISHED);
        });
    });
});
