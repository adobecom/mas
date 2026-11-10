import { PRICE_PATTERN, DOCS_GALLERY_PATH } from '../../../utils/commerce.js';

export const FeatureName = 'Merch Acom Pro Cards Feature';

const PHOTOSHOP = 'f6f140b3-b233-412a-8b93-d3e589da7fa5';
const EDU = '7294c9d9-8d73-49b0-b632-b391a50afa25';
const COLLECTION = '46aa73f5-0122-4309-9f64-c9192ec83e40';

export const features = [
    {
        tcid: '0',
        name: '@MAS-Pro',
        path: DOCS_GALLERY_PATH.PRO,
        data: {
            id: PHOTOSHOP,
            title: 'Photoshop',
            subtitle: 'Image editing',
            description: 'Create gorgeous images, rich graphics, and incredible art.',
            price: PRICE_PATTERN.US.mo,
            planTypeText: 'Annual, billed monthly',
            ctas: ['Free trial', 'Learn more'],
            iconUrl: 'photoshop.svg',
            whatsIncludedSections: ['Apps', 'Creative AI', 'Extras'],
        },
        tags: '@mas-docs @mas-acom @mas-pro-card @commerce @smoke @regression @milo',
    },
    {
        tcid: '1',
        name: '@MAS-Pro-CSS',
        path: DOCS_GALLERY_PATH.PRO,
        data: { id: PHOTOSHOP },
        tags: '@mas-docs @mas-acom @mas-pro-card @commerce @regression @milo',
    },
    {
        tcid: '2',
        name: '@MAS-Pro-Edu',
        path: DOCS_GALLERY_PATH.PRO,
        data: {
            id: EDU,
            title: 'Creative Cloud Pro',
            subtitle: 'All-in-one toolkit',
            price: PRICE_PATTERN.US.mo,
            ctas: ['Free trial', 'Buy now'],
            savingsTitle: 'Students and teachers save 71% for the first year.',
            label: /What.s Included/,
            disclaimer: 'Available for qualified students and teachers only.',
        },
        tags: '@mas-docs @mas-acom @mas-pro-card @commerce @smoke @regression @milo',
    },
    {
        tcid: '3',
        name: '@MAS-Pro-Edu-CSS',
        path: DOCS_GALLERY_PATH.PRO,
        data: { id: EDU },
        tags: '@mas-docs @mas-acom @mas-pro-card @commerce @regression @milo',
    },
    {
        tcid: '4',
        name: '@MAS-Pro-Grid',
        path: DOCS_GALLERY_PATH.PRO,
        data: {
            grids: [
                { selector: '.one-merch-card.pro-grid', cards: 1 },
                { selector: '.two-merch-cards.pro-grid', cards: 2 },
                { selector: '.three-merch-cards.pro-grid', cards: 3 },
                { selector: '.four-merch-cards.pro-grid', cards: 4 },
            ],
        },
        tags: '@mas-docs @mas-acom @mas-pro-card @regression @milo',
    },
    {
        tcid: '5',
        name: '@MAS-Pro-Collection',
        path: DOCS_GALLERY_PATH.PRO,
        data: {
            id: COLLECTION,
            cardCount: 4,
            firstCardTitle: 'Lightroom',
            lastCardTitle: 'Creative Cloud Pro',
        },
        tags: '@mas-docs @mas-acom @mas-pro-card @commerce @regression @milo',
    },
];
