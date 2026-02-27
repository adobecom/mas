/**
 * Shared template tree used by template picker and settings override summaries.
 */
export const TEMPLATE_TREE_DATA = [
    { name: 'blade', label: 'Blade' },
    {
        name: 'catalog-group',
        label: 'Catalog',
        children: [
            { name: 'catalog', label: 'Catalog' },
            { name: 'comp-chart', label: 'Comp chart' },
            { name: 'countdown-timer', label: 'Countdown timer' },
            { name: 'fries', label: 'Fries' },
            { name: 'catalog-mini', label: 'Mini' },
            { name: 'catalog-special-offers', label: 'Special offers' },
            { name: 'catalog-other', label: 'Other' },
        ],
    },
    {
        name: 'gnav-bar-group',
        label: 'Gnav bar',
        children: [
            { name: 'gnav-bar', label: 'Gnav bar' },
            { name: 'gnav-bar-catalog', label: 'Gnav bar' },
            { name: 'gnav-bar-mini-comp-chart', label: 'Gnav bar' },
            { name: 'gnav-bar-plans', label: 'Gnav bar' },
            { name: 'gnav-bar-special-offers', label: 'Gnav bar' },
        ],
    },
    {
        name: 'global-group',
        label: 'Global',
        children: [
            { name: 'marquee', label: 'Marquee' },
            { name: 'modal', label: 'Modal' },
            { name: 'promo-bar', label: 'Promo bar' },
            {
                name: 'merch-card-group',
                label: 'Merch card',
                children: [
                    { name: 'merch-card-badge-banner', label: 'Badge banner' },
                    { name: 'merch-card-catalog', label: 'Catalog' },
                    { name: 'merch-card-gnav', label: 'Gnav' },
                    { name: 'merch-card-mini-compare-chart', label: 'Mini compare chart' },
                    { name: 'merch-card-plans', label: 'Plans' },
                    { name: 'merch-card-product', label: 'Product' },
                    { name: 'merch-card-segment', label: 'Segment' },
                    { name: 'merch-card-special-offers', label: 'Special offers' },
                ],
            },
        ],
    },
    { name: 'homepage-pod', label: 'Homepage pod' },
    { name: 'mini', label: 'Mini' },
    { name: 'mpp-promo-element', label: 'MPP Promo element' },
    {
        name: 'plans-group',
        label: 'Plans',
        children: [
            { name: 'plans', label: 'Plans' },
            { name: 'simplified-pricing-express', label: 'Simplified pricing Express' },
            { name: 'special-offers', label: 'Special offers' },
            { name: 'sticky-banner', label: 'Sticky banner' },
            { name: 'suggested', label: 'Suggested' },
            { name: 'terms-and-conditions', label: 'Terms & Conditions' },
        ],
    },
    { name: 'try-buy-widget', label: 'Try buy widget' },
    { name: 'twp-subscription-panel', label: 'TwP Subscription panel' },
    { name: 'other', label: 'Other' },
];
