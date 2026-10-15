import { expect } from '@esm-bundle/chai';
import { applyPlanType, selectOffers, sumOffers } from '../../src/index.js';
import { planTypeCases, selectionCases, summationCases } from '../fixtures/offer-cases.js';

const golden = await fetch(new URL('../fixtures/offers.expected.json', import.meta.url)).then((response) => response.json());
const nodeResults = await fetch('/node-offer-results').then((response) => response.json());
const operations = [
    ['selection', selectionCases, selectOffers],
    ['summation', summationCases, sumOffers],
];

describe('plan normalization Node/browser parity', () => {
    for (const { id, offer, expected } of planTypeCases) {
        it(`matches the legacy and native Node mapping for ${id}`, () => {
            const input = structuredClone(offer);
            const result = applyPlanType(input);
            expect(result).to.deep.equal({ ...offer, planType: expected });
            expect(result).to.deep.equal(nodeResults.planTypes[id].result);
            expect(input).to.deep.equal(offer);
            expect(result).not.to.equal(input);
        });
    }
});

describe('legacy offer golden Node/browser parity', () => {
    for (const [operation, cases, apply] of operations) {
        for (const { id, offers, options } of cases) {
            it(`matches golden and native Node ${operation} result for ${id}`, () => {
                const input = structuredClone(offers);
                const result = apply(input, options);
                const actual = JSON.parse(JSON.stringify({ result, input }));
                expect(actual.result).to.deep.equal(golden[operation][id].result);
                expect(actual.result).to.deep.equal(nodeResults[operation][id].result);
            });
            it(`preserves golden and native Node ${operation} mutation for ${id}`, () => {
                const input = structuredClone(offers);
                apply(input, options);
                expect(input).to.deep.equal(golden[operation][id].input);
                expect(input).to.deep.equal(nodeResults[operation][id].input);
            });
        }
    }
});
