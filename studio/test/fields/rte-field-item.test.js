import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture } from '@open-wc/testing-helpers/pure';

import '../../src/swc.js';
import '../../src/fields/rte-field-item.js';
import '../../src/mas-confirm-dialog.js';
import '../../../web-components/src/mas-commerce-service.js';
import { mockFetch } from '../../../web-components/test/mocks/fetch.js';
import { withWcs } from '../../../web-components/test/mocks/wcs.js';
import Store from '../../src/store.js';

import { spTheme, delay } from '../utils.js';

async function ensureCommerceSettings() {
    await customElements.whenDefined('mas-commerce-service');
    let masCommerceService = document.querySelector('mas-commerce-service');
    if (!masCommerceService) {
        masCommerceService = document.createElement('mas-commerce-service');
        masCommerceService.setAttribute('data-mas-ff-defaults', 'off');
        masCommerceService.setAttribute('env', 'stage');
        document.body.append(masCommerceService);
        await masCommerceService.updateComplete;
    }
    if (!masCommerceService.settings) {
        Object.defineProperty(masCommerceService, 'settings', {
            value: {
                displayOldPrice: false,
                displayPerUnit: false,
                displayPlanType: false,
                displayRecurrence: false,
                displayTax: false,
                isPerpetual: false,
                checkoutWorkflowStep: undefined,
            },
            writable: true,
            configurable: true,
        });
    }
    if (!masCommerceService.featureFlags) {
        Object.defineProperty(masCommerceService, 'featureFlags', {
            value: { 'mas-ff-defaults': false },
            writable: true,
            configurable: true,
        });
    }
}

before(async () => {
    await mockFetch(withWcs);
    await ensureCommerceSettings();
});

