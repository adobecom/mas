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

    it('should dispatch "true" when toggle is switched ON and checkbox is checked', async () => {
        const el = await fixture(html`<mas-plan-type-field></mas-plan-type-field>`, { parentNode: spTheme() });

        const toggle = el.shadowRoot.querySelector('sp-switch');
        const listener = oneEvent(el, 'input');

        toggle.checked = true;
        toggle.dispatchEvent(new Event('change', { bubbles: true }));
        const event = await listener;

        expect(event.detail.value).to.equal('true');
        expect(el.isEditable).to.be.true;
        expect(el.showPlanType).to.be.true;
    });

    it('should dispatch "false" when checkbox is unchecked while editable', async () => {
        const el = await fixture(html`<mas-plan-type-field value="true"></mas-plan-type-field>`, { parentNode: spTheme() });
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

        const checkbox = el.shadowRoot.querySelector('sp-checkbox');
        const listener = oneEvent(el, 'input');

        checkbox.checked = true;
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
        const event = await listener;

        expect(event.detail.value).to.equal('true');
        expect(el.showPlanType).to.be.true;
    });

    it('should dispatch empty string when toggle is switched OFF', async () => {
        const el = await fixture(html`<mas-plan-type-field value="true"></mas-plan-type-field>`, { parentNode: spTheme() });
        await el.updateComplete;

        const toggle = el.shadowRoot.querySelector('sp-switch');
        const listener = oneEvent(el, 'input');

        toggle.checked = false;
        toggle.dispatchEvent(new Event('change', { bubbles: true }));
        const event = await listener;

        expect(event.detail.value).to.equal('');
        expect(el.isEditable).to.be.false;
    });

    it('should parse value="true" as editable with checkbox checked', async () => {
        const el = await fixture(html`<mas-plan-type-field value="true"></mas-plan-type-field>`, { parentNode: spTheme() });
        await el.updateComplete;

        expect(el.isEditable).to.be.true;
        expect(el.showPlanType).to.be.true;
    });

    it('should parse value="false" as editable with checkbox unchecked', async () => {
        const el = await fixture(html`<mas-plan-type-field value="false"></mas-plan-type-field>`, { parentNode: spTheme() });
        await el.updateComplete;

        expect(el.isEditable).to.be.true;
        expect(el.showPlanType).to.be.false;
    });

    it('should parse empty value as not editable', async () => {
        const el = await fixture(html`<mas-plan-type-field value=""></mas-plan-type-field>`, { parentNode: spTheme() });
        await el.updateComplete;

        expect(el.isEditable).to.be.false;
        expect(el.showPlanType).to.be.true;
    });
});
