import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, fixtureCleanup } from '@open-wc/testing-helpers/pure';
import sinon from 'sinon';
import Store from '../src/store.js';
import { PAGE_NAMES, WCS_LANDSCAPE_DRAFT, WCS_LANDSCAPE_PUBLISHED } from '../src/constants.js';
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

        it('should disable locale picker on fragment editor page', async () => {
            Store.page.value = PAGE_NAMES.FRAGMENT_EDITOR;
            const el = await fixture(html`<mas-top-nav show-pickers></mas-top-nav>`);
            await el.updateComplete;
            const localePicker = el.querySelector('mas-nav-locale-picker');
            expect(localePicker).to.exist;
            expect(localePicker.hasAttribute('disabled')).to.be.true;
        });

        it('should disable locale picker on translation editor page', async () => {
            Store.page.value = PAGE_NAMES.TRANSLATION_EDITOR;
            const el = await fixture(html`<mas-top-nav show-pickers></mas-top-nav>`);
            await el.updateComplete;
            const localePicker = el.querySelector('mas-nav-locale-picker');
            expect(localePicker).to.exist;
            expect(localePicker.hasAttribute('disabled')).to.be.true;
        });

        it('should disable locale picker on translations page', async () => {
            Store.page.value = PAGE_NAMES.TRANSLATIONS;
            const el = await fixture(html`<mas-top-nav show-pickers></mas-top-nav>`);
            await el.updateComplete;
            const localePicker = el.querySelector('mas-nav-locale-picker');
            expect(localePicker).to.exist;
            expect(localePicker.hasAttribute('disabled')).to.be.true;
        });

        it('should not disable locale picker on content page', async () => {
            Store.page.value = PAGE_NAMES.CONTENT;
            const el = await fixture(html`<mas-top-nav show-pickers></mas-top-nav>`);
            await el.updateComplete;
            const localePicker = el.querySelector('mas-nav-locale-picker');
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

    describe('default properties', () => {
        it('should have aemEnv default to prod', async () => {
            const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
            expect(el.aemEnv).to.equal('prod');
        });

        it('should have showPickers default to true', async () => {
            const el = await fixture(html`<mas-top-nav></mas-top-nav>`);
            expect(el.showPickers).to.be.true;
        });
    });
});
