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

describe('osi-field readonly', () => {
    const button = (field) => field.shadowRoot.querySelector('#offerSelectorToolButtonOSI');

    it('disables the offer selector button and hides the error icon', async () => {
        const field = await fixture(html`<osi-field readonly></osi-field>`);
        expect(button(field).disabled).to.be.true;
        expect(field.shadowRoot.querySelector('sp-icon-alert')).to.not.exist;
    });

    it('does not open the offer selector', async () => {
        const field = await fixture(html`<osi-field readonly value="abc"></osi-field>`);
        field.handleOpenOfferSelector();
        expect(field.showOfferSelector).to.be.false;
    });
});
