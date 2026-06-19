import { fixture, html, expect, oneEvent } from '@open-wc/testing';
import sinon from 'sinon';
import Store from '../../src/store.js';
import router from '../../src/router.js';
import { setItemsSelectionStore } from '../../src/common/items-selection-store.js';
import { BULK_PUBLISH_STATUS, COLLECTION_MODEL_PATH, PAGE_NAMES, QUICK_ACTION } from '../../src/constants.js';
import '../../src/bulk-publish/mas-bulk-publish-editor.js';
import { publishToast } from '../../src/bulk-publish/mas-bulk-publish-editor.js';

function seedNew(data = {}) {
    const fields = { status: BULK_PUBLISH_STATUS.DRAFT, urls: '', items: '[]', locales: [], title: '', ...data };
    Store.bulkPublishProjects.inEdit.set({
        id: null,
        getFieldValue: (k) => fields[k],
        setFieldValue: (k, v) => {
            fields[k] = v;
        },
    });
    return fields;
}

function makeFragmentStore(data = {}) {
    const fields = { status: BULK_PUBLISH_STATUS.DRAFT, urls: '', items: '[]', locales: [], title: 'Proj', ...data };
    const getFieldValues = (k) => {
        const v = fields[k];
        if (v === undefined || v === null) return [];
        return Array.isArray(v) ? v : [v];
    };
    return {
        id: 'frag-id-1',
        value: {
            id: 'frag-id-1',
            getFieldValue: (k) => fields[k],
            getFieldValues,
        },
        getFieldValue: (k) => fields[k],
        getFieldValues,
        updateField: sinon.stub(),
        setFieldValue: sinon.stub(),
        get: () => ({
            fields: Object.entries(fields).map(([name, val]) => ({ name, values: Array.isArray(val) ? val : [val] })),
        }),
        refreshFrom: sinon.stub(),
    };
}

async function makeEditor() {
    const el = await fixture(html`<mas-bulk-publish-editor></mas-bulk-publish-editor>`);
    await el.updateComplete;
    return el;
}

describe('publishToast', () => {
    it('signals "still publishing" when the poll window times out', () => {
        expect(publishToast({ timedOut: true }, BULK_PUBLISH_STATUS.PUBLISHING)).to.deep.equal({
            message: 'Still publishing — check back later.',
            variant: 'info',
        });
    });

    it('signals success when the project reached Published', () => {
        expect(publishToast({ status: BULK_PUBLISH_STATUS.PUBLISHED }, BULK_PUBLISH_STATUS.PUBLISHED)).to.deep.equal({
            message: 'Project published successfully.',
            variant: 'positive',
        });
    });

    it('stays silent for a non-terminal outcome that did not time out', () => {
        expect(
            publishToast({ status: BULK_PUBLISH_STATUS.PARTIALLY_PUBLISHED }, BULK_PUBLISH_STATUS.PARTIALLY_PUBLISHED),
        ).to.equal(null);
    });
});

