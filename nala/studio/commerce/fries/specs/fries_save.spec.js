export default {
    FeatureName: 'M@S Studio Commerce Fries',
    features: [
        {
            tcid: '0',
            name: '@studio-fries-save-edited-RTE-fields',
            path: '/studio.html',
            data: {
                cardid: 'c0a37a89-c3e7-4bdb-a298-c43b89e2a781',
                title: {
                    original: 'Field Edit & Save',
                    updated: 'Cloned Field Edit',
                },
                description: {
                    original: 'Get Lightroom, Lightroom Classic, Photoshop, and 20GB of cloud storage.',
                    updated: 'New Test Description',
                },
                iconURL: {
                    original: 'https://www.adobe.com/content/dam/shared/images/product-icons/svg/photoshop.svg',
                    updated: 'https://www.adobe.com/content/dam/shared/images/product-icons/svg/illustrator.svg',
                },
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @commerce @commerce-fries @commerce-fries-save',
        },
        {
            tcid: '1',
            name: '@studio-fries-save-edited-price',
            path: '/studio.html',
            data: {
                cardid: 'c0a37a89-c3e7-4bdb-a298-c43b89e2a781',
                price: 'US$17.24/mo',
                strikethroughPrice: 'US$34.49/mo',
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @commerce @commerce-fries @commerce-fries-save',
        },
        {
            tcid: '2',
            name: '@studio-fries-save-edited-cta-label',
            path: '/studio.html',
            data: {
                cardid: 'c0a37a89-c3e7-4bdb-a298-c43b89e2a781',
                ctaText: {
                    original: 'Select',
                    updated: 'Buy now',
                },
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @commerce @commerce-fries @commerce-fries-save',
        },
    ],
};
