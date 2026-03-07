import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture } from '@open-wc/testing-helpers/pure';
import '../../src/swc.js';
import '../../src/fields/secure-text-field.js';
import { spTheme, oneEvent } from '../utils.js';

describe('Secure text field', () => {
    it('should render with default properties', async () => {
        const el = await fixture(html`<secure-text-field></secure-text-field>`, { parentNode: spTheme() });
        expect(el.value).to.equal('');
        expect(el.isEditable).to.be.false;
        expect(el.showSecureTextField).to.be.true;
    });

    it('should have toggle OFF and checkbox disabled by default', async () => {
        const el = await fixture(html`<secure-text-field></secure-text-field>`, { parentNode: spTheme() });
        await el.updateComplete;

        const toggle = el.shadowRoot.querySelector('sp-switch');
        const checkbox = el.shadowRoot.querySelector('sp-checkbox');
        expect(toggle).to.exist;
        expect(checkbox).to.exist;
        expect(toggle.checked).to.be.false;
        expect(checkbox.disabled).to.be.true;
    });

    it('should dispatch "true" when toggle is switched ON and checkbox is checked', async () => {
        const el = await fixture(html`<secure-text-field></secure-text-field>`, { parentNode: spTheme() });

        const toggle = el.shadowRoot.querySelector('sp-switch');
        const listener = oneEvent(el, 'input');

        toggle.checked = true;
        toggle.dispatchEvent(new Event('change', { bubbles: true }));
        const event = await listener;

        expect(event.detail.value).to.equal('true');
        expect(el.isEditable).to.be.true;
        expect(el.showSecureTextField).to.be.true;
    });

    it('should dispatch "false" when checkbox is unchecked while editable', async () => {
        const el = await fixture(html`<secure-text-field value="true"></secure-text-field>`, { parentNode: spTheme() });
        await el.updateComplete;

        const checkbox = el.shadowRoot.querySelector('sp-checkbox');
        const listener = oneEvent(el, 'input');

        checkbox.checked = false;
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
        const event = await listener;

        expect(event.detail.value).to.equal('false');
        expect(el.showSecureTextField).to.be.false;
    });

    it('should dispatch "true" when checkbox is re-checked while editable', async () => {
        const el = await fixture(html`<secure-text-field value="true"></secure-text-field>`, { parentNode: spTheme() });
        await el.updateComplete;

        const checkbox = el.shadowRoot.querySelector('sp-checkbox');

        // First uncheck
        checkbox.checked = false;
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
        await el.updateComplete;

        // Then re-check
        const listener = oneEvent(el, 'input');
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
        const event = await listener;

        expect(event.detail.value).to.equal('true');
        expect(el.showSecureTextField).to.be.true;
    });

    it('should dispatch empty string when toggle is switched OFF', async () => {
        const el = await fixture(html`<secure-text-field value="true"></secure-text-field>`, { parentNode: spTheme() });
        await el.updateComplete;

        const toggle = el.shadowRoot.querySelector('sp-switch');
        const listener = oneEvent(el, 'input');

        toggle.checked = false;
        toggle.dispatchEvent(new Event('change', { bubbles: true }));
        const event = await listener;

        expect(event.detail.value).to.equal('false');
        expect(el.isEditable).to.be.false;
    });

    it('should parse value="true" as editable with checkbox checked', async () => {
        const el = await fixture(html`<secure-text-field value="true"></secure-text-field>`, { parentNode: spTheme() });
        await el.updateComplete;

        expect(el.isEditable).to.be.true;
        expect(el.showSecureTextField).to.be.true;
    });

    it('should parse value="false" as not editable', async () => {
        const el = await fixture(html`<secure-text-field value="false"></secure-text-field>`, { parentNode: spTheme() });
        await el.updateComplete;

        expect(el.isEditable).to.be.false;
        expect(el.showSecureTextField).to.be.true;
    });

    it('should parse empty value as not editable', async () => {
        const el = await fixture(html`<secure-text-field value=""></secure-text-field>`, { parentNode: spTheme() });
        await el.updateComplete;

        expect(el.isEditable).to.be.false;
        expect(el.showSecureTextField).to.be.true;
    });

    it('should dispatch "false" when toggle is switched ON while showSecureTextField is false', async () => {
        const el = await fixture(html`<secure-text-field value="true"></secure-text-field>`, {
            parentNode: spTheme(),
        });
        await el.updateComplete;

        // Uncheck the checkbox to set showSecureTextField=false
        const checkbox = el.shadowRoot.querySelector('sp-checkbox');
        checkbox.checked = false;
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
        await el.updateComplete;

        expect(el.showSecureTextField).to.be.false;

        // Turn off the toggle
        const toggle = el.shadowRoot.querySelector('sp-switch');
        let listener = oneEvent(el, 'input');
        toggle.checked = false;
        toggle.dispatchEvent(new Event('change', { bubbles: true }));
        await listener;

        expect(el.isEditable).to.be.false;

        // Turn toggle back ON while showSecureTextField is false
        listener = oneEvent(el, 'input');
        toggle.checked = true;
        toggle.dispatchEvent(new Event('change', { bubbles: true }));
        const event = await listener;

        // showSecureTextField is false → value is 'false'
        expect(event.detail.value).to.equal('false');
        expect(el.isEditable).to.be.true;
    });

    it('should not reset state from updated() while interacting via toggle', async () => {
        const el = await fixture(html`<secure-text-field value="true"></secure-text-field>`, {
            parentNode: spTheme(),
        });
        await el.updateComplete;

        expect(el.isEditable).to.be.true;

        // Toggling should not reset isEditable to the value-based state
        const toggle = el.shadowRoot.querySelector('sp-switch');
        const listener = oneEvent(el, 'input');
        toggle.checked = false;
        toggle.dispatchEvent(new Event('change', { bubbles: true }));
        await listener;
        await el.updateComplete;

        // isEditable should be false (from toggle), not reset to true by updated()
        expect(el.isEditable).to.be.false;
    });

    it('should render sp-field-label with provided label', async () => {
        const el = await fixture(html`<secure-text-field label="Secure Transaction" id="secure-field"></secure-text-field>`, {
            parentNode: spTheme(),
        });
        await el.updateComplete;

        const label = el.shadowRoot.querySelector('sp-field-label');
        expect(label).to.exist;
        expect(label.textContent.trim()).to.equal('Secure Transaction');
    });
});
