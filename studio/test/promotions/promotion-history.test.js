import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { waitUntil } from '@open-wc/testing-helpers/pure';
import Store from '../../src/store.js';
import Events from '../../src/events.js';
import router from '../../src/router.js';
import { PAGE_NAMES } from '../../src/constants.js';
import '../../src/swc.js';
import '../../src/promotions/mas-promotion-history.js';

const path = '/content/dam/mas/promotions/project-1';
const before = {
    id: 'project-1',
    path,
    title: 'Old project',
    description: '',
    tags: [],
    fields: [
        { name: 'promoCode', values: ['OLD'] },
        { name: 'geos', values: ['US'], multiple: true },
    ],
};
const after = {
    ...before,
    title: 'New project',
    fields: [
        { name: 'promoCode', values: ['NEW'] },
        { name: 'geos', values: ['US', 'CA'], multiple: true },
    ],
};
const version = {
    id: 'version-2',
    version: 2,
    action: 'save',
    projectId: before.id,
    targetId: before.id,
    createdAt: '2026-10-01T10:00:00Z',
    user: { id: 'author', email: 'author@adobe.com', name: 'Author' },
    changes: [
        { fragmentId: before.id, path, field: '@title', before: before.title, after: after.title, category: 'general' },
        { fragmentId: before.id, path, field: 'promoCode', before: ['OLD'], after: ['NEW'], category: 'offers' },
        { fragmentId: before.id, path, field: 'geos', before: ['US'], after: ['US', 'CA'], category: 'countries' },
    ],
    beforeSnapshot: { fragments: [{ id: before.id, path, versionId: 'native-before' }] },
    afterSnapshot: { fragments: [{ id: before.id, path, versionId: 'native-after' }] },
};

describe('Promotion history navigation', () => {
    it('preserves the project context when opening History', async () => {
        const previousPage = Store.page.get();
        const previousId = Store.promotions.promotionId.get();
        try {
            Store.page.set(PAGE_NAMES.PROMOTIONS_EDITOR);
            Store.promotions.promotionId.set('project');
            await router.navigateToPage(PAGE_NAMES.PROMOTIONS_HISTORY)();
            expect(Store.promotions.promotionId.get()).to.equal('project');
        } finally {
            Store.page.set(previousPage);
            Store.promotions.promotionId.set(previousId);
        }
    });
});

