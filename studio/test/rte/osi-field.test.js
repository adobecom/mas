import { expect } from '@esm-bundle/chai';
import { fixture, html } from '@open-wc/testing-helpers/pure';
import '../../src/swc.js';
import '../../src/rte/osi-field.js';

describe('osi-field error state', () => {
    const errorIcon = (field) => field.shadowRoot.querySelector('sp-icon-alert');

    it('shows the error icon when value is empty', async () => {
        const field = await fixture(html`<osi-field></osi-field>`);
        expect(errorIcon(field)).to.exist;
    });

    it('hides the error icon when suppress-error is set', async () => {
        const field = await fixture(html`<osi-field suppress-error></osi-field>`);
        expect(field.suppressError).to.be.true;
        expect(errorIcon(field)).to.not.exist;
    });

    it('hides the error icon when a value is set', async () => {
        const field = await fixture(html`<osi-field value="abc"></osi-field>`);
        expect(errorIcon(field)).to.not.exist;
    });
});

describe('osi-field rendering', () => {
    const button = (field) => field.shadowRoot.querySelector('#offerSelectorToolButtonOSI');

    it('shows the OSI as visible text, not an input value', async () => {
        const field = await fixture(html`<osi-field id="osi" value="ABC123"></osi-field>`);
        const value = field.shadowRoot.querySelector('.osi-value');
        expect(value.tagName).to.equal('SPAN');
        expect(value.textContent).to.equal('ABC123');
    });

    it('exposes the OSI text and the button inside osi-field#osi', async () => {
        const wrapper = await fixture(html`<div><osi-field id="osi" value="ABC123"></osi-field></div>`);
        const field = wrapper.querySelector('osi-field#osi');
        expect(field.textContent + field.shadowRoot.textContent).to.include('ABC123');
        expect(button(field)).to.exist;
    });

    it('places the button at the right end of the field', async () => {
        const field = await fixture(html`<osi-field value="ABC123"></osi-field>`);
        const box = field.shadowRoot.querySelector('.osi-field');
        const value = field.shadowRoot.querySelector('.osi-value');
        expect(box.lastElementChild).to.equal(button(field));
        const buttonRect = button(field).getBoundingClientRect();
        // the textfield border now sits between the box edge and the button
        const innerRight = box.getBoundingClientRect().right - box.clientLeft;
        expect(innerRight - buttonRect.right).to.be.at.most(1);
        expect(buttonRect.left).to.be.at.least(value.getBoundingClientRect().right - 1);
    });

    it('renders the cart button as a non-quiet action button', async () => {
        const field = await fixture(html`<osi-field value="ABC123"></osi-field>`);
        expect(button(field).tagName).to.equal('SP-ACTION-BUTTON');
        expect(button(field).hasAttribute('quiet')).to.be.false;
    });

    it('opens the offer selector when the button is clicked', async () => {
        const proto = customElements.get('osi-field').prototype;
        const original = proto.handleOpenOfferSelector;
        let openedBy;
        proto.handleOpenOfferSelector = function () {
            openedBy = this;
        };
        try {
            const field = await fixture(html`<osi-field value="ABC123"></osi-field>`);
            button(field).click();
            expect(openedBy).to.equal(field);
        } finally {
            proto.handleOpenOfferSelector = original;
        }
    });

    it('renders an empty field with the error state when there is no value', async () => {
        const field = await fixture(html`<osi-field></osi-field>`);
        expect(field.shadowRoot.querySelector('.osi-value').textContent.trim()).to.equal('');
        expect(button(field)).to.exist;
        expect(field.shadowRoot.querySelector('sp-icon-alert')).to.exist;
        expect(field.shadowRoot.querySelector('sp-icon-shopping-cart').classList.contains('error-state')).to.be.true;
    });
});

describe('osi-field readonly', () => {
    const button = (field) => field.shadowRoot.querySelector('#offerSelectorToolButtonOSI');

    it('disables the offer selector button and hides the error icon', async () => {
        const field = await fixture(html`<osi-field readonly></osi-field>`);
        expect(button(field).disabled).to.be.true;
        expect(field.shadowRoot.querySelector('sp-icon-alert')).to.not.exist;
    });

    it('explains on hover that the OSI is managed on the parent card', async () => {
        const field = await fixture(html`<osi-field readonly></osi-field>`);
        const tooltip = field.shadowRoot.querySelector('sp-tooltip[self-managed]');
        expect(tooltip.textContent.trim()).to.equal('The OSI is managed on the parent card.');
    });

    it('shows no tooltip when editable', async () => {
        const field = await fixture(html`<osi-field></osi-field>`);
        expect(field.shadowRoot.querySelector('sp-tooltip')).to.not.exist;
    });

    it('does not open the offer selector', async () => {
        const field = await fixture(html`<osi-field readonly value="abc"></osi-field>`);
        field.handleOpenOfferSelector();
        expect(field.showOfferSelector).to.be.false;
    });
});

describe('osi-field OST offer select', () => {
    let originalOst;

    beforeEach(() => {
        originalOst = window.ost;
        window.ost = { openOfferSelectorTool: () => {}, closeOfferSelectorTool: () => {} };
    });

    afterEach(() => {
        window.ost = originalOst;
    });

    it('keeps the plain OSI and forwards the promo code in the change detail', async () => {
        const field = await fixture(html`<osi-field></osi-field>`);
        field.handleOpenOfferSelector();
        const changed = new Promise((resolve) => field.addEventListener('change', resolve, { once: true }));
        document.dispatchEvent(
            new CustomEvent('ost-offer-select', {
                detail: { offerSelectorId: 'OSI-1', promotionCode: 'TESTPROMO26' },
            }),
        );
        const event = await changed;
        expect(field.value).to.equal('OSI-1');
        expect(event.detail.promotionCode).to.equal('TESTPROMO26');
    });
});
