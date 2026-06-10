import { expect, fixture, html } from '@open-wc/testing';
import '../../src/components/ost-placeholder-panel.js';
import { store } from '../../src/store/ost-store.js';

describe('ost-placeholder-panel', () => {
    beforeEach(() => {
        store.selectedOffer = { offer_id: 'TEST123', offer_type: 'BASE' };
        store.selectedOsi = 'test-osi';
        store.placeholderTypes = [
            { type: 'price', name: 'Price', description: 'Formatted price' },
            { type: 'optical', name: 'Optical price', description: 'Monthly equivalent' },
            { type: 'annual', name: 'Annual price', description: 'Annual payments' },
            { type: 'strikethrough', name: 'Strikethrough price', description: 'Strikethrough' },
            { type: 'promo-strikethrough', name: 'Promo strikethrough price', description: 'Promo strikethrough' },
            { type: 'discount', name: 'Discount percentage', description: 'Percentage discount' },
            { type: 'legal', name: 'Legal disclaimer', description: 'Legal disclaimer', overrides: { displayPlanType: true } },
            { type: 'checkoutUrl', name: 'Checkout URL', description: 'Checkout URL' },
        ];
    });

    afterEach(() => {
        store.selectedOffer = undefined;
        store.selectedOsi = undefined;
    });

    it('renders one row per placeholder type', async () => {
        const el = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
        const rows = el.shadowRoot.querySelectorAll('[data-testid^="ost-placeholder-row-"]');
        expect(rows.length).to.equal(8);
    });

    it('renders the type name and description in each row', async () => {
        const el = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
        const priceRow = el.shadowRoot.querySelector('[data-testid="ost-placeholder-row-price"]');
        expect(priceRow.textContent).to.contain('Price');
        expect(priceRow.textContent).to.contain('Formatted price');
    });

    it('does not render pill/chip selectors', async () => {
        const el = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
        expect(el.shadowRoot.querySelector('.type-chips')).to.not.exist;
        expect(el.shadowRoot.querySelector('[data-testid^="ost-placeholder-chip-"]')).to.not.exist;
    });

    it('renders a live preview per row', async () => {
        const el = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
        const previews = el.shadowRoot.querySelectorAll('ost-live-preview');
        expect(previews.length).to.equal(8);
    });

    it('renders a Use (code-output) per row', async () => {
        const el = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
        const outputs = el.shadowRoot.querySelectorAll('ost-code-output');
        expect(outputs.length).to.equal(8);
    });

    it('passes each row its own placeholderType to preview and output', async () => {
        const el = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
        const opticalRow = el.shadowRoot.querySelector('[data-testid="ost-placeholder-row-optical"]');
        expect(opticalRow.querySelector('ost-live-preview').placeholderType).to.equal('optical');
        expect(opticalRow.querySelector('ost-code-output').placeholderType).to.equal('optical');
    });

    it('renders the global options section once', async () => {
        const el = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
        expect(el.shadowRoot.querySelectorAll('ost-placeholder-options').length).to.equal(1);
    });

    it('renders a reference-osi field for the discount row only', async () => {
        const el = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
        const fields = el.shadowRoot.querySelectorAll('.reference-osi-field');
        expect(fields.length).to.equal(1);
        const discountRow = el.shadowRoot.querySelector('[data-testid="ost-placeholder-row-discount"]');
        expect(discountRow.querySelector('.reference-osi-field')).to.exist;
    });

    it('feeds the discount referenceOsi into that row preview and output', async () => {
        const el = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
        const discountRow = el.shadowRoot.querySelector('[data-testid="ost-placeholder-row-discount"]');
        const input = discountRow.querySelector('sp-textfield');
        input.value = 'REF-OSI';
        input.dispatchEvent(new Event('input'));
        await el.updateComplete;
        expect(discountRow.querySelector('ost-live-preview').referenceOsi).to.equal('REF-OSI');
        expect(discountRow.querySelector('ost-code-output').referenceOsi).to.equal('REF-OSI');
    });

    it('renders checkout-options inside the checkoutUrl row', async () => {
        const el = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
        const checkoutRow = el.shadowRoot.querySelector('[data-testid="ost-placeholder-row-checkoutUrl"]');
        expect(checkoutRow.querySelector('ost-checkout-options')).to.exist;
    });

    it('shows empty state when no offer is selected', async () => {
        store.selectedOffer = undefined;
        const el = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
        expect(el.shadowRoot.querySelector('.empty-state')).to.exist;
        expect(el.shadowRoot.querySelector('[data-testid^="ost-placeholder-row-"]')).to.not.exist;
    });
});
