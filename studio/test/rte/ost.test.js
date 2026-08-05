import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import '../../../web-components/dist/mas.js';

import { EVENT_OST_SELECT } from '../../src/constants.js';
import Store from '../../src/store.js';

describe('onPlaceholderSelect', () => {
    let dispatchEventStub;
    let ostRoot;
    let onPlaceholderSelect;

    before(async () => {
        // Create and configure mas-commerce-service
        const masCommerceService = document.createElement('mas-commerce-service');
        masCommerceService.setAttribute('data-mas-ff-defaults', 'off');
        masCommerceService.setAttribute('env', 'stage');
        document.head.appendChild(masCommerceService);

        // Manually ensure settings and featureFlags are available for tests
        // In a test environment, the service may not fully initialize asynchronously
        if (!masCommerceService.settings) {
            Object.defineProperty(masCommerceService, 'settings', {
                value: {
                    displayOldPrice: false,
                    displayPerUnit: false,
                    displayPlanType: false,
                    displayRecurrence: false,
                    displayTax: false,
                    isPerpetual: false,
                    checkoutWorkflowStep: undefined,
                },
                writable: true,
                configurable: true,
            });
        }

        if (!masCommerceService.featureFlags) {
            Object.defineProperty(masCommerceService, 'featureFlags', {
                value: {
                    'mas-ff-defaults': false,
                },
                writable: true,
                configurable: true,
            });
        }

        ostRoot = document.createElement('div');
        ostRoot.id = 'ost';
        document.body.appendChild(ostRoot);
        ({ onPlaceholderSelect } = await import('../../src/rte/ost.js'));
        dispatchEventStub = sinon.stub(ostRoot, 'dispatchEvent');
    });

    beforeEach(() => {
        dispatchEventStub.reset();
        Store.search.set({});
    });

    it('should dispatch an event with correct attributes for price', () => {
        const offerSelectorId = 'test-id';
        const type = 'price';
        const offer = {};
        const options = {
            displayOldPrice: false,
        };
        const promoOverride = 'PROMO123';

        onPlaceholderSelect(offerSelectorId, type, offer, options, promoOverride);

        const expectedAttributes = {
            'data-display-old-price': false,
            'data-wcs-osi': offerSelectorId,
            'data-template': type,
            is: 'inline-price',
            'data-promotion-code': promoOverride,
        };

        expect(dispatchEventStub.calledOnce).to.be.true;
        const event = dispatchEventStub.getCall(0).args[0];
        expect(event.type).to.equal(EVENT_OST_SELECT);
        expect(event.detail).to.deep.equal(expectedAttributes);
    });

    it('should prefer promoOverride over a stale storedPromoOverride option', () => {
        const options = {
            storedPromoOverride: 'OLDPROMO',
        };

        onPlaceholderSelect('test-id', 'price', {}, options, 'NEWPROMO');

        const event = dispatchEventStub.getCall(0).args[0];
        expect(event.detail['data-promotion-code']).to.equal('NEWPROMO');
    });

    it('should remove data-promotion-code when promoOverride is empty', () => {
        const options = {
            storedPromoOverride: 'OLDPROMO',
        };

        onPlaceholderSelect('test-id', 'price', {}, options, '');

        const event = dispatchEventStub.getCall(0).args[0];
        expect(event.detail).to.not.have.property('data-promotion-code');
    });

    it('should dispatch an event with correct attributes for legal', () => {
        const offerSelectorId = 'test-id';
        const type = 'legal';
        const offer = {};
        const options = {
            displayPerUnit: true,
        };

        onPlaceholderSelect(offerSelectorId, type, offer, options);

        const expectedAttributes = {
            'data-wcs-osi': offerSelectorId,
            'data-template': type,
            'data-display-per-unit': true,
            is: 'inline-price',
        };

        expect(dispatchEventStub.calledOnce).to.be.true;
        const event = dispatchEventStub.getCall(0).args[0];
        expect(event.type).to.equal(EVENT_OST_SELECT);
        expect(event.detail).to.deep.equal(expectedAttributes);
    });

    it('should dispatch an event with correct attributes for checkout link', () => {
        const offerSelectorId = 'test-id';
        const type = 'checkoutUrl';
        const offer = {};
        const options = {
            modal: 'twp',
            entitlement: true,
            upgrade: true,
            ctaText: 'buy-now',
        };
        const promoOverride = null;

        onPlaceholderSelect(offerSelectorId, type, offer, options, promoOverride);

        const expectedAttributes = {
            'data-wcs-osi': offerSelectorId,
            'data-template': type,
            is: 'checkout-link',
            text: 'Buy now',
            'data-analytics-id': 'buy-now',
            'data-modal': 'twp',
            'data-entitlement': true,
            'data-upgrade': true,
        };

        expect(dispatchEventStub.calledOnce).to.be.true;
        const event = dispatchEventStub.getCall(0).args[0];
        expect(event.type).to.equal(EVENT_OST_SELECT);
        expect(event.detail).to.deep.equal(expectedAttributes);
    });

    ['acom-cc', 'acom-dc', 'express'].forEach((path) => {
        it(`should dispatch checkout link with placeholder text on ${path}`, () => {
            Store.search.set({ path });
            const offerSelectorId = 'test-id';
            const type = 'checkoutUrl';
            const offer = {};
            const options = {
                modal: 'twp',
                entitlement: true,
                upgrade: true,
                ctaText: 'buy-now',
            };

            onPlaceholderSelect(offerSelectorId, type, offer, options, null);

            expect(dispatchEventStub.calledOnce).to.be.true;
            const event = dispatchEventStub.getCall(0).args[0];
            expect(event.detail.text).to.equal('{{buy-now}}');
            expect(event.detail['data-analytics-id']).to.equal('buy-now');
        });
    });

    it('should not include promo code if not provided for price', () => {
        const offerSelectorId = 'test-id';
        const type = 'price';
        const offer = {};
        const options = {};
        const promoOverride = null;

        onPlaceholderSelect(offerSelectorId, type, offer, options, promoOverride);

        const expectedAttributes = {
            'data-wcs-osi': offerSelectorId,
            'data-template': type,
            is: 'inline-price',
        };

        expect(dispatchEventStub.calledOnce).to.be.true;
        const event = dispatchEventStub.getCall(0).args[0];
        expect(event.type).to.equal(EVENT_OST_SELECT);
        expect(event.detail).to.deep.equal(expectedAttributes);
    });
});

