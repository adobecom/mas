import { fixture, html, expect } from '@open-wc/testing';
import Store from '../../src/store.js';
import '../../src/bulk-publish/mas-bulk-publish-editor.js';
import { BULK_PUBLISH_STATUS, QUICK_ACTION } from '../../src/constants.js';

function seedInEdit(el, data = {}, { id = null } = {}) {
    const inner = {
        getFieldValue: (k) => data[k],
        getFieldValues: (k) => (Array.isArray(data[k]) ? data[k] : [data[k]]),
    };
    Store.bulkPublishProjects.inEdit.set({
        id,
        value: id ? inner : undefined,
        getFieldValue: (k) => data[k],
        getFieldValues: (k) => (Array.isArray(data[k]) ? data[k] : [data[k]]),
        setFieldValue: () => {},
        updateField: () => {},
    });
}

describe('mas-bulk-publish-editor', () => {
    afterEach(() => Store.bulkPublishProjects.inEdit.set(null));

    it('renders empty state (textarea visible, PUBLISH disabled)', async () => {
        const el = await fixture(html`<mas-bulk-publish-editor></mas-bulk-publish-editor>`);
        await el.updateComplete;
        seedInEdit(el, { title: '', urls: '', items: '[]', locales: [], status: BULK_PUBLISH_STATUS.DRAFT });
        await el.updateComplete;
        const quick = el.shadowRoot.querySelector('mas-quick-actions');
        expect(quick.disabled.has(QUICK_ACTION.PUBLISH)).to.equal(true);
    });

    it('enables PUBLISH when at least one valid item exists on a saved project', async () => {
        const el = await fixture(html`<mas-bulk-publish-editor></mas-bulk-publish-editor>`);
        await el.updateComplete;
        seedInEdit(
            el,
            {
                title: 'x',
                urls: '',
                items: JSON.stringify([{ url: 'a', path: '/x', status: 'valid' }]),
                locales: [],
                status: BULK_PUBLISH_STATUS.DRAFT,
            },
            { id: 'existing-frag-id' },
        );
        await el.updateComplete;
        const quick = el.shadowRoot.querySelector('mas-quick-actions');
        expect(quick.disabled.has(QUICK_ACTION.PUBLISH)).to.equal(false);
    });

    it('renders success banner when status is Published', async () => {
        const el = await fixture(html`<mas-bulk-publish-editor></mas-bulk-publish-editor>`);
        await el.updateComplete;
        seedInEdit(el, {
            title: 'x',
            urls: '',
            items: '[]',
            locales: [],
            status: BULK_PUBLISH_STATUS.PUBLISHED,
            publishedAt: '2026-04-23',
            publishedBy: 'Fred',
        });
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
