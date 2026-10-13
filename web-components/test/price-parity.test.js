import { expect, sinon } from './utilities.js';
import { Price } from '../src/price.js';
import { cases, instant } from '../../price/test/fixtures/cases.js';
import golden from '../../price/test/fixtures/price-html.expected.json' with { type: 'json' };
const nodeResults = await fetch('/node-price-results').then((response) =>
    response.json(),
);

describe('browser service golden Node parity', () => {
    let clock;
    let service;

    before(() => {
        clock = sinon.useFakeTimers({
            now: new Date(instant),
            toFake: ['Date'],
        });
        service = Price({
            settings: { country: 'US', language: 'en' },
            literals: { price: {} },
        });
    });

    after(() => {
        clock.restore();
    });

    for (const { id, offers, options } of cases) {
        it(`matches original golden and native Node markup for ${id}`, () => {
            const actual = service.buildPriceHTML(
                structuredClone(offers),
                structuredClone(options),
            );
            expect(actual).to.equal(golden.results[id]);
            expect(actual).to.equal(nodeResults[id]);
        });
    }
});
