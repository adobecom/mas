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

    describe('variation filter', () => {
        const PZN = '/content/dam/mas/acom/en_US/pzn/fr/plain';
        const withVariations = (path, variations) =>
            makeStore({ path, tags: [], fields: [{ name: 'variations', values: variations }] });
        const grouped = withVariations('/content/dam/mas/acom/en_US/grouped', [PZN]);
        const regional = withVariations('/content/dam/mas/acom/fr_FR/regional', ['/content/dam/mas/acom/fr_FR/x']);
        const promo = withVariations('/content/dam/mas/acom/en_US/promo', []);
        const plain = withVariations('/content/dam/mas/acom/en_US/plain', []);
        const both = withVariations('/content/dam/mas/acom/en_US/both', [PZN]);
        const promoParentPaths = new Set([promo.get().path, both.get().path]);
        const stores = [grouped, regional, promo, plain, both];
        const run = (variation, page = PAGE_NAMES.CONTENT) =>
            applyFragmentListFilters(stores, { page, personalizationFilterEnabled: false, variation, promoParentPaths }).map(
                (fs) => fs.get().path.split('/').pop(),
            );

        it('keeps cards with a grouped variation', () => {
            expect(run('grouped')).to.deep.equal(['grouped', 'both']);
        });

        it('keeps cards with a promo variation', () => {
            expect(run('promo')).to.deep.equal(['promo', 'both']);
        });

        it('keeps cards without any variation', () => {
            expect(run('none')).to.deep.equal(['plain']);
        });

        it('returns all cards when unset', () => {
            expect(run(undefined)).to.have.lengthOf(5);
        });

        it('ignores the filter outside the CONTENT page', () => {
            expect(run('none', PAGE_NAMES.PROMOTIONS_EDITOR)).to.have.lengthOf(5);
        });
    });
});
