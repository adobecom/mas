import { PRICE_PATTERN, DOCS_GALLERY_PATH } from '../../../utils/commerce.js';

export const FeatureName = 'Merch Acom Cards Promotions Feature';
export const features = [
    {
        tcid: '0',
        name: '@MAS-Promotions-Card-in-Collection',
        path: DOCS_GALLERY_PATH.PLANS_COLLECTION.US,
        data: {
            id: 'da3194c1-ccd0-47cc-b27c-a4c35a32034a',
            variation_id: 'cac48f1e-453d-482e-90d7-e21488baf25a',
            badgeText: 'Great -44%',
            badgeColor: 'rgb(245, 199, 0)', // Yellow 300
            promoPrice: PRICE_PATTERN.FAKE.promo,
            price: PRICE_PATTERN.FAKE.regular,
        },
        browserParams: '?mas.preview=on',
        tags: '@mas-docs @mas-acom @mas-promotions @commerce @smoke @regression @milo',
    },
    {
        tcid: '1',
        name: '@MAS-Promotions-Regional-Variation-Card-in-Collection',
        path: [DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_co, DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_EN],
        data: {
            id: 'a38a2885-8d1a-47de-a625-a3c78cd78230',
            variation_id: 'e182678e-e294-4e0e-9f75-648138345734',
            badgeText: 'en_GR regional promo',
            badgeColor: 'rgb(80, 80, 80)', // Grey 700
            badgeBorderColor: 'rgb(5, 131, 78)', // Green 900
            borderColor: 'rgb(5, 131, 78)', // Green 900
            promoPrice: PRICE_PATTERN.FAKE.promo,
            price: PRICE_PATTERN.FAKE.regular,
        },
        browserParams: ['?mas.preview=on', 'instant=2026-04-15'],
        tags: '@mas-docs @mas-acom @mas-promotions @commerce @smoke @regression @milo',
    },
    {
        tcid: '2',
        name: '@MAS-Promotions-Grouped-Variation-Card-in-Collection',
        path: [DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_co, DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_EN],
        data: {
            id: 'da3194c1-ccd0-47cc-b27c-a4c35a32034a',
            variation_id: '77bf5cf9-e625-4dfb-ad26-fafe3ac4c32c',
            badgeText: 'en_GR grouped promo',
            badgeColor: 'rgb(218, 218, 218)', // light grey
            badgeBorderColor: 'rgb(218, 218, 218)', // light grey
            promoPrice: PRICE_PATTERN.FAKE.promo,
            price: PRICE_PATTERN.FAKE.regular,
        },
        browserParams: ['?mas.preview=on', 'instant=2026-04-15'],
        tags: '@mas-docs @mas-acom @mas-promotions @commerce @smoke @regression @milo',
    },
];
