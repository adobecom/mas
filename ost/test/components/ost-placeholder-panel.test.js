import { expect, fixture, html } from '@open-wc/testing';
import '../../src/components/ost-placeholder-panel.js';
import { store } from '../../src/store/ost-store.js';

describe('ost-placeholder-panel', () => {
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

    it('renders all 8 placeholder type tabs', async () => {
        const el = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
        const tabs = el.shadowRoot.querySelectorAll('sp-tabs sp-tab');
        expect(tabs.length).to.equal(8);
    });

    it('renders tab labels matching placeholder type names', async () => {
        const el = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
        const tabs = el.shadowRoot.querySelectorAll('sp-tabs sp-tab');
        const labels = Array.from(tabs).map((t) => t.getAttribute('label'));
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
        const el = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
        const options = el.shadowRoot.querySelector('ost-placeholder-options');
        const checkout = el.shadowRoot.querySelector('ost-checkout-options');
        expect(options).to.exist;
        expect(checkout).to.not.exist;
    });

    it('shows checkout-options when the Checkout URL tab is selected', async () => {
        const el = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
        // Drive the type change through the component method that the sp-tabs
        // @change handler invokes; bypasses SWC tab-click event plumbing in the
        // jsdom/WTR fixture which is brittle to simulate.
        el.selectType('checkoutUrl');
        await el.updateComplete;
        const checkout = el.shadowRoot.querySelector('ost-checkout-options');
        expect(checkout).to.exist;
    });

    it('shows empty state when no offer is selected', async () => {
        store.selectedOffer = undefined;
        const el = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
        const emptyState = el.shadowRoot.querySelector('.empty-state');
        expect(emptyState).to.exist;
    });

    it('renders live-preview and code-output sections', async () => {
        const el = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
        expect(el.shadowRoot.querySelector('ost-live-preview')).to.exist;
        expect(el.shadowRoot.querySelector('ost-code-output')).to.exist;
    });

    it('initializes with price type and default options', async () => {
        const el = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
        expect(el.selectedType).to.equal('price');
        expect(el.options.displayFormatted).to.be.true;
        expect(el.options.displayRecurrence).to.be.true;
    });

    it('exposes back-compat placeholderCtrl getter pointing at self', async () => {
        const el = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
        expect(el.placeholderCtrl).to.equal(el);
    });

    it('applies displayPlanType override for legal type', async () => {
        const el = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
        el.setType('legal');
        const effective = el.getEffectiveOptions();
        expect(effective.displayPlanType).to.be.true;
    });

    it('does not apply displayPlanType for price type', async () => {
        const el = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
        el.setType('price');
        const effective = el.getEffectiveOptions();
        expect(effective.displayPlanType).to.be.undefined;
    });

    it('toggleOption flips a boolean option', async () => {
        const el = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
        const before = !!el.options.displayTax;
        el.toggleOption('displayTax');
        expect(el.options.displayTax).to.equal(!before);
    });

    it('resets options when changing type', async () => {
        const el = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
        el.toggleOption('displayTax');
        expect(el.options.displayTax).to.be.true;
        el.setType('optical');
        expect(el.options.displayTax).to.be.false;
    });

    it('serializeOptions returns effective options including overrides', async () => {
        const el = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
        el.setType('legal');
        const serialized = el.serializeOptions();
        expect(serialized.displayPlanType).to.be.true;
    });
});
