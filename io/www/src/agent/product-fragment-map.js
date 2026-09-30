// Brand Concierge product cards (variant `brand-concierge-product`) in /content/dam/mas/sandbox/en_US.
// The segment is derived from fragment tags:
//   individual: mas:customer_segment/individual + mas:market_segments/com
//   team:       mas:customer_segment/team + mas:market_segments/com
//   edu:        mas:customer_segment/individual + mas:market_segments/edu
const SEGMENTS = ['individual', 'team', 'edu'];

const PRODUCT_FRAGMENT_MAP = {
    'creative cloud pro': {
        individual: '128b6634-6631-4081-a6d9-9a2c7c003414',
        team: '5c3fe2ac-0dbb-4495-9858-feac379ca19b',
        edu: '2b1a6493-e03b-4803-a150-eed983094a05',
    },
    'creative cloud pro plus': {
        team: 'af478a51-949c-49af-b7df-d3b14b5156de',
    },
    photography: {
        individual: '42df425a-e020-469f-bf0f-5b83504dabce',
        team: '0d7c05c5-ff71-43d5-a3b7-bb65ee51642e',
    },
    photoshop: {
        individual: '9941bca0-5304-47f7-aeb3-4f638aeb8791',
        team: 'c2c79d69-8990-44b8-9a86-071c69e4a25a',
        edu: '7f8315df-c95e-4b19-858d-4ecb60f8ab5c',
    },
    illustrator: {
        individual: 'd9f8b8e7-ff8a-4048-b11f-5e23a76f3d12',
        team: '9c6d13e0-49e0-4046-9ff4-185bc4717774',
        edu: '9e637ebd-cc6b-4277-90fd-22c2465dae50',
    },
    indesign: {
        individual: '689468c6-7489-48d9-942c-3621e77c2d8f',
        team: 'd9d74f31-3e77-4b6c-8ff6-6841a716e783',
        edu: 'dfdeea8c-93a2-4b79-bfc7-1ba8f9813246',
    },
    lightroom: {
        individual: '2a86ae74-df04-4faf-96e8-46903aa023bf',
        team: 'ee56ead8-fe04-422f-8423-84ab832d3fd7',
        edu: 'ee314bd3-b9c5-4cb2-a0da-61f35a434952',
    },
    'adobe premiere': {
        individual: 'ea8f1b95-56b1-4665-b859-41ac2961ddcd',
        team: 'd53944f8-20f1-408d-99fb-98f4e2724534',
        edu: '5b902cf1-4eab-4ada-8c5a-823b20900aba',
    },
    'after effects': {
        individual: 'e41c94e5-d89a-4c68-8d15-3c88c638b8e2',
        team: '6e4d5cfc-6d46-4120-8181-a28a1b6e2f57',
        edu: 'a5153480-8a62-42c2-bf6b-199858b87cf3',
    },
    animate: {
        individual: '789e6cc7-e5dd-4fb5-b468-a21a19f4966a',
        team: 'be18b47b-ba1f-4c51-94f3-5d2a22a52df9',
        edu: '05e1677c-2002-487a-b0ce-edb2f4658234',
    },
    audition: {
        individual: 'fdd63a7e-8a02-403e-a5ed-ebd85d585b95',
        team: '07b31d92-e6d0-4b19-8181-02f54956fd33',
        edu: 'd62add94-da44-4386-9cdb-4d501c5f4d36',
    },
    'acrobat studio': {
        individual: '03822008-9d0f-403a-a22c-ee71884c25ef',
        team: 'c777f435-3175-4d94-a461-88a0113b82f6',
    },
    'acrobat pro': {
        individual: '7fef9873-f153-4354-a3c0-4e6fa98b42f9',
        team: 'db695a1a-61a6-403f-b847-c684cbf4ae0e',
    },
    'acrobat standard': {
        individual: '3d79b0d1-1c88-440f-a596-e503388036be',
        team: 'ec9fed2e-eaa2-4c6c-b06b-b55762362de7',
        edu: '43ca7ed5-0754-431d-a7c2-31e5656d0a31',
    },
    'acrobat express': {
        individual: '7490cc4e-4064-4152-af18-29d37aa308c5',
        team: 'a5b6556b-0542-405c-9de9-6baa596f1743',
    },
    'ai assistant for acrobat': {
        individual: '3345c485-af93-4fef-97d1-bbc10f3b03eb',
        team: '9ac1751b-4b73-4e1e-bc92-797de6d93cf9',
    },
    'adobe substance 3d collection': {
        individual: '99a79b2f-0fc0-44c6-822f-b5c3e3098ffc',
        team: '6375d22a-bdf1-4d5b-8769-3e4ddc635e61',
    },
    'adobe substance 3d texturing': {
        individual: 'cab214a9-9f95-4308-aeb2-ff58ff177d06',
    },
    'adobe firefly pro': {
        individual: '95c664e4-f605-41df-8f9c-4779d0ef58c5',
    },
    'frame.io': {
        team: 'ee2636e6-0ecc-49df-9a01-69ffd0558f74',
    },
};

function resolveProduct(productName) {
    if (!productName) return undefined;
    return PRODUCT_FRAGMENT_MAP[productName.trim().toLowerCase()];
}

export { PRODUCT_FRAGMENT_MAP, SEGMENTS, resolveProduct };
