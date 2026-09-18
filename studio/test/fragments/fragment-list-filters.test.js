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

    it('narrows further by variationPresence on top of the other filters', () => {
        const stores = [
            makeStore({ path: '/content/dam/mas/acom/en_US/card-a', getVariations: () => [] }),
            makeStore({
                path: '/content/dam/mas/acom/en_US/card-b',
                getVariations: () => ['/content/dam/mas/acom/en_US/some-code/pzn/card-b'],
            }),
        ];

        const filtered = applyFragmentListFilters(stores, {
            page: PAGE_NAMES.CONTENT,
            personalizationFilterEnabled: false,
            variationPresence: 'has-grouped-variation',
        });

        expect(filtered).to.have.lengthOf(1);
        expect(filtered[0].get().path).to.equal('/content/dam/mas/acom/en_US/card-b');
    });

    it('narrows by "Has promo variation" using a sibling promo-variation fragment, then still hides that fragment on CONTENT page', () => {
        const stores = [
            makeStore({
                path: '/content/dam/mas/acom/en_US/promotions/sale/card',
                tags: [{ id: 'mas:promotion/sale' }],
                getVariations: () => [],
            }),
            makeStore({ path: '/content/dam/mas/acom/en_US/card', getVariations: () => [] }),
            makeStore({ path: '/content/dam/mas/acom/en_US/card-other', getVariations: () => [] }),
        ];

        const filtered = applyFragmentListFilters(stores, {
            page: PAGE_NAMES.CONTENT,
            personalizationFilterEnabled: false,
            variationPresence: 'has-promo-variation',
        });

        expect(filtered).to.have.lengthOf(1);
        expect(filtered[0].get().path).to.equal('/content/dam/mas/acom/en_US/card');
    });

    it('leaves the list unchanged when variationPresence is not set', () => {
        const stores = [
            makeStore({ path: '/content/dam/mas/acom/en_US/card-a', getVariations: () => [] }),
            makeStore({ path: '/content/dam/mas/acom/en_US/card-b', getVariations: () => [] }),
        ];

        const filtered = applyFragmentListFilters(stores, {
            page: PAGE_NAMES.CONTENT,
            personalizationFilterEnabled: false,
        });

        expect(filtered).to.have.lengthOf(2);
    });
});
