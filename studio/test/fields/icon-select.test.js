import { expect, fixture, html, oneEvent } from '@open-wc/testing';
import '../../src/swc.js';
import '../../src/fields/icon-select.js';
import { ICON_LIBRARY } from '../../src/constants/icon-library.js';

const openSelect = async (value = '') => {
    const el = await fixture(html`<mas-icon-select .value=${value}></mas-icon-select>`);
    el.shadowRoot.querySelector('.trigger').click();
    await el.updateComplete;
    return el;
};

const rows = (el) => [...el.shadowRoot.querySelectorAll('.icon-item')];

const search = async (el, value) => {
    const field = el.shadowRoot.querySelector('sp-search');
    field.value = value;
    field.dispatchEvent(new Event('input'));
    await el.updateComplete;
};

describe('mas-icon-select', () => {
    it('lists all 13 icons', async () => {
        const el = await openSelect();
        expect(ICON_LIBRARY).to.have.lengthOf(13);
        expect(rows(el)).to.have.lengthOf(13);
    });

    it('keeps a 168px list max-height by default', async () => {
        const el = await openSelect();
        expect(getComputedStyle(el.shadowRoot.querySelector('.list')).maxHeight).to.equal('168px');
    });

    it('shows the selected icon name in the trigger', async () => {
        const el = await fixture(html`<mas-icon-select value="sp-icon-star"></mas-icon-select>`);
        expect(el.shadowRoot.querySelector('.trigger').textContent).to.contain('Star');
    });

    it('shows a chevron in the empty trigger', async () => {
        const el = await fixture(html`<mas-icon-select></mas-icon-select>`);
        expect(el.shadowRoot.querySelector('.trigger sp-icon-chevron-down')).to.exist;
    });

    it('search filters by name case-insensitively', async () => {
        const el = await openSelect();
        await search(el, 'STAR');
        expect(rows(el)).to.have.lengthOf(1);
        expect(rows(el)[0].textContent).to.contain('Star');
    });

    it('shows no rows and fires no event when nothing matches', async () => {
        const el = await openSelect();
        let fired = false;
        el.addEventListener('change', () => (fired = true));
        await search(el, 'zzzz');
        expect(rows(el)).to.have.lengthOf(0);
        expect(fired).to.be.false;
    });

    it('picking emits change with detail.id and closes', async () => {
        const el = await openSelect();
        setTimeout(() => rows(el)[1].click());
        const event = await oneEvent(el, 'change');
        expect(event.detail.id).to.equal(ICON_LIBRARY[1].id);
        await el.updateComplete;
        expect(el.shadowRoot.querySelector('.panel')).to.be.null;
    });

    it('Enter and Space select a row', async () => {
        const el = await openSelect();
        setTimeout(() => rows(el)[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })));
        const first = await oneEvent(el, 'change');
        expect(first.detail.id).to.equal(ICON_LIBRARY[2].id);
        el.shadowRoot.querySelector('.trigger').click();
        await el.updateComplete;
        setTimeout(() => rows(el)[3].dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true })));
        const second = await oneEvent(el, 'change');
        expect(second.detail.id).to.equal(ICON_LIBRARY[3].id);
    });

    it('Escape closes', async () => {
        const el = await openSelect();
        el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        await el.updateComplete;
        expect(el.shadowRoot.querySelector('.panel')).to.be.null;
    });

    it('outside click closes', async () => {
        const el = await openSelect();
        document.body.dispatchEvent(new Event('pointerdown', { bubbles: true, composed: true }));
        await el.updateComplete;
        expect(el.shadowRoot.querySelector('.panel')).to.be.null;
    });
});
