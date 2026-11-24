import { baseOffer, priceInfo } from './cases.js';

export const planTypeCases = [
    { id: 'annual-monthly', offer: { commitment: 'YEAR', term: 'MONTHLY' }, expected: 'ABM' },
    { id: 'annual-upfront', offer: { commitment: 'YEAR', term: 'ANNUAL' }, expected: 'PUF' },
    { id: 'annual-unsupported-term', offer: { commitment: 'YEAR', term: 'P1D' }, expected: '' },
    { id: 'annual-missing-term', offer: { commitment: 'YEAR' }, expected: '' },
    { id: 'monthly', offer: { commitment: 'MONTH', term: 'MONTHLY' }, expected: 'M2M' },
    { id: 'monthly-unsupported-term', offer: { commitment: 'MONTH', term: 'ANNUAL' }, expected: '' },
    { id: 'perpetual', offer: { commitment: 'PERPETUAL' }, expected: 'PERPETUAL' },
    { id: 'term-license', offer: { commitment: 'TERM_LICENSE', term: 'P3Y' }, expected: 'P3Y' },
    { id: 'term-license-unsupported-term', offer: { commitment: 'TERM_LICENSE', term: 'MONTHLY' }, expected: '' },
    { id: 'unsupported-commitment', offer: { commitment: 'OTHER', term: 'MONTHLY' }, expected: '' },
    { id: 'empty-commitment', offer: { commitment: '', term: 'MONTHLY' }, expected: '' },
];

export const selectionCases = [
    { id: 'empty', offers: [], options: {} },
    { id: 'single', offers: [baseOffer], options: {} },
    { id: 'GB-language', offers: [{ language: 'MULT' }, { language: 'EN' }], options: { country: 'GB' } },
    { id: 'US-language', offers: [{ language: 'EN' }, { language: 'MULT' }], options: { country: 'US' } },
    {
        id: 'term-before-language',
        offers: [{ language: 'EN', term: 'MONTHLY' }, { language: 'MULT' }],
        options: { country: 'GB' },
    },
    {
        id: 'tied-priorities',
        offers: [
            { id: 'first', language: 'FR' },
            { id: 'second', language: 'DE' },
        ],
        options: {},
    },
    { id: 'net-rewrite', offers: [{ ...baseOffer, priceInfo }], options: { forceTaxExclusive: true } },
    {
        id: 'already-exclusive',
        offers: [{ ...baseOffer, priceInfo, priceDetails: { ...baseOffer.priceDetails, taxDisplay: 'TAX_EXCLUSIVE' } }],
        options: { forceTaxExclusive: true },
    },
    {
        id: 'gross-fallback',
        offers: [{ priceDetails: { price: 30, priceWithoutDiscount: 40, taxDisplay: 'TAX_INCLUSIVE_DETAILS' } }],
        options: { forceTaxExclusive: true },
    },
    {
        id: 'zero-trial',
        offers: [{ ...baseOffer, offerType: 'TRIAL', priceDetails: { ...baseOffer.priceDetails, priceWithoutTax: 0 } }],
        options: { forceTaxExclusive: true },
    },
];

export const summationCases = [
    { id: 'null', offers: null },
    { id: 'empty', offers: [] },
    { id: 'single', offers: [baseOffer] },
    {
        id: 'bundle',
        offers: [
            { ...baseOffer, priceInfo },
            { ...baseOffer, offerSelectorIds: ['addon'] },
        ],
    },
    { id: 'absent-details', offers: [{}, {}] },
    { id: 'rounding', offers: [{ priceDetails: { price: 10.333 } }, { priceDetails: { price: 20.666 } }] },
    { id: 'zero-sum', offers: [{ priceDetails: { price: 1 } }, { priceDetails: { price: -1 } }] },
    { id: 'negative-sum', offers: [{ priceDetails: { price: 1 } }, { priceDetails: { price: -2 } }] },
    {
        id: 'annualized-bundle',
        offers: [10.111, 20.222].map((price) => ({
            priceDetails: {
                annualized: {
                    annualizedPrice: price,
                    annualizedPriceWithoutTax: price,
                    annualizedPriceWithoutDiscount: price,
                    annualizedPriceWithoutDiscountAndTax: price,
                },
            },
        })),
    },
    {
        id: 'partial-annualized',
        offers: [{}, { priceDetails: { annualized: { annualizedPrice: 10, annualizedPriceWithoutTax: 0 } } }],
    },
    {
        id: 'non-positive-annualized',
        offers: [
            { priceDetails: { annualized: { annualizedPrice: 1 } } },
            { priceDetails: { annualized: { annualizedPrice: -2 } } },
        ],
    },
];
