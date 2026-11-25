import { expect } from '@esm-bundle/chai';
import * as commerce from '../src/commerce.js';

describe('commerce exports', () => {
    it('exposes the shared helpers required by merch cards', () => {
        for (const name of [
            'createTag',
            'getHeadlessCtaVariant',
            'getService',
            'hydrateHeadlessCta',
            'printMeasure',
            'createMasElement',
            'toPromotionCodes',
            'UptLink',
            'extractBackgroundUrl',
            'rewriteImageUrlsForProd',
            'sanitizePictureMarkup',
            'hostOsi',
            'applyContextPromotionCode',
            'applyDisplayAnnualDefault',
            'applyHideStPriceLabels',
            'mergePriceLiterals',
            'registerContextOptionsProviders',
        ]) {
            expect(commerce[name], name).to.not.equal(undefined);
        }
    });
});
