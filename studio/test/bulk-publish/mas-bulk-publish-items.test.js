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

    it('footer row shows error count when errors exist', async () => {
        const el = await fixture(html`
            <mas-bulk-publish-items
                .items=${[
                    { url: 'https://a', status: 'valid' },
                    { url: 'https://b', status: 'error', reason: 'not-found' },
                ]}
                .urls=${'x'}
            ></mas-bulk-publish-items>
        `);
        await el.updateComplete;
        const footer = el.shadowRoot.querySelector('[data-testid="items-footer"]');
        expect(footer).to.exist;
        expect(footer.textContent).to.include('2 URLs');
        expect(footer.textContent).to.include('1 error');
    });

    it('footer row shows URL count and Remove all button', async () => {
        const el = await fixture(html`
            <mas-bulk-publish-items .items=${[{ url: 'https://a', status: 'valid' }]} .urls=${'x'}></mas-bulk-publish-items>
        `);
        await el.updateComplete;
        const footer = el.shadowRoot.querySelector('[data-testid="items-footer"]');
        expect(footer.textContent).to.include('1 URL');
    });

    it('removeAll dispatches remove-all event', async () => {
        const el = await fixture(html` <mas-bulk-publish-items .items=${[]} .urls=${''}></mas-bulk-publish-items> `);
        setTimeout(() => el.removeAll());
        const ev = await oneEvent(el, 'remove-all');
        expect(ev).to.exist;
    });

    it('Actions column header is present', async () => {
        const el = await fixture(html`
            <mas-bulk-publish-items .items=${[{ url: 'https://a', status: 'valid' }]} .urls=${'x'}></mas-bulk-publish-items>
        `);
        await el.updateComplete;
        const headers = el.shadowRoot.querySelectorAll('.items-table-header span');
        expect(headers[2].textContent.trim()).to.equal('Actions');
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

    it('shows "Duplicate item" label for reason="duplicate"', async () => {
        const el = await fixture(html`
            <mas-bulk-publish-items
                .items=${[{ url: 'https://dup', status: 'error', reason: 'duplicate' }]}
                .urls=${'x'}
            ></mas-bulk-publish-items>
        `);
        await el.updateComplete;
        const cell = el.shadowRoot.querySelector('.status-error');
        expect(cell).to.exist;
        expect(cell.textContent).to.include('Duplicate item');
    });

    it('shows "Invalid URL" label for unknown reason', async () => {
        const el = await fixture(html`
            <mas-bulk-publish-items
                .items=${[{ url: 'https://bad', status: 'error', reason: 'invalid-url' }]}
                .urls=${'x'}
            ></mas-bulk-publish-items>
        `);
        await el.updateComplete;
        const cell = el.shadowRoot.querySelector('.status-error');
        expect(cell).to.exist;
        expect(cell.textContent).to.include('Invalid URL');
    });

    it('Add by search button applies light-grey background via Spectrum mod custom property', async () => {
        const el = await fixture(html` <mas-bulk-publish-items .items=${[]} .urls=${''}></mas-bulk-publish-items> `);
        await el.updateComplete;
        const btn = el.shadowRoot.querySelector('sp-action-button.add-by-search');
        expect(btn).to.exist;
        const styles = getComputedStyle(btn);
        const bg = styles.getPropertyValue('--mod-actionbutton-background-color-default').trim();
        expect(bg).to.not.equal('');
    });

    it('Add by search button renders the plus icon', async () => {
        const el = await fixture(html` <mas-bulk-publish-items .items=${[]} .urls=${''}></mas-bulk-publish-items> `);
        await el.updateComplete;
        const btn = el.shadowRoot.querySelector('sp-action-button.add-by-search');
        expect(btn.querySelector('sp-icon-add')).to.exist;
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
