import { expect } from 'chai';
import {
    computeRegionLocale,
    transformer as defaultLanguageVariation,
} from '../../src/fragment/transformers/defaultLanguageVariation.js';

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

describe('defaultLanguageVariation transformer', function () {
    it('init returns 400 when fetchFragment promise is missing', async function () {
        const result = await defaultLanguageVariation.init({ promises: {} });
        expect(result.status).to.equal(400);
        expect(result.message).to.match(/fetchFragment/i);
    });

    it('init propagates non-200 fetchFragment result', async function () {
        const promises = {
            fetchFragment: Promise.resolve({ status: 503, message: 'upstream unavailable' }),
        };
        const result = await defaultLanguageVariation.init({ promises, locale: 'en_US' });
        expect(result.status).to.equal(503);
        expect(result.message).to.equal('upstream unavailable');
    });

    it('exposes name and process', function () {
        expect(defaultLanguageVariation.name).to.equal('defaultLanguageVariation');
        expect(defaultLanguageVariation.init).to.be.a('function');
        expect(defaultLanguageVariation.process).to.be.a('function');
    });
});
