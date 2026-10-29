import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { waitUntil } from '@open-wc/testing-helpers/pure';
import Store from '../../src/store.js';
import Events from '../../src/events.js';
import router from '../../src/router.js';
import { PAGE_NAMES, CARD_MODEL_PATH } from '../../src/constants.js';
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
    let getByPath;
    let getById;
    let getReferencedBy;
    let previousProfile;
    let previousUsers;
    let observers;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        previousProfile = Store.profile.get();
        previousUsers = Store.users.get();
        Store.profile.set({ email: 'admin@adobe.com' });
        Store.users.set([{ userPrincipalName: 'admin@adobe.com', groups: ['GRP-ODIN-MAS-ADMINS'] }]);
        client = {
            getCachedPromotionHistory: sandbox.stub(),
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
        getByPath = sandbox.stub().rejects(new Error('Fragment unavailable'));
        getById = sandbox.stub();
        getReferencedBy = sandbox.stub().resolves({ parentReferences: [] });
        observers = [];
        sandbox.stub(window, 'IntersectionObserver').callsFake(function (callback) {
            this.observe = sandbox.spy();
            this.disconnect = sandbox.spy();
            this.trigger = () => callback([{ isIntersecting: true }]);
            observers.push(this);
        });
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
        element.repository = {
            aem: { sites: { cf: { fragments: { getWithEtag, getVersion, getByPath, getById, getReferencedBy } } } },
        };
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

    function createdPromoVersion(pznTags) {
        const promo = {
            id: 'created-promo',
            path: '/content/dam/mas/acom/en_US/promotions/sale/photoshop',
            title: 'Photoshop summer promo',
            tags: [],
            fields: [
                { name: 'cardTitle', values: ['Promo heading'] },
                { name: 'promoCode', values: ['SUMMER'] },
                { name: 'pznTags', values: pznTags },
            ],
        };
        getVersion.withArgs(promo.id, 'created-version').resolves(promo);
        getVersion.withArgs('default-card', 'default-version').resolves({
            id: 'default-card',
            path: '/content/dam/mas/acom/en_US/photoshop',
            title: 'Default card',
            fields: [
                { name: 'cardTitle', values: ['Photoshop Individual'] },
                { name: 'variant', values: ['mini-compare-chart'] },
            ],
        });
        getWithEtag.withArgs(promo.id).resolves({
            ...promo,
            title: 'Renamed later',
            fields: [{ name: 'pznTags', values: ['mas:pzn/country/US'] }],
            etag: '"later"',
        });
        client.listPromotionHistory.resolves({
            events: [
                {
                    ...version,
                    action: 'create',
                    targetId: promo.id,
                    changes: [
                        {
                            fragmentId: promo.id,
                            path: promo.path,
                            field: '@title',
                            before: null,
                            after: promo.title,
                            category: 'fragments',
                        },
                        ...promo.fields.map((field) => ({
                            fragmentId: promo.id,
                            path: promo.path,
                            field: field.name,
                            before: null,
                            after: field.values,
                            category: 'fragments',
                        })),
                    ],
                    beforeSnapshot: { fragments: [] },
                    afterSnapshot: {
                        fragments: [{ id: promo.id, path: promo.path, versionId: 'created-version' }],
                        inheritance: [{ fragmentId: promo.id, id: 'default-card', versionId: 'default-version' }],
                    },
                },
            ],
            currentEventId: version.id,
        });
        return promo;
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

        const root = await mount();

        expect(element.eligibleRows.some((row) => row.field === '@title')).to.be.false;
        expect(element.eligibleRows.some((row) => row.field === 'promoCode')).to.be.true;
        expect(root.textContent).not.to.include('This field has changed since this event. Review newer changes.');
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
        expect(root.querySelector('#restore-confirmation p').textContent).to.equal(
            'Do you want to continue to restore selected changes?',
        );
        expect(client.restorePromotionHistory.called).to.be.false;
    });

    it('removes restore progress before notifying success without waiting for history to refresh', async () => {
        const root = await mount();
        await selectCode(root);
        let overlayAtNotification;
        const toast = sandbox.stub(Events.toast, 'emit').callsFake(() => {
            overlayAtNotification = root.querySelector('.restore-overlay');
        });
        let finishRestore;
        let finishHistory;
        const restore = new Promise((resolve) => {
            finishRestore = resolve;
        });
        const history = new Promise((resolve) => {
            finishHistory = resolve;
        });
        client.restorePromotionHistory.returns(restore);
        client.listPromotionHistory.returns(history);

        const pending = element.confirmRestore();
        await element.updateComplete;

        expect(root.querySelector('.restore-overlay sp-progress-circle')).not.to.be.null;
        expect(root.querySelector('.history-layout').inert).to.be.true;
        const bounds = root.querySelector('.restore-overlay').getBoundingClientRect();
        expect(bounds.width).to.equal(window.innerWidth);
        expect(bounds.height).to.equal(window.innerHeight);
        finishRestore({ restored: [before.id], event: { ...version, id: 'version-3', version: 3 } });
        await waitUntil(() => client.listPromotionHistory.callCount === 2);
        await element.updateComplete;
        expect(root.querySelector('.restore-overlay')).to.be.null;
        expect(root.querySelector('.history-layout').inert).to.be.false;
        expect(toast.calledWithMatch({ variant: 'positive' })).to.be.true;
        expect(overlayAtNotification).to.be.null;

        finishHistory({ events: [{ ...version, id: 'version-3', version: 3 }], currentEventId: 'version-3' });
        await pending;
        await element.updateComplete;

        expect(root.querySelector('.restore-overlay')).to.be.null;
        expect(root.querySelector('.history-layout').inert).to.be.false;
        expect(element.selectedEvent.id).to.equal('version-3');
    });

    it('removes restore progress and shows the error when restoration fails', async () => {
        const root = await mount();
        await selectCode(root);
        client.restorePromotionHistory.rejects(Object.assign(new Error('Conflict'), { status: 409 }));

        await element.confirmRestore();
        await element.updateComplete;

        expect(root.querySelector('.restore-overlay')).to.be.null;
        expect(root.querySelector('.history-layout').inert).to.be.false;
        expect(root.querySelector('[role="alert"]').textContent).to.include('changed');
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

    it('omits the repeated field-state message without enabling unrestorable fields', async () => {
        client.listPromotionHistory.resolves({
            events: [{ ...version, action: 'create', beforeSnapshot: { fragments: [] } }],
            currentEventId: version.id,
        });

        const root = await mount();

        expect(root.textContent).not.to.include('Field is unavailable or already matches this saved state');
        expect(root.querySelector('[data-field="promoCode"] sp-checkbox').disabled).to.be.true;
    });

    it('groups attached default, country and promo references by their card with links to the correct fragments', async () => {
        const cardPath = '/content/dam/mas/acom/en_US/photoshop';
        const countryPath = '/content/dam/mas/acom/en_US/pzn/photoshop-fi';
        const promoPath = '/content/dam/mas/acom/en_US/promotions/sale/photoshop';
        const card = {
            id: 'card',
            path: cardPath,
            title: 'photoshop-card',
            model: { path: CARD_MODEL_PATH },
            fields: [
                { name: 'cardTitle', values: ['<b>Photoshop Individual</b>'] },
                { name: 'variant', values: ['mini-compare-chart'] },
                { name: 'mnemonicIcon', values: ['/img/photoshop.svg'] },
                { name: 'variations', values: [countryPath] },
            ],
        };
        const country = {
            ...card,
            id: 'country',
            path: countryPath,
            fields: [{ name: 'pznTags', values: ['FI'] }],
        };
        const promo = {
            ...card,
            id: 'promo',
            path: promoPath,
            tags: ['mas:promotion/sale'],
            fields: [{ name: 'pznTags', values: ['GB', 'DE', 'FR'] }],
        };
        const references = [cardPath, countryPath, promoPath];
        getByPath.withArgs(cardPath).resolves(card);
        getByPath.withArgs(countryPath).resolves(country);
        getByPath.withArgs(promoPath).resolves(promo);
        getById.withArgs(card.id).resolves(card);
        getReferencedBy.resolves({ parentReferences: [{ id: card.id, path: card.path }] });
        getWithEtag.resolves({ ...after, fields: [{ name: 'fragments', values: references }], etag: '"refs"' });
        client.listPromotionHistory.resolves({
            events: [
                {
                    ...version,
                    changes: [
                        {
                            fragmentId: before.id,
                            path,
                            field: 'fragments',
                            before: [],
                            after: references,
                            category: 'fragments',
                        },
                    ],
                },
            ],
            currentEventId: version.id,
        });

        const root = await mount();
        const section = root.querySelector('[aria-label="Fragments"]');
        const links = [...section.querySelectorAll('a.fragment-link')];

        expect(section.querySelectorAll('.fragment-changes')).to.have.length(1);
        expect(section.querySelector('.fragment-heading strong').textContent).to.equal('Photoshop Individual');
        expect(section.querySelector('.fragment-path').textContent).to.include('ACOM / merch-card');
        expect(section.querySelector('.product-icon').getAttribute('src')).to.equal('/img/photoshop.svg');
        expect([...section.querySelectorAll('.field-label')].map((label) => label.textContent.trim())).to.deep.equal([
            'Fragment:',
            'Country:',
            'Promo variation:',
        ]);
        expect(links.map((link) => new URLSearchParams(link.hash.slice(1)).get('fragmentId'))).to.deep.equal([
            card.id,
            country.id,
            promo.id,
        ]);
        expect(section.textContent).to.include('Applies to 3 countries');
        expect(section.textContent).to.include('GB, DE, FR');

        element.toggleRows(element.eligibleRows, true);
        expect(element.selections).to.deep.equal([{ fragmentId: before.id, fields: ['fragments'] }]);
    });

    it('shows country changes under the historical default card and opens the affected promo variation', async () => {
        const promoPath = '/content/dam/mas/acom/en_US/promotions/sale/photoshop';
        const promo = {
            id: 'promo',
            path: promoPath,
            title: 'Photoshop promo',
            fields: [{ name: 'pznTags', values: ['FI'] }],
        };
        getVersion.withArgs(promo.id, 'promo-before').resolves(promo);
        getVersion.withArgs('default-card', 'default-version').resolves({
            id: 'default-card',
            path: '/content/dam/mas/acom/en_US/photoshop',
            title: 'Photoshop Individual',
            fields: [{ name: 'variant', values: ['mini-compare-chart'] }],
        });
        getWithEtag.withArgs(promo.id).resolves({
            ...promo,
            fields: [{ name: 'pznTags', values: ['FI', 'DE'] }],
            etag: '"promo"',
        });
        client.listPromotionHistory.resolves({
            events: [
                {
                    ...version,
                    targetId: promo.id,
                    changes: [
                        {
                            fragmentId: promo.id,
                            path: promoPath,
                            field: 'pznTags',
                            before: ['FI'],
                            after: ['FI', 'DE'],
                            category: 'fragments',
                        },
                    ],
                    beforeSnapshot: {
                        fragments: [{ id: promo.id, path: promoPath, versionId: 'promo-before' }],
                        inheritance: [{ fragmentId: promo.id, id: 'default-card', versionId: 'default-version' }],
                    },
                },
            ],
            currentEventId: version.id,
        });

        const root = await mount();
        const section = root.querySelector('[aria-label="Fragments"]');

        expect(section.querySelector('.fragment-heading strong').textContent).to.equal('Photoshop Individual');
        expect(section.querySelector('.field-label').textContent).to.equal('Country:');
        expect(section.querySelector('.change-badge').textContent.trim()).to.equal('Added');
        expect(section.textContent).to.include('Applies to promo variation:');
        expect(section.textContent).to.include(promo.title);
        expect(new URLSearchParams(section.querySelector('a.fragment-link').hash.slice(1)).get('fragmentId')).to.equal(
            promo.id,
        );
    });

    it('summarizes promo creation as one addition under its default card without listing its fields', async () => {
        const promo = createdPromoVersion(['mas:pzn/country/GB', 'mas:pzn/country/DE']);

        const root = await mount();
        const section = root.querySelector('[aria-label="Fragments"]');

        expect(section.querySelector('.fragment-heading strong').textContent).to.equal('Photoshop Individual');
        expect(section.querySelectorAll('.change-row')).to.have.length(1);
        expect(section.querySelector('.change-count').textContent).to.equal('1 added');
        expect(section.querySelector('.change-badge').textContent.trim()).to.equal('Added');
        expect(section.querySelector('.field-label').textContent).to.equal('Promo variation:');
        expect(section.querySelector('.fragment-name').textContent).to.equal(promo.title);
        expect(section.textContent).to.include('Applies to 2 countries: GB, DE');
        expect(section.textContent).not.to.include('Promo heading');
        expect(section.textContent).not.to.include('SUMMER');
        expect(section.querySelector('.fragment-path')).to.be.null;
        expect(new URLSearchParams(section.querySelector('.fragment-link').hash.slice(1)).get('fragmentId')).to.equal(promo.id);
        expect(element.selectedEvent.changes).to.have.length(4);
        expect(element.eligibleRows).to.deep.equal([]);
    });

    it('labels a created promo without geo tags Baseline using its saved version rather than its later state', async () => {
        const promo = createdPromoVersion([]);

        const root = await mount();
        const section = root.querySelector('[aria-label="Fragments"]');

        expect(section.querySelectorAll('.change-row')).to.have.length(1);
        expect(section.querySelector('.fragment-name').textContent).to.equal(promo.title);
        expect(section.textContent).to.include('Baseline');
        expect(section.textContent).not.to.include('Applies to');
        expect(section.textContent).not.to.include('Renamed later');
        expect(section.querySelector('.change-count').textContent).to.equal('1 added');
        expect(element.canRestore).to.be.false;
    });

    it('reports unavailable referenced fragments without linking to the project as if it were the fragment', async () => {
        const missingPath = '/content/dam/mas/acom/en_US/deleted-card';
        client.listPromotionHistory.resolves({
            events: [
                {
                    ...version,
                    changes: [
                        {
                            fragmentId: before.id,
                            path,
                            field: 'fragments',
                            before: [missingPath],
                            after: [],
                            category: 'fragments',
                        },
                    ],
                },
            ],
            currentEventId: version.id,
        });

        const root = await mount();
        const section = root.querySelector('[aria-label="Fragments"]');

        expect(section.textContent).to.include('Fragment details unavailable');
        expect(section.querySelector('a.fragment-link')).to.be.null;
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

        expect(client.listPromotionHistory.lastCall.args.slice(0, 2)).to.deep.equal([
            before.id,
            { limit: 10, query: 'Author' },
        ]);
    });

    it('shows cached versions immediately while refreshing them in the background', async () => {
        let complete;
        client.getCachedPromotionHistory.returns({ events: [version], currentEventId: version.id });
        client.listPromotionHistory.callsFake(() => new Promise((resolve) => (complete = resolve)));

        const root = await mount();

        expect(root.querySelector(`[data-event-id="${version.id}"]`)).not.to.be.null;
        expect(element.canRestore).to.be.false;
        expect(client.listPromotionHistory.firstCall.args).to.deep.equal([before.id, { limit: 10 }, { refresh: true }]);

        const latest = { ...version, id: 'version-3', version: 3 };
        complete({ events: [latest, version], currentEventId: latest.id });
        await waitUntil(() => element.currentEventId === latest.id && !element.refreshing);

        expect(element.selectedEvent.id).to.equal(version.id);
        expect(element.canRestore).to.be.true;
    });

    it('reports background refresh failures without discarding the cached list or enabling restore', async () => {
        let fail;
        client.getCachedPromotionHistory.returns({ events: [version], currentEventId: version.id });
        client.listPromotionHistory.callsFake(() => new Promise((resolve, reject) => (fail = reject)));
        const root = await mount();

        fail(new Error('Unavailable'));
        await waitUntil(() => Boolean(element.error));
        await element.updateComplete;

        expect(root.querySelector(`[data-event-id="${version.id}"]`)).not.to.be.null;
        expect(root.querySelector('[role="alert"]').textContent).to.include('refresh');
        expect(element.canRestore).to.be.false;
    });

    it('removes cached versions and comparison data when revalidation denies access', async () => {
        let fail;
        client.getCachedPromotionHistory.returns({ events: [version], currentEventId: version.id });
        client.listPromotionHistory.callsFake(() => new Promise((resolve, reject) => (fail = reject)));
        const root = await mount();

        fail(Object.assign(new Error('Forbidden'), { status: 403 }));
        await waitUntil(() => Boolean(element.error));
        await element.updateComplete;

        expect(root.querySelector('.history-card')).to.be.null;
        expect(element.selectedEvent).to.be.null;
        expect(element.expected).to.deep.equal([]);
        expect(element.canRestore).to.be.false;
    });

    it('ignores a cached project refresh that completes after switching projects', async () => {
        let complete;
        client.getCachedPromotionHistory.onFirstCall().returns({ events: [version], currentEventId: version.id });
        client.listPromotionHistory.onFirstCall().callsFake(() => new Promise((resolve) => (complete = resolve)));
        await mount();
        const other = { ...version, id: 'other-version', projectId: 'other-project' };
        client.listPromotionHistory.onSecondCall().resolves({ events: [other], currentEventId: other.id });

        element.projectId = 'other-project';
        await waitUntil(() => element.currentEventId === other.id && !element.loading);
        complete({ events: [version], currentEventId: version.id });
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(element.events.map((event) => event.id)).to.deep.equal([other.id]);
        expect(element.selectedEvent.id).to.equal(other.id);
    });

    it('loads one next page automatically near the bottom and disconnects its observer', async () => {
        client.listPromotionHistory.onFirstCall().resolves({ events: [version], currentEventId: version.id, cursor: 'next' });
        await mount();
        const observer = observers.find((item) =>
            item.observe.calledWith(element.shadowRoot.querySelector('#history-sentinel')),
        );
        expect(observer).not.to.be.undefined;
        let complete;
        client.listPromotionHistory.onSecondCall().callsFake(() => new Promise((resolve) => (complete = resolve)));

        observer.trigger();
        observer.trigger();
        expect(client.listPromotionHistory.callCount).to.equal(2);
        expect(client.listPromotionHistory.lastCall.args[1]).to.deep.equal({ limit: 10, cursor: 'next' });
        const earlier = { ...version, id: 'version-1', version: 1 };
        complete({ events: [earlier, version], currentEventId: version.id });
        await waitUntil(() => !element.loading);

        expect(element.events.map((event) => event.id)).to.deep.equal([version.id, earlier.id]);
        observer.disconnect.resetHistory();
        element.remove();
        expect(observer.disconnect.calledOnce).to.be.true;
    });

    it('shows a loading-more indicator only while the next page is loading, without a load-more button', async () => {
        client.listPromotionHistory.onFirstCall().resolves({ events: [version], currentEventId: version.id, cursor: 'next' });
        const root = await mount();
        expect(root.querySelector('#load-more')).to.be.null;
        expect(root.querySelector('.loading-more')).to.be.null;
        let complete;
        client.listPromotionHistory.onSecondCall().callsFake(() => new Promise((resolve) => (complete = resolve)));

        const pending = element.loadHistory(true);
        await element.updateComplete;

        const indicator = root.querySelector('.loading-more');
        expect(indicator.getAttribute('role')).to.equal('status');
        expect(indicator.textContent).to.include('Loading more...');
        expect(indicator.querySelector('sp-progress-circle').size).to.equal('s');
        expect(indicator.querySelector('sp-progress-circle').indeterminate).to.be.true;
        expect(root.querySelector('aside > .loading')).to.be.null;

        complete({ events: [{ ...version, id: 'version-1', version: 1 }], currentEventId: version.id });
        await pending;
        await element.updateComplete;

        expect(root.querySelector('.loading-more')).to.be.null;
        expect(root.querySelector('#history-sentinel')).to.be.null;
    });

    it('keeps retry available after an automatic next-page load fails', async () => {
        client.listPromotionHistory.onFirstCall().resolves({ events: [version], currentEventId: version.id, cursor: 'next' });
        const root = await mount();
        client.listPromotionHistory.onSecondCall().rejects(new Error('Unavailable'));

        await element.loadHistory(true);
        await element.updateComplete;

        expect(root.querySelector('.loading-more')).to.be.null;
        const retry = root.querySelector('#retry-history');
        expect(retry).not.to.be.null;
        const earlier = { ...version, id: 'version-1', version: 1 };
        client.listPromotionHistory.onThirdCall().resolves({ events: [earlier], currentEventId: version.id });
        retry.click();
        await waitUntil(() => client.listPromotionHistory.callCount === 3 && !element.loading);

        expect(element.events.map((event) => event.id)).to.deep.equal([version.id, earlier.id]);
    });

    it('loads the next page without duplicating versions or changing the current marker', async () => {
        client.listPromotionHistory.onFirstCall().resolves({ events: [version], currentEventId: version.id, cursor: 'next' });
        await mount();
        const earlier = { ...version, id: 'version-1', version: 1 };
        client.listPromotionHistory.onSecondCall().resolves({ events: [earlier], currentEventId: version.id });
        const selected = element.selectedEvent;
        const field = element.eligibleRows.find((row) => row.field === 'promoCode');
        element.toggleRows([field], true);

        await element.loadHistory(true);

        expect(element.events.map((item) => item.id)).to.deep.equal([version.id, earlier.id]);
        expect(element.currentEventId).to.equal(version.id);
        expect(element.selectedEvent).to.equal(selected);
        expect(element.selectedFields.has(field.key)).to.be.true;
    });

    it('limits concurrent AEM reads to four and reuses shared native snapshots', async () => {
        let active = 0;
        let maximum = 0;
        const read = async (id, current = false) => {
            maximum = Math.max(maximum, ++active);
            await new Promise((resolve) => setTimeout(resolve, 1));
            active -= 1;
            return { ...before, id, ...(current ? { etag: '"fresh"' } : {}) };
        };
        getVersion.callsFake((id) => read(id));
        getWithEtag.callsFake((id) => read(id, true));
        const fragments = Array.from({ length: 10 }, (_, index) => ({
            id: `fragment-${index}`,
            path: `${path}-${index}`,
            versionId: `native-${index}`,
        }));
        const inheritance = fragments.map((entry) => ({ ...entry, fragmentId: entry.id }));
        client.listPromotionHistory.resolves({
            events: [
                {
                    ...version,
                    beforeSnapshot: { fragments, inheritance },
                    afterSnapshot: { fragments, inheritance },
                },
            ],
            currentEventId: version.id,
        });

        await mount();

        expect(maximum).to.be.greaterThan(1).and.at.most(4);
        expect(getVersion.withArgs(fragments[0].id, fragments[0].versionId).calledOnce).to.be.true;
    });

    it('reads fresh live content when reselecting a version while reusing its immutable snapshot', async () => {
        await mount();
        getWithEtag.resolves({ ...after, etag: '"new-live-etag"' });

        await element.selectVersion(element.selectedEvent);

        expect(element.expected).to.deep.equal([{ fragmentId: before.id, etag: '"new-live-etag"' }]);
        expect(getWithEtag.callCount).to.equal(2);
        expect(getVersion.withArgs(before.id, 'native-before').calledOnce).to.be.true;
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
