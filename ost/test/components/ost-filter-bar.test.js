import { expect, fixture, html } from '@open-wc/testing';
import '../../src/components/ost-filter-bar.js';
import { store } from '../../src/store/ost-store.js';

const DEFAULT_AOS_PARAMS = {
    arrangementCode: '',
    commitment: '',
    term: '',
    customerSegment: '',
    offerType: '',
    marketSegment: '',
    pricePoint: '',
};

function makeChangeEvent(value) {
    return { target: { value } };
}

describe('ost-filter-bar', () => {
    let el;

    beforeEach(async () => {
        store.aosParams = { ...DEFAULT_AOS_PARAMS };
        el = await fixture(html`<ost-filter-bar></ost-filter-bar>`);
    });

    afterEach(() => {
        store.aosParams = { ...DEFAULT_AOS_PARAMS };
    });

    describe('plan picker change', () => {
        it('splits a plan key into commitment and term', () => {
            el.handlePlanChange(makeChangeEvent('YEAR-MONTHLY'));

            expect(store.aosParams.commitment).to.equal('YEAR');
            expect(store.aosParams.term).to.equal('MONTHLY');
        });

        it('clears commitment and term when ALL is selected', () => {
            store.aosParams = { ...DEFAULT_AOS_PARAMS, commitment: 'YEAR', term: 'MONTHLY' };

            el.handlePlanChange(makeChangeEvent('ALL'));

            expect(store.aosParams.commitment).to.equal('');
            expect(store.aosParams.term).to.equal('');
        });

        it('sets only commitment when the plan key has no term part', () => {
            el.handlePlanChange(makeChangeEvent('PERPETUAL'));

            expect(store.aosParams.commitment).to.equal('PERPETUAL');
            expect(store.aosParams.term).to.equal('');
        });
    });

    describe('customer segment picker change', () => {
        it('sets the selected customer segment', () => {
            el.handleCustomerSegmentChange(makeChangeEvent('TEAM'));

            expect(store.aosParams.customerSegment).to.equal('TEAM');
        });

        it('clears the customer segment when ALL is selected', () => {
            store.aosParams = { ...DEFAULT_AOS_PARAMS, customerSegment: 'TEAM' };

            el.handleCustomerSegmentChange(makeChangeEvent('ALL'));

            expect(store.aosParams.customerSegment).to.equal('');
        });
    });

    describe('market segment picker change', () => {
        it('sets the selected market segment', () => {
            el.handleMarketSegmentChange(makeChangeEvent('EDU'));

            expect(store.aosParams.marketSegment).to.equal('EDU');
        });

        it('clears the market segment when ALL is selected', () => {
            store.aosParams = { ...DEFAULT_AOS_PARAMS, marketSegment: 'EDU' };

            el.handleMarketSegmentChange(makeChangeEvent('ALL'));

            expect(store.aosParams.marketSegment).to.equal('');
        });
    });

    describe('offer type picker change', () => {
        it('sets the selected offer type', () => {
            el.handleOfferTypeChange(makeChangeEvent('TRIAL'));

            expect(store.aosParams.offerType).to.equal('TRIAL');
        });

        it('clears the offer type when ALL is selected', () => {
            store.aosParams = { ...DEFAULT_AOS_PARAMS, offerType: 'TRIAL' };

            el.handleOfferTypeChange(makeChangeEvent('ALL'));

            expect(store.aosParams.offerType).to.equal('');
        });
    });

    describe('currentPlanKey getter', () => {
        it('returns ALL when no commitment or term is set', () => {
            expect(el.currentPlanKey).to.equal('ALL');
        });

        it('joins commitment and term into a plan key', () => {
            store.aosParams = { ...DEFAULT_AOS_PARAMS, commitment: 'MONTH', term: 'MONTHLY' };

            expect(el.currentPlanKey).to.equal('MONTH-MONTHLY');
        });
    });

    describe('activeFilters getter', () => {
        it('returns an empty list when no filters are active', () => {
            expect(el.activeFilters).to.have.lengthOf(0);
        });

        it('maps a known customer segment key to its label', () => {
            store.aosParams = { ...DEFAULT_AOS_PARAMS, customerSegment: 'INDIVIDUAL' };

            const labels = el.activeFilters.map((filter) => filter.label);
            expect(labels).to.include('Individual');
        });

        it('falls back to the raw key when the customer segment is unknown', () => {
            store.aosParams = { ...DEFAULT_AOS_PARAMS, customerSegment: 'MYSTERY' };

            const labels = el.activeFilters.map((filter) => filter.label);
            expect(labels).to.include('MYSTERY');
        });

        it('maps a known market segment key to its label', () => {
            store.aosParams = { ...DEFAULT_AOS_PARAMS, marketSegment: 'GOV' };

            const labels = el.activeFilters.map((filter) => filter.label);
            expect(labels).to.include('Government');
        });

        it('maps a known offer type key to its label', () => {
            store.aosParams = { ...DEFAULT_AOS_PARAMS, offerType: 'PROMOTION' };

            const labels = el.activeFilters.map((filter) => filter.label);
            expect(labels).to.include('Promotion');
        });

        it('adds a plan filter tag for a matching commitment and term', () => {
            store.aosParams = { ...DEFAULT_AOS_PARAMS, commitment: 'YEAR', term: 'ANNUAL' };

            const labels = el.activeFilters.map((filter) => filter.label);
            expect(labels).to.include('PUF');
        });

        it('does not add a plan tag when the commitment and term do not match a known plan', () => {
            store.aosParams = { ...DEFAULT_AOS_PARAMS, commitment: 'YEAR', term: 'WEEKLY' };

            expect(el.activeFilters).to.have.lengthOf(0);
        });

        it('lists every active filter together', () => {
            store.aosParams = {
                ...DEFAULT_AOS_PARAMS,
                customerSegment: 'TEAM',
                marketSegment: 'COM',
                offerType: 'BASE',
                commitment: 'MONTH',
                term: 'MONTHLY',
            };

            const labels = el.activeFilters.map((filter) => filter.label);
            expect(labels).to.have.members(['Team', 'Commercial', 'Base', 'M2M']);
        });
    });

    describe('active filter tags rendering', () => {
        it('renders a tag and the filter count for each active filter', async () => {
            store.aosParams = { ...DEFAULT_AOS_PARAMS, customerSegment: 'TEAM' };
            await el.updateComplete;

            const tags = el.renderRoot.querySelectorAll('.tag');
            const count = el.renderRoot.querySelector('.filter-count');
            expect(tags).to.have.lengthOf(1);
            expect(tags[0].textContent).to.include('Team');
            expect(count.textContent.trim()).to.equal('1');
        });

        it('renders no tags or count when there are no active filters', async () => {
            await el.updateComplete;

            expect(el.renderRoot.querySelectorAll('.tag')).to.have.lengthOf(0);
            expect(el.renderRoot.querySelector('.filter-count')).to.equal(null);
        });

        it('clears the filter when its tag is clicked', async () => {
            store.aosParams = { ...DEFAULT_AOS_PARAMS, offerType: 'TRIAL' };
            await el.updateComplete;

            const tag = el.renderRoot.querySelector('.tag');
            tag.click();

            expect(store.aosParams.offerType).to.equal('');
        });

        it('clears both commitment and term when a plan tag is clicked', async () => {
            store.aosParams = { ...DEFAULT_AOS_PARAMS, commitment: 'YEAR', term: 'ANNUAL' };
            await el.updateComplete;

            const tag = el.renderRoot.querySelector('.tag');
            tag.click();

            expect(store.aosParams.commitment).to.equal('');
            expect(store.aosParams.term).to.equal('');
        });
    });
});
