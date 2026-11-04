import { expect } from '@esm-bundle/chai';
import { buildPriceHTML, selectOffers, sumOffers } from '../../src/index.js';
import { parityCases as cases, instant, baseOffer } from '../fixtures/cases.js';

const golden = await fetch(new URL('../fixtures/price-html.expected.json', import.meta.url)).then((response) =>
    response.json(),
);
const nodeResults = await fetch('/node-price-results').then((response) => response.json());
const NativeDate = globalThis.Date;
const errors = [];

before(() => {
    globalThis.Date = class extends NativeDate {
        constructor(...args) {
            super(...(args.length ? args : [instant]));
        }
        static now() {
            return NativeDate.parse(instant);
        }
    };
});
after(() => {
    globalThis.Date = NativeDate;
});

describe('standalone golden Node/browser parity', () => {
    for (const { id, offers, options } of cases) {
        it(`matches golden and native Node HTML for ${id}`, () => {
            const actual = buildPriceHTML(structuredClone(offers), options, {
                logger: { error: (...args) => errors.push(args) },
            });
            expect(actual).to.equal(golden.results[id]);
            expect(actual).to.equal(nodeResults[id]);
        });
    }
    it('selects the GB offer using the same native ESM export', () => {
        const offers = [{ language: 'MULT' }, { language: 'EN' }];
        expect(selectOffers(offers, { country: 'GB' })[0].language).to.equal('EN');
    });
    it('sums a bundle using the same native ESM export', () => {
        expect(sumOffers([baseOffer, baseOffer]).priceDetails.price).to.equal(59.98);
    });
});
