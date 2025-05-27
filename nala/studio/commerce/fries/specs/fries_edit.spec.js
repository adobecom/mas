export default {
    FeatureName: 'M@S Studio Commerce Fries',
    features: [
        {
            tcid: '0',
            name: '@studio-fries-edit-title',
            path: '/studio.html',
            data: {
                cardid: '26f091c2-995d-4a96-a193-d62f6c73af2f',
                title: 'Automation Test Card',
                newTitle: 'Change title',
            },
            browserParams: '#query=',
            tags: '@mas-studio @commerce @commerce-fries @commerce-fries-edit',
        },
        {
            tcid: '1',
            name: '@studio-fries-edit-description',
            path: '/studio.html',
            data: {
                cardid: '26f091c2-995d-4a96-a193-d62f6c73af2f',
                description: 'MAS repo validation card for Nala tests',
                newDescription: 'New Test Description',
            },
            browserParams: '#query=',
            tags: '@mas-studio @commerce @commerce-fries @commerce-fries-edit',
        },
        {
            tcid: '2',
            name: '@studio-fries-edit-mnemonic',
            path: '/studio.html',
            data: {
                cardid: '26f091c2-995d-4a96-a193-d62f6c73af2f',
                iconURL:
                    'https://www.adobe.com/content/dam/shared/images/product-icons/svg/photoshop.svg',
                newIconURL:
                    'https://www.adobe.com/content/dam/shared/images/product-icons/svg/illustrator.svg',
            },
            browserParams: '#query=',
            tags: '@mas-studio @commerce @commerce-fries @commerce-fries-edit',
        },
        {
            tcid: '3',
            name: '@studio-fries-edit-price',
            path: '/studio.html',
            data: {
                cardid: '26f091c2-995d-4a96-a193-d62f6c73af2f',
                price: 'US$17.24/mo',
                strikethroughPrice: 'US$34.49/mo',
                newPrice: 'US$17.24/moper license',
                newStrikethroughPrice: 'US$34.49/moper license',
            },
            browserParams: '#query=',
            tags: '@mas-studio @commerce @commerce-fries @commerce-fries-edit',
        },
        {
            tcid: '4',
            name: '@studio-fries-edit-cta-label',
            path: '/studio.html',
            data: {
                cardid: '26f091c2-995d-4a96-a193-d62f6c73af2f',
                osi: 'A1xn6EL4pK93bWjM8flffQpfEL-bnvtoQKQAvkx574M',
                ctaText: 'Buy now',
                newCtaText: 'Buy now 2',
            },
            browserParams: '#query=',
            tags: '@mas-studio @commerce @commerce-fries @commerce-fries-edit',
        },
    ],
};
