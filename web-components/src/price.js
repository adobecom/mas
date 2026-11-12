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
    function collectPriceOptions(overrides, placeholder = null) {
        let options = {
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
        const {
            displayOldPrice,
            displayPerUnit,
            displayRecurrence,
            displayTax,
            displayPlanType,
            forceTaxExclusive,
            perpetual,
            displayAnnual,
            promotionCode,
            quantity,
            alternativePrice,
            wcsOsi,
            ...rest
        } = Object.assign(options, placeholder?.dataset ?? {}, overrides ?? {});

        const { wcsOsi: alignedWcsOsi, promotionCodes: alignedPromotionCodes } =
            toWcsOsiAndPromotionCodes(wcsOsi, promotionCode);
        const promotionCodes = alignedPromotionCodes.map(toEffectivePromoCode);

        options = omitProperties(
            Object.assign({
                ...options,
                ...rest,
                displayOldPrice: toBoolean(displayOldPrice),
                displayPerUnit: toBoolean(displayPerUnit),
                displayRecurrence: toBoolean(displayRecurrence),
                displayTax: toBoolean(displayTax),
                displayPlanType: toBoolean(displayPlanType),
                forceTaxExclusive: toBoolean(forceTaxExclusive),
                perpetual: toBoolean(perpetual),
                displayAnnual: toBoolean(displayAnnual),
                promotionCode: promotionCodes[0],
                promotionCodes,
                quantity: toQuantity(quantity, Defaults.quantity),
                alternativePrice: toBoolean(alternativePrice),
                wcsOsi: alignedWcsOsi,
            }),
        );

        return options;
    }

    function buildPriceHTML(offers, options) {
        if (!Array.isArray(offers) || !offers.length || !options) {
            return '';
        }
        // Settings supply rendering defaults, but template selection is per price.
        const resolvedOptions = {
            ...settings,
            ...options,
            template: options.template,
            displayAnnual: options.displayAnnual,
            alternativePrice: options.alternativePrice,
            promotionCode: options.promotionCode,
        };
        if (typeof document !== 'undefined' && !resolvedOptions.instant) {
            resolvedOptions.instant =
                new URLSearchParams(document.location.search).get('instant') ??
                undefined;
        }
        return renderPrice(offers, resolvedOptions, { logger: log });
    }

    const createInlinePrice = InlinePrice.createInlinePrice;

    return {
        InlinePrice,
        buildPriceHTML,
        collectPriceOptions,
        createInlinePrice,
    };
}
