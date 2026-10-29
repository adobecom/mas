import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { waitUntil } from '@open-wc/testing-helpers/pure';
import Store from '../../src/store.js';
import Events from '../../src/events.js';
import router from '../../src/router.js';
import { PAGE_NAMES } from '../../src/constants.js';
import '../../src/swc.js';
import '../../src/promotions/mas-promotion-history.js';

const fragment = {
    id: 'project-1',
    path: '/content/dam/mas/promotions/project-1',
    versionId: 'version-1',
    title: 'Historical project',
    tags: [],
    fields: [
        { name: 'geos', values: ['US', 'CA'], multiple: true },
        { name: 'promoCode', values: ['HISTORICAL'] },
        { name: 'removedField', values: [] },
    ],
};

const version = {
    id: 'event-1',
    version: 2,
    action: 'save',
    projectId: 'project-1',
    createdAt: '2026-10-01T10:00:00Z',
    user: { id: 'author', email: 'author@adobe.com', name: 'Author' },
    changes: [
        { id: 'title', fragmentId: 'project-1', field: '@title', before: 'Old', after: 'Wrong', category: 'general' },
        { id: 'geos', fragmentId: 'project-1', field: 'geos', before: ['GB'], after: [], category: 'countries' },
        { id: 'code', fragmentId: 'project-1', field: 'promoCode', before: ['OLD'], after: [], category: 'offers' },
        { id: 'removed', fragmentId: 'project-1', field: 'removedField', before: ['gone'], after: ['Wrong'] },
    ],
    snapshot: { fragments: [{ id: fragment.id, path: fragment.path, versionId: fragment.versionId }] },
};

describe('promotion history navigation', () => {
    let previousPage;
    let previousId;

    beforeEach(() => {
        previousPage = Store.page.get();
        previousId = Store.promotions.promotionId.get();
    });

    afterEach(() => {
        Store.page.set(previousPage);
        Store.promotions.promotionId.set(previousId);
    });

    it('registers the history drilldown as a valid page', () => {
        Store.page.set('promotions-history');
        expect(Store.page.get()).to.equal('promotions-history');
    });

    it('preserves the promotion id when opening its history', async () => {
        Store.page.set(PAGE_NAMES.PROMOTIONS_EDITOR);
        Store.promotions.promotionId.set('project');
        await router.navigateToPage(PAGE_NAMES.PROMOTIONS_HISTORY)();
        expect(Store.promotions.promotionId.get()).to.equal('project');
    });
});

