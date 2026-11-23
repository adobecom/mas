import { expect } from '@esm-bundle/chai';
import { elementUpdated } from '@open-wc/testing-helpers';
import sinon from 'sinon';
import Events from '../../src/events.js';
import Store from '../../src/store.js';
import { Placeholder } from '../../src/aem/placeholder.js';
import { FragmentStore } from '../../src/reactivity/fragment-store.js';
import '../../src/placeholders/mas-placeholders.js';

const PLACEHOLDER_IDS = [
    '9a75e22f-9c48-418d-8da3-687e8f635282',
    '652722a1-b1d7-415f-9c3f-e88d3b3f7333',
    'b8bb460d-cf4d-47e7-b03f-a1117dd1628e',
];

function makePlaceholderStore(id, key, value, path = `/content/dam/mas/sandbox/en_US/dictionary/${key}`) {
    return new FragmentStore(
        new Placeholder({
            id,
            path,
            fields: [
                { name: 'key', values: [key] },
                { name: 'value', values: [value] },
                { name: 'richTextValue', values: [] },
            ],
        }),
    );
}

describe('mas-placeholders copy links', () => {
    let element;
    let clipboardWrite;
    let toastStub;
    let originalProfile;
    let originalUsers;
    let originalLoaded;

    beforeEach(async () => {
        originalProfile = Store.profile.get();
        originalUsers = Store.users.get();
        originalLoaded = Store.users.getMeta('loaded');
        Store.users.setMeta('loaded', true);
        Store.profile.set({ email: 'editor@adobe.com' });
        Store.users.set([{ userPrincipalName: 'editor@adobe.com', groups: ['GRP-ODIN-MAS-ACOM-EDITORS'] }]);
        Store.search.set({ path: 'sandbox' });
        Store.filters.set({ locale: 'en_US' });
        Store.sort.set({ sortBy: 'key', sortDirection: 'asc' });
        Store.placeholders.list.loading.set(false);
        Store.placeholders.selection.set([]);
        Store.placeholders.search.set('');
        Store.placeholders.list.data.set([
            makePlaceholderStore(PLACEHOLDER_IDS[0], 'first', 'First'),
            makePlaceholderStore(PLACEHOLDER_IDS[1], 'second', 'Second'),
        ]);
        clipboardWrite = sinon.stub().resolves();
        Object.defineProperty(navigator, 'clipboard', {
            value: { writeText: clipboardWrite },
            configurable: true,
        });
        toastStub = sinon.stub(Events.toast, 'emit');
        element = document.createElement('mas-placeholders');
        document.body.append(element);
        await elementUpdated(element);
    });

    afterEach(() => {
        element.remove();
        sinon.restore();
        Store.profile.set(originalProfile);
        Store.users.set(originalUsers);
        Store.users.setMeta('loaded', originalLoaded);
    });

    it('hides placeholder creation for CCDAH curators outside their surfaces', async () => {
        Store.profile.set({ email: 'curator@adobe.com' });
        Store.users.set([{ userPrincipalName: 'curator@adobe.com', groups: ['GRP-ODIN-MAS-CCDAH-CURATORS'] }]);
        await elementUpdated(element);
        expect(element.shadowRoot.querySelector('.create-button')).to.be.null;
    });

    it('blocks editing a foreign placeholder even when CCD is selected', async () => {
        Store.profile.set({ email: 'curator@adobe.com' });
        Store.users.set([{ userPrincipalName: 'curator@adobe.com', groups: ['GRP-ODIN-MAS-CCDAH-CURATORS'] }]);
        Store.search.set({ path: 'ccd' });
        await elementUpdated(element);
        const item = element.shadowRoot.querySelector('mas-placeholders-item');
        await elementUpdated(item);
        expect(item.querySelector('[aria-label="Edit placeholder"]')).to.be.null;
    });

    for (const method of ['onSave', 'onDelete', 'onPublish']) {
        it(`blocks ${method} before any mutation while memberships are loading`, async () => {
            Store.profile.set({ email: 'curator@adobe.com' });
            Store.users.set([{ userPrincipalName: 'curator@adobe.com', groups: ['GRP-ODIN-MAS-ADMINS'] }]);
            Store.users.setMeta('loaded', false);
            const item = element.shadowRoot.querySelector('mas-placeholders-item');
            const updatePending = sinon.stub(item, 'updatePending');
            const updateField = sinon.spy(item.placeholderStore, 'updateField');
            const repository = {
                saveFragment: sinon.stub().resolves(false),
                publishFragment: sinon.stub().resolves(false),
            };
            sinon.stub(document, 'querySelector').callThrough().withArgs('mas-repository').returns(repository);

            const action = item[method](new Event('click'));
            if (Store.confirmDialogOptions.get()) {
                document.createElement('mas-confirm-dialog').handleDialogAction(false);
            }
            await action;

            expect(updatePending.called).to.be.false;
            expect(updateField.called).to.be.false;
            expect(repository.saveFragment.called).to.be.false;
            expect(repository.publishFragment.called).to.be.false;
            expect(toastStub.calledWith(sinon.match({ variant: 'negative' }))).to.be.true;
        });
    }

    it('shows editing controls for a CCD placeholder to CCDAH curators', async () => {
        Store.profile.set({ email: 'curator@adobe.com' });
        Store.users.set([{ userPrincipalName: 'curator@adobe.com', groups: ['GRP-ODIN-MAS-CCDAH-CURATORS'] }]);
        Store.search.set({ path: 'ccd' });
        Store.placeholders.list.data.set([
            makePlaceholderStore(PLACEHOLDER_IDS[0], 'first', 'First', '/content/dam/mas/ccd/en_US/dictionary/first'),
        ]);
        await elementUpdated(element);
        const item = element.shadowRoot.querySelector('mas-placeholders-item');
        await elementUpdated(item);
        expect(item.querySelector('[aria-label="Edit placeholder"]')).not.to.be.null;
    });

    describe('bulk deletion access', () => {
        let repository;
        let dialog;

        beforeEach(() => {
            Store.profile.set({ email: 'curator@adobe.com' });
            Store.users.set([{ userPrincipalName: 'curator@adobe.com', groups: ['GRP-ODIN-MAS-CCDAH-CURATORS'] }]);
            Store.search.set({ path: 'ccd' });
            repository = {
                aem: {
                    sites: {
                        cf: {
                            fragments: {
                                getByPath: sinon.stub().callsFake(async (path) => ({
                                    id: 'dictionary-index',
                                    path,
                                    fields: [
                                        {
                                            name: 'entries',
                                            type: 'content-fragment',
                                            multiple: true,
                                            values: Store.placeholders.list.data.get().map((store) => store.get().path),
                                        },
                                    ],
                                })),
                                save: sinon.stub().callsFake(async (fragment) => fragment),
                            },
                        },
                    },
                },
                publishFragment: sinon.stub().resolves(true),
                bulkDeleteFragments: sinon.stub().resolves(),
                processError: sinon.stub(),
            };
            sinon.stub(document, 'querySelector').callThrough().withArgs('mas-repository').returns(repository);
            dialog = document.createElement('mas-confirm-dialog');
        });

        afterEach(() => {
            Store.confirmDialogOptions.set(null);
        });

        it('rejects retained foreign rows before mutating their index or deleting fragments', async () => {
            Store.placeholders.list.data.set([
                makePlaceholderStore(PLACEHOLDER_IDS[0], 'first', 'First', '/content/dam/mas/express/en_US/dictionary/first'),
            ]);

            const deleting = element.onBulkDelete(['first']);
            dialog.handleDialogAction(true);
            await deleting;

            expect(repository.aem.sites.cf.fragments.getByPath.called).to.be.false;
            expect(repository.bulkDeleteFragments.called).to.be.false;
            expect(toastStub.calledWith(sinon.match({ variant: 'negative' }))).to.be.true;
        });

        it('rejects a selection when the surface changes during confirmation', async () => {
            Store.placeholders.list.data.set([
                makePlaceholderStore(PLACEHOLDER_IDS[0], 'first', 'First', '/content/dam/mas/ccd/en_US/dictionary/first'),
            ]);

            const deleting = element.onBulkDelete(['first']);
            Store.search.set({ path: 'express' });
            dialog.handleDialogAction(true);
            await deleting;

            expect(repository.aem.sites.cf.fragments.getByPath.called).to.be.false;
            expect(repository.bulkDeleteFragments.called).to.be.false;
        });

        it('preserves deletion when both the selected surface and the actual placeholder are authorized', async () => {
            Store.placeholders.list.data.set([
                makePlaceholderStore(PLACEHOLDER_IDS[0], 'first', 'First', '/content/dam/mas/ccd/en_US/dictionary/first'),
            ]);
            const deleting = element.onBulkDelete(['first']);
            Store.search.set({ path: 'adobe-home' });
            dialog.handleDialogAction(true);
            await deleting;

            expect(repository.aem.sites.cf.fragments.save.calledOnce).to.be.true;
            expect(repository.bulkDeleteFragments.calledOnce).to.be.true;
        });

        it('keeps the existing index update and deletion flow for authorized CCD placeholders', async () => {
            Store.placeholders.list.data.set([
                makePlaceholderStore(PLACEHOLDER_IDS[0], 'first', 'First', '/content/dam/mas/ccd/en_US/dictionary/first'),
            ]);
            Store.placeholders.selection.set(['first']);

            const deleting = element.onBulkDelete(['first']);
            dialog.handleDialogAction(true);
            await deleting;

            expect(repository.aem.sites.cf.fragments.save.calledOnce).to.be.true;
            expect(repository.bulkDeleteFragments.calledOnce).to.be.true;
            expect(Store.placeholders.selection.get()).to.deep.equal([]);
        });
    });

    it('copies one UUID link for a single selection', async () => {
        await element.handleCopyStudioLinks(['first']);

        expect(clipboardWrite.calledOnce).to.be.true;
        expect(clipboardWrite.firstCall.args[0]).to.equal(
            `${window.location.origin}/studio.html#content-type=placeholder&page=placeholders&path=sandbox&locale=en_US&search=${PLACEHOLDER_IDS[0]}`,
        );
    });

    it('shows a negative toast and does not copy when a selected key is no longer loaded', async () => {
        await element.handleCopyStudioLinks(['first', 'missing']);

        expect(clipboardWrite.called).to.be.false;
        expect(
            toastStub.calledWith(
                sinon.match({ variant: 'negative', content: 'Selection is out of date. Reselect and try again.' }),
            ),
        ).to.be.true;
    });

    it('shows a negative toast and does not copy when a selected record is under a different locale/surface folder', async () => {
        Store.placeholders.list.data.set([
            makePlaceholderStore(PLACEHOLDER_IDS[0], 'first', 'First', '/content/dam/mas/sandbox/fr_FR/dictionary/first'),
        ]);

        await element.handleCopyStudioLinks(['first']);

        expect(clipboardWrite.called).to.be.false;
        expect(
            toastStub.calledWith(
                sinon.match({ variant: 'negative', content: 'Selection is out of date. Reselect and try again.' }),
            ),
        ).to.be.true;
    });

    it('copies newline-separated UUID links without a trailing newline', async () => {
        await element.handleCopyStudioLinks(['first', 'second']);

        const copied = clipboardWrite.firstCall.args[0];
        expect(copied.split('\n')).to.have.lengthOf(2);
        expect(copied).to.include(`search=${PLACEHOLDER_IDS[0]}`);
        expect(copied).to.include(`search=${PLACEHOLDER_IDS[1]}`);
        expect(copied.endsWith('\n')).to.be.false;
    });

    it('shows a negative toast when the clipboard write is rejected', async () => {
        clipboardWrite.rejects(new Error('Permission denied'));
        sinon.stub(console, 'error');

        await element.handleCopyStudioLinks(['first']);

        expect(toastStub.calledWith(sinon.match({ variant: 'negative' }))).to.be.true;
    });

    it('does nothing for an empty selection', async () => {
        await element.handleCopyStudioLinks([]);

        expect(clipboardWrite.called).to.be.false;
        expect(toastStub.called).to.be.false;
    });

    it('uses the bulk-copy handler for the row-menu Copy Link action', async () => {
        const item = element.shadowRoot.querySelector('mas-placeholders-item');
        item.activeDropdown = true;
        await elementUpdated(item);

        const copyItem = [...item.querySelectorAll('.dropdown-item')].find((menuItem) =>
            menuItem.textContent.includes('Copy Link'),
        );
        copyItem.click();

        expect(clipboardWrite.calledOnce).to.be.true;
        expect(clipboardWrite.firstCall.args[0]).to.include(`search=${PLACEHOLDER_IDS[0]}`);
    });
});

