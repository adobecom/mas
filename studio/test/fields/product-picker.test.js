import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, oneEvent } from '@open-wc/testing-helpers/pure';
import '../../src/swc.js';
import '../../src/fields/product-picker.js';
import { spTheme } from '../utils.js';

const ITEMS = Array.from({ length: 20 }, (_, index) => ({ id: `p${index}`, name: `Product ${index}` }));
const renderIcon = () => html`<span class="test-icon"></span>`;

const create = (props = '') =>
    fixture(
        html`<mas-product-picker .items=${ITEMS} .renderIcon=${renderIcon} .recentIds=${props || []}></mas-product-picker>`,
        {
            parentNode: spTheme(),
        },
    );

describe('mas-product-picker', () => {
    it('renders 12 grid items with the Products label when there are no recents', async () => {
        const el = await create();
        const items = el.shadowRoot.querySelectorAll('.grid .icon-item');
        expect(el.shadowRoot.querySelector('.label').textContent.trim()).to.equal('Products:');
        expect(items.length).to.equal(12);
        expect(items[0].textContent).to.include('Product 0');
        expect(el.shadowRoot.querySelectorAll('.grid .test-icon').length).to.equal(12);
    });

    it('uses fluid six column grid styles', async () => {
        const el = await create();
        const { cssText } = customElements.get('mas-product-picker').styles;
        expect(cssText).to.include('repeat(6, minmax(0, 1fr))');
        expect(cssText).to.not.include('repeat(6, 74px)');
        const style = getComputedStyle(el.shadowRoot.querySelector('.grid .icon-item'));
        expect(style.maxWidth).to.equal('74px');
        expect(style.justifySelf).to.equal('center');
        const rule = [...customElements.get('mas-product-picker').styles.styleSheet.cssRules].find(
            (r) => r.selectorText === '.grid .icon-item',
        );
        expect(rule.cssText).to.include('width: 100%');
    });

    it('fits six items per row at 440px', async () => {
        const el = await create();
        el.style.width = '440px';
        await el.updateComplete;
        const grid = el.shadowRoot.querySelector('.grid');
        expect(grid.scrollWidth).to.be.at.most(grid.clientWidth);
        const items = [...el.shadowRoot.querySelectorAll('.grid .icon-item')];
        expect(items.length).to.equal(12);
        for (const item of items.slice(0, 6)) {
            expect(item.offsetTop).to.equal(items[0].offsetTop);
        }
    });

    it('puts recents first and skips unknown ids', async () => {
        const el = await create(['p7', 'missing', 'p2']);
        const items = el.shadowRoot.querySelectorAll('.grid .icon-item');
        expect(el.shadowRoot.querySelector('.label').textContent.trim()).to.equal('Recently used:');
        expect(items.length).to.equal(12);
        expect(items[0].textContent).to.include('Product 7');
        expect(items[1].textContent).to.include('Product 2');
        expect(items[2].textContent).to.include('Product 0');
    });

    it('sets tabindex, role and aria-selected on grid items', async () => {
        const el = await create();
        el.selectedId = 'p1';
        await el.updateComplete;
        const items = el.shadowRoot.querySelectorAll('.grid .icon-item');
        expect(items[0].getAttribute('tabindex')).to.equal('0');
        expect(items[0].getAttribute('role')).to.equal('option');
        expect(items[0].getAttribute('aria-selected')).to.equal('false');
        expect(items[1].getAttribute('aria-selected')).to.equal('true');
    });

    it('fires item-select on click', async () => {
        const el = await create();
        const listener = oneEvent(el, 'item-select');
        el.shadowRoot.querySelectorAll('.grid .icon-item')[3].click();
        const event = await listener;
        expect(event.detail.id).to.equal('p3');
    });

    it('fires item-select on Enter and Space with preventDefault', async () => {
        const el = await create();
        const item = el.shadowRoot.querySelectorAll('.grid .icon-item')[4];
        for (const key of ['Enter', ' ']) {
            const listener = oneEvent(el, 'item-select');
            const keydown = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
            item.dispatchEvent(keydown);
            const event = await listener;
            expect(event.detail.id).to.equal('p4');
            expect(keydown.defaultPrevented).to.be.true;
        }
    });

    it('shows case-insensitive matches in a dropdown', async () => {
        const el = await create();
        el.query = 'PRODUCT 1';
        await el.updateComplete;
        const rows = el.shadowRoot.querySelectorAll('.dropdown .icon-item');
        expect(rows.length).to.equal(11);
        expect(rows[0].getAttribute('tabindex')).to.equal('0');
        expect(rows[0].getAttribute('role')).to.equal('option');
    });

    it('clears the query when a dropdown row is clicked', async () => {
        const el = await create();
        el.query = 'product 15';
        await el.updateComplete;
        const listener = oneEvent(el, 'item-select');
        el.shadowRoot.querySelector('.dropdown .icon-item').click();
        const event = await listener;
        await el.updateComplete;
        expect(event.detail.id).to.equal('p15');
        expect(el.query).to.equal('');
        expect(el.shadowRoot.querySelector('.dropdown')).to.be.null;
    });

    it('clears the query when Enter is pressed on a dropdown row', async () => {
        const el = await create();
        el.query = 'product 15';
        await el.updateComplete;
        const listener = oneEvent(el, 'item-select');
        el.shadowRoot
            .querySelector('.dropdown .icon-item')
            .dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
        await listener;
        expect(el.query).to.equal('');
    });

    it('styles the dropdown and its rows', async () => {
        const el = await create();
        el.query = 'product 1';
        await el.updateComplete;
        const dropdown = getComputedStyle(el.shadowRoot.querySelector('.dropdown'));
        const row = getComputedStyle(el.shadowRoot.querySelector('.dropdown .icon-item'));
        expect(dropdown.paddingTop).to.equal('8px');
        expect(dropdown.paddingRight).to.equal('8px');
        expect(dropdown.paddingBottom).to.equal('8px');
        expect(dropdown.paddingLeft).to.equal('8px');
        expect(dropdown.borderTopWidth).to.equal('0px');
        expect(dropdown.borderTopLeftRadius).to.equal('10px');
        if (row.padding) {
            expect(row.padding).to.equal('7px 12px');
        } else {
            expect(row.paddingTop).to.equal('7px');
            expect(row.paddingRight).to.equal('12px');
            expect(row.paddingBottom).to.equal('7px');
            expect(row.paddingLeft).to.equal('12px');
        }
        expect(row.borderTopLeftRadius).to.equal('8px');
        expect(row.fontSize).to.equal('14px');
        expect(row.fontWeight).to.equal('500');
    });

    it('renders no dropdown when nothing matches and keeps the grid', async () => {
        const el = await create();
        el.query = 'zzz';
        await el.updateComplete;
        expect(el.shadowRoot.querySelector('.dropdown')).to.be.null;
        expect(el.shadowRoot.querySelectorAll('.grid .icon-item').length).to.equal(12);
    });
});