describe('Promotion version history', () => {
    let sandbox;
    let element;
    let client;
    let getWithEtag;
    let getVersion;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        Store.profile.set({ email: 'admin@adobe.com' });
        Store.users.set([{ userPrincipalName: 'admin@adobe.com', groups: ['GRP-ODIN-MAS-ADMINS'] }]);
        client = {
            retryPendingPromotionAudits: sandbox.stub().resolves(),
            listPromotionHistory: sandbox.stub().resolves({ events: [version], cursor: null }),
            restorePromotionHistory: sandbox.stub().resolves({
                event: { ...version, id: 'new-version' },
                restored: [{ fragmentId: 'project-1', fields: ['@title'] }],
            }),
        };
        getWithEtag = sandbox.stub().resolves({ ...fragment, title: 'Live project', etag: '"viewed-etag"' });
        getVersion = sandbox.stub().resolves(fragment);
    });

    afterEach(() => {
        element?.remove();
        sandbox.restore();
        Store.profile.set({});
        Store.users.set([]);
    });

    async function mount() {
        element = document.createElement('mas-promotion-history');
        element.client = client;
        element.repository = { aem: { sites: { cf: { fragments: { getWithEtag, getVersion } } } } };
        element.projectId = 'project-1';
        (document.querySelector('#history-fixtures') ?? document.body).append(element);
        await waitUntil(() => !element.loading && element.events.length > 0);
        await waitUntil(() => !element.baselineLoading);
        await element.updateComplete;
        return element.shadowRoot;
    }

    it('shows the audited previous value and the historical snapshot target', async () => {
        const root = await mount();
        expect(root.querySelector('[data-field="@title"] .after').textContent).to.include('Historical project');
        expect(root.querySelector('[data-field="@title"] .before').textContent).to.include('Old');
        expect(getVersion.calledWith('project-1', 'version-1')).to.be.true;
    });

    it('does not offer restore when the historical AEM version cannot be loaded', async () => {
        getVersion.rejects(new Error('Version no longer available'));
        const root = await mount();
        expect(root.querySelector('#restore-full').disabled).to.be.true;
        expect(root.querySelector('#restore-selected').disabled).to.be.true;
        expect(root.textContent).to.include('AEM');
        expect(client.restorePromotionHistory.called).to.be.false;
    });

    it('retries the original AEM manifest after a historical version request fails', async () => {
        getVersion.onFirstCall().rejects(new Error('Temporary AEM failure'));
        const root = await mount();
        await element.selectVersion(element.selectedEvent);
        await element.updateComplete;
        expect(getVersion.secondCall.args).to.deep.equal(['project-1', 'version-1']);
        expect(root.querySelector('[data-field="@title"] .after').textContent).to.include('Historical project');
        expect(root.querySelector('#restore-full').disabled).to.be.false;
    });

    it('discards a historical AEM response when a different version is selected', async () => {
        await mount();
        let complete;
        getVersion.withArgs('project-1', 'slow-version').returns(
            new Promise((resolve) => {
                complete = resolve;
            }),
        );
        const slow = element.selectVersion({
            ...version,
            id: 'slow-event',
            snapshot: { fragments: [{ id: fragment.id, path: fragment.path, versionId: 'slow-version' }] },
        });
        await element.selectVersion(version);
        complete({ ...fragment, title: 'Stale historical title' });
        await slow;
        await element.updateComplete;
        expect(element.selectedEvent.id).to.equal(version.id);
        expect(element.shadowRoot.querySelector('[data-field="@title"] .after').textContent).to.include('Historical project');
    });

    it('keeps the heading and search inside the compact versions sidebar', async () => {
        const root = await mount();
        expect(root.querySelector('aside h1').textContent).to.equal('Version history');
        expect(root.querySelector('aside sp-search').getAttribute('placeholder')).to.equal('Search version history');
        expect(root.querySelector('header')).to.be.null;
        expect(root.querySelector('.columns')).to.be.null;
    });

    it('omits filters and back-to-project controls from the sidebar', async () => {
        const root = await mount();
        expect(Boolean(root.querySelector('aside details.history-filters'))).to.be.false;
        expect(Boolean(root.querySelector('#history-back'))).to.be.false;
        expect(root.querySelector('aside #create-backup')).to.be.null;
    });

    it('shows numbered versions and change counts without action badges or paths', async () => {
        const root = await mount();
        const card = root.querySelector('.history-card');
        expect(card.querySelector('.version-label').textContent).to.equal('Version 2');
        expect(card.querySelector('.card-summary').textContent).to.include('4 changes');
        expect(card.querySelector('.card-summary').textContent).not.to.include('save');
        expect(card.textContent).not.to.include(fragment.path);
        expect(root.querySelector('main h2').textContent).to.equal('Version 2');
    });

    it('shows only Project created in the creation summary', async () => {
        client.listPromotionHistory.resolves({
            events: [{ ...version, action: 'create', version: 1, snapshot: undefined }],
            cursor: null,
        });
        const root = await mount();
        const card = root.querySelector('.history-card');
        expect(card.querySelector('.version-label').textContent).to.equal('Version 1');
        expect(card.querySelector('.card-summary').textContent.trim()).to.equal('Project created');
        expect(card.querySelector('.category-tag')).to.be.null;
        expect(card.textContent).not.to.include('Read-only event');
    });

    it('shows the current marker and distinct current and selected card states', async () => {
        client.listPromotionHistory.resolves({
            events: [version, { ...version, id: 'older', createdAt: '2026-09-01T10:00:00Z' }],
        });
        const root = await mount();
        await element.selectVersion(element.events[1]);
        await element.updateComplete;
        expect(root.querySelector('[data-event-id="event-1"]').classList.contains('current')).to.be.true;
        expect(root.querySelector('[data-event-id="older"]').classList.contains('selected')).to.be.true;
        expect(root.querySelector('.current-label').textContent).to.include('Current version');
    });

    it('summarizes added and removed country values separately', async () => {
        const root = await mount();
        const countries = root.querySelector('[aria-label="Countries"]');
        expect(countries.querySelector('.change-count.added').textContent).to.include('2 added');
        expect(countries.querySelector('.change-count.removed').textContent).to.include('1 removed');
        expect(countries.querySelectorAll('.value-tag')).to.have.length(3);
    });

    it('collapses a category without losing its selected fields', async () => {
        const root = await mount();
        element.toggleRows(element.groups.find((group) => group.label === 'Countries').rows, true);
        root.querySelector('[aria-label="Countries"] .group-toggle').click();
        await element.updateComplete;
        expect(root.querySelector('[aria-label="Countries"] .group-toggle').getAttribute('aria-expanded')).to.equal('false');
        expect(root.querySelector('[aria-label="Countries"] .group-body')).to.be.null;
        expect(element.selections).to.deep.equal([{ fragmentId: 'project-1', fields: ['geos'] }]);
    });

    it('does not present unchanged snapshot fields as changes on a save event', async () => {
        client.listPromotionHistory.resolves({
            events: [
                {
                    ...version,
                    snapshot: {
                        fragments: [
                            { ...fragment, fields: [...fragment.fields, { name: 'startDate', values: ['2026-10-01'] }] },
                        ],
                    },
                },
            ],
        });
        const root = await mount();
        expect(root.querySelector('[data-field="startDate"]')).to.be.null;
    });
    it('retries pending audit completions before the first history request', async () => {
        await mount();
        expect(client.retryPendingPromotionAudits.calledOnce).to.be.true;
        expect(client.retryPendingPromotionAudits.calledWith('project-1')).to.be.true;
        expect(client.retryPendingPromotionAudits.calledBefore(client.listPromotionHistory)).to.be.true;
    });

    it('does not retry pending completions again when refreshing the list', async () => {
        await mount();
        await element.loadHistory();
        expect(client.retryPendingPromotionAudits.calledOnce).to.be.true;
    });

    it('waits for pending completions before requesting history', async () => {
        let complete;
        client.retryPendingPromotionAudits.returns(
            new Promise((resolve) => {
                complete = resolve;
            }),
        );
        const pending = mount();
        await waitUntil(() => client.retryPendingPromotionAudits.called);
        expect(client.listPromotionHistory.called).to.be.false;
        complete();
        await pending;
        expect(client.listPromotionHistory.calledOnce).to.be.true;
    });

    it('warns but still lists history when pending completion retry fails', async () => {
        const toast = sandbox.spy(Events.toast, 'emit');
        client.retryPendingPromotionAudits.rejects(new Error('Retry unavailable'));
        await mount();
        expect(client.listPromotionHistory.calledOnce).to.be.true;
        expect(toast.calledWithMatch({ variant: 'warning' })).to.be.true;
    });

    it('exposes stable event and confirmation selectors', async () => {
        const root = await mount();
        expect(root.querySelector('.history-card[data-event-id="event-1"]')).to.exist;
        root.querySelector('#restore-full').click();
        await element.updateComplete;
        expect(root.querySelector('#restore-confirmation')).to.exist;
    });

    it('shows absent historical fields as cleared values', async () => {
        const root = await mount();
        expect(root.querySelector('[data-field="removedField"] .after').textContent).to.include('Empty');
    });

    it('does not offer selective restoration for a field absent from the snapshot schema', async () => {
        client.listPromotionHistory.resolves({
            events: [
                {
                    ...version,
                    changes: [...version.changes, { fragmentId: fragment.id, field: 'absentField', before: ['Old'] }],
                },
            ],
            cursor: null,
        });
        const root = await mount();
        expect(root.querySelector('[data-field="absentField"] .after').textContent).to.include('Empty');
        expect(root.querySelector('[data-field="absentField"] sp-checkbox').disabled).to.be.true;
        expect(root.querySelector('[data-field="removedField"] sp-checkbox').disabled).to.be.false;
    });

    it('groups rows into General info, Countries, Offers and Fragments', async () => {
        const root = await mount();
        expect([...root.querySelectorAll('.group-title')].map((node) => node.textContent.trim())).to.deep.equal([
            'General info',
            'Countries',
            'Offers',
            'Fragments',
        ]);
    });

    it('restores selected fields using the ETag captured when viewing', async () => {
        const root = await mount();
        const checkbox = root.querySelector('[data-field="@title"] sp-checkbox');
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event('change'));
        await element.updateComplete;
        root.querySelector('#restore-selected').click();
        await element.updateComplete;
        expect(client.restorePromotionHistory.called).to.be.false;
        getWithEtag.resolves({ ...fragment, etag: '"later-etag"' });
        root.querySelector('sp-dialog-wrapper').dispatchEvent(new Event('confirm'));
        await waitUntil(() => client.restorePromotionHistory.called);
        const [projectId, eventId, options] = client.restorePromotionHistory.firstCall.args;
        expect([projectId, eventId]).to.deep.equal(['project-1', 'event-1']);
        expect(options).to.deep.equal({
            selections: [{ fragmentId: 'project-1', fields: ['@title'] }],
            expected: [{ fragmentId: 'project-1', etag: '"viewed-etag"' }],
        });
    });

    it('restores a complete snapshot without selective field options', async () => {
        const root = await mount();
        root.querySelector('#restore-full').click();
        await element.updateComplete;
        root.querySelector('sp-dialog-wrapper').dispatchEvent(new Event('confirm'));
        await waitUntil(() => client.restorePromotionHistory.called);
        expect(client.restorePromotionHistory.firstCall.args[2]).to.deep.equal({
            expected: [{ fragmentId: 'project-1', etag: '"viewed-etag"' }],
        });
    });

    it('allows restoring a full backup with no recorded changes', async () => {
        client.listPromotionHistory.resolves({
            events: [{ ...version, id: 'backup-version', action: 'backup', isBackup: true, changes: [] }],
            cursor: null,
        });
        const root = await mount();
        expect(root.querySelector('#restore-full').disabled).to.be.false;
        root.querySelector('#restore-full').click();
        await element.updateComplete;
        root.querySelector('#restore-confirmation').dispatchEvent(new Event('confirm'));
        await waitUntil(() => client.restorePromotionHistory.called);
        expect(client.restorePromotionHistory.firstCall.args).to.deep.equal([
            'project-1',
            'backup-version',
            { expected: [{ fragmentId: 'project-1', etag: '"viewed-etag"' }] },
        ]);
    });

    it('offers selective restore for snapshot values that are not recorded changes', async () => {
        client.listPromotionHistory.resolves({
            events: [{ ...version, action: 'backup', isBackup: true, changes: [] }],
            cursor: null,
        });
        const root = await mount();
        const checkbox = root.querySelector('[data-field="promoCode"] sp-checkbox');
        expect(checkbox).to.exist;
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event('change'));
        await element.updateComplete;
        expect(element.selections).to.deep.equal([{ fragmentId: 'project-1', fields: ['promoCode'] }]);
        expect(root.querySelector('[data-field="promoCode"] .after').textContent).to.include('HISTORICAL');
    });

    it('offers metadata snapshot values for selective restore', async () => {
        getVersion.resolves({ ...fragment, description: 'Saved description', tags: ['mas:promotion'] });
        client.listPromotionHistory.resolves({
            events: [
                {
                    ...version,
                    changes: [],
                    snapshot: { fragments: [{ ...fragment, description: 'Saved description', tags: ['mas:promotion'] }] },
                },
            ],
            cursor: null,
        });
        const root = await mount();
        expect(root.querySelector('[data-field="@description"] .after').textContent).to.include('Saved description');
        expect(root.querySelector('[data-field="@tags"] .after').textContent).to.include('mas:promotion');
    });

    it('captures baseline revisions for unchanged full-snapshot targets', async () => {
        const secondary = { id: 'unchanged-target', versionId: 'version-2', title: 'Unchanged fragment', fields: [] };
        getWithEtag.withArgs(secondary.id).resolves({ ...secondary, etag: '"unchanged-etag"' });
        getVersion.withArgs(secondary.id, secondary.versionId).resolves(secondary);
        client.listPromotionHistory.resolves({
            events: [{ ...version, snapshot: { fragments: [fragment, secondary] } }],
            cursor: null,
        });
        const root = await mount();
        root.querySelector('#restore-full').click();
        await element.updateComplete;
        root.querySelector('#restore-confirmation').dispatchEvent(new Event('confirm'));
        await waitUntil(() => client.restorePromotionHistory.called);
        expect(client.restorePromotionHistory.firstCall.args[2].expected).to.deep.equal([
            { fragmentId: 'project-1', etag: '"viewed-etag"' },
            { fragmentId: secondary.id, etag: '"unchanged-etag"' },
        ]);
    });

    it('disables full restore when an unchanged snapshot target is missing', async () => {
        getWithEtag.withArgs('deleted-target').rejects(Object.assign(new Error('Missing'), { status: 404 }));
        client.listPromotionHistory.resolves({
            events: [
                { ...version, snapshot: { fragments: [fragment, { id: 'deleted-target', title: 'Deleted', fields: [] }] } },
            ],
            cursor: null,
        });
        const root = await mount();
        expect(root.querySelector('#restore-full').disabled).to.be.true;
        expect(root.querySelector('[data-field="@title"] sp-checkbox').disabled).to.be.false;
    });

    it('marks the latest content snapshot current rather than a newer backup or publish event', async () => {
        client.listPromotionHistory.resolves({
            events: [
                { ...version, id: 'latest-backup', action: 'backup', isBackup: true, changes: [] },
                { ...version, id: 'latest-publish', action: 'publish' },
                version,
            ],
            cursor: null,
        });
        const root = await mount();
        expect(element.currentEventId).to.equal(version.id);
        expect(root.querySelector(`.history-card[data-event-id="${version.id}"]`).classList.contains('current')).to.be.true;
        expect(root.querySelector('.history-card[data-event-id="latest-backup"]').textContent).not.to.include('Current');
    });

    it('updates the current marker when an unfiltered refresh returns a newer content snapshot', async () => {
        await mount();
        client.listPromotionHistory.resolves({
            events: [{ ...version, id: 'latest-save' }, version],
            cursor: null,
        });
        await element.loadHistory();
        expect(element.currentEventId).to.equal('latest-save');
    });

    it('does not relabel a filtered historical snapshot as current', async () => {
        await mount();
        element.filters = { user: 'another-author' };
        client.listPromotionHistory.resolves({
            events: [{ ...version, id: 'filtered-older-version' }],
            cursor: null,
        });
        await element.loadHistory();
        expect(element.currentEventId).to.equal(version.id);
    });

    it('finds the latest content snapshot on later pages without marking backups current', async () => {
        client.listPromotionHistory.onFirstCall().resolves({
            events: [{ ...version, id: 'latest-backup', action: 'backup', isBackup: true, changes: [] }],
            cursor: 'older-content',
        });
        client.listPromotionHistory.onSecondCall().resolves({ events: [version], cursor: null });
        const root = await mount();
        expect(element.currentEventId).to.equal('');
        root.querySelector('#load-more').click();
        await waitUntil(() => element.events.length === 2);
        expect(element.currentEventId).to.equal(version.id);
    });

    it('selects every eligible row from the select-all checkbox', async () => {
        const root = await mount();
        const checkbox = root.querySelector('#select-all');
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event('change'));
        await element.updateComplete;
        expect(root.querySelector('#restore-selected').textContent).to.include('(4)');
    });

    it('keeps editors read-only even when restore is invoked programmatically', async () => {
        Store.users.set([{ userPrincipalName: 'admin@adobe.com', groups: ['GRP-ODIN-MAS-PROMO-EDITORS'] }]);
        const root = await mount();
        expect(root.querySelector('#restore-full').disabled).to.be.true;
        await element.confirmRestore();
        expect(client.restorePromotionHistory.called).to.be.false;
    });

    it('allows promo powerusers to restore', async () => {
        Store.users.set([{ userPrincipalName: 'admin@adobe.com', groups: ['GRP-ODIN-MAS-PROMO-POWERUSERS'] }]);
        const root = await mount();
        expect(root.querySelector('#restore-full').disabled).to.be.false;
    });

    it('renders audit-only events without offering restoration', async () => {
        client.listPromotionHistory.resolves({
            events: [{ ...version, snapshot: undefined, action: 'publish' }],
            cursor: null,
        });
        const root = await mount();
        expect(root.textContent).to.include('Read-only event');
        expect(root.querySelector('#restore-full').disabled).to.be.true;
        expect(getWithEtag.called).to.be.false;
    });

    it('shows recorded field differences for audit entries without loading any AEM versions', async () => {
        client.listPromotionHistory.resolves({
            events: [{ ...version, snapshot: undefined }],
            cursor: null,
        });

        const root = await mount();

        expect(root.querySelector('[data-field="@title"] .before').textContent).to.include('Old');
        expect(root.querySelector('[data-field="@title"] .after').textContent).to.include('Wrong');
        expect(root.querySelector('#restore-full').disabled).to.be.true;
        expect(getVersion.called).to.be.false;
        expect(getWithEtag.called).to.be.false;
    });

    describe('automatic content undo', () => {
        beforeEach(() => {
            client.listPromotionHistory.resolves({
                events: [
                    {
                        ...version,
                        restoreMode: 'undo',
                        changes: [version.changes[0]],
                    },
                ],
                cursor: null,
            });
            getVersion.resolves({ ...fragment, title: 'Old' });
            getWithEtag.resolves({ ...fragment, title: 'Wrong', etag: '"viewed-etag"' });
        });

        it('shows the original change and enables selective undo from its native before version', async () => {
            const root = await mount();

            expect(root.querySelector('[data-field="@title"] .before').textContent).to.include('Old');
            expect(root.querySelector('[data-field="@title"] .after').textContent).to.include('Wrong');
            expect(root.querySelector('[data-field="@title"] sp-checkbox').disabled).to.be.false;
            expect(root.querySelector('[data-event-id="event-1"]').textContent).not.to.include('Read-only event');
            expect(root.querySelector('#restore-full')).to.be.null;
            element.requestRestore('full');
            expect(element.confirmation).to.equal('');
        });

        it('uses the selected-change confirmation and only sends changed fields', async () => {
            const root = await mount();
            element.toggleRows(element.eligibleRows, true);
            await element.updateComplete;
            root.querySelector('#restore-selected').click();
            await element.updateComplete;

            const dialog = root.querySelector('#restore-confirmation');
            await dialog.updateComplete;
            expect(dialog.shadowRoot.querySelector('h2').textContent).to.include('Restore selected changes');
            expect(dialog.textContent.trim()).to.equal('Do you want to continue to restore selected changes?');
            expect(dialog.hasAttribute('no-divider')).to.be.true;
            expect(dialog.size).to.equal('s');
            expect(dialog.shadowRoot.querySelector('sp-icon-alert')).to.exist;
            root.querySelector('#restore-confirmation').dispatchEvent(new Event('confirm'));
            await waitUntil(() => client.restorePromotionHistory.called);

            expect(client.restorePromotionHistory.firstCall.args[2]).to.deep.equal({
                selections: [{ fragmentId: fragment.id, fields: ['@title'] }],
                expected: [{ fragmentId: fragment.id, etag: '"viewed-etag"' }],
            });
        });

        it('blocks fields with later edits instead of treating a fresh ETag as permission to overwrite', async () => {
            getWithEtag.resolves({ ...fragment, title: 'Later edit', etag: '"fresh-etag"' });
            const root = await mount();

            expect(root.querySelector('[data-field="@title"] sp-checkbox').disabled).to.be.true;
            expect(root.querySelector('[data-field="@title"]').textContent).to.include('changed since this event');
            expect(root.querySelector('#select-all').disabled).to.be.true;
        });

        it('does not block a changed field because an unrelated field was edited later', async () => {
            getWithEtag.resolves({ ...fragment, title: 'Wrong', description: 'Later edit', etag: '"fresh-etag"' });
            const root = await mount();

            expect(root.querySelector('[data-field="@title"] sp-checkbox').disabled).to.be.false;
        });
    });

    it('omits the target path for audit events without field differences', async () => {
        client.listPromotionHistory.resolves({
            events: [
                {
                    ...version,
                    snapshot: undefined,
                    action: 'publish',
                    changes: [],
                    targetPath: fragment.path,
                    label: version.createdAt,
                },
            ],
            cursor: null,
        });

        const root = await mount();

        const card = root.querySelector('[data-event-id="event-1"]');
        expect(card.querySelector('.version-label').textContent).to.equal('Version 2');
        expect(card.textContent).not.to.include(fragment.path);
        expect(root.querySelector('main').textContent).to.include('Read-only event');
    });

    it('marks the latest content audit entry current without requiring an automatic snapshot', async () => {
        client.listPromotionHistory.resolves({
            events: [{ ...version, id: 'latest-audit', snapshot: undefined }, version],
            cursor: null,
        });

        const root = await mount();

        expect(element.currentEventId).to.equal('latest-audit');
        expect(root.querySelector('[data-event-id="latest-audit"]').classList.contains('current')).to.be.true;
    });

    it('does not allow deleted targets to be selected', async () => {
        getWithEtag.rejects(Object.assign(new Error('Not found'), { status: 404 }));
        const root = await mount();
        expect(root.querySelector('[data-field="@title"] sp-checkbox').disabled).to.be.true;
        expect(root.textContent).to.include('Deleted fragments are not recreated');
    });

    it('requests the next server page and appends without changing the current version label', async () => {
        client.listPromotionHistory.onFirstCall().resolves({ events: [version], cursor: 'page-two' });
        client.listPromotionHistory.onSecondCall().resolves({
            events: [{ ...version, id: 'older-event', createdAt: '2026-09-01T10:00:00Z' }],
            cursor: null,
        });
        const root = await mount();
        root.querySelector('#load-more').click();
        await waitUntil(() => element.events.length === 2);
        expect(client.listPromotionHistory.secondCall.args[1].cursor).to.equal('page-two');
        expect(element.currentEventId).to.equal('event-1');
    });

    it('submits version history search to the server', async () => {
        const root = await mount();
        root.querySelector('[name="query"]').value = 'offer';
        root.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true }));
        await waitUntil(() => client.listPromotionHistory.calledTwice);
        expect(client.listPromotionHistory.secondCall.args[1]).to.include({
            query: 'offer',
        });
    });

    it('shows a new draft version success summary after restoration', async () => {
        const toast = sandbox.spy(Events.toast, 'emit');
        const root = await mount();
        root.querySelector('#restore-full').click();
        await element.updateComplete;
        root.querySelector('sp-dialog-wrapper').dispatchEvent(new Event('confirm'));
        await waitUntil(() => toast.called);
        expect(toast.firstCall.args[0].message).to.include('new-version');
        expect(toast.firstCall.args[0].message).to.include('draft');
    });

    it('shows the selected changes success toast after a successful selective restore', async () => {
        const toast = sandbox.spy(Events.toast, 'emit');
        await mount();
        element.toggleRows([element.eligibleRows[0]], true);
        element.requestRestore('selected');
        await element.confirmRestore();
        expect(toast.firstCall.args[0]).to.deep.equal({
            variant: 'positive',
            message: 'Selected changes have been successfully restored.',
        });
    });

    it('warns about partial selective restoration instead of reporting success', async () => {
        const toast = sandbox.spy(Events.toast, 'emit');
        client.restorePromotionHistory.resolves({
            event: { ...version, id: 'partial-restore' },
            restored: ['project-1'],
            failures: [{ fragmentId: 'failed-fragment' }],
        });
        await mount();
        element.toggleRows([element.eligibleRows[0]], true);
        element.requestRestore('selected');
        await element.confirmRestore();
        expect(toast.firstCall.args[0].variant).to.equal('warning');
        expect(toast.firstCall.args[0].message).to.include('could not be restored');
    });

    it('reloads and selects the new draft after restoration', async () => {
        const root = await mount();
        client.listPromotionHistory.resolves({
            events: [{ ...version, id: 'new-version' }, version],
            cursor: null,
        });
        root.querySelector('#restore-full').click();
        await element.updateComplete;
        root.querySelector('sp-dialog-wrapper').dispatchEvent(new Event('confirm'));
        await waitUntil(() => !element.busy);
        expect(element.selectedEvent?.id).to.equal('new-version');
        expect(root.querySelectorAll('.change-row')).to.have.length(4);
    });

    it('keeps full restoration disabled when a snapshot target is unavailable', async () => {
        getWithEtag.rejects(Object.assign(new Error('Not found'), { status: 404 }));
        const root = await mount();
        expect(root.querySelector('#restore-full').disabled).to.be.true;
    });

    it('selects only one category using its group checkbox', async () => {
        const root = await mount();
        const checkbox = root.querySelector('[aria-label="Countries"] sp-checkbox');
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event('change'));
        await element.updateComplete;
        expect(element.selections).to.deep.equal([{ fragmentId: 'project-1', fields: ['geos'] }]);
    });

    it('cancels confirmation without restoring', async () => {
        const root = await mount();
        root.querySelector('#restore-full').click();
        await element.updateComplete;
        root.querySelector('sp-dialog-wrapper').dispatchEvent(new Event('cancel'));
        await element.updateComplete;
        expect(client.restorePromotionHistory.called).to.be.false;
        expect(root.querySelector('sp-dialog-wrapper')).to.be.null;
    });

    it('rechecks permission when a manager loses access during confirmation', async () => {
        const root = await mount();
        root.querySelector('#restore-full').click();
        await element.updateComplete;
        Store.users.set([{ userPrincipalName: 'admin@adobe.com', groups: ['GRP-ODIN-MAS-PROMO-EDITORS'] }]);
        await element.confirmRestore();
        expect(client.restorePromotionHistory.called).to.be.false;
    });

    it('disables controls while a mutation is pending', async () => {
        const root = await mount();
        let complete;
        client.restorePromotionHistory.returns(
            new Promise((resolve) => {
                complete = resolve;
            }),
        );
        root.querySelector('#restore-full').click();
        await element.updateComplete;
        root.querySelector('#restore-confirmation').dispatchEvent(new Event('confirm'));
        await waitUntil(() => client.restorePromotionHistory.called);
        await element.updateComplete;
        expect(root.querySelector('#restore-full').disabled).to.be.true;
        expect(root.querySelector('#history-search').disabled).to.be.true;
        complete({ event: version, restored: ['project-1'] });
        await waitUntil(() => !element.busy);
    });

    it('shows loading while the history request is pending', async () => {
        await mount();
        let complete;
        client.listPromotionHistory.returns(
            new Promise((resolve) => {
                complete = resolve;
            }),
        );
        const pending = element.loadHistory();
        await element.updateComplete;
        expect(element.shadowRoot.querySelector('[aria-label="Loading history"]')).to.exist;
        complete({ events: [version], cursor: null });
        await pending;
    });

    it('shows an empty result without restoring the previous selection', async () => {
        await mount();
        client.listPromotionHistory.resolves({ events: [], cursor: null });
        await element.loadHistory();
        await element.updateComplete;
        expect(element.shadowRoot.textContent).to.include('No history matches');
        expect(element.selectedEvent).to.be.null;
    });

    it('recovers a failed list request through retry', async () => {
        const root = await mount();
        client.listPromotionHistory.rejects(new Error('Network unavailable'));
        await element.loadHistory();
        await element.updateComplete;
        expect(root.querySelector('[role="alert"]').textContent).to.include('Could not load');
        client.listPromotionHistory.resolves({ events: [version], cursor: null });
        root.querySelector('#retry-history').click();
        await waitUntil(() => !element.busy && element.events.length === 1);
        expect(element.error).to.equal('');
    });

    it('ignores stale comparison results after selecting another version', async () => {
        await mount();
        let complete;
        getWithEtag.onSecondCall().returns(
            new Promise((resolve) => {
                complete = resolve;
            }),
        );
        const pending = element.selectVersion({ ...version, id: 'slow-version' });
        await element.selectVersion({ ...version, id: 'chosen-version' });
        complete({ ...fragment, etag: '"stale-etag"' });
        await pending;
        expect(element.selectedEvent.id).to.equal('chosen-version');
        expect(element.expected[0].etag).to.equal('"viewed-etag"');
    });

    it('preserves selection and exposes retry after a restore conflict', async () => {
        client.restorePromotionHistory.rejects(Object.assign(new Error('Conflict'), { status: 412 }));
        const root = await mount();
        root.querySelector('#restore-full').click();
        await element.updateComplete;
        root.querySelector('sp-dialog-wrapper').dispatchEvent(new Event('confirm'));
        await waitUntil(() => Boolean(element.operationError));
        await element.updateComplete;
        expect(root.textContent).to.include('changed since');
        expect(root.querySelector('#retry-version')).to.exist;
    });

    it('shows an explicit permission message when the server refuses restore', async () => {
        client.restorePromotionHistory.rejects(Object.assign(new Error('Forbidden'), { status: 403 }));
        const root = await mount();
        element.requestRestore('full');

        await element.confirmRestore();
        await element.updateComplete;

        expect(root.querySelector('[role="alert"]').textContent).to.include('permission');
        expect(root.querySelector('[role="alert"]').textContent).not.to.include('Deleted fragments');
        expect(element.selectedEvent.id).to.equal(version.id);
    });

    it('requests sign-in instead of a version reload when the restore session is invalid', async () => {
        client.restorePromotionHistory.rejects(Object.assign(new Error('Unauthorized'), { status: 401 }));
        const root = await mount();
        element.requestRestore('full');

        await element.confirmRestore();
        await element.updateComplete;

        expect(root.querySelector('[role="alert"]').textContent).to.include('Sign in');
    });

    it('renders untrusted historical content as text', async () => {
        getVersion.resolves({ ...fragment, title: '<img src=x onerror=alert(1)>' });
        client.listPromotionHistory.resolves({
            events: [{ ...version, snapshot: { fragments: [{ ...fragment, title: '<img src=x onerror=alert(1)>' }] } }],
            cursor: null,
        });
        const root = await mount();
        expect(root.querySelector('.after img')).to.be.null;
        expect(root.querySelector('[data-field="@title"] .after').textContent).to.include('<img');
    });
});