describe('Promotion version history', () => {
    let sandbox;
    let element;
    let client;
    let getWithEtag;
    let getVersion;
    let previousProfile;
    let previousUsers;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        previousProfile = Store.profile.get();
        previousUsers = Store.users.get();
        Store.profile.set({ email: 'admin@adobe.com' });
        Store.users.set([{ userPrincipalName: 'admin@adobe.com', groups: ['GRP-ODIN-MAS-ADMINS'] }]);
        client = {
            listPromotionHistory: sandbox.stub().resolves({ events: [version], currentEventId: version.id }),
            restorePromotionHistory: sandbox.stub().resolves({
                event: { ...version, id: 'version-3', action: 'restore', version: 3 },
                restored: [before.id],
            }),
        };
        getWithEtag = sandbox.stub().resolves({ ...after, etag: '"viewed"' });
        getVersion = sandbox
            .stub()
            .callsFake(async (id, versionId) => structuredClone(versionId === 'native-before' ? before : after));
    });

    afterEach(() => {
        element?.remove();
        sandbox.restore();
        Store.profile.set(previousProfile);
        Store.users.set(previousUsers);
    });

    async function mount() {
        element = document.createElement('mas-promotion-history');
        element.client = client;
        element.repository = { aem: { sites: { cf: { fragments: { getWithEtag, getVersion } } } } };
        element.projectId = before.id;
        (document.querySelector('#history-fixtures') ?? document.body).append(element);
        await waitUntil(() => !element.loading && !element.baselineLoading && element.selectedEvent);
        await element.updateComplete;
        return element.shadowRoot;
    }

    async function selectCode(root) {
        const row = element.eligibleRows.find((item) => item.field === 'promoCode');
        element.toggleRows([row], true);
        await element.updateComplete;
        root.querySelector('#restore-selected').click();
        await element.updateComplete;
    }

    it('retains the saved author and timestamp on version cards', async () => {
        const root = await mount();
        const card = root.querySelector(`[data-event-id="${version.id}"]`);

        expect(card.textContent).to.include('Author');
        expect(card.querySelector('time').dateTime).to.equal(version.createdAt);
    });

    it('marks the latest saved version current instead of inventing a separate draft version', async () => {
        const root = await mount();

        expect(root.querySelector('.history-card.current').dataset.eventId).to.equal(version.id);
        expect(root.querySelector('[data-event-id="current"]')).to.be.null;
    });

    it('shows the recorded changes while loading native before values for undo', async () => {
        const root = await mount();
        const code = root.querySelector('[data-field="promoCode"]');

        expect(code.querySelector('.before').textContent).to.equal('OLD');
        expect(code.querySelector('.after').textContent).to.equal('NEW');
        expect(getVersion.calledWith(before.id, 'native-before')).to.be.true;
        expect(element.historicalFragments[0].fields[0].values).to.deep.equal(['OLD']);
    });

    it('keeps restored versions visible in History', async () => {
        const restored = { ...version, id: 'version-3', version: 3, action: 'restore' };
        client.listPromotionHistory.resolves({ events: [restored, version], currentEventId: restored.id });

        const root = await mount();

        expect(root.querySelector('[data-event-id="version-3"]')).not.to.be.null;
        expect(root.querySelector('h2').textContent).to.equal('Version 3');
    });

    it('disables undo for fields that have changed again', async () => {
        getWithEtag.resolves({ ...after, title: 'Changed again', etag: '"later"' });

        await mount();

        expect(element.eligibleRows.some((row) => row.field === '@title')).to.be.false;
        expect(element.eligibleRows.some((row) => row.field === 'promoCode')).to.be.true;
    });

    it('can undo a field that was introduced after the historical version', async () => {
        const historical = { ...before, fields: before.fields.filter((field) => field.name !== 'promoCode') };
        getVersion.withArgs(before.id, 'native-before').resolves(historical);
        client.listPromotionHistory.resolves({
            events: [
                {
                    ...version,
                    changes: [{ ...version.changes[1], before: null }],
                },
            ],
            currentEventId: version.id,
        });

        await mount();

        expect(element.eligibleRows.some((row) => row.field === 'promoCode')).to.be.true;
    });

    it('displays historical inherited values without treating raw sentinels as conflicts', async () => {
        const inherited = {
            ...after,
            fields: after.fields.map((field) => (field.name === 'promoCode' ? { ...field, values: [''] } : field)),
        };
        getWithEtag.resolves({ ...inherited, etag: '"inherited"' });
        getVersion.withArgs('parent', 'parent-version').resolves({
            fields: [{ name: 'promoCode', values: ['INHERITED'], multiple: false }],
        });
        client.listPromotionHistory.resolves({
            events: [
                {
                    ...version,
                    changes: [{ ...version.changes[1], after: [''] }],
                    afterSnapshot: {
                        ...version.afterSnapshot,
                        inheritance: [{ fragmentId: before.id, id: 'parent', versionId: 'parent-version' }],
                    },
                },
            ],
            currentEventId: version.id,
        });

        const root = await mount();

        expect(root.querySelector('[data-field="promoCode"] .after').textContent).to.equal('INHERITED');
        expect(element.eligibleRows.some((row) => row.field === 'promoCode')).to.be.true;
    });

    it('passes only the selected fields and viewed ETags to restore', async () => {
        const root = await mount();
        await selectCode(root);

        await element.confirmRestore();

        expect(client.restorePromotionHistory.firstCall.args).to.deep.equal([
            before.id,
            version.id,
            {
                selections: [{ fragmentId: before.id, fields: ['promoCode'] }],
                expected: [{ fragmentId: before.id, etag: '"viewed"' }],
            },
        ]);
    });

    it('selects the new visible version after undo', async () => {
        const root = await mount();
        await selectCode(root);
        const toast = sandbox.spy(Events.toast, 'emit');
        const restored = { ...version, id: 'version-3', version: 3, action: 'restore' };
        client.listPromotionHistory.resolves({ events: [restored, version], currentEventId: restored.id });

        await element.confirmRestore();
        await element.updateComplete;

        expect(element.selectedEvent.id).to.equal(restored.id);
        expect(root.querySelector('.history-card.current').dataset.eventId).to.equal(restored.id);
        expect(
            toast.calledWithMatch({
                variant: 'positive',
                content: 'Selected changes have been successfully restored.',
            }),
        ).to.be.true;
    });

    it('requires confirmation before restoring selected changes', async () => {
        const root = await mount();
        await selectCode(root);

        expect(root.querySelector('#restore-confirmation')).not.to.be.null;
        expect(client.restorePromotionHistory.called).to.be.false;
    });

    it('does not allow a read-only user to restore', async () => {
        Store.users.set([]);
        const root = await mount();

        expect(root.querySelector('#restore-selected').disabled).to.be.true;
        expect(element.canRestore).to.be.false;
    });

    it('does not offer undo for the initial project creation', async () => {
        client.listPromotionHistory.resolves({
            events: [{ ...version, action: 'create', beforeSnapshot: { fragments: [] } }],
            currentEventId: version.id,
        });

        await mount();

        expect(element.eligibleRows).to.deep.equal([]);
        expect(element.canRestore).to.be.false;
    });

    it('disables restore if a native historical version is unavailable', async () => {
        getVersion.rejects(new Error('Version missing'));
        const root = await mount();

        expect(element.canRestore).to.be.false;
        expect(root.textContent).to.include('unavailable');
    });

    it('sends search text without adding audit filters', async () => {
        const root = await mount();
        const input = root.querySelector('#history-search');
        input.value = 'Author';

        root.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true }));
        await waitUntil(() => client.listPromotionHistory.callCount === 2);

        expect(client.listPromotionHistory.lastCall.args).to.deep.equal([before.id, { query: 'Author' }]);
    });

    it('loads the next page without duplicating versions or changing the current marker', async () => {
        client.listPromotionHistory.onFirstCall().resolves({ events: [version], currentEventId: version.id, cursor: 'next' });
        await mount();
        const earlier = { ...version, id: 'version-1', version: 1 };
        client.listPromotionHistory.onSecondCall().resolves({ events: [earlier], currentEventId: version.id });

        await element.loadHistory(true);

        expect(element.events.map((item) => item.id)).to.deep.equal([version.id, earlier.id]);
        expect(element.currentEventId).to.equal(version.id);
    });

    it('blocks blind retry when content changed but version capture failed', async () => {
        const root = await mount();
        await selectCode(root);
        client.restorePromotionHistory.rejects(
            Object.assign(new Error('Capture failed'), {
                details: { versionPending: true, restored: [before.id] },
            }),
        );

        await element.confirmRestore();
        await element.updateComplete;

        expect(element.canRestore).to.be.false;
        expect(root.textContent).to.include('Do not retry');
    });

    it('reports a partial restore without claiming complete success', async () => {
        const root = await mount();
        await selectCode(root);
        const toast = sandbox.spy(Events.toast, 'emit');
        client.restorePromotionHistory.resolves({
            restored: [before.id],
            failures: [{ fragmentId: 'variation', error: 'Conflict' }],
            event: { ...version, action: 'restore' },
        });

        await element.confirmRestore();

        expect(toast.calledWithMatch({ variant: 'warning' })).to.be.true;
        expect(toast.calledWithMatch({ variant: 'positive' })).to.be.false;
    });

    it('does not render rich-text markup as executable HTML', async () => {
        const root = await mount();
        element.rows = [
            {
                ...element.rows[0],
                field: 'description',
                label: 'Description',
                before: ['old'],
                after: ['<img src=x onerror=alert(1)><b>Safe text</b>'],
                segments: [{ kind: 'changed' }],
            },
        ];
        await element.updateComplete;

        expect(root.querySelector('[data-field="description"] .after').textContent).to.equal('Safe text');
        expect(root.querySelector('[data-field="description"] img')).to.be.null;
    });
});
