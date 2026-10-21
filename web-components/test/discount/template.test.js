import { expect } from '@esm-bundle/chai';
import { discount } from '../../../price/src/discount/index.js';

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
        it(`renders the discount for price=${price} and old price=${priceWithoutDiscount}`, () => {
            expect(discount({}, { price, priceWithoutDiscount })).to.equal(
                expected === undefined
                    ? '<span class="no-discount"></span>'
                    : `<span class="discount">${expected}%</span>`,
            );
        }),
    );

    it('Generates discount markup', () => {
        expect(discount({}, { price: 27, priceWithoutDiscount: 30 })).to.equal(
            '<span class="discount">10%</span>',
        );
    });

    it('shows 0% when price is correct, and the discount is not defined', () => {
        expect(discount({}, { price: 27 })).to.equal(
            '<span class="discount">0%</span>',
        );
    });

    it('shows no discount when price and the discount are not defined', () => {
        expect(discount({}, {})).to.equal('<span class="no-discount"></span>');
    });

    const zhHantDiscountLabel = '{remainingPercent, number, ::scale/0.1 .#}折';

    it('uses a locale-provided discountLabel literal instead of the default %', () => {
        const context = {
            country: 'TW',
            language: 'zh-hant',
            literals: { discountLabel: zhHantDiscountLabel },
        };
        expect(
            discount(context, {
                price: 35,
                priceWithoutDiscount: 100,
            }),
        ).to.equal('<span class="discount">3.5折</span>');
    });

    it('applies the same discountLabel literal across zh-Hant countries', () => {
        const literals = { discountLabel: zhHantDiscountLabel };
        ['TW', 'HK', 'MO'].forEach((country) => {
            expect(
                discount(
                    { country, language: 'zh-hant', literals },
                    { price: 35, priceWithoutDiscount: 100 },
                ),
            ).to.equal('<span class="discount">3.5折</span>');
        });
    });

    it('renders a single-digit decimal 折 via an ICU number skeleton, with no JS-computed tenths value', () => {
        const context = {
            country: 'TW',
            language: 'zh-hant',
            literals: { discountLabel: zhHantDiscountLabel },
        };
        expect(
            discount(context, {
                price: 15,
                priceWithoutDiscount: 100,
            }),
        ).to.equal('<span class="discount">1.5折</span>');
    });

    it('omits a trailing .0 when the remaining percent is an even multiple of ten', () => {
        const context = {
            country: 'TW',
            language: 'zh-hant',
            literals: { discountLabel: zhHantDiscountLabel },
        };
        expect(
            discount(context, {
                price: 30,
                priceWithoutDiscount: 100,
            }),
        ).to.equal('<span class="discount">3折</span>');
    });
});
