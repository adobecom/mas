import { isPositiveFiniteNumber } from '../helpers.js';
import { formatLiteral, toLocale } from '../price/template.js';

const getDiscount = (price, priceWithoutDiscount) => {
    if (!priceWithoutDiscount && isPositiveFiniteNumber(price)) return 0;
    if (!isPositiveFiniteNumber(price) || !isPositiveFiniteNumber(priceWithoutDiscount)) return;
    return Math.floor(((priceWithoutDiscount - price) / priceWithoutDiscount) * 100);
};

/**
 * Renders the discount markup. The `discountLabel` literal decides the
 * locale's notation, so a new market's format is a content change. It
 * receives `discount` (percent off) and `remainingPercent` (100 - discount),
 * and can scale and round them with a number skeleton, e.g.
 * `{remainingPercent, number, ::scale/0.1 .#}折` renders "3.5折" for 65% off.
 */
export function discount({ country, language, literals = {} }, { price, priceWithoutDiscount }, logger = console) {
    const discount = getDiscount(price, priceWithoutDiscount);
    if (discount === undefined) return '<span class="no-discount"></span>';
    const locale = language && country ? toLocale(language, country) : 'en-US';
    const parameters = { discount, remainingPercent: 100 - discount };
    return `<span class="discount">${formatLiteral(literals, locale, 'discountLabel', parameters, logger)}</span>`;
}
