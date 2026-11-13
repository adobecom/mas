import { buildCheckoutUrl } from '../src/buildCheckoutUrl.js';
import { resolveCheckoutData, resolveCheckoutIntent } from '../src/checkout.js';
import { urlCases, offerCases } from './fixtures/cases.js';
import { checkoutDecisionsV1 } from '../src/decisions.js';
import { decisionCases } from './fixtures/decisions.js';

export function createCheckoutResults() {
    return {
        decisions: Object.fromEntries(
            decisionCases.map(({ id, decision, input }) => [id, { result: checkoutDecisionsV1[decision](input) }]),
        ),
        urls: Object.fromEntries(urlCases.map(({ id, data, pageContext }) => [id, buildCheckoutUrl(data, pageContext)])),
        offers: Object.fromEntries(
            offerCases.map(({ id, offers, options }) => [
                id,
                {
                    url: buildCheckoutUrl(resolveCheckoutData(offers, options, { landscape: 'published' })),
                    intent: resolveCheckoutIntent(offers[0]),
                },
            ]),
        ),
    };
}
