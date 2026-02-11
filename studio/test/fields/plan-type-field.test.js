import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture } from '@open-wc/testing-helpers/pure';
import '../../src/swc.js';
import '../../src/fields/plan-type-field.js';
import { spTheme, oneEvent } from '../utils.js';

describe('Plan type field', () => {
    it('should render with default properties', async () => {
        const el = await fixture(html`<mas-plan-type-field></mas-plan-type-field>`, { parentNode: spTheme() });
        expect(el.value).to.equal('');
        expect(el.isEditable).to.be.false;
        expect(el.showPlanType).to.be.true;
    });

    it('should have toggle OFF and checkbox disabled by default', async () => {
        const el = await fixture(html`<mas-plan-type-field></mas-plan-type-field>`, { parentNode: spTheme() });
        await el.updateComplete;

        const toggle = el.shadowRoot.querySelector('sp-switch');
        const checkbox = el.shadowRoot.querySelector('sp-checkbox');
        expect(toggle).to.exist;
        expect(checkbox).to.exist;
        expect(toggle.checked).to.be.false;
        expect(checkbox.disabled).to.be.true;
    });

    it('should enable checkbox when toggle is switched ON without dispatching', async () => {
        const el = await fixture(html`<mas-plan-type-field></mas-plan-type-field>`, { parentNode: spTheme() });

        const toggle = el.shadowRoot.querySelector('sp-switch');

        toggle.checked = true;
        toggle.dispatchEvent(new Event('change', { bubbles: true }));
        await el.updateComplete;

        expect(el.isEditable).to.be.true;
        const checkbox = el.shadowRoot.querySelector('sp-checkbox');
        expect(checkbox.disabled).to.be.false;
    });

    it('should dispatch "false" when checkbox is unchecked while editable', async () => {
        const el = await fixture(html`<mas-plan-type-field value="true"></mas-plan-type-field>`, { parentNode: spTheme() });
        await el.updateComplete;

        // Switch is OFF on load, toggle it ON first
        const toggle = el.shadowRoot.querySelector('sp-switch');
        toggle.checked = true;
        toggle.dispatchEvent(new Event('change', { bubbles: true }));
        await el.updateComplete;

        const checkbox = el.shadowRoot.querySelector('sp-checkbox');
        const listener = oneEvent(el, 'input');

        checkbox.checked = false;
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
        const event = await listener;

        expect(event.detail.value).to.equal('false');
        expect(el.showPlanType).to.be.false;
    });

    it('should dispatch "true" when checkbox is re-checked while editable', async () => {
        const el = await fixture(html`<mas-plan-type-field value="false"></mas-plan-type-field>`, { parentNode: spTheme() });
        await el.updateComplete;

        // Switch is OFF on load, toggle it ON first
        const toggle = el.shadowRoot.querySelector('sp-switch');
        toggle.checked = true;
        toggle.dispatchEvent(new Event('change', { bubbles: true }));
        await el.updateComplete;

        const checkbox = el.shadowRoot.querySelector('sp-checkbox');
        const listener = oneEvent(el, 'input');

        checkbox.checked = true;
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
        const event = await listener;

        expect(event.detail.value).to.equal('true');
        expect(el.showPlanType).to.be.true;
    });

    it('should disable checkbox when toggle is switched OFF without dispatching', async () => {
        const el = await fixture(html`<mas-plan-type-field value="true"></mas-plan-type-field>`, { parentNode: spTheme() });
        await el.updateComplete;

        // Toggle ON first
        const toggle = el.shadowRoot.querySelector('sp-switch');
        toggle.checked = true;
        toggle.dispatchEvent(new Event('change', { bubbles: true }));
        await el.updateComplete;

        // Toggle OFF
        toggle.checked = false;
        toggle.dispatchEvent(new Event('change', { bubbles: true }));
        await el.updateComplete;

        expect(el.isEditable).to.be.false;
        const checkbox = el.shadowRoot.querySelector('sp-checkbox');
        expect(checkbox.disabled).to.be.true;
    });

    it('should parse value="true" as not editable with checkbox checked on load', async () => {
        const el = await fixture(html`<mas-plan-type-field value="true"></mas-plan-type-field>`, { parentNode: spTheme() });
        await el.updateComplete;

        expect(el.isEditable).to.be.false;
        expect(el.showPlanType).to.be.true;
    });

    it('should parse value="false" as not editable with checkbox unchecked on load', async () => {
        const el = await fixture(html`<mas-plan-type-field value="false"></mas-plan-type-field>`, { parentNode: spTheme() });
        await el.updateComplete;

        expect(el.isEditable).to.be.false;
        expect(el.showPlanType).to.be.false;
    });

    it('should parse empty value as not editable with checkbox checked on load', async () => {
        const el = await fixture(html`<mas-plan-type-field value=""></mas-plan-type-field>`, { parentNode: spTheme() });
        await el.updateComplete;

        expect(el.isEditable).to.be.false;
        expect(el.showPlanType).to.be.true;
    });
});
