import { fixture, html, expect, oneEvent } from '@open-wc/testing';
import sinon from 'sinon';
import Store from '../../src/store.js';
import router from '../../src/router.js';
import { setItemsSelectionStore } from '../../src/common/items-selection-store.js';
import { BULK_PUBLISH_STATUS, PAGE_NAMES, QUICK_ACTION } from '../../src/constants.js';
import '../../src/bulk-publish/mas-bulk-publish-editor.js';

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
    return {
        id: 'frag-id-1',
        value: {
            id: 'frag-id-1',
            getFieldValue: (k) => fields[k],
            getFieldValues: (k) => (Array.isArray(fields[k]) ? fields[k] : [fields[k]]),
        },
        getFieldValue: (k) => fields[k],
        getFieldValues: (k) => (Array.isArray(fields[k]) ? fields[k] : [fields[k]]),
        updateField: sinon.stub(),
        setFieldValue: sinon.stub(),
    };
}

async function makeEditor() {
    const el = await fixture(html`<mas-bulk-publish-editor></mas-bulk-publish-editor>`);
    await el.updateComplete;
    return el;
}

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

    it('disabledActions disables PUBLISH when an existing project has unsaved changes', async () => {
        const el = await makeEditor();
        Store.bulkPublishProjects.inEdit.set(makeFragmentStore({ items: JSON.stringify([{ status: 'valid' }]) }));
        await el.updateComplete;
        el.hasChanges = true;
        await el.updateComplete;
        expect(el.disabledActions.has(QUICK_ACTION.PUBLISH)).to.equal(true);
        expect(el.publishBlockedReason).to.equal('Project must be saved before publishing');
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
        const remaining = JSON.parse(fields.items);
        expect(remaining).to.have.lengthOf(1);
        expect(remaining[0].url).to.equal('https://b.com');
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

    it('publish triggers the publish flow and calls saveFragment', async () => {
        window.adobeIMS = { getAccessToken: () => ({ token: 'fake-token', clientId: 'mas-studio' }) };

        const el = await makeEditor();
        const items = [{ url: 'https://a.com', path: '/content/dam/mas/a', status: 'valid' }];
        const fs = makeFragmentStore({ items: JSON.stringify(items), locales: ['en_US'], status: BULK_PUBLISH_STATUS.DRAFT });
        Store.bulkPublishProjects.inEdit.set(fs);
        await el.updateComplete;

        repositoryEl.saveFragment = sandbox.stub().resolves({ id: 'frag-id-1' });

        try {
            await el.publish();
        } catch {
            // network call to io-base-url will fail in tests; that's ok
        }

        expect(repositoryEl.saveFragment.called).to.equal(true);
        delete window.adobeIMS;
    });
});
