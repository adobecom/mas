import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import Store from '../../src/store.js';
import { FragmentStore } from '../../src/reactivity/fragment-store.js';
import { Promotion } from '../../src/aem/promotion.js';
import { FRAGMENT_STATUS } from '../../src/constants.js';
import '../../src/swc.js';
import MasPromotions from '../../src/promotions/mas-promotions.js';

function makeFragmentData(overrides = {}) {
    return {
        id: overrides.id ?? 'promo-id',
        title: overrides.title ?? 'Promo',
        path: overrides.path ?? `/content/dam/mas/promotions/${overrides.id ?? 'promo-id'}`,
        status: overrides.status ?? FRAGMENT_STATUS.PUBLISHED,
        created: { by: 'u', fullName: overrides.createdBy ?? 'Owner', at: '2020-01-01T00:00:00.000Z' },
        fields: [
            { name: 'title', type: 'text', values: [overrides.title ?? 'Promo'] },
            { name: 'promoCode', type: 'text', values: [''] },
            { name: 'startDate', values: [overrides.startDate ?? '2020-01-01T00:00:00.000Z'] },
            { name: 'endDate', values: [overrides.endDate ?? '2099-01-01T00:00:00.000Z'] },
            { name: 'tags', values: [] },
            { name: 'surfaces', type: 'text', multiple: false, values: [] },
        ],
        tags: [],
        etag: '"etag"',
    };
}

function makePromotionStore(overrides = {}) {
    return new FragmentStore(new Promotion(makeFragmentData(overrides)));
}

const activePromotion = () => makePromotionStore({ id: 'active-1', title: 'Active Promo', status: FRAGMENT_STATUS.PUBLISHED });
const draftPromotion = () => makePromotionStore({ id: 'draft-1', title: 'Draft Promo', status: FRAGMENT_STATUS.DRAFT });
const expiredPromotion = () =>
    makePromotionStore({
        id: 'expired-1',
        title: 'Expired Promo',
        status: FRAGMENT_STATUS.PUBLISHED,
        endDate: '2020-02-01T00:00:00.000Z',
    });