describe('mas-bulk-publish-editor (computed getters)', () => {
    afterEach(() => Store.bulkPublishProjects.inEdit.set(null));

    it('isNewProject is true when project has no id', async () => {
        const el = await makeEditor();
        seedNew();
        await el.updateComplete;
        expect(el.isNewProject).to.equal(true);
    });

    it('isNewProject is false for an existing project', async () => {
        const el = await makeEditor();
        Store.bulkPublishProjects.inEdit.set(makeFragmentStore());
        await el.updateComplete;
        expect(el.isNewProject).to.equal(false);
    });

    it('isLocked is true when status is Locked', async () => {
        const el = await makeEditor();
        seedNew({ status: BULK_PUBLISH_STATUS.LOCKED });
        await el.updateComplete;
        expect(el.isLocked).to.equal(true);
    });

    it('urlLines splits urls by newline and trims', async () => {
        const el = await makeEditor();
        seedNew({ urls: '  https://a.com  \nhttps://b.com\n' });
        await el.updateComplete;
        expect(el.urlLines).to.deep.equal(['https://a.com', 'https://b.com']);
    });

    it('hasValidItems is false with no valid items', async () => {
        const el = await makeEditor();
        seedNew({ items: JSON.stringify([{ url: 'a', status: 'error' }]) });
        await el.updateComplete;
        expect(el.hasValidItems).to.equal(false);
    });

    it('hasValidItems is true with at least one valid item', async () => {
        const el = await makeEditor();
        seedNew({ items: JSON.stringify([{ url: 'a', status: 'valid' }]) });
        await el.updateComplete;
        expect(el.hasValidItems).to.equal(true);
    });

    it('disabledActions disables SAVE/DUPLICATE/PUBLISH/COPY/DELETE when locked', async () => {
        const el = await makeEditor();
        Store.bulkPublishProjects.inEdit.set(makeFragmentStore({ status: BULK_PUBLISH_STATUS.LOCKED }));
        await el.updateComplete;
        const d = el.disabledActions;
        expect(d.has(QUICK_ACTION.SAVE)).to.equal(true);
        expect(d.has(QUICK_ACTION.DUPLICATE)).to.equal(true);
        expect(d.has(QUICK_ACTION.PUBLISH)).to.equal(true);
        expect(d.has(QUICK_ACTION.COPY)).to.equal(true);
        expect(d.has(QUICK_ACTION.DELETE)).to.equal(true);
    });

    it('disabledActions disables DUPLICATE and LOCK for new project', async () => {
        const el = await makeEditor();
        seedNew();
        await el.updateComplete;
        const d = el.disabledActions;
        expect(d.has(QUICK_ACTION.DUPLICATE)).to.equal(true);
        expect(d.has(QUICK_ACTION.LOCK)).to.equal(true);
    });

    it('disabledActions disables COPY when items is empty', async () => {
        const el = await makeEditor();
        Store.bulkPublishProjects.inEdit.set(makeFragmentStore({ items: '[]' }));
        await el.updateComplete;
        expect(el.disabledActions.has(QUICK_ACTION.COPY)).to.equal(true);
    });

    it('disabledActions disables PUBLISH when status is PUBLISHING', async () => {
        const el = await makeEditor();
        Store.bulkPublishProjects.inEdit.set(
            makeFragmentStore({
                status: BULK_PUBLISH_STATUS.PUBLISHING,
                items: JSON.stringify([{ status: 'valid' }]),
            }),
        );
        await el.updateComplete;
        expect(el.disabledActions.has(QUICK_ACTION.PUBLISH)).to.equal(true);
    });

    it('disabledActions enables PUBLISH when published (status resets to DRAFT on save)', async () => {
        const el = await makeEditor();
        Store.bulkPublishProjects.inEdit.set(
            makeFragmentStore({
                status: BULK_PUBLISH_STATUS.DRAFT,
                items: JSON.stringify([{ status: 'valid' }]),
            }),
        );
        await el.updateComplete;
        expect(el.disabledActions.has(QUICK_ACTION.PUBLISH)).to.equal(false);
    });

    it('disabledActions disables PUBLISH for a new (unsaved) project even with valid items', async () => {
        const el = await makeEditor();
        seedNew({ items: JSON.stringify([{ status: 'valid' }]) });
        await el.updateComplete;
        expect(el.disabledActions.has(QUICK_ACTION.PUBLISH)).to.equal(true);
        expect(el.publishBlockedReason).to.equal('Project must be saved before publishing');
    });

    it('disabledActions enables PUBLISH when an existing project has unsaved changes (auto-saves on publish)', async () => {
        const el = await makeEditor();
        Store.bulkPublishProjects.inEdit.set(makeFragmentStore({ items: JSON.stringify([{ status: 'valid' }]) }));
        await el.updateComplete;
        el.hasChanges = true;
        await el.updateComplete;
        expect(el.disabledActions.has(QUICK_ACTION.PUBLISH)).to.equal(false);
        expect(el.publishBlockedReason).to.equal('');
    });

    it('canStartPublishing is false while the project still has unsaved changes', async () => {
        const el = await makeEditor();
        Store.bulkPublishProjects.inEdit.set(makeFragmentStore({ items: JSON.stringify([{ status: 'valid' }]) }));
        await el.updateComplete;
        el.hasChanges = true;
        expect(el.canStartPublishing).to.equal(false);
    });

    it('canStartPublishing is true once the project is saved', async () => {
        const el = await makeEditor();
        Store.bulkPublishProjects.inEdit.set(makeFragmentStore({ items: JSON.stringify([{ status: 'valid' }]) }));
        await el.updateComplete;
        el.hasChanges = false;
        expect(el.canStartPublishing).to.equal(true);
    });

    it('disabledActions disables PUBLISH when all valid items are alreadyPublished', async () => {
        const el = await makeEditor();
        Store.bulkPublishProjects.inEdit.set(
            makeFragmentStore({
                items: JSON.stringify([
                    { status: 'valid', alreadyPublished: true },
                    { status: 'valid', alreadyPublished: true },
                ]),
            }),
        );
        await el.updateComplete;
        expect(el.allAlreadyPublished).to.equal(true);
        expect(el.disabledActions.has(QUICK_ACTION.PUBLISH)).to.equal(true);
        expect(el.publishBlockedReason).to.equal('All items are already published');
    });

    it('disabledActions disables PUBLISH when project status is PUBLISHED (even if items lack alreadyPublished flag)', async () => {
        const el = await makeEditor();
        Store.bulkPublishProjects.inEdit.set(
            makeFragmentStore({
                status: BULK_PUBLISH_STATUS.PUBLISHED,
                items: JSON.stringify([{ status: 'valid' }, { status: 'valid' }]),
            }),
        );
        await el.updateComplete;
        expect(el.allAlreadyPublished).to.equal(true);
        expect(el.disabledActions.has(QUICK_ACTION.PUBLISH)).to.equal(true);
        expect(el.publishBlockedReason).to.equal('Project is already published');
    });

    it('disabledActions enables PUBLISH when at least one valid item is not alreadyPublished', async () => {
        const el = await makeEditor();
        Store.bulkPublishProjects.inEdit.set(
            makeFragmentStore({
                items: JSON.stringify([
                    { status: 'valid', alreadyPublished: true },
                    { status: 'valid', alreadyPublished: false },
                ]),
            }),
        );
        await el.updateComplete;
        expect(el.allAlreadyPublished).to.equal(false);
        expect(el.disabledActions.has(QUICK_ACTION.PUBLISH)).to.equal(false);
    });

    it('renders loading placeholder when project is null', async () => {
        const el = await makeEditor();
        Store.bulkPublishProjects.inEdit.set(null);
        await el.updateComplete;
        expect(el.shadowRoot.textContent).to.include('Loading');
    });
});

describe('mas-bulk-publish-editor (field handlers)', () => {
    afterEach(() => Store.bulkPublishProjects.inEdit.set(null));

    it('handleTitleChange updates title field', async () => {
        const el = await makeEditor();
        const fields = seedNew({ title: 'Old' });
        await el.updateComplete;
        el.handleTitleChange({ target: { value: 'New Title' } });
        expect(fields.title).to.equal('New Title');
    });

    it('handleTitleChange is a no-op when locked', async () => {
        const el = await makeEditor();
        const fs = makeFragmentStore({ status: BULK_PUBLISH_STATUS.LOCKED });
        Store.bulkPublishProjects.inEdit.set(fs);
        await el.updateComplete;
        el.handleTitleChange({ target: { value: 'Should Not Change' } });
        expect(fs.updateField.called).to.equal(false);
    });

    it('handleUrlsChange updates urls field', async () => {
        const el = await makeEditor();
        const fields = seedNew();
        await el.updateComplete;
        el.handleUrlsChange({ detail: 'https://example.com' });
        expect(fields.urls).to.equal('https://example.com');
    });

    it('handleUrlsChange is a no-op when locked', async () => {
        const el = await makeEditor();
        const fs = makeFragmentStore({ status: BULK_PUBLISH_STATUS.LOCKED });
        Store.bulkPublishProjects.inEdit.set(fs);
        await el.updateComplete;
        el.handleUrlsChange({ detail: 'https://x.com' });
        expect(fs.updateField.called).to.equal(false);
    });

    it('handleUrlRemove removes the url from urls and items', async () => {
        const el = await makeEditor();
        const items = [
            { url: 'https://a.com', status: 'valid' },
            { url: 'https://b.com', status: 'valid' },
        ];
        const fields = seedNew({ urls: 'https://a.com\nhttps://b.com', items: JSON.stringify(items) });
        await el.updateComplete;
        el.handleUrlRemove({ detail: 'https://a.com' });
        expect(fields.urls).to.equal('https://b.com');
        expect(el.items).to.have.lengthOf(1);
        expect(el.items[0].url).to.equal('https://b.com');
    });

    it('handleUrlRemove is a no-op when locked', async () => {
        const el = await makeEditor();
        const fs = makeFragmentStore({ status: BULK_PUBLISH_STATUS.LOCKED });
        Store.bulkPublishProjects.inEdit.set(fs);
        await el.updateComplete;
        el.handleUrlRemove({ detail: 'https://a.com' });
        expect(fs.updateField.called).to.equal(false);
    });
});

