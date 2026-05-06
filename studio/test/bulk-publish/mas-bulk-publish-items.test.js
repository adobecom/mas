import { fixture, html, expect, oneEvent } from '@open-wc/testing';
import '../../src/bulk-publish/mas-bulk-publish-items.js';

describe('mas-bulk-publish-items', () => {
    it('renders sp-textfield in empty state', async () => {
        const el = await fixture(html` <mas-bulk-publish-items .items=${[]} .urls=${''}></mas-bulk-publish-items> `);
        expect(el.shadowRoot.querySelector('sp-textfield[multiline]')).to.exist;
        expect(el.shadowRoot.querySelector('[data-testid="items-list"]')).to.be.null;
    });

    it('renders item list when items is non-empty', async () => {
        const el = await fixture(html`
            <mas-bulk-publish-items
                .items=${[
                    { url: 'https://a', path: '/x', status: 'valid' },
                    { url: 'https://b', path: null, status: 'error', reason: 'not-found' },
                ]}
                .urls=${'x'}
            ></mas-bulk-publish-items>
        `);
        await el.updateComplete;
        const list = el.shadowRoot.querySelector('[data-testid="items-list"]');
        expect(list).to.exist;
        expect(list.querySelectorAll('[data-testid="item-row"]')).to.have.lengthOf(2);
    });

    it('renders a 404 warning when any item has reason="not-found"', async () => {
        const el = await fixture(html`
            <mas-bulk-publish-items
                .items=${[{ url: 'https://b', status: 'error', reason: 'not-found' }]}
                .urls=${'x'}
            ></mas-bulk-publish-items>
        `);
        await el.updateComplete;
        const warn = el.shadowRoot.querySelector('[data-testid="items-warning"]');
        expect(warn).to.exist;
        expect(warn.textContent).to.include('404 error');
        expect(warn.textContent).to.include('1');
    });

    it('dispatches urls-change when sp-textfield input event fires', async () => {
        const el = await fixture(html` <mas-bulk-publish-items .items=${[]} .urls=${''}></mas-bulk-publish-items> `);
        const textfield = el.shadowRoot.querySelector('sp-textfield[multiline]');
        setTimeout(() => {
            textfield.value = 'hello';
            textfield.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true }));
        });
        const ev = await oneEvent(el, 'urls-change');
        expect(ev.detail).to.equal('hello');
    });

    it('handleChange dispatches validate-items event', async () => {
        const el = await fixture(html` <mas-bulk-publish-items .items=${[]} .urls=${''}></mas-bulk-publish-items> `);
        setTimeout(() => el.handleChange());
        const ev = await oneEvent(el, 'validate-items');
        expect(ev).to.exist;
    });

    it('emitAddBySearch dispatches add-by-search event', async () => {
        const el = await fixture(html` <mas-bulk-publish-items .items=${[]} .urls=${''}></mas-bulk-publish-items> `);
        setTimeout(() => el.emitAddBySearch());
        const ev = await oneEvent(el, 'add-by-search');
        expect(ev).to.exist;
    });

    it('removeUrl dispatches url-remove event with url detail', async () => {
        const el = await fixture(html` <mas-bulk-publish-items .items=${[]} .urls=${''}></mas-bulk-publish-items> `);
        setTimeout(() => el.removeUrl('https://example.com'));
        const ev = await oneEvent(el, 'url-remove');
        expect(ev.detail).to.equal('https://example.com');
    });

    it('toggleCollapse flips collapsed state', async () => {
        const el = await fixture(html` <mas-bulk-publish-items .items=${[]} .urls=${''}></mas-bulk-publish-items> `);
        expect(el.collapsed).to.equal(false);
        el.toggleCollapse();
        expect(el.collapsed).to.equal(true);
        el.toggleCollapse();
        expect(el.collapsed).to.equal(false);
    });
});
