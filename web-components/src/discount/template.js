import { isPositiveFiniteNumber } from '@dexter/tacocat-core';
import {
    defaultLiterals,
    formatLiteral,
    literalKeys as templateLiteralKeys,
} from '../price/template.js';

const literalKeys = {
    ...templateLiteralKeys,
    discountLabel: 'discountLabel',
};

const getDiscount = (price, priceWithoutDiscount) => {
    if (!priceWithoutDiscount && isPositiveFiniteNumber(price)) return 0;
    if (
        !isPositiveFiniteNumber(price) ||
        !isPositiveFiniteNumber(priceWithoutDiscount)
    )
        return;
    return Math.floor(
        ((priceWithoutDiscount - price) / priceWithoutDiscount) * 100,
    );
};

/**
 * Renders the discount markup. The displayed text is locale-driven: a
 * `discountLabel` literal decides the format, so a new market's notation is a
 * content change, not a code change. The literal receives `discount` (percent
 * off) and `remainingPercent` (100 - discount) as parameters — subtraction
 * from a constant can't be expressed in ICU MessageFormat, so that one step
 * stays in JS. Everything else, including scaling and decimal precision, can
 * be done in the literal itself via ICU number skeletons, e.g.
 * `{remainingPercent, number, ::scale/0.1 .0}折` renders "3.5折" for a 65%
 * discount straight from `remainingPercent`, with no extra JS-computed value.
 * @param {PriceContext & PromoPriceContext} context
 * @param {PriceData} value
 * @param {PriceAttributes} attributes
 !* @returns {string} the discount markup
 !*/
const createDiscountTemplate = () => (context, value) => {
    const { country, language, literals: contextLiterals = {} } = context ?? {};
    const { price, priceWithoutDiscount } = value;
    const discount = getDiscount(price, priceWithoutDiscount);
    if (discount === undefined) {
        return `<span class="no-discount"></span>`;
    }

    const literals = { ...defaultLiterals, ...contextLiterals };
    const locale =
        language && country
            ? `${language.toLowerCase()}-${country.toUpperCase()}`
            : 'en-US';
    const text = formatLiteral(literals, locale, literalKeys.discountLabel, {
        discount,
        remainingPercent: 100 - discount,
    });
    return `<span class="discount">${text}</span>`;
};

export { getDiscount, createDiscountTemplate };
