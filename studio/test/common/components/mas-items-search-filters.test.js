import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, fixtureCleanup } from '@open-wc/testing-helpers/pure';
import sinon from 'sinon';
import { TABLE_TYPE, FILTER_TYPE, CARD_MODEL_PATH } from '../../../src/constants.js';
import '../../../src/swc.js';
import '../../../src/common/components/mas-items-search-filters.js';

describe('MasItemsSearchFilters', () => {
    let sandbox;

    const mockCard = (overrides = {}) => ({
        title: 'Alpha Card',
        path: '/content/dam/mas/cards/alpha',
        tags: [{ id: 'mas:product_code/123', title: 'Prod' }],
        fields: [{ name: 'variant', values: ['standard'] }],
        offerData: { offerId: 'OFF-1' },
        model: { path: CARD_MODEL_PATH },
        ...overrides,
    });

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        fixtureCleanup();
        sandbox.restore();
    });

    describe('initialization', () => {
        it('defaults search and filter state', async () => {
            const el = await fixture(html`<mas-items-search-filters></mas-items-search-filters>`);
            expect(el.searchQuery).to.equal('');
            expect(el.templateFilter).to.deep.equal([]);
            expect(el.marketSegmentFilter).to.deep.equal([]);
            expect(el.customerSegmentFilter).to.deep.equal([]);
            expect(el.productFilter).to.deep.equal([]);
        });

        it('exposes templateOptions derived from VARIANTS', async () => {
            const el = await fixture(html`<mas-items-search-filters></mas-items-search-filters>`);
            expect(el.templateOptions.length).to.be.greaterThan(0);
            expect(el.templateOptions.every((o) => o.id && o.title)).to.be.true;
        });
    });

    describe('items-filtered', () => {
        it('dispatches items-filtered when items are set', async () => {
            const onFiltered = sinon.spy();
            const items = [mockCard()];
            await fixture(html`
                <mas-items-search-filters
                    type=${TABLE_TYPE.CARDS}
                    .items=${items}
                    @items-filtered=${onFiltered}
                ></mas-items-search-filters>
            `);
            expect(onFiltered.called).to.be.true;
            const evt = onFiltered.firstCall.args[0];
            expect(evt.detail.items).to.deep.equal(items);
        });

        it('filters when search input changes', async () => {
            const onFiltered = sinon.spy();
            const items = [mockCard({ title: 'FindMe' }), mockCard({ title: 'Other' })];
            const el = await fixture(html`
                <mas-items-search-filters
                    type=${TABLE_TYPE.CARDS}
                    .items=${items}
                    @items-filtered=${onFiltered}
                ></mas-items-search-filters>
            `);
            onFiltered.resetHistory();
            const search = el.shadowRoot.querySelector('sp-search');
            search.value = 'findme';
            search.dispatchEvent(new Event('input', { bubbles: true }));
            await el.updateComplete;
            const evt = onFiltered.lastCall.args[0];
            expect(evt.detail.items.length).to.equal(1);
            expect(evt.detail.items[0].title).to.equal('FindMe');
        });
    });

    describe('appliedFilters', () => {
        it('builds labels from template filter ids', async () => {
            const el = await fixture(
                html`<mas-items-search-filters type=${TABLE_TYPE.CARDS} .searchOnly=${false}></mas-items-search-filters>`,
            );
            const firstTemplateId = el.templateOptions[0]?.id;
            if (!firstTemplateId) return;
            el.templateFilter = [firstTemplateId];
            await el.updateComplete;
            expect(el.appliedFilters.some((f) => f.type === FILTER_TYPE.TEMPLATE && f.id === firstTemplateId)).to.be.true;
        });
    });

    describe('tag options', () => {
        it('extracts market segment options from item tags', async () => {
            const items = [
                mockCard({
                    tags: [{ id: 'mas:market_segment/us', title: 'US' }],
                }),
            ];
            const el = await fixture(
                html`<mas-items-search-filters type=${TABLE_TYPE.CARDS} .items=${items}></mas-items-search-filters>`,
            );
            await el.updateComplete;
            expect(el.marketSegmentOptions.some((o) => o.id === 'mas:market_segment/us')).to.be.true;
        });
    });
});
