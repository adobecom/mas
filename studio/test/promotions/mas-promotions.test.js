import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import Store from '../../src/store.js';
import Events from '../../src/events.js';
import '../../src/promotions/mas-promotions.js';
import { Promotion } from '../../src/aem/promotion.js';
import { FragmentStore } from '../../src/reactivity/fragment-store.js';
import { makeSearchStub as makeSharedSearchStub } from '../helpers/aem-tag-fetch.js';
import '../../src/swc.js';

function makeFragmentData(overrides = {}) {
    return {
        id: overrides.id ?? null,
        title: overrides.title ?? '',
        path: overrides.path ?? '/content/dam/mas/promotions/test',
        fields: overrides.fields ?? [
            { name: 'title', type: 'text', values: [overrides.title ?? ''] },
            { name: 'promoCode', type: 'text', values: [''] },
            { name: 'startDate', values: [overrides.startDate ?? '2024-01-01T00:00:00.000Z'] },
            { name: 'endDate', values: [overrides.endDate ?? '2024-12-31T00:00:00.000Z'] },
            { name: 'tags', values: [] },
            { name: 'surfaces', type: 'text', multiple: false, values: overrides.surfaces ?? ['acom'] },
            { name: 'geos', type: 'tag', multiple: true, values: overrides.geos ?? [] },
            { name: 'fragments', type: 'content-fragment', multiple: true, values: overrides.fragments ?? [] },
        ],
        tags: overrides.tags ?? [],
        etag: '"etag"',
        status: overrides.status ?? 'DRAFT',
    };
}

function makePromotion(overrides = {}) {
    return new Promotion(makeFragmentData(overrides));
}

