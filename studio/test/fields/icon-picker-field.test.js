import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, oneEvent } from '@open-wc/testing-helpers/pure';
import '../../src/swc.js';
import '../../src/fields/icon-picker-field.js';
import { spTheme } from '../utils.js';

describe('Icon picker field', () => {
    it('should render without default properties', async () => {
        const el = await fixture(html`<mas-icon-picker-field></mas-icon-picker-field>`, { parentNode: spTheme() });
        expect(el.icon).to.equal('');
        expect(el.description).to.equal('');
        expect(el.alt).to.equal('');
        expect(el.link).to.equal('');
        expect(el.modalOpen).to.be.false;

        const preview = el.shadowRoot.querySelector('.included-preview');
        expect(preview).to.exist;
        const placeholder = el.shadowRoot.querySelector('.icon-placeholder');
        expect(placeholder).to.exist;
    });

    it('should render with given attributes', async () => {
        const el = await fixture(
            html`
                <mas-icon-picker-field
                    icon="https://www.adobe.com/cc-shared/assets/img/product-icons/svg/photoshop.svg"
                    description="Adobe Photoshop"
                    alt="Photoshop icon"
                    link="https://www.adobe.com/photoshop"
                ></mas-icon-picker-field>
            `,
            { parentNode: spTheme() },
        );
        expect(el.icon).to.equal('https://www.adobe.com/cc-shared/assets/img/product-icons/svg/photoshop.svg');
        expect(el.description).to.equal('Adobe Photoshop');
        expect(el.alt).to.equal('Photoshop icon');
        expect(el.link).to.equal('https://www.adobe.com/photoshop');

        const iconImg = el.shadowRoot.querySelector('.icon-preview img');
        expect(iconImg).to.exist;
        expect(iconImg.src).to.include('photoshop.svg');
    });

    it('should open modal when edit is selected from action menu', async () => {
        const el = await fixture(html`<mas-icon-picker-field></mas-icon-picker-field>`, { parentNode: spTheme() });

        const actionMenu = el.shadowRoot.querySelector('sp-action-menu');
        expect(actionMenu).to.exist;

        actionMenu.value = 'edit';
        actionMenu.dispatchEvent(new Event('change', { bubbles: true }));
        await el.updateComplete;

        expect(el.modalOpen).to.be.true;

        const modal = el.shadowRoot.querySelector('mas-icon-picker-modal');
        expect(modal).to.exist;
        expect(modal.open).to.be.true;
    });

    it('should open modal via public openModal() method', async () => {
        const el = await fixture(html`<mas-icon-picker-field></mas-icon-picker-field>`, { parentNode: spTheme() });

        expect(el.modalOpen).to.be.false;
        el.openModal();
        await el.updateComplete;

        expect(el.modalOpen).to.be.true;
    });

    it('should dispatch delete-field when delete is selected from action menu', async () => {
        const el = await fixture(html`<mas-icon-picker-field></mas-icon-picker-field>`, { parentNode: spTheme() });

        const listener = oneEvent(el, 'delete-field');
        const actionMenu = el.shadowRoot.querySelector('sp-action-menu');
        actionMenu.value = 'delete';
        actionMenu.dispatchEvent(new Event('change', { bubbles: true }));

        const event = await listener;
        expect(event).to.exist;
    });

    it('should dispatch delete-field when modal closes with no icon selected', async () => {
        const el = await fixture(html`<mas-icon-picker-field></mas-icon-picker-field>`, { parentNode: spTheme() });

        el.modalOpen = true;
        await el.updateComplete;

        const listener = oneEvent(el, 'delete-field');
        const modal = el.shadowRoot.querySelector('mas-icon-picker-modal');
        modal.dispatchEvent(new CustomEvent('modal-close', { bubbles: true, composed: true }));

        const event = await listener;
        expect(event).to.exist;
        expect(el.modalOpen).to.be.false;
    });

    it('should not dispatch delete-field when modal closes and icon is already set', async () => {
        const el = await fixture(html`<mas-icon-picker-field icon="https://example.com/icon.svg"></mas-icon-picker-field>`, {
            parentNode: spTheme(),
        });

        el.modalOpen = true;
        await el.updateComplete;

        let deleteFired = false;
        el.addEventListener('delete-field', () => {
            deleteFired = true;
        });

        const modal = el.shadowRoot.querySelector('mas-icon-picker-modal');
        modal.dispatchEvent(new CustomEvent('modal-close', { bubbles: true, composed: true }));
        await el.updateComplete;

        expect(el.modalOpen).to.be.false;
        expect(deleteFired).to.be.false;
    });

    it('should update values and dispatch change when modal saves', async () => {
        const el = await fixture(html`<mas-icon-picker-field></mas-icon-picker-field>`, { parentNode: spTheme() });

        const listener = oneEvent(el, 'change');

        const modal = el.shadowRoot.querySelector('mas-icon-picker-modal');
        modal.dispatchEvent(
            new CustomEvent('save', {
                detail: {
                    icon: 'https://www.adobe.com/cc-shared/assets/img/product-icons/svg/photoshop.svg',
                    description: 'Photoshop',
                    alt: 'Photoshop icon',
                    link: '',
                },
            }),
        );

        await listener;

        expect(el.icon).to.equal('https://www.adobe.com/cc-shared/assets/img/product-icons/svg/photoshop.svg');
        expect(el.description).to.equal('Photoshop');
        expect(el.alt).to.equal('Photoshop icon');
        expect(el.link).to.equal('');
        expect(el.modalOpen).to.be.false;
    });

    it('should return correct value object', async () => {
        const el = await fixture(
            html`
                <mas-icon-picker-field
                    icon="https://example.com/icon.svg"
                    description="Test icon"
                    alt="Test alt"
                    link="https://example.com"
                ></mas-icon-picker-field>
            `,
            { parentNode: spTheme() },
        );

        const value = el.value;
        expect(value).to.deep.equal({
            icon: 'https://example.com/icon.svg',
            description: 'Test icon',
            alt: 'Test alt',
            link: 'https://example.com',
        });
    });

    it('should render sp-icon for spectrum icon prefix', async () => {
        const el = await fixture(html`<mas-icon-picker-field icon="sp-icon-star"></mas-icon-picker-field>`, {
            parentNode: spTheme(),
        });

        const img = el.shadowRoot.querySelector('.icon-preview img');
        expect(img).to.not.exist;

        const iconPreview = el.shadowRoot.querySelector('.icon-preview');
        expect(iconPreview).to.exist;
        expect(iconPreview.textContent.trim()).to.equal('');
    });

    it('should display filename as name for arbitrary icon URL', async () => {
        const el = await fixture(
            html`<mas-icon-picker-field icon="https://example.com/my-custom-icon.svg"></mas-icon-picker-field>`,
            { parentNode: spTheme() },
        );

        const valueEl = el.shadowRoot.querySelector('.included-info .value');
        expect(valueEl.textContent).to.include('my-custom-icon.svg');
    });

    it('should fall back to full icon URL when last path segment is empty', async () => {
        const el = await fixture(html`<mas-icon-picker-field icon="https://example.com/"></mas-icon-picker-field>`, {
            parentNode: spTheme(),
        });

        const valueEl = el.shadowRoot.querySelector('.included-info .value');
        expect(valueEl.textContent).to.include('https://example.com/');
    });

    it('should display product name from product icon URL', async () => {
        const el = await fixture(
            html`<mas-icon-picker-field
                icon="https://www.adobe.com/cc-shared/assets/img/product-icons/svg/photoshop.svg"
            ></mas-icon-picker-field>`,
            { parentNode: spTheme() },
        );

        const valueEl = el.shadowRoot.querySelector('.included-info .value');
        expect(valueEl.textContent).to.include('Photoshop');
    });

    it('should show "No icon selected" text when no icon is set', async () => {
        const el = await fixture(html`<mas-icon-picker-field></mas-icon-picker-field>`, { parentNode: spTheme() });

        const valueEl = el.shadowRoot.querySelector('.included-info .value');
        expect(valueEl).to.exist;
        expect(valueEl.textContent).to.include('No icon selected');
    });

    it('should ignore unknown action menu values', async () => {
        const el = await fixture(html`<mas-icon-picker-field></mas-icon-picker-field>`, { parentNode: spTheme() });

        let deleteFired = false;
        el.addEventListener('delete-field', () => {
            deleteFired = true;
        });

        const actionMenu = el.shadowRoot.querySelector('sp-action-menu');
        actionMenu.value = 'unknown-action';
        actionMenu.dispatchEvent(new Event('change', { bubbles: true }));
        await el.updateComplete;

        expect(el.modalOpen).to.be.false;
        expect(deleteFired).to.be.false;
    });

    it('should accept a variant property', async () => {
        const el = await fixture(html`<mas-icon-picker-field icon="sp-icon-star" variant="plans"></mas-icon-picker-field>`, {
            parentNode: spTheme(),
        });

        expect(el.variant).to.equal('plans');
    });
});
