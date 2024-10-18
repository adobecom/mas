import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, oneEvent } from '@open-wc/testing-helpers/pure';
import '../../src/swc.js';
import '../../src/fields/mnemonic-field.js';
import { spTheme } from '../utils.js';

describe('Mnemonic field', () => {
    it('should render without default properties', async () => {
        const el = await fixture(
            html`<mas-mnemonic-field></mas-mnemonic-field>`,
            { parentNode: spTheme() },
        );
        expect(el.iconElement.value).to.equal('');
        expect(el.altElement.value).to.equal('');
        expect(el.linkElement.value).to.equal('');
    });

    it('should render with given attributes and update them', async () => {
        const el = await fixture(
            html`
                <mas-mnemonic-field
                    icon="https://www.adobe.com/cc-shared/assets/img/product-icons/svg/creative-cloud.svg"
                    alt="This is an alt text"
                    link="https://www.adobe.com/creativecloud/all-apps.html"
                ></mas-mnemonic-field>
            `,
            { parentNode: spTheme() },
        );
        expect(el.iconElement.value).to.equal(
            'https://www.adobe.com/cc-shared/assets/img/product-icons/svg/creative-cloud.svg',
        );
        expect(el.altElement.value).to.equal('This is an alt text');
        expect(el.linkElement.value).to.equal(
            'https://www.adobe.com/creativecloud/all-apps.html',
        );

        const listener = oneEvent(el, 'change');

        el.altElement.value = 'This is new alt text';
        el.altElement.dispatchEvent(new Event('change'));

        await listener;

        expect(el.alt).equal('This is new alt text');
    });
});