describe('MasPromotions', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        Store.promotions.list.data.set([]);
        Store.promotions.list.data.removeMeta('listFetched');
        Store.promotions.list.loading.set(false);
        Store.promotions.list.filter.set('all');
        Store.promotions.list.search.set('');
        Store.profile.set({ email: 'editor@adobe.com' });
        Store.users.set([{ userPrincipalName: 'editor@adobe.com', groups: ['GRP-ODIN-MAS-PROMO-EDITORS'] }]);
    });

    afterEach(async () => {
        for (const el of [...document.querySelectorAll('mas-promotions')]) {
            el.remove();
        }
        sandbox.restore();
        Store.promotions.list.data.set([]);
        Store.promotions.list.data.removeMeta('listFetched');
        Store.promotions.list.loading.set(true);
        Store.promotions.list.filter.set('active');
        Store.promotions.list.search.set('');
        Store.profile.set(null);
        Store.users.set([]);
    });

    function makeRepo(overrides = {}) {
        return {
            getPromotionsPath: () => '/content/dam/mas/promotions',
            createFragment: sandbox.stub().resolves(makePromotion({ id: 'dup-2', title: 'Original copy' })),
            loadPromotions: sandbox.stub().callsFake(async () => {
                Store.promotions.list.loading.set(false);
            }),
            aem: {
                tags: {
                    create: sandbox.stub().resolves(),
                    delete: sandbox.stub().resolves(),
                },
            },
            ...overrides,
        };
    }

    async function mountWithRepo(promotion, repoOverrides = {}) {
        const repo = makeRepo(repoOverrides);
        Store.promotions.list.data.set([new FragmentStore(promotion)]);
        const el = document.createElement('mas-promotions');
        sandbox.stub(el, 'repository').get(() => repo);
        document.body.appendChild(el);
        await el.updateComplete;
        await new Promise((resolve) => setTimeout(resolve, 0));
        await el.updateComplete;
        return { el, repo };
    }

    function clickDuplicateMenuItem(el) {
        const menuItem = [...el.shadowRoot.querySelectorAll('sp-menu-item')].find((item) =>
            item.textContent.includes('Duplicate'),
        );
        menuItem.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    }

    function dispatchDuplicateConfirmed(el, detail = { title: 'Original copy' }) {
        el.shadowRoot
            .querySelector('mas-promotion-duplicate-dialog')
            .dispatchEvent(new CustomEvent('duplicate-confirmed', { bubbles: true, composed: true, detail }));
    }

    describe('#handleDuplicatePromotionFromList', () => {
        it('proposes a title and sources existingTitles from the promotions list before opening the dialog', async () => {
            const promotion = makePromotion({ id: 'src-1', title: 'Original' });
            const other = makePromotion({ id: 'other-1', title: 'Another promo' });
            const { el } = await mountWithRepo(promotion);
            Store.promotions.list.data.set([new FragmentStore(promotion), new FragmentStore(other)]);
            el.promotionsData = Store.promotions.list.data.get();
            await el.updateComplete;

            clickDuplicateMenuItem(el);
            await el.updateComplete;

            expect(el.duplicateDialogOpen).to.be.true;
            const dialog = el.shadowRoot.querySelector('mas-promotion-duplicate-dialog');
            expect(dialog.proposedTitle).to.equal('Original copy');
            expect(dialog.existingTitles).to.include.members(['Original', 'Another promo']);
        });
    });

    describe('#onDuplicateConfirmed wiring (list-view duplication path)', () => {
        it('duplicates the source promotion, refreshes the list, and shows the success toast', async () => {
            const promotion = makePromotion({ id: 'src-1', title: 'Original' });
            const { el, repo } = await mountWithRepo(promotion);

            clickDuplicateMenuItem(el);
            await el.updateComplete;
            expect(el.duplicateDialogOpen).to.be.true;

            const toastStub = sandbox.stub(Events.toast, 'emit');
            dispatchDuplicateConfirmed(el);
            await new Promise((resolve) => setTimeout(resolve, 20));
            await el.updateComplete;

            expect(repo.createFragment.calledOnce).to.be.true;
            expect(repo.loadPromotions.calledTwice).to.be.true;
            expect(toastStub.calledWith(sinon.match({ variant: 'positive', content: 'Project successfully duplicated.' }))).to
                .be.true;
            expect(el.duplicateDialogOpen).to.be.false;
            expect(el.duplicating).to.be.false;
        });

        it('shows a warning toast (not positive) when attached variations fail to clone', async () => {
            const promotion = makePromotion({
                id: 'src-1',
                title: 'Original',
                fields: [
                    { name: 'title', type: 'text', values: ['Original'] },
                    { name: 'promoCode', type: 'text', values: [''] },
                    { name: 'startDate', values: ['2024-01-01T00:00:00.000Z'] },
                    { name: 'endDate', values: ['2024-12-31T00:00:00.000Z'] },
                    { name: 'tags', values: ['mas:promotion/original'] },
                    { name: 'surfaces', type: 'text', multiple: false, values: ['acom'] },
                    { name: 'geos', type: 'tag', multiple: true, values: [] },
                    { name: 'fragments', type: 'content-fragment', multiple: true, values: ['/some/card'] },
                ],
            });
            const originalGetFieldValues = promotion.getFieldValues.bind(promotion);
            sandbox.stub(promotion, 'getFieldValues').callsFake((name) => {
                if (name === 'fragments') throw new Error('boom');
                return originalGetFieldValues(name);
            });
            const { el } = await mountWithRepo(promotion, {
                aem: {
                    sites: { cf: { fragments: { search: makeSharedSearchStub(sandbox) } } },
                    tags: { create: sandbox.stub().resolves(), delete: sandbox.stub().resolves() },
                },
            });

            clickDuplicateMenuItem(el);
            await el.updateComplete;

            const toastStub = sandbox.stub(Events.toast, 'emit');
            dispatchDuplicateConfirmed(el, { title: 'Original copy', duplicateVariations: true });
            await new Promise((resolve) => setTimeout(resolve, 20));
            await el.updateComplete;

            expect(
                toastStub.calledWith(sinon.match({ variant: 'warning', content: 'Project duplicated, 1 variation failed.' })),
            ).to.be.true;
        });

        it('shows a failure toast and does not refresh the list when duplication fails', async () => {
            const promotion = makePromotion({ id: 'src-1', title: 'Original' });
            const { el, repo } = await mountWithRepo(promotion, {
                createFragment: sandbox.stub().rejects(new Error('boom')),
            });

            clickDuplicateMenuItem(el);
            await el.updateComplete;

            const toastStub = sandbox.stub(Events.toast, 'emit');
            dispatchDuplicateConfirmed(el);
            await new Promise((resolve) => setTimeout(resolve, 20));
            await el.updateComplete;

            expect(repo.loadPromotions.calledOnce).to.be.true;
            expect(toastStub.calledWith(sinon.match({ variant: 'negative', content: 'Failed to duplicate project.' }))).to.be
                .true;
            expect(el.duplicateDialogOpen).to.be.false;
            expect(el.duplicating).to.be.false;
        });

        it('does nothing when fired without a pending duplicate fragment', async () => {
            const promotion = makePromotion({ id: 'src-1', title: 'Original' });
            const { el, repo } = await mountWithRepo(promotion);

            const toastStub = sandbox.stub(Events.toast, 'emit');
            dispatchDuplicateConfirmed(el);
            await new Promise((resolve) => setTimeout(resolve, 20));
            await el.updateComplete;

            expect(repo.createFragment.called).to.be.false;
            expect(toastStub.called).to.be.false;
        });
    });

    describe('search', () => {
        it('disables the search input while promotions are loading and enables it once they finish loading', async () => {
            let resolveLoad;
            const loadPromise = new Promise((resolve) => {
                resolveLoad = resolve;
            });
            const repo = makeRepo({
                loadPromotions: sandbox.stub().callsFake(async () => {
                    await loadPromise;
                    Store.promotions.list.loading.set(false);
                }),
            });
            const el = document.createElement('mas-promotions');
            sandbox.stub(el, 'repository').get(() => repo);
            document.body.appendChild(el);
            await el.updateComplete;

            const search = el.shadowRoot.querySelector('sp-search');
            expect(search.disabled).to.be.true;

            resolveLoad();
            await new Promise((resolve) => setTimeout(resolve, 0));
            await el.updateComplete;

            expect(search.disabled).to.be.false;
        });

        it('filters the visible rows live from an input event, without pressing Enter, and leaves the selected status filter unchanged', async () => {
            const first = makePromotion({ id: 'promo-1', title: 'Black Friday Sale' });
            const second = makePromotion({ id: 'promo-2', title: 'Holiday Bundle' });
            const { el } = await mountWithRepo(first);
            Store.promotions.list.data.set([new FragmentStore(first), new FragmentStore(second)]);
            await el.updateComplete;

            expect(el.shadowRoot.querySelectorAll('sp-table-row')).to.have.lengthOf(2);

            const search = el.shadowRoot.querySelector('sp-search');
            search.value = 'black';
            search.dispatchEvent(new Event('input'));
            await el.updateComplete;

            const rows = el.shadowRoot.querySelectorAll('sp-table-row');
            expect(rows).to.have.lengthOf(1);
            expect(rows[0].textContent).to.include('Black Friday Sale');
            expect(Store.promotions.list.filter.get()).to.equal('all');
        });

        it("persists the search term when switching status filters and reapplies it to the newly selected filter's list", async () => {
            const draftMatch = makePromotion({
                id: 'promo-1',
                title: 'Winter Draft Promo',
                status: 'DRAFT',
                startDate: '2020-01-01T00:00:00.000Z',
                endDate: '2099-12-31T00:00:00.000Z',
            });
            const draftOther = makePromotion({
                id: 'promo-2',
                title: 'Spring Draft Promo',
                status: 'DRAFT',
                startDate: '2020-01-01T00:00:00.000Z',
                endDate: '2099-12-31T00:00:00.000Z',
            });
            const { el } = await mountWithRepo(draftMatch);
            Store.promotions.list.data.set([new FragmentStore(draftMatch), new FragmentStore(draftOther)]);
            await el.updateComplete;

            const search = el.shadowRoot.querySelector('sp-search');
            search.value = 'winter';
            search.dispatchEvent(new Event('input'));
            await el.updateComplete;

            const draftTile = [...el.shadowRoot.querySelectorAll('.status-tile')].find(
                (tile) => tile.querySelector('.status-tile-label').textContent.trim() === 'Draft',
            );
            draftTile.click();
            await el.updateComplete;

            expect(Store.promotions.list.search.get()).to.equal('winter');
            expect(el.filter).to.equal('draft');
            const rows = el.shadowRoot.querySelectorAll('sp-table-row');
            expect(rows).to.have.lengthOf(1);
            expect(rows[0].textContent).to.include('Winter Draft Promo');
        });

        it('updates status tile counts live as the search term changes', async () => {
            const match = makePromotion({ id: 'promo-1', title: 'Matching Promo' });
            const other = makePromotion({ id: 'promo-2', title: 'Other Promo' });
            const { el } = await mountWithRepo(match);
            Store.promotions.list.data.set([new FragmentStore(match), new FragmentStore(other)]);
            await el.updateComplete;

            const allTileCount = () => {
                const tile = [...el.shadowRoot.querySelectorAll('.status-tile')].find(
                    (candidate) => candidate.querySelector('.status-tile-label').textContent.trim() === 'All',
                );
                return tile.querySelector('.status-tile-count').textContent.trim();
            };

            expect(allTileCount()).to.equal('2');

            const search = el.shadowRoot.querySelector('sp-search');
            search.value = 'matching';
            search.dispatchEvent(new Event('input'));
            await el.updateComplete;

            expect(allTileCount()).to.equal('1');
        });

        it('renders the result count next to the search field and removes it from the far right of the filter bar', async () => {
            const promotion = makePromotion({ id: 'promo-1', title: 'Original' });
            const { el } = await mountWithRepo(promotion);
            await el.updateComplete;

            expect(el.shadowRoot.querySelector('.result-count-container')).to.not.exist;
            const searchRow = el.shadowRoot.querySelector('.promotions-search-row');
            expect(searchRow).to.exist;
            expect(searchRow.querySelector('sp-search')).to.exist;
            expect(searchRow.querySelector('.promotions-result-count')).to.exist;
        });
    });
});
