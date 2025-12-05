import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, oneEvent } from '@open-wc/testing-helpers/pure';
import '../../src/swc.js';
import '../../src/fields/mnemonic-field.js';
import { spTheme } from '../utils.js';

describe('Mnemonic field', () => {
    it('should render without default properties', async () => {
        const el = await fixture(html`<mas-mnemonic-field></mas-mnemonic-field>`, { parentNode: spTheme() });
        expect(el.icon).to.equal('');
        expect(el.alt).to.equal('');
        expect(el.link).to.equal('');

        // Check that preview shows placeholder
        const preview = el.shadowRoot.querySelector('.mnemonic-preview');
        expect(preview).to.exist;
        const placeholder = el.shadowRoot.querySelector('.icon-placeholder');
        expect(placeholder).to.exist;
    });

    it('should render with given attributes', async () => {
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
        expect(el.icon).to.equal('https://www.adobe.com/cc-shared/assets/img/product-icons/svg/creative-cloud.svg');
        expect(el.alt).to.equal('This is an alt text');
        expect(el.link).to.equal('https://www.adobe.com/creativecloud/all-apps.html');

        // Check that preview shows icon
        const iconImg = el.shadowRoot.querySelector('.icon-preview img');
        expect(iconImg).to.exist;
        expect(iconImg.src).to.include('creative-cloud.svg');
    });

    it('should open modal when edit button is clicked', async () => {
        const el = await fixture(html`<mas-mnemonic-field></mas-mnemonic-field>`, { parentNode: spTheme() });

        const actionMenu = el.shadowRoot.querySelector('sp-action-menu');
        expect(actionMenu).to.exist;

        actionMenu.click();
        await el.updateComplete;

        const editMenuItem = actionMenu.querySelector('sp-menu-item');
        expect(editMenuItem).to.exist;
        editMenuItem.click();
        await el.updateComplete;

        expect(el.modalOpen).to.be.true;

        const modal = el.shadowRoot.querySelector('mas-mnemonic-modal');
        expect(modal).to.exist;
        expect(modal.open).to.be.true;
    });

    it('should update values when modal saves', async () => {
        const el = await fixture(html`<mas-mnemonic-field></mas-mnemonic-field>`, { parentNode: spTheme() });

        const listener = oneEvent(el, 'change');

        const modal = el.shadowRoot.querySelector('mas-mnemonic-modal');
        modal.dispatchEvent(
            new CustomEvent('save', {
                detail: {
                    icon: 'https://www.adobe.com/cc-shared/assets/img/product-icons/svg/photoshop.svg',
                    alt: 'Photoshop icon',
                    link: 'https://www.adobe.com/photoshop',
                },
            }),
        );

        await listener;

        expect(el.icon).to.equal('https://www.adobe.com/cc-shared/assets/img/product-icons/svg/photoshop.svg');
        expect(el.alt).to.equal('Photoshop icon');
        expect(el.link).to.equal('https://www.adobe.com/photoshop');
    });

    it('should return correct value object', async () => {
        const el = await fixture(
            html`
                <mas-mnemonic-field
                    icon="https://example.com/icon.svg"
                    alt="Test alt"
                    link="https://example.com"
                ></mas-mnemonic-field>
            `,
            { parentNode: spTheme() },
        );

        const value = el.value;
        expect(value).to.deep.equal({
            icon: 'https://example.com/icon.svg',
            alt: 'Test alt',
            link: 'https://example.com',
        });
    });
});