describe('MasPromotions', () => {
    let sandbox;
    let originalLoading;
    let originalData;
    let originalFilter;
    let originalProfile;
    let originalUsers;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        originalLoading = Store.promotions.list.loading.get();
        originalData = Store.promotions.list.data.get();
        originalFilter = Store.promotions.list.filter.get();
        originalProfile = structuredClone(Store.profile.get());
        originalUsers = structuredClone(Store.users.get());
        Store.promotions.list.loading.set(false);
        Store.promotions.list.data.set([]);
        Store.promotions.list.filter.set('active');
        Store.profile.set({ email: 'editor@adobe.com' });
        Store.users.set([{ userPrincipalName: 'editor@adobe.com', groups: ['GRP-ODIN-MAS-PROMO-EDITORS'] }]);
    });

    afterEach(async () => {
        const elements = [...document.querySelectorAll('mas-promotions')];
        for (const el of elements) {
            el.remove();
            await el.updateComplete;
        }
        sandbox.restore();
        Store.promotions.list.loading.set(originalLoading);
        Store.promotions.list.data.set(originalData);
        Store.promotions.list.filter.set(originalFilter);
        Store.profile.set(originalProfile);
        Store.users.set(originalUsers);
    });

    function makeRepo(overrides = {}) {
        return {
            getPromotionsPath: () => '/content/dam/mas/promotions',
            loadPromotions: sandbox.stub().resolves(),
            deleteFragment: sandbox.stub().resolves(),
            ...overrides,
        };
    }

    async function mount(repoOverrides = {}) {
        const el = new MasPromotions();
        const repo = makeRepo(repoOverrides);
        sandbox.stub(el, 'repository').get(() => repo);
        document.body.appendChild(el);
        await el.updateComplete;
        // connectedCallback synchronously flips Store loading to true; simulate the fetch having settled.
        Store.promotions.list.loading.set(false);
        await el.updateComplete;
        return { el, repo };
    }

    describe('loading getter/setter', () => {
        it('reads live from the Store rather than a cached snapshot', async () => {
            const { el } = await mount();
            expect(el.loading).to.be.false;
            Store.promotions.list.loading.set(true);
            expect(el.loading).to.be.true;
            Store.promotions.list.loading.set(false);
            expect(el.loading).to.be.false;
        });

        it('writes through to the Store', async () => {
            const { el } = await mount();
            el.loading = true;
            expect(Store.promotions.list.loading.get()).to.be.true;
            el.loading = false;
            expect(Store.promotions.list.loading.get()).to.be.false;
        });
    });

    describe('filteredPromotions', () => {
        it('returns everything for the "all" filter', async () => {
            Store.promotions.list.data.set([activePromotion(), draftPromotion(), expiredPromotion()]);
            const { el } = await mount();
            el.filter = 'all';
            expect(el.filteredPromotions.length).to.equal(3);
        });

        it('filters by promotionListFilterKey for a specific filter', async () => {
            Store.promotions.list.data.set([activePromotion(), draftPromotion(), expiredPromotion()]);
            const { el } = await mount();
            el.filter = 'active';
            expect(el.filteredPromotions.map((p) => p.get().title)).to.deep.equal(['Active Promo']);
            el.filter = 'draft';
            expect(el.filteredPromotions.map((p) => p.get().title)).to.deep.equal(['Draft Promo']);
            el.filter = 'expired';
            expect(el.filteredPromotions.map((p) => p.get().title)).to.deep.equal(['Expired Promo']);
        });

        it('reflects Store data changes made after mount (e.g. after a delete)', async () => {
            const active = activePromotion();
            const draft = draftPromotion();
            Store.promotions.list.data.set([active, draft]);
            const { el } = await mount();
            el.filter = 'all';
            expect(el.filteredPromotions.length).to.equal(2);
            Store.promotions.list.data.set([draft]);
            expect(el.filteredPromotions.length).to.equal(1);
        });
    });

    describe('rendering', () => {
        it('shows the spinner and no table while loading', async () => {
            const { el } = await mount();
            Store.promotions.list.loading.set(true);
            await el.updateComplete;
            expect(el.renderRoot.querySelector('sp-progress-circle')).to.exist;
            expect(el.renderRoot.querySelector('sp-table')).to.not.exist;
        });

        it('shows "No promotions found" when the filtered list is empty', async () => {
            Store.promotions.list.data.set([draftPromotion()]);
            const { el } = await mount();
            el.filter = 'active';
            await el.updateComplete;
            expect(el.renderRoot.textContent).to.include('No promotions found.');
            expect(el.renderRoot.querySelector('sp-table')).to.not.exist;
        });

        it('renders a table row per filtered promotion and a matching result count', async () => {
            Store.promotions.list.data.set([activePromotion(), draftPromotion()]);
            const { el } = await mount();
            el.filter = 'all';
            await el.updateComplete;
            expect(el.renderRoot.querySelectorAll('sp-table-row').length).to.equal(2);
            expect(el.renderRoot.querySelector('.result-count-container').textContent).to.include('2 results');
        });
    });

    describe('filter buttons', () => {
        it('clicking a filter action button updates filter state and the visible rows', async () => {
            Store.promotions.list.data.set([activePromotion(), draftPromotion()]);
            const { el } = await mount();
            el.filter = 'active';
            await el.updateComplete;
            expect(el.renderRoot.querySelectorAll('sp-table-row').length).to.equal(1);

            const allButton = [...el.renderRoot.querySelectorAll('sp-action-button')].find(
                (btn) => btn.textContent.trim() === 'All',
            );
            allButton.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
            await el.updateComplete;

            expect(el.filter).to.equal('all');
            expect(Store.promotions.list.filter.get()).to.equal('all');
            expect(el.renderRoot.querySelectorAll('sp-table-row').length).to.equal(2);
        });
    });

    describe('delete promotion', () => {
        it('removes the promotion from the Store (and thus the rendered table) after confirming', async () => {
            const toDelete = activePromotion();
            const other = makePromotionStore({ id: 'active-2', title: 'Keep Me', status: FRAGMENT_STATUS.PUBLISHED });
            Store.promotions.list.data.set([toDelete, other]);
            const { el, repo } = await mount();
            el.filter = 'all';
            await el.updateComplete;
            expect(el.renderRoot.querySelectorAll('sp-table-row').length).to.equal(2);

            const deleteItem = [...el.renderRoot.querySelectorAll('sp-menu-item')].find(
                (item) => item.textContent.trim() === 'Delete',
            );
            expect(deleteItem, 'Delete menu item should exist for an editor').to.exist;
            deleteItem.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
            await el.updateComplete;

            el.renderRoot.querySelector('sp-dialog-wrapper').dispatchEvent(new CustomEvent('confirm'));
            await el.updateComplete;
            await new Promise((resolve) => setTimeout(resolve, 0));
            await el.updateComplete;

            expect(repo.deleteFragment.calledOnce).to.be.true;
            expect(Store.promotions.list.data.get().map((p) => p.get().id)).to.deep.equal(['active-2']);
            expect(el.renderRoot.querySelectorAll('sp-table-row').length).to.equal(1);
        });
    });
});
