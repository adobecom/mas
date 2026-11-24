import { expect } from '@esm-bundle/chai';
import { SURFACES, PLACEHOLDER_CTA_SURFACES } from '../../src/constants.js';
import { getSurfaceLocales } from '../../src/locales.js';

describe('surfaces', () => {
    describe('SURFACES.BRAND_CONCIERGE', () => {
        it('is registered with the expected name and label', () => {
            expect(SURFACES.BRAND_CONCIERGE.name).to.equal('brand-concierge');
            expect(SURFACES.BRAND_CONCIERGE.label).to.equal('Brand Concierge');
        });
    });

    describe('SURFACES.GENUINE and SURFACES.ACOM_EDU', () => {
        it('are registered with the expected names and labels', () => {
            expect(SURFACES.GENUINE.name).to.equal('genuine');
            expect(SURFACES.GENUINE.label).to.equal('Genuine');
            expect(SURFACES.ACOM_EDU.name).to.equal('acom-edu');
            expect(SURFACES.ACOM_EDU.label).to.equal('ACOM EDU');
        });
    });

    describe('SURFACES.DALP and SURFACES.ELEMENTS', () => {
        it('are registered with the expected names and labels', () => {
            expect(SURFACES.DALP).to.deep.equal({ label: 'DALP', name: 'dalp' });
            expect(SURFACES.ELEMENTS).to.deep.equal({ label: 'Elements', name: 'elements' });
        });
    });

    it('inherits the ACOM locale set for genuine, acom-edu, dalp and elements', () => {
        const acomLocales = getSurfaceLocales(SURFACES.ACOM.name);
        for (const surface of [SURFACES.GENUINE, SURFACES.ACOM_EDU, SURFACES.DALP, SURFACES.ELEMENTS]) {
            const locales = getSurfaceLocales(surface.name);
            expect(locales, surface.name).to.not.be.empty;
            expect(locales, surface.name).to.deep.equal(acomLocales);
        }
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
