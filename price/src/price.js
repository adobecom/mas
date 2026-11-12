import {
    ALTERNATIVE,
    ANNUAL,
    OPTICAL,
    PROMO_STRIKETHROUGH,
    STRIKETHROUGH,
    renderPrice,
    renderPriceWithAnnual,
    renderPromoPrice,
    renderPromoPriceWithAnnual,
} from './price/template.js';
import { legalTemplate } from './price/legal.js';
import { discount } from './discount/template.js';

/**
 * Renders already-resolved WCS offers and options, without collecting browser
 * settings or fetching data. Select and sum multi-OSI offers before calling.
 */
export function buildPriceHTML(offers, options, { logger = console } = {}) {
    if (!Array.isArray(offers) || !offers.length || !options) return '';
    const [offer] = offers;
    const value = { ...offer, ...offer.priceDetails };
    const { template, alternativePrice } = options;
    switch (template) {
        case 'discount':
            return discount(options, value, logger);
        case 'legal':
            return legalTemplate(options, value, logger);
        case 'strikethrough':
            return renderPrice(options, value, logger, STRIKETHROUGH);
        case 'promo-strikethrough':
            return renderPrice(options, value, logger, PROMO_STRIKETHROUGH);
        case 'annual':
            return renderPrice(options, value, logger, ANNUAL);
        case 'optical':
            return renderPrice(options, value, logger, OPTICAL | (alternativePrice ? ALTERNATIVE : 0));
    }
    const promotion = options.promotionCode && offer.promotion;
    if (options.displayAnnual && offer.planType === 'ABM') {
        return (promotion ? renderPromoPriceWithAnnual : renderPriceWithAnnual)(options, value, logger);
    }
    if (alternativePrice) return renderPrice(options, value, logger, ALTERNATIVE);
    return (promotion ? renderPromoPrice : renderPrice)(options, value, logger);
}
