import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

import { EVENT_OST_SELECT } from '../../src/constants.js';

describe('onPlaceholderSelect', () => {
    let dispatchEventStub;
    let ostRoot;
    let onPlaceholderSelect;

    before(async () => {
        ostRoot = document.createElement('div');
        ostRoot.id = 'ost';
        document.body.appendChild(ostRoot);
        ({ onPlaceholderSelect } = await import('../../src/rte/ost.js'));
        dispatchEventStub = sinon.stub(ostRoot, 'dispatchEvent');
    });

    beforeEach(() => {
        dispatchEventStub.reset();
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