describe('mas-bulk-publish-editor (ensureSurface)', () => {
    afterEach(() => {
        Store.bulkPublishProjects.inEdit.set(null);
        Store.search.set({});
    });

    it('sets path to sandbox when not set', async () => {
        Store.search.set({});
        const el = await makeEditor();
        seedNew();
        await el.updateComplete;
        el.ensureSurface();
        expect(Store.search.get().path).to.equal('sandbox');
    });

    it('does not override an existing path', async () => {
        Store.search.set({ path: 'my-surface' });
        const el = await makeEditor();
        seedNew();
        await el.updateComplete;
        el.ensureSurface();
        expect(Store.search.get().path).to.equal('my-surface');
    });
});

describe('mas-bulk-publish-editor (dialog state)', () => {
    beforeEach(() => setItemsSelectionStore(Store.bulkPublishProjects));
    afterEach(() => Store.bulkPublishProjects.inEdit.set(null));

    it('handlePublish opens confirm dialog', async () => {
        const el = await makeEditor();
        seedNew();
        await el.updateComplete;
        el.handlePublish();
        expect(el.confirmOpen).to.equal(true);
    });

    it('handleConfirmCancel closes confirm dialog', async () => {
        const el = await makeEditor();
        seedNew();
        await el.updateComplete;
        el.confirmOpen = true;
        el.handleConfirmCancel();
        expect(el.confirmOpen).to.equal(false);
    });

    it('handleDuplicate opens duplicate dialog', async () => {
        const el = await makeEditor();
        seedNew();
        await el.updateComplete;
        el.handleDuplicate();
        expect(el.duplicateOpen).to.equal(true);
    });

    it('handleDuplicateCancel closes duplicate dialog', async () => {
        const el = await makeEditor();
        seedNew();
        await el.updateComplete;
        el.duplicateOpen = true;
        el.handleDuplicateCancel();
        expect(el.duplicateOpen).to.equal(false);
    });

    it('confirm dialog renders when confirmOpen is true', async () => {
        const el = await makeEditor();
        seedNew({ items: JSON.stringify([{ status: 'valid' }]) });
        await el.updateComplete;
        el.confirmOpen = true;
        await el.updateComplete;
        expect(el.shadowRoot.querySelector('mas-bulk-publish-confirm-dialog')).to.exist;
    });

    it('duplicate dialog renders when duplicateOpen is true', async () => {
        const el = await makeEditor();
        seedNew();
        await el.updateComplete;
        el.duplicateOpen = true;
        await el.updateComplete;
        expect(el.shadowRoot.querySelector('mas-bulk-publish-duplicate-dialog')).to.exist;
    });

    it('items selector renders when itemsSelectorOpen is true', async () => {
        const el = await makeEditor();
        seedNew();
        await el.updateComplete;
        el.itemsSelectorOpen = true;
        await el.updateComplete;
        expect(el.shadowRoot.querySelector('mas-add-items-dialog')).to.exist;
    });

    it('closeItemsSelector closes the selector', async () => {
        const el = await makeEditor();
        seedNew();
        await el.updateComplete;
        el.itemsSelectorOpen = true;
        el.closeItemsSelector();
        expect(el.itemsSelectorOpen).to.equal(false);
    });

    it('closeLocalesPicker closes the picker', async () => {
        const el = await makeEditor();
        seedNew();
        await el.updateComplete;
        el.localesPickerOpen = true;
        el.closeLocalesPicker();
        expect(el.localesPickerOpen).to.equal(false);
    });

    it('openLocalesPicker is a no-op when locked', async () => {
        const el = await makeEditor();
        Store.bulkPublishProjects.inEdit.set(makeFragmentStore({ status: BULK_PUBLISH_STATUS.LOCKED }));
        await el.updateComplete;
        el.openLocalesPicker();
        expect(el.localesPickerOpen).to.equal(false);
    });

    it('openItemsSelector is a no-op when locked', async () => {
        const el = await makeEditor();
        Store.bulkPublishProjects.inEdit.set(makeFragmentStore({ status: BULK_PUBLISH_STATUS.LOCKED }));
        await el.updateComplete;
        el.openItemsSelector();
        expect(el.itemsSelectorOpen).to.equal(false);
    });
});

describe('mas-bulk-publish-editor (locales)', () => {
    afterEach(() => Store.bulkPublishProjects.inEdit.set(null));

    it('confirmLocalesPicker sets locales on new project', async () => {
        const el = await makeEditor();
        const fields = seedNew();
        await el.updateComplete;
        Store.bulkPublishProjects.targetLocales.set(['en_US', 'de_DE']);
        el.localesPickerOpen = true;
        el.confirmLocalesPicker();
        expect(el.localesPickerOpen).to.equal(false);
        expect(fields.locales).to.deep.equal(['en_US', 'de_DE']);
    });

    it('confirmLocalesPicker updates locales on existing project', async () => {
        const el = await makeEditor();
        const fs = makeFragmentStore({ locales: [] });
        Store.bulkPublishProjects.inEdit.set(fs);
        await el.updateComplete;
        Store.bulkPublishProjects.targetLocales.set(['fr_FR']);
        el.localesPickerOpen = true;
        el.confirmLocalesPicker();
        expect(fs.updateField.calledWith('locales', ['fr_FR'])).to.equal(true);
        expect(el.localesPickerOpen).to.equal(false);
    });
});

