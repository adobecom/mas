import { expect } from '@esm-bundle/chai';
import { PAGE_NAMES } from '../../src/constants.js';
import { applyFragmentListFilters } from '../../src/fragments/fragment-list-filters.js';

describe('fragment-list-filters', () => {
    const makeStore = (fragment) => ({
        get: () => fragment,
        value: fragment,
    });

    it('excludes promo variation fragments on CONTENT page', () => {
        const stores = [
            makeStore({
                path: '/content/dam/mas/acom/en_US/promotions/sale/card',
                tags: [{ id: 'mas:promotion/sale' }],
            }),
            makeStore({
                path: '/content/dam/mas/acom/en_US/card',
                tags: [],
            }),
        ];

        const filtered = applyFragmentListFilters(stores, {
            page: PAGE_NAMES.CONTENT,
            personalizationFilterEnabled: false,
        });

        expect(filtered).to.have.lengthOf(1);
        expect(filtered[0].get().path).to.include('/card');
    });

    it('does not filter promo variations on non-CONTENT pages', () => {
        const stores = [
            makeStore({
                path: '/content/dam/mas/acom/en_US/promotions/sale/card',
                tags: [{ id: 'mas:promotion/sale' }],
            }),
        ];

        const filtered = applyFragmentListFilters(stores, {
            page: PAGE_NAMES.PROMOTIONS,
            personalizationFilterEnabled: false,
        });

        expect(filtered).to.have.lengthOf(1);
    });

    it('does not filter promo variations on PROMOTIONS_EDITOR page (Select items picker)', () => {
        const stores = [
            makeStore({
                path: '/content/dam/mas/acom/en_US/promotions/sale/card',
                tags: [{ id: 'mas:promotion/sale' }],
            }),
        ];

        const filtered = applyFragmentListFilters(stores, {
            page: PAGE_NAMES.PROMOTIONS_EDITOR,
            personalizationFilterEnabled: false,
        });

        expect(filtered).to.have.lengthOf(1);
    });
});
