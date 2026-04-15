import { expect } from 'chai';
import { computeRegionLocale } from '../../src/fragment/transformers/defaultLanguageVariation.js';

describe('computeRegionLocale', function () {
    it('should compute well typical use cases', function () {
        const CTX = {
            defaultLocale: 'fr_FR',
            surface: 'sandbox',
        };
        expect(computeRegionLocale({ locale: 'fr_FR', country: undefined, ...CTX })).to.equal('fr_FR');
        expect(computeRegionLocale({ locale: 'fr_FR', country: 'FR', ...CTX })).to.equal('fr_FR');
        expect(computeRegionLocale({ locale: 'fr_FR', country: 'BE', ...CTX })).to.equal('fr_BE');
        expect(computeRegionLocale({ locale: 'fr_FR', country: 'ca', ...CTX })).to.equal('fr_CA');
        expect(computeRegionLocale({ locale: 'fr_FR', country: 'CH', ...CTX })).to.equal('fr_CH');
        expect(computeRegionLocale({ locale: 'fr_FR', country: 'IN', ...CTX })).to.equal('fr_FR');
        expect(computeRegionLocale({ locale: 'fr_BE', country: undefined, ...CTX })).to.equal('fr_BE');
        expect(computeRegionLocale({ locale: 'fr_BE', country: 'FR', ...CTX })).to.equal('fr_BE');
        expect(computeRegionLocale({ locale: 'fr_BE', country: 'IN', ...CTX })).to.equal('fr_BE');
    });
});
