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
                            <sp-field-label required for="test1"
                                >Test field</sp-field-label
                            >
                            <sp-textfield
                                class="field"
                                id="test1"
                            ></sp-textfield>
                        </div>
                    </template>
                </mas-multifield>
                ${styles}
            `,
            { parentNode: spTheme() },
        );
        expect(
            el.shadowRoot.querySelectorAll('.field-wrapper').length,
        ).to.equal(0);
        const addButton = el.shadowRoot.querySelector('sp-action-button');
        addButton.click();
        await el.updateComplete;
        expect(
            el.shadowRoot.querySelectorAll('.field-wrapper').length,
        ).to.equal(1);
        const removeButton = el.shadowRoot.querySelector('sp-icon-close');
        removeButton.click();
        await el.updateComplete;
        expect(
            el.shadowRoot.querySelectorAll('.field-wrapper').length,
        ).to.equal(0);
    });

    it('should support min attribute', async () => {
        const el = await fixture(
            html`
                <mas-multifield min="1">
                    <template>
                        <div>
                            <sp-field-label required for="test1"
                                >Test field</sp-field-label
                            >
                            <sp-textfield
                                class="field"
                                id="test1"
                            ></sp-textfield>
                        </div>
                    </template>
                </mas-multifield>
                ${styles}
            `,
            { parentNode: spTheme() },
        );
        expect(
            el.shadowRoot.querySelectorAll('.field-wrapper').length,
        ).to.equal(1);
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
        expect(
            el.shadowRoot.querySelectorAll('.field-wrapper').length,
        ).to.equal(2);

        const [, mnemonic2] =
            el.shadowRoot.querySelectorAll('mas-mnemonic-field');
        const listener = oneEvent(el, 'change');
        mnemonic2.altElement.value = 'This is new alt text';
        mnemonic2.altElement.dispatchEvent(new Event('change'));
        await listener;
        const [value1, value2] = el.value;
        const newValue = [value1, { ...value2, alt: 'This is new alt text' }];
        expect(el.value).to.deep.equal(newValue);
    });
});
