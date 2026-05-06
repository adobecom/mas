import { PRICE_PATTERN, DOCS_GALLERY_PATH } from '../../../utils/commerce.js';

export const FeatureName = 'Merch Acom Cards Feature';
export const features = [
    // PLANS CARDS
    // - grouped variation in collection (CC in Illustrator) en_GR i country=AR
    // - regional variation in collection (Firefly in Illustrator) en_GR
    // - regional variation of the collection (Social removed card) en_GR
    // - grouped card variation in regional collection variation (Adobe express in Social) en_gr

    // regiona card variation in grouped collection variation???
    // regional in regional ??
    // grouped in grouped ??

    // - translated card variation in grouped collection variation???
    // - grouped variation of the collection (reorder) country=AR
    // - translated grouped variation of the card in the collection (CC in Illustrator) es_AR
    // - regional variation of translated card in the translated collection (Firefly in Illustrator) es_AR

    // - regional variation of the translated card in the translated (grouped variation) collection (does not work) ?? grouped collection not translated?
    // translated cards do not work in Social es_ES, but work in Illustration
    //
    {
        tcid: '0',
        name: '@MAS-Grouped-Variation-in-Collection',
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
        },
        browserParams: '?mas.preview=on',
        tags: '@mas-docs @mas-acom @mas-variations @commerce @smoke @regression @milo',
    },
    {
        tcid: '1',
        name: '@MAS-Regional-Variation-in-Collection',
        path: [DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_co, DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_EN],
        data: {
            id: 'e5e40288-6b53-4a40-8cc2-010037b1ab85',
            variation_id: 'a55c1d3b-2024-4489-931e-6966f345b35f',
            subtitle: 'GR regional variation',
        },
        browserParams: '?mas.preview=on',
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
            //reorder
        },
        browserParams: '?mas.preview=on',
        tags: '@mas-docs @mas-acom @mas-variations @commerce @smoke @regression @milo @regional-variation',
    },
    {
        tcid: '3',
        name: '@MAS-Grouped-Variation-of-Collection',
        path: DOCS_GALLERY_PATH.PLANS_COLLECTION.AR_co,
        data: {
            id: 'b5486c6e-34c6-40a4-aa31-37eca4edf35d',
            variation_id: '553aaaa6-9ec5-43fc-9479-d72e0de0d486',
            removed_id: 'reorder',
        },
        browserParams: '?mas.preview=on',
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
        },
        browserParams: '?mas.preview=on',
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
        },
        browserParams: '?mas.preview=on',
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
        },
        browserParams: '?mas.preview=on',
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
        },
        browserParams: '?mas.preview=on',
        tags: '@mas-docs @mas-acom @mas-variations @commerce @smoke @regression @milo @regional-variation',
    },
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
    //     browserParams: '?mas.preview=on',
    //     tags: '@mas-docs @mas-acom @mas-variations @commerce @smoke @regression @milo @regional-variation',
    // },
];
