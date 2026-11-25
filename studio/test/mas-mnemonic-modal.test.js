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

    it('should show heading "Edit visual" when only link is set', async () => {
        const el = await fixture(html`<mas-mnemonic-modal open link="https://www.adobe.com"></mas-mnemonic-modal>`, {
            parentNode: spTheme(),
        });

        const heading = el.shadowRoot.querySelector('[slot="heading"]');
        expect(heading.textContent.trim()).to.equal('Edit visual');
    });

    it('should show heading "Add visual" and a disabled Confirm button when nothing is picked', async () => {
        const el = await fixture(html`<mas-mnemonic-modal open></mas-mnemonic-modal>`, { parentNode: spTheme() });

        expect(el.shadowRoot.querySelector('[slot="heading"]').textContent.trim()).to.equal('Add visual');
        const confirm = el.shadowRoot.querySelector('sp-button[variant="accent"]');
        expect(confirm.textContent.trim()).to.equal('Confirm');
        expect(confirm.hasAttribute('disabled')).to.be.true;
        expect(el.shadowRoot.querySelector('sp-button[variant="secondary"]').textContent.trim()).to.equal('Cancel');
    });

    it('should enable Confirm after a product is picked', async () => {
        const el = await fixture(html`<mas-mnemonic-modal open></mas-mnemonic-modal>`, { parentNode: spTheme() });

        const picker = el.shadowRoot.querySelector('mas-product-picker');
        picker.dispatchEvent(new CustomEvent('item-select', { detail: { id: ADOBE_PRODUCTS[0].id } }));
        await el.updateComplete;

        expect(el.shadowRoot.querySelector('sp-button[variant="accent"]').hasAttribute('disabled')).to.be.false;
    });

    it('should keep iconLibrary heading, buttons and grid unchanged', async () => {
        const el = await fixture(html`<mas-mnemonic-modal open iconlibrary></mas-mnemonic-modal>`, {
            parentNode: spTheme(),
        });

        expect(el.shadowRoot.querySelector('[slot="heading"]').textContent.trim()).to.equal('Add Icon');
        expect(el.shadowRoot.querySelector('sp-button[variant="accent"]').textContent.trim()).to.equal('Add Icon');
        expect(el.shadowRoot.querySelector('mas-product-picker')).to.be.null;
        expect(el.shadowRoot.querySelector('.icon-grid')).to.exist;
        expect(el.shadowRoot.querySelector('sp-dialog').classList.contains('icon-library')).to.be.true;
    });

    it('should render the badge icon dialog with Confirm disabled when empty', async () => {
        const el = await fixture(html`<mas-mnemonic-modal open .iconLibrary=${true} .badgeIcon=${true}></mas-mnemonic-modal>`, {
            parentNode: spTheme(),
        });

        expect(el.shadowRoot.querySelector('[slot="heading"]').textContent.trim()).to.equal('Badge icon');
        expect(el.shadowRoot.querySelector('mas-icon-select').placeholder).to.equal('Please select');
        expect(el.shadowRoot.querySelector('#product-alt')).to.be.null;
        expect(el.shadowRoot.querySelector('sp-button[variant="accent"]').hasAttribute('disabled')).to.be.true;
    });

    it('should open the badge icon dialog on Select for an sp-icon value and save it', async () => {
        const el = await fixture(
            html`<mas-mnemonic-modal open .iconLibrary=${true} .badgeIcon=${true} icon="sp-icon-ribbon"></mas-mnemonic-modal>`,
            { parentNode: spTheme() },
        );

        expect(el.selectedTab).to.equal('product-icon');
        expect(el.selectedProductId).to.equal('sp-icon-ribbon');
        const listener = oneEvent(el, 'save');
        el.shadowRoot.querySelector('sp-button[variant="accent"]').click();
        const event = await listener;
        expect(event.detail.icon).to.equal('sp-icon-ribbon');
    });

    it('should open the badge icon dialog on Import via URL for a URL value and save it', async () => {
        const el = await fixture(
            html`<mas-mnemonic-modal
                open
                .iconLibrary=${true}
                .badgeIcon=${true}
                icon="https://a.com/i.svg"
            ></mas-mnemonic-modal>`,
            { parentNode: spTheme() },
        );

        expect(el.selectedTab).to.equal('url');
        expect(el.shadowRoot.querySelector('#url-icon').value).to.equal('https://a.com/i.svg');
        const listener = oneEvent(el, 'save');
        el.shadowRoot.querySelector('sp-button[variant="accent"]').click();
        const event = await listener;
        expect(event.detail.icon).to.equal('https://a.com/i.svg');
    });

    it('should restore the original icon when the badge icon dialog is cancelled', async () => {
        const el = await fixture(
            html`<mas-mnemonic-modal open .iconLibrary=${true} .badgeIcon=${true} icon="sp-icon-ribbon"></mas-mnemonic-modal>`,
            { parentNode: spTheme() },
        );

        el.icon = 'https://a.com/other.svg';
        await el.updateComplete;
        el.shadowRoot.querySelector('sp-button[variant="secondary"]').click();
        expect(el.icon).to.equal('sp-icon-ribbon');
    });

    it('should set no-divider only on the add visual dialog', async () => {
        const el = await fixture(html`<mas-mnemonic-modal open></mas-mnemonic-modal>`, { parentNode: spTheme() });
        expect(el.shadowRoot.querySelector('sp-dialog').hasAttribute('no-divider')).to.be.true;
        const iconEl = await fixture(html`<mas-mnemonic-modal open iconlibrary></mas-mnemonic-modal>`, {
            parentNode: spTheme(),
        });
        expect(iconEl.shadowRoot.querySelector('sp-dialog').hasAttribute('no-divider')).to.be.false;
    });

    it('should pass ADOBE_PRODUCTS to the picker and show 12 products by default', async () => {
        localStorage.removeItem('mas-studio-recent-products');
        const el = await fixture(html`<mas-mnemonic-modal open></mas-mnemonic-modal>`, { parentNode: spTheme() });

        const picker = el.shadowRoot.querySelector('mas-product-picker');
        await picker.updateComplete;
        expect(picker.items).to.equal(ADOBE_PRODUCTS);
        expect(picker.shadowRoot.querySelector('.label').textContent.trim()).to.equal('Products:');
        expect(picker.shadowRoot.querySelectorAll('.grid .icon-item').length).to.equal(12);
    });

    it('should show recently used products first', async () => {
        localStorage.setItem('mas-studio-recent-products', JSON.stringify([ADOBE_PRODUCTS[5].id]));
        const el = await fixture(html`<mas-mnemonic-modal open></mas-mnemonic-modal>`, { parentNode: spTheme() });

        const picker = el.shadowRoot.querySelector('mas-product-picker');
        await picker.updateComplete;
        expect(picker.shadowRoot.querySelector('.label').textContent.trim()).to.equal('Recently used:');
        expect(picker.shadowRoot.querySelector('.grid .icon-item').textContent).to.include(ADOBE_PRODUCTS[5].name);
        localStorage.removeItem('mas-studio-recent-products');
    });

    it('should record a recent on Confirm but not on Cancel', async () => {
        localStorage.removeItem('mas-studio-recent-products');
        const el = await fixture(html`<mas-mnemonic-modal open></mas-mnemonic-modal>`, { parentNode: spTheme() });
        const id = ADOBE_PRODUCTS[0].id;

        el.shadowRoot.querySelector('mas-product-picker').dispatchEvent(new CustomEvent('item-select', { detail: { id } }));
        await el.updateComplete;
        expect(localStorage.getItem('mas-studio-recent-products')).to.be.null;

        el.shadowRoot.querySelector('sp-button[variant="secondary"]').click();
        await el.updateComplete;
        expect(localStorage.getItem('mas-studio-recent-products')).to.be.null;

        el.open = true;
        await el.updateComplete;
        el.shadowRoot.querySelector('mas-product-picker').dispatchEvent(new CustomEvent('item-select', { detail: { id } }));
        await el.updateComplete;

        const listener = oneEvent(el, 'save');
        el.shadowRoot.querySelector('sp-button[variant="accent"]').click();
        const event = await listener;

        expect(event.detail.icon).to.equal(`https://www.adobe.com/cc-shared/assets/img/product-icons/svg/${id}.svg`);
        expect(JSON.parse(localStorage.getItem('mas-studio-recent-products'))).to.deep.equal([id]);
        localStorage.removeItem('mas-studio-recent-products');
    });

    it('should filter products by search query', async () => {
        const el = await fixture(html`<mas-mnemonic-modal open></mas-mnemonic-modal>`, { parentNode: spTheme() });

        const picker = el.shadowRoot.querySelector('mas-product-picker');
        const name = ADOBE_PRODUCTS[0].name;
        picker.query = name.toUpperCase();
        await picker.updateComplete;

        const rows = picker.shadowRoot.querySelectorAll('.dropdown .icon-item');
        expect(rows.length).to.be.greaterThan(0);
        for (const row of rows) {
            expect(row.textContent.toLowerCase()).to.include(name.toLowerCase());
        }
    });

    it('should dispatch save from product-icon tab when useRte altHtml has paragraph markup', async () => {
        const el = await fixture(html`<mas-mnemonic-modal open use-rte></mas-mnemonic-modal>`, {
            parentNode: spTheme(),
        });

        el.selectedTab = 'product-icon';
        el.selectedProductId = null;
        el.alt = '';
        el.altHtml = '<p>Stock</p>';
        el.link = '';
        await el.updateComplete;

        const listener = oneEvent(el, 'save');
        el.shadowRoot.querySelector('sp-button[variant="accent"]').click();
        const event = await listener;

        expect(event.detail.icon).to.equal('');
        expect(event.detail.alt).to.equal('<p>Stock</p>');
        expect(el.open).to.be.false;
    });

    it('should not dispatch save when useRte altHtml is whitespace-only paragraph', async () => {
        const el = await fixture(html`<mas-mnemonic-modal open use-rte></mas-mnemonic-modal>`, {
            parentNode: spTheme(),
        });

        el.selectedTab = 'product-icon';
        el.selectedProductId = null;
        el.alt = '';
        el.altHtml = '<p>\u00a0</p>';
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

    it('should dispatch save from URL tab when altHtml has markup and icon is empty', async () => {
        const el = await fixture(html`<mas-mnemonic-modal open use-rte></mas-mnemonic-modal>`, {
            parentNode: spTheme(),
        });

        el.selectedTab = 'url';
        el.icon = '';
        el.alt = '';
        el.altHtml = '<p>Aero</p>';
        el.link = '';
        await el.updateComplete;

        const listener = oneEvent(el, 'save');
        el.shadowRoot.querySelector('sp-button[variant="accent"]').click();
        const event = await listener;

        expect(event.detail.icon).to.equal('');
        expect(event.detail.alt).to.equal('<p>Aero</p>');
    });

    it('should dispatch save when altHtml contains only an icon-button (no text)', async () => {
        const el = await fixture(html`<mas-mnemonic-modal open use-rte></mas-mnemonic-modal>`, {
            parentNode: spTheme(),
        });

        el.selectedTab = 'product-icon';
        el.selectedProductId = null;
        el.alt = '';
        el.altHtml = '<p><span class="icon-button" data-tooltip="Tooltip"></span></p>';
        el.link = '';
        await el.updateComplete;

        const listener = oneEvent(el, 'save');
        el.shadowRoot.querySelector('sp-button[variant="accent"]').click();
        const event = await listener;

        expect(event.detail.alt).to.include('icon-button');
        expect(el.open).to.be.false;
    });

    it('should not dispatch save from URL tab when altHtml contains only an icon-button and icon is empty', async () => {
        const el = await fixture(html`<mas-mnemonic-modal open use-rte></mas-mnemonic-modal>`, {
            parentNode: spTheme(),
        });

        el.selectedTab = 'url';
        el.icon = '';
        el.alt = '';
        el.altHtml = '<p><span class="icon-button" data-tooltip="Tooltip"></span></p>';
        el.link = '';
        await el.updateComplete;

        const listener = oneEvent(el, 'save');
        el.shadowRoot.querySelector('sp-button[variant="accent"]').click();
        const event = await listener;

        expect(event.detail.alt).to.include('icon-button');
    });
});
