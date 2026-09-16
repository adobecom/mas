import { expect } from '@open-wc/testing';
import {
    matchesVariationPresence,
    VARIATION_PRESENCE,
    VARIATION_PRESENCE_OPTIONS,
} from '../../src/aem/variation-presence-filter.js';

describe('variation-presence-filter', () => {
    const promoFragment = {
        fields: [
            { name: 'variations', values: ['/content/dam/mas/sandbox/en_US/promotions/black-friday/my-fragment'] },
        ],
    };
    const localeOnlyFragment = {
        fields: [{ name: 'variations', values: ['/content/dam/mas/sandbox/en_CA/my-fragment'] }],
    };
    const noVariationsFragment = {
        fields: [{ name: 'variations', values: [] }],
    };

    describe('VARIATION_PRESENCE_OPTIONS', () => {
        it('exposes exactly two options and no grouped option', () => {
            expect(VARIATION_PRESENCE_OPTIONS).to.have.lengthOf(2);
            const titles = VARIATION_PRESENCE_OPTIONS.map((option) => option.title);
            expect(titles).to.deep.equal(['Has promo variation', 'No variations']);
            expect(titles.some((title) => title.toLowerCase().includes('grouped'))).to.be.false;
        });

        it('option ids match the VARIATION_PRESENCE constants', () => {
            const ids = VARIATION_PRESENCE_OPTIONS.map((option) => option.id);
            expect(ids).to.deep.equal([VARIATION_PRESENCE.HAS_PROMO_VARIATION, VARIATION_PRESENCE.NO_VARIATIONS]);
        });
    });

    describe('matchesVariationPresence', () => {
        it('is unfiltered (matches everything) when no selection is provided', () => {
            expect(matchesVariationPresence(promoFragment, [])).to.be.true;
            expect(matchesVariationPresence(noVariationsFragment, undefined)).to.be.true;
            expect(matchesVariationPresence(localeOnlyFragment, [])).to.be.true;
        });

        it('"has-promo-variation" matches only fragments with a promo variation path', () => {
            const selected = [VARIATION_PRESENCE.HAS_PROMO_VARIATION];
            expect(matchesVariationPresence(promoFragment, selected)).to.be.true;
            expect(matchesVariationPresence(noVariationsFragment, selected)).to.be.false;
            expect(matchesVariationPresence(localeOnlyFragment, selected)).to.be.false;
        });

        it('"no-variations" matches only fragments with zero variations', () => {
            const selected = [VARIATION_PRESENCE.NO_VARIATIONS];
            expect(matchesVariationPresence(noVariationsFragment, selected)).to.be.true;
            expect(matchesVariationPresence(promoFragment, selected)).to.be.false;
            expect(matchesVariationPresence(localeOnlyFragment, selected)).to.be.false;
        });

        it('selecting both options is a union (OR), not an intersection', () => {
            const selected = [VARIATION_PRESENCE.HAS_PROMO_VARIATION, VARIATION_PRESENCE.NO_VARIATIONS];
            expect(matchesVariationPresence(promoFragment, selected)).to.be.true;
            expect(matchesVariationPresence(noVariationsFragment, selected)).to.be.true;
            expect(matchesVariationPresence(localeOnlyFragment, selected)).to.be.false;
        });

        it('works against a real Fragment instance via getVariations()', () => {
            const fragmentLike = {
                getVariations: () => ['/content/dam/mas/sandbox/en_US/promotions/black-friday/my-fragment'],
            };
            expect(matchesVariationPresence(fragmentLike, [VARIATION_PRESENCE.HAS_PROMO_VARIATION])).to.be.true;
            expect(matchesVariationPresence(fragmentLike, [VARIATION_PRESENCE.NO_VARIATIONS])).to.be.false;
        });
    });
});
