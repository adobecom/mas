import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, oneEvent } from '@open-wc/testing-helpers/pure';
import '../../src/swc.js';
import '../../src/fields/included-field.js';
import { spTheme } from '../utils.js';

describe('Included field', () => {
    it('should render without default properties', async () => {
        const el = await fixture(html`<mas-included-field></mas-included-field>`, { parentNode: spTheme() });
        expect(el.icon).to.equal('');
        expect(el.alt).to.equal('');
        expect(el.link).to.equal('');
        expect(el.modalOpen).to.be.false;

        const preview = el.shadowRoot.querySelector('.included-preview');
        expect(preview).to.exist;
        expect(el.shadowRoot.querySelector('.icon-placeholder')).to.exist;
    });

    it('should render with given attributes', async () => {
        const el = await fixture(
            html`
                <mas-included-field
                    icon="https://www.adobe.com/cc-shared/assets/img/product-icons/svg/photoshop.svg"
                    alt="Adobe Photoshop"
                    link="https://www.adobe.com/photoshop"
                ></mas-included-field>
            `,
            { parentNode: spTheme() },
        );

        expect(el.icon).to.include('photoshop.svg');
        expect(el.alt).to.equal('Adobe Photoshop');
        expect(el.link).to.equal('https://www.adobe.com/photoshop');

        const iconImg = el.shadowRoot.querySelector('.icon-preview img');
        expect(iconImg).to.exist;
    });

    it('should show description in preview when icon is missing', async () => {
        const el = await fixture(html`<mas-included-field alt="Plans and pricing"></mas-included-field>`, {
            parentNode: spTheme(),
        });

        const valueEl = el.shadowRoot.querySelector('.included-info .value');
        expect(valueEl.textContent).to.include('Plans and pricing');
    });

    it('should show plain text extracted from RTE paragraph in preview when icon is missing', async () => {
        const el = await fixture(html`<mas-included-field alt="<p>Creative Cloud</p>"></mas-included-field>`, {
            parentNode: spTheme(),
        });

        const valueEl = el.shadowRoot.querySelector('.included-info .value');
        expect(valueEl.textContent).to.include('Creative Cloud');
        expect(valueEl.textContent).to.not.include('<p>');
    });

    it('parseTextFromHtml returns markup unchanged when not paragraph HTML', async () => {
        const el = await fixture(html`<mas-included-field></mas-included-field>`, { parentNode: spTheme() });

        expect(el.parseTextFromHtml('')).to.equal('');
        expect(el.parseTextFromHtml('Plain label')).to.equal('Plain label');
        expect(el.parseTextFromHtml('<div>x</div>')).to.equal('<div>x</div>');
    });

    it('parseTextFromHtml extracts paragraph text content', async () => {
        const el = await fixture(html`<mas-included-field></mas-included-field>`, { parentNode: spTheme() });

        expect(el.parseTextFromHtml('<p>Nested</p>')).to.equal('Nested');
    });

    it('should not dispatch delete-field when modal closes with RTE paragraph alt (no icon or link)', async () => {
        const el = await fixture(html`<mas-included-field alt="<p>Fresco</p>"></mas-included-field>`, {
            parentNode: spTheme(),
        });

        el.modalOpen = true;
        await el.updateComplete;

        let deleteFired = false;
        el.addEventListener('delete-field', () => {
            deleteFired = true;
        });

        el.shadowRoot
            .querySelector('mas-mnemonic-modal')
            .dispatchEvent(new CustomEvent('modal-close', { bubbles: true, composed: true }));
        await el.updateComplete;

        expect(deleteFired).to.be.false;
    });

    it('should dispatch delete-field when modal closes with empty paragraph alt only', async () => {
        const el = await fixture(html`<mas-included-field alt="<p>  </p>"></mas-included-field>`, {
            parentNode: spTheme(),
        });

        el.modalOpen = true;
        await el.updateComplete;

        const listener = oneEvent(el, 'delete-field');
        el.shadowRoot
            .querySelector('mas-mnemonic-modal')
            .dispatchEvent(new CustomEvent('modal-close', { bubbles: true, composed: true }));

        await listener;
    });

    it('should open modal when edit is selected from action menu', async () => {
        const el = await fixture(html`<mas-included-field></mas-included-field>`, { parentNode: spTheme() });

        const actionMenu = el.shadowRoot.querySelector('sp-action-menu');
        actionMenu.value = 'edit';
        actionMenu.dispatchEvent(new Event('change', { bubbles: true }));
        await el.updateComplete;

        expect(el.modalOpen).to.be.true;
        expect(el.shadowRoot.querySelector('mas-mnemonic-modal')?.open).to.be.true;
    });

    it('should dispatch delete-field when modal closes with no icon, alt, or link', async () => {
        const el = await fixture(html`<mas-included-field></mas-included-field>`, { parentNode: spTheme() });

        el.modalOpen = true;
        await el.updateComplete;

        const listener = oneEvent(el, 'delete-field');
        const modal = el.shadowRoot.querySelector('mas-mnemonic-modal');
        modal.dispatchEvent(new CustomEvent('modal-close', { bubbles: true, composed: true }));

        await listener;
        expect(el.modalOpen).to.be.false;
    });

    it('should not dispatch delete-field when modal closes with description only (no icon)', async () => {
        const el = await fixture(html`<mas-included-field alt="Creative Cloud"></mas-included-field>`, {
            parentNode: spTheme(),
        });

        el.modalOpen = true;
        await el.updateComplete;

        let deleteFired = false;
        el.addEventListener('delete-field', () => {
            deleteFired = true;
        });

        el.shadowRoot
            .querySelector('mas-mnemonic-modal')
            .dispatchEvent(new CustomEvent('modal-close', { bubbles: true, composed: true }));
        await el.updateComplete;

        expect(deleteFired).to.be.false;
        expect(el.modalOpen).to.be.false;
    });

    it('should not dispatch delete-field when modal closes with link only (no icon)', async () => {
        const el = await fixture(html`<mas-included-field link="https://www.adobe.com"></mas-included-field>`, {
            parentNode: spTheme(),
        });

        el.modalOpen = true;
        await el.updateComplete;

        let deleteFired = false;
        el.addEventListener('delete-field', () => {
            deleteFired = true;
        });

        el.shadowRoot
            .querySelector('mas-mnemonic-modal')
            .dispatchEvent(new CustomEvent('modal-close', { bubbles: true, composed: true }));
        await el.updateComplete;

        expect(deleteFired).to.be.false;
    });

    it('should update values and dispatch change when modal saves', async () => {
        const el = await fixture(html`<mas-included-field></mas-included-field>`, { parentNode: spTheme() });

        const listener = oneEvent(el, 'change');

        el.shadowRoot.querySelector('mas-mnemonic-modal').dispatchEvent(
            new CustomEvent('save', {
                bubbles: true,
                composed: true,
                detail: {
                    icon: 'https://www.adobe.com/cc-shared/assets/img/product-icons/svg/photoshop.svg',
                    alt: 'Photoshop',
                    link: '',
                },
            }),
        );

        await listener;

        expect(el.icon).to.include('photoshop.svg');
        expect(el.alt).to.equal('Photoshop');
        expect(el.link).to.equal('');
    });

    it('should return correct value object', async () => {
        const el = await fixture(
            html`
                <mas-included-field
                    icon="https://example.com/icon.svg"
                    alt="Alt"
                    link="https://example.com"
                ></mas-included-field>
            `,
            { parentNode: spTheme() },
        );

        expect(el.value).to.deep.equal({
            icon: 'https://example.com/icon.svg',
            alt: 'Alt',
            link: 'https://example.com',
        });
    });
});
