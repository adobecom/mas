// Public surface of dist/commerce.js that Milo, Studio and merch-card rely on.
// Keep this file green across refactors; change it only for intended API changes.
import * as commerce from '../src/commerce.js';
import { mockFetch } from './mocks/fetch.js';
import { mockIms, unmockIms } from './mocks/ims.js';
import { withWcs } from './mocks/wcs.js';
import {
    expect,
    initMasCommerceService,
    removeMasCommerceService,
} from './utilities.js';

const ELEMENTS = {
    'mas-commerce-service': {
        observed: ['aup-select'],
    },
    'checkout-link': {
        extends: 'a',
        observed: [
            'data-checkout-workflow',
            'data-checkout-workflow-step',
            'data-extra-options',
            'data-ims-country',
            'data-perpetual',
            'data-promotion-code',
            'data-quantity',
            'data-template',
            'data-wcs-osi',
            'data-entitlement',
            'data-upgrade',
            'data-modal',
        ],
    },
    'checkout-button': {
        extends: 'button',
        observed: ['data-wcs-osi', 'data-checkout-workflow-step'],
    },
    'upt-link': {
        extends: 'a',
        observed: ['data-wcs-osi', 'data-promotion-code', 'data-ims-country'],
    },
    'inline-price': {
        extends: 'span',
        observed: [
            'data-display-old-price',
            'data-display-per-unit',
            'data-display-recurrence',
            'data-display-tax',
            'data-display-plan-type',
            'data-display-annual',
            'data-perpetual',
            'data-promotion-code',
            'data-force-tax-exclusive',
            'data-template',
            'data-wcs-osi',
            'data-quantity',
        ],
    },
    'aem-fragment': {
        observed: [
            'fragment',
            'loading',
            'timeout',
            'author',
            'preview',
            'mask',
            'pzn',
        ],
    },
    'mas-field': {
        observed: ['field'],
    },
};

const SERVICE_METHODS = [
    'buildCheckoutURL',
    'buildPriceHTML',
    'collectCheckoutOptions',
    'collectPriceOptions',
    'createCheckoutLink',
    'createInlinePrice',
    'flushWcsCache',
    'isPreview',
    'prefillWcsCache',
    'refreshFragments',
    'refreshOffers',
    'registerCheckoutAction',
    'resolveOfferSelectors',
    'resolvePriceTaxFlags',
];

