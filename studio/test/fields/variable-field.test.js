import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, fixtureCleanup } from '@open-wc/testing-helpers/pure';

import '../../src/swc.js';
import '../../src/fields/variable-field.js';

import { spTheme } from '../utils.js';

describe('mas-variable-field', () => {
    afterEach(() => fixtureCleanup());

    it('renders two text inputs and a delete button', async () => {
        const el = await fixture(html`<mas-variable-field></mas-variable-field>`, { parentNode: spTheme() });
        await el.updateComplete;
        const fields = el.shadowRoot.querySelectorAll('sp-textfield');
        expect(fields.length).to.equal(2);
        expect(el.shadowRoot.querySelector('sp-action-button')).to.not.equal(null);
    });

    it('parses value attribute into key and val', async () => {
        const el = await fixture(html`<mas-variable-field></mas-variable-field>`, { parentNode: spTheme() });
        el.setAttribute('value', 'theme:dark');
        await el.updateComplete;
        expect(el.value).to.equal('theme:dark');
    });

    it('splits on first colon only, preserving colons in value', async () => {
        const el = await fixture(html`<mas-variable-field></mas-variable-field>`, { parentNode: spTheme() });
        el.setAttribute('value', 'url:https://example.com');
        await el.updateComplete;
        expect(el.value).to.equal('url:https://example.com');
    });

    it('handles value with no colon: key is full string, val is empty', async () => {
        const el = await fixture(html`<mas-variable-field></mas-variable-field>`, { parentNode: spTheme() });
        el.setAttribute('value', 'nocodon');
        await el.updateComplete;
        expect(el.value).to.equal('nocodon:');
    });

    it('updates key and re-emits composed input event on key field change', async () => {
        const el = await fixture(html`<mas-variable-field value="k:v"></mas-variable-field>`, {
            parentNode: spTheme(),
        });
        await el.updateComplete;

        const keyField = el.shadowRoot.querySelectorAll('sp-textfield')[0];
        keyField.value = 'newkey';

        let fired = false;
        el.addEventListener('input', () => {
            fired = true;
        });

        keyField.dispatchEvent(new Event('input', { bubbles: true, composed: true }));

        expect(fired).to.be.true;
        expect(el.value).to.equal('newkey:v');
    });

    it('updates val and re-emits composed input event on value field change', async () => {
        const el = await fixture(html`<mas-variable-field value="k:v"></mas-variable-field>`, {
            parentNode: spTheme(),
        });
        await el.updateComplete;

        const valField = el.shadowRoot.querySelectorAll('sp-textfield')[1];
        valField.value = 'newval';

        let fired = false;
        el.addEventListener('input', () => {
            fired = true;
        });

        valField.dispatchEvent(new Event('input', { bubbles: true, composed: true }));

        expect(fired).to.be.true;
        expect(el.value).to.equal('k:newval');
    });

    it('inner input events do not bubble out of the host', async () => {
        const el = await fixture(html`<mas-variable-field value="k:v"></mas-variable-field>`, {
            parentNode: spTheme(),
        });
        await el.updateComplete;

        const keyField = el.shadowRoot.querySelectorAll('sp-textfield')[0];
        keyField.value = 'x';

        const parentEvents = [];
        el.parentElement.addEventListener('input', (e) => parentEvents.push(e));

        keyField.dispatchEvent(new Event('input', { bubbles: true, composed: true }));

        // Only the re-emitted composed event from the host should reach the parent,
        // not the raw inner event (which is stopPropagation'd).
        expect(parentEvents.length).to.equal(1);
        expect(parentEvents[0].target).to.equal(el);
    });

    it('fires delete-field event from delete button', async () => {
        const el = await fixture(html`<mas-variable-field></mas-variable-field>`, { parentNode: spTheme() });
        await el.updateComplete;

        let fired = false;
        el.addEventListener('delete-field', () => {
            fired = true;
        });

        el.shadowRoot.querySelector('sp-action-button').click();
        expect(fired).to.be.true;
    });
});
