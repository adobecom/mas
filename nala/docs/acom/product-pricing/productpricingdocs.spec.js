import { PRICE_PATTERN, DOCS_GALLERY_PATH } from '../../../utils/commerce.js';

export const FeatureName = 'Merch Acom Product Pricing Cards Feature';
export const features = [
    {
        tcid: '0',
        name: '@MAS-Product-Pricing',
        path: DOCS_GALLERY_PATH.PRODUCT_PRICING,
        data: {
            id: '26550d95-e726-4e1f-954d-01c3a472a151',
            title: 'Illustrator',
            description: 'Create beautiful designs, icons, and more, and use them anyplace at any size.',
            planTypeText: 'Annual, billed monthly',
            price: PRICE_PATTERN.US.mo,
            ctas: ['Free trial', 'Buy now'],
            iconUrl: 'illustrator.svg',
        },
        tags: '@mas-docs @mas-acom @mas-product-pricing-card @commerce @smoke @regression @milo',
    },
    {
        tcid: '1',
        name: '@MAS-Product-Pricing-CSS',
        path: DOCS_GALLERY_PATH.PRODUCT_PRICING,
        data: { id: '26550d95-e726-4e1f-954d-01c3a472a151' },
        tags: '@mas-docs @mas-acom @mas-product-pricing-card @commerce @regression @milo',
    },
    {
        tcid: '2',
        name: '@MAS-Product-Pricing-Collection',
        path: DOCS_GALLERY_PATH.PRODUCT_PRICING,
        data: {
            id: 'fa727698-2564-4040-9b87-1ec64a24cc99',
            cardCount: 8,
            firstCardTitle: 'Photoshop',
            lastCardTitle: 'Photography',
        },
        tags: '@mas-docs @mas-acom @mas-product-pricing-card @commerce @regression @milo',
    },
    {
        tcid: '3',
        name: '@MAS-Product-Pricing-Row-Height-Sync',
        path: DOCS_GALLERY_PATH.PRODUCT_PRICING,
        data: { collectionId: 'fa727698-2564-4040-9b87-1ec64a24cc99' },
        tags: '@mas-docs @mas-acom @mas-product-pricing-card @regression @milo',
    },
    {
        tcid: '4',
        name: '@MAS-Product-Pricing-Strikethrough',
        path: DOCS_GALLERY_PATH.PRODUCT_PRICING,
        data: { id: '1b8880d5-1807-43f0-81c3-d76d6655d6cc', price: PRICE_PATTERN.US.mo },
        tags: '@mas-docs @mas-acom @mas-product-pricing-card @commerce @regression @milo',
    },
    {
        tcid: '5',
        name: '@MAS-Product-Pricing-Free',
        path: DOCS_GALLERY_PATH.PRODUCT_PRICING,
        data: { id: '5bd63a91-d6e8-4659-a90d-a6346ad321f0', priceText: 'Free', ctas: ['Create now', 'See plans'] },
        tags: '@mas-docs @mas-acom @mas-product-pricing-card @commerce @regression @milo',
    },
    {
        tcid: '6',
        name: '@MAS-Product-Pricing-3-Year-Term-License',
        path: DOCS_GALLERY_PATH.PRODUCT_PRICING,
        data: {
            id: 'c84be579-8af7-4180-bffa-eded56404f8d',
            title: 'Photoshop Elements 2024',
            termText: '3-year term license',
            price: /^US\$\d+\.\d\d$/,
        },
        tags: '@mas-docs @mas-acom @mas-product-pricing-card @commerce @regression @milo',
    },
    {
        tcid: '7',
        name: '@MAS-Product-Pricing-Long-CTA-Stacking',
        path: DOCS_GALLERY_PATH.PRODUCT_PRICING,
        data: {
            longCtaId: 'b1bfa96f-5892-44ea-bbf3-1a9829c433a3',
            longCtas: ['Start your free trial of Illustrator today', 'Compare all plans and pricing options'],
            shortCtaId: '26550d95-e726-4e1f-954d-01c3a472a151',
        },
        tags: '@mas-docs @mas-acom @mas-product-pricing-card @regression @milo',
    },
];
