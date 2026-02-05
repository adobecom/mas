export default {
    FeatureName: 'M@S Studio AHome Try Buy Widget',
    features: [
        {
            tcid: '1',
            name: '@studio-try-buy-widget-edit-discard-bg-color',
            path: '/studio.html',
            data: {
                cardid: '02ee0d3c-a472-44a1-b15a-f65c24eefc4b',
                color: {
                    original: 'gray',
                    updated: 'Transparent',
                },
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @ahome @ahome-edit @ahome-try-buy-widget @ahome-try-buy-widget-edit',
        },
        {
            tcid: '2',
            name: '@studio-try-buy-widget-edit-discard-border-color',
            path: '/studio.html',
            data: {
                cardid: '02ee0d3c-a472-44a1-b15a-f65c24eefc4b',
                color: {
                    original: 'Transparent',
                    updated: 'Gray 700',
                },
                css: {
                    original: 'rgba(0, 0, 0, 0)',
                    updated: 'rgb(80, 80, 80)',
                },
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @ahome @ahome-edit @ahome-try-buy-widget @ahome-try-buy-widget-edit',
        },
        {
            tcid: '5',
            name: '@studio-try-buy-widget-edit-discard-image',
            path: '/studio.html',
            data: {
                cardid: 'a07239e9-7216-403c-b1ee-3b1d0982a64b',
                background: {
                    original: 'https://milo.adobe.com/assets/img/commerce/media_1305cc40709da2533a0133ba8d920662e65925fc1.png',
                    updated: 'https://milo.adobe.com/assets/img/commerce/media_158c1c22b1322dd28d7912d30fb27f29aa79f79b1.png',
                },
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @ahome @ahome-edit @ahome-try-buy-widget @ahome-try-buy-widget-edit',
        },
        {
            tcid: '14',
            name: '@studio-try-buy-widget-edit-discard-product-icon-picker',
            path: '/studio.html',
            data: {
                cardid: '02ee0d3c-a472-44a1-b15a-f65c24eefc4b',
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
            tags: '@mas-studio @ahome @ahome-edit @ahome-try-buy-widget @ahome-try-buy-widget-edit',
        },
        // what is the difference between this and the previous test?
        // {
        //     tcid: '4',
        //     name: '@studio-try-buy-widget-edit-discard-mnemonic',
        //     path: '/studio.html',
        //     data: {
        //         cardid: '02ee0d3c-a472-44a1-b15a-f65c24eefc4b',
        //         icon: {
        //             original: 'https://www.adobe.com/cc-shared/assets/img/product-icons/svg/photoshop.svg',
        //             updated: 'https://www.adobe.com/cc-shared/assets/img/product-icons/svg/illustrator.svg',
        //         },
        //     },
        //     browserParams: '#page=content&path=nala&query=',
        //     tags: '@mas-studio @ahome @ahome-edit @ahome-try-buy-widget @ahome-try-buy-widget-edit',
        // },
    ],
};
