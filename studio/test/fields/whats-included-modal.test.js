import { expect, fixture, html, oneEvent, aTimeout } from '@open-wc/testing';
import '../../src/swc.js';
import '../../src/fields/whats-included-modal.js';

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

describe('mas-whats-included-modal', () => {
    it("heading reads Add what's included without items", async () => {
        const el = await openModal([]);
        expect(el.shadowRoot.querySelector('h2').textContent).to.equal("Add what's included");
    });

    it("heading reads Edit what's included with items", async () => {
        const el = await openModal();
        expect(el.shadowRoot.querySelector('h2').textContent).to.equal("Edit what's included");
    });

    it('shows a single Icon tab', async () => {
        const el = await openModal();
        const tabs = el.shadowRoot.querySelectorAll('sp-tab');
        expect(tabs).to.have.lengthOf(1);
        expect(tabs[0].getAttribute('value')).to.equal('icon');
        expect(tabs[0].textContent.trim()).to.equal('Icon');
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

    it('Confirm without edits emits the same label and items and closes', async () => {
        const el = await openModal();
        let closed = false;
        el.addEventListener('modal-close', () => (closed = true));
        setTimeout(() => confirmButton(el).click());
        const event = await oneEvent(el, 'save');
        expect(event.detail).to.deep.equal({ label: 'Includes:', items: ITEMS });
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