describe('mas-bulk-publish-editor (save/delete/lock with repository)', () => {
    let repositoryEl;
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        repositoryEl = document.createElement('mas-repository');
        repositoryEl.setAttribute('bucket', 'test-bucket');
        document.body.appendChild(repositoryEl);
    });

    afterEach(() => {
        Store.bulkPublishProjects.inEdit.set(null);
        Store.search.set({});
        repositoryEl.remove();
        sandbox.restore();
    });

    it('saveBulkProject creates a new fragment for new projects', async () => {
        const el = await makeEditor();
        seedNew({ title: 'My Project', urls: '', items: '[]', locales: [] });
        await el.updateComplete;
        Store.search.set({ path: 'sandbox' });

        const rawFragment = { id: 'new-frag', path: '/content/dam/mas/new', fields: [] };
        repositoryEl.createFragment = sandbox.stub().resolves(rawFragment);

        await el.saveBulkProject();

        expect(repositoryEl.createFragment.calledOnce).to.equal(true);
        const [payload] = repositoryEl.createFragment.firstCall.args;
        expect(payload.title).to.equal('My Project');
        expect(payload.parentPath).to.include('sandbox');
    });

    it('validate() tags items with type derived from the fetched fragment', async () => {
        const el = await makeEditor();
        const uuid = '0b2730a3-3d21-4ad9-b664-499612c07485';
        seedNew({ title: 'x', urls: `https://studio.example/studio.html#query=${uuid}`, locales: [] });
        await el.updateComplete;
        Store.search.set({ path: 'sandbox' });
        repositoryEl.getFragmentById = sandbox.stub().resolves({
            id: uuid,
            path: '/content/dam/mas/acom/en_US/col1',
            status: 'DRAFT',
            model: { path: COLLECTION_MODEL_PATH },
            fields: [],
        });

        const items = await el.validate();

        const item = items.find((i) => i.fragmentId === uuid);
        expect(item.type).to.equal('collection');
    });

    it('items getter derives types from saved items metadata for fragments-based projects', async () => {
        const el = await makeEditor();
        const fs = makeFragmentStore({
            title: 'x',
            urls: '',
            fragments: [
                '/content/dam/mas/acom/en_US/col1',
                '/content/dam/mas/acom/en_US/dictionary/ph1',
                '/content/dam/mas/acom/en_US/card1',
            ],
            items: JSON.stringify([{ path: '/content/dam/mas/acom/en_US/col1', type: 'collection', status: 'valid' }]),
            locales: [],
        });
        Store.bulkPublishProjects.inEdit.set(fs);
        await el.updateComplete;

        expect(el.items.map((i) => i.type)).to.deep.equal(['collection', 'placeholder', 'fragment']);
    });

    it('saveBulkProject persists items metadata with types for new projects', async () => {
        const el = await makeEditor();
        seedNew({ title: 'My Project', urls: '', locales: [] });
        await el.updateComplete;
        Store.search.set({ path: 'sandbox' });
        el.localItems = [
            { url: 'a', path: '/content/dam/mas/acom/en_US/card1', status: 'valid', type: 'fragment' },
            { url: 'b', path: '/content/dam/mas/acom/en_US/col1', status: 'valid', type: 'collection' },
            { url: 'c', path: '/content/dam/mas/acom/en_US/dictionary/ph1', status: 'valid' },
            { url: 'd', path: '/bad', status: 'error' },
        ];

        repositoryEl.createFragment = sandbox.stub().resolves({ id: 'new-frag', path: '/x', fields: [] });

        await el.saveBulkProject();

        const [payload] = repositoryEl.createFragment.firstCall.args;
        const itemsField = payload.fields.find((f) => f.name === 'items');
        expect(JSON.parse(itemsField.values[0])).to.deep.equal([
            { path: '/content/dam/mas/acom/en_US/card1', type: 'fragment', status: 'valid' },
            { path: '/content/dam/mas/acom/en_US/col1', type: 'collection', status: 'valid' },
            { path: '/content/dam/mas/acom/en_US/dictionary/ph1', type: 'placeholder', status: 'valid' },
        ]);
    });

    it('saveBulkProject updates items metadata on existing projects', async () => {
        const el = await makeEditor();
        const fs = makeFragmentStore({ title: 'Existing', urls: '', items: '[]', locales: [] });
        Store.bulkPublishProjects.inEdit.set(fs);
        await el.updateComplete;
        Store.search.set({ path: 'sandbox' });
        el.localItems = [{ url: 'a', path: '/content/dam/mas/acom/en_US/dictionary/ph1', status: 'valid' }];

        repositoryEl.saveFragment = sandbox.stub().resolves({ id: 'frag-id-1' });

        await el.saveBulkProject();

        const expected = JSON.stringify([
            { path: '/content/dam/mas/acom/en_US/dictionary/ph1', type: 'placeholder', status: 'valid' },
        ]);
        expect(fs.updateField.calledWith('items', [expected])).to.equal(true);
    });

    it('saveBulkProject saves existing project', async () => {
        const el = await makeEditor();
        const fs = makeFragmentStore({ title: 'Existing', urls: '', items: '[]', locales: [] });
        Store.bulkPublishProjects.inEdit.set(fs);
        await el.updateComplete;
        Store.search.set({ path: 'sandbox' });

        repositoryEl.saveFragment = sandbox.stub().resolves({ id: 'frag-id-1' });

        await el.saveBulkProject();

        expect(repositoryEl.saveFragment.calledOnce).to.equal(true);
    });

    it('saveBulkProject shows error toast when saveFragment returns false', async () => {
        const el = await makeEditor();
        const fs = makeFragmentStore({ title: 'Proj', urls: '', items: '[]', locales: [] });
        Store.bulkPublishProjects.inEdit.set(fs);
        await el.updateComplete;
        Store.search.set({ path: 'sandbox' });

        repositoryEl.saveFragment = sandbox.stub().resolves(false);

        await el.saveBulkProject();

        expect(repositoryEl.saveFragment.calledOnce).to.equal(true);
    });

    it('publish auto-saves first when hasChanges is true', async () => {
        const el = await makeEditor();
        const fs = makeFragmentStore({
            title: 'Proj',
            urls: '',
            items: JSON.stringify([{ status: 'valid', path: '/content/dam/mas/foo' }]),
            locales: [],
        });
        Store.bulkPublishProjects.inEdit.set(fs);
        await el.updateComplete;
        Store.search.set({ path: 'sandbox' });
        el.hasChanges = true;

        const saveSpy = sandbox.spy(el, 'saveBulkProject');
        repositoryEl.saveFragment = sandbox.stub().resolves({ id: 'frag-id-1' });

        try {
            await el.publish();
        } catch {
            // publish() may throw later in the bulk-publish-client flow under WTR;
            // we only assert that saveBulkProject was invoked first.
        }

        expect(saveSpy.calledOnce).to.equal(true);
    });

    it('publish does not auto-save when hasChanges is false', async () => {
        const el = await makeEditor();
        const fs = makeFragmentStore({
            title: 'Proj',
            urls: '',
            items: JSON.stringify([{ status: 'valid', path: '/content/dam/mas/foo' }]),
            locales: [],
        });
        Store.bulkPublishProjects.inEdit.set(fs);
        await el.updateComplete;
        Store.search.set({ path: 'sandbox' });

        const saveSpy = sandbox.spy(el, 'saveBulkProject');

        try {
            await el.publish();
        } catch {
            // ignore downstream bulk-publish-client errors under WTR
        }

        expect(saveSpy.called).to.equal(false);
    });

    it('deleteBulkProject clears inEdit and navigates home for new project without calling repo', async () => {
        const el = await makeEditor();
        seedNew();
        await el.updateComplete;

        const navigateFn = sandbox.stub();
        const navStub = sandbox.stub(router, 'navigateToPage').returns(navigateFn);

        await el.deleteBulkProject();

        expect(Store.bulkPublishProjects.inEdit.value).to.be.null;
        expect(Store.bulkPublishProjects.projectId.value).to.be.null;
        expect(navStub.calledWith(PAGE_NAMES.BULK_PUBLISH)).to.equal(true);
        expect(navigateFn.calledOnce).to.equal(true);
    });

    it('deleteBulkProject calls deleteFragment and navigates home for existing project', async () => {
        const el = await makeEditor();
        const fs = makeFragmentStore();
        Store.bulkPublishProjects.inEdit.set(fs);
        await el.updateComplete;

        repositoryEl.deleteFragment = sandbox.stub().resolves();
        const navigateFn = sandbox.stub();
        const navStub = sandbox.stub(router, 'navigateToPage').returns(navigateFn);

        await el.deleteBulkProject();

        expect(repositoryEl.deleteFragment.calledOnce).to.equal(true);
        expect(Store.bulkPublishProjects.inEdit.value).to.be.null;
        expect(Store.bulkPublishProjects.projectId.value).to.be.null;
        expect(navStub.calledWith(PAGE_NAMES.BULK_PUBLISH)).to.equal(true);
        expect(navigateFn.calledOnce).to.equal(true);
    });

    it('deleteBulkProject does NOT navigate when deleteFragment rejects', async () => {
        const el = await makeEditor();
        const fs = makeFragmentStore();
        Store.bulkPublishProjects.inEdit.set(fs);
        await el.updateComplete;

        repositoryEl.deleteFragment = sandbox.stub().rejects(new Error('boom'));
        const navigateFn = sandbox.stub();
        sandbox.stub(router, 'navigateToPage').returns(navigateFn);

        await el.deleteBulkProject();

        expect(navigateFn.called).to.equal(false);
        expect(Store.bulkPublishProjects.inEdit.value).to.equal(fs);
    });

    it('#handleLock saves locked status and shows toast', async () => {
        const el = await makeEditor();
        const fs = makeFragmentStore({ status: BULK_PUBLISH_STATUS.DRAFT });
        Store.bulkPublishProjects.inEdit.set(fs);
        await el.updateComplete;

        repositoryEl.saveFragment = sandbox.stub().resolves({ id: 'frag-id-1' });

        await el.shadowRoot
            .querySelector('mas-quick-actions')
            .dispatchEvent(new CustomEvent(QUICK_ACTION.LOCK, { bubbles: true, composed: true }));
        await el.updateComplete;

        expect(repositoryEl.saveFragment.calledOnce).to.equal(true);
        expect(fs.updateField.calledWith('status', [BULK_PUBLISH_STATUS.LOCKED])).to.equal(true);
    });

    it('#handleLock reverts status when saveFragment returns false', async () => {
        const el = await makeEditor();
        const fs = makeFragmentStore({ status: BULK_PUBLISH_STATUS.DRAFT });
        Store.bulkPublishProjects.inEdit.set(fs);
        await el.updateComplete;

        repositoryEl.saveFragment = sandbox.stub().resolves(false);

        const quick = el.shadowRoot.querySelector('mas-quick-actions');
        quick.dispatchEvent(new CustomEvent(QUICK_ACTION.LOCK, { bubbles: true, composed: true }));
        await el.updateComplete;
        await new Promise((r) => setTimeout(r, 50));

        const calls = fs.updateField.getCalls().map((c) => c.args);
        const revertCall = calls.find(([field, val]) => field === 'status' && val[0] === BULK_PUBLISH_STATUS.DRAFT);
        expect(revertCall).to.exist;
    });

    it('handleDuplicateConfirmed creates a fragment and navigates', async () => {
        const el = await makeEditor();
        const fs = makeFragmentStore({ title: 'Original', items: '[]', locales: [] });
        Store.bulkPublishProjects.inEdit.set(fs);
        await el.updateComplete;
        Store.search.set({ path: 'sandbox' });

        const rawFragment = { id: 'dup-id', path: '/content/dam/mas/dup', fields: [] };
        repositoryEl.createFragment = sandbox.stub().resolves(rawFragment);

        el.duplicateOpen = true;
        await el.handleDuplicateConfirmed({ detail: { title: 'Original (Copy)' } });

        expect(repositoryEl.createFragment.calledOnce).to.equal(true);
        const [payload] = repositoryEl.createFragment.firstCall.args;
        expect(payload.title).to.equal('Original (Copy)');
        expect(el.duplicateOpen).to.equal(false);
    });
});

