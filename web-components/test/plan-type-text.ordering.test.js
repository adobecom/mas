import { expect } from '@open-wc/testing';
import { planTypeTextOptionsProvider } from '../src/plan-type-text.js';
import { priceOptionsProvider as masFieldPriceOptionsProvider } from '../src/mas-field.js';
import { Price } from '../src/price.js';

before(async () => {
    await customElements.whenDefined('mas-field');
});

afterEach(() => {
    document.body.querySelectorAll('mas-field').forEach((el) => el.remove());
});

function markerInField() {
    const masField = document.createElement('mas-field');
    const fragment = document.createElement('aem-fragment');
    Object.defineProperty(fragment, 'data', {
        configurable: true,
        value: { settings: { displayPlanType: false } },
    });
    const price = document.createElement('span');
    price.setAttribute('is', 'inline-price');
    price.dataset.template = 'price';
    price.dataset.wcsOsi = 'ABC';
    const marker = document.createElement('span');
    marker.setAttribute('is', 'inline-price');
    marker.dataset.template = 'legal';
    marker.dataset.placeholder = 'plan-type-text';
    marker.dataset.displayPlanType = 'true';
    masField.append(fragment, price, marker);
    document.body.append(masField);
    return marker;
}

describe('plan-type-text displayPlanType survives provider order (MWPW-206315)', () => {
    it('keeps displayPlanType=true even when the host price provider runs after the plan-type provider', () => {
        const marker = markerInField();
        const { collectPriceOptions } = Price({
            literals: { price: {} },
            providers: {
                price: [
                    planTypeTextOptionsProvider,
                    masFieldPriceOptionsProvider,
                ],
            },
            settings: { country: 'US', language: 'en', locale: 'en_US' },
        });
        const options = collectPriceOptions({}, marker);
        expect(options.displayPlanType).to.equal(true);
    });
});
