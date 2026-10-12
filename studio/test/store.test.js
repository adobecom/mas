import { expect } from '@open-wc/testing';
import sinon from 'sinon';
import Store from '../src/store.js';

describe('store', () => {
    let sandbox;
    let originalStoreData;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        originalStoreData = Store.fragments.list.data.get();
    });

    afterEach(() => {
        Store.fragments.list.data.value = originalStoreData;
        sandbox.restore();
    });

    describe('compareChart slice', () => {
        it('exposes local search and filters defaulting to the globals', () => {
            expect(Store.compareChart.search.get()).to.deep.equal({});
            expect(Store.compareChart.filters.get().locale).to.equal('en_US');
        });

        it('exposes the items-selection stores used by the picker', () => {
            expect(Store.compareChart.selectedCards.get()).to.deep.equal([]);
            expect(Store.compareChart.cardsByPaths.get()).to.be.instanceOf(Map);
            expect(Store.compareChart.offerDataCache).to.be.instanceOf(Map);
        });

        it('applies the filters validator to its local filters (array tags -> csv)', () => {
            Store.compareChart.filters.set({ locale: 'fr_FR', tags: ['a', 'b'] });
            expect(Store.compareChart.filters.get().tags).to.equal('a,b');
            Store.compareChart.filters.set({ locale: 'en_US' });
        });
    });

    describe('filtersValidator status normalization', () => {
        afterEach(() => {
            Store.filters.set({ locale: 'en_US' });
        });

        it('joins an array into a comma string', () => {
            Store.filters.set({ locale: 'en_US', status: ['DRAFT', 'NEW'] });
            expect(Store.filters.value.status).to.equal('DRAFT,NEW');
        });

        it('uppercases lowercase values from a hand-edited URL', () => {
            Store.filters.set({ locale: 'en_US', status: 'draft' });
            expect(Store.filters.value.status).to.equal('DRAFT');
        });

        it('drops values outside the valid enum', () => {
            Store.filters.set({ locale: 'en_US', status: 'DRAFT,BOGUS,NEW' });
            expect(Store.filters.value.status).to.equal('DRAFT,NEW');
        });

        it('normalizes an all-invalid value to undefined', () => {
            Store.filters.set({ locale: 'en_US', status: 'BOGUS' });
            expect(Store.filters.value.status).to.equal(undefined);
        });

        it('normalizes an empty array to undefined', () => {
            Store.filters.set({ locale: 'en_US', status: [] });
            expect(Store.filters.value.status).to.equal(undefined);
        });
    });
});
