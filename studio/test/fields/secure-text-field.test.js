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
        expect(el.checked).to.be.false;
    });

    it('should have toggle OFF by default', async () => {
        const el = await fixture(html`<secure-text-field></secure-text-field>`, { parentNode: spTheme() });
        await el.updateComplete;

        const toggle = el.querySelector('sp-switch');
        expect(toggle).to.exist;
        expect(toggle.checked).to.be.false;
    });

    it('should dispatch "true" when toggle is switched ON', async () => {
        const el = await fixture(html`<secure-text-field></secure-text-field>`, { parentNode: spTheme() });

        const toggle = el.querySelector('sp-switch');
        const listener = oneEvent(el, 'input');

        toggle.checked = true;
        toggle.dispatchEvent(new Event('change', { bubbles: true }));
        const event = await listener;

        expect(event.detail.value).to.equal('true');
        expect(el.checked).to.be.true;
    });

    it('should dispatch "false" when toggle is switched OFF', async () => {
        const el = await fixture(html`<secure-text-field value="true"></secure-text-field>`, { parentNode: spTheme() });
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
        const el = await fixture(html`<secure-text-field value="true"></secure-text-field>`, { parentNode: spTheme() });
        await el.updateComplete;

        expect(el.checked).to.be.true;
    });

    it('should parse value="false" as unchecked', async () => {
        const el = await fixture(html`<secure-text-field value="false"></secure-text-field>`, { parentNode: spTheme() });
        await el.updateComplete;

        expect(el.checked).to.be.false;
    });

    it('should parse empty value as unchecked', async () => {
        const el = await fixture(html`<secure-text-field value=""></secure-text-field>`, { parentNode: spTheme() });
        await el.updateComplete;

        expect(el.checked).to.be.false;
    });

    it('should treat non-false text values as checked', async () => {
        const el = await fixture(html`<secure-text-field value="{{secure-label-default}}"></secure-text-field>`, {
            parentNode: spTheme(),
        });
        await el.updateComplete;

        expect(el.checked).to.be.true;
    });

    it('should render switch label with provided label', async () => {
        const el = await fixture(html`<secure-text-field label="Secure Transaction" id="secure-field"></secure-text-field>`, {
            parentNode: spTheme(),
        });
        await el.updateComplete;

        const toggle = el.querySelector('sp-switch');
        expect(toggle).to.exist;
        expect(toggle.textContent.trim()).to.equal('Secure Transaction');
    });
});
