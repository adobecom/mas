import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, oneEvent } from '@open-wc/testing-helpers/pure';
import '../src/swc.js';
import '../src/mas-mnemonic-modal.js';
import { ADOBE_PRODUCTS } from '../src/constants/adobe-products.js';
import { spTheme } from './utils.js';

describe('MAS Mnemonic Modal', () => {
    it('should not dispatch save when icon, alt, and link are all empty', async () => {
        const el = await fixture(html`<mas-mnemonic-modal open></mas-mnemonic-modal>`, { parentNode: spTheme() });

        el.selectedTab = 'product-icon';
        el.selectedProductId = null;
        el.alt = '';
        el.link = '';
        await el.updateComplete;

        let saveFired = false;
        el.addEventListener('save', () => {
            saveFired = true;
        });

        el.shadowRoot.querySelector('sp-button[variant="accent"]').click();
        await el.updateComplete;

        expect(saveFired).to.be.false;
    });

    it('should dispatch save when icon is empty but plain-text alt has content', async () => {
        const el = await fixture(html`<mas-mnemonic-modal open></mas-mnemonic-modal>`, { parentNode: spTheme() });

        el.selectedTab = 'product-icon';
        el.selectedProductId = null;
        el.alt = 'Creative Cloud All Apps';
        el.link = '';
        await el.updateComplete;

        const listener = oneEvent(el, 'save');
        el.shadowRoot.querySelector('sp-button[variant="accent"]').click();
        const event = await listener;

        expect(event.detail.icon).to.equal('');
        expect(event.detail.alt).to.equal('Creative Cloud All Apps');
        expect(event.detail.link).to.equal('');
        expect(el.open).to.be.false;
    });

    it('should dispatch save when icon and alt are empty but link is set', async () => {
        const el = await fixture(html`<mas-mnemonic-modal open></mas-mnemonic-modal>`, { parentNode: spTheme() });

        el.selectedTab = 'product-icon';
        el.selectedProductId = null;
        el.alt = '';
        el.link = 'https://www.adobe.com/creativecloud/plans.html';
        await el.updateComplete;

        const listener = oneEvent(el, 'save');
        el.shadowRoot.querySelector('sp-button[variant="accent"]').click();
        const event = await listener;

        expect(event.detail.icon).to.equal('');
        expect(event.detail.link).to.equal('https://www.adobe.com/creativecloud/plans.html');
        expect(el.open).to.be.false;
    });

    it('should dispatch save with product icon when a product is selected', async () => {
        const el = await fixture(html`<mas-mnemonic-modal open></mas-mnemonic-modal>`, { parentNode: spTheme() });

        el.selectedTab = 'product-icon';
        el.selectedProductId = ADOBE_PRODUCTS[0].id;
        await el.updateComplete;

        const listener = oneEvent(el, 'save');
        el.shadowRoot.querySelector('sp-button[variant="accent"]').click();
        const event = await listener;

        expect(event.detail.icon).to.include(ADOBE_PRODUCTS[0].id);
        expect(event.detail.icon).to.include('.svg');
    });
});
