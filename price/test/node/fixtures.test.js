import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { it } from 'node:test';
import { cases, dimensions, parityCases } from '../fixtures/cases.js';
import { messageCases } from '../fixtures/message-cases.js';

const golden = JSON.parse(await readFile(new URL('../fixtures/price-html.expected.json', import.meta.url)));
const parityIds = new Set(parityCases.map(({ id }) => id));

it('uses alternate ICU parameters without changing the default fixture inputs', () => {
    const messages = { text: { '{x}': { en: ['X'] } } };
    const parameters = { text: [{ x: 0, y: undefined }] };
    assert.deepEqual(messageCases(messages, parameters)[0].parameters, { x: 0, y: undefined });
    assert.deepEqual(messageCases(messages)[0].parameters, { g: 'a', x: 'X', y: 'Y' });
});

it('executes every locale-template-offer combination with per-unit display on and off', () => {
    for (const [country, language] of dimensions.locales) {
        for (const segment of ['INDIVIDUAL', 'TEAM']) {
            for (const [template] of dimensions.templates) {
                for (const shape of dimensions.offers) {
                    assert.ok(parityIds.has(`${country}-${language}/${segment}/${template}/${shape}`));
                }
            }
        }
    }
});

it('retains every named edge case in the executed parity corpus', () => {
    for (const { id } of cases.filter(({ id }) => !id.includes('/'))) {
        assert.ok(parityIds.has(id), id);
    }
});

for (const segment of ['STUDENT', 'UNIVERSITY']) {
    it(`retains a focused ${segment} segment-label regression`, () => {
        assert.deepEqual(
            parityCases.filter(({ id }) => id.split('/')[1] === segment).map(({ id }) => id),
            [`US-en/${segment}/default/regular`],
        );
    });
}

it('only omits segment rows whose legacy golden output equals their TEAM representative', () => {
    for (const { id } of cases.filter(({ id }) => !parityIds.has(id))) {
        const [locale, segment, template, shape] = id.split('/');
        assert.ok(['STUDENT', 'UNIVERSITY'].includes(segment), id);
        const representativeId = `${locale}/TEAM/${template}/${shape}`;
        assert.ok(Object.hasOwn(golden.results, id), id);
        assert.ok(Object.hasOwn(golden.results, representativeId), representativeId);
        assert.equal(golden.results[id], golden.results[representativeId], id);
    }
});

it('executes exactly 460 distinct price fixtures without losing the 854-case characterization corpus', () => {
    assert.equal(cases.length, 854);
    assert.equal(parityCases.length, 460);
    assert.equal(parityIds.size, 460);
});
