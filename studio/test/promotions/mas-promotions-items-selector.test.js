import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, fixtureCleanup } from '@open-wc/testing-helpers/pure';
import sinon from 'sinon';
import Store from '../../src/store.js';
import { setItemsSelectionStore } from '../../src/common/items-selection-store.js';
import { TABLE_TYPE } from '../../src/constants.js';
import { stubAemTagQueryFetch } from '../helpers/aem-tag-fetch.js';
import { resetTagCache } from '../helpers/tag-cache.js';
import '../../src/swc.js';
import '../../src/promotions/mas-promotions-items-selector.js';

const MAS_TAG_NAMESPACE = '/content/cq:tags/mas';

describe('MasPromotionsItemsSelector', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        stubAemTagQueryFetch(sandbox);
        resetTagCache(MAS_TAG_NAMESPACE);
        setItemsSelectionStore(Store.promotions);
        Store.promotions.inEdit.set(null);
        Store.promotions.showSelected.set(false);
        Store.promotions.selectedCards.set([]);
        Store.promotions.selectedOffers.set([]);
        Store.promotions.selectedCollections.set([]);
        Store.promotions.selectedPlaceholders.set([]);
    });

    afterEach(async () => {
        fixtureCleanup();
        await new Promise((resolve) => setTimeout(resolve, 350));
        sandbox.restore();
        Store.filters.set((prev) => ({ ...prev, tags: undefined }));
        Store.promotions.inEdit.set(null);
        Store.promotions.showSelected.set(false);
        Store.promotions.selectedCards.set([]);
        Store.promotions.selectedOffers.set([]);
        Store.promotions.selectedCollections.set([]);
        Store.promotions.selectedPlaceholders.set([]);
        setItemsSelectionStore(null);
    });

    it('renders two picker tabs for fragments and collections', async () => {
        const el = await fixture(html`<mas-promotions-items-selector></mas-promotions-items-selector>`);
        expect(el.shadowRoot.querySelectorAll('sp-tab').length).to.equal(2);
    });

    it('forwards hidePromoVariations and tabs to mas-select-items-table', async () => {
        const el = await fixture(html`<mas-promotions-items-selector></mas-promotions-items-selector>`);
        await el.updateComplete;
        const selectItemsTable = el.shadowRoot.querySelector('mas-select-items-table');
        expect(selectItemsTable.hidePromoVariations).to.be.true;
        expect(selectItemsTable.tabs).to.deep.equal(['promotion']);
    });

    it('renders three view-only tabs for offers, fragments, and collections', async () => {
        const el = await fixture(html`<mas-promotions-items-selector .viewOnly=${true}></mas-promotions-items-selector>`);
        expect(el.shadowRoot.querySelectorAll('sp-tab').length).to.equal(3);
    });

    it('honors selectedTab binding in viewOnly mode', async () => {
        const el = await fixture(
            html`<mas-promotions-items-selector
                .viewOnly=${true}
                .selectedTab=${TABLE_TYPE.OFFERS}
            ></mas-promotions-items-selector>`,
        );
        await el.updateComplete;
        expect(el.selectedTab).to.equal(TABLE_TYPE.OFFERS);
    });

    it('includes offers selection count in tab label when viewOnly', async () => {
        Store.promotions.selectedOffers.set(['offer-a', 'offer-b']);
        const el = await fixture(html`<mas-promotions-items-selector .viewOnly=${true}></mas-promotions-items-selector>`);
        await el.updateComplete;
        const offersTab = [...el.shadowRoot.querySelectorAll('sp-tab')].find((t) => t.value === TABLE_TYPE.OFFERS);
        expect(offersTab.textContent).to.include('(2)');
    });

    it('dispatches promotion-items-tab-change when tab selection changes', async () => {
        const el = await fixture(html`<mas-promotions-items-selector></mas-promotions-items-selector>`);
        const spy = sandbox.spy();
        el.addEventListener('promotion-items-tab-change', spy);
        const tabs = el.shadowRoot.querySelector('sp-tabs');
        tabs.selected = TABLE_TYPE.COLLECTIONS;
        tabs.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true }));
        expect(spy.callCount).to.equal(1);
        expect(spy.firstCall.args[0].detail.tab).to.equal(TABLE_TYPE.COLLECTIONS);
    });

    it('updates selectedCount when store selection changes', async () => {
        const el = await fixture(html`<mas-promotions-items-selector></mas-promotions-items-selector>`);
        expect(el.selectedCount).to.equal(0);
        Store.promotions.selectedCards.set(['/a']);
        Store.promotions.selectedPlaceholders.set(['/p']);
        Store.promotions.selectedCollections.set(['/c']);
        await el.updateComplete;
        expect(el.selectedCount).to.equal(3);
    });

    it('renders mas-promotions-items-table when viewOnly', async () => {
        const el = await fixture(html`<mas-promotions-items-selector .viewOnly=${true}></mas-promotions-items-selector>`);
        expect(el.shadowRoot.querySelectorAll('mas-promotions-items-table').length).to.equal(3);
    });

    it('includes selection counts in tab labels when viewOnly', async () => {
        Store.promotions.selectedCards.set(['/a', '/b']);
        Store.promotions.selectedCollections.set(['/c']);
        const el = await fixture(html`<mas-promotions-items-selector .viewOnly=${true}></mas-promotions-items-selector>`);
        await el.updateComplete;
        const tabs = [...el.shadowRoot.querySelectorAll('sp-tab')];
        const cardsTab = tabs.find((t) => t.value === TABLE_TYPE.CARDS);
        const collectionsTab = tabs.find((t) => t.value === TABLE_TYPE.COLLECTIONS);
        expect(cardsTab.textContent).to.include('(2)');
        expect(collectionsTab.textContent).to.include('(1)');
    });

    it('toggles showSelected when the selected-items button is clicked', async () => {
        Store.promotions.selectedCards.set(['/x']);
        const el = await fixture(html`<mas-promotions-items-selector></mas-promotions-items-selector>`);
        await el.updateComplete;
        const btn = [...el.shadowRoot.querySelectorAll('sp-button')].find((b) => b.textContent.includes('Selected items'));
        expect(btn).to.exist;
        btn.click();
        await el.updateComplete;
        expect(Store.promotions.showSelected.get()).to.be.true;
    });

    it('sets searchQuery on sp-search submit', async () => {
        const el = await fixture(html`<mas-promotions-items-selector></mas-promotions-items-selector>`);
        const search = el.shadowRoot.querySelector('sp-search');
        search.value = 'hello';
        search.dispatchEvent(new Event('submit', { bubbles: true, composed: true }));
        await el.updateComplete;
        expect(el.searchQuery).to.equal('hello');
    });

    it('debounces search input into searchQuery', async () => {
        const clock = sandbox.useFakeTimers();
        const el = await fixture(html`<mas-promotions-items-selector></mas-promotions-items-selector>`);
        const search = el.shadowRoot.querySelector('sp-search');
        search.value = 'abc';
        search.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        expect(el.searchQuery).to.equal('');
        clock.tick(300);
        await el.updateComplete;
        expect(el.searchQuery).to.equal('abc');
        clock.restore();
    });

    it('sets Store.search.query directly when the search input is a UUID', async () => {
        const el = await fixture(html`<mas-promotions-items-selector></mas-promotions-items-selector>`);
        const search = el.shadowRoot.querySelector('sp-search');
        search.value = '12345678-1234-1234-1234-123456789012';
        search.dispatchEvent(new Event('submit', { bubbles: true, composed: true }));
        await el.updateComplete;
        expect(Store.search.get().query).to.equal('12345678-1234-1234-1234-123456789012');
    });

    it('clears the uuid search metadata and query when the search input is submitted empty', async () => {
        Store.filters.setMeta('uuid-query', '1');
        Store.filters.setMeta('uuid-locale', 'en_US');
        Store.search.setMeta('uuid-query', '1');
        Store.search.setMeta('uuid-path', '/some/path');
        Store.search.set((prev) => ({ ...prev, query: 'stale-query' }));
        const el = await fixture(html`<mas-promotions-items-selector></mas-promotions-items-selector>`);
        const search = el.shadowRoot.querySelector('sp-search');
        search.value = '';
        search.dispatchEvent(new Event('submit', { bubbles: true, composed: true }));
        await el.updateComplete;
        expect(Store.search.get().query).to.equal('');
        expect(Store.search.getMeta('uuid-query')).to.be.null;
        expect(Store.search.getMeta('uuid-path')).to.be.null;
        expect(Store.filters.getMeta('uuid-query')).to.be.null;
        expect(Store.filters.getMeta('uuid-locale')).to.be.null;
    });

    it('stops propagation of sp-opened events dispatched from within the selector', async () => {
        const el = await fixture(html`<mas-promotions-items-selector></mas-promotions-items-selector>`);
        const outerListener = sandbox.stub();
        document.body.addEventListener('sp-opened', outerListener);
        el.dispatchEvent(new CustomEvent('sp-opened', { bubbles: true, composed: true }));
        expect(outerListener.called).to.be.false;
        document.body.removeEventListener('sp-opened', outerListener);
    });

    it('resetFilters calls resetFilters on each mas-search-and-filters', async () => {
        const el = await fixture(html`<mas-promotions-items-selector></mas-promotions-items-selector>`);
        await el.updateComplete;
        const filters = [...el.renderRoot.querySelectorAll('mas-search-and-filters')];
        expect(filters.length).to.equal(2);
        const spies = filters.map((f) => sandbox.spy(f, 'resetFilters'));
        el.resetFilters();
        spies.forEach((s) => expect(s.callCount).to.equal(1));
    });

    it('syncs selected offer product tags to Store.filters on connect', async () => {
        Store.promotions.selectedOffers.set(['fpsa-osi', 'stel-osi']);
        Store.promotions.offerDataCache.set('fpsa-osi', {
            tags: [{ id: 'mas:product_code/fpsa', title: 'FPSA' }],
        });
        Store.promotions.offerDataCache.set('stel-osi', {
            tags: [{ id: 'mas:product_code/stel', title: 'STEL' }],
        });
        await fixture(html`<mas-promotions-items-selector></mas-promotions-items-selector>`);
        expect(Store.promotions.filters.get().tags).to.equal('mas:product_code/fpsa,mas:product_code/stel');
    });

    it('passes product tags from selected offers as productFilter to fragment search', async () => {
        Store.promotions.selectedOffers.set(['phsp-osi']);
        Store.promotions.offerDataCache.set('phsp-osi', {
            path: 'phsp-osi',
            id: 'phsp-osi',
            offerData: { offerId: 'phsp-osi' },
            tags: [{ id: 'mas:product_code/phsp', title: 'Photoshop' }],
            fields: [],
        });
        const el = await fixture(html`<mas-promotions-items-selector></mas-promotions-items-selector>`);
        await el.updateComplete;
        const filters = [...el.renderRoot.querySelectorAll('mas-search-and-filters')];
        const cardsFilter = filters.find((f) => f.type === TABLE_TYPE.CARDS);
        const collectionsFilter = filters.find((f) => f.type === TABLE_TYPE.COLLECTIONS);
        expect(cardsFilter.productFilter).to.deep.equal(['mas:product_code/phsp']);
        expect(collectionsFilter.productFilter).to.deep.equal([]);
    });

    it('keeps collections list after selecting another collection when offers have product tags', async () => {
        Store.promotions.selectedOffers.set(['phsp-osi']);
        Store.promotions.offerDataCache.set('phsp-osi', {
            tags: [{ id: 'mas:product_code/phsp', title: 'Photoshop' }],
        });
        const collections = [
            { path: '/content/dam/mas/sandbox/en_US/col-a', title: 'Col A', tags: [] },
            { path: '/content/dam/mas/sandbox/en_US/col-b', title: 'Col B', tags: [] },
        ];
        Store.promotions.allCollections.set(collections);
        Store.promotions.displayCollections.set(collections);
        const el = await fixture(html`<mas-promotions-items-selector></mas-promotions-items-selector>`);
        el.selectedTab = TABLE_TYPE.COLLECTIONS;
        await el.updateComplete;
        Store.promotions.selectedCollections.set([collections[0].path]);
        await el.updateComplete;
        expect(Store.promotions.displayCollections.value).to.have.length(2);
    });

    it('shows labeled surface picker options when multiple fragment surfaces are available', async () => {
        const el = await fixture(
            html`<mas-promotions-items-selector
                .fragmentSurfaceOptions=${['acom', 'acom-cc']}
            ></mas-promotions-items-selector>`,
        );
        await el.updateComplete;
        const cardsFilter = [...el.renderRoot.querySelectorAll('mas-search-and-filters')].find(
            (f) => f.type === TABLE_TYPE.CARDS,
        );
        expect(cardsFilter.promotionSurfaceOptions).to.deep.equal([
            { id: 'acom', title: 'Adobe.com' },
            { id: 'acom-cc', title: 'ACOM CC' },
        ]);
    });

    it('resets fragment stores, records the picker surface, and re-searches when the surface changes', async () => {
        Store.promotions.allCards.set([{ path: '/x' }]);
        Store.promotions.displayCards.set([{ path: '/x' }]);
        Store.promotions.groupedVariationsByParent.set(new Map([['a', new Map()]]));
        Store.promotions.groupedVariationsData.set(new Map([['a', {}]]));
        Store.promotions.allCollections.set([{ path: '/y' }]);
        Store.promotions.displayCollections.set([{ path: '/y' }]);
        Store.fragments.list.data.set([{ path: '/z' }]);
        Store.fragments.list.hasMore.set(true);
        const searchFragments = sandbox.stub();
        const repo = document.createElement('mas-repository');
        repo.searchFragments = searchFragments;
        repo.loadAllCollections = sandbox.stub();
        repo.loadPlaceholders = sandbox.stub();
        document.body.appendChild(repo);

        const el = await fixture(
            html`<mas-promotions-items-selector
                .fragmentSurfaceOptions=${['acom', 'acom-cc']}
            ></mas-promotions-items-selector>`,
        );
        await el.updateComplete;
        const cardsFilter = [...el.renderRoot.querySelectorAll('mas-search-and-filters')].find(
            (f) => f.type === TABLE_TYPE.CARDS,
        );
        cardsFilter.dispatchEvent(
            new CustomEvent('promotion-surface-change', {
                detail: { value: 'acom-cc' },
                bubbles: true,
                composed: true,
            }),
        );
        await el.updateComplete;

        expect(Store.promotions.itemPickerSurface.get()).to.equal('acom-cc');
        expect(Store.promotions.allCards.value).to.deep.equal([]);
        expect(Store.promotions.displayCards.value).to.deep.equal([]);
        expect(Store.promotions.allCollections.value).to.deep.equal([]);
        expect(Store.fragments.list.data.value).to.deep.equal([]);
        expect(Store.fragments.list.hasMore.value).to.be.false;
        expect(searchFragments.called).to.be.true;
        repo.remove();
    });

    it('re-dispatches promotion-offer-removed bubbled up from the viewOnly items table', async () => {
        const el = await fixture(html`<mas-promotions-items-selector .viewOnly=${true}></mas-promotions-items-selector>`);
        await el.updateComplete;
        const outerListener = sandbox.stub();
        el.addEventListener('promotion-offer-removed', outerListener);
        const table = el.shadowRoot.querySelector('mas-promotions-items-table');
        table.dispatchEvent(new CustomEvent('promotion-offer-removed', { bubbles: true, composed: true }));
        await el.updateComplete;
        expect(outerListener.called).to.be.true;
    });

    it('passes empty productFilter when no offers are selected', async () => {
        const el = await fixture(html`<mas-promotions-items-selector></mas-promotions-items-selector>`);
        await el.updateComplete;
        const filters = [...el.renderRoot.querySelectorAll('mas-search-and-filters')];
        filters.forEach((f) => expect(f.productFilter).to.deep.equal([]));
    });

    it('does not render offer filter dropdown when only one offer is selected', async () => {
        Store.promotions.selectedOffers.set(['phsp-osi']);
        Store.promotions.offerDataCache.set('phsp-osi', {
            tags: [{ id: 'mas:product_code/phsp', title: 'Photoshop' }],
            getTagTitle(key) {
                return this.tags.find((t) => t.id.includes(key))?.title;
            },
        });
        const el = await fixture(html`<mas-promotions-items-selector></mas-promotions-items-selector>`);
        await el.updateComplete;
        const cardsFilter = [...el.renderRoot.querySelectorAll('mas-search-and-filters')].find(
            (f) => f.type === TABLE_TYPE.CARDS,
        );
        await cardsFilter.updateComplete;
        expect(cardsFilter.shadowRoot.querySelector('sp-picker.offer-filter')).to.be.null;
    });

    it('renders offer filter dropdown with All and per-offer options when two offers are selected', async () => {
        Store.promotions.selectedOffers.set(['phsp-osi', 'ilst-osi']);
        Store.promotions.offerDataCache.set('phsp-osi', {
            tags: [{ id: 'mas:product_code/phsp', title: 'Photoshop' }],
            getTagTitle(key) {
                return this.tags.find((t) => t.id.includes(key))?.title;
            },
        });
        Store.promotions.offerDataCache.set('ilst-osi', {
            tags: [{ id: 'mas:product_code/ilst', title: 'Illustrator' }],
            getTagTitle(key) {
                return this.tags.find((t) => t.id.includes(key))?.title;
            },
        });
        const el = await fixture(html`<mas-promotions-items-selector></mas-promotions-items-selector>`);
        await el.updateComplete;
        const cardsFilter = [...el.renderRoot.querySelectorAll('mas-search-and-filters')].find(
            (f) => f.type === TABLE_TYPE.CARDS,
        );
        await cardsFilter.updateComplete;
        const picker = cardsFilter.shadowRoot.querySelector('sp-picker.offer-filter');
        expect(picker).to.exist;
        const items = [...picker.querySelectorAll('sp-menu-item')];
        expect(items.length).to.equal(3);
        expect(items[0].value).to.equal('all');
        expect(items[1].value).to.equal('phsp-osi');
        expect(items[2].value).to.equal('ilst-osi');
    });

    it('filters productFilter to single offer when that offer is selected in the dropdown', async () => {
        Store.promotions.selectedOffers.set(['phsp-osi', 'ilst-osi']);
        Store.promotions.offerDataCache.set('phsp-osi', {
            tags: [{ id: 'mas:product_code/phsp', title: 'Photoshop' }],
            getTagTitle(key) {
                return this.tags.find((t) => t.id.includes(key))?.title;
            },
        });
        Store.promotions.offerDataCache.set('ilst-osi', {
            tags: [{ id: 'mas:product_code/ilst', title: 'Illustrator' }],
            getTagTitle(key) {
                return this.tags.find((t) => t.id.includes(key))?.title;
            },
        });
        const el = await fixture(html`<mas-promotions-items-selector></mas-promotions-items-selector>`);
        await el.updateComplete;
        const cardsFilter = [...el.renderRoot.querySelectorAll('mas-search-and-filters')].find(
            (f) => f.type === TABLE_TYPE.CARDS,
        );
        await cardsFilter.updateComplete;
        const picker = cardsFilter.shadowRoot.querySelector('sp-picker.offer-filter');
        picker.value = 'phsp-osi';
        picker.dispatchEvent(new Event('change', { bubbles: true }));
        await el.updateComplete;
        expect(cardsFilter.productFilter).to.deep.equal(['mas:product_code/phsp']);
    });

    it('restores union of all offer tags when All offers is selected in the dropdown', async () => {
        Store.promotions.selectedOffers.set(['phsp-osi', 'ilst-osi']);
        Store.promotions.offerDataCache.set('phsp-osi', {
            tags: [{ id: 'mas:product_code/phsp', title: 'Photoshop' }],
            getTagTitle(key) {
                return this.tags.find((t) => t.id.includes(key))?.title;
            },
        });
        Store.promotions.offerDataCache.set('ilst-osi', {
            tags: [{ id: 'mas:product_code/ilst', title: 'Illustrator' }],
            getTagTitle(key) {
                return this.tags.find((t) => t.id.includes(key))?.title;
            },
        });
        const el = await fixture(html`<mas-promotions-items-selector></mas-promotions-items-selector>`);
        await el.updateComplete;
        el.activeFilterOfferId = 'phsp-osi';
        await el.updateComplete;
        const cardsFilter = [...el.renderRoot.querySelectorAll('mas-search-and-filters')].find(
            (f) => f.type === TABLE_TYPE.CARDS,
        );
        await cardsFilter.updateComplete;
        const picker = cardsFilter.shadowRoot.querySelector('sp-picker.offer-filter');
        picker.value = 'all';
        picker.dispatchEvent(new Event('change', { bubbles: true }));
        await el.updateComplete;
        expect(cardsFilter.productFilter).to.deep.equal(['mas:product_code/phsp', 'mas:product_code/ilst']);
    });

    it('resets activeFilterOfferId when the active offer is removed from selection', async () => {
        Store.promotions.selectedOffers.set(['phsp-osi', 'ilst-osi']);
        Store.promotions.offerDataCache.set('phsp-osi', {
            tags: [{ id: 'mas:product_code/phsp', title: 'Photoshop' }],
            getTagTitle(key) {
                return this.tags.find((t) => t.id.includes(key))?.title;
            },
        });
        Store.promotions.offerDataCache.set('ilst-osi', {
            tags: [{ id: 'mas:product_code/ilst', title: 'Illustrator' }],
            getTagTitle(key) {
                return this.tags.find((t) => t.id.includes(key))?.title;
            },
        });
        const el = await fixture(html`<mas-promotions-items-selector></mas-promotions-items-selector>`);
        el.activeFilterOfferId = 'phsp-osi';
        await el.updateComplete;
        Store.promotions.selectedOffers.set(['ilst-osi']);
        await el.updateComplete;
        expect(el.activeFilterOfferId).to.equal('');
    });

    it('updates sp-toast when a child table dispatches show-toast', async () => {
        const el = await fixture(html`<mas-promotions-items-selector .viewOnly=${true}></mas-promotions-items-selector>`);
        await el.updateComplete;
        const table = el.shadowRoot.querySelector('mas-promotions-items-table');
        table.dispatchEvent(
            new CustomEvent('show-toast', {
                bubbles: true,
                composed: true,
                detail: { text: 'Toast text', variant: 'positive' },
            }),
        );
        await el.updateComplete;
        const toast = el.shadowRoot.querySelector('sp-toast');
        expect(toast.textContent).to.equal('Toast text');
        expect(toast.variant).to.equal('positive');
        expect(toast.open).to.be.true;
    });
});
