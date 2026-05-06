import { fixture, html, expect, oneEvent } from '@open-wc/testing';
import sinon from 'sinon';
import Store from '../../src/store.js';
import { BULK_PUBLISH_STATUS, QUICK_ACTION } from '../../src/constants.js';
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

    it('disabledActions disables PUBLISH when status is not Draft', async () => {
        const el = await makeEditor();
        Store.bulkPublishProjects.inEdit.set(
            makeFragmentStore({
                status: BULK_PUBLISH_STATUS.PUBLISHED,
                items: JSON.stringify([{ status: 'valid' }]),
            }),
        );
        await el.updateComplete;
        expect(el.disabledActions.has(QUICK_ACTION.PUBLISH)).to.equal(true);
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

    it('deleteBulkProject clears inEdit for new project without calling repo', async () => {
        const el = await makeEditor();
        seedNew();
        await el.updateComplete;

        await el.deleteBulkProject();

        expect(Store.bulkPublishProjects.inEdit.value).to.be.null;
    });

    it('deleteBulkProject calls deleteFragment for existing project', async () => {
        const el = await makeEditor();
        const fs = makeFragmentStore();
        Store.bulkPublishProjects.inEdit.set(fs);
        await el.updateComplete;

        repositoryEl.deleteFragment = sandbox.stub().resolves();

        await el.deleteBulkProject();

        expect(repositoryEl.deleteFragment.calledOnce).to.equal(true);
        expect(Store.bulkPublishProjects.inEdit.value).to.be.null;
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
    afterEach(() => {
        Store.bulkPublishProjects.inEdit.set(null);
        Store.translationProjects.selectedCards.set([]);
        Store.translationProjects.selectedCollections.set([]);
        Store.translationProjects.selectedPlaceholders.set([]);
    });

    it('merges selected items into urls and calls validate', async () => {
        const el = await makeEditor();
        const fields = seedNew({ urls: 'https://existing.com' });
        await el.updateComplete;

        Store.translationProjects.selectedCards.set(['https://new1.com']);
        Store.translationProjects.selectedCollections.set([]);
        Store.translationProjects.selectedPlaceholders.set([]);

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

        Store.translationProjects.selectedCards.set(['https://a.com', 'https://b.com']);
        Store.translationProjects.selectedCollections.set([]);
        Store.translationProjects.selectedPlaceholders.set([]);

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
    afterEach(() => {
        Store.bulkPublishProjects.inEdit.set(null);
        Store.search.set({});
    });

    it('openItemsSelector sets itemsSelectorOpen and clears cards', async () => {
        Store.search.set({ path: 'sandbox' });
        Store.translationProjects.allCards.set([{ id: 'old' }]);
        const el = await makeEditor();
        seedNew();
        await el.updateComplete;

        el.openItemsSelector();

        expect(el.itemsSelectorOpen).to.equal(true);
        expect(Store.translationProjects.allCards.get()).to.deep.equal([]);
    });
});
