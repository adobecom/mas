import { expect } from '@esm-bundle/chai';
import { PAGE_NAMES } from '../../src/constants.js';
import {
    applyFragmentListFilters,
    VARIATION_PRESENCE,
    fragmentHasPromoVariation,
    fragmentHasGroupedVariation,
    fragmentHasNoVariations,
} from '../../src/fragments/fragment-list-filters.js';

describe('variation-presence-filter', () => {
    const makeStore = (fragment) => ({
        get: () => fragment,
        value: fragment,
    });

    const promoCard = {
        path: '/content/dam/mas/acom/en_US/card-promo',
        tags: [],
        variations: ['/content/dam/mas/acom/en_US/promotions/sale/card-promo'],
    };
    const groupedCard = {
        path: '/content/dam/mas/acom/en_US/card-grouped',
        tags: [],
        variations: ['/content/dam/mas/acom/en_US/pzn/segment/card-grouped'],
    };
    const noVariationsCard = {
        path: '/content/dam/mas/acom/en_US/card-none',
        tags: [],
        variations: [],
    };
    const localeOnlyCard = {
        path: '/content/dam/mas/acom/en_US/card-locale',
        tags: [],
        variations: ['/content/dam/mas/acom/fr_FR/card-locale'],
    };

    const allStores = [promoCard, groupedCard, noVariationsCard, localeOnlyCard].map(makeStore);

    describe('predicates', () => {
        it('fragmentHasPromoVariation matches only the promo card', () => {
            expect(fragmentHasPromoVariation(promoCard)).to.be.true;
            expect(fragmentHasPromoVariation(groupedCard)).to.be.false;
            expect(fragmentHasPromoVariation(noVariationsCard)).to.be.false;
            expect(fragmentHasPromoVariation(localeOnlyCard)).to.be.false;
        });

        it('fragmentHasGroupedVariation matches only the grouped card', () => {
            expect(fragmentHasGroupedVariation(groupedCard)).to.be.true;
            expect(fragmentHasGroupedVariation(promoCard)).to.be.false;
            expect(fragmentHasGroupedVariation(noVariationsCard)).to.be.false;
            expect(fragmentHasGroupedVariation(localeOnlyCard)).to.be.false;
        });

        it('fragmentHasNoVariations matches only the card with no variations', () => {
            expect(fragmentHasNoVariations(noVariationsCard)).to.be.true;
            expect(fragmentHasNoVariations(promoCard)).to.be.false;
            expect(fragmentHasNoVariations(groupedCard)).to.be.false;
            expect(fragmentHasNoVariations(localeOnlyCard)).to.be.false;
        });
    });

    describe('applyFragmentListFilters variationPresence option', () => {
        it('returns every card when variationPresence is unset (default unfiltered state)', () => {
            const withoutOption = applyFragmentListFilters(allStores, {
                page: PAGE_NAMES.PROMOTIONS,
                personalizationFilterEnabled: false,
            });
            const withOption = applyFragmentListFilters(allStores, {
                page: PAGE_NAMES.PROMOTIONS,
                personalizationFilterEnabled: false,
                variationPresence: undefined,
            });
            expect(withOption.map((fs) => fs.get().path)).to.deep.equal(withoutOption.map((fs) => fs.get().path));
            expect(withOption).to.have.lengthOf(allStores.length);
        });

        it('returns only cards with a promo variation for VARIATION_PRESENCE.PROMO', () => {
            const filtered = applyFragmentListFilters(allStores, {
                page: PAGE_NAMES.PROMOTIONS,
                personalizationFilterEnabled: false,
                variationPresence: VARIATION_PRESENCE.PROMO,
            });
            expect(filtered).to.have.lengthOf(1);
            expect(filtered[0].get().path).to.equal(promoCard.path);
        });

        it('returns only cards with a grouped variation for VARIATION_PRESENCE.GROUPED', () => {
            const filtered = applyFragmentListFilters(allStores, {
                page: PAGE_NAMES.PROMOTIONS,
                personalizationFilterEnabled: false,
                variationPresence: VARIATION_PRESENCE.GROUPED,
            });
            expect(filtered).to.have.lengthOf(1);
            expect(filtered[0].get().path).to.equal(groupedCard.path);
        });

        it('returns only cards with no variations for VARIATION_PRESENCE.NONE', () => {
            const filtered = applyFragmentListFilters(allStores, {
                page: PAGE_NAMES.PROMOTIONS,
                personalizationFilterEnabled: false,
                variationPresence: VARIATION_PRESENCE.NONE,
            });
            expect(filtered).to.have.lengthOf(1);
            expect(filtered[0].get().path).to.equal(noVariationsCard.path);
        });

        it('combines with CONTENT-page promo-variation hiding and personalization filtering', () => {
            const pznTaggedCard = {
                path: '/content/dam/mas/acom/en_US/card-pzn-tagged',
                tags: [{ id: 'mas:pzn/segment/a' }],
                variations: ['/content/dam/mas/acom/en_US/promotions/sale/card-pzn-tagged'],
            };
            const promoVariationRow = {
                path: '/content/dam/mas/acom/en_US/promotions/sale/card-promo',
                tags: [{ id: 'mas:promotion/sale' }],
                variations: [],
            };
            const stores = [...allStores, makeStore(pznTaggedCard), makeStore(promoVariationRow)];

            const filtered = applyFragmentListFilters(stores, {
                page: PAGE_NAMES.CONTENT,
                personalizationFilterEnabled: false,
                variationPresence: VARIATION_PRESENCE.PROMO,
            });

            // promoVariationRow is itself a promo variation, excluded on CONTENT page regardless of variationPresence
            // pznTaggedCard carries a pzn tag, excluded while personalization is off
            expect(filtered).to.have.lengthOf(1);
            expect(filtered[0].get().path).to.equal(promoCard.path);
        });
    });
});
