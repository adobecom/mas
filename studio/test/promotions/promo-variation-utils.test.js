import { expect } from '@esm-bundle/chai';
import {
    buildPromoVariationPath,
    buildPromoVariationPathForTag,
    fragmentIsPromoVariation,
    getPromoNameFromPromoVariationPath,
    getPromoNameFromTag,
    getPromotionTagFromFragment,
    isPromoVariationPath,
    resolveDefaultPathFromPromoVariation,
} from '../../src/promotions/promo-variation-utils.js';

describe('promo-variation-utils', () => {
    const defaultPath = '/content/dam/mas/sandbox/en_US/my-card';
    const promoVariationPath = '/content/dam/mas/sandbox/en_US/promotions/black-friday/my-card';
    const nestedDefault = '/content/dam/mas/sandbox/en_US/cards/my-card';
    const nestedPromo = '/content/dam/mas/sandbox/en_US/promotions/this/is/my/promo/cards/my-card';

    describe('isPromoVariationPath', () => {
        it('returns true for paths under promotions folder', () => {
            expect(isPromoVariationPath(promoVariationPath)).to.be.true;
            expect(isPromoVariationPath(nestedPromo)).to.be.true;
        });

        it('returns false for default fragment paths', () => {
            expect(isPromoVariationPath(defaultPath)).to.be.false;
            expect(isPromoVariationPath('/content/dam/mas/promotions/black-friday')).to.be.false;
            expect(isPromoVariationPath('')).to.be.false;
        });
    });

    describe('getPromoNameFromTag', () => {
        it('strips mas:promotion/ prefix', () => {
            expect(getPromoNameFromTag('mas:promotion/black-friday')).to.equal('black-friday');
            expect(getPromoNameFromTag('mas:promotion/this/is/my/promo')).to.equal('this/is/my/promo');
        });

        it('returns null for non-promotion tags', () => {
            expect(getPromoNameFromTag('mas:status/draft')).to.be.null;
        });
    });

    describe('buildPromoVariationPath', () => {
        it('builds promo variation path from default path and promo name', () => {
            expect(buildPromoVariationPath(defaultPath, 'black-friday')).to.equal(promoVariationPath);
        });

        it('supports multi-segment promo names and nested fragment paths', () => {
            expect(buildPromoVariationPath(nestedDefault, 'this/is/my/promo')).to.equal(nestedPromo);
        });

        it('returns null when default path is already a promo variation', () => {
            expect(buildPromoVariationPath(promoVariationPath, 'black-friday')).to.be.null;
        });
    });

    describe('buildPromoVariationPathForTag', () => {
        it('builds path from default fragment path and mas:promotion/ tag', () => {
            expect(buildPromoVariationPathForTag(defaultPath, 'mas:promotion/black-friday')).to.equal(promoVariationPath);
        });

        it('returns null for invalid promotion tags', () => {
            expect(buildPromoVariationPathForTag(defaultPath, 'mas:status/draft')).to.be.null;
        });
    });

    describe('resolveDefaultPathFromPromoVariation', () => {
        it('inverts buildPromoVariationPath', () => {
            expect(resolveDefaultPathFromPromoVariation(promoVariationPath, 'black-friday')).to.equal(defaultPath);
            expect(resolveDefaultPathFromPromoVariation(nestedPromo, 'this/is/my/promo')).to.equal(nestedDefault);
        });

        it('returns null when promo name does not match path', () => {
            expect(resolveDefaultPathFromPromoVariation(promoVariationPath, 'other-promo')).to.be.null;
        });
    });

    describe('getPromotionTagFromFragment', () => {
        it('returns first mas:promotion/ tag', () => {
            const fragment = {
                getFieldValues: (name) => (name === 'tags' ? ['mas:status/draft', 'mas:promotion/black-friday'] : []),
            };
            expect(getPromotionTagFromFragment(fragment)).to.equal('mas:promotion/black-friday');
        });

        it('reads from tags array when no getFieldValues', () => {
            expect(getPromotionTagFromFragment({ tags: [{ id: 'mas:promotion/sale' }] })).to.equal('mas:promotion/sale');
        });
    });

    describe('fragmentIsPromoVariation', () => {
        it('returns true for promo variation paths and promotion tags', () => {
            expect(fragmentIsPromoVariation({ path: promoVariationPath })).to.be.true;
            expect(fragmentIsPromoVariation({ tags: [{ id: 'mas:promotion/sale' }] })).to.be.true;
            expect(fragmentIsPromoVariation({ path: defaultPath })).to.be.false;
        });
    });

    describe('getPromoNameFromPromoVariationPath', () => {
        it('prefers tag id over path parsing', () => {
            expect(getPromoNameFromPromoVariationPath(promoVariationPath, 'mas:promotion/black-friday')).to.equal(
                'black-friday',
            );
        });
    });
});
