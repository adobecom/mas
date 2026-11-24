import { expect, fixture, html, oneEvent, aTimeout } from '@open-wc/testing';
import '../../src/swc.js';
import '../../src/fields/whats-included-modal.js';
import { ADOBE_PRODUCTS } from '../../src/constants/adobe-products.js';
import { readRecent } from '../../src/utils/recent-products.js';

const ITEMS = [
    { icon: 'sp-icon-star', alt: '<p>First</p>', link: '' },
    { icon: 'https://adobe.com/assets/firefly-icon.svg', alt: 'Second', link: 'https://example.com' },
];

const deepFreeze = (value) => {
    Object.values(value).forEach((child) => typeof child === 'object' && deepFreeze(child));
    return Object.freeze(value);
};

const openModal = async (items = ITEMS, label = 'Includes:', extra = {}) => {
    const el = await fixture(html`<mas-whats-included-modal></mas-whats-included-modal>`);
    Object.assign(el, { label, items, focusIndex: 0, ...extra });
    el.open = true;
    await el.updateComplete;
    await aTimeout(0);
    await el.updateComplete;
    return el;
};

const cards = (el) => [...el.shadowRoot.querySelectorAll('.item-card')];
const confirmButton = (el) => el.shadowRoot.querySelector('sp-button[variant="accent"]');
const cancelButton = (el) => el.shadowRoot.querySelector('sp-button[variant="secondary"]');

const PRODUCT_URL = 'https://www.adobe.com/cc-shared/assets/img/product-icons/svg/photoshop.svg';
const CUSTOM_LOGO = { icon: 'https://example.com/custom-logo.svg', alt: 'Custom', link: 'https://example.com' };
const PRODUCT_LOGO = { icon: PRODUCT_URL, alt: 'Photoshop', link: 'https://adobe.com' };
const picker = (el) => el.shadowRoot.querySelector('mas-product-picker');

