import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { loadOfferData } from '../../src/common/utils/item-loading-browser.js';

describe('common/utils/item-loading-browser', () => {
    let sandbox;
    let commerceService;

    const createMockCommerceService = () => {
        const service = document.createElement('mas-commerce-service');
        service.collectPriceOptions = sinon.stub().returns({});
        service.resolveOfferSelectors = sinon.stub().returns([Promise.resolve([{ offerId: 'test-offer-id' }])]);
        document.body.appendChild(service);
        return service;
    };

    const removeMockCommerceService = () => {
        const service = document.querySelector('mas-commerce-service');
        if (service) service.remove();
    };

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        commerceService = createMockCommerceService();
    });

    afterEach(() => {
        sandbox.restore();
        removeMockCommerceService();
    });

    it('returns null when the fragment does not have an OSI field', async () => {
        const offerData = await loadOfferData({
            path: '/content/dam/mas/acom/en_US/cards/card-without-osi',
            fields: [],
        });

        expect(offerData).to.equal(null);
        expect(commerceService.collectPriceOptions.called).to.be.false;
    });

    it('reuses cached data for subsequent calls', async () => {
        const cache = new Map();
        const fragment = {
            path: '/content/dam/mas/acom/en_US/cards/card1',
            fields: [{ name: 'osi', values: ['osi-123'] }],
        };

        const firstResult = await loadOfferData(fragment, { cache });
        const secondResult = await loadOfferData(fragment, { cache });

        expect(firstResult).to.deep.equal({ offerId: 'test-offer-id' });
        expect(secondResult).to.deep.equal({ offerId: 'test-offer-id' });
        expect(commerceService.collectPriceOptions.calledOnce).to.be.true;
        expect(cache.get('osi-123')).to.deep.equal({ offerId: 'test-offer-id' });
    });

    it('returns null and caches the failure when offer loading throws', async () => {
        commerceService.resolveOfferSelectors = sandbox.stub().returns([Promise.reject(new Error('boom'))]);
        const cache = new Map();

        const offerData = await loadOfferData(
            {
                id: 'card-1',
                path: '/content/dam/mas/acom/en_US/cards/card1',
                fields: [{ name: 'osi', values: ['osi-123'] }],
            },
            { cache },
        );

        expect(offerData).to.equal(null);
        expect(cache.has('osi-123')).to.be.true;
        expect(cache.get('osi-123')).to.equal(null);
    });
});
