import { expect } from '@esm-bundle/chai';
import {
    effectiveIsVariation,
    isGroupedVariationFragment,
    pznTagsValue,
    normalizePznTagIds,
    getTagsFieldState,
    getGroupedVariationTagsValue,
    getPromoVariationGeoTagsValue,
    getPromoVariationPersonalizationTagsValue,
    getPromoVariationPersonalizationTagLabels,
    getPromotionCode,
    getVariationTabItems,
    hasAnyVariationTabItems,
    listPromotionVariations,
    countryTagLeafToLocaleCode,
    normalizePznTagToLocaleCode,
    VARIATION_TABS,
} from '../../src/editors/variation-utils.js';

describe('variation-utils', () => {
    it('effectiveIsVariation requires a parent fragment', () => {
        expect(effectiveIsVariation({ path: '/foo' }, null, true)).to.equal(false);
        expect(effectiveIsVariation({ path: '/foo' }, { path: '/parent' }, true)).to.equal(true);
    });

    describe('countryTagLeafToLocaleCode', () => {
        it('maps a bare country to the surface region locale', () => {
            expect(countryTagLeafToLocaleCode('au', 'acom', 'en')).to.equal('en_AU');
            expect(countryTagLeafToLocaleCode('SG', 'acom', 'en')).to.equal('en_SG');
        });

        it('prefers the requested language for multi-language countries', () => {
            expect(countryTagLeafToLocaleCode('CA', 'acom', 'fr')).to.equal('fr_CA');
            expect(countryTagLeafToLocaleCode('CA', 'acom', 'en')).to.equal('en_CA');
        });

        it('returns null for a country the surface does not serve', () => {
            expect(countryTagLeafToLocaleCode('ZZ', 'acom', 'en')).to.equal(null);
        });

        it('returns null without a surface', () => {
            expect(countryTagLeafToLocaleCode('AU', undefined, 'en')).to.equal(null);
        });
    });

    describe('normalizePznTagToLocaleCode', () => {
        it('passes a locale tag through unchanged', () => {
            expect(normalizePznTagToLocaleCode('mas:pzn/locale/en_US', 'acom', 'en')).to.equal('en_US');
        });

        it('maps a country tag to the surface locale', () => {
            expect(normalizePznTagToLocaleCode('mas:pzn/country/tr', 'acom', 'en')).to.equal('tr_TR');
            expect(normalizePznTagToLocaleCode('mas:pzn/country/au', 'acom', 'en')).to.equal('en_AU');
        });

        it('returns null for a non-geo pzn tag', () => {
            expect(normalizePznTagToLocaleCode('mas:pzn/segment/edu', 'acom', 'en')).to.equal(null);
        });
    });

    it('isGroupedVariationFragment matches /pzn/ paths', () => {
        // Mirror Fragment.isGroupedVariationPath which keys off "/pzn/" segment.
        expect(isGroupedVariationFragment({ path: '/content/dam/mas/x/pzn/y' })).to.equal(true);
        expect(isGroupedVariationFragment({ path: '/content/dam/mas/x/y' })).to.equal(false);
    });

    it('getPromoVariationGeoTagsValue keeps only geo-shaped tags', () => {
        const fragment = {
            getFieldValues: (name) => (name === 'pznTags' ? ['mas:pzn/edu', 'mas:pzn/country/ar'] : []),
        };
        expect(getPromoVariationGeoTagsValue(fragment)).to.equal('mas:pzn/country/ar');
    });

    it('getPromoVariationPersonalizationTagsValue keeps only non-geo tags', () => {
        const fragment = {
            getFieldValues: (name) => (name === 'pznTags' ? ['mas:pzn/edu', 'mas:pzn/country/ar'] : []),
        };
        expect(getPromoVariationPersonalizationTagsValue(fragment)).to.equal('mas:pzn/edu');
    });

    it('getPromoVariationPersonalizationTagLabels returns only the leaf value(s), not the full tag id', () => {
        const fragment = {
            getFieldValues: (name) => (name === 'pznTags' ? ['mas:pzn/edu', 'mas:pzn/smb', 'mas:pzn/country/ar'] : []),
        };
        expect(getPromoVariationPersonalizationTagLabels(fragment)).to.equal('edu, smb');
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
