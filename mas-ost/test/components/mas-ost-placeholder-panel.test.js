import { expect, fixture, html } from '@open-wc/testing';
import '../../src/components/mas-ost-placeholder-panel.js';
import { store } from '../../src/store/ost-store.js';

describe('mas-ost-placeholder-panel', () => {
    beforeEach(() => {
        store.selectedOffer = { offer_id: 'TEST123', offer_type: 'BASE' };
        store.selectedOsi = 'test-osi';
        store.placeholderTypes = [
            { type: 'price', name: 'Price' },
            { type: 'optical', name: 'Optical price' },
            { type: 'annual', name: 'Annual price' },
            { type: 'strikethrough', name: 'Strikethrough price' },
            { type: 'promo-strikethrough', name: 'Promo strikethrough price' },
            { type: 'discount', name: 'Discount percentage' },
            { type: 'legal', name: 'Legal disclaimer', overrides: { displayPlanType: true } },
            { type: 'checkoutUrl', name: 'Checkout URL' },
        ];
    });

    afterEach(() => {
        store.selectedOffer = undefined;
        store.selectedOsi = undefined;
    });

    it('renders all 8 type chips', async () => {
        const el = await fixture(
            html`<mas-ost-placeholder-panel></mas-ost-placeholder-panel>`,
        );
        const chips = el.shadowRoot.querySelectorAll(
            '.type-chips sp-action-button',
        );
        expect(chips.length).to.equal(8);
    });

    it('renders chip labels matching placeholder type names', async () => {
        const el = await fixture(
            html`<mas-ost-placeholder-panel></mas-ost-placeholder-panel>`,
        );
        const chips = el.shadowRoot.querySelectorAll(
            '.type-chips sp-action-button',
        );
        const labels = Array.from(chips).map((c) => c.textContent.trim());
        expect(labels).to.deep.equal([
            'Price',
            'Optical price',
            'Annual price',
            'Strikethrough price',
            'Promo strikethrough price',
            'Discount percentage',
            'Legal disclaimer',
            'Checkout URL',
        ]);
    });

    it('shows placeholder-options by default (price type)', async () => {
        const el = await fixture(
            html`<mas-ost-placeholder-panel></mas-ost-placeholder-panel>`,
        );
        const options = el.shadowRoot.querySelector(
            'mas-ost-placeholder-options',
        );
        const checkout = el.shadowRoot.querySelector(
            'mas-ost-checkout-options',
        );
        expect(options).to.exist;
        expect(checkout).to.not.exist;
    });

    it('shows checkout-options when Checkout URL chip is clicked', async () => {
        const el = await fixture(
            html`<mas-ost-placeholder-panel></mas-ost-placeholder-panel>`,
        );
        const chips = el.shadowRoot.querySelectorAll(
            '.type-chips sp-action-button',
        );
        const checkoutChip = Array.from(chips).find(
            (c) => c.textContent.trim() === 'Checkout URL',
        );
        checkoutChip.click();
        await el.updateComplete;
        const checkout = el.shadowRoot.querySelector(
            'mas-ost-checkout-options',
        );
        expect(checkout).to.exist;
    });

    it('shows empty state when no offer is selected', async () => {
        store.selectedOffer = undefined;
        const el = await fixture(
            html`<mas-ost-placeholder-panel></mas-ost-placeholder-panel>`,
        );
        const emptyState = el.shadowRoot.querySelector('.empty-state');
        expect(emptyState).to.exist;
    });

    it('renders live-preview and code-output sections', async () => {
        const el = await fixture(
            html`<mas-ost-placeholder-panel></mas-ost-placeholder-panel>`,
        );
        expect(el.shadowRoot.querySelector('mas-ost-live-preview')).to.exist;
        expect(el.shadowRoot.querySelector('mas-ost-code-output')).to.exist;
    });
});