describe('onPlaceholderSelect with mas-ff-defaults on', () => {
    let dispatchEventStub;
    let onPlaceholderSelect;
    let masCommerceService;
    let resolvePriceTaxFlagsStub;

    before(async () => {
        masCommerceService = document.querySelector('mas-commerce-service');
        masCommerceService.featureFlags['mas-ff-defaults'] = true;
        resolvePriceTaxFlagsStub = sinon.stub(masCommerceService, 'resolvePriceTaxFlags').resolves({});

        ({ onPlaceholderSelect } = await import('../../src/rte/ost.js'));
        dispatchEventStub = document.getElementById('ost').dispatchEvent;
    });

    after(() => {
        masCommerceService.featureFlags['mas-ff-defaults'] = false;
        resolvePriceTaxFlagsStub.restore();
    });

    beforeEach(() => {
        dispatchEventStub.reset();
        resolvePriceTaxFlagsStub.resetHistory();
        Store.search.set({});
    });

    it('does not throw when offer.market_segments is undefined', async () => {
        const offer = { customer_segment: 'INDIVIDUAL' };

        await onPlaceholderSelect('test-id', 'price', offer, {}, null);

        expect(dispatchEventStub.calledOnce).to.be.true;
        expect(resolvePriceTaxFlagsStub.getCall(0).args[3]).to.equal(undefined);
    });

    it('passes the first market segment when present', async () => {
        const offer = { customer_segment: 'TEAM', market_segments: ['COM', 'EDU'] };

        await onPlaceholderSelect('test-id', 'price', offer, {}, null);

        expect(resolvePriceTaxFlagsStub.getCall(0).args[3]).to.equal('COM');
    });
});

