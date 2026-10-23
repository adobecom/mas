export const instant = '2025-01-15T12:00:00.000Z';

export const dimensions = {
    locales: [
        ['US', 'en', "'US$'#,##0.00"],
        ['GB', 'en', "'£'#,##0.00"],
        ['DE', 'de', "#.##0,00 '€'"],
        ['JP', 'ja', "'¥'#,##0"],
        ['IN', 'hi', "'₹'#,##0.00"],
        ['AU', 'en', "'A$'#,##0.00"],
    ],
    segments: ['INDIVIDUAL', 'TEAM', 'STUDENT', 'UNIVERSITY'],
    templates: [
        ['default', {}],
        ['optical', { template: 'optical' }],
        ['strikethrough', { template: 'strikethrough' }],
        ['promo-strikethrough', { template: 'promo-strikethrough' }],
        ['annual', { template: 'annual' }],
        ['legal', { template: 'legal', displayPlanType: true }],
        ['discount', { template: 'discount' }],
        ['alternative', { alternativePrice: true }],
        ['optical-alternative', { template: 'optical', alternativePrice: true }],
        ['with-annual', { displayAnnual: true }],
        ['promo-with-annual', { displayAnnual: true, promotionCode: 'PROMO' }],
    ],
    offers: ['regular', 'promotion', 'preformatted'],
};

export const baseOffer = {
    offerId: 'base',
    offerSelectorIds: ['osi-base'],
    language: 'MULT',
    planType: 'ABM',
    commitment: 'YEAR',
    term: 'MONTHLY',
    marketSegments: ['COM'],
    customerSegment: 'INDIVIDUAL',
    priceDetails: {
        price: 29.99,
        priceWithoutDiscount: 39.99,
        priceWithoutTax: 24.99,
        priceWithoutDiscountAndTax: 33.33,
        formatString: "'US$'#,##0.00",
        usePrecision: true,
        taxDisplay: 'TAX_INCLUSIVE_DETAILS',
        taxTerm: 'VAT',
    },
};

export const promotion = {
    start: '2024-01-01T00:00:00.000Z',
    end: '2026-01-01T00:00:00.000Z',
    displaySummary: {
        amount: 25,
        duration: 'P3M',
        outcomeType: 'PERCENTAGE_DISCOUNT',
        minProductQuantity: 1,
        instant,
    },
};

const leaf = (integer, decimals) => ({ integer, decimals, full: `${integer}.${decimals}` });
export const priceInfo = {
    format: { currencySymbol: '$', isCurrencyFirst: true, hasCurrencySpace: false, decimalsDelimiter: '.' },
    asIs: {
        withDiscount: { withTax: leaf('29', '99') },
        withoutDiscount: { withTax: leaf('39', '99') },
    },
    optical: {
        withDiscount: { withTax: leaf('29', '99') },
        withoutDiscount: { withTax: leaf('39', '99') },
    },
    annualized: {
        withDiscount: { withTax: leaf('359', '88') },
        withoutDiscount: { withTax: leaf('479', '88') },
    },
};

export const cases = [];
for (const [country, language, formatString] of dimensions.locales) {
    for (const customerSegment of dimensions.segments) {
        for (const [templateName, templateOptions] of dimensions.templates) {
            for (const shape of dimensions.offers) {
                const offer = structuredClone(baseOffer);
                Object.assign(offer, { customerSegment, language: country === 'GB' ? 'EN' : 'MULT' });
                Object.assign(offer.priceDetails, { formatString, usePrecision: country !== 'JP' });
                if (shape === 'promotion') offer.promotion = structuredClone(promotion);
                if (shape === 'preformatted') offer.priceInfo = structuredClone(priceInfo);
                cases.push({
                    id: `${country}-${language}/${customerSegment}/${templateName}/${shape}`,
                    offers: [offer],
                    options: {
                        country,
                        language,
                        instant,
                        quantity: [1],
                        displayTax: country !== 'US',
                        displayPerUnit: customerSegment !== 'INDIVIDUAL',
                        ...templateOptions,
                    },
                });
            }
        }
    }
}

const edge = (id, offerChanges = {}, detailChanges = {}, options = {}) => {
    const offer = {
        ...structuredClone(baseOffer),
        ...offerChanges,
        priceDetails: { ...baseOffer.priceDetails, ...detailChanges },
    };
    cases.push({ id, offers: [offer], options: { country: 'US', language: 'en', instant, ...options } });
};