describe('mas-whats-included-modal', () => {
    beforeEach(() => {
        localStorage.removeItem('mas-studio-recent-products');
    });

    it("heading reads Add what's included on the Icon tab and on the Logo tab", async () => {
        const iconEl = await openModal();
        expect(iconEl.shadowRoot.querySelector('h2').textContent).to.equal("Add what's included");
        const logoEl = await openModal([], 'Includes:', { tab: 'logo', logo: PRODUCT_LOGO });
        expect(logoEl.shadowRoot.querySelector('h2').textContent).to.equal("Add what's included");
    });

    it('shows two tabs Icon and Logo', async () => {
        const el = await openModal();
        const tabs = el.shadowRoot.querySelectorAll('sp-tab');
        expect(tabs).to.have.lengthOf(2);
        expect(tabs[0].getAttribute('value')).to.equal('icon');
        expect(tabs[0].textContent.trim()).to.equal('Icon');
        expect(tabs[1].getAttribute('value')).to.equal('logo');
        expect(tabs[1].textContent.trim()).to.equal('Logo');
        const fresh = await fixture(html`<mas-whats-included-modal></mas-whats-included-modal>`);
        expect(fresh.tab).to.equal('icon');
        expect(fresh.logo).to.deep.equal({ icon: '', alt: '', link: '' });
        expect(fresh.logoIndex).to.equal(-1);
        expect(fresh.showLogoTab).to.be.true;
    });

    it('showLogoTab=false renders only Icon', async () => {
        const el = await openModal(ITEMS, 'Includes:', { showLogoTab: false, tab: 'logo' });
        const tabs = el.shadowRoot.querySelectorAll('sp-tab');
        expect(tabs).to.have.lengthOf(1);
        expect(tabs[0].getAttribute('value')).to.equal('icon');
        expect(el.activeTab).to.equal('icon');
    });

    it('Logo tab renders mas-product-picker plus Alt text and Destination URL', async () => {
        localStorage.setItem('mas-studio-recent-products', JSON.stringify(['photoshop', 'illustrator']));
        const el = await openModal([], 'Includes:', { tab: 'logo' });
        expect(picker(el).items).to.equal(ADOBE_PRODUCTS);
        expect(picker(el).recentIds).to.deep.equal(readRecent());
        expect(picker(el).recentIds).to.deep.equal(['photoshop', 'illustrator']);
        expect(el.shadowRoot.querySelector('#product-alt').getAttribute('placeholder')).to.equal(
            'Descriptive text for accessibility',
        );
        expect(el.shadowRoot.querySelector('#product-link').getAttribute('placeholder')).to.equal('https://example.com');
        const panel = el.shadowRoot.querySelector('sp-tab-panel[value="logo"]');
        expect(panel.querySelector('sp-action-group')).to.be.null;
        expect(panel.textContent).to.not.contain('Import via URL');
        expect(panel.querySelector('sp-menu-item, [label="Delete item"]')).to.be.null;
    });

    it('picking a product sets the product icon URL', async () => {
        const el = await openModal([], 'Includes:', { tab: 'logo' });
        picker(el).dispatchEvent(new CustomEvent('item-select', { detail: { id: 'photoshop' } }));
        await el.updateComplete;
        expect(el.draftLogo.icon).to.equal(PRODUCT_URL);
        expect(picker(el).selectedId).to.equal('photoshop');
    });

    it('matching logo preselects its product', async () => {
        const el = await openModal([], 'Includes:', { tab: 'logo', logo: PRODUCT_LOGO, logoIndex: 0 });
        expect(el.selectedProductId).to.equal('photoshop');
        expect(picker(el).selectedId).to.equal('photoshop');
    });

    it('custom-URL logo opens with nothing selected and keeps its icon', async () => {
        const el = await openModal([], 'Includes:', { tab: 'logo', logo: CUSTOM_LOGO, logoIndex: 1 });
        expect(picker(el).selectedId).to.equal('');
        setTimeout(() => confirmButton(el).click());
        const event = await oneEvent(el, 'save');
        expect(event.detail.logo).to.deep.equal(CUSTOM_LOGO);
        expect(readRecent()).to.deep.equal([]);
    });

    it('Logo Confirm emits {tab:"logo", index, logo} and records the recent only when a product was picked', async () => {
        const el = await openModal([], 'Includes:', { tab: 'logo', logo: PRODUCT_LOGO, logoIndex: 2 });
        setTimeout(() => confirmButton(el).click());
        const first = await oneEvent(el, 'save');
        expect(first.detail).to.deep.equal({ tab: 'logo', index: 2, logo: PRODUCT_LOGO });
        expect(readRecent()).to.deep.equal([]);

        const picked = await openModal([], 'Includes:', { tab: 'logo' });
        picker(picked).dispatchEvent(new CustomEvent('item-select', { detail: { id: 'photoshop' } }));
        await picked.updateComplete;
        setTimeout(() => confirmButton(picked).click());
        const second = await oneEvent(picked, 'save');
        expect(second.detail).to.deep.equal({ tab: 'logo', index: -1, logo: { icon: PRODUCT_URL, alt: '', link: '' } });
        expect(readRecent()[0]).to.equal('photoshop');
    });

    it('Icon Confirm emits {tab:"icon", label, items}', async () => {
        const el = await openModal();
        setTimeout(() => confirmButton(el).click());
        const event = await oneEvent(el, 'save');
        expect(event.detail).to.deep.equal({ tab: 'icon', label: 'Includes:', items: ITEMS });
    });

    it('Cancel saves and records nothing', async () => {
        const el = await openModal([], 'Includes:', { tab: 'logo' });
        picker(el).dispatchEvent(new CustomEvent('item-select', { detail: { id: 'photoshop' } }));
        await el.updateComplete;
        let saved = false;
        el.addEventListener('save', () => (saved = true));
        cancelButton(el).click();
        expect(saved).to.be.false;
        expect(readRecent()).to.deep.equal([]);
    });

    it('Confirm is disabled on a new logo with no product picked', async () => {
        const el = await openModal([], 'Includes:', { tab: 'logo' });
        expect(confirmButton(el).hasAttribute('disabled')).to.be.true;
        picker(el).dispatchEvent(new CustomEvent('item-select', { detail: { id: 'photoshop' } }));
        await el.updateComplete;
        expect(confirmButton(el).hasAttribute('disabled')).to.be.false;
    });

    it('shows the item count', async () => {
        const el = await openModal();
        expect(el.shadowRoot.querySelector('.count').textContent).to.equal('2 items');
        await el.updateComplete;
        const single = await openModal([ITEMS[0]]);
        expect(single.shadowRoot.querySelector('.count').textContent).to.equal('1 item');
    });

    it('Add item appends an empty item and focuses its Select control', async () => {
        const el = await openModal();
        el.shadowRoot.querySelector('.add-item').click();
        await el.updateComplete;
        await aTimeout(0);
        expect(cards(el)).to.have.lengthOf(3);
        const select = cards(el)[2].querySelector('mas-icon-select');
        expect(select).to.exist;
        expect(el.shadowRoot.activeElement).to.equal(select);
        expect(select.shadowRoot.activeElement).to.equal(select.shadowRoot.querySelector('.trigger'));
    });

    it('Delete item removes only that item', async () => {
        const el = await openModal();
        cards(el)[0].querySelector('sp-action-button[label="Delete item"]').click();
        await el.updateComplete;
        expect(cards(el)).to.have.lengthOf(1);
        setTimeout(() => confirmButton(el).click());
        const event = await oneEvent(el, 'save');
        expect(event.detail.items).to.deep.equal([ITEMS[1]]);
    });

    it('Select and Import via URL swap the Icon and Icon URL fields', async () => {
        const el = await openModal([{ icon: '', alt: '', link: '' }]);
        const card = () => cards(el)[0];
        expect(card().querySelector('mas-icon-select')).to.exist;
        expect(card().querySelector('.icon-url')).to.be.null;
        const group = card().querySelector('sp-action-group');
        group.selected = ['url'];
        group.dispatchEvent(new Event('change'));
        await el.updateComplete;
        expect(card().querySelector('mas-icon-select')).to.be.null;
        const url = card().querySelector('.icon-url');
        expect(url.getAttribute('placeholder')).to.equal('e.g., https://adobe.com/assets/firefly-icon.svg');
        group.selected = ['select'];
        group.dispatchEvent(new Event('change'));
        await el.updateComplete;
        expect(card().querySelector('mas-icon-select')).to.exist;
    });

    it('sp-icon item opens on Select', async () => {
        const el = await openModal();
        const card = cards(el)[0];
        expect(card.querySelector('sp-action-group').selected).to.deep.equal(['select']);
        expect(card.querySelector('mas-icon-select').value).to.equal('sp-icon-star');
    });

    it('URL item opens on Import via URL', async () => {
        const el = await openModal();
        const card = cards(el)[1];
        expect(card.querySelector('sp-action-group').selected).to.deep.equal(['url']);
        expect(card.querySelector('.icon-url').value).to.equal(ITEMS[1].icon);
    });

    it('dialog has no padding of its own', async () => {
        const el = await openModal();
        const dialog = el.shadowRoot.querySelector('sp-dialog.whats-included');
        expect(getComputedStyle(dialog).paddingLeft).to.equal('0px');
    });

    it('toggle shows the selected button as a white pill', async () => {
        const el = await openModal();
        const group = cards(el)[0].querySelector('sp-action-group');
        await group.updateComplete;
        const selected = group.querySelector('sp-action-button[value="select"]');
        const unselected = group.querySelector('sp-action-button[value="url"]');
        const style = getComputedStyle(selected);
        expect(style.backgroundColor).to.equal('rgb(255, 255, 255)');
        expect(style.borderTopWidth).to.equal('2px');
        expect(style.borderTopColor).to.equal('rgb(41, 41, 41)');
        expect(getComputedStyle(unselected).backgroundColor).to.equal('rgba(0, 0, 0, 0)');
    });

    it('Confirm without edits emits the same label and items and closes', async () => {
        const el = await openModal();
        let closed = false;
        el.addEventListener('modal-close', () => (closed = true));
        setTimeout(() => confirmButton(el).click());
        const event = await oneEvent(el, 'save');
        expect(event.detail).to.deep.equal({ tab: 'icon', label: 'Includes:', items: ITEMS });
        expect(el.open).to.be.false;
        expect(closed).to.be.true;
    });

    it('Cancel emits no save', async () => {
        const el = await openModal();
        let saved = false;
        el.addEventListener('save', () => (saved = true));
        cancelButton(el).click();
        expect(saved).to.be.false;
        expect(el.open).to.be.false;
    });

    it('does not mutate input arrays', async () => {
        const items = deepFreeze(ITEMS.map((item) => ({ ...item })));
        const el = await openModal(items);
        const select = cards(el)[0].querySelector('mas-icon-select');
        select.dispatchEvent(new CustomEvent('change', { detail: { id: 'sp-icon-brush' }, bubbles: true }));
        await el.updateComplete;
        el.shadowRoot.querySelector('.add-item').click();
        await el.updateComplete;
        expect(items).to.deep.equal(ITEMS);
        expect(items).to.have.lengthOf(2);
    });
});