describe('openOfferSelectorTool deep-link type parameter', () => {
    let openOfferSelectorTool;
    let openOstStub;
    let originalWindowOst;
    let originalLocalStorage;

    before(async () => {
        ({ openOfferSelectorTool } = await import('../../src/rte/ost.js'));
    });

    beforeEach(() => {
        openOstStub = sinon.stub().returns(() => {});
        originalWindowOst = window.ost;
        window.ost = { openOfferSelectorTool: openOstStub };
        originalLocalStorage = localStorage.getItem('masAccessToken');
        localStorage.setItem('masAccessToken', 'test-token');
    });

    afterEach(() => {
        window.ost = originalWindowOst;
        if (originalLocalStorage === null) {
            localStorage.removeItem('masAccessToken');
        } else {
            localStorage.setItem('masAccessToken', originalLocalStorage);
        }
    });

    function getSearchParamsFromLastCall() {
        const config = openOstStub.getCall(0).args[0];
        return config.searchParameters;
    }

    it('passes type=price when deep-linking from an inline-price element', () => {
        const inlinePriceEl = {
            isInlinePrice: true,
            innerText: '',
            getAttribute: () => null,
            getAttributeNames: () => [],
        };
        openOfferSelectorTool(null, inlinePriceEl);
        expect(openOstStub.calledOnce).to.be.true;
        expect(getSearchParamsFromLastCall().get('type')).to.equal('price');
    });

    it('passes type=checkoutUrl when deep-linking from a checkout-link element', () => {
        const checkoutLinkEl = {
            isInlinePrice: false,
            innerText: 'Buy now',
            getAttribute: () => null,
            getAttributeNames: () => [],
        };
        openOfferSelectorTool(null, checkoutLinkEl);
        expect(openOstStub.calledOnce).to.be.true;
        expect(getSearchParamsFromLastCall().get('type')).to.equal('checkoutUrl');
    });

    function elementWith(attrs) {
        return {
            isInlinePrice: true,
            innerText: '',
            getAttribute: (key) => attrs[key] ?? null,
            getAttributeNames: () => Object.keys(attrs),
        };
    }

    it('opens a multi-OSI non-discount placeholder in bundle mode with all OSIs', () => {
        openOfferSelectorTool(null, elementWith({ 'data-wcs-osi': 'osi-a,osi-b,osi-c' }));
        const config = openOstStub.getCall(0).args[0];
        expect(config.bundleOsis).to.deep.equal(['osi-a', 'osi-b', 'osi-c']);
        expect(config.authoringFlow).to.equal('bundle');
        expect(config.searchOfferSelectorId).to.be.undefined;
    });

    it('treats a multi-OSI discount placeholder as a single offer plus reference, not a bundle', () => {
        openOfferSelectorTool(null, elementWith({ 'data-wcs-osi': 'osi-base,osi-ref', 'data-template': 'discount' }));
        const config = openOstStub.getCall(0).args[0];
        expect(config.bundleOsis).to.be.undefined;
        expect(config.authoringFlow).to.be.undefined;
        expect(config.searchOfferSelectorId).to.equal('osi-base');
        expect(config.initialReferenceOsi).to.equal('osi-ref');
    });

    it('passes language and country from authoring locale for en_EG regional variation', () => {
        const localeOrRegionStub = sinon.stub(Store, 'localeOrRegion').returns('en_EG');
        const masCommerceService = document.querySelector('mas-commerce-service');
        masCommerceService.settings.country = 'SA';
        masCommerceService.settings.language = 'ar';

        openOfferSelectorTool(null, null);

        expect(openOstStub.calledOnce).to.be.true;
        const config = openOstStub.getCall(0).args[0];
        expect(config.language).to.equal('en');
        expect(config.country).to.equal('EG');

        localeOrRegionStub.restore();
    });
});

describe('closeOfferSelectorTool', () => {
    let closeOfferSelectorTool;
    let openOfferSelectorTool;
    let masStudio;
    let renderCommerceServiceStub;
    let querySelectorStub;
    let originalWindowOst;
    let originalLocalStorage;

    before(async () => {
        ({ closeOfferSelectorTool, openOfferSelectorTool } = await import('../../src/rte/ost.js'));
    });

    beforeEach(() => {
        renderCommerceServiceStub = sinon.stub();
        masStudio = { renderCommerceService: renderCommerceServiceStub };

        querySelectorStub = sinon.stub(document, 'querySelector');
        querySelectorStub.withArgs('mas-studio').returns(masStudio);
        querySelectorStub.callThrough();

        originalWindowOst = window.ost;
        window.ost = { openOfferSelectorTool: sinon.stub().returns(() => {}) };
        originalLocalStorage = localStorage.getItem('masAccessToken');
        localStorage.setItem('masAccessToken', 'test-token');
    });

    afterEach(() => {
        querySelectorStub.restore();
        window.ost = originalWindowOst;
        if (originalLocalStorage === null) {
            localStorage.removeItem('masAccessToken');
        } else {
            localStorage.setItem('masAccessToken', originalLocalStorage);
        }
    });

    it('calls renderCommerceService when an OST session was open', () => {
        openOfferSelectorTool(null, null);
        closeOfferSelectorTool();

        expect(renderCommerceServiceStub.calledOnce).to.be.true;
    });

    it('does nothing when no OST session is open', () => {
        closeOfferSelectorTool();

        expect(renderCommerceServiceStub.notCalled).to.be.true;
    });

    it('does not call renderCommerceService when mas-studio is not present', () => {
        querySelectorStub.withArgs('mas-studio').returns(null);

        openOfferSelectorTool(null, null);
        closeOfferSelectorTool();

        expect(renderCommerceServiceStub.notCalled).to.be.true;
    });
});