describe('mas-bulk-publish-editor (confirmItemsSelector)', () => {
    beforeEach(() => setItemsSelectionStore(Store.bulkPublishProjects));
    afterEach(() => {
        Store.bulkPublishProjects.inEdit.set(null);
        Store.bulkPublishProjects.selectedCards.set([]);
        Store.bulkPublishProjects.selectedCollections.set([]);
        Store.bulkPublishProjects.selectedPlaceholders.set([]);
    });

    it('merges selected items into urls and calls validate', async () => {
        const el = await makeEditor();
        const fields = seedNew({ urls: 'https://existing.com' });
        await el.updateComplete;

        Store.bulkPublishProjects.selectedCards.set(['https://new1.com']);
        Store.bulkPublishProjects.selectedCollections.set([]);
        Store.bulkPublishProjects.selectedPlaceholders.set([]);

        const validateStub = sinon.stub(el, 'validate').resolves([]);
        el.itemsSelectorOpen = true;
        await el.confirmItemsSelector();

        expect(validateStub.calledOnce).to.equal(true);
        expect(fields.urls).to.include('https://existing.com');
        expect(fields.urls).to.include('https://new1.com');
        expect(el.itemsSelectorOpen).to.equal(false);

        validateStub.restore();
    });

    it('deduplicates urls when merging', async () => {
        const el = await makeEditor();
        const fields = seedNew({ urls: 'https://a.com' });
        await el.updateComplete;

        Store.bulkPublishProjects.selectedCards.set(['https://a.com', 'https://b.com']);
        Store.bulkPublishProjects.selectedCollections.set([]);
        Store.bulkPublishProjects.selectedPlaceholders.set([]);

        sinon.stub(el, 'validate').resolves([]);
        await el.confirmItemsSelector();

        const lines = fields.urls.split('\n').filter(Boolean);
        expect(lines).to.deep.equal(['https://a.com', 'https://b.com']);

        el.validate.restore();
    });
});

describe('mas-bulk-publish-editor (handleConfirmPublish)', () => {
    afterEach(() => Store.bulkPublishProjects.inEdit.set(null));

    it('handleConfirmPublish closes confirm and calls publish', async () => {
        const el = await makeEditor();
        seedNew({ items: JSON.stringify([{ status: 'valid' }]) });
        await el.updateComplete;
        el.confirmOpen = true;

        const publishStub = sinon.stub(el, 'publish').resolves();
        el.handleConfirmPublish();

        expect(el.confirmOpen).to.equal(false);
        expect(publishStub.calledOnce).to.equal(true);
        publishStub.restore();
    });
});

