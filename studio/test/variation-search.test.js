import { expect } from '@esm-bundle/chai';
import {
    classifyVariationByPath,
    resolveLocaleVariationParentPath,
    resolvePromoVariationParentPath,
    VARIATION_SEARCH_TABS,
} from '../src/utils/variation-search.js';
import { ROOT_PATH } from '../src/constants.js';

describe('classifyVariationByPath', () => {
    it('classifies grouped (pzn) variation', () => {
        const path = `${ROOT_PATH}/acom/en_US/photoshop/pzn/my-card`;
        expect(classifyVariationByPath(path)).to.deep.equal({
            isVariation: true,
            tab: VARIATION_SEARCH_TABS.GROUPED,
        });
    });

    it('classifies promo variation', () => {
        const path = `${ROOT_PATH}/acom/en_US/promotions/summer-sale/my-card`;
        expect(classifyVariationByPath(path).tab).to.equal(VARIATION_SEARCH_TABS.PROMOTION);
    });

    it('classifies locale variation', () => {
        const path = `${ROOT_PATH}/acom/fr_CA/my-card`;
        expect(classifyVariationByPath(path).tab).to.equal(VARIATION_SEARCH_TABS.LOCALE);
    });

    it('returns non-variation for default-locale parent', () => {
        const path = `${ROOT_PATH}/acom/en_US/my-card`;
        expect(classifyVariationByPath(path).isVariation).to.be.false;
    });
});

describe('resolveLocaleVariationParentPath', () => {
    it('replaces regional locale with default locale', () => {
        const path = `${ROOT_PATH}/acom/fr_CA/my-card`;
        const parent = resolveLocaleVariationParentPath(path);
        expect(parent).to.equal(`${ROOT_PATH}/acom/fr_FR/my-card`);
    });
});

describe('resolvePromoVariationParentPath', () => {
    it('resolves default fragment path candidates from promo variation path', () => {
        const path = `${ROOT_PATH}/acom/en_US/promotions/summer-sale/my-card`;
        const candidates = resolvePromoVariationParentPath(path);
        expect(candidates).to.deep.equal([`${ROOT_PATH}/acom/en_US/my-card`]);
    });
});
