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

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        originalPageValue = Store.page.value;
        originalLandscapeValue = Store.landscape.value;
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

    describe('currentFragmentLocale getter', () => {
        it('should return locale from current fragment in editor', async () => {
            const fragmentStore = {
                get: () => ({ path: '/content/dam/mas/s/fr_FR/f' }),
            };
            Store.page.value = PAGE_NAMES.FRAGMENT_EDITOR;
            Store.fragments.inEdit.value = fragmentStore;

            const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
            expect(el.currentFragmentLocale).to.equal('fr_FR');
        });

        it('should return null if not on fragment editor page', async () => {
            Store.page.value = PAGE_NAMES.CONTENT;
            const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
            expect(el.currentFragmentLocale).to.be.null;
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