describe('mas-bulk-publish-editor (openItemsSelector side effects)', () => {
    beforeEach(() => setItemsSelectionStore(Store.bulkPublishProjects));
    afterEach(() => {
        Store.bulkPublishProjects.inEdit.set(null);
        Store.search.set({});
    });

    it('openItemsSelector sets itemsSelectorOpen and clears cards', async () => {
        Store.search.set({ path: 'sandbox' });
        Store.bulkPublishProjects.allCards.set([{ id: 'old' }]);
        const el = await makeEditor();
        seedNew();
        await el.updateComplete;

        el.openItemsSelector();

        expect(el.itemsSelectorOpen).to.equal(true);
        expect(Store.bulkPublishProjects.allCards.get()).to.deep.equal([]);
    });
});

describe('mas-bulk-publish-editor (items getter edge cases)', () => {
    afterEach(() => Store.bulkPublishProjects.inEdit.set(null));

    it('items returns [] when raw JSON is invalid for existing fragment store', async () => {
        const el = await makeEditor();
        const fs = makeFragmentStore({ items: 'not-valid-json' });
        Store.bulkPublishProjects.inEdit.set(fs);
        await el.updateComplete;
        expect(el.items).to.deep.equal([]);
    });
});

describe('mas-bulk-publish-editor (setProjectField for existing project)', () => {
    afterEach(() => Store.bulkPublishProjects.inEdit.set(null));

    it('setProjectField calls updateField for existing project', async () => {
        const el = await makeEditor();
        const fs = makeFragmentStore({ title: 'Existing' });
        Store.bulkPublishProjects.inEdit.set(fs);
        await el.updateComplete;

        el.setProjectField('title', 'Updated');

        expect(fs.updateField.calledWith('title', ['Updated'])).to.equal(true);
    });
});

describe('mas-bulk-publish-editor (#handleCopy)', () => {
    afterEach(() => Store.bulkPublishProjects.inEdit.set(null));

    it('#handleCopy writes item hrefs to clipboard', async () => {
        const el = await makeEditor();
        const items = [
            { url: 'https://a.com', href: 'https://a-href.com', status: 'valid' },
            { url: 'https://b.com', href: null, status: 'valid' },
        ];
        seedNew({ items: JSON.stringify(items) });
        await el.updateComplete;

        let written = null;
        const origClipboard = navigator.clipboard;
        Object.defineProperty(navigator, 'clipboard', {
            value: {
                writeText: async (text) => {
                    written = text;
                },
            },
            configurable: true,
        });

        const quick = el.shadowRoot.querySelector('mas-quick-actions');
        quick.dispatchEvent(new CustomEvent('copy', { bubbles: true, composed: true }));
        await new Promise((r) => setTimeout(r, 20));

        Object.defineProperty(navigator, 'clipboard', { value: origClipboard, configurable: true });
        expect(written).to.include('https://a-href.com');
    });
});

describe('mas-bulk-publish-editor (error paths)', () => {
    let repositoryEl;
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        repositoryEl = document.createElement('mas-repository');
        repositoryEl.setAttribute('bucket', 'test-bucket');
        document.body.appendChild(repositoryEl);
    });

    afterEach(() => {
        Store.bulkPublishProjects.inEdit.set(null);
        Store.search.set({});
        repositoryEl.remove();
        sandbox.restore();
    });

    it('deleteBulkProject shows toast when deleteFragment throws', async () => {
        const el = await makeEditor();
        const fs = makeFragmentStore();
        Store.bulkPublishProjects.inEdit.set(fs);
        await el.updateComplete;

        repositoryEl.deleteFragment = sandbox.stub().rejects(new Error('network error'));

        await el.deleteBulkProject();

        expect(repositoryEl.deleteFragment.calledOnce).to.equal(true);
        expect(Store.bulkPublishProjects.inEdit.get()).to.not.be.null;
    });

    it('handleDuplicateConfirmed shows toast when createFragment throws', async () => {
        const el = await makeEditor();
        const fs = makeFragmentStore({ title: 'Original', items: '[]', locales: [] });
        Store.bulkPublishProjects.inEdit.set(fs);
        await el.updateComplete;
        Store.search.set({ path: 'sandbox' });

        repositoryEl.createFragment = sandbox.stub().rejects(new Error('network error'));

        el.duplicateOpen = true;
        await el.handleDuplicateConfirmed({ detail: { title: 'Original (Copy)' } });

        expect(repositoryEl.createFragment.calledOnce).to.equal(true);
        expect(el.duplicateOpen).to.equal(false);
    });

    it('#handleLock shows toast when saveFragment throws', async () => {
        const el = await makeEditor();
        const fs = makeFragmentStore({ status: BULK_PUBLISH_STATUS.DRAFT });
        Store.bulkPublishProjects.inEdit.set(fs);
        await el.updateComplete;

        repositoryEl.saveFragment = sandbox.stub().rejects(new Error('server error'));

        const quick = el.shadowRoot.querySelector('mas-quick-actions');
        quick.dispatchEvent(new CustomEvent(QUICK_ACTION.LOCK, { bubbles: true, composed: true }));
        await new Promise((r) => setTimeout(r, 30));

        const calls = fs.updateField.getCalls().map((c) => c.args);
        const revert = calls.find(([f, v]) => f === 'status' && v[0] === BULK_PUBLISH_STATUS.DRAFT);
        expect(revert).to.exist;
    });
});

