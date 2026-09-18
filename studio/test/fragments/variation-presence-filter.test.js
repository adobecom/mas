import { expect } from '@esm-bundle/chai';
import {
    VARIATION_PRESENCE_OPTIONS,
    getVariationCounts,
    matchesVariationPresence,
    filterStoresByVariationPresence,
    collectPromoVariationDefaultPaths,
} from '../../src/fragments/variation-presence-filter.js';

describe('variation-presence-filter', () => {
    const makeStore = (fragment) => ({
        get: () => fragment,
        value: fragment,
    });

    const promoFragment = { path: '/content/dam/mas/acom/en_US/promotions/sale/card', getPromoVariationCount: () => 1 };
    const groupedFragment = { path: '/content/dam/mas/acom/en_US/card-grouped', getGroupedVariationCount: () => 2 };
    const bareFragment = { path: '/content/dam/mas/acom/en_US/card-bare' };

    it('declares exactly three options with the expected ids and labels', () => {
        expect(VARIATION_PRESENCE_OPTIONS).to.have.lengthOf(3);
        expect(VARIATION_PRESENCE_OPTIONS.map((o) => o.label)).to.deep.equal([
            'Has promo variation',
            'Has grouped variation',
            'No variations',
        ]);
    });

    it('getVariationCounts falls back to 0 for a fragment with no variation data', () => {
        expect(getVariationCounts(bareFragment)).to.deep.equal({ promo: 0, grouped: 0, locale: 0 });
    });

    it('getVariationCounts falls back to list-method lengths when counters are absent', () => {
        const fragment = {
            listPromoVariations: () => [{}, {}],
            listGroupedVariations: () => [],
            listLocaleVariations: () => [{}],
        };
        expect(getVariationCounts(fragment)).to.deep.equal({ promo: 2, grouped: 0, locale: 1 });
    });

    it('getVariationCounts classifies by variation path when getVariations is available, without needing hydrated references', () => {
        // Mirrors an un-hydrated search-result fragment: `variations` field is present, `references` is not.
        const fragment = {
            getVariations: () => [
                '/content/dam/mas/acom/en_US/promotions/sale/card',
                '/content/dam/mas/acom/en_US/some-code/pzn/card-a',
                '/content/dam/mas/acom/fr_FR/card',
            ],
        };
        expect(getVariationCounts(fragment)).to.deep.equal({ promo: 1, grouped: 1, locale: 1 });
    });

    it('getVariationCounts returns all zeros when getVariations returns no paths', () => {
        expect(getVariationCounts({ getVariations: () => [] })).to.deep.equal({ promo: 0, grouped: 0, locale: 0 });
    });

    it('matchesVariationPresence treats an unrecognized option id as a pass-through match', () => {
        expect(matchesVariationPresence(bareFragment, 'unknown-option')).to.equal(true);
    });

    it('returns the same stores unchanged when no option is selected', () => {
        const stores = [makeStore(promoFragment), makeStore(groupedFragment), makeStore(bareFragment)];
        expect(filterStoresByVariationPresence(stores, undefined)).to.equal(stores);
        expect(filterStoresByVariationPresence(stores, null)).to.equal(stores);
        expect(filterStoresByVariationPresence(stores, '')).to.equal(stores);
    });

    it('"Has promo variation" keeps only fragments with a promo variation', () => {
        const stores = [makeStore(promoFragment), makeStore(groupedFragment), makeStore(bareFragment)];
        const filtered = filterStoresByVariationPresence(stores, 'has-promo-variation');
        expect(filtered).to.have.lengthOf(1);
        expect(filtered[0].get()).to.equal(promoFragment);
    });

    it('"Has grouped variation" keeps only fragments with a grouped variation', () => {
        const stores = [makeStore(promoFragment), makeStore(groupedFragment), makeStore(bareFragment)];
        const filtered = filterStoresByVariationPresence(stores, 'has-grouped-variation');
        expect(filtered).to.have.lengthOf(1);
        expect(filtered[0].get()).to.equal(groupedFragment);
    });

    it('"No variations" keeps only fragments with zero promo/grouped/locale variations, including bare fragments', () => {
        const stores = [makeStore(promoFragment), makeStore(groupedFragment), makeStore(bareFragment)];
        const filtered = filterStoresByVariationPresence(stores, 'no-variations');
        expect(filtered).to.have.lengthOf(1);
        expect(filtered[0].get()).to.equal(bareFragment);
    });

    it('does not throw for a fragment exposing no variation methods or data at all', () => {
        expect(() => filterStoresByVariationPresence([makeStore({})], 'no-variations')).to.not.throw();
        expect(filterStoresByVariationPresence([makeStore({})], 'no-variations')).to.have.lengthOf(1);
    });

    it('composes with a pre-filtered subset without re-introducing excluded items', () => {
        const stores = [makeStore(promoFragment), makeStore(groupedFragment), makeStore(bareFragment)];
        const preFiltered = stores.slice(0, 2); // excludes bareFragment
        const filtered = filterStoresByVariationPresence(preFiltered, 'no-variations');
        expect(filtered).to.have.lengthOf(0);
    });

    it('does not mutate the input array', () => {
        const stores = [makeStore(promoFragment), makeStore(groupedFragment), makeStore(bareFragment)];
        const snapshot = [...stores];
        filterStoresByVariationPresence(stores, 'has-promo-variation');
        expect(stores).to.deep.equal(snapshot);
    });

    describe('promo-variation detection via sibling fragments (real Fragment shape)', () => {
        // Real card fragments never carry promo variations in their own `variations` field
        // (createPromoVariation only tags the variation fragment itself), so presence has to be
        // inferred from a sibling promo-variation fragment elsewhere in the list, resolved back to
        // its default fragment path by path convention (promotions/<name>/<fragmentPath>).
        const defaultCard = { path: '/content/dam/mas/acom/en_US/card', getVariations: () => [] };
        const promoVariation = {
            path: '/content/dam/mas/acom/en_US/promotions/sale/card',
            tags: [{ id: 'mas:promotion/sale' }],
            getVariations: () => [],
        };
        const unrelatedCard = { path: '/content/dam/mas/acom/en_US/card-other', getVariations: () => [] };

        it('resolves the promo-variation fragment back to its default fragment path', () => {
            const index = collectPromoVariationDefaultPaths([
                makeStore(promoVariation),
                makeStore(defaultCard),
                makeStore(unrelatedCard),
            ]);
            expect(index.has(defaultCard.path)).to.equal(true);
            expect(index.has(unrelatedCard.path)).to.equal(false);
        });

        it('"Has promo variation" keeps the default card even though its own `variations` field never lists the promo variation', () => {
            const stores = [makeStore(promoVariation), makeStore(defaultCard), makeStore(unrelatedCard)];
            const filtered = filterStoresByVariationPresence(stores, 'has-promo-variation');
            expect(filtered.map((fs) => fs.get().path)).to.deep.equal([defaultCard.path]);
        });

        it('does not mistake the promo-variation fragment itself for a card that has a promo variation', () => {
            const promoVariationDefaultPaths = collectPromoVariationDefaultPaths([
                makeStore(promoVariation),
                makeStore(defaultCard),
            ]);
            expect(matchesVariationPresence(promoVariation, 'has-promo-variation', promoVariationDefaultPaths)).to.equal(false);
        });

        it('"No variations" excludes the default card once its sibling promo variation is accounted for', () => {
            const stores = [makeStore(promoVariation), makeStore(defaultCard), makeStore(unrelatedCard)];
            const filtered = filterStoresByVariationPresence(stores, 'no-variations').map((fs) => fs.get().path);
            expect(filtered).to.not.include(defaultCard.path);
            expect(filtered).to.include(unrelatedCard.path);
        });
    });
});
