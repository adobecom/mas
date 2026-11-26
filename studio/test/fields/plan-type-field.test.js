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
        expect(el.checked).to.be.false;
    });

    it('should have toggle OFF by default', async () => {
        const el = await fixture(html`<mas-plan-type-field></mas-plan-type-field>`, { parentNode: spTheme() });
        await el.updateComplete;

        const toggle = el.querySelector('sp-switch');
        expect(toggle).to.exist;
        expect(toggle.checked).to.be.false;
    });

    it('should dispatch "true" when toggle is switched ON', async () => {
        const el = await fixture(html`<mas-plan-type-field></mas-plan-type-field>`, { parentNode: spTheme() });

        const toggle = el.querySelector('sp-switch');
        const listener = oneEvent(el, 'input');

        toggle.checked = true;
        toggle.dispatchEvent(new Event('change', { bubbles: true }));
        const event = await listener;

        expect(event.detail.value).to.equal('true');
        expect(el.checked).to.be.true;
    });

    it('should dispatch "false" when toggle is switched OFF', async () => {
        const el = await fixture(html`<mas-plan-type-field value="true"></mas-plan-type-field>`, { parentNode: spTheme() });
        await el.updateComplete;

        const toggle = el.querySelector('sp-switch');
        const listener = oneEvent(el, 'input');

        toggle.checked = false;
        toggle.dispatchEvent(new Event('change', { bubbles: true }));
        const event = await listener;

        expect(event.detail.value).to.equal('false');
        expect(el.checked).to.be.false;
    });

    it('should parse value="true" as checked', async () => {
        const el = await fixture(html`<mas-plan-type-field value="true"></mas-plan-type-field>`, { parentNode: spTheme() });
        await el.updateComplete;

        expect(el.checked).to.be.true;
    });

    it('should parse value="false" as unchecked', async () => {
        const el = await fixture(html`<mas-plan-type-field value="false"></mas-plan-type-field>`, { parentNode: spTheme() });
        await el.updateComplete;

        expect(el.checked).to.be.false;
    });

    it('should parse empty value as unchecked', async () => {
        const el = await fixture(html`<mas-plan-type-field value=""></mas-plan-type-field>`, { parentNode: spTheme() });
        await el.updateComplete;

        expect(el.checked).to.be.false;
    });

    it('should render switch label with provided label', async () => {
        const el = await fixture(html`<mas-plan-type-field label="Show Plan Type" id="plan-type"></mas-plan-type-field>`, {
            parentNode: spTheme(),
        });
        await el.updateComplete;

        const toggle = el.querySelector('sp-switch');
        expect(toggle).to.exist;
        expect(toggle.textContent.trim()).to.equal('Show Plan Type');
    });
});

describe('Plan type tooltip', () => {
    const copy = 'Shows the plan type, for example Annual, paid monthly, with the price.';
    const render = () =>
        fixture(html`<mas-plan-type-field label="Show plan type" tooltip=${copy}></mas-plan-type-field>`, {
            parentNode: spTheme(),
        });

    it('renders an info icon after the switch', async () => {
        const el = await render();
        const trigger = el.querySelector('overlay-trigger');
        const toggle = el.querySelector('sp-switch');
        expect(trigger.compareDocumentPosition(toggle) & Node.DOCUMENT_POSITION_PRECEDING).to.be.ok;
        const button = trigger.querySelector('[slot="trigger"]');
        expect(button.querySelector('sp-icon-info')).to.exist;
        expect(button.getAttribute('aria-label')).to.equal('About Show plan type');
        expect(button.tagName).to.equal('SP-ACTION-BUTTON');
    });

    it('carries the tooltip copy as hover content', async () => {
        const el = await render();
        const tooltip = el.querySelector('sp-tooltip[slot="hover-content"]');
        expect(tooltip.textContent.trim()).to.equal(copy);
    });

    it('keeps the switch text equal to the label', async () => {
        const el = await render();
        expect(el.querySelector('sp-switch').textContent.trim()).to.equal('Show plan type');
    });

    it('renders no tooltip trigger without tooltip', async () => {
        const el = await fixture(html`<mas-plan-type-field label="Show plan type"></mas-plan-type-field>`, {
            parentNode: spTheme(),
        });
        expect(el.querySelector('overlay-trigger')).to.not.exist;
    });
});
