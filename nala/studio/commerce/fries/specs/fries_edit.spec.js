export default {
    FeatureName: 'M@S Studio Commerce Fries',
    features: [
        {
            tcid: '0',
            name: '@studio-fries-edit-title',
            path: '/studio.html',
            data: {
                cardid: '9620f75c-96cd-4ec3-a431-275a53d8860c',
                title: 'Automation Test Card',
                newTitle: 'Change title',
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @commerce @commerce-fries @commerce-fries-edit',
        },
        {
            tcid: '1',
            name: '@studio-fries-edit-description',
            path: '/studio.html',
            data: {
                cardid: '9620f75c-96cd-4ec3-a431-275a53d8860c',
                description: 'MAS repo validation card for Nala tests',
                newDescription: 'New Test Description',
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @commerce @commerce-fries @commerce-fries-edit',
        },
        {
            tcid: '2',
            name: '@studio-fries-edit-mnemonic',
            path: '/studio.html',
            data: {
                cardid: '9620f75c-96cd-4ec3-a431-275a53d8860c',
                iconURL: 'https://www.adobe.com/content/dam/shared/images/product-icons/svg/photoshop.svg',
                newIconURL: 'https://www.adobe.com/content/dam/shared/images/product-icons/svg/illustrator.svg',
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @commerce @commerce-fries @commerce-fries-edit',
        },
        {
            tcid: '3',
            name: '@studio-fries-edit-price',
            path: '/studio.html',
            data: {
                cardid: '9620f75c-96cd-4ec3-a431-275a53d8860c',
                price: 'US$17.24/mo',
                strikethroughPrice: 'US$34.49/mo',
                newPrice: 'US$17.24/moper license',
                newStrikethroughPrice: 'US$34.49/moper license',
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @commerce @commerce-fries @commerce-fries-edit',
        },
        {
            tcid: '4',
            name: '@studio-fries-edit-cta-label',
            path: '/studio.html',
            data: {
                cardid: '9620f75c-96cd-4ec3-a431-275a53d8860c',
                osi: 'A1xn6EL4pK93bWjM8flffQpfEL-bnvtoQKQAvkx574M',
                ctaText: 'Buy now',
                newCtaText: 'Buy now 2',
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @commerce @commerce-fries @commerce-fries-edit',
        },
    ],
};