for (const [id, term, price, usePrecision] of [
    ['optical-annual-exact', 'ANNUAL', 120, true],
    ['optical-annual-fraction', 'ANNUAL', 119.99, true],
    ['optical-annual-integer', 'ANNUAL', 119.99, false],
    ['optical-two-year', 'TWO_YEARS', 239.99, true],
    ['optical-three-year', 'THREE_YEARS', 359.99, true],
    ['optical-unknown-term', 'P1D', 100, true],
]) {
    edge(id, { term }, { price, usePrecision }, { template: 'optical' });
}
edge('annual-m2m', { commitment: 'MONTH', planType: 'M2M' }, {}, { template: 'annual' });
edge('annual-puf', { term: 'ANNUAL', planType: 'PUF' }, {}, { template: 'annual' });
edge('perpetual', { commitment: 'PERPETUAL', term: undefined });
edge('zero-price', {}, { price: 0, priceWithoutDiscount: 0 });
edge('negative-price', {}, { price: -10 });
edge('indian-grouping', {}, { price: 123456.78 }, { country: 'IN', language: 'hi' });
edge('currency-suffix-unformatted', {}, { formatString: "#.##0,00 '€'" }, { displayFormatted: false });
edge('currency-prefix-unformatted', {}, { formatString: "'$ '#,##0.00" }, { displayFormatted: 'false' });
edge('no-decimal-mask', {}, { formatString: "'¥'#,##0", usePrecision: true });
edge('no-precision', {}, { usePrecision: false });
edge('unknown-template', {}, {}, { template: 'unknown' });
edge('tax-exclusive', {}, { taxDisplay: 'TAX_EXCLUSIVE' }, { displayTax: 'true' });
edge('tax-and-unit-spacing', {}, {}, { displayTax: true, displayPerUnit: true, space: true });
edge('legal-dot', {}, {}, { country: 'GB', language: 'en', template: 'legal', displayTax: true, displayPlanType: true });
edge(
    'legal-no-dot',
    {},
    {},
    {
        country: 'GB',
        language: 'en',
        template: 'legal',
        displayTax: true,
        displayPlanType: true,
        displayDot: false,
    },
);
edge('legal-lower', {}, {}, { template: 'legal', displayPlanType: true, planTypeCase: 'lower' });
edge('legal-upper', {}, {}, { template: 'legal', displayPlanType: true, planTypeCase: 'upper' });
edge('legal-unit', {}, {}, { template: 'legal', displayPerUnit: true });
edge(
    'legal-ending-dot',
    {},
    {},
    {
        country: 'GB',
        template: 'legal',
        displayPlanType: true,
        displayTax: true,
        literals: { taxInclusiveLabel: 'VAT.' },
    },
);
edge('discount-no-baseline', {}, { priceWithoutDiscount: undefined }, { template: 'discount' });
edge('discount-zero', {}, { price: 0 }, { template: 'discount' });
edge('discount-invalid', {}, { price: '29' }, { template: 'discount' });
edge(
    'discount-chinese',
    {},
    { price: 35, priceWithoutDiscount: 100 },
    {
        country: 'CN',
        language: 'zh',
        template: 'discount',
        literals: { discountLabel: '{remainingPercent, number, ::scale/0.1 .0}折' },
    },
);
edge('missing-literal', {}, {}, { displayPerUnit: true, literals: { perUnitLabel: null } });
edge(
    'literal-links',
    {},
    {},
    {
        displayPerUnit: true,
        literals: { perUnitLabel: '<strong>per</strong> <a href="/legal">license</a>' },
    },
);
edge('invalid-literal', {}, {}, { literals: { recurrenceLabel: '{broken' } });
edge('preformatted-fallback', { priceInfo: { asIs: {} } });
edge('preformatted-empty-decimals', {
    priceInfo: {
        asIs: { withDiscount: { withTax: { integer: '30', decimals: '', full: '$30' } } },
    },
});
edge('preformatted-missing-format', { priceInfo: { asIs: priceInfo.asIs } });
edge('preformatted-m2m-annual', { commitment: 'MONTH', planType: 'M2M', priceInfo }, {}, { template: 'annual' });
edge('preformatted-optical-strike', { priceInfo }, {}, { template: 'optical', alternativePrice: true });

for (const [state, promo] of [
    ['active', promotion],
    ['future', { ...promotion, start: '2027-01-01T00:00:00.000Z' }],
    ['expired', { ...promotion, end: '2024-01-01T00:00:00.000Z' }],
    ['missing-dates', { ...promotion, start: undefined }],
    ['missing-summary', { start: promotion.start, end: promotion.end }],
    ['quantity-threshold', { ...promotion, displaySummary: { ...promotion.displaySummary, minProductQuantity: 3 } }],
    ['unknown-outcome', { ...promotion, displaySummary: { ...promotion.displaySummary, outcomeType: 'OTHER' } }],
]) {
    for (const displayAnnual of [false, true]) {
        edge(
            `promo-${state}-${displayAnnual ? 'annual' : 'monthly'}`,
            { promotion: promo },
            {},
            {
                promotionCode: 'PROMO',
                displayAnnual,
                quantity: [1],
            },
        );
    }
}
edge('promo-no-old-price', { promotion }, {}, { promotionCode: 'PROMO', displayOldPrice: false });
edge('promo-wrap-clauses', { promotion }, {}, { promotionCode: 'PROMO', wrapClauses: true });
edge('promo-annual-wrap', { promotion }, {}, { promotionCode: 'PROMO', displayAnnual: true, wrapClauses: true });
edge('promo-annual-no-old', { promotion }, {}, { promotionCode: 'PROMO', displayAnnual: true, displayOldPrice: 'false' });
edge('promo-scalar-quantity', { promotion }, {}, { promotionCode: 'PROMO', quantity: 1 });
edge('promo-annual-scalar-quantity', { promotion }, {}, { promotionCode: 'PROMO', displayAnnual: true, quantity: 1 });
edge('promo-invalid-instant', { promotion }, {}, { promotionCode: 'PROMO', displayAnnual: true, instant: 'invalid' });
edge('promo-equal-prices', { promotion }, { price: 39.99 }, { promotionCode: 'PROMO' });
edge('promo-annual-preformatted', { promotion, priceInfo }, {}, { promotionCode: 'PROMO', displayAnnual: true });
cases.push({ id: 'empty-offers', offers: [], options: { country: 'US', language: 'en' } });
cases.push({ id: 'missing-options', offers: [baseOffer] });

const equivalentSegments = new Set(['STUDENT', 'UNIVERSITY']);
const segmentChecks = new Set(['US-en/STUDENT/default/regular', 'US-en/UNIVERSITY/default/regular']);

// These segments supply TEAM's same resolved flags; keep focused label regressions.
export const parityCases = cases.filter(({ id }) => !equivalentSegments.has(id.split('/')[1]) || segmentChecks.has(id));
