import { selectOffers, sumOffers } from '../src/utilities.js';

import { expect } from './utilities.js';

describe('function "selectWcsOffers"', () => {
    it('uses offer prices without taxes if "forceTaxExclusive" is set', () => {
        const offers = selectOffers(
            [
                {
                    priceDetails: {
                        price: 2,
                        priceWithoutTax: 1,
                        priceWithoutDiscount: 3,
                        priceWithoutDiscountAndTax: 4,
                        taxDisplay: 'TAX_INCLUSIVE_DETAILS',
                    },
                },
            ],
            { forceTaxExclusive: true },
        );
        expect(offers[0].priceDetails.price).to.equal(1);
        expect(offers[0].priceDetails.priceWithoutDiscount).to.equal(4);
    });

    it('selects MULT language offer over EN when country is not GB', () => {
        const offers = selectOffers(
            [
                { language: 'EN', price: 100 },
                { language: 'MULT', price: 100 },
            ],
            { country: 'US' },
        );
        expect(offers[0].language).to.equal('MULT');
    });

    it('selects EN language offer when country is GB', () => {
        const offers = selectOffers(
            [
                { language: 'MULT', price: 100 },
                { language: 'EN', price: 100 },
            ],
            { country: 'GB' },
        );
        expect(offers[0].language).to.equal('EN');
    });

    it('selects offer without term over offer with term', () => {
        const offers = selectOffers(
            [
                { language: 'MULT', price: 100, term: '12' },
                { language: 'MULT', price: 100 },
            ],
            { country: 'US' },
        );
        expect(offers[0].term).to.be.undefined;
    });

    it('selects MULT language offer even if it has term when other offer is EN with term', () => {
        const offers = selectOffers(
            [
                { language: 'EN', price: 100, term: '12' },
                { language: 'MULT', price: 100, term: '12' },
            ],
            { country: 'US' },
        );
        expect(offers[0].language).to.equal('MULT');
        expect(offers[0].term).to.equal('12');
    });

    it('selects offers without term first, then for GB selects EN offers if present', () => {
        const offers = selectOffers(
            [
                { offerId: '1', language: 'MULT', term: '12' },
                { offerId: '2', language: 'EN', term: '12' },
                { offerId: '3', language: 'MULT' },
                { offerId: '4', language: 'EN' },
            ],
            { country: 'GB' },
        );
        expect(offers[0].offerId).to.equal('4'); // best match - EN, without term
    });

    it('selects offers without term first, then for GB selects MULT offers if EN offer is not present', () => {
        const offers = selectOffers(
            [
                { offerId: '1', language: 'MULT', term: '12' },
                { offerId: '2', language: 'EN', term: '12' },
                { offerId: '3', language: 'MULT' },
            ],
            { country: 'GB' },
        );
        expect(offers[0].offerId).to.equal('3'); // second best match - MULT, without term
    });
});