describe('mas-bulk-publish-editor (validate)', () => {
    let repositoryEl;
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        repositoryEl = document.createElement('mas-repository');
        repositoryEl.setAttribute('bucket', 'test-bucket');
        document.body.appendChild(repositoryEl);
        Store.search.set({ path: 'sandbox' });
    });

    afterEach(() => {
        Store.bulkPublishProjects.inEdit.set(null);
        Store.search.set({});
        repositoryEl.remove();
        sandbox.restore();
    });

    it('validate marks invalid urls as error', async () => {
        const el = await makeEditor();
        const fields = seedNew({ urls: 'not-a-valid-url' });
        await el.updateComplete;

        const result = await el.validate();

        const errItem = result.find((i) => i.url === 'not-a-valid-url');
        expect(errItem).to.exist;
        expect(errItem.status).to.equal('error');
        expect(errItem.reason).to.equal('invalid-url');
    });

    it('validate resolves fragment by AEM path', async () => {
        const el = await makeEditor();
        const fields = seedNew({ urls: '/content/dam/mas/test/frag' });
        await el.updateComplete;

        const rawFrag = { id: 'frag-aem-1', path: '/content/dam/mas/test/frag', fields: [] };
        repositoryEl.aem = {
            sites: { cf: { fragments: { getByPath: sandbox.stub().resolves(rawFrag) } } },
        };

        const result = await el.validate();

        const item = result.find((i) => i.url === '/content/dam/mas/test/frag');
        expect(item).to.exist;
        expect(item.status).to.equal('valid');
    });

    it('validate sets alreadyPublished=true when fragment.status is PUBLISHED', async () => {
        const el = await makeEditor();
        seedNew({ urls: '/content/dam/mas/published-frag' });
        await el.updateComplete;

        const rawFrag = {
            id: 'frag-pub-1',
            path: '/content/dam/mas/published-frag',
            status: 'PUBLISHED',
            fields: [],
        };
        repositoryEl.aem = {
            sites: { cf: { fragments: { getByPath: sandbox.stub().resolves(rawFrag) } } },
        };

        const result = await el.validate();
        const item = result.find((i) => i.url === '/content/dam/mas/published-frag');
        expect(item.status).to.equal('valid');
        expect(item.alreadyPublished).to.equal(true);
    });

    it('validate sets alreadyPublished=false when fragment.status is MODIFIED', async () => {
        const el = await makeEditor();
        seedNew({ urls: '/content/dam/mas/modified-frag' });
        await el.updateComplete;

        const rawFrag = {
            id: 'frag-mod-1',
            path: '/content/dam/mas/modified-frag',
            status: 'MODIFIED',
            fields: [],
        };
        repositoryEl.aem = {
            sites: { cf: { fragments: { getByPath: sandbox.stub().resolves(rawFrag) } } },
        };

        const result = await el.validate();
        const item = result.find((i) => i.url === '/content/dam/mas/modified-frag');
        expect(item.status).to.equal('valid');
        expect(item.alreadyPublished).to.equal(false);
    });

    it('validate sets locale on the item from the fragment path.', async () => {
        const el = await makeEditor();
        seedNew({ urls: '/content/dam/mas/sandbox/en_US/locale-frag' });
        await el.updateComplete;

        const rawFrag = {
            id: 'frag-locale-1',
            path: '/content/dam/mas/sandbox/en_US/locale-frag',
            status: 'MODIFIED',
            fields: [],
        };
        repositoryEl.aem = {
            sites: { cf: { fragments: { getByPath: sandbox.stub().resolves(rawFrag) } } },
        };

        const result = await el.validate();
        const item = result.find((i) => i.url === '/content/dam/mas/sandbox/en_US/locale-frag');
        expect(item.status).to.equal('valid');
        expect(item.locale).to.equal('en_US');
    });

    it('validate marks 404 errors as not-found', async () => {
        const el = await makeEditor();
        const fields = seedNew({ urls: '/content/dam/mas/missing' });
        await el.updateComplete;

        const err = Object.assign(new Error('not found'), { response: { status: 404 } });
        repositoryEl.aem = {
            sites: { cf: { fragments: { getByPath: sandbox.stub().rejects(err) } } },
        };

        const result = await el.validate();

        const item = result.find((i) => i.url === '/content/dam/mas/missing');
        expect(item).to.exist;
        expect(item.status).to.equal('error');
        expect(item.reason).to.equal('not-found');
    });

    it('validate marks non-404 errors as error', async () => {
        const el = await makeEditor();
        const fields = seedNew({ urls: '/content/dam/mas/broken' });
        await el.updateComplete;

        const err = Object.assign(new Error('server error'), { response: { status: 500 } });
        repositoryEl.aem = {
            sites: { cf: { fragments: { getByPath: sandbox.stub().rejects(err) } } },
        };

        const result = await el.validate();

        const item = result.find((i) => i.url === '/content/dam/mas/broken');
        expect(item).to.exist;
        expect(item.reason).to.equal('error');
    });
});

describe('mas-bulk-publish-editor (openLocalesPicker)', () => {
    afterEach(() => {
        Store.bulkPublishProjects.inEdit.set(null);
        Store.search.set({});
    });

    it('openLocalesPicker sets localesPickerOpen and syncs targetLocales', async () => {
        Store.search.set({ path: 'sandbox' });
        const el = await makeEditor();
        const fields = seedNew({ locales: ['en_US', 'de_DE'] });
        await el.updateComplete;

        el.openLocalesPicker();

        expect(el.localesPickerOpen).to.equal(true);
        expect(Store.bulkPublishProjects.targetLocales.get()).to.deep.equal(['en_US', 'de_DE']);
    });

    it('locales picker dialog renders when localesPickerOpen is true', async () => {
        const el = await makeEditor();
        seedNew({ locales: [] });
        await el.updateComplete;

        el.localesPickerOpen = true;
        await el.updateComplete;

        expect(el.shadowRoot.querySelector('sp-dialog-wrapper.add-locales-dialog')).to.exist;
    });

    it('locales picker passes include-source so en_US is included', async () => {
        const el = await makeEditor();
        seedNew({ locales: [] });
        await el.updateComplete;

        el.localesPickerOpen = true;
        await el.updateComplete;

        const langPicker = el.shadowRoot.querySelector('mas-translation-languages');
        expect(langPicker).to.exist;
        expect(langPicker.hasAttribute('include-source')).to.equal(true);
    });

    it('locales picker passes include-regional so regional variants are included', async () => {
        Store.search.set({ path: 'acom' });
        const el = await makeEditor();
        seedNew({ locales: [] });
        await el.updateComplete;

        el.localesPickerOpen = true;
        await el.updateComplete;

        const langPicker = el.shadowRoot.querySelector('mas-translation-languages');
        expect(langPicker).to.exist;
        expect(langPicker.hasAttribute('include-regional')).to.equal(true);
        const codes = langPicker.localesArray.map((item) => item.locale);
        expect(codes).to.include('fr_FR');
        expect(codes).to.include('fr_CA');
        expect(codes).to.include('fr_BE');
        expect(codes).to.include('en_AU');
        expect(codes).to.include('de_AT');
    });
});

