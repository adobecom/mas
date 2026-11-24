import assert from 'node:assert/strict';
import { it } from 'node:test';
import { createNodeResults, createNodeOfferResults } from '../node-results.js';
import { parityCases as cases } from '../fixtures/cases.js';
import { selectionCases, summationCases } from '../fixtures/offer-cases.js';

it('serves native Node results for every executed parity fixture ID', () => {
    const results = createNodeResults();
    assert.deepEqual(
        Object.keys(results),
        cases.map(({ id }) => id),
    );
});

it('does not accept a differing actual result as golden parity', () => {
    const results = createNodeResults();
    const changed = structuredClone(cases[0]);
    changed.offers[0].priceDetails.price += 1;
    const actual = createNodeResults([changed]);
    assert.throws(() => assert.equal(actual[changed.id], results[changed.id]));
});

it('serves native Node selection results for every offer fixture', () => {
    assert.deepEqual(
        Object.keys(createNodeOfferResults().selection),
        selectionCases.map(({ id }) => id),
    );
});

it('serves native Node bundle results for every offer fixture', () => {
    assert.deepEqual(
        Object.keys(createNodeOfferResults().summation),
        summationCases.map(({ id }) => id),
    );
});
