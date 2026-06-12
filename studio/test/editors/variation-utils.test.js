import { expect } from '@esm-bundle/chai';
import {
    effectiveIsVariation,
    isGroupedVariationFragment,
    pznTagsValue,
    normalizePznTagIds,
    getTagsFieldState,
    getGroupedVariationTagsValue,
    getPromotionCode,
    getVariationTabItems,
    hasAnyVariationTabItems,
    listPromotionVariations,
    VARIATION_TABS,
} from '../../src/editors/variation-utils.js';

describe('variation-utils', () => {
    it('effectiveIsVariation requires a parent fragment', () => {
        expect(effectiveIsVariation({ path: '/foo' }, null, true)).to.equal(false);
        expect(effectiveIsVariation({ path: '/foo' }, { path: '/parent' }, true)).to.equal(true);
    });

    it('isGroupedVariationFragment matches /pzn/ paths', () => {
        // Mirror Fragment.isGroupedVariationPath which keys off "/pzn/" segment.
        expect(isGroupedVariationFragment({ path: '/content/dam/mas/x/pzn/y' })).to.equal(true);
        expect(isGroupedVariationFragment({ path: '/content/dam/mas/x/y' })).to.equal(false);
    });

    it('pznTagsValue joins non-empty tag values', () => {
        const fragment = { getFieldValues: (name) => (name === 'pznTags' ? ['a', '', 'b'] : []) };
        expect(pznTagsValue(fragment)).to.equal('a,b');
    });

    it('normalizePznTagIds dedupes, trims, and converts entries', () => {
        const result = normalizePznTagIds([' mas:locale/fr_FR ', 'mas:locale/fr_FR', 'mas:locale/de_DE']);
        expect(result).to.have.lengthOf(2);
    });

    it('getTagsFieldState returns no-parent when not a variation', () => {
        const fragment = { tags: [{ id: 'a' }] };
        const state = getTagsFieldState({ fragment, localeDefaultFragment: null, isVariation: false });
        expect(state).to.equal('no-parent');
    });

    it('provides the shared variation tabs', () => {
        expect(VARIATION_TABS.map((tab) => tab.id)).to.deep.equal(['locale', 'promotion', 'grouped']);
        expect(VARIATION_TABS.map((tab) => tab.label)).to.deep.equal(['Locale', 'Promotion', 'Grouped variation']);
    });

    it('lists promotion variations from variation paths and references', () => {
        const promoRef = { path: '/content/dam/mas/sandbox/en_US/cards/promo', tags: [{ id: 'mas:promotion/spring' }] };
        const fragment = {
            getVariations: () => ['/content/dam/mas/sandbox/en_US/cards/promo', '/content/dam/mas/sandbox/en_US/pzn/grouped'],
            references: [
                promoRef,
                { path: '/content/dam/mas/sandbox/en_US/pzn/grouped', tags: [{ id: 'mas:promotion/fall' }] },
            ],
        };
        expect(listPromotionVariations(fragment)).to.deep.equal([promoRef]);
        expect(getVariationTabItems(fragment, 'promotion')).to.deep.equal([promoRef]);
        expect(hasAnyVariationTabItems(fragment)).to.equal(true);
    });

    it('reads grouped tags and promo code from plain fragments', () => {
        const fragment = {
            fields: [
                { name: 'pznTags', values: ['mas:locale/fr_FR', ''] },
                { name: 'promoCode', values: ['PROMO'] },
            ],
        };
        expect(getGroupedVariationTagsValue(fragment)).to.equal('mas:locale/fr_FR');
        expect(getPromotionCode(fragment)).to.equal('PROMO');
    });
});
