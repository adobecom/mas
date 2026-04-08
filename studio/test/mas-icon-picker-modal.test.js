import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, oneEvent } from '@open-wc/testing-helpers/pure';
import '../src/swc.js';
import '../src/mas-icon-picker-modal.js';
import { ADOBE_PRODUCTS } from '../src/constants/adobe-products.js';
import { ICON_LIBRARY } from '../src/constants/icon-library.js';
import { spTheme } from './utils.js';

describe('MAS Icon Picker Modal', () => {
    it('should render with default properties', async () => {
        const el = await fixture(html`<mas-icon-picker-modal></mas-icon-picker-modal>`, { parentNode: spTheme() });

        expect(el.open).to.be.false;
        expect(el.icon).to.equal('');
        expect(el.alt).to.equal('');
        expect(el.selectedTab).to.equal('icons');
        expect(el.selectedProductId).to.be.null;
    });

    it('allIcons should include Adobe products and Spectrum icons with dividers', async () => {
        const el = await fixture(html`<mas-icon-picker-modal></mas-icon-picker-modal>`, { parentNode: spTheme() });

        const allIcons = el.allIcons;
        expect(allIcons).to.be.an('array');

        const dividers = allIcons.filter((item) => item.type === 'divider');
        expect(dividers).to.have.length(2);
        expect(dividers[0].label).to.equal('Adobe Products');
        expect(dividers[1].label).to.equal('Spectrum Icons');

        const adobeIcons = allIcons.filter((item) => !item.type && !item.isSpectrum);
        expect(adobeIcons).to.have.length(ADOBE_PRODUCTS.length);

        const spectrumIcons = allIcons.filter((item) => !item.type && item.isSpectrum);
        expect(spectrumIcons).to.have.length(ICON_LIBRARY.length);
    });

    it('should initialize to icons tab with Adobe product selected when given product icon URL', async () => {
        const el = await fixture(
            html`<mas-icon-picker-modal
                icon="https://www.adobe.com/cc-shared/assets/img/product-icons/svg/photoshop.svg"
            ></mas-icon-picker-modal>`,
            { parentNode: spTheme() },
        );

        expect(el.selectedTab).to.equal('icons');
        expect(el.selectedProductId).to.equal('photoshop');
        expect(el._isSpectrum).to.be.false;
    });

    it('should initialize to icons tab with spectrum icon selected when given sp-icon prefix', async () => {
        const el = await fixture(html`<mas-icon-picker-modal icon="sp-icon-star"></mas-icon-picker-modal>`, {
            parentNode: spTheme(),
        });

        expect(el.selectedTab).to.equal('icons');
        expect(el.selectedProductId).to.equal('sp-icon-star');
        expect(el._isSpectrum).to.be.true;
    });

    it('should switch to URL tab when given an unrecognized icon URL', async () => {
        const el = await fixture(
            html`<mas-icon-picker-modal icon="https://example.com/custom-icon.svg"></mas-icon-picker-modal>`,
            { parentNode: spTheme() },
        );

        expect(el.selectedTab).to.equal('url');
        expect(el.selectedProductId).to.be.null;
    });

    it('should reset to default state when icon is empty', async () => {
        const el = await fixture(html`<mas-icon-picker-modal icon=""></mas-icon-picker-modal>`, {
            parentNode: spTheme(),
        });

        expect(el.selectedProductId).to.be.null;
        expect(el._isSpectrum).to.be.false;
        expect(el.selectedTab).to.equal('icons');
    });

    it('should store original values when opened', async () => {
        const el = await fixture(
            html`<mas-icon-picker-modal
                icon="https://www.adobe.com/cc-shared/assets/img/product-icons/svg/photoshop.svg"
                alt="Photoshop"
            ></mas-icon-picker-modal>`,
            { parentNode: spTheme() },
        );

        el.open = true;
        await el.updateComplete;

        // Mutate values
        el.alt = 'Changed';

        // Cancel should restore original values
        const listener = oneEvent(el, 'modal-close');
        el.shadowRoot.querySelector('sp-button[variant="secondary"]').click();
        await listener;

        expect(el.alt).to.equal('Photoshop');
    });

    it('should dispatch modal-close event on cancel', async () => {
        const el = await fixture(html`<mas-icon-picker-modal open></mas-icon-picker-modal>`, { parentNode: spTheme() });

        const listener = oneEvent(el, 'modal-close');
        el.shadowRoot.querySelector('sp-button[variant="secondary"]').click();
        const event = await listener;

        expect(event).to.exist;
        expect(el.open).to.be.false;
    });

    it('should dispatch save event with Adobe product icon on submit from icons tab', async () => {
        const el = await fixture(html`<mas-icon-picker-modal open></mas-icon-picker-modal>`, { parentNode: spTheme() });

        el.selectedTab = 'icons';
        el.selectedProductId = 'photoshop';
        el._isSpectrum = false;
        el.alt = 'Photoshop';
        await el.updateComplete;

        const listener = oneEvent(el, 'save');
        el.shadowRoot.querySelector('sp-button[variant="accent"]').click();
        const event = await listener;

        expect(event.detail.icon).to.equal('https://www.adobe.com/cc-shared/assets/img/product-icons/svg/photoshop.svg');
        expect(event.detail.alt).to.equal('Photoshop');
        expect(event.detail.link).to.equal('');
        expect(el.open).to.be.false;
    });

    it('should dispatch save event with spectrum icon id on submit from icons tab', async () => {
        const el = await fixture(html`<mas-icon-picker-modal open></mas-icon-picker-modal>`, { parentNode: spTheme() });

        el.selectedTab = 'icons';
        el.selectedProductId = 'sp-icon-star';
        el._isSpectrum = true;
        await el.updateComplete;

        const listener = oneEvent(el, 'save');
        el.shadowRoot.querySelector('sp-button[variant="accent"]').click();
        const event = await listener;

        expect(event.detail.icon).to.equal('sp-icon-star');
    });

    it('should dispatch save event with URL value when on URL tab', async () => {
        const el = await fixture(
            html`<mas-icon-picker-modal open icon="https://example.com/custom.svg"></mas-icon-picker-modal>`,
            { parentNode: spTheme() },
        );

        el.selectedTab = 'url';
        await el.updateComplete;

        const listener = oneEvent(el, 'save');
        el.shadowRoot.querySelector('sp-button[variant="accent"]').click();
        const event = await listener;

        expect(event.detail.icon).to.equal('https://example.com/custom.svg');
    });

    it('should not dispatch save when icon value is empty on submit', async () => {
        const el = await fixture(html`<mas-icon-picker-modal open></mas-icon-picker-modal>`, { parentNode: spTheme() });

        el.selectedTab = 'icons';
        el.selectedProductId = null;
        await el.updateComplete;

        let saveFired = false;
        el.addEventListener('save', () => {
            saveFired = true;
        });

        el.shadowRoot.querySelector('sp-button[variant="accent"]').click();
        await el.updateComplete;

        expect(saveFired).to.be.false;
    });

    it('should update selectedProductId and icon on icon item click', async () => {
        const el = await fixture(html`<mas-icon-picker-modal open></mas-icon-picker-modal>`, {
            parentNode: spTheme(),
        });

        await el.updateComplete;

        const iconItems = el.shadowRoot.querySelectorAll('.icon-item');
        expect(iconItems.length).to.be.greaterThan(0);

        // Click the first icon item (first Adobe product)
        iconItems[0].click();
        await el.updateComplete;

        expect(el.selectedProductId).to.equal(ADOBE_PRODUCTS[0].id);
        expect(el._isSpectrum).to.be.false;
        expect(el.icon).to.include(ADOBE_PRODUCTS[0].id);
    });

    it('should show heading "Edit Icon" when icon is set', async () => {
        const el = await fixture(html`<mas-icon-picker-modal open icon="sp-icon-star"></mas-icon-picker-modal>`, {
            parentNode: spTheme(),
        });

        const heading = el.shadowRoot.querySelector('[slot="heading"]');
        expect(heading.textContent.trim()).to.equal('Edit Icon');
    });

    it('should show heading "Add Icon" when no icon is set', async () => {
        const el = await fixture(html`<mas-icon-picker-modal open></mas-icon-picker-modal>`, {
            parentNode: spTheme(),
        });

        const heading = el.shadowRoot.querySelector('[slot="heading"]');
        expect(heading.textContent.trim()).to.equal('Add Icon');
    });

    it('should fall through to URL tab for sp-icon not found in ICON_LIBRARY', async () => {
        const el = await fixture(html`<mas-icon-picker-modal icon="sp-icon-nonexistent-xyz"></mas-icon-picker-modal>`, {
            parentNode: spTheme(),
        });

        // sp-icon-nonexistent-xyz is not in ICON_LIBRARY, falls through to URL tab
        expect(el.selectedTab).to.equal('url');
        expect(el.selectedProductId).to.be.null;
    });

    it('should fall through to URL tab for product URL with unknown product id', async () => {
        const el = await fixture(
            html`<mas-icon-picker-modal
                icon="https://www.adobe.com/cc-shared/assets/img/product-icons/svg/nonexistent-product.svg"
            ></mas-icon-picker-modal>`,
            { parentNode: spTheme() },
        );

        // Product not found in ADOBE_PRODUCTS, falls to URL tab
        expect(el.selectedTab).to.equal('url');
        expect(el.selectedProductId).to.be.null;
    });

    it('should not switch tab when handleTabChange receives a non-SP-TABS event target', async () => {
        const el = await fixture(html`<mas-icon-picker-modal open></mas-icon-picker-modal>`, {
            parentNode: spTheme(),
        });

        el.selectedTab = 'icons';
        await el.updateComplete;

        // Simulate a change event from a child element (not SP-TABS)
        const tabPanel = el.shadowRoot.querySelector('sp-tab-panel');
        if (tabPanel) {
            tabPanel.dispatchEvent(new Event('change', { bubbles: true }));
            await el.updateComplete;
        }

        expect(el.selectedTab).to.equal('icons');
    });

    it('should not dispatch save when URL tab has empty icon value', async () => {
        const el = await fixture(html`<mas-icon-picker-modal open></mas-icon-picker-modal>`, {
            parentNode: spTheme(),
        });

        el.selectedTab = 'url';
        el.icon = '';
        await el.updateComplete;

        let saveFired = false;
        el.addEventListener('save', () => {
            saveFired = true;
        });

        el.shadowRoot.querySelector('sp-button[variant="accent"]').click();
        await el.updateComplete;

        expect(saveFired).to.be.false;
    });

    it('should select a spectrum icon item from the grid', async () => {
        const el = await fixture(html`<mas-icon-picker-modal open></mas-icon-picker-modal>`, {
            parentNode: spTheme(),
        });
        await el.updateComplete;

        const iconItems = el.shadowRoot.querySelectorAll('.icon-item');
        const spectrumOffset = ADOBE_PRODUCTS.length; // spectrum items follow Adobe items
        const spectrumItem = iconItems[spectrumOffset];

        if (spectrumItem) {
            spectrumItem.click();
            await el.updateComplete;

            expect(el._isSpectrum).to.be.true;
            expect(el.selectedProductId).to.equal(ICON_LIBRARY[0].id);
        }
    });

    it('should update alt text via text field input', async () => {
        const el = await fixture(html`<mas-icon-picker-modal open></mas-icon-picker-modal>`, {
            parentNode: spTheme(),
        });
        await el.updateComplete;

        const altField = el.shadowRoot.querySelector('#icon-alt');
        if (altField) {
            altField.value = 'New alt text';
            altField.dispatchEvent(new Event('input', { bubbles: true }));
            await el.updateComplete;
            expect(el.alt).to.equal('New alt text');
        }
    });

    it('should update icon via URL tab text field input', async () => {
        const el = await fixture(
            html`<mas-icon-picker-modal open icon="https://example.com/old.svg"></mas-icon-picker-modal>`,
            { parentNode: spTheme() },
        );

        el.selectedTab = 'url';
        await el.updateComplete;

        const urlField = el.shadowRoot.querySelector('#url-icon');
        if (urlField) {
            urlField.value = 'https://example.com/new.svg';
            urlField.dispatchEvent(new Event('input', { bubbles: true }));
            await el.updateComplete;
            expect(el.icon).to.equal('https://example.com/new.svg');
        }
    });
});
