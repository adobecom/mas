import { PRICE_PATTERN, DOCS_GALLERY_PATH } from '../../../utils/commerce.js';

export const FeatureName = 'Merch Acom Cards Feature';
export const features = [
    {
        tcid: '0',
        name: '@MAS-Grouped-Variation-Card-in-Collection',
        path: [
            DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_co,
            DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_EN,
            DOCS_GALLERY_PATH.PLANS_COLLECTION.AR_co,
        ],
        data: {
            id: '146fec18-3d9c-4f93-908b-fd5e4ee76436',
            variation_id: '4c850ef8-9295-4699-a9dd-0bac385df487',
            badgeText: '[en_GR, AR] grouped variation',
            badgeColor: 'rgb(5, 131, 78)', // Green 900
            price: {
                gr_en: PRICE_PATTERN.GR.mo_en,
                ar_en: PRICE_PATTERN.AR.mo_en,
            },
        },
        tags: '@mas-docs @mas-acom @mas-variations @commerce @smoke @regression @milo',
    },
    {
        tcid: '1',
        name: '@MAS-Regional-Variation-Card-in-Collection',
        path: [DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_co, DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_EN],
        data: {
            id: 'e5e40288-6b53-4a40-8cc2-010037b1ab85',
            variation_id: 'a55c1d3b-2024-4489-931e-6966f345b35f',
            subtitle: 'GR regional variation',
            price: PRICE_PATTERN.GR.mo_en,
        },
        tags: '@mas-docs @mas-acom @mas-variations @commerce @smoke @regression @milo @regional-variation',
    },
    {
        tcid: '2',
        name: '@MAS-Regional-Variation-of-Collection',
        path: [DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_co, DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_EN],
        data: {
            id: 'b5486c6e-34c6-40a4-aa31-37eca4edf35d',
            variation_id: 'a74b83a6-116c-4bc0-9cb0-b52e050cc712',
            removed_id: '7545e2eb-8fad-47d8-96cf-e76d3370c9f4',
            reorder: ['40d5ebda-a155-4375-91c3-fbb788ab5314', 'd4faa487-d88e-4fb7-b42f-c1a3101ea937'],
        },
        tags: '@mas-docs @mas-acom @mas-variations @commerce @smoke @regression @milo @regional-variation',
    },
    {
        tcid: '3',
        name: '@MAS-Grouped-Variation-of-Collection',
        path: DOCS_GALLERY_PATH.PLANS_COLLECTION.AR_co,
        data: {
            id: 'b5486c6e-34c6-40a4-aa31-37eca4edf35d',
            variation_id: '553aaaa6-9ec5-43fc-9479-d72e0de0d486',
            reorder: [
                '7545e2eb-8fad-47d8-96cf-e76d3370c9f4',
                'd4faa487-d88e-4fb7-b42f-c1a3101ea937',
                '40d5ebda-a155-4375-91c3-fbb788ab5314',
            ],
        },
        tags: '@mas-docs @mas-acom @mas-variations @commerce @smoke @regression @milo @regional-variation',
    },
    {
        tcid: '4',
        name: '@MAS-Card-Grouped-Variation-in-Collection-Regional-Variation',
        path: [DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_co, DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_EN],
        data: {
            cardid: 'd4faa487-d88e-4fb7-b42f-c1a3101ea937',
            variation_card_id: '8e518fc8-f7a4-4405-b210-ce085bc2d9d0',
            collection_id: 'b5486c6e-34c6-40a4-aa31-37eca4edf35d',
            variation_collection_id: 'a74b83a6-116c-4bc0-9cb0-b52e050cc712',
            subtitle: 'en_GR grouped variation',
            price: PRICE_PATTERN.GR.mo_en,
        },
        tags: '@mas-docs @mas-acom @mas-variations @commerce @smoke @regression @milo @regional-variation',
    },
    {
        tcid: '5',
        name: '@MAS-Card-Regional-Variation-in-Collection-Regional-Variation',
        path: [DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_co, DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_EN],
        data: {
            cardid: '40d5ebda-a155-4375-91c3-fbb788ab5314',
            variation_card_id: '55a77657-c4d6-4c60-a2c5-c82d498fc10a',
            collection_id: 'b5486c6e-34c6-40a4-aa31-37eca4edf35d',
            variation_collection_id: 'a74b83a6-116c-4bc0-9cb0-b52e050cc712',
            subtitle: 'GR regional variation',
            price: PRICE_PATTERN.GR.mo_en,
        },
        tags: '@mas-docs @mas-acom @mas-variations @commerce @smoke @regression @milo @regional-variation',
    },
    {
        tcid: '6',
        name: '@MAS-Translated-Card-Grouped-Variation-in-Translated-Collection',
        path: [DOCS_GALLERY_PATH.PLANS_COLLECTION.AR_ES, DOCS_GALLERY_PATH.PLANS_COLLECTION.AR],
        data: {
            cardid: '395f87f1-13b2-4c6a-8c69-2353fd5c9a77',
            variation_card_id: 'ffa6f532-f131-42f9-ad63-11325a06a740',
            collection_id: '4a466a3c-efa2-4406-ae47-93abd2167e27',
            subtitle: 'Grouped variation of ES',
            badgeColor: 'rgb(80, 80, 80)', // Grey 700
            price: {
                ar: PRICE_PATTERN.AR.mo,
                ar_en: PRICE_PATTERN.AR.mo_en,
            },
        },
        tags: '@mas-docs @mas-acom @mas-variations @commerce @smoke @regression @milo @regional-variation',
    },
    {
        tcid: '7',
        name: '@MAS-Translated-Card-Regional-Variation-in-Translated-Collection',
        path: [DOCS_GALLERY_PATH.PLANS_COLLECTION.AR_ES, DOCS_GALLERY_PATH.PLANS_COLLECTION.AR],
        data: {
            cardid: '2edb6d25-e05b-4ec1-8a9a-fe5298d499b8',
            variation_card_id: '9e201d14-c100-4397-a9a7-7ee1116e09f9',
            collection_id: '4a466a3c-efa2-4406-ae47-93abd2167e27',
            subtitle: 'AR regional variation from ES',
            price: {
                ar: PRICE_PATTERN.AR.mo,
                ar_en: PRICE_PATTERN.AR.mo_en,
            },
        },
        tags: '@mas-docs @mas-acom @mas-variations @commerce @smoke @regression @milo @regional-variation',
    },
    // once issue with AR is fixed, add this test
    // {
    //     tcid: '8',
    //     name: '@MAS-Translated-Card-Regional-Variation-in-Translated-Collection-Grouped-Variation',
    //     path: [DOCS_GALLERY_PATH.PLANS_COLLECTION.AR_ES, DOCS_GALLERY_PATH.PLANS_COLLECTION.AR],
    //     data: {
    //         cardid: '',
    //         variation_card_id: '',
    //         collection_id: '',
    //         variation_collection_id: '',
    //         subtitle: '',
    //     },
    //     tags: '@mas-docs @mas-acom @mas-variations @commerce @smoke @regression @milo @regional-variation',
    // },
];
