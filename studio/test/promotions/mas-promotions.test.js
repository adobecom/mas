import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, fixtureCleanup } from '@open-wc/testing-helpers/pure';
import sinon from 'sinon';
import Store from '../../src/store.js';
import '../../src/swc.js';
import '../../src/promotions/mas-promotions.js';

function makePromotion({ id, title, filterKey = 'active', environment = 'production' }) {
    const data = {
        id,
        path: `/content/dam/mas/promotions/${id}`,
        title,
        timeline: '',
        isEvergreen: false,
        createdBy: 'tester',
        promotionStatus: filterKey,
        promotionListFilterKey: filterKey,
        promotionEnvironment: environment,
        isPromotionPublished: false,
        isPromotionModified: false,
    };
    return { get: () => data, value: data };
}

function rowTitles(el) {
    return [...el.shadowRoot.querySelectorAll('sp-table-row')].map((row) =>
        row.querySelector('sp-table-cell')?.textContent.trim(),
    );
}

describe('MasPromotions', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        Store.promotions.list.data.set([]);
        Store.promotions.list.loading.set(false);
        Store.promotions.list.filter.set('active');
    });

    afterEach(() => {
        fixtureCleanup();
        sandbox.restore();
        Store.promotions.list.data.set([]);
        Store.promotions.list.loading.set(true);
        Store.promotions.list.filter.set('active');
    });

    it('live-filters rows as the user types, without pressing Enter', async () => {
        Store.promotions.list.data.set([
            makePromotion({ id: 'p1', title: 'Black Friday' }),
            makePromotion({ id: 'p2', title: 'Cyber Monday' }),
            makePromotion({ id: 'p3', title: 'Holiday Sale' }),
        ]);
        const el = await fixture(html`<mas-promotions></mas-promotions>`);
        await el.updateComplete;
        expect(rowTitles(el)).to.deep.equal(['Black Friday', 'Cyber Monday', 'Holiday Sale']);

        const search = el.shadowRoot.querySelector('sp-search');
        search.value = 'cyber';
        search.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        await el.updateComplete;

        expect(rowTitles(el)).to.deep.equal(['Cyber Monday']);
    });

    it('does not change the selected status filter when searching', async () => {
        Store.promotions.list.data.set([
            makePromotion({ id: 'p1', title: 'Black Friday', filterKey: 'active' }),
            makePromotion({ id: 'p2', title: 'Draft Promo', filterKey: 'draft' }),
        ]);
        const el = await fixture(html`<mas-promotions></mas-promotions>`);
        await el.updateComplete;
        expect(el.filter).to.equal('active');

        const search = el.shadowRoot.querySelector('sp-search');
        search.value = 'draft';
        search.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        await el.updateComplete;

        expect(el.filter).to.equal('active');
        expect(rowTitles(el)).to.deep.equal([]);
    });

    it('persists the search term across status-filter switches and re-applies it', async () => {
        Store.promotions.list.data.set([
            makePromotion({ id: 'p1', title: 'Winter Sale', filterKey: 'active' }),
            makePromotion({ id: 'p2', title: 'Winter Draft', filterKey: 'draft' }),
        ]);
        const el = await fixture(html`<mas-promotions></mas-promotions>`);
        await el.updateComplete;

        const search = el.shadowRoot.querySelector('sp-search');
        search.value = 'winter';
        search.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        await el.updateComplete;
        expect(rowTitles(el)).to.deep.equal(['Winter Sale']);

        const allButton = [...el.shadowRoot.querySelectorAll('sp-action-button')].find(
            (button) => button.getAttribute('value') === 'all',
        );
        expect(allButton).to.exist;
        allButton.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
        await el.updateComplete;

        expect(el.filter).to.equal('all');
        expect(el.searchQuery).to.equal('winter');
        expect(el.shadowRoot.querySelector('sp-search').value).to.equal('winter');
        expect(rowTitles(el)).to.deep.equal(['Winter Sale', 'Winter Draft']);
    });

    it('disables the search field while promotions are loading and enables it once loaded', async () => {
        Store.promotions.list.loading.set(true);
        const el = await fixture(html`<mas-promotions></mas-promotions>`);
        await el.updateComplete;
        expect(el.shadowRoot.querySelector('sp-search').disabled).to.be.true;

        el.promotionsLoading = false;
        await el.updateComplete;
        expect(el.shadowRoot.querySelector('sp-search').disabled).to.be.false;
    });

    it('renders the filtered result count next to the search field and removes the far-right counter', async () => {
        Store.promotions.list.data.set([
            makePromotion({ id: 'p1', title: 'Alpha' }),
            makePromotion({ id: 'p2', title: 'Beta' }),
        ]);
        const el = await fixture(html`<mas-promotions></mas-promotions>`);
        await el.updateComplete;

        const filterBar = el.shadowRoot.querySelector('.promotions-filter-bar');
        expect(filterBar).to.exist;
        expect(filterBar.querySelector('.result-count-value').textContent.trim()).to.equal('2');
        expect(filterBar.querySelector('.result-count-label').textContent.trim()).to.equal('results');
        expect(el.shadowRoot.querySelector('.result-count-container')).to.be.null;

        const search = el.shadowRoot.querySelector('sp-search');
        search.value = 'alpha';
        search.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        await el.updateComplete;
        expect(el.shadowRoot.querySelector('.result-count-value').textContent.trim()).to.equal('1');
        expect(el.shadowRoot.querySelector('.result-count-label').textContent.trim()).to.equal('result');
    });

    it('renders a "Promotions" page header above the filter bar', async () => {
        const el = await fixture(html`<mas-promotions></mas-promotions>`);
        await el.updateComplete;
        const header = el.shadowRoot.querySelector('.promotions-page-header');
        expect(header).to.exist;
        expect(header.textContent.trim()).to.equal('Promotions');
    });
});
