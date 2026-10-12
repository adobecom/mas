import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';
import { createNodeOfferResults } from '../node-results.js';

const golden = JSON.parse(await readFile(new URL('../fixtures/offers.expected.json', import.meta.url)));
const actual = createNodeOfferResults();

describe('legacy offer golden parity in native Node', () => {
    for (const operation of ['selection', 'summation']) {
        for (const [id, expected] of Object.entries(golden[operation])) {
            it(`matches ${operation} result for ${id}`, () => {
                assert.deepEqual(actual[operation][id].result, expected.result);
            });
            it(`preserves ${operation} input mutation for ${id}`, () => {
                assert.deepEqual(actual[operation][id].input, expected.input);
            });
        }
    }
});
