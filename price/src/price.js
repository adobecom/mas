import {
    price,
    pricePromo,
    priceOptical,
    priceStrikethrough,
    pricePromoStrikethrough,
    priceAnnual,
    priceWithAnnual,
    pricePromoWithAnnual,
    priceAlternative,
    priceOpticalAlternative,
    legal,
} from './price/index.js';
import { discount } from './discount/index.js';

/**
 * Renders already-resolved WCS offers and options, without collecting browser
 * settings or fetching data. Select and sum multi-OSI offers before calling.
 */
export function buildPriceHTML(offers, options, { logger = console } = {}) {
    if (!Array.isArray(offers) || !offers.length || !options) return '';
    let method;
    switch (options.template) {
        case 'discount':
            method = discount;
            break;
        case 'strikethrough':
            method = priceStrikethrough;
            break;
        case 'promo-strikethrough':
            method = pricePromoStrikethrough;
            break;
        case 'annual':
            method = priceAnnual;
            break;
        case 'legal':
            method = legal;
            break;
        default:
            if (options.template === 'optical' && options.alternativePrice) method = priceOpticalAlternative;
            else if (options.template === 'optical') method = priceOptical;
            else if (options.displayAnnual && offers[0].planType === 'ABM') {
                method = options.promotionCode && offers[0].promotion ? pricePromoWithAnnual : priceWithAnnual;
            } else if (options.alternativePrice) method = priceAlternative;
            else method = options.promotionCode && offers[0].promotion ? pricePromo : price;
    }
    const [offer] = offers;
    return method({ ...options, logger }, { ...offer, ...offer.priceDetails });
}