describe('mas-placeholders search', () => {
    let element;

    beforeEach(() => {
        Store.sort.set({ sortBy: 'key', sortDirection: 'asc' });
        Store.placeholders.selection.set([]);
        element = document.createElement('mas-placeholders');
    });

    afterEach(() => {
        element.remove();
        Store.placeholders.search.set('');
        Store.placeholders.list.data.set([]);
    });

    it('matches a UUID search term to exactly one placeholder id', () => {
        Store.placeholders.list.data.set([
            makePlaceholderStore(PLACEHOLDER_IDS[0], 'abm-first', 'shared'),
            makePlaceholderStore(PLACEHOLDER_IDS[1], 'abm-second', PLACEHOLDER_IDS[0]),
        ]);
        Store.placeholders.search.set(PLACEHOLDER_IDS[0]);

        element.sortAndFilter();

        expect(element.internalPlaceholders.map((store) => store.get().id)).to.deep.equal([PLACEHOLDER_IDS[0]]);
    });

    it('keeps substring matching keys and values for plain-text searches', () => {
        Store.placeholders.list.data.set([
            makePlaceholderStore(PLACEHOLDER_IDS[0], 'abm-key', 'other'),
            makePlaceholderStore(PLACEHOLDER_IDS[1], 'other-key', 'contains ABM value'),
            makePlaceholderStore(PLACEHOLDER_IDS[2], 'unrelated', 'other'),
        ]);
        Store.placeholders.search.set('abm');

        element.sortAndFilter();

        expect(element.internalPlaceholders.map((store) => store.get().id)).to.deep.equal([
            PLACEHOLDER_IDS[0],
            PLACEHOLDER_IDS[1],
        ]);
    });
});
