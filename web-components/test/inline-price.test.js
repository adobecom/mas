import {
    ERROR_MESSAGE_OFFER_NOT_FOUND,
    FF_ANNUAL_PRICE,
    FF_DEFAULTS,
} from '../src/constants.js';
import { resolvePriceOffers } from '../src/inline-price.js';
import { expect } from './utilities.js';

const offer = (price, extra = {}) => ({
    customerSegment: 'INDIVIDUAL',
    marketSegments: ['COM'],
    ...extra,
    priceDetails: {
        formatString: "'US$'#,##0.00",
        price,
        ...extra.priceDetails,
    },
});

describe('function "resolvePriceOffers"', () => {
    it('selects the preferred offer of each OSI and sums the OSIs', async () => {
        const [resolved] = await resolvePriceOffers(
            [[offer(9, { term: 'ANNUAL' }), offer(4)], [offer(2)]],
            { country: 'US' },
            {},
        );
        expect(resolved.priceDetails.price).to.equal(6);
    });

    it('throws when an OSI resolves to no offers', async () => {
        await expect(
            resolvePriceOffers([[offer(1)], []], { country: 'US' }, {}),
        ).to.be.rejectedWith(ERROR_MESSAGE_OFFER_NOT_FOUND);
    });

    it('defaults displayOldPrice without FF_DEFAULTS unless it is set', async () => {
        const options = { country: 'US' };
        await resolvePriceOffers([[offer(1)]], options, {});
        expect(options.displayOldPrice).to.be.true;

        const explicit = { country: 'US', displayOldPrice: false };
        await resolvePriceOffers([[offer(1)]], explicit, {
            displayOldPrice: false,
        });
        expect(explicit.displayOldPrice).to.be.false;
    });

    for (const [label, featureFlags, options] of [
        ['feature flags', { [FF_DEFAULTS]: true }, {}],
        ['options', {}, { [FF_DEFAULTS]: true }],
    ]) {
        it(`applies per-unit and tax defaults when FF_DEFAULTS is on via ${label}`, async () => {
            const teamOptions = { country: 'US', language: 'en', ...options };
            await resolvePriceOffers(
                [[offer(1, { customerSegment: 'TEAM' })]],
                teamOptions,
                {},
                featureFlags,
            );
            expect(teamOptions.displayPerUnit).to.be.true;
            expect(teamOptions.displayTax).to.not.be.ok;
            expect(teamOptions.forceTaxExclusive).to.not.be.ok;
            expect(teamOptions).to.not.have.property('displayOldPrice');

            const individualOptions = {
                country: 'US',
                language: 'en',
                ...options,
            };
            await resolvePriceOffers(
                [[offer(1)]],
                individualOptions,
                {},
                featureFlags,
            );
            expect(individualOptions.displayPerUnit).to.be.false;
        });
    }

    it('keeps explicitly set per-unit and tax options under FF_DEFAULTS', async () => {
        const priceOptions = {
            displayPerUnit: false,
            displayTax: true,
            forceTaxExclusive: false,
        };
        const options = { country: 'MU', language: 'en', ...priceOptions };
        await resolvePriceOffers(
            [[offer(1, { customerSegment: 'TEAM' })]],
            options,
            priceOptions,
            { [FF_DEFAULTS]: true },
        );
        expect(options).to.include(priceOptions);
    });

    it('re-selects tax-exclusive offers when the geo defaults force them', async () => {
        const options = { country: 'MU', language: 'en' };
        const [resolved] = await resolvePriceOffers(
            [
                [
                    offer(120, {
                        priceDetails: {
                            priceWithoutTax: 100,
                            taxDisplay: 'TAX_INCLUSIVE_DETAILS',
                        },
                        priceInfo: { price: 'Rs 120' },
                    }),
                ],
            ],
            options,
            {},
            { [FF_DEFAULTS]: true },
        );
        expect(options.displayTax).to.be.true;
        expect(options.forceTaxExclusive).to.be.true;
        expect(resolved.priceDetails.price).to.equal(100);
        expect(resolved.priceInfo).to.be.undefined;
    });

    it('turns on displayAnnual with FF_ANNUAL_PRICE unless it is false', async () => {
        const featureFlags = { [FF_ANNUAL_PRICE]: true };
        const unset = { country: 'US' };
        await resolvePriceOffers([[offer(1)]], unset, {}, featureFlags);
        expect(unset.displayAnnual).to.be.true;

        const disabled = { country: 'US', displayAnnual: false };
        await resolvePriceOffers([[offer(1)]], disabled, {}, featureFlags);
        expect(disabled.displayAnnual).to.be.false;

        const flagOff = { country: 'US' };
        await resolvePriceOffers([[offer(1)]], flagOff, {});
        expect(flagOff).to.not.have.property('displayAnnual');
    });

    it('prices a dual-OSI discount against the reference offer', async () => {
        const [resolved, ...rest] = await resolvePriceOffers(
            [[offer(5, { priceInfo: { price: 'US$5.00' } })], [offer(10)]],
            { country: 'US', template: 'discount' },
            {},
        );
        expect(rest).to.be.empty;
        expect(resolved.priceDetails).to.include({
            price: 5,
            priceWithoutDiscount: 10,
        });
        expect(resolved.priceInfo).to.be.undefined;
    });
});
