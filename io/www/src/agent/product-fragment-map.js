// Brand Concierge product cards (variant `brand-concierge-product`) in /content/dam/mas/brand-concierge/en_US.
// The segment is derived from fragment tags:
//   individual: mas:customer_segment/individual + mas:market_segments/com
//   team:       mas:customer_segment/team + mas:market_segments/com
//   edu:        mas:customer_segment/individual + mas:market_segments/edu
const PRODUCT_FRAGMENT_MAP = {
    individual: {
        default: '128b6634-6631-4081-a6d9-9a2c7c003414',
        products: {
            'creative cloud pro': '128b6634-6631-4081-a6d9-9a2c7c003414',
            photography: '42df425a-e020-469f-bf0f-5b83504dabce',
            photoshop: '9941bca0-5304-47f7-aeb3-4f638aeb8791',
            illustrator: 'd9f8b8e7-ff8a-4048-b11f-5e23a76f3d12',
            indesign: '689468c6-7489-48d9-942c-3621e77c2d8f',
            lightroom: '2a86ae74-df04-4faf-96e8-46903aa023bf',
            'adobe premiere': 'ea8f1b95-56b1-4665-b859-41ac2961ddcd',
            'after effects': 'e41c94e5-d89a-4c68-8d15-3c88c638b8e2',
            animate: '789e6cc7-e5dd-4fb5-b468-a21a19f4966a',
            audition: 'fdd63a7e-8a02-403e-a5ed-ebd85d585b95',
            'acrobat studio': '03822008-9d0f-403a-a22c-ee71884c25ef',
            'acrobat pro': '7fef9873-f153-4354-a3c0-4e6fa98b42f9',
            'acrobat standard': '3d79b0d1-1c88-440f-a596-e503388036be',
            'acrobat express': '7490cc4e-4064-4152-af18-29d37aa308c5',
            'ai assistant for acrobat': '3345c485-af93-4fef-97d1-bbc10f3b03eb',
            'adobe substance 3d collection': '99a79b2f-0fc0-44c6-822f-b5c3e3098ffc',
            'adobe substance 3d texturing': 'cab214a9-9f95-4308-aeb2-ff58ff177d06',
            'adobe firefly pro': '95c664e4-f605-41df-8f9c-4779d0ef58c5',
        },
    },
    team: {
        default: '5c3fe2ac-0dbb-4495-9858-feac379ca19b',
        products: {
            'creative cloud pro': '5c3fe2ac-0dbb-4495-9858-feac379ca19b',
            'creative cloud pro plus': 'af478a51-949c-49af-b7df-d3b14b5156de',
            photoshop: 'c2c79d69-8990-44b8-9a86-071c69e4a25a',
            illustrator: '9c6d13e0-49e0-4046-9ff4-185bc4717774',
            indesign: 'd9d74f31-3e77-4b6c-8ff6-6841a716e783',
            lightroom: 'ee56ead8-fe04-422f-8423-84ab832d3fd7',
            'adobe premiere': 'd53944f8-20f1-408d-99fb-98f4e2724534',
            'after effects': '6e4d5cfc-6d46-4120-8181-a28a1b6e2f57',
            animate: 'be18b47b-ba1f-4c51-94f3-5d2a22a52df9',
            audition: '07b31d92-e6d0-4b19-8181-02f54956fd33',
            'acrobat studio': 'c777f435-3175-4d94-a461-88a0113b82f6',
            'acrobat pro': 'db695a1a-61a6-403f-b847-c684cbf4ae0e',
            'acrobat standard': 'ec9fed2e-eaa2-4c6c-b06b-b55762362de7',
            'acrobat express': 'a5b6556b-0542-405c-9de9-6baa596f1743',
            'ai assistant for acrobat': '9ac1751b-4b73-4e1e-bc92-797de6d93cf9',
            'adobe substance 3d collection': '6375d22a-bdf1-4d5b-8769-3e4ddc635e61',
            'frame.io': 'ee2636e6-0ecc-49df-9a01-69ffd0558f74',
        },
    },
    edu: {
        default: '2b1a6493-e03b-4803-a150-eed983094a05',
        products: {},
    },
};

const SEGMENTS = Object.keys(PRODUCT_FRAGMENT_MAP);

function resolveFragmentId(productName, segment = 'individual') {
    const { default: defaultFragmentId, products } = PRODUCT_FRAGMENT_MAP[segment];
    const product = productName.trim().toLowerCase();
    return Object.hasOwn(products, product) ? products[product] : defaultFragmentId;
}

export { PRODUCT_FRAGMENT_MAP, SEGMENTS, resolveFragmentId };
