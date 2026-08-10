import { expect } from '@esm-bundle/chai';
import {
    getDiscount,
    createDiscountTemplate,
} from '../../src/discount/template.js';

describe('discount template', () => {
    [
        [undefined, undefined, undefined],
        [null, null, undefined],
        ['', '', undefined],
        [50, 100, 50],
        [27, -1, undefined],
        [27, 30, 10],
        [27, 0, 0],
    ].forEach(([price, priceWithoutDiscount, expected]) =>
        it(`For price=${price} and old price=${priceWithoutDiscount} and the discount percentage is${expect}`, () => {
            expect(getDiscount(price, priceWithoutDiscount)).to.equal(expected);
        }),
    );

    it('Generates discount markup', () => {
        expect(
            createDiscountTemplate()(
                {},
                { price: 27, priceWithoutDiscount: 30 },
            ),
        ).to.equal('<span class="discount">10%</span>');
    });

    it('shows 0% when price is correct, and the discount is not defined', () => {
        expect(createDiscountTemplate()({}, { price: 27 })).to.equal(
            '<span class="discount">0%</span>',
        );
    });

    it('shows no discount when price and the discount are not defined', () => {
        expect(createDiscountTemplate()({}, {})).to.equal(
            '<span class="no-discount"></span>',
        );
    });
});
