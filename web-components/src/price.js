import { Defaults } from './defaults.js';
import { buildPriceHTML as renderPrice } from '../../price/src/index.js';

import { createLog } from './log.js';
import { InlinePrice } from './inline-price.js';
import {
    omitProperties,
    toBoolean,
    toEffectivePromoCode,
    toWcsOsiAndPromotionCodes,
    toQuantity,
} from './utilities.js';

const log = createLog('ConsonantTemplates/price');

export function Price({ literals, providers, settings }) {
    // Fallback for prices rendered without an explicit or configured instant.
    const queryInstant =
        new URLSearchParams(globalThis.location?.search).get('instant') ??
        undefined;

    function collectPriceOptions(overrides, placeholder = null) {
        const options = {
            country: settings.country,
            language: settings.language,
            locale: settings.locale,
            literals: { ...literals.price },
        };
        if (placeholder && providers?.price) {
            for (const provider of providers.price) {
                provider(placeholder, options);
            }
        }
        Object.assign(options, placeholder?.dataset, overrides);
        const { wcsOsi, promotionCodes } = toWcsOsiAndPromotionCodes(
            options.wcsOsi,
            options.promotionCode,
        );
        const effectivePromotionCodes =
            promotionCodes.map(toEffectivePromoCode);
        return omitProperties({
            ...options,
            displayOldPrice: toBoolean(options.displayOldPrice),
            displayPerUnit: toBoolean(options.displayPerUnit),
            displayRecurrence: toBoolean(options.displayRecurrence),
            displayTax: toBoolean(options.displayTax),
            displayPlanType: toBoolean(options.displayPlanType),
            forceTaxExclusive: toBoolean(options.forceTaxExclusive),
            perpetual: toBoolean(options.perpetual),
            displayAnnual: toBoolean(options.displayAnnual),
            promotionCode: effectivePromotionCodes[0],
            promotionCodes: effectivePromotionCodes,
            quantity: toQuantity(options.quantity, Defaults.quantity),
            alternativePrice: toBoolean(options.alternativePrice),
            wcsOsi,
        });
    }

    function buildPriceHTML(offers, options) {
        if (!options) return '';
        const { template, displayAnnual, alternativePrice, promotionCode } =
            options;
        // Settings supply rendering defaults, but template selection is per price.
        const resolvedOptions = {
            ...settings,
            ...options,
            template,
            displayAnnual,
            alternativePrice,
            promotionCode,
        };
        resolvedOptions.instant ||= queryInstant;
        return renderPrice(offers, resolvedOptions, { logger: log });
    }

    return {
        InlinePrice,
        buildPriceHTML,
        collectPriceOptions,
        createInlinePrice: InlinePrice.createInlinePrice,
    };
}
