// WCS pre-split trees keyed by osi. Written by hand, not the formatter under
// test, so parity trees can prove the pre-split path matches the numeric path.

const usdFormat = {
    currencySymbol: 'US$',
    decimalsDelimiter: '.',
    usePrecision: true,
    isCurrencyFirst: true,
    hasCurrencySpace: false,
};

const leaf = (integer, decimals, full) => ({ integer, decimals, full });

// puf-mult: US$599.88/yr, optical US$49.99/mo, no discount.
const puf = {
    format: usdFormat,
    recurrence: { term: 'ANNUAL' },
    asIs: { withDiscount: { withTax: leaf('599', '88', 'US$599.88') } },
    annualized: { withDiscount: { withTax: leaf('599', '88', 'US$599.88') } },
    optical: { withDiscount: { withTax: leaf('49', '99', 'US$49.99') } },
};

// abm-promo-mult: US$43.99/mo discounted, US$54.99/mo without discount.
const abmPromo = {
    format: usdFormat,
    recurrence: { term: 'MONTHLY' },
    asIs: {
        withDiscount: { withTax: leaf('43', '99', 'US$43.99') },
        withoutDiscount: { withTax: leaf('54', '99', 'US$54.99') },
    },
};

// abm-mult: US$54.99/mo, no discount.
const abm = {
    format: usdFormat,
    recurrence: { term: 'MONTHLY' },
    asIs: { withDiscount: { withTax: leaf('54', '99', 'US$54.99') } },
};

export const preformattedTrees = {
    puf,
    'abm-promo': abmPromo,
    abm,
};

// Distinct from the offer price (599.88), so a test can prove the leaf renders.
export const distinctTrees = {
    puf: {
        format: usdFormat,
        recurrence: { term: 'ANNUAL' },
        asIs: { withDiscount: { withTax: leaf('777', '11', 'US$777.11') } },
        annualized: {
            withDiscount: { withTax: leaf('777', '11', 'US$777.11') },
        },
        optical: { withDiscount: { withTax: leaf('64', '77', 'US$64.77') } },
    },
    // abm-mult is YEAR/MONTHLY, the annualized path. `annualized` differs from
    // `asIs` and from both 54.99 * 12 (offer price) and 88.22 * 12 (asIs leaf),
    // so only indexing the annualized leaf can produce it.
    abm: {
        format: usdFormat,
        recurrence: { term: 'MONTHLY' },
        asIs: { withDiscount: { withTax: leaf('88', '22', 'US$88.22') } },
        annualized: {
            withDiscount: { withTax: leaf('911', '33', 'US$911.33') },
        },
    },
};
