import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, fixtureCleanup } from '@open-wc/testing-helpers/pure';
import sinon from 'sinon';
import Store from '../src/store.js';
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

    describe('folder menu items', () => {
        it('should render all folders without disabled attribute', async () => {
            const el = await fixture(html`<mas-nav-folder-picker></mas-nav-folder-picker>`);
            await el.updateComplete;
            const menuItems = el.shadowRoot.querySelectorAll('sp-menu-item');
            Array.from(menuItems).forEach((item) => {
                expect(item.hasAttribute('disabled')).to.be.false;
            });
        });
    });

    describe('handleSelection', () => {
        it('should update search path on selection', async () => {
            Store.page.value = 'content';
            const el = await fixture(html`<mas-nav-folder-picker></mas-nav-folder-picker>`);
            el.handleSelection('express');
            expect(Store.search.get().path).to.equal('express');
        });

        it('should clear fragments list on selection', async () => {
            Store.page.value = 'content';
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
