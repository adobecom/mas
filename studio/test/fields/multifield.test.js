import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, oneEvent } from '@open-wc/testing-helpers/pure';

import '../../src/swc.js';
import '../../src/fields/multifield.js';
import '../../src/fields/mnemonic-field.js';

import { spTheme } from '../utils.js';

const styles = html`<style>
    mas-multifield {
        width: 600px;
    }
</style>`;

describe('Multifield', () => {
    it('should render without throwing an exception', async () => {
        let error = null;
        let el;
        try {
            el = await fixture(html`<mas-multifield></mas-multifield>`, {
                parentNode: spTheme(),
            });
        } catch (e) {
            error = e;
        }
        expect(error).to.be.null;
        expect(el.shadowRoot.textContent).to.equal('');
    });

    it('should support adding/removing', async () => {
        const el = await fixture(
            html`
                <mas-multifield>
                    <template>
                        <div>
                            <sp-field-label required for="test1">Test field</sp-field-label>
                            <sp-textfield class="field" id="test1"></sp-textfield>
                        </div>
                    </template>
                </mas-multifield>
                ${styles}
            `,
            { parentNode: spTheme() },
        );
        expect(el.shadowRoot.querySelectorAll('.field-wrapper').length).to.equal(0);
        const addButton = el.shadowRoot.querySelector('sp-action-button');
        addButton.click();
        await el.updateComplete;
        expect(el.shadowRoot.querySelectorAll('.field-wrapper').length).to.equal(1);
        const fieldWrapper = el.shadowRoot.querySelector('.field-wrapper');
        fieldWrapper.dispatchEvent(
            new CustomEvent('delete-field', {
                bubbles: true,
                composed: true,
            }),
        );
        await el.updateComplete;
        expect(el.shadowRoot.querySelectorAll('.field-wrapper').length).to.equal(0);
    });

    it('should support min attribute', async () => {
        const el = await fixture(
            html`
                <mas-multifield min="1">
                    <template>
                        <div>
                            <sp-field-label required for="test1">Test field</sp-field-label>
                            <sp-textfield class="field" id="test1"></sp-textfield>
                        </div>
                    </template>
                </mas-multifield>
                ${styles}
            `,
            { parentNode: spTheme() },
        );
        expect(el.shadowRoot.querySelectorAll('.field-wrapper').length).to.equal(1);
    });

    it('forwards the variant attribute to each rendered field', async () => {
        const el = await fixture(
            html`
                <mas-multifield variant="pro" .value="${[{ value: 'a' }]}">
                    <template>
                        <sp-textfield class="field"></sp-textfield>
                    </template>
                </mas-multifield>
                ${styles}
            `,
            { parentNode: spTheme() },
        );
        await el.updateComplete;
        const field = el.shadowRoot.querySelector('.field-wrapper .field');
        expect(field).to.exist;
        expect(field.getAttribute('variant')).to.equal('pro');
    });

    it('should support mas-mnemonic-field', async () => {
        const value = [
            {
                icon: 'https://www.adobe.com/cc-shared/assets/img/product-icons/svg/creative-cloud.svg',
                alt: 'This is an alt text',
                link: 'https://www.adobe.com/creativecloud/all-apps.html',
            },
            {
                icon: 'https://www.adobe.com/cc-shared/assets/img/product-icons/svg/creative-cloud.svg',
                alt: 'This is an alt text',
                link: 'https://www.adobe.com/creativecloud/all-apps.html',
            },
        ];
        const el = await fixture(
            html`
                <mas-multifield .value="${value}">
                    <template>
                        <mas-mnemonic-field></mas-mnemonic-field>
                    </template>
                </mas-multifield>
                ${styles}
            `,
            { parentNode: spTheme() },
        );
        expect(el.shadowRoot.querySelectorAll('.field-wrapper').length).to.equal(2);

        const [, mnemonic2] = el.shadowRoot.querySelectorAll('mas-mnemonic-field');
        const listener = oneEvent(el, 'input');
        mnemonic2.alt = 'This is new alt text';
        const event = new CustomEvent('input', {
            bubbles: true,
            composed: true,
        });
        Object.defineProperty(event, 'target', {
            value: mnemonic2,
            enumerable: true,
        });
        mnemonic2.dispatchEvent(event);
        await listener;
        const [value1, value2] = el.value;
        const newValue = [value1, { ...value2, alt: 'This is new alt text' }];
        expect(el.value).to.deep.equal(newValue);
    });

    it('recovers values from the DOM when addField runs after a silent external reduction while focused', async () => {
        const el = await fixture(
            html`
                <mas-multifield .value="${[{ value: 'a' }, { value: 'b' }]}">
                    <template>
                        <sp-textfield class="field"></sp-textfield>
                    </template>
                </mas-multifield>
                ${styles}
            `,
            { parentNode: spTheme() },
        );
        await el.updateComplete;
        expect(el.shadowRoot.querySelectorAll('.field-wrapper').length).to.equal(2);

        const fields = el.shadowRoot.querySelectorAll('.field');
        fields[1].focus();
        expect(el.shadowRoot.activeElement).to.equal(fields[1]);

        // Simulate the parent silently reducing .value while a child has focus — the focus
        // guard in shouldUpdate skips the render, so the DOM keeps showing both fields.
        el.value = [{ value: 'a' }];
        await el.updateComplete;
        expect(el.shadowRoot.querySelectorAll('.field-wrapper').length).to.equal(2);

        await el.addField();

        // The second field's value ('b') must be recovered from the DOM rather than lost.
        expect(el.value).to.deep.equal([{ value: 'a' }, { value: 'b' }, {}]);
        expect(el.shadowRoot.querySelectorAll('.field-wrapper').length).to.equal(3);
    });

    it('re-adds the field if a concurrent external update overwrites .value mid-add', async () => {
        const el = await fixture(
            html`
                <mas-multifield .value="${[{ value: 'a' }]}">
                    <template>
                        <sp-textfield class="field"></sp-textfield>
                    </template>
                </mas-multifield>
                ${styles}
            `,
            { parentNode: spTheme() },
        );
        await el.updateComplete;

        const addPromise = el.addField();
        // Simulate a concurrent parent re-render overwriting .value before addField's own
        // render (and its `await this.updateComplete`) resolves.
        el.value = el.value.slice(0, 1);
        await addPromise;

        expect(el.value).to.have.length(2);
        expect(el.shadowRoot.querySelectorAll('.field-wrapper').length).to.equal(2);
    });

    it('dispatches change on addField when dispatch-on-add is set', async () => {
        const el = await fixture(
            html`
                <mas-multifield dispatch-on-add>
                    <template>
                        <sp-textfield class="field"></sp-textfield>
                    </template>
                </mas-multifield>
                ${styles}
            `,
            { parentNode: spTheme() },
        );
        await el.updateComplete;
        const listener = oneEvent(el, 'change');
        el.addField();
        await listener;
        expect(el.value).to.have.length(1);
    });

    it('dispatches change synchronously on removeField without waiting for its own render', async () => {
        const el = await fixture(
            html`
                <mas-multifield .value="${[{ value: 'a' }]}">
                    <template>
                        <sp-textfield class="field"></sp-textfield>
                    </template>
                </mas-multifield>
                ${styles}
            `,
            { parentNode: spTheme() },
        );
        await el.updateComplete;

        let fired = false;
        el.addEventListener('change', () => {
            fired = true;
        });
        el.removeField(0);
        // The dispatch must happen synchronously, not after an internal `await updateComplete` —
        // otherwise callers awaiting a *different* element's updateComplete could miss it.
        expect(fired).to.be.true;

        await el.updateComplete;
        expect(el.value).to.have.length(0);
    });

    it('pads .value when handling change for a field beyond .value.length (parent silently reduced while focused)', async () => {
        const el = await fixture(
            html`
                <mas-multifield .value="${[{ value: 'a' }, { value: 'b' }]}">
                    <template>
                        <sp-textfield class="field"></sp-textfield>
                    </template>
                </mas-multifield>
                ${styles}
            `,
            { parentNode: spTheme() },
        );
        await el.updateComplete;
        const fields = el.shadowRoot.querySelectorAll('.field');
        fields[1].focus();
        el.value = [{ value: 'a' }];
        await el.updateComplete;
        expect(el.shadowRoot.querySelectorAll('.field-wrapper').length).to.equal(2);

        const listener = oneEvent(el, 'change');
        const event = new CustomEvent('change', { bubbles: true, composed: true });
        Object.defineProperty(event, 'target', { value: fields[1], enumerable: true });
        fields[1].value = 'c';
        fields[1].dispatchEvent(event);
        await listener;

        expect(el.value).to.deep.equal([{ value: 'a' }, { value: 'c' }]);
    });

    it('pads .value when handling input for a field beyond .value.length (parent silently reduced while focused)', async () => {
        const el = await fixture(
            html`
                <mas-multifield .value="${[{ value: 'a' }, { value: 'b' }]}">
                    <template>
                        <sp-textfield class="field"></sp-textfield>
                    </template>
                </mas-multifield>
                ${styles}
            `,
            { parentNode: spTheme() },
        );
        await el.updateComplete;
        const fields = el.shadowRoot.querySelectorAll('.field');
        fields[1].focus();
        el.value = [{ value: 'a' }];
        await el.updateComplete;

        const listener = oneEvent(el, 'input');
        const event = new CustomEvent('input', { bubbles: true, composed: true });
        Object.defineProperty(event, 'target', { value: fields[1], enumerable: true });
        fields[1].value = 'c';
        fields[1].dispatchEvent(event);
        await listener;

        expect(el.value).to.deep.equal([{ value: 'a' }, { value: 'c' }]);
    });
});
