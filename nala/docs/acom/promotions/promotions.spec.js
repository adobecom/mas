import { PRICE_PATTERN, DOCS_GALLERY_PATH } from '../../../utils/commerce.js';

export const FeatureName = 'Merch Acom Cards Promotions Feature';
export const features = [
    {
        tcid: '0',
        name: '@MAS-Promotions-Card-in-Collection',
        path: [DOCS_GALLERY_PATH.PLANS_COLLECTION.US, DOCS_GALLERY_PATH.PLANS_COLLECTION.ES_ES],
        data: {
            id: 'da3194c1-ccd0-47cc-b27c-a4c35a32034a',
            variation_id: 'e9d52954-25f6-41cb-8d38-7508370f30a2',
            badgeText: {
                US: 'Great -44%',
                ES: 'Excelente -44%',
            },
            badgeColor: 'rgb(245, 199, 0)', // Yellow 300
            price: PRICE_PATTERN.FAKE.promo,
            strikeThroughPrice: PRICE_PATTERN.FAKE.regular,
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
            price: PRICE_PATTERN.FAKE.promo,
            strikeThroughPrice: PRICE_PATTERN.FAKE.regular,
        },
        browserParams: '?mas.preview=on',
        tags: '@mas-docs @mas-acom @mas-promotions @commerce @smoke @regression @milo',
    },
    // {
    //     tcid: '2',
    //     name: '@MAS-Promotions-Grouped-Variation-Card-in-Collection',
    //     path: [DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_co, DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_EN],
    //     data: {
    //         id: '',
    //         variation_id: '',
    //         badgeText: '',
    //         badgeColor: '', //
    //         badgeBorderColor: '', //
    //         borderColor: '', //
    //         subtitle: '',
    //         price: PRICE_PATTERN.FAKE.promo,
    //         strikeThroughPrice: PRICE_PATTERN.FAKE.regular,
    //     },
    //     browserParams: '?mas.preview=on',
    //     tags: '@mas-docs @mas-acom @mas-promotions @commerce @smoke @regression @milo',
    // },
];
