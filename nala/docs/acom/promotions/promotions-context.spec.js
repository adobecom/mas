import { PRICE_PATTERN, DOCS_GALLERY_PATH } from '../../../utils/commerce.js';

export const FeatureName = 'Merch Acom Cards Promotions Context Feature';
export const features = [
    {
        tcid: '0',
        name: '@MAS-Promotions-Context-All-Prices',
        path: DOCS_GALLERY_PATH.PLANS.US,
        data: {
            id: '8373b5c2-69e6-4e9c-befc-b424dd33469b',
            promoCode: 'NICOPROMO',
            promoPrice: PRICE_PATTERN.FAKE.promo,
            regularPrice: PRICE_PATTERN.FAKE.regular,
            nonPromoPrice: PRICE_PATTERN.US.mo,
        },
        tags: '@mas-docs @mas-acom @mas-promotions @mas-promotions-context @commerce @smoke @regression',
    },
    {
        tcid: '1',
        name: '@MAS-Promotions-Context-Description-Promo-Code',
        path: DOCS_GALLERY_PATH.PLANS.US,
        data: {
            id: '38a8c8f1-63a6-4b59-b8e1-0008674e22be',
            promoCode: 'NICOPROMO',
            changedPromoCode: 'MILIPROMO',
            promoPrice: PRICE_PATTERN.FAKE.promo,
            regularPrice: PRICE_PATTERN.FAKE.regular,
            nonPromoPrice: PRICE_PATTERN.US.mo,
        },
        tags: '@mas-docs @mas-acom @mas-promotions @mas-promotions-context @commerce @smoke @regression',
    },
    {
        tcid: '2',
        name: '@MAS-Promotions-Context-Main-Price-Canceled-Context',
        path: DOCS_GALLERY_PATH.PLANS.US,
        data: {
            id: '14e18a9c-252f-4d3d-b243-bf9b1509a91d',
            promoCode: 'NICOPROMO',
            mainPricePromoCode: 'cancel-context',
            promoPrice: PRICE_PATTERN.FAKE.promo,
            regularPrice: PRICE_PATTERN.FAKE.regular,
            nonPromoPrice: PRICE_PATTERN.US.mo,
        },
        tags: '@mas-docs @mas-acom @mas-promotions @mas-promotions-context @commerce @smoke @regression',
    },
    {
        tcid: '3',
        name: '@MAS-Promotions-Context-Main-Price-Only',
        path: DOCS_GALLERY_PATH.PLANS.US,
        data: {
            id: '973b373d-5484-41d5-acac-5d4b49763d88',
            promoCode: 'NICOPROMO',
            promoPrice: PRICE_PATTERN.FAKE.promo,
            regularPrice: PRICE_PATTERN.FAKE.regular,
            nonPromoPrice: PRICE_PATTERN.US.mo,
        },
        tags: '@mas-docs @mas-acom @mas-promotions @mas-promotions-context @commerce @smoke @regression',
    },
];
