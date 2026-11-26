import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, oneEvent } from '@open-wc/testing-helpers/pure';
import '../../src/swc.js';
import '../../src/fields/mnemonic-field.js';
import '../../src/fields/icon-select.js';
import { imageRowStyles } from '../../src/common/fields/image-row.css.js';
import { spTheme } from '../utils.js';

describe('Mnemonic field', () => {
    it('shows the icon select placeholder with a default and an override', async () => {
        const def = await fixture(html`<mas-icon-select></mas-icon-select>`, { parentNode: spTheme() });
        expect(def.shadowRoot.querySelector('.placeholder').textContent.trim()).to.equal('Select icon');
        const custom = await fixture(html`<mas-icon-select placeholder="Please select"></mas-icon-select>`, {
            parentNode: spTheme(),
        });
        expect(custom.shadowRoot.querySelector('.placeholder').textContent.trim()).to.equal('Please select');
    });

    it('shows the Add icon button in badge mode and no change on cancel', async () => {
        const el = await fixture(html`<mas-mnemonic-field .iconLibrary=${true} .badgeIcon=${true}></mas-mnemonic-field>`, {
            parentNode: spTheme(),
        });
        let changed = false;
        el.addEventListener('change', () => (changed = true));
        el.shadowRoot.querySelector('sp-action-button').click();
        await el.updateComplete;
        const modal = el.shadowRoot.querySelector('mas-mnemonic-modal');
        await modal.updateComplete;
        modal.shadowRoot.querySelector('sp-button[variant="secondary"]').click();
        await el.updateComplete;
        expect(changed).to.be.false;
        expect(el.shadowRoot.querySelector('.add-button-wrapper--quiet')).to.exist;
    });

    it('shows that a visual comes from the baseline', async () => {
        const el = await fixture(
            html`<mas-mnemonic-field icon="baseline.svg" data-field-state="baseline"></mas-mnemonic-field>`,
            {
                parentNode: spTheme(),
            },
        );
        const note = el.shadowRoot.querySelector('.field-status-indicator--baseline');
        expect(note.textContent.trim()).to.equal('From baseline');
    });

    it('does not show a baseline note for other visuals', async () => {
        const el = await fixture(html`<mas-mnemonic-field icon="own.svg" data-field-state="overridden"></mas-mnemonic-field>`, {
            parentNode: spTheme(),
        });
        expect(el.shadowRoot.querySelector('.field-status-indicator--baseline')).to.be.null;
    });

    it('offers to restore an overridden visual', async () => {
        const el = await fixture(html`<mas-mnemonic-field icon="own.svg" data-field-state="overridden"></mas-mnemonic-field>`, {
            parentNode: spTheme(),
        });
        const link = el.shadowRoot.querySelector('.field-status-restore-link');
        expect(link.textContent).to.include('Click to restore');
        const restore = oneEvent(el, 'restore-field');
        link.click();
        const event = await restore;
        expect(event.composed).to.be.true;
    });

    it('leaves the status of an icon library control to its badge section', async () => {
        const el = await fixture(html`<mas-mnemonic-field icon="own.svg" data-field-state="overridden"></mas-mnemonic-field>`, {
            parentNode: spTheme(),
        });
        el.iconLibrary = true;
        await el.updateComplete;
        expect(el.shadowRoot.querySelector('.field-status-indicator')).to.be.null;
    });

    it('renders the shared image row style', async () => {
        const el = await fixture(html`<mas-mnemonic-field icon="own.svg" alt="Photoshop icon"></mas-mnemonic-field>`, {
            parentNode: spTheme(),
        });
        const preview = getComputedStyle(el.shadowRoot.querySelector('.mnemonic-preview'));
        expect(preview.borderTopWidth).to.equal('2px');
        expect(preview.borderTopLeftRadius).to.equal('10px');
        expect(preview.paddingTop).to.equal('12px');
        expect(preview.columnGap).to.equal('8px');
        expect(preview.boxShadow).to.equal('none');
        expect(preview.cursor).to.equal('pointer');
        const box = el.shadowRoot.querySelector('.image-row-icon').getBoundingClientRect();
        expect(box.width).to.equal(40);
        expect(box.height).to.equal(40);
        const value = getComputedStyle(el.shadowRoot.querySelector('.image-row-name'));
        expect(value.fontWeight).to.equal('500');
        expect(value.lineHeight).to.equal('18px');
    });

    it('renders the row as a keyboard-focusable button with the shared classes', async () => {
        const el = await fixture(html`<mas-mnemonic-field icon="own.svg" alt="Photoshop icon"></mas-mnemonic-field>`, {
            parentNode: spTheme(),
        });
        const row = el.shadowRoot.querySelector('.image-row');
        expect(row.classList.contains('mnemonic-preview')).to.be.true;
        expect(row.getAttribute('role')).to.equal('button');
        expect(row.getAttribute('tabindex')).to.equal('0');
        expect(row.querySelector(':scope > .image-row-icon')).to.exist;
        expect(row.querySelector(':scope > .image-row-text')).to.exist;
    });

    it('defines the shared image row rules', () => {
        const cssText = imageRowStyles.cssText;
        for (const selector of [
            '.image-row',
            '.image-row:hover',
            '.image-row:focus-visible',
            '.image-row-icon',
            '.image-row-icon img',
            '.image-row-icon sp-theme',
            '.image-row-icon sp-theme > *',
            '.image-row-text',
            '.image-row-name',
            '.image-row-description',
            '.image-row .action-menu',
            '.image-row .action-menu sp-menu',
        ]) {
            expect(cssText).to.include(selector);
        }
        for (const value of [
            'var(--spectrum-white, #fff)',
            '2px solid var(--spectrum-gray-300, #dadada)',
            'border-radius: 10px',
            'var(--spectrum-gray-200, #e9e9e9)',
            'var(--spectrum-gray-800, #292929)',
            'var(--spectrum-gray-700, #505050)',
            'cursor: pointer',
        ]) {
            expect(cssText).to.include(value);
        }
    });

    it('adopts hover and focus-visible rules for the row', async () => {
        const el = await fixture(html`<mas-mnemonic-field icon="own.svg"></mas-mnemonic-field>`, { parentNode: spTheme() });
        const selectors = el.shadowRoot.adoptedStyleSheets.flatMap((sheet) =>
            [...sheet.cssRules].map((rule) => rule.selectorText),
        );
        expect(selectors.some((selector) => selector?.includes('.image-row:hover'))).to.be.true;
        expect(selectors.some((selector) => selector?.includes('.image-row:focus-visible'))).to.be.true;
    });

    for (const iconLibrary of [false, true]) {
        it(`opens the modal on row click, Enter and Space with iconLibrary ${iconLibrary}`, async () => {
            const el = await fixture(html`<mas-mnemonic-field icon="own.svg"></mas-mnemonic-field>`, { parentNode: spTheme() });
            el.iconLibrary = iconLibrary;
            await el.updateComplete;
            const row = el.shadowRoot.querySelector('.image-row');
            const modal = el.shadowRoot.querySelector('mas-mnemonic-modal');
            row.click();
            await el.updateComplete;
            expect(el.modalOpen).to.be.true;
            expect(modal.open).to.be.true;
            for (const key of ['Enter', ' ']) {
                el.modalOpen = false;
                await el.updateComplete;
                row.focus();
                const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
                row.dispatchEvent(event);
                await el.updateComplete;
                expect(event.defaultPrevented).to.be.true;
                expect(el.modalOpen).to.be.true;
            }
        });
    }

    it('keeps the modal closed when the action menu is clicked or receives Enter', async () => {
        const el = await fixture(html`<mas-mnemonic-field icon="own.svg"></mas-mnemonic-field>`, { parentNode: spTheme() });
        const menu = el.shadowRoot.querySelector('sp-action-menu');
        menu.click();
        await el.updateComplete;
        expect(el.modalOpen).to.be.false;
        menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }));
        await el.updateComplete;
        expect(el.modalOpen).to.be.false;
    });

    it('sizes a library icon to fill the icon box', async () => {
        const el = await fixture(html`<mas-mnemonic-field icon="sp-icon-upload-to-cloud"></mas-mnemonic-field>`, {
            parentNode: spTheme(),
        });
        el.iconLibrary = true;
        await el.updateComplete;
        const icon = el.shadowRoot.querySelector('.image-row-icon sp-theme > sp-icon-upload-to-cloud');
        await icon.updateComplete;
        const rect = icon.getBoundingClientRect();
        expect(rect.width).to.equal(40);
        expect(rect.height).to.equal(40);
        expect(getComputedStyle(icon.parentElement).backgroundColor).to.equal('rgba(0, 0, 0, 0)');
    });

    it('sizes a product image to fill the icon box', async () => {
        const svg =
            'data:image/svg+xml,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width%3D%2210%22 height%3D%2210%22%2F%3E';
        const el = await fixture(html`<mas-mnemonic-field .icon=${svg}></mas-mnemonic-field>`, {
            parentNode: spTheme(),
        });
        const img = el.shadowRoot.querySelector('.image-row-icon img');
        if (!img.complete) await oneEvent(img, 'load');
        const rect = img.getBoundingClientRect();
        expect(rect.width).to.equal(40);
        expect(rect.height).to.equal(40);
    });

    it('shows the alt text as a second line only when set', async () => {
        const el = await fixture(html`<mas-mnemonic-field icon="own.svg" alt="Photoshop icon"></mas-mnemonic-field>`, {
            parentNode: spTheme(),
        });
        const alt = el.shadowRoot.querySelector('.image-row-description');
        expect(alt.textContent).to.equal('Photoshop icon');
        expect(getComputedStyle(alt).fontWeight).to.equal('400');
        el.alt = '';
        await el.updateComplete;
        expect(el.shadowRoot.querySelector('.image-row-description')).to.be.null;
    });

    it('keeps the blue border when overridden', async () => {
        const el = await fixture(html`<mas-mnemonic-field icon="own.svg" data-field-state="overridden"></mas-mnemonic-field>`, {
            parentNode: spTheme(),
        });
        el.style.setProperty('--spectrum-blue-400', 'rgb(1, 2, 3)');
        el.style.setProperty('--spectrum-blue-100', 'rgb(4, 5, 6)');
        const preview = getComputedStyle(el.shadowRoot.querySelector('.mnemonic-preview'));
        expect(preview.borderTopWidth).to.equal('2px');
        expect(preview.borderTopColor).to.equal('rgb(1, 2, 3)');
        expect(preview.backgroundColor).to.equal('rgb(4, 5, 6)');
    });

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
        const iconImg = el.shadowRoot.querySelector('.image-row-icon img');
        expect(iconImg).to.exist;
        expect(iconImg.src).to.include('creative-cloud.svg');
    });

    it('should left-align action menu items with 12px start padding', async () => {
        const el = await fixture(
            html`
                <mas-mnemonic-field
                    icon="https://www.adobe.com/cc-shared/assets/img/product-icons/svg/creative-cloud.svg"
                ></mas-mnemonic-field>
            `,
            { parentNode: spTheme() },
        );
        await el.updateComplete;
        await el.shadowRoot.querySelector('sp-action-menu').updateComplete;

        const items = el.shadowRoot.querySelectorAll('.action-menu sp-menu-item');
        expect(items.length).to.be.greaterThan(0);
        for (const item of items) {
            expect(getComputedStyle(item).paddingInlineStart).to.equal('12px');
        }
    });

    it('should open modal when edit is selected from menu', async () => {
        const el = await fixture(html`<mas-mnemonic-field></mas-mnemonic-field>`, { parentNode: spTheme() });

        const actionMenu = el.shadowRoot.querySelector('sp-action-menu');
        expect(actionMenu).to.exist;

        actionMenu.value = 'edit';
        actionMenu.dispatchEvent(new Event('change', { bubbles: true }));
        await el.updateComplete;

        expect(el.modalOpen).to.be.true;

        const modal = el.shadowRoot.querySelector('mas-mnemonic-modal');
        expect(modal).to.exist;
        expect(modal.open).to.be.true;
    });

    it('emits delete-field when delete is selected from menu', async () => {
        const el = await fixture(html`<mas-mnemonic-field icon="own.svg"></mas-mnemonic-field>`, { parentNode: spTheme() });
        const actionMenu = el.shadowRoot.querySelector('sp-action-menu');
        const deleted = oneEvent(el, 'delete-field');
        actionMenu.value = 'delete';
        actionMenu.dispatchEvent(new Event('change', { bubbles: true }));
        await deleted;
        expect(el.modalOpen).to.be.false;
    });

    it('clears the icon when delete is selected from menu on an icon library field', async () => {
        const el = await fixture(html`<mas-mnemonic-field icon="sp-icon-star"></mas-mnemonic-field>`, {
            parentNode: spTheme(),
        });
        el.iconLibrary = true;
        await el.updateComplete;
        const actionMenu = el.shadowRoot.querySelector('sp-action-menu');
        const changed = oneEvent(el, 'change');
        actionMenu.value = 'delete';
        actionMenu.dispatchEvent(new Event('change', { bubbles: true }));
        const event = await changed;
        expect(event.detail).to.equal(el);
        expect(el.icon).to.equal('');
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
