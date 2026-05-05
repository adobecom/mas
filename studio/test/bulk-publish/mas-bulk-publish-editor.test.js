import { fixture, html, expect } from '@open-wc/testing';
import Store from '../../src/store.js';
import '../../src/bulk-publish/mas-bulk-publish-editor.js';
import { BULK_PUBLISH_STATUS, QUICK_ACTION } from '../../src/constants.js';

function seedInEdit(data = {}) {
    Store.bulkPublishProjects.inEdit.set({
        id: data.id ?? 'p1',
        getFieldValue: (k) => data[k],
        setFieldValue: () => {},
    });
}

describe('mas-bulk-publish-editor', () => {
    afterEach(() => Store.bulkPublishProjects.inEdit.set(null));

    it('renders empty state (textarea visible, PUBLISH disabled)', async () => {
        seedInEdit({ title: '', urls: '', items: '[]', locales: [], status: BULK_PUBLISH_STATUS.DRAFT });
        const el = await fixture(html`<mas-bulk-publish-editor></mas-bulk-publish-editor>`);
        await el.updateComplete;
        const quick = el.shadowRoot.querySelector('mas-quick-actions');
        expect(quick.disabled.has(QUICK_ACTION.PUBLISH)).to.equal(true);
    });

    it('enables PUBLISH when at least one valid item exists', async () => {
        seedInEdit({
            title: 'x',
            urls: '',
            items: JSON.stringify([{ url: 'a', path: '/x', status: 'valid' }]),
            locales: [],
            status: BULK_PUBLISH_STATUS.DRAFT,
        });
        const el = await fixture(html`<mas-bulk-publish-editor></mas-bulk-publish-editor>`);
        await el.updateComplete;
        const quick = el.shadowRoot.querySelector('mas-quick-actions');
        expect(quick.disabled.has(QUICK_ACTION.PUBLISH)).to.equal(false);
    });

    it('renders success banner when status is Published', async () => {
        seedInEdit({
            title: 'x',
            urls: '',
            items: '[]',
            locales: [],
            status: BULK_PUBLISH_STATUS.PUBLISHED,
            publishedAt: '2026-04-23',
            publishedBy: 'Fred',
        });
        const el = await fixture(html`<mas-bulk-publish-editor></mas-bulk-publish-editor>`);
        await el.updateComplete;
        expect(el.shadowRoot.querySelector('mas-bulk-publish-success-banner')).to.exist;
    });

    it('does not update inEdit after disconnecting during async init', async () => {
        Store.bulkPublishProjects.inEdit.set(null);
        Store.bulkPublishProjects.projectId.set('test-id');
        const el = await fixture(html`<mas-bulk-publish-editor></mas-bulk-publish-editor>`);
        el.remove();
        await Promise.resolve();
        expect(Store.bulkPublishProjects.inEdit.value).to.be.oneOf([null, undefined]);
        Store.bulkPublishProjects.projectId.set(null);
    });
});
