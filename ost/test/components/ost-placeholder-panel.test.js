import { expect, fixture, html } from '@open-wc/testing';
import '../../src/components/ost-placeholder-panel.js';
import { store } from '../../src/store/ost-store.js';

describe('ost-placeholder-panel', () => {
    beforeEach(() => {
        store.selectedOffer = { offer_id: 'TEST123', offer_type: 'BASE' };
        store.selectedOsi = 'test-osi';
        store.placeholderTab = 'price';
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
        store.placeholderTab = 'price';
    });

    it('renders the Price, Checkout, and Offer Details tabs', async () => {
        const el = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
        expect(el.shadowRoot.querySelector('[data-testid="ost-tab-price"]')).to.exist;
        expect(el.shadowRoot.querySelector('[data-testid="ost-tab-checkout"]')).to.exist;
        expect(el.shadowRoot.querySelector('[data-testid="ost-tab-details"]')).to.exist;
    });

    it('shows only price-type rows on the default Price tab', async () => {
        const el = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
        const rows = el.shadowRoot.querySelectorAll('[data-testid^="ost-placeholder-row-"]');
        expect(rows.length).to.equal(7);
        expect(Boolean(el.shadowRoot.querySelector('[data-testid="ost-placeholder-row-checkoutUrl"]'))).to.be.false;
    });

    it('shows the checkoutUrl row and checkout options on the Checkout tab', async () => {
        store.placeholderTab = 'checkout';
        const el = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
        const checkoutRow = el.shadowRoot.querySelector('[data-testid="ost-placeholder-row-checkoutUrl"]');
        expect(checkoutRow).to.exist;
        expect(checkoutRow.querySelector('ost-checkout-options')).to.exist;
        expect(Boolean(el.shadowRoot.querySelector('[data-testid="ost-placeholder-row-price"]'))).to.be.false;
    });

    it('renders the full offer detail on the Offer Details tab', async () => {
        store.placeholderTab = 'details';
        const el = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
        const detail = el.shadowRoot.querySelector('ost-product-detail');
        expect(detail).to.exist;
        expect(detail.hasAttribute('summary')).to.be.false;
        expect(Boolean(el.shadowRoot.querySelector('[data-testid^="ost-placeholder-row-"]'))).to.be.false;
    });

    it('switches tabs through the store when a tab is clicked', async () => {
        const el = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
        const tabs = el.shadowRoot.querySelector('sp-tabs');
        tabs.selected = 'checkout';
        tabs.dispatchEvent(new Event('change'));
        await el.updateComplete;
        expect(store.placeholderTab).to.equal('checkout');
        expect(el.shadowRoot.querySelector('[data-testid="ost-placeholder-row-checkoutUrl"]')).to.exist;
    });

    it('renders the type name and description in each row', async () => {
        const el = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
        const priceRow = el.shadowRoot.querySelector('[data-testid="ost-placeholder-row-price"]');
        expect(priceRow.textContent).to.contain('Price');
        expect(priceRow.textContent).to.contain('Formatted price');
    });

    it('does not render pill/chip selectors', async () => {
        const el = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
        expect(Boolean(el.shadowRoot.querySelector('.type-chips'))).to.be.false;
        expect(Boolean(el.shadowRoot.querySelector('[data-testid^="ost-placeholder-chip-"]'))).to.be.false;
    });

    it('renders a live preview and a Use (code-output) per price row', async () => {
        const el = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
        expect(el.shadowRoot.querySelectorAll('ost-live-preview').length).to.equal(7);
        expect(el.shadowRoot.querySelectorAll('ost-code-output').length).to.equal(7);
    });

    it('passes each row its own placeholderType to preview and output', async () => {
        const el = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
        const opticalRow = el.shadowRoot.querySelector('[data-testid="ost-placeholder-row-optical"]');
        expect(opticalRow.querySelector('ost-live-preview').placeholderType).to.equal('optical');
        expect(opticalRow.querySelector('ost-code-output').placeholderType).to.equal('optical');
    });

    it('renders the global options section once on the Price tab', async () => {
        const el = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
        expect(el.shadowRoot.querySelectorAll('ost-placeholder-options').length).to.equal(1);
    });

    it('renders the Options section below the price rows', async () => {
        const el = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
        const rows = el.shadowRoot.querySelector('.placeholder-rows');
        const options = el.shadowRoot.querySelector('ost-placeholder-options');
        expect(rows).to.exist;
        expect(options).to.exist;
        expect(rows.compareDocumentPosition(options) & Node.DOCUMENT_POSITION_FOLLOWING).to.be.greaterThan(0);
    });

    it('does not render the price options on the Checkout tab', async () => {
        store.placeholderTab = 'checkout';
        const el = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
        expect(Boolean(el.shadowRoot.querySelector('ost-placeholder-options'))).to.be.false;
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

    it('shows empty state when no offer is selected', async () => {
        store.selectedOffer = undefined;
        const el = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
        expect(el.shadowRoot.querySelector('.empty-state')).to.exist;
        expect(Boolean(el.shadowRoot.querySelector('[data-testid^="ost-placeholder-row-"]'))).to.be.false;
    });

    describe('tryBuy flow', () => {
        beforeEach(() => {
            store.applyFlowSwitch('tryBuy', false);
            store.addOffer({ offer_id: 'TRIAL1', offer_type: 'TRIAL' }, 'osi-trial', 'trial');
            store.addOffer({ offer_id: 'BASE1', offer_type: 'BASE' }, 'osi-base', 'base');
        });

        afterEach(() => {
            store.applyFlowSwitch('single', false);
        });

        it('renders a labeled price row per offer on the Price tab', async () => {
            const el = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
            const trialRow = el.shadowRoot.querySelector('[data-testid="ost-placeholder-row-price-trial"]');
            const buyRow = el.shadowRoot.querySelector('[data-testid="ost-placeholder-row-price-buy"]');
            expect(trialRow).to.exist;
            expect(buyRow).to.exist;
            expect(trialRow.textContent).to.contain('Trial');
            expect(buyRow.textContent).to.contain('Buy');
        });

        it('feeds each price row its own OSI and offer', async () => {
            const el = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
            const trialRow = el.shadowRoot.querySelector('[data-testid="ost-placeholder-row-price-trial"]');
            expect(trialRow.querySelector('ost-live-preview').osi).to.equal('osi-trial');
            expect(trialRow.querySelector('ost-code-output').osi).to.equal('osi-trial');
            const buyRow = el.shadowRoot.querySelector('[data-testid="ost-placeholder-row-price-buy"]');
            expect(buyRow.querySelector('ost-code-output').osi).to.equal('osi-base');
        });

        it('does not render exotic price types in tryBuy', async () => {
            const el = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
            expect(Boolean(el.shadowRoot.querySelector('[data-testid^="ost-placeholder-row-optical"]'))).to.be.false;
            expect(Boolean(el.shadowRoot.querySelector('[data-testid^="ost-placeholder-row-legal"]'))).to.be.false;
        });

        it('renders a checkout row per offer with its own options on the Checkout tab', async () => {
            store.placeholderTab = 'checkout';
            const el = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
            const trialRow = el.shadowRoot.querySelector('[data-testid="ost-placeholder-row-checkoutUrl-trial"]');
            const buyRow = el.shadowRoot.querySelector('[data-testid="ost-placeholder-row-checkoutUrl-buy"]');
            expect(trialRow).to.exist;
            expect(buyRow).to.exist;
            expect(trialRow.querySelector('ost-checkout-options')).to.exist;
            expect(buyRow.querySelector('ost-checkout-options')).to.exist;
        });

        it('renders only the buy rows when no trial is selected', async () => {
            store.removeOfferByRole('trial');
            const el = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
            expect(Boolean(el.shadowRoot.querySelector('[data-testid="ost-placeholder-row-price-trial"]'))).to.be.false;
            expect(el.shadowRoot.querySelector('[data-testid="ost-placeholder-row-price-buy"]')).to.exist;
        });
    });

    describe('bundle flow', () => {
        beforeEach(() => {
            store.applyFlowSwitch('bundle', false);
            store.addOffer({ offer_id: 'A' }, 'osi-a', 'bundle');
            store.addOffer({ offer_id: 'B' }, 'osi-b', 'bundle');
        });

        afterEach(() => {
            store.applyFlowSwitch('single', false);
        });

        it('renders the standard rows fed with the joined OSI', async () => {
            const el = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
            const priceRow = el.shadowRoot.querySelector('[data-testid="ost-placeholder-row-price"]');
            expect(priceRow).to.exist;
            expect(priceRow.querySelector('ost-live-preview').osi).to.equal('osi-a,osi-b');
            expect(priceRow.querySelector('ost-code-output').osi).to.equal('osi-a,osi-b');
        });
    });
});
