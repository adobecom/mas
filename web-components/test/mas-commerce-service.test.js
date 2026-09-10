import Sinon from 'sinon';

import { FF_DEFAULTS } from '../src/constants.js';
import { Defaults } from '../src/defaults.js';
import { TAG_NAME_SERVICE } from '../src/mas-commerce-service.js';
import '../src/aem-fragment.js';

import { mockFetch } from './mocks/fetch.js';
import { mockIms, unmockIms } from './mocks/ims.js';
import {
    expect,
    initMasCommerceService,
    removeMasCommerceService,
} from './utilities.js';
import { withWcs } from './mocks/wcs.js';

describe('commerce service', () => {
    before(async () => {
        window.lana = { log: Sinon.spy() };
        window.lana.localhost = false;
        await mockFetch(withWcs);
    });

    afterEach(() => {
        removeMasCommerceService();
        unmockIms();
    });

    beforeEach(async () => {
        await mockIms();
    });

    describe(`component "${TAG_NAME_SERVICE}"`, () => {
        describe('feature flags', () => {
            it('considers feature flags', async () => {
                let el = await initMasCommerceService();
                expect(
                    el.featureFlags['mas-ff-defaults'],
                    'undefined feature flag should be unset',
                ).to.be.false;
                el = await initMasCommerceService({
                    'data-mas-ff-defaults': 'on',
                });
                expect(
                    el.featureFlags['mas-ff-defaults'],
                    'defined feature flag with on should be set',
                ).to.be.true;
                el = await initMasCommerceService({
                    'data-mas-ff-defaults': 'off',
                });
                expect(
                    el.featureFlags['mas-ff-defaults'],
                    'defined feature flag with off should be unset',
                ).to.be.false;
            });
        });

        describe('AUP Select configuration', () => {
            let meta;
            let originalUrl;
            let storedValues;

            beforeEach(() => {
                originalUrl = window.location.href;
                storedValues = [sessionStorage, localStorage].map((storage) =>
                    storage.getItem('aup-select'),
                );
                meta = document.createElement('meta');
                meta.name = 'aup-select';
            });

            afterEach(() => {
                meta.remove();
                history.replaceState(null, '', originalUrl);
                [sessionStorage, localStorage].forEach((storage, index) => {
                    const value = storedValues[index];
                    if (value === null) storage.removeItem('aup-select');
                    else storage.setItem('aup-select', value);
                });
            });

            it('defaults to disabled and reads the current service attribute', () => {
                const service = initMasCommerceService();
                const { settings } = service;
                expect(settings.aupSelect).to.be.false;
                service.setAttribute('aup-select', 'on');
                expect(settings.aupSelect).to.be.true;
                for (const value of ['off', 'true', 'ON', '']) {
                    service.setAttribute('aup-select', value);
                    expect(settings.aupSelect).to.be.false;
                }
                service.removeAttribute('aup-select');
                expect(settings.aupSelect).to.be.false;
            });

            it('uses live metadata ahead of the service attribute', () => {
                const service = initMasCommerceService({ 'aup-select': 'off' });
                const { settings } = service;
                expect(settings.aupSelect).to.be.false;
                meta.content = 'on';
                document.head.append(meta);
                expect(settings.aupSelect).to.be.true;
                service.setAttribute('aup-select', 'on');
                meta.content = 'off';
                expect(settings.aupSelect).to.be.false;
                meta.content = '';
                expect(settings.aupSelect).to.be.false;
                const replacement = meta.cloneNode();
                replacement.content = 'on';
                meta.replaceWith(replacement);
                meta = replacement;
                expect(settings.aupSelect).to.be.true;
                meta.remove();
                expect(settings.aupSelect).to.be.true;
                service.removeAttribute('aup-select');
                expect(settings.aupSelect).to.be.false;
            });

            for (const value of ['on', 'off']) {
                it(`ignores storage overrides set to ${value}`, () => {
                    sessionStorage.setItem('aup-select', value);
                    localStorage.setItem('aup-select', value);
                    const service = initMasCommerceService();
                    const { settings } = service;
                    expect(settings.aupSelect).to.be.false;
                    service.setAttribute('aup-select', 'on');
                    expect(settings.aupSelect).to.be.true;
                    meta.content = 'off';
                    document.head.append(meta);
                    expect(settings.aupSelect).to.be.false;
                    meta.content = 'on';
                    expect(settings.aupSelect).to.be.true;
                });
            }

            for (const value of ['on', 'off', 'true', 'ON', '']) {
                it(`uses the live query override ${JSON.stringify(value)} ahead of metadata and the service attribute`, () => {
                    const enabled = value === 'on';
                    const fallback = enabled ? 'off' : 'on';
                    const service = initMasCommerceService({
                        'aup-select': fallback,
                    });
                    const { settings } = service;
                    meta.content = fallback;
                    document.head.append(meta);
                    expect(settings.aupSelect).to.equal(!enabled);

                    const url = new URL(originalUrl);
                    url.searchParams.set('aup-select', value);
                    history.replaceState(null, '', url);
                    expect(settings.aupSelect).to.equal(enabled);

                    url.searchParams.delete('aup-select');
                    history.replaceState(null, '', url);
                    expect(settings.aupSelect).to.equal(!enabled);
                    meta.remove();
                    expect(settings.aupSelect).to.equal(!enabled);
                });
            }
        });

        it('returns "Defaults" object', async () => {
            const instance = initMasCommerceService();
            expect(instance.defaults).to.deep.equal(Defaults);
        });

        it('outputs preview mode based on attribute', async () => {
            let el = initMasCommerceService();
            expect(el.isPreview()).to.be.false;
            el = initMasCommerceService({ preview: 'true' });
            expect(el.isPreview()).to.be.true;
            el = initMasCommerceService({ preview: 'on' });
            expect(el.isPreview()).to.be.true;
            el = initMasCommerceService({ preview: true });
            expect(el.isPreview()).to.be.true;
        });

        it('initialises service with milo configured locale', async () => {
            const { settings } = await initMasCommerceService({
                locale: 'en_DZ',
            });
            expect(settings).to.deep.contain({
                country: 'DZ',
                language: 'en',
            });
        });

        it('registers checkout action', async () => {
            const el = initMasCommerceService();
            el.registerCheckoutAction((offers, options, imsPromise) => {
                /* nop for now */
            });
            expect(el.buildCheckoutAction).to.be.not.undefined;
            const nop = await el.buildCheckoutAction([{}], {});
            expect(nop).to.be.null;
            el.registerCheckoutAction((offers, options, imsPromise) => {
                return () => Promise.resolve();
            });
            const action = await el.buildCheckoutAction([{}], {});
            expect(action).to.be.not.undefined;
        });

        it('allows to flush WCS cache', async () => {
            const el = initMasCommerceService();
            expect(el.flushWcsCache).to.be.a('function');
            el.flushWcsCache();
            //TODO: add more assertions
        });

        it('allows to refresh offers', async () => {
            const el = initMasCommerceService();
            expect(el.refreshOffers).to.be.a('function');
            el.refreshOffers();
            //TODO: add more assertions
        });

        it('allows to refresh aem fragments & prices', async () => {
            const el = initMasCommerceService();
            expect(el.refreshFragments).to.be.a('function');
            el.refreshFragments();
            expect(el.flushWcsCache).to.be.a('function');
            el.flushWcsCache();
        });

        describe('property "config"', () => {
            it('generates settings from attributes', async () => {
                const el = await initMasCommerceService({
                    env: 'stage',
                    locale: 'fr_CA',
                    language: 'es',
                    country: 'CA',
                    'checkout-client-id': 'foobar',
                    'checkout-workflow-step': 'stepone',
                    'force-tax-exclusive': true,
                    'wcs-api-key': 'wcsTest',
                });
                expect(el.settings).to.deep.contains({
                    locale: 'fr_CA',
                    masIOUrl: 'https://www.stage.adobe.com/mas/io',
                    language: 'es',
                    country: 'CA',
                    env: 'STAGE',
                    checkoutClientId: 'foobar',
                    checkoutWorkflowStep: 'email', // rejects invalid value
                    forceTaxExclusive: true,
                    wcsApiKey: 'wcsTest',
                });
            });

            it('generates some default with no attributes', async () => {
                const metaDefaultFlag = document.createElement('meta');
                metaDefaultFlag.name = FF_DEFAULTS;
                metaDefaultFlag.content = 'on';
                document.head.appendChild(metaDefaultFlag);

                const el = initMasCommerceService({});
                expect(el.settings).to.deep.equal({
                    aupSelect: false,
                    checkoutClientId: 'adobe_com',
                    checkoutWorkflowStep: 'email',
                    country: 'US',
                    displayOldPrice: true,
                    displayPerUnit: false,
                    displayRecurrence: true,
                    displayTax: false,
                    displayPlanType: false,
                    entitlement: false,
                    env: 'PRODUCTION',
                    extraOptions: {},
                    forceTaxExclusive: false,
                    landscape: 'PUBLISHED',
                    language: 'en',
                    locale: 'en_US',
                    masIOUrl: 'https://www.adobe.com/mas/io',
                    modal: false,
                    promotionCode: '',
                    quantity: [1],
                    alternativePrice: false,
                    wcsApiKey: 'wcms-commerce-ims-ro-user-milo',
                    wcsURL: 'https://www.adobe.com/web_commerce_artifact',
                });
            });

            it('enables lana with custom tags', async () => {
                const el = await initMasCommerceService({
                    'lana-tags': 'ccd',
                    'lana-sample-rate': '100',
                    env: 'stage',
                });
                el.log.error('test error');
                const [msg, options] = window.lana.log.lastCall.args;
                expect(msg).to.match(/test error¶page=.*$/);
                expect(options).to.deep.equal({
                    clientId: 'merch-at-scale',
                    delimiter: '¶',
                    ignoredProperties: ['analytics', 'literals', 'element'],
                    serializableTypes: ['Array', 'Object'],
                    sampleRate: 100,
                    severity: 'e',
                    tags: 'ccd',
                    isProdDomain: false,
                });
            });
        });

        describe('logFailedRequests', () => {
            let clock;
            let performanceStub;
            let logErrorSpy;
            let performanceMarkStub;
            let performanceMeasureStub;

            beforeEach(() => {
                clock = Sinon.useFakeTimers();
                performanceStub = Sinon.stub(performance, 'getEntriesByType');
                performanceMarkStub = Sinon.stub(performance, 'mark');
                performanceMeasureStub = Sinon.stub(
                    performance,
                    'measure',
                ).returns({
                    duration: 123.45,
                    name: 'mas-commerce-service:ready',
                    entryType: 'measure',
                    startTime: 0,
                });
            });

            afterEach(() => {
                clock.restore();
                performanceStub.restore();
                performanceMarkStub.restore();
                performanceMeasureStub.restore();
                if (logErrorSpy) {
                    logErrorSpy.restore();
                }
            });

            it('should log an error when a failed request matches the regex', async () => {
                const el = initMasCommerceService();
                logErrorSpy = Sinon.spy(el.log, 'error');
                performanceStub.returns([
                    {
                        name: 'https://example.com/api/data',
                        startTime: 100,
                        transferSize: 1024,
                        duration: 50,
                        responseStatus: 200,
                    }, // successful
                    {
                        name: 'https://example.com/fragment?id=123',
                        startTime: 150,
                        transferSize: 0,
                        duration: 0,
                        responseStatus: 0,
                    }, // failed and matches regex
                    {
                        name: 'https://example.com/other/resource',
                        startTime: 200,
                        transferSize: 0,
                        duration: 0,
                        responseStatus: 500,
                    }, // failed but no match
                ]);
                el.lastLoggingTime = 0; // Ensure all entries are processed

                el.logFailedRequests();

                expect(logErrorSpy.calledOnce).to.be.true;
                expect(logErrorSpy.firstCall.args[0]).to.equal(
                    'Failed requests:',
                );
                expect(logErrorSpy.firstCall.args[1].failedUrls).to.deep.equal([
                    'https://example.com/fragment?id=123',
                    'https://example.com/other/resource',
                ]);
            });

            it('should not log an error if no failed requests match the regex', async () => {
                const el = initMasCommerceService();
                logErrorSpy = Sinon.spy(el.log, 'error');
                performanceStub.returns([
                    {
                        name: 'https://example.com/api/data',
                        startTime: 100,
                        transferSize: 1024,
                        duration: 50,
                        responseStatus: 200,
                    }, // successful
                    {
                        name: 'https://example.com/other/resource1',
                        startTime: 200,
                        transferSize: 0,
                        duration: 0,
                        responseStatus: 500,
                    }, // failed, no regex match
                    {
                        name: 'https://example.com/another/resource',
                        startTime: 250,
                        transferSize: 0,
                        duration: 0,
                        responseStatus: 0,
                    }, // failed, no regex match (status < 200)
                ]);
                el.lastLoggingTime = 0; // Ensure all entries are processed

                el.logFailedRequests();

                expect(logErrorSpy.called).to.be.false;
            });

            it('should not log an error if there are no failed requests', async () => {
                const el = initMasCommerceService();
                logErrorSpy = Sinon.spy(el.log, 'error');
                performanceStub.returns([
                    {
                        name: 'https://example.com/api/data',
                        startTime: 100,
                        transferSize: 1024,
                        duration: 50,
                        responseStatus: 200,
                    },
                    {
                        name: 'https://example.com/another/success',
                        startTime: 120,
                        transferSize: 2048,
                        duration: 60,
                        responseStatus: 201,
                    },
                ]);
                el.lastLoggingTime = 0;

                el.logFailedRequests();

                expect(logErrorSpy.called).to.be.false;
            });
        });
    });
});
