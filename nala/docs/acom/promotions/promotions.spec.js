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
            promotionProject: 'NalaEvergreen',
            badgeText: 'Great -44%',
            badgeColor: 'rgb(245, 199, 0)', // Yellow 300
            promoPrice: PRICE_PATTERN.FAKE.promo,
            price: PRICE_PATTERN.FAKE.regular,
        },
        tags: '@mas-docs @mas-acom @mas-promotions @commerce @smoke @regression @milo',
    },
    {
        tcid: '1',
        name: '@MAS-Promotions-Regional-Variation-Card-in-Collection',
        path: [DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_co, DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_EN],
        data: {
            id: 'a38a2885-8d1a-47de-a625-a3c78cd78230',
            variation_id: 'e182678e-e294-4e0e-9f75-648138345734',
            promotionProject: 'NalaApril2026',
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
            promotionProject: 'NalaApril2026',
            badgeText: 'en_GR grouped promo',
            badgeColor: 'rgb(218, 218, 218)', // light grey
            badgeBorderColor: 'rgb(218, 218, 218)', // light grey
            promoPrice: PRICE_PATTERN.FAKE.promo,
            price: PRICE_PATTERN.FAKE.regular,
        },
        browserParams: ['?mas.preview=on', 'instant=2026-04-15'],
        tags: '@mas-docs @mas-acom @mas-promotions @commerce @smoke @regression @milo',
    },
    {
        tcid: '3',
        name: '@MAS-Promotions-Regional-Variation-Card-in-Regional-Variation-Collection',
        path: [DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_co, DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_EN],
        data: {
            id: '40d5ebda-a155-4375-91c3-fbb788ab5314',
            variation_id: '55a77657-c4d6-4c60-a2c5-c82d498fc10a',
            promotionProject: 'NalaApril2026',
            collection_id: 'b5486c6e-34c6-40a4-aa31-37eca4edf35d',
            variation_collection_id: 'a74b83a6-116c-4bc0-9cb0-b52e050cc712',
            promoPrice: PRICE_PATTERN.FAKE.promo,
            price: PRICE_PATTERN.FAKE.regular,
        },
        browserParams: ['?mas.preview=on', 'instant=2026-04-15'],
        tags: '@mas-docs @mas-acom @mas-promotions @commerce @smoke @regression @milo',
    },
    {
        tcid: '4',
        name: '@MAS-Promotions-Grouped-Variation-Card-in-Regional-Variation-Collection',
        path: [DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_co, DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_EN],
        data: {
            id: 'd4faa487-d88e-4fb7-b42f-c1a3101ea937',
            variation_id: '8e518fc8-f7a4-4405-b210-ce085bc2d9d0',
            promotionProject: 'NalaApril2026',
            collection_id: 'b5486c6e-34c6-40a4-aa31-37eca4edf35d',
            variation_collection_id: 'a74b83a6-116c-4bc0-9cb0-b52e050cc712',
            promoPrice: PRICE_PATTERN.FAKE.promo,
            price: PRICE_PATTERN.FAKE.regular,
        },
        browserParams: ['?mas.preview=on', 'instant=2026-04-15'],
        tags: '@mas-docs @mas-acom @mas-promotions @commerce @smoke @regression @milo',
    },
    {
        tcid: '5',
        name: '@MAS-Promotions-Translated-Regional-Variation-Card-in-Grouped-Variation-Collection',
        path: [DOCS_GALLERY_PATH.PLANS_COLLECTION.AR_ES_co, DOCS_GALLERY_PATH.PLANS_COLLECTION.AR_ES],
        data: {
            id: 'f2c5dea9-6d4b-48ba-b42f-609830d22820',
            variation_id: 'b4034b7e-bad6-4d86-930f-9f6d7ea20fba',
            promotionProject: 'NalaEvergreen',
            collection_id: 'b5486c6e-34c6-40a4-aa31-37eca4edf35d',
            variation_collection_id: '22b9ba86-07d5-4fdf-a0bf-b81ae9bdd6d6',
            promoPrice: PRICE_PATTERN.FAKE.promo,
            price: PRICE_PATTERN.FAKE.regular,
        },
        tags: '@mas-docs @mas-acom @mas-promotions @commerce @smoke @regression @milo',
    },
    // add grouped variation card in grouped variation collection when MWPW-197436 is fixed

    {
        tcid: '6',
        name: '@MAS-Promotions-Variation-Evergreen',
        path: DOCS_GALLERY_PATH.PLANS_COLLECTION.US,
        data: {
            id: '146fec18-3d9c-4f93-908b-fd5e4ee76436',
            variation_id: '637aeab2-0c13-42c8-ae5e-e04db892e877',
            promotionProject: 'NalaEvergreen',
            badgeText: 'Nala Promo',
        },
        tags: '@mas-docs @mas-acom @mas-promotions @commerce @smoke @regression @milo',
    },
    {
        tcid: '7',
        name: '@MAS-Promotions-Regional-Over-Intro-Precedence',
        path: [DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_co, DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_EN],
        data: {
            id: '9c718c8b-8807-4f2b-b41a-ae7f87d69832',
            introOsi: 'A1xn6EL4pK93bWjM8flffQpfEL-bnvtoQKQAvkx574M',
            introPromoProject: 'NalaIntro',
            badgeText: 'Nala Intro',
            variation_id: 'e7a6a64c-0ed7-4784-823f-d06d0e51b508',
            regionalPromoProject: 'NalaRegional',
            regionalOsi: 'fake-minq-00ff-aabb-ccdd-112233445566',
            regionalCode: 'MILIPROMO',
            regionalPrice: PRICE_PATTERN.FAKE.milipromo,
        },
        browserParams: [['instant=2026-07-10'], []],
        tags: '@mas-docs @mas-acom @mas-promotions @commerce @smoke @regression @milo',
    },
    {
        tcid: '8',
        name: '@MAS-Promotions-Seasonal-Over-Evergreen-Precedence',
        path: [DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_co, DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_EN],
        data: {
            id: '9c718c8b-8807-4f2b-b41a-ae7f87d69832',
            variation_id: 'a2666b91-d143-4f40-829d-3e789d5bb779',
            promotionProject: 'NalaSeasonal',
            badgeText: 'Nala Seasonal',
        },
        browserParams: ['?mas.preview=on', 'instant=2026-09-10'],
        previewOnly: true,
        tags: '@mas-docs @mas-acom @mas-promotions @commerce @smoke @regression @milo',
    },
];
