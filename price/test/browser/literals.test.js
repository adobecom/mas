import { expect } from '@esm-bundle/chai';
import { formatLiteral } from '../../src/price/template.js';
import { messageCases } from '../fixtures/message-cases.js';

const golden = await fetch(new URL('../fixtures/message-format.expected.json', import.meta.url)).then((response) =>
    response.json(),
);

describe('legacy ICU golden literals in the browser', () => {
    for (const { id, message, locale, parameters, expected } of messageCases(golden)) {
        it(`preserves ${id}`, () => {
            const errors = [];
            const actual = formatLiteral({ label: message }, locale, 'label', parameters, {
                error: (...args) => errors.push(args),
            });
            expect(actual).to.equal(expected);
        });
    }
});
