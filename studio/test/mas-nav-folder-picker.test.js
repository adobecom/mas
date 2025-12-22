import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, fixtureCleanup } from '@open-wc/testing-helpers/pure';
import sinon from 'sinon';
import Store from '../src/store.js';
import { PAGE_NAMES } from '../src/constants.js';
import '../src/swc.js';
import '../src/mas-nav-folder-picker.js';

describe('MasNavFolderPicker', () => {
    let sandbox;
    let originalPageValue;
    let originalSearchValue;
    let originalFoldersValue;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        originalPageValue = Store.page.value;
        originalSearchValue = Store.search.get();
        originalFoldersValue = Store.folders.data.get();
        Store.folders.data.set(['acom', 'ccd', 'adobe-home', 'express', 'sandbox', 'commerce', 'docs', 'nala']);
        Store.search.set({ path: 'acom' });
    });

    afterEach(() => {
        fixtureCleanup();
        sandbox.restore();
        Store.page.value = originalPageValue;
        Store.search.set(originalSearchValue);
        Store.folders.data.set(originalFoldersValue);
    });

    describe('disabling folders', () => {
        it('should initialize with empty disabledFolders set', async () => {
            Store.page.value = PAGE_NAMES.CONTENT;
            const el = await fixture(html`<mas-nav-folder-picker></mas-nav-folder-picker>`);
            expect(el.disabledFolders).to.be.instanceOf(Set);
            expect(el.disabledFolders.size).to.equal(0);
        });

        it('should disable specific folders when on Translations page, and enable all folders when switching to another page', async () => {
            const el = await fixture(html`<mas-nav-folder-picker></mas-nav-folder-picker>`);
            el.updateDisabledFolders(PAGE_NAMES.TRANSLATIONS);
            expect(el.disabledFolders.has('adobe-home')).to.be.true;
            expect(el.disabledFolders.has('ccd')).to.be.true;
            expect(el.disabledFolders.has('commerce')).to.be.true;
            expect(el.disabledFolders.has('docs')).to.be.true;
            expect(el.disabledFolders.has('nala')).to.be.true;
            expect(el.disabledFolders.has('sandbox')).to.be.false;
            expect(el.disabledFolders.has('acom')).to.be.false;
            expect(el.disabledFolders.has('express')).to.be.false;
            el.updateDisabledFolders(PAGE_NAMES.CONTENT);
            expect(el.disabledFolders.size).to.equal(0);
        });

        it('should render menu items with disabled attribute for disabled folders', async () => {
            Store.page.value = PAGE_NAMES.TRANSLATIONS;
            const el = await fixture(html`<mas-nav-folder-picker></mas-nav-folder-picker>`);
            await el.updateComplete;
            const menuItems = el.shadowRoot.querySelectorAll('sp-menu-item');
            const ccdItem = Array.from(menuItems).find((item) => item.value === 'ccd');
            const adobeHomeItem = Array.from(menuItems).find((item) => item.value === 'adobe-home');
            const commerceItem = Array.from(menuItems).find((item) => item.value === 'commerce');
            const docsItem = Array.from(menuItems).find((item) => item.value === 'docs');
            const nalaItem = Array.from(menuItems).find((item) => item.value === 'nala');
            expect(ccdItem.hasAttribute('disabled')).to.be.true;
            expect(adobeHomeItem.hasAttribute('disabled')).to.be.true;
            expect(commerceItem.hasAttribute('disabled')).to.be.true;
            expect(docsItem.hasAttribute('disabled')).to.be.true;
            expect(nalaItem.hasAttribute('disabled')).to.be.true;
        });

        it('should render menu items without disabled attribute for allowed folders', async () => {
            Store.page.value = PAGE_NAMES.TRANSLATIONS;
            const el = await fixture(html`<mas-nav-folder-picker></mas-nav-folder-picker>`);
            await el.updateComplete;
            const menuItems = el.shadowRoot.querySelectorAll('sp-menu-item');
            const acomItem = Array.from(menuItems).find((item) => item.value === 'acom');
            const expressItem = Array.from(menuItems).find((item) => item.value === 'express');
            const sandboxItem = Array.from(menuItems).find((item) => item.value === 'sandbox');
            expect(acomItem.hasAttribute('disabled')).to.be.false;
            expect(expressItem.hasAttribute('disabled')).to.be.false;
            expect(sandboxItem.hasAttribute('disabled')).to.be.false;
        });
    });

    describe('handleSelection', () => {
        it('should update search path on selection', async () => {
            Store.page.value = PAGE_NAMES.CONTENT;
            const el = await fixture(html`<mas-nav-folder-picker></mas-nav-folder-picker>`);
            el.handleSelection('express');
            expect(Store.search.get().path).to.equal('express');
        });

        it('should clear fragments list on selection', async () => {
            Store.page.value = PAGE_NAMES.CONTENT;
            Store.fragments.list.data.set([{ id: 'test' }]);
            const el = await fixture(html`<mas-nav-folder-picker></mas-nav-folder-picker>`);
            el.handleSelection('express');
            expect(Store.fragments.list.data.get()).to.deep.equal([]);
        });
    });

    describe('formatFolderName', () => {
        it('should convert folder name to uppercase', async () => {
            const el = await fixture(html`<mas-nav-folder-picker></mas-nav-folder-picker>`);
            expect(el.formatFolderName('acom')).to.equal('ACOM');
            expect(el.formatFolderName('express')).to.equal('EXPRESS');
            expect(el.formatFolderName('adobe-home')).to.equal('ADOBE-HOME');
        });
    });

    describe('disabled attribute', () => {
        it('should pass disabled attribute to action menu', async () => {
            const el = await fixture(html`<mas-nav-folder-picker disabled></mas-nav-folder-picker>`);
            await el.updateComplete;
            const actionMenu = el.shadowRoot.querySelector('sp-action-menu');
            expect(actionMenu.hasAttribute('disabled')).to.be.true;
        });

        it('should not have disabled attribute when not set', async () => {
            const el = await fixture(html`<mas-nav-folder-picker></mas-nav-folder-picker>`);
            await el.updateComplete;
            const actionMenu = el.shadowRoot.querySelector('sp-action-menu');
            expect(actionMenu.hasAttribute('disabled')).to.be.false;
        });
    });
});