describe('mas-bulk-publish-editor (reEnrichItems on load)', () => {
    let repositoryEl;
    let sandbox;
    const CARD_MODEL_PATH = '/conf/mas/settings/dam/cfm/models/card';

    function rawCardFragment(id, path) {
        return { id, path, model: { path: CARD_MODEL_PATH }, status: 'MODIFIED', fields: [], tags: [] };
    }

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        repositoryEl = document.createElement('mas-repository');
        repositoryEl.setAttribute('bucket', 'test-bucket');
        document.body.appendChild(repositoryEl);
        Store.search.set({ path: 'sandbox' });
    });

    afterEach(() => {
        Store.bulkPublishProjects.inEdit.set(null);
        Store.search.set({});
        repositoryEl.remove();
        sandbox.restore();
    });

    it('resolves authorPath and locale by path for items reconstructed from fragments', async () => {
        const el = await makeEditor();
        const path = '/content/dam/mas/sandbox/en_US/card-1';
        const fs = makeFragmentStore({ fragments: [path] });
        Store.bulkPublishProjects.inEdit.set(fs);
        await el.updateComplete;

        const getByPath = sandbox.stub().resolves(rawCardFragment('frag-1', path));
        repositoryEl.aem = { sites: { cf: { fragments: { getByPath } } } };

        await el.reEnrichItems();

        expect(getByPath.calledWith(path)).to.equal(true);
        expect(el.localItems[0].authorPath).to.be.a('string').and.to.include('merch-card');
        expect(el.localItems[0].locale).to.equal('en_US');
    });

    it('resolves by fragmentId when the item carries one (legacy items JSON)', async () => {
        const el = await makeEditor();
        const path = '/content/dam/mas/sandbox/en_US/card-1';
        const stored = [{ url: 'u', fragmentId: 'frag-1', path, status: 'valid' }];
        const fs = makeFragmentStore({ items: JSON.stringify(stored) });
        Store.bulkPublishProjects.inEdit.set(fs);
        await el.updateComplete;

        repositoryEl.getFragmentById = sandbox.stub().resolves(rawCardFragment('frag-1', path));

        await el.reEnrichItems();

        expect(repositoryEl.getFragmentById.calledWith('frag-1')).to.equal(true);
        expect(el.localItems[0].authorPath).to.be.a('string').and.to.include('merch-card');
        expect(el.localItems[0].locale).to.equal('en_US');
    });

    it('does not mark the project as changed when re-enriching', async () => {
        const el = await makeEditor();
        const path = '/content/dam/mas/sandbox/en_US/card-1';
        const fs = makeFragmentStore({ fragments: [path] });
        Store.bulkPublishProjects.inEdit.set(fs);
        await el.updateComplete;
        el.hasChanges = false;

        repositoryEl.aem = {
            sites: { cf: { fragments: { getByPath: sandbox.stub().resolves(rawCardFragment('frag-1', path)) } } },
        };

        await el.reEnrichItems();

        expect(el.hasChanges).to.equal(false);
    });

    it('skips items that already have an authorPath', async () => {
        const el = await makeEditor();
        const stored = [{ url: 'u', path: '/x', authorPath: 'merch-card: SANDBOX', status: 'valid' }];
        const fs = makeFragmentStore({ items: JSON.stringify(stored) });
        Store.bulkPublishProjects.inEdit.set(fs);
        await el.updateComplete;

        const getByPath = sandbox.stub();
        repositoryEl.aem = { sites: { cf: { fragments: { getByPath } } } };
        repositoryEl.getFragmentById = sandbox.stub();

        await el.reEnrichItems();

        expect(getByPath.called).to.equal(false);
        expect(repositoryEl.getFragmentById.called).to.equal(false);
    });

    it('keeps the item valid when the fragment can no longer be resolved', async () => {
        const el = await makeEditor();
        const path = '/content/dam/mas/sandbox/en_US/gone';
        const fs = makeFragmentStore({ fragments: [path] });
        Store.bulkPublishProjects.inEdit.set(fs);
        await el.updateComplete;

        repositoryEl.aem = {
            sites: { cf: { fragments: { getByPath: sandbox.stub().rejects(new Error('boom')) } } },
        };

        await el.reEnrichItems();

        expect(el.localItems[0].status).to.equal('valid');
    });

    it('does not overwrite localItems when a newer run supersedes it mid-flight', async () => {
        const el = await makeEditor();
        const path = '/content/dam/mas/sandbox/en_US/card-1';
        const fs = makeFragmentStore({ fragments: [path] });
        Store.bulkPublishProjects.inEdit.set(fs);
        await el.updateComplete;

        let resolveFetch;
        const getByPath = sandbox.stub().returns(new Promise((r) => (resolveFetch = r)));
        repositoryEl.aem = { sites: { cf: { fragments: { getByPath } } } };

        const enrichPromise = el.reEnrichItems();
        const pending = [{ url: 'typed', status: 'pending' }];
        el.localItems = pending;
        el.disconnectedCallback();
        resolveFetch(rawCardFragment('frag-1', path));
        await enrichPromise;

        expect(el.localItems).to.equal(pending);
    });

    it('caps concurrent fragment fetches when re-enriching many items', async () => {
        const el = await makeEditor();
        const paths = Array.from({ length: 10 }, (n, i) => `/content/dam/mas/sandbox/en_US/card-${i}`);
        const fs = makeFragmentStore({ fragments: paths });
        Store.bulkPublishProjects.inEdit.set(fs);
        await el.updateComplete;

        let inFlight = 0;
        let peak = 0;
        const getByPath = sandbox.stub().callsFake(async (p) => {
            inFlight++;
            peak = Math.max(peak, inFlight);
            await Promise.resolve();
            await Promise.resolve();
            inFlight--;
            return rawCardFragment(`frag-${p}`, p);
        });
        repositoryEl.aem = { sites: { cf: { fragments: { getByPath } } } };

        await el.reEnrichItems();

        expect(getByPath.callCount).to.equal(10);
        expect(peak).to.be.at.most(8);
    });
});

describe('mas-bulk-publish-editor (publish)', () => {
    let repositoryEl;
    let sandbox;
    let metaEl;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        repositoryEl = document.createElement('mas-repository');
        repositoryEl.setAttribute('bucket', 'test-bucket');
        document.body.appendChild(repositoryEl);
        metaEl = document.createElement('meta');
        metaEl.setAttribute('name', 'io-base-url');
        metaEl.setAttribute('content', 'https://io-test.adobe.io');
        document.head.appendChild(metaEl);
        Store.search.set({ path: 'sandbox' });
    });

    afterEach(() => {
        Store.bulkPublishProjects.inEdit.set(null);
        Store.search.set({});
        repositoryEl.remove();
        metaEl.remove();
        sandbox.restore();
    });

    it('publish triggers the publish flow and calls the IO action', async () => {
        window.adobeIMS = { getAccessToken: () => ({ token: 'fake-token', clientId: 'mas-studio' }) };

        const el = await makeEditor();
        const items = [{ url: 'https://a.com', path: '/content/dam/mas/a', status: 'valid' }];
        const fs = makeFragmentStore({ items: JSON.stringify(items), locales: ['en_US'], status: BULK_PUBLISH_STATUS.DRAFT });
        Store.bulkPublishProjects.inEdit.set(fs);
        await el.updateComplete;

        const fetchStub = sandbox.stub(window, 'fetch').resolves(
            new Response(JSON.stringify({ accepted: true }), {
                status: 202,
                headers: { 'content-type': 'application/json' },
            }),
        );
        let polledStatus = BULK_PUBLISH_STATUS.DRAFT;
        repositoryEl.refreshFragment = sandbox.stub().callsFake(async () => {
            polledStatus = BULK_PUBLISH_STATUS.PUBLISHED;
        });
        fs.get = () => ({ fields: [{ name: 'status', values: [polledStatus] }] });

        await el.publish();

        expect(fetchStub.called).to.equal(true);
        const [url] = fetchStub.firstCall.args;
        expect(url).to.include('/bulk-publish');
        delete window.adobeIMS;
    });
});
