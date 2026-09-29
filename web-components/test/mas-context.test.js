import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { registerContextOptionsProviders } from '../src/mas-context.js';
import { planTypeTextOptionsProvider } from '../src/plan-type-text.js';

function makeService({ priceRegistered = [], checkoutRegistered = [] } = {}) {
    const price = new Set(priceRegistered);
    const checkout = new Set(checkoutRegistered);
    return {
        providers: {
            price: sinon.spy((fn) => price.add(fn)),
            checkout: sinon.spy((fn) => checkout.add(fn)),
            has: (fn) => price.has(fn) || checkout.has(fn),
        },
    };
}

describe('mas-context - registerContextOptionsProviders', () => {
    let priceProvider, checkoutProvider;

    beforeEach(() => {
        priceProvider = () => {};
        checkoutProvider = () => {};
    });

    it('does nothing when service is missing', () => {
        expect(() =>
            registerContextOptionsProviders(
                null,
                priceProvider,
                checkoutProvider,
            ),
        ).to.not.throw();
    });

    it('does nothing when service.providers is missing', () => {
        const service = {};
        expect(() =>
            registerContextOptionsProviders(
                service,
                priceProvider,
                checkoutProvider,
            ),
        ).to.not.throw();
    });

    it('does not re-register when the price provider is already registered', () => {
        const service = makeService({ priceRegistered: [priceProvider] });
        registerContextOptionsProviders(
            service,
            priceProvider,
            checkoutProvider,
        );
        expect(service.providers.price.called).to.be.false;
        expect(service.providers.checkout.called).to.be.false;
    });

    it('registers price, checkout, and planTypeTextOptionsProvider when none are registered', () => {
        const service = makeService();
        registerContextOptionsProviders(
            service,
            priceProvider,
            checkoutProvider,
        );
        expect(service.providers.price.calledWith(priceProvider)).to.be.true;
        expect(service.providers.checkout.calledWith(checkoutProvider)).to.be
            .true;
        expect(service.providers.price.calledWith(planTypeTextOptionsProvider))
            .to.be.true;
    });

    it('does not re-register planTypeTextOptionsProvider when it is already registered', () => {
        const service = makeService({
            priceRegistered: [planTypeTextOptionsProvider],
        });
        registerContextOptionsProviders(
            service,
            priceProvider,
            checkoutProvider,
        );
        expect(service.providers.price.calledWith(priceProvider)).to.be.true;
        expect(service.providers.price.calledWith(planTypeTextOptionsProvider))
            .to.be.false;
    });
});
