import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it, mock } from 'node:test';
import { buildPriceHTML } from '../../src/index.js';
import { cases, parityCases, dimensions, instant, baseOffer } from '../fixtures/cases.js';

const golden = JSON.parse(await readFile(new URL('../fixtures/price-html.expected.json', import.meta.url)));
const errors = [];
const runtime = { logger: { error: (...args) => errors.push(args) } };

describe('legacy golden price rendering in Node', () => {
    mock.timers.enable({ apis: ['Date'], now: new Date(instant) });
    for (const { id, offers, options } of parityCases) {
        it(`preserves exact legacy HTML for ${id}`, () => {
            const result = buildPriceHTML(structuredClone(offers), options, runtime);
            assert.equal(result, golden.results[id]);
        });
    }
    it('retains the complete pre-extraction offer-locale-segment-template corpus', () => {
        for (const [country, language] of dimensions.locales) {
            for (const segment of dimensions.segments) {
                for (const [template] of dimensions.templates) {
                    for (const shape of dimensions.offers) {
                        assert.ok(Object.hasOwn(golden.results, `${country}-${language}/${segment}/${template}/${shape}`));
                    }
                }
            }
        }
        assert.deepEqual(
            Object.keys(golden.results),
            cases.map(({ id }) => id),
        );
    });
    for (const offers of [undefined, null, {}, []]) {
        it(`returns empty markup for invalid offers ${JSON.stringify(offers) ?? 'undefined'}`, () => {
            assert.equal(buildPriceHTML(offers, {}), '');
        });
    }
    for (const field of ['country', 'language']) {
        it(`reports a missing required ${field}`, () => {
            const options = { country: 'US', language: 'en' };
            delete options[field];
            assert.throws(() => buildPriceHTML([baseOffer], options), new RegExp(`Argument "${field}" is missing`));
        });
    }
    for (const field of ['formatString', 'price']) {
        it(`reports a missing required offer ${field}`, () => {
            const offer = structuredClone(baseOffer);
            delete offer.priceDetails[field];
            assert.throws(
                () => buildPriceHTML([offer], { country: 'US', language: 'en' }),
                new RegExp(`Argument "${field}" is missing`),
            );
        });
    }
    it('forwards recoverable literal-formatting errors to the caller logger', () => {
        const reported = [];
        buildPriceHTML(
            [baseOffer],
            { country: 'US', language: 'en', literals: { recurrenceLabel: '{broken' } },
            { logger: { error: (...args) => reported.push(args) } },
        );
        assert.equal(reported.length, 1);
        assert.equal(reported[0][0], 'Failed to format literal:');
    });
    it('does not mutate offer or option inputs', () => {
        const offer = structuredClone(baseOffer);
        const options = { country: 'US', language: 'en' };
        const before = structuredClone({ offer, options });
        buildPriceHTML([offer], options);
        assert.deepEqual({ offer, options }, before);
    });
});
