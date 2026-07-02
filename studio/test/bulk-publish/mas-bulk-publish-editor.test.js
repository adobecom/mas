import { fixture, html, expect } from '@open-wc/testing';
import Store from '../../src/store.js';
import '../../src/bulk-publish/mas-bulk-publish-editor.js';
import { BULK_PUBLISH_STATUS, QUICK_ACTION } from '../../src/constants.js';
import { Fragment } from '../../src/aem/fragment.js';
import { FragmentStore } from '../../src/reactivity/fragment-store.js';

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

    it('enables PUBLISH when all source items are already published but target locales are configured', async () => {
        const el = await fixture(html`<mas-bulk-publish-editor></mas-bulk-publish-editor>`);
        await el.updateComplete;
        seedInEdit(
            el,
            {
                title: 'x',
                urls: '',
                locales: ['de_AT', 'fr_CA'],
                status: BULK_PUBLISH_STATUS.DRAFT,
            },
            { id: 'placeholder-project-id' },
        );
        el.localItems = [
            { url: 'a', path: '/x', status: 'valid', alreadyPublished: true },
            { url: 'b', path: '/y', status: 'valid', alreadyPublished: true },
        ];
        await el.updateComplete;
        const quick = el.shadowRoot.querySelector('mas-quick-actions');
        expect(quick.disabled.has(QUICK_ACTION.PUBLISH)).to.equal(false);
    });

    it('disables PUBLISH when all source items are already published and no target locales are configured', async () => {
        const el = await fixture(html`<mas-bulk-publish-editor></mas-bulk-publish-editor>`);
        await el.updateComplete;
        seedInEdit(
            el,
            {
                title: 'x',
                urls: '',
                locales: [],
                status: BULK_PUBLISH_STATUS.DRAFT,
            },
            { id: 'no-locales-project-id' },
        );
        el.localItems = [{ url: 'a', path: '/x', status: 'valid', alreadyPublished: true }];
        await el.updateComplete;
        const quick = el.shadowRoot.querySelector('mas-quick-actions');
        expect(quick.disabled.has(QUICK_ACTION.PUBLISH)).to.equal(true);
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

    it('re-renders the publishing banner when the project store updates during polling', async () => {
        const el = await fixture(html`<mas-bulk-publish-editor></mas-bulk-publish-editor>`);
        await el.updateComplete;
        const store = new FragmentStore(
            new Fragment({
                id: 'frag-1',
                path: '/content/dam/mas/bulk-publish-projects/acom/p1',
                fields: [
                    { name: 'title', type: 'text', values: ['x'] },
                    { name: 'status', type: 'text', values: [BULK_PUBLISH_STATUS.DRAFT] },
                    { name: 'urls', type: 'text', values: [''] },
                    { name: 'fragments', type: 'content-fragment', multiple: true, values: ['/x'] },
                    { name: 'locales', type: 'text', multiple: true, values: [] },
                ],
            }),
        );
        Store.bulkPublishProjects.inEdit.set(store);
        await el.updateComplete;
        expect(el.shadowRoot.querySelector('mas-bulk-publish-success-banner[variant="publishing"]')).to.not.exist;
        store.updateField('status', [BULK_PUBLISH_STATUS.PUBLISHING]);
        await el.updateComplete;
        expect(el.shadowRoot.querySelector('mas-bulk-publish-success-banner[variant="publishing"]')).to.exist;
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

    describe('PUBLISHED state (read-only)', () => {
        it('items component is disabled when status === PUBLISHED', async () => {
            const el = await fixture(html`<mas-bulk-publish-editor></mas-bulk-publish-editor>`);
            await el.updateComplete;
            seedInEdit(el, {
                title: 'x',
                urls: '',
                items: '[]',
                locales: [],
                status: BULK_PUBLISH_STATUS.PUBLISHED,
                publishedAt: '2026-04-23',
                publishedBy: 'Test',
            });
            await el.updateComplete;
            const items = el.shadowRoot.querySelector('mas-bulk-publish-items');
            expect(items).to.exist;
            expect(items.disabled).to.equal(true);
        });

        it('locales component is disabled when status === PUBLISHED', async () => {
            const el = await fixture(html`<mas-bulk-publish-editor></mas-bulk-publish-editor>`);
            await el.updateComplete;
            seedInEdit(el, {
                title: 'x',
                urls: '',
                items: '[]',
                locales: [],
                status: BULK_PUBLISH_STATUS.PUBLISHED,
                publishedAt: '2026-04-23',
                publishedBy: 'Test',
            });
            await el.updateComplete;
            const locales = el.shadowRoot.querySelector('mas-bulk-publish-locales');
            expect(locales).to.exist;
            expect(locales.disabled).to.equal(true);
        });

        it('Publish quick-action is disabled when status === PUBLISHED', async () => {
            const el = await fixture(html`<mas-bulk-publish-editor></mas-bulk-publish-editor>`);
            await el.updateComplete;
            seedInEdit(
                el,
                {
                    title: 'x',
                    urls: '',
                    items: JSON.stringify([{ url: 'a', path: '/x', status: 'valid' }]),
                    locales: [],
                    status: BULK_PUBLISH_STATUS.PUBLISHED,
                    publishedAt: '2026-04-23',
                    publishedBy: 'Test',
                },
                { id: 'existing-frag-id' },
            );
            await el.updateComplete;
            const quick = el.shadowRoot.querySelector('mas-quick-actions');
            expect(quick.disabled.has(QUICK_ACTION.PUBLISH)).to.equal(true);
        });
    });

    it('passes parsed lastResult to the banner for PARTIALLY_PUBLISHED', async () => {
        const el = await fixture(html`<mas-bulk-publish-editor></mas-bulk-publish-editor>`);
        await el.updateComplete;
        const result = { published: 3, failed: 2, failures: [], failuresTruncated: false };
        seedInEdit(el, {
            status: BULK_PUBLISH_STATUS.PARTIALLY_PUBLISHED,
            lastResult: JSON.stringify(result),
        });
        await el.updateComplete;
        const banner = el.shadowRoot.querySelector('mas-bulk-publish-success-banner');
        expect(banner).to.exist;
        expect(banner.result).to.deep.equal(result);
    });

    it('REVERT not disabled when status is PARTIALLY_PUBLISHED', async () => {
        const el = await fixture(html`<mas-bulk-publish-editor></mas-bulk-publish-editor>`);
        await el.updateComplete;
        seedInEdit(
            el,
            {
                title: 'x',
                urls: '',
                items: '[]',
                locales: [],
                status: BULK_PUBLISH_STATUS.PARTIALLY_PUBLISHED,
            },
            { id: 'existing-frag-id' },
        );
        await el.updateComplete;
        const quick = el.shadowRoot.querySelector('mas-quick-actions');
        expect(quick.disabled.has(QUICK_ACTION.REVERT)).to.equal(false);
    });

    describe('Check for modifications', () => {
        it('"check-modifications" event from items triggers handleCheckModifications', async () => {
            const el = await fixture(html`<mas-bulk-publish-editor></mas-bulk-publish-editor>`);
            await el.updateComplete;
            const snapshot = {
                createdAt: new Date().toISOString(),
                source: 'pre-publish',
                fragments: { f1: { path: '/p1' } },
            };
            seedInEdit(
                el,
                {
                    title: 'x',
                    urls: '',
                    items: JSON.stringify([{ url: 'a', path: '/p1', status: 'valid' }]),
                    locales: [],
                    status: BULK_PUBLISH_STATUS.PUBLISHED,
                    snapshot: JSON.stringify(snapshot),
                },
                { id: 'existing-frag-id' },
            );
            await el.updateComplete;

            // Track calls to handleCheckModifications via a flag on the instance
            el._checkModCallCount = 0;
            const original = el.handleCheckModifications;
            el.handleCheckModifications = async function () {
                el._checkModCallCount++;
                // call original but swallow any error from missing repository
                try {
                    await original.call(el);
                } catch {
                    // expected in test environment without repository
                }
            };
            // re-render so Lit picks up the patched method
            el.requestUpdate();
            await el.updateComplete;

            const itemsEl = el.shadowRoot.querySelector('mas-bulk-publish-items');
            expect(itemsEl).to.exist;
            itemsEl.dispatchEvent(new CustomEvent('check-modifications', { bubbles: true, composed: true }));
            await el.updateComplete;
            expect(el._checkModCallCount).to.equal(1);
        });

        it('Modification results are passed to mas-bulk-publish-items as .modifications prop', async () => {
            const el = await fixture(html`<mas-bulk-publish-editor></mas-bulk-publish-editor>`);
            await el.updateComplete;
            seedInEdit(
                el,
                {
                    title: 'x',
                    urls: '',
                    items: '[]',
                    locales: [],
                    status: BULK_PUBLISH_STATUS.PUBLISHED,
                },
                { id: 'existing-frag-id' },
            );
            await el.updateComplete;

            const modificationsMap = new Map([['/p1', true]]);
            el.modifications = modificationsMap;
            await el.updateComplete;

            const itemsEl = el.shadowRoot.querySelector('mas-bulk-publish-items');
            expect(itemsEl.modifications).to.equal(modificationsMap);
        });
    });
});