describe('function "sumOffers"', () => {
    it('returns null for empty array', () => {
        expect(sumOffers([])).to.be.null;
        expect(sumOffers(null)).to.be.null;
        expect(sumOffers(undefined)).to.be.null;
    });

    it('returns single offer unchanged', () => {
        const offer = {
            offerId: '1',
            priceDetails: { price: 10.99 },
            commitment: 'YEAR',
            term: 'MONTHLY',
        };
        const result = sumOffers([offer]);
        expect(result).to.equal(offer);
    });

    it('sums prices from multiple offers', () => {
        const offers = [
            {
                offerId: '1',
                offerSelectorIds: ['osi1'],
                priceDetails: {
                    price: 19.99,
                    priceWithoutTax: 19.99,
                    formatString: "'US$'#,##0.00",
                    usePrecision: true,
                },
                commitment: 'YEAR',
                term: 'MONTHLY',
            },
            {
                offerId: '2',
                offerSelectorIds: ['osi2'],
                priceDetails: {
                    price: 24.99,
                    priceWithoutTax: 24.99,
                    formatString: "'US$'#,##0.00",
                    usePrecision: true,
                },
                commitment: 'YEAR',
                term: 'MONTHLY',
            },
        ];
        const result = sumOffers(offers);
        expect(result.priceDetails.price).to.equal(44.98);
        expect(result.priceDetails.priceWithoutTax).to.equal(44.98);
        expect(result.offerSelectorIds).to.deep.equal(['osi1', 'osi2']);
        expect(result.commitment).to.equal('YEAR');
        expect(result.term).to.equal('MONTHLY');
    });

    it('sums priceWithoutDiscount when present', () => {
        const offers = [
            {
                offerId: '1',
                offerSelectorIds: ['osi1'],
                priceDetails: {
                    price: 15.99,
                    priceWithoutDiscount: 19.99,
                    formatString: "'US$'#,##0.00",
                },
                commitment: 'YEAR',
                term: 'MONTHLY',
            },
            {
                offerId: '2',
                offerSelectorIds: ['osi2'],
                priceDetails: {
                    price: 20.99,
                    priceWithoutDiscount: 24.99,
                    formatString: "'US$'#,##0.00",
                },
                commitment: 'YEAR',
                term: 'MONTHLY',
            },
        ];
        const result = sumOffers(offers);
        expect(result.priceDetails.price).to.equal(36.98);
        expect(result.priceDetails.priceWithoutDiscount).to.equal(44.98);
    });

    it('uses first offer metadata for combined offer', () => {
        const offers = [
            {
                offerId: '1',
                offerSelectorIds: ['osi1'],
                priceDetails: {
                    price: 10.0,
                    formatString: "'US$'#,##0.00",
                    taxDisplay: 'TAX_EXCLUSIVE',
                    taxTerm: 'TAX',
                },
                commitment: 'YEAR',
                term: 'MONTHLY',
                customerSegment: 'INDIVIDUAL',
            },
            {
                offerId: '2',
                offerSelectorIds: ['osi2'],
                priceDetails: {
                    price: 20.0,
                    formatString: "'US$'#,##0.00",
                    taxDisplay: 'TAX_EXCLUSIVE',
                    taxTerm: 'TAX',
                },
                commitment: 'YEAR',
                term: 'MONTHLY',
                customerSegment: 'TEAM',
            },
        ];
        const result = sumOffers(offers);
        expect(result.customerSegment).to.equal('INDIVIDUAL');
        expect(result.priceDetails.formatString).to.equal("'US$'#,##0.00");
    });

    it('rounds summed prices to 2 decimal places', () => {
        const offers = [
            {
                offerId: '1',
                offerSelectorIds: ['osi1'],
                priceDetails: { price: 10.333 },
            },
            {
                offerId: '2',
                offerSelectorIds: ['osi2'],
                priceDetails: { price: 20.666 },
            },
        ];
        const result = sumOffers(offers);
        expect(result.priceDetails.price).to.equal(31.0);
    });

    it('sums annualized prices when present', () => {
        const offers = [
            {
                offerId: '1',
                offerSelectorIds: ['osi1'],
                priceDetails: {
                    price: 31.99,
                    priceWithoutTax: 29.08,
                    annualized: {
                        annualizedPrice: 383.88,
                        annualizedPriceWithoutTax: 348.96,
                    },
                    formatString: "'A$'#,##0.00",
                },
                commitment: 'YEAR',
                term: 'MONTHLY',
            },
            {
                offerId: '2',
                offerSelectorIds: ['osi2'],
                priceDetails: {
                    price: 39.99,
                    priceWithoutTax: 36.35,
                    annualized: {
                        annualizedPrice: 479.88,
                        annualizedPriceWithoutTax: 436.2,
                    },
                    formatString: "'A$'#,##0.00",
                },
                commitment: 'YEAR',
                term: 'MONTHLY',
            },
        ];
        const result = sumOffers(offers);
        expect(result.priceDetails.price).to.equal(71.98);
        expect(result.priceDetails.priceWithoutTax).to.equal(65.43);
        expect(result.priceDetails.annualized.annualizedPrice).to.equal(863.76);
        expect(
            result.priceDetails.annualized.annualizedPriceWithoutTax,
        ).to.equal(785.16);
    });

    it('handles mixed offers with and without annualized prices', () => {
        const offers = [
            {
                offerId: '1',
                offerSelectorIds: ['osi1'],
                priceDetails: {
                    price: 10.0,
                    annualized: {
                        annualizedPrice: 120.0,
                    },
                },
            },
            {
                offerId: '2',
                offerSelectorIds: ['osi2'],
                priceDetails: {
                    price: 20.0,
                    // No annualized object
                },
            },
        ];
        const result = sumOffers(offers);
        expect(result.priceDetails.price).to.equal(30.0);
        expect(result.priceDetails.annualized.annualizedPrice).to.equal(120.0);
    });
});
