import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import '../../src/swc.js';
import Store from '../../src/store.js';
import MasPromotions from '../../src/promotions/mas-promotions.js';
import { Promotion } from '../../src/aem/promotion.js';
import { FragmentStore } from '../../src/reactivity/fragment-store.js';

function makeFragmentData(overrides = {}) {
    return {
        id: overrides.id ?? null,
        title: overrides.title ?? '',
        path: overrides.path ?? '/content/dam/mas/promotions/test',
        fields: [
            { name: 'title', type: 'text', values: [overrides.title ?? ''] },
            { name: 'promoCode', type: 'text', values: [overrides.promoCode ?? ''] },
            { name: 'startDate', values: [overrides.startDate ?? '2020-01-01T00:00:00.000Z'] },
            { name: 'endDate', values: [overrides.endDate ?? ''] },
            { name: 'surfaces', type: 'text', multiple: false, values: overrides.surfaces ?? ['acom'] },
        ],
        tags: overrides.tags ?? [],
        etag: '"etag"',
        status: overrides.status ?? 'PUBLISHED',
    };
}

function makePromotionStore(overrides = {}) {
    return new FragmentStore(new Promotion(makeFragmentData(overrides)));
}

function flushPromises() {
    return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('MasPromotions', () => {
    let sandbox;
    let originalData;
    let originalLoading;
    let originalFilter;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        originalData = Store.promotions.list.data.get();
        originalLoading = Store.promotions.list.loading.get();
        originalFilter = Store.promotions.list.filter.get();
        Store.promotions.list.filter.set('active');
    });

    afterEach(async () => {
        const elements = [...document.querySelectorAll('mas-promotions')];
        for (const el of elements) {
            el.remove();
            await el.updateComplete;
        }
        await flushPromises();
        sandbox.restore();
        Store.promotions.list.data.set(originalData);
        Store.promotions.list.loading.set(originalLoading);
        Store.promotions.list.filter.set(originalFilter);
    });

    function makeRepo(overrides = {}) {
        return {
            loadPromotions: sandbox.stub().callsFake(async () => {}),
            ...overrides,
        };
    }

    async function mountWithPromotions(promotionStores, repoOverrides = {}) {
        Store.promotions.list.loading.set(true);
        const repo = makeRepo({
            loadPromotions: sandbox.stub().callsFake(async () => {
                Store.promotions.list.data.set(promotionStores);
                Store.promotions.list.loading.set(false);
            }),
            ...repoOverrides,
        });
        const el = new MasPromotions();
        sandbox.stub(el, 'repository').get(() => repo);
        document.body.appendChild(el);
        await el.updateComplete;
        await flushPromises();
        await el.updateComplete;
        return { el, repo };
    }

    function getSearch(el) {
        return el.renderRoot.querySelector('sp-search');
    }

    function getRowTitles(el) {
        return [...el.renderRoot.querySelectorAll('sp-table-row')].map((row) =>
            row.querySelector('sp-table-cell').textContent.trim(),
        );
    }

    async function typeSearch(el, term) {
        const search = getSearch(el);
        search.value = term;
        search.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        await el.updateComplete;
    }

    describe('search reliability and live filtering', () => {
        it('filters rows on input without requiring a change/Enter event', async () => {
            const springSale = makePromotionStore({ id: 'p1', title: 'Spring Sale', promoCode: 'SPRING10' });
            const autumnDeal = makePromotionStore({ id: 'p2', title: 'Autumn Deal', promoCode: 'FALL20' });
            const { el } = await mountWithPromotions([springSale, autumnDeal]);

            let changeCount = 0;
            getSearch(el).addEventListener('change', () => {
                changeCount += 1;
            });

            await typeSearch(el, 'spring');

            expect(getRowTitles(el)).to.deep.equal(['Spring Sale']);
            expect(changeCount).to.equal(0);
        });

        it('keeps results correctly filtered across successive keystrokes (no reset on re-render)', async () => {
            const springSale = makePromotionStore({ id: 'p1', title: 'Spring Sale', promoCode: 'SPRING10' });
            const autumnDeal = makePromotionStore({ id: 'p2', title: 'Autumn Deal', promoCode: 'FALL20' });
            const { el } = await mountWithPromotions([springSale, autumnDeal]);

            await typeSearch(el, 's');
            await typeSearch(el, 'sp');
            await typeSearch(el, 'spr');

            expect(getRowTitles(el)).to.deep.equal(['Spring Sale']);
        });
    });

    describe('disabled until loaded', () => {
        it('disables the search field while promotions are loading and enables it once loaded', async () => {
            Store.promotions.list.loading.set(true);
            let resolveLoad;
            const repo = makeRepo({
                loadPromotions: sandbox.stub().callsFake(() =>
                    new Promise((resolve) => {
                        resolveLoad = resolve;
                    }).then(() => {
                        Store.promotions.list.data.set([]);
                        Store.promotions.list.loading.set(false);
                    }),
                ),
            });
            const el = new MasPromotions();
            sandbox.stub(el, 'repository').get(() => repo);
            document.body.appendChild(el);
            await el.updateComplete;

            expect(getSearch(el).hasAttribute('disabled')).to.be.true;

            resolveLoad();
            await flushPromises();
            await el.updateComplete;

            expect(getSearch(el).hasAttribute('disabled')).to.be.false;
        });
    });

    describe('filter independence', () => {
        it('does not change the selected filter when searching, and re-applies the term to each filter', async () => {
            const springActive = makePromotionStore({
                id: 'p1',
                title: 'Spring Sale',
                promoCode: 'SPRING10',
                status: 'PUBLISHED',
                startDate: '2020-01-01T00:00:00.000Z',
            });
            const springDraft = makePromotionStore({
                id: 'p2',
                title: 'Spring Clearance',
                promoCode: 'SPRING20',
                status: 'DRAFT',
                startDate: '2020-01-01T00:00:00.000Z',
            });
            const autumnActive = makePromotionStore({
                id: 'p3',
                title: 'Autumn Deal',
                promoCode: 'FALL20',
                status: 'PUBLISHED',
                startDate: '2020-01-01T00:00:00.000Z',
            });
            const { el } = await mountWithPromotions([springActive, springDraft, autumnActive]);

            await typeSearch(el, 'spring');
            expect(getRowTitles(el)).to.deep.equal(['Spring Sale']);
            expect(el.filter).to.equal('active');
            expect(Store.promotions.list.filter.get()).to.equal('active');

            const allButton = [...el.renderRoot.querySelectorAll('sp-action-button')].find(
                (button) => button.getAttribute('value') === 'all',
            );
            allButton.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
            await el.updateComplete;

            expect(el.searchTerm).to.equal('spring');
            expect(el.filter).to.equal('all');
            expect(Store.promotions.list.filter.get()).to.equal('all');
            expect(getRowTitles(el)).to.deep.equal(['Spring Sale', 'Spring Clearance']);
        });
    });

    describe('layout', () => {
        it('renders a "Promotions" page header', async () => {
            const { el } = await mountWithPromotions([]);
            const header = el.renderRoot.querySelector('.promotions-page-title');
            expect(header?.textContent.trim()).to.equal('Promotions');
        });

        it('places the results counter next to the search field and removes it from the filter bar', async () => {
            const springSale = makePromotionStore({ id: 'p1', title: 'Spring Sale', promoCode: 'SPRING10' });
            const { el } = await mountWithPromotions([springSale]);

            const searchRow = el.renderRoot.querySelector('.promotions-search-row');
            expect(searchRow.querySelector('sp-search')).to.exist;
            expect(searchRow.querySelector('.promotions-results-count')).to.exist;
            expect(searchRow.querySelector('.results-count-number').textContent.trim()).to.equal('1');

            const filtersRow = el.renderRoot.querySelector('.promotions-filters-row');
            expect(filtersRow.querySelector('.promotions-results-count')).to.not.exist;
            expect(filtersRow.textContent).to.not.include('results');
        });
    });
});
