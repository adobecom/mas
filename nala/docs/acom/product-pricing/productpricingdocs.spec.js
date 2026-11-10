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
];
