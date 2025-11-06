export default {
    FeatureName: 'M@S Studio Commerce Fries',
    features: [
        {
            tcid: '0',
            name: '@studio-fries-edit-discard-title',
            path: '/studio.html',
            data: {
                cardid: '9620f75c-96cd-4ec3-a431-275a53d8860c',
                title: {
                    original: 'Automation Test Card',
                    updated: 'Change title',
                },
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @commerce @commerce-fries @commerce-fries-edit',
        },
        {
            tcid: '1',
            name: '@studio-fries-edit-discard-description',
            path: '/studio.html',
            data: {
                cardid: '9620f75c-96cd-4ec3-a431-275a53d8860c',
                description: {
                    original: 'MAS repo validation card for Nala tests',
                    updated: 'New Test Description',
                },
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @commerce @commerce-fries @commerce-fries-edit',
        },
        {
            tcid: '2',
            name: '@studio-fries-edit-discard-mnemonic',
            path: '/studio.html',
            data: {
                cardid: '9620f75c-96cd-4ec3-a431-275a53d8860c',
                iconURL: {
                    original: 'https://www.adobe.com/cc-shared/assets/img/product-icons/svg/photoshop.svg',
                    updated: 'https://www.adobe.com/cc-shared/assets/img/product-icons/svg/illustrator.svg',
                },
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @commerce @commerce-fries @commerce-fries-edit',
        },
        {
            tcid: '3',
            name: '@studio-fries-edit-discard-price',
            path: '/studio.html',
            data: {
                cardid: '9620f75c-96cd-4ec3-a431-275a53d8860c',
                price: {
                    original: 'US$17.24/mo',
                    updated: 'US$17.24/moper license',
                },
                strikethroughPrice: {
                    original: 'US$34.49/mo',
                    updated: 'US$34.49/moper license',
                },
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @commerce @commerce-fries @commerce-fries-edit',
        },
        {
            tcid: '4',
            name: '@studio-fries-edit-discard-cta-label',
            path: '/studio.html',
            data: {
                cardid: '9620f75c-96cd-4ec3-a431-275a53d8860c',
                osi: 'A1xn6EL4pK93bWjM8flffQpfEL-bnvtoQKQAvkx574M',
                ctaText: {
                    original: 'Select',
                    updated: 'Buy now',
                },
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @commerce @commerce-fries @commerce-fries-edit',
        },
        {
            tcid: '5',
            name: '@studio-fries-edit-discard-product-icon-picker',
            path: '/studio.html',
            data: {
                cardid: '9620f75c-96cd-4ec3-a431-275a53d8860c',
                productIcon: {
                    name: 'Illustrator',
                    original: {
                        src: 'https://www.adobe.com/cc-shared/assets/img/product-icons/svg/photoshop.svg',
                    },
                    updated: {
                        src: 'https://www.adobe.com/cc-shared/assets/img/product-icons/svg/illustrator.svg',
                    },
                },
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @commerce @commerce-fries @commerce-fries-edit',
        },
    ],
};
