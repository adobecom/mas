import { mock } from 'node:test';
import { buildPriceHTML, selectOffers, sumOffers } from '../src/index.js';
import { parityCases, instant } from './fixtures/cases.js';
import { selectionCases, summationCases } from './fixtures/offer-cases.js';

export function createNodeResults(fixtures = parityCases) {
    mock.timers.enable({ apis: ['Date'], now: new Date(instant) });
    try {
        return Object.fromEntries(
            fixtures.map(({ id, offers, options }) => [
                id,
                buildPriceHTML(structuredClone(offers), options, {
                    logger: { error: () => {} },
                }),
            ]),
        );
    } finally {
        mock.timers.reset();
    }
}

export function createNodeOfferResults() {
    return JSON.parse(
        JSON.stringify({
            selection: Object.fromEntries(
                selectionCases.map(({ id, offers, options }) => {
                    const input = structuredClone(offers);
                    const result = selectOffers(input, options);
                    return [id, { result, input }];
                }),
            ),
            summation: Object.fromEntries(
                summationCases.map(({ id, offers }) => {
                    const input = structuredClone(offers);
                    const result = sumOffers(input);
                    return [id, { result, input }];
                }),
            ),
        }),
    );
}
