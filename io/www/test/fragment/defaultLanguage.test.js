import { expect } from 'chai';
import sinon from 'sinon';
import { createResponse } from './mocks/MockFetch.js';
import { computeRegionLocale, transformer as defaultLanguage } from '../../src/fragment/transformers/defaultLanguage.js';

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

describe('defaultLanguage transformer', function () {
    it('init returns 400 when fetchFragment promise is missing', async function () {
        const result = await defaultLanguage.init({ promises: {} });
        expect(result.status).to.equal(400);
        expect(result.message).to.match(/fetchFragment/i);
    });

    it('init propagates non-200 fetchFragment result', async function () {
        const promises = {
            fetchFragment: Promise.resolve({ status: 503, message: 'upstream unavailable' }),
        };
        const result = await defaultLanguage.init({ promises, locale: 'en_US' });
        expect(result.status).to.equal(503);
        expect(result.message).to.equal('upstream unavailable');
    });

    it('exposes name and process', function () {
        expect(defaultLanguage.name).to.equal('defaultLanguage');
        expect(defaultLanguage.init).to.be.a('function');
        expect(defaultLanguage.process).to.be.a('function');
    });

    it('process returns non-200 defaultLanguage result without merging context', async function () {
        const err = { status: 503, message: 'variation failed' };
        const result = await defaultLanguage.process({
            foo: 'bar',
            promises: { defaultLanguage: Promise.resolve(err) },
        });
        expect(result).to.equal(err);
        expect(result.status).to.equal(503);
    });

    it('getDefaultLanguageVariation returns error when getFragmentId returns no id', async function () {
        const fetchStub = sinon
            .stub(globalThis, 'fetch')
            .returns(createResponse(503, { message: 'upstream error' }, 'Service Unavailable'));
        try {
            const promises = {
                fetchFragment: Promise.resolve({
                    status: 200,
                    body: {},
                    parsedLocale: 'en_US',
                    surface: 'sandbox',
                    fragmentPath: 'some/path',
                }),
            };
            const result = await defaultLanguage.init({
                promises,
                locale: 'fr_FR',
                surface: 'sandbox',
                fragmentPath: 'some/path',
                preview: false,
                networkConfig: { retries: 1, retryDelay: 0 },
            });
            expect(result.status).to.not.equal(200);
            expect(result.message).to.be.a('string');
        } finally {
            fetchStub.restore();
        }
    });
});
