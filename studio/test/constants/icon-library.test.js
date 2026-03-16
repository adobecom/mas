import { expect } from '@esm-bundle/chai';
import { getSpectrumVersion, renderSpIcon, ICON_LIBRARY } from '../../src/constants/icon-library.js';
import { VARIANT_NAMES } from '../../src/editors/variant-picker.js';

describe('icon-library', () => {
    describe('getSpectrumVersion', () => {
        it('should return "spectrum" for plans variant', () => {
            expect(getSpectrumVersion(VARIANT_NAMES.PLANS)).to.equal('spectrum');
        });

        it('should return "spectrum" for plans-v2 variant', () => {
            expect(getSpectrumVersion(VARIANT_NAMES.PLANS_V2)).to.equal('spectrum');
        });

        it('should return "spectrum" for plans-students variant', () => {
            expect(getSpectrumVersion(VARIANT_NAMES.PLANS_STUDENTS)).to.equal('spectrum');
        });

        it('should return "spectrum" for plans-education variant', () => {
            expect(getSpectrumVersion(VARIANT_NAMES.PLANS_EDUCATION)).to.equal('spectrum');
        });

        it('should return "spectrum" for special-offers variant', () => {
            expect(getSpectrumVersion(VARIANT_NAMES.SPECIAL_OFFERS)).to.equal('spectrum');
        });

        it('should return "spectrum" for segment variant', () => {
            expect(getSpectrumVersion(VARIANT_NAMES.SEGMENT)).to.equal('spectrum');
        });

        it('should return "spectrum" for catalog variant', () => {
            expect(getSpectrumVersion(VARIANT_NAMES.CATALOG)).to.equal('spectrum');
        });

        it('should return "spectrum" for product variant', () => {
            expect(getSpectrumVersion(VARIANT_NAMES.PRODUCT)).to.equal('spectrum');
        });

        it('should return "spectrum" for mini-compare-chart variant', () => {
            expect(getSpectrumVersion(VARIANT_NAMES.MINI_COMPARE_CHART)).to.equal('spectrum');
        });

        it('should return "spectrum" for mini-compare-chart-mweb variant', () => {
            expect(getSpectrumVersion(VARIANT_NAMES.MINI_COMPARE_CHART_MWEB)).to.equal('spectrum');
        });

        it('should return "express" for simplified-pricing-express variant', () => {
            expect(getSpectrumVersion(VARIANT_NAMES.SIMPLIFIED_PRICING_EXPRESS)).to.equal('express');
        });

        it('should return "express" for full-pricing-express variant', () => {
            expect(getSpectrumVersion(VARIANT_NAMES.FULL_PRICING_EXPRESS)).to.equal('express');
        });

        it('should return "spectrum-two" for an unknown variant', () => {
            expect(getSpectrumVersion('unknown-variant')).to.equal('spectrum-two');
        });

        it('should return "spectrum-two" for undefined', () => {
            expect(getSpectrumVersion(undefined)).to.equal('spectrum-two');
        });

        it('should return "spectrum-two" for empty string', () => {
            expect(getSpectrumVersion('')).to.equal('spectrum-two');
        });
    });

    describe('ICON_LIBRARY', () => {
        it('should be a non-empty array', () => {
            expect(ICON_LIBRARY).to.be.an('array');
            expect(ICON_LIBRARY.length).to.be.greaterThan(0);
        });

        it('each icon should have an id and name', () => {
            ICON_LIBRARY.forEach((icon) => {
                expect(icon.id).to.be.a('string');
                expect(icon.name).to.be.a('string');
            });
        });

        it('each icon id should start with "sp-icon-"', () => {
            ICON_LIBRARY.forEach((icon) => {
                expect(icon.id.startsWith('sp-icon-')).to.be.true;
            });
        });

        it('should include sp-icon-star', () => {
            const star = ICON_LIBRARY.find((icon) => icon.id === 'sp-icon-star');
            expect(star).to.exist;
            expect(star.name).to.equal('Star');
        });

        it('should include sp-icon-ribbon', () => {
            const ribbon = ICON_LIBRARY.find((icon) => icon.id === 'sp-icon-ribbon');
            expect(ribbon).to.exist;
        });
    });

    describe('renderSpIcon', () => {
        it('should return a truthy TemplateResult', () => {
            const result = renderSpIcon('sp-icon-star', VARIANT_NAMES.PLANS);
            expect(result).to.exist;
        });

        it('should return a result for mini-compare-chart (spectrum)', () => {
            const result = renderSpIcon('sp-icon-ribbon', VARIANT_NAMES.MINI_COMPARE_CHART);
            expect(result).to.exist;
        });

        it('should return a result for express variant', () => {
            const result = renderSpIcon('sp-icon-star', VARIANT_NAMES.SIMPLIFIED_PRICING_EXPRESS);
            expect(result).to.exist;
        });

        it('should return a result for unknown variant (spectrum-two)', () => {
            const result = renderSpIcon('sp-icon-star', 'unknown');
            expect(result).to.exist;
        });
    });
});
