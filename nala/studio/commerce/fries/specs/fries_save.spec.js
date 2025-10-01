export default {
    FeatureName: 'M@S Studio Commerce Fries',
    features: [
        {
            tcid: '0',
            name: '@studio-fries-save-edited-RTE-fields',
            path: '/studio.html',
            data: {
                cardid: '9620f75c-96cd-4ec3-a431-275a53d8860c',
                title: {
                    original: 'Field Edit & Save',
                    updated: 'Cloned Field Edit',
                },
                description: {
                    original: 'MAS repo validation card for Nala tests',
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
                cardid: '9620f75c-96cd-4ec3-a431-275a53d8860c',
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
                cardid: '9620f75c-96cd-4ec3-a431-275a53d8860c',
                ctaText: {
                    original: 'Buy now',
                    updated: 'Buy now 2',
                },
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @commerce @commerce-fries @commerce-fries-save',
        },
    ],
};
