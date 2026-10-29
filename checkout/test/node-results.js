import { buildCheckoutUrl } from '../src/buildCheckoutUrl.js';
import { resolveCheckoutData, resolveCheckoutIntent } from '../src/checkout.js';
import { urlCases, offerCases } from './fixtures/cases.js';

export function createCheckoutResults() {
    return {
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
