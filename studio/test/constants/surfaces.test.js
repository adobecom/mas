import { expect } from '@esm-bundle/chai';
import { SURFACES, PLACEHOLDER_CTA_SURFACES } from '../../src/constants.js';
import { getSurfaceLocales } from '../../src/locales.js';

describe('surfaces', () => {
    describe('SURFACES.BRAND_CONCIERGE', () => {
        it('is registered with the expected name and label', () => {
            expect(SURFACES.BRAND_CONCIERGE.name).to.equal('brand-concierge');
            expect(SURFACES.BRAND_CONCIERGE.label).to.equal('Brand Concierge');
        });

        it('carries the UCv3 checkout client id acom_bc', () => {
            expect(SURFACES.BRAND_CONCIERGE.checkoutClientId).to.equal('acom_bc');
        });

        it('is a distinct surface from ACOM', () => {
            expect(SURFACES.BRAND_CONCIERGE.name).to.not.equal(SURFACES.ACOM.name);
        });
    });

    it('is included in PLACEHOLDER_CTA_SURFACES like ACOM', () => {
        expect(PLACEHOLDER_CTA_SURFACES).to.include(SURFACES.ACOM.name);
        expect(PLACEHOLDER_CTA_SURFACES).to.include(SURFACES.BRAND_CONCIERGE.name);
    });

    it('inherits the ACOM locale set', () => {
        const brandConciergeLocales = getSurfaceLocales(SURFACES.BRAND_CONCIERGE.name);
        const acomLocales = getSurfaceLocales(SURFACES.ACOM.name);
        expect(brandConciergeLocales).to.not.be.empty;
        expect(brandConciergeLocales).to.deep.equal(acomLocales);
    });
});
