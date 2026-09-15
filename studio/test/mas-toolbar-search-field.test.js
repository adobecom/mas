import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, fixtureCleanup } from '@open-wc/testing-helpers/pure';
import Store from '../src/store.js';
import { setItemsSelectionStore } from '../src/common/items-selection-store.js';
import '../src/swc.js';
import '../src/mas-toolbar.js';
import '../src/common/components/mas-search-and-filters.js';

describe('MasToolbar – search field', () => {
    let el;

    beforeEach(async () => {
        el = await fixture(html`<mas-toolbar></mas-toolbar>`);
    });

    afterEach(() => {
        fixtureCleanup();
    });

    it('renders the search field with pill styling', async () => {
        const search = el.shadowRoot.querySelector('#search-field sp-search');
        expect(search).to.exist;
        const style = getComputedStyle(search);
        expect(style.borderRadius).to.equal('16px');
        expect(style.borderTopWidth).to.equal('2px');
    });

    it('renders the status filter bar before the search field', () => {
        const nodes = Array.from(el.shadowRoot.querySelectorAll('mas-filter-panel, #search-field'));
        expect(nodes[0].tagName.toLowerCase()).to.equal('mas-filter-panel');
        expect(nodes[1].id).to.equal('search-field');
    });

    it('keeps only one search field in the toolbar', () => {
        const searchFields = el.shadowRoot.querySelectorAll('sp-search');
        expect(searchFields.length).to.equal(1);
    });
});

describe('MasSearchAndFilters – result count typography', () => {
    let el;
    let originalSearch;
    let originalFilters;

    beforeEach(async () => {
        setItemsSelectionStore(Store.promotions);
        originalSearch = Store.promotions.search.get();
        originalFilters = Store.promotions.filters.get();
        Store.promotions.search.set({});
        Store.promotions.filters.set({ locale: 'en_US' });
        Store.promotions.allCards.set([]);
        Store.promotions.displayCards.set([]);
        Store.fragments.list.loading.set(false);
        Store.fragments.list.firstPageLoaded.set(true);
        el = await fixture(html`<mas-search-and-filters type="cards" .searchOnly=${true}></mas-search-and-filters>`);
        await el.updateComplete;
    });

    afterEach(() => {
        fixtureCleanup();
        Store.promotions.search.set(originalSearch);
        Store.promotions.filters.set(originalFilters);
        Store.fragments.list.loading.set(false);
        Store.fragments.list.firstPageLoaded.set(false);
        setItemsSelectionStore(null);
    });

    it('renders result-count-value and result-count-label with Body/XS typography', () => {
        const value = el.shadowRoot.querySelector('.result-count-value');
        const label = el.shadowRoot.querySelector('.result-count-label');
        expect(value).to.exist;
        expect(label).to.exist;
        const valueStyle = getComputedStyle(value);
        expect(valueStyle.fontSize).to.equal('12px');
        expect(valueStyle.fontWeight).to.equal('400');
    });
});