describe('commerce.js public contract', () => {
    before(async () => {
        await mockFetch(withWcs);
    });

    beforeEach(async () => {
        await mockIms();
    });

    afterEach(() => {
        removeMasCommerceService();
        unmockIms();
    });

    describe('module exports', () => {
        it('exports the API used by Milo', () => {
            expect(commerce.injectJsonLd).to.be.a('function');
            expect(commerce.resolvePriceTaxFlags).to.be.a('function');
            expect(commerce.applyPlanType).to.be.a('function');
            expect(commerce.Log.module).to.be.a('function');
            expect(commerce.Log.module('contract').error).to.be.a('function');
            expect(commerce.Defaults.checkoutWorkflowStep).to.equal('email');
            expect(commerce.CheckoutWorkflowStep.SEGMENTATION).to.equal(
                'segmentation',
            );
        });

        it('keeps the Log plugin API used by Milo tests', () => {
            const { Log } = commerce;
            const entries = [];
            const log = Log.module('contract');
            Log.reset();
            Log.use({ append: (entry) => entries.push(entry) });
            log.debug('debug after reset');
            log.info('info');
            expect(entries.map(({ message }) => message)).to.deep.equal([
                'debug after reset',
                'info',
            ]);
            Log.use(Log.Plugins.debugFilter);
            log.debug('dropped');
            Log.use(Log.Plugins.quietFilter);
            log.error('dropped');
            expect(entries).to.have.length(2);
            Log.reset();
        });

        it('injects JSON-LD through the lazy satellite', async () => {
            const script = await commerce.injectJsonLd(
                { cardTitle: 'Photoshop', description: 'Edit photos' },
                {
                    analytics: '{"currencyCode":"USD"}',
                    priceDetails: { price: 22.99 },
                    commitment: 'YEAR',
                    term: 'MONTHLY',
                },
                null,
                'https://www.adobe.com/products/photoshop.html',
            );
            expect(script.type).to.equal('application/ld+json');
            script.remove();
        });
    });

    describe('custom elements', () => {
        for (const [name, contract] of Object.entries(ELEMENTS)) {
            it(`defines "${name}"`, () => {
                const Element = customElements.get(name);
                expect(Element, name).to.be.a('function');
                expect(Element.observedAttributes).to.include.members(
                    contract.observed,
                );
                if (!contract.extends) return;
                const el = document.createElement(contract.extends, {
                    is: name,
                });
                expect(el).to.be.instanceOf(Element);
            });
        }
    });

    describe('aem-fragment', () => {
        it('exposes the fragment cache statically and per element', () => {
            const AemFragment = customElements.get('aem-fragment');
            const element = document.createElement('aem-fragment');
            expect(element.cache).to.equal(AemFragment.cache);
            for (const method of [
                'clear',
                'add',
                'has',
                'entries',
                'get',
                'getAsPromise',
                'getFetchInfo',
                'set',
                'remove',
            ]) {
                expect(AemFragment.cache[method], method).to.be.a('function');
            }
            for (const method of [
                'cacheKey',
                'refresh',
                'getFragmentClientUrl',
                'generatePreview',
            ]) {
                expect(element[method], method).to.be.a('function');
            }
            element.setAttribute('fragment', 'id');
            element.setAttribute('pzn', 'segment');
            element.setAttribute('mask', 'story');
            expect(element.cacheKey()).to.equal('id-p_segment-m_story');
        });
    });

    describe('mas-field', () => {
        it('exposes checkReady', () => {
            expect(document.createElement('mas-field').checkReady).to.be.a(
                'function',
            );
        });
    });

    describe('mas-commerce-service', () => {
        it('activates synchronously and announces readiness', () => {
            let detail;
            const listener = (event) => ({ detail } = event);
            document.addEventListener('wcms:commerce:ready', listener);
            const service = initMasCommerceService({ locale: 'fr_FR' });
            document.removeEventListener('wcms:commerce:ready', listener);
            expect(detail).to.equal(service);
            expect(service.settings).to.include({
                country: 'FR',
                language: 'fr',
                locale: 'fr_FR',
            });
        });

        it('exposes the service API', () => {
            const service = initMasCommerceService();
            for (const method of SERVICE_METHODS) {
                expect(service[method], method).to.be.a('function');
            }
            expect(service.Log.module).to.be.a('function');
            expect(service.log.error).to.be.a('function');
            expect(service.defaults).to.equal(commerce.Defaults);
            expect(service.featureFlags).to.have.keys(
                'mas-ff-defaults',
                'mas-ff-annual-price',
            );
            expect(service.duration).to.have.key(
                'mas-commerce-service:measure',
            );
            expect(service.imsSignedInPromise).to.be.instanceOf(Promise);
            expect(service.imsCountryPromise).to.be.instanceOf(Promise);
        });

        it('does not expose the constants module', () => {
            const service = initMasCommerceService();
            for (const name of [
                'EVENT_TYPE_READY',
                'SELECTOR_MAS_ELEMENT',
                'TAG_NAME_SERVICE',
                'Env',
                'Landscape',
                'WCS_PROD_URL',
            ]) {
                expect(service[name], name).to.be.undefined;
            }
        });

        it('keeps the IMS promises stable and replaceable', () => {
            const service = initMasCommerceService();
            const signedIn = service.imsSignedInPromise;
            expect(service.imsSignedInPromise).to.equal(signedIn);
            const country = Promise.resolve('CH');
            service.imsCountryPromise = country;
            expect(service.imsCountryPromise).to.equal(country);
        });

        it('keeps settings writable', () => {
            const service = initMasCommerceService();
            service.settings.landscape = 'DRAFT';
            expect(service.settings.landscape).to.equal('DRAFT');
        });

        it('registers and removes option providers', () => {
            const service = initMasCommerceService();
            const provider = () => {};
            for (const type of ['price', 'checkout']) {
                const unregister = service.providers[type](provider);
                expect(service.providers.has(provider)).to.be.true;
                unregister();
                expect(service.providers.has(provider)).to.be.false;
            }
        });

        it('resolves offers as one promise per OSI', async () => {
            const service = initMasCommerceService();
            const promises = service.resolveOfferSelectors({
                country: 'US',
                language: 'en',
                wcsOsi: ['abm', 'puf'],
            });
            expect(promises).to.have.length(2);
            const [abm] = await Promise.all(promises);
            expect(abm[0].offerSelectorIds).to.include('abm');
        });

        it('resolves tax flags asynchronously', async () => {
            const service = initMasCommerceService();
            const flags = service.resolvePriceTaxFlags(
                'US',
                null,
                'INDIVIDUAL',
                'COM',
            );
            expect(flags).to.be.instanceOf(Promise);
            expect(await flags).to.have.keys('displayTax', 'forceTaxExclusive');
        });

        it('creates prices and checkout links', () => {
            const service = initMasCommerceService();
            const price = service.createInlinePrice({ wcsOsi: 'abm' });
            expect(price.getAttribute('is')).to.equal('inline-price');
            expect(price.dataset.wcsOsi).to.equal('abm');
            const link = service.createCheckoutLink({ wcsOsi: 'abm' }, 'Buy');
            expect(link.getAttribute('is')).to.equal('checkout-link');
            expect(link.dataset.wcsOsi).to.equal('abm');
            expect(link.textContent).to.equal('Buy');
        });

        it('builds checkout URLs and price markup', async () => {
            const service = initMasCommerceService();
            const [offers] = await Promise.all(
                service.resolveOfferSelectors({
                    country: 'US',
                    language: 'en',
                    wcsOsi: ['abm'],
                }),
            );
            const url = service.buildCheckoutURL(
                offers,
                service.collectCheckoutOptions({ wcsOsi: 'abm' }),
            );
            expect(url).to.match(/^https:\/\/commerce\.adobe\.com\/store\//);
            const html = service.buildPriceHTML(
                offers,
                service.collectPriceOptions({ wcsOsi: 'abm' }),
            );
            expect(html).to.contain('price-currency-symbol');
        });

        it('wraps the registered checkout action', async () => {
            const service = initMasCommerceService();
            const action = { url: 'https://example.com' };
            service.registerCheckoutAction(
                (offers, options, imsSignedInPromise, el) => {
                    expect(imsSignedInPromise).to.be.instanceOf(Promise);
                    return el ? action : null;
                },
            );
            expect(await service.buildCheckoutAction([{}], {}, {})).to.equal(
                action,
            );
            expect(await service.buildCheckoutAction([{}], {})).to.be.null;
        });
    });

    describe('checkout elements', () => {
        it('are created by their factories only with a service', () => {
            const CheckoutLink = customElements.get('checkout-link');
            const CheckoutButton = customElements.get('checkout-button');
            expect(CheckoutLink.createCheckoutLink({ wcsOsi: 'abm' })).to.be
                .null;
            expect(CheckoutButton.createCheckoutButton({ wcsOsi: 'abm' })).to.be
                .null;
            initMasCommerceService();
            const link = CheckoutLink.createCheckoutLink(
                {
                    wcsOsi: 'abm',
                    promotionCode: 'cancel-context',
                    analyticsId: 'buy-now',
                },
                'Buy',
            );
            expect(link.dataset).to.include({
                wcsOsi: 'abm',
                promotionCode: 'cancel-context',
                analyticsId: 'buy-now',
            });
            expect(link.isCheckoutLink).to.be.true;
            const button = CheckoutButton.createCheckoutButton({
                wcsOsi: 'abm',
            });
            expect(button.isCheckoutButton).to.be.true;
            for (const element of [link, button]) {
                for (const method of [
                    'onceSettled',
                    'renderOffers',
                    'requestUpdate',
                    'updateOptions',
                ]) {
                    expect(element[method], method).to.be.a('function');
                }
            }
        });

        it('renders checkout URLs into href and data-href', async () => {
            initMasCommerceService();
            const link = commerce.getService().createCheckoutLink({
                wcsOsi: 'abm',
            });
            const button = customElements
                .get('checkout-button')
                .createCheckoutButton({ wcsOsi: 'abm' });
            document.body.append(link, button);
            await Promise.all([link.onceSettled(), button.onceSettled()]);
            const url =
                'https://commerce.adobe.com/store/email?items%5B0%5D%5Bid%5D=632B3ADD940A7FBB7864AA5AD19B8D28&cli=adobe_com&ctx=fp&co=US&lang=en';
            expect(link.getAttribute('href')).to.equal(url);
            expect(button.getAttribute('data-href')).to.equal(url);
            expect(link.checkoutUrl).to.equal(url);
            expect(link.value[0].offerId).to.equal(
                '632B3ADD940A7FBB7864AA5AD19B8D28',
            );
            expect(link.marketSegment).to.equal('COM');
            expect(link.customerSegment).to.equal('INDIVIDUAL');
            link.remove();
            button.remove();
        });

        it('creates promo terms links from placeholders', () => {
            const placeholder = document.createElement('a');
            placeholder.className = 'upt-link secondary-link';
            placeholder.innerHTML = 'See terms';
            const uptLink = customElements
                .get('upt-link')
                .createFrom(placeholder);
            expect(uptLink.getAttribute('is')).to.equal('upt-link');
            expect(uptLink.className).to.equal('secondary-link');
            expect(uptLink.isUptLink).to.be.true;
            expect(uptLink.initializeWcsData).to.be.a('function');
        });
    });
});
