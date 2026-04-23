import { expect, fixture, html } from '@open-wc/testing';
import '../../src/components/mas-ost-placeholder-panel.js';
import '../../src/components/mas-ost-code-output.js';
import { store } from '../../src/store/ost-store.js';

describe('mas-ost-code-output', () => {
    beforeEach(() => {
        store.selectedOffer = { offer_id: 'TEST123', offer_type: 'BASE' };
        store.selectedOsi = 'abc123';
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
        store.defaultPlaceholderOptions = {
            displayFormatted: true,
            displayRecurrence: true,
            displayPerUnit: false,
            displayTax: false,
            forceTaxExclusive: false,
            displayOldPrice: true,
        };
        store.aosParams = { marketSegment: 'COM' };
        store.checkoutClientId = 'mas-commerce-service';
    });

    afterEach(() => {
        store.selectedOffer = undefined;
        store.selectedOsi = undefined;
    });

    it('renders code string with OSI when inside placeholder panel', async () => {
        const panel = await fixture(
            html`<mas-ost-placeholder-panel></mas-ost-placeholder-panel>`,
        );
        await panel.updateComplete;
        const codeOutput = panel.shadowRoot.querySelector(
            'mas-ost-code-output',
        );
        await codeOutput.updateComplete;
        const code = codeOutput.shadowRoot.querySelector('code');
        expect(code).to.exist;
        expect(code.textContent).to.include('abc123');
    });

    it('renders Use button', async () => {
        const panel = await fixture(
            html`<mas-ost-placeholder-panel></mas-ost-placeholder-panel>`,
        );
        const codeOutput = panel.shadowRoot.querySelector(
            'mas-ost-code-output',
        );
        await codeOutput.updateComplete;
        const button = codeOutput.shadowRoot.querySelector('sp-button');
        expect(button).to.exist;
        expect(button.textContent.trim()).to.equal('Use');
    });

    it('disables Use button when no OSI is selected', async () => {
        store.selectedOsi = undefined;
        const panel = await fixture(
            html`<mas-ost-placeholder-panel></mas-ost-placeholder-panel>`,
        );
        const codeOutput = panel.shadowRoot.querySelector(
            'mas-ost-code-output',
        );
        await codeOutput.updateComplete;
        const button = codeOutput.shadowRoot.querySelector('sp-button');
        expect(button.hasAttribute('disabled')).to.be.true;
    });

    it('includes type in code string for non-price types', async () => {
        const panel = await fixture(
            html`<mas-ost-placeholder-panel></mas-ost-placeholder-panel>`,
        );
        panel.placeholderCtrl.setType('optical');
        await panel.updateComplete;
        const codeOutput = panel.shadowRoot.querySelector(
            'mas-ost-code-output',
        );
        codeOutput.requestUpdate();
        await codeOutput.updateComplete;
        const code = codeOutput.shadowRoot.querySelector('code');
        expect(code.textContent).to.include('type="optical"');
    });
});
