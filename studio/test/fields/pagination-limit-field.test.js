import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, oneEvent } from '@open-wc/testing-helpers/pure';

import '../../src/swc.js';
import '../../src/fields/pagination-limit-field.js';

import { spTheme } from '../utils.js';

describe('PaginationLimitField', () => {
    it('should render without throwing an exception', async () => {
        let error = null;
        let el;
        try {
            el = await fixture(html`<mas-pagination-limit-field></mas-pagination-limit-field>`, {
                parentNode: spTheme(),
            });
        } catch (e) {
            error = e;
        }
        expect(error).to.be.null;
        expect(el).to.exist;
    });

    it('should initialize with toggle off and default limit', async () => {
        const el = await fixture(html`<mas-pagination-limit-field></mas-pagination-limit-field>`, {
            parentNode: spTheme(),
        });

        const toggle = el.shadowRoot.querySelector('sp-switch');
        expect(toggle.checked).to.be.false;
        expect(el.enabled).to.be.false;
        expect(el.limit).to.equal(27);

        // Number field should not be visible when disabled
        const numberField = el.shadowRoot.querySelector('sp-number-field');
        expect(numberField).to.be.null;
    });

    it('should parse numeric value and enable toggle', async () => {
        const el = await fixture(html`<mas-pagination-limit-field value="12"></mas-pagination-limit-field>`, {
            parentNode: spTheme(),
        });

        expect(el.enabled).to.be.true;
        expect(el.limit).to.equal(12);

        const toggle = el.shadowRoot.querySelector('sp-switch');
        expect(toggle.checked).to.be.true;

        const numberField = el.shadowRoot.querySelector('sp-number-field');
        expect(numberField).to.exist;
        expect(numberField.value).to.equal(12);
    });

    it('should show number field when toggle is enabled', async () => {
        const el = await fixture(html`<mas-pagination-limit-field></mas-pagination-limit-field>`, {
            parentNode: spTheme(),
        });

        const toggle = el.shadowRoot.querySelector('sp-switch');
        const listener = oneEvent(el, 'input');

        // Simulate toggle click
        toggle.checked = true;
        toggle.dispatchEvent(new Event('change'));

        await listener;
        await el.updateComplete;

        expect(el.enabled).to.be.true;
        const numberField = el.shadowRoot.querySelector('sp-number-field');
        expect(numberField).to.exist;
    });

    it('should dispatch input event with value when limit changes', async () => {
        const el = await fixture(html`<mas-pagination-limit-field value="9"></mas-pagination-limit-field>`, {
            parentNode: spTheme(),
        });

        const numberField = el.shadowRoot.querySelector('sp-number-field');
        const listener = oneEvent(el, 'input');

        numberField.value = 15;
        numberField.dispatchEvent(new Event('change'));

        const event = await listener;
        expect(event.detail.value).to.equal('15');
    });

    it('should clear value when toggle is disabled', async () => {
        const el = await fixture(html`<mas-pagination-limit-field value="12"></mas-pagination-limit-field>`, {
            parentNode: spTheme(),
        });

        const toggle = el.shadowRoot.querySelector('sp-switch');
        const listener = oneEvent(el, 'input');

        toggle.checked = false;
        toggle.dispatchEvent(new Event('change'));

        const event = await listener;
        expect(event.detail.value).to.equal('');
        expect(el.enabled).to.be.false;
    });

    it('should handle empty string value correctly', async () => {
        const el = await fixture(html`<mas-pagination-limit-field value=""></mas-pagination-limit-field>`, {
            parentNode: spTheme(),
        });

        expect(el.enabled).to.be.false;
        expect(el.limit).to.equal(27); // Default
    });

    it('should handle invalid value gracefully', async () => {
        const el = await fixture(html`<mas-pagination-limit-field value="invalid"></mas-pagination-limit-field>`, {
            parentNode: spTheme(),
        });

        expect(el.enabled).to.be.false;
        expect(el.limit).to.equal(27); // Default
    });

    it('should support custom label', async () => {
        const el = await fixture(html`<mas-pagination-limit-field label="Custom Label"></mas-pagination-limit-field>`, {
            parentNode: spTheme(),
        });

        const label = el.shadowRoot.querySelector('sp-field-label');
        expect(label.textContent).to.equal('Custom Label');
    });

    it('should handle value of zero as disabled', async () => {
        const el = await fixture(html`<mas-pagination-limit-field value="0"></mas-pagination-limit-field>`, {
            parentNode: spTheme(),
        });

        expect(el.enabled).to.be.false;
        expect(el.limit).to.equal(27); // Default
    });

    it('should handle negative values as disabled', async () => {
        const el = await fixture(html`<mas-pagination-limit-field value="-5"></mas-pagination-limit-field>`, {
            parentNode: spTheme(),
        });

        expect(el.enabled).to.be.false;
        expect(el.limit).to.equal(27); // Default
    });

    it('should preserve limit value when toggle is re-enabled', async () => {
        const el = await fixture(html`<mas-pagination-limit-field value="15"></mas-pagination-limit-field>`, {
            parentNode: spTheme(),
        });

        expect(el.limit).to.equal(15);

        const toggle = el.shadowRoot.querySelector('sp-switch');

        // Disable
        toggle.checked = false;
        toggle.dispatchEvent(new Event('change'));
        await el.updateComplete;

        expect(el.value).to.equal('');
        expect(el.limit).to.equal(15); // Limit should be preserved

        // Re-enable
        const listener = oneEvent(el, 'input');
        toggle.checked = true;
        toggle.dispatchEvent(new Event('change'));

        const event = await listener;
        expect(event.detail.value).to.equal('15');
    });

    it('should have default id and label', async () => {
        const el = await fixture(html`<mas-pagination-limit-field></mas-pagination-limit-field>`, {
            parentNode: spTheme(),
        });

        expect(el.id).to.equal('pagination-limit');
        expect(el.label).to.equal('Show More Pagination');
    });

    it('should allow custom id', async () => {
        const el = await fixture(html`<mas-pagination-limit-field id="custom-id"></mas-pagination-limit-field>`, {
            parentNode: spTheme(),
        });

        expect(el.id).to.equal('custom-id');
        const fieldGroup = el.shadowRoot.querySelector('sp-field-group');
        expect(fieldGroup.id).to.equal('custom-id');
    });
});
