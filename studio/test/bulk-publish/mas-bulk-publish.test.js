import { fixture, html, expect, oneEvent } from '@open-wc/testing';
import Store from '../../src/store.js';
import '../../src/bulk-publish/mas-bulk-publish.js';

describe('mas-bulk-publish (overview)', () => {
    afterEach(() => {
        Store.bulkPublishProjects.list.data.set([]);
        Store.bulkPublishProjects.list.loading.set(false);
    });

    it('renders empty state when list is empty', async () => {
        const el = await fixture(html`<mas-bulk-publish></mas-bulk-publish>`);
        await el.updateComplete;
        expect(el.shadowRoot.querySelector('[data-testid="empty"]')).to.exist;
    });

    it('renders one row per project', async () => {
        Store.bulkPublishProjects.list.data.set([
            { id: 'a', get: () => ({ id: 'a', title: 'A', status: 'Draft' }) },
            { id: 'b', get: () => ({ id: 'b', title: 'B', status: 'Published' }) },
        ]);
        const el = await fixture(html`<mas-bulk-publish></mas-bulk-publish>`);
        await el.updateComplete;
        const rows = el.shadowRoot.querySelectorAll('[data-testid="project-row"]');
        expect(rows).to.have.lengthOf(2);
    });

    it('dispatches create-project when CTA clicked', async () => {
        const el = await fixture(html`<mas-bulk-publish></mas-bulk-publish>`);
        await el.updateComplete;
        setTimeout(() => el.shadowRoot.querySelector('[data-testid="create-btn"]').click());
        const ev = await oneEvent(el, 'create-project');
        expect(ev).to.exist;
    });
});
