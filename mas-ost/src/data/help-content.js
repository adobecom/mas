export const HELP_BANNERS = {
    empty: {
        step: 1,
        title: 'Find your product',
        body: 'Search by product name, arrangement code, or paste an offer ID / OSI directly. Use the filters on the left to narrow results by plan type, segment, or market.',
    },
    offers: {
        step: 2,
        title: 'Choose an offer',
        body: 'Each row is a pricing offer for this product. Click one to configure how its price or CTA will appear on your page. The colored badge shows the plan type (e.g. ABM = annual billed monthly, PUF = pay up front).',
    },
    configure: {
        step: 3,
        title: 'Configure & copy',
        body: "Pick a placeholder type (e.g. 'Price' to show the offer's price, 'Checkout URL' for a buy button). Adjust display options below, then click Use to copy the code to your clipboard.",
    },
};

export const HELP_TOOLTIPS = {
    planType:
        'How the customer pays. ABM = Annual Billed Monthly (12-month contract, billed each month). PUF = Pay Up Front (12 months, paid in full). M2M = Month-to-Month (cancel anytime). P3Y = 3-Year Term License. Perpetual = one-time purchase, no recurring billing.',
    segment:
        'Who the offer is licensed for. Individual = single consumer subscription. Team = small/medium business, seat-based. Enterprise = large organization / VIP contracts.',
    market:
        'What vertical the offer targets. COM = Commercial (business/consumer). EDU = Education (students, faculty, schools). GOV = Government.',
    offerType:
        'The variant of the offer. Base = standard regular-price offer. Trial = free or reduced-price introductory period. Promotion = discounted or special-pricing variant.',
    planBadge:
        'The colored badge indicates the plan type: blue = ABM, purple = PUF, yellow = M2M, fuchsia = P3Y, seafoam = Perpetual.',
    offerId:
        "A unique 32-character identifier for this specific offer. Used internally by Adobe's commerce system — not shown to customers.",
    placeholderType:
        "Controls what the placeholder outputs on the page. Price = formatted price text. Optical = annual price shown as monthly equivalent. Discount = strikethrough comparison with a reference offer. Checkout URL = a buy-now link/button. Legal = legal disclaimers for the offer.",
    options:
        'Display toggles that control price formatting: whether to show currency formatting, recurrence label (/mo, /yr), per-unit pricing, tax, or old/strikethrough price.',
    checkoutOptions:
        'Settings for buy buttons: which checkout workflow to use (UCv3, UCv2), the CTA label (Buy now, Free trial, etc.), and whether to open in a modal.',
    landscapeEnv:
        'Landscape: Draft offers are being edited; Published offers are live. Environment: Stage uses test data; Production uses real commerce data.',
};