describe('MasRteFieldItem', () => {
    it('should render without throwing an exception', async () => {
        const el = await fixture(html`<mas-rte-field-item></mas-rte-field-item>`, { parentNode: spTheme() });
        expect(el.shadowRoot.querySelector('.wrapper')).to.exist;
    });

    describe('value', () => {
        it('returns an empty object when there is no value or label', async () => {
            const el = await fixture(html`<mas-rte-field-item></mas-rte-field-item>`, { parentNode: spTheme() });
            expect(el.value).to.deep.equal({});
        });

        it('setting the value property updates the getter', async () => {
            const el = await fixture(html`<mas-rte-field-item></mas-rte-field-item>`, { parentNode: spTheme() });
            el.value = '<p>Some content</p>';
            await el.updateComplete;
            expect(el.value).to.deep.equal({ value: '<p>Some content</p>' });
        });

        it('ignores non-string assignments to value', async () => {
            const el = await fixture(html`<mas-rte-field-item></mas-rte-field-item>`, { parentNode: spTheme() });
            el.value = '<p>Kept</p>';
            await el.updateComplete;
            el.value = { value: 'nope' };
            await el.updateComplete;
            expect(el.value).to.deep.equal({ value: '<p>Kept</p>' });
        });

        it('setting the value attribute routes through the value setter', async () => {
            const el = await fixture(html`<mas-rte-field-item></mas-rte-field-item>`, { parentNode: spTheme() });
            el.setAttribute('value', '<p>From attribute</p>');
            await el.updateComplete;
            expect(el.value).to.deep.equal({ value: '<p>From attribute</p>' });
        });

        it('includes both value and label when both are set', async () => {
            const el = await fixture(html`<mas-rte-field-item label="Custom 1"></mas-rte-field-item>`, {
                parentNode: spTheme(),
            });
            el.value = '<p>Text</p>';
            await el.updateComplete;
            expect(el.value).to.deep.equal({ value: '<p>Text</p>', label: 'Custom 1' });
        });
    });

    describe('label locking', () => {
        it('locks the label field once an external label value arrives', async () => {
            const el = await fixture(html`<mas-rte-field-item label="Custom 1"></mas-rte-field-item>`, {
                parentNode: spTheme(),
            });
            const labelField = el.shadowRoot.querySelector('sp-textfield');
            expect(labelField.hasAttribute('readonly')).to.be.true;
        });

        it('does not lock the label field when no label is set', async () => {
            const el = await fixture(html`<mas-rte-field-item></mas-rte-field-item>`, { parentNode: spTheme() });
            const labelField = el.shadowRoot.querySelector('sp-textfield');
            expect(labelField.hasAttribute('readonly')).to.be.false;
        });

        it('locks the label after the user types one in and dispatches change', async () => {
            const el = await fixture(html`<mas-rte-field-item></mas-rte-field-item>`, { parentNode: spTheme() });
            const labelField = el.shadowRoot.querySelector('sp-textfield');

            let changeCount = 0;
            el.addEventListener('change', () => {
                changeCount += 1;
            });

            labelField.value = 'New label';
            const event = new CustomEvent('change', { bubbles: true, composed: true });
            Object.defineProperty(event, 'target', { value: labelField, enumerable: true });
            labelField.dispatchEvent(event);
            await el.updateComplete;

            expect(el.label).to.equal('New label');
            expect(changeCount).to.equal(1);
            expect(el.shadowRoot.querySelector('sp-textfield').hasAttribute('readonly')).to.be.true;
        });

        it('keeps a locked label read-only on click and never offers a rename', async () => {
            const el = await fixture(html`<mas-rte-field-item label="Custom 1"></mas-rte-field-item>`, {
                parentNode: spTheme(),
            });
            const labelField = el.shadowRoot.querySelector('sp-textfield');

            labelField.click();
            await delay(0);
            await el.updateComplete;

            expect(Store.confirmDialogOptions.get()).to.equal(null);
            expect(el.shadowRoot.querySelector('sp-textfield').hasAttribute('readonly')).to.be.true;
        });

        it('does not expose a renameAllowed override', async () => {
            const el = await fixture(html`<mas-rte-field-item></mas-rte-field-item>`, { parentNode: spTheme() });
            expect(el.renameAllowed).to.be.undefined;
        });
    });

    describe('delete', () => {
        it('dispatches delete-field when the delete button of an unnamed field is clicked', async () => {
            const el = await fixture(html`<mas-rte-field-item></mas-rte-field-item>`, { parentNode: spTheme() });
            let fired = false;
            el.addEventListener('delete-field', () => {
                fired = true;
            });
            el.shadowRoot.querySelector('.delete-btn').click();
            expect(fired).to.be.true;
        });

        it('hides the delete button once the label is locked', async () => {
            const el = await fixture(html`<mas-rte-field-item label="Custom 1"></mas-rte-field-item>`, {
                parentNode: spTheme(),
            });
            expect(el.shadowRoot.querySelector('.delete-btn')).to.be.null;
        });
    });

    describe('rte change/input', () => {
        it('updates value and re-dispatches change from the nested rte-field', async () => {
            const el = await fixture(html`<mas-rte-field-item></mas-rte-field-item>`, { parentNode: spTheme() });
            const rte = el.shadowRoot.querySelector('rte-field');

            let changeCount = 0;
            el.addEventListener('change', () => {
                changeCount += 1;
            });

            rte.value = '<p>Rich text</p>';
            const event = new CustomEvent('change', { bubbles: true, composed: true });
            Object.defineProperty(event, 'target', { value: rte, enumerable: true });
            rte.dispatchEvent(event);
            await el.updateComplete;

            expect(el.value).to.deep.equal({ value: '<p>Rich text</p>' });
            expect(changeCount).to.equal(1);
        });

        it('updates value and re-dispatches input from the nested rte-field', async () => {
            const el = await fixture(html`<mas-rte-field-item></mas-rte-field-item>`, { parentNode: spTheme() });
            const rte = el.shadowRoot.querySelector('rte-field');

            let inputCount = 0;
            el.addEventListener('input', () => {
                inputCount += 1;
            });

            rte.value = '<p>Typing…</p>';
            const event = new CustomEvent('input', { bubbles: true, composed: true });
            Object.defineProperty(event, 'target', { value: rte, enumerable: true });
            rte.dispatchEvent(event);
            await el.updateComplete;

            expect(el.value).to.deep.equal({ value: '<p>Typing…</p>' });
            expect(inputCount).to.equal(1);
        });
    });

    it('forwards the osi property to the nested rte-field', async () => {
        const el = await fixture(html`<mas-rte-field-item .osi="${'abc-osi'}"></mas-rte-field-item>`, {
            parentNode: spTheme(),
        });
        const rte = el.shadowRoot.querySelector('rte-field');
        expect(rte.osi).to.equal('abc-osi');
    });
});
