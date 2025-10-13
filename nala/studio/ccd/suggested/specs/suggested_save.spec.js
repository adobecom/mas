export default {
    FeatureName: 'M@S Studio CCD Suggested',
    features: [
        {
            tcid: '0',
            name: '@studio-suggested-remove-correct-fragment',
            path: '/studio.html',
            data: {
                cardid: 'cc85b026-240a-4280-ab41-7618e65daac4',
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @ccd @ccd-save @ccd-suggested @ccd-suggested-save',
        },
        {
            tcid: '1',
            name: '@studio-suggested-save-variant-change-to-slice',
            path: '/studio.html',
            data: {
                cardid: 'cc85b026-240a-4280-ab41-7618e65daac4',
                osi: 'A1xn6EL4pK93bWjM8flffQpfEL-bnvtoQKQAvkx574M',
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @ccd @ccd-save @ccd-suggested @ccd-suggested-save',
        },
        {
            tcid: '2',
            name: '@studio-suggested-save-variant-change-to-trybuywidget',
            path: '/studio.html',
            data: {
                cardid: 'cc85b026-240a-4280-ab41-7618e65daac4',
                osi: 'A1xn6EL4pK93bWjM8flffQpfEL-bnvtoQKQAvkx574M',
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @ccd @ccd-save @ccd-suggested @ccd-suggested-save',
        },
        {
            tcid: '3',
            name: '@studio-suggested-save-edited-RTE-fields',
            path: '/studio.html',
            data: {
                cardid: 'cc85b026-240a-4280-ab41-7618e65daac4',
                title: 'Cloned Field Edit',
                subtitle: 'New Subtitle',
                iconURL: 'https://www.adobe.com/content/dam/shared/images/product-icons/svg/illustrator.svg',
                description: 'New Test Description',
                backgroundURL: 'https://milo.adobe.com/assets/img/commerce/media_1d63dab9ee1edbf371d6f0548516c9e12b3ea3ff4.png',
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @ccd @ccd-save @ccd-suggested @ccd-suggested-save',
        },
        {
            tcid: '4',
            name: '@studio-suggested-save-edited-price',
            path: '/studio.html',
            data: {
                cardid: 'cc85b026-240a-4280-ab41-7618e65daac4',
                price: 'US$17.24/mo',
                strikethroughPrice: 'US$34.49/mo',
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @ccd @ccd-save @ccd-suggested @ccd-suggested-save',
        },
        {
            tcid: '5',
            name: '@studio-suggested-save-edited-cta-link',
            path: '/studio.html',
            data: {
                cardid: 'cc85b026-240a-4280-ab41-7618e65daac4',
                osi: 'A1xn6EL4pK93bWjM8flffQpfEL-bnvtoQKQAvkx574M',
                cta: {
                    text: 'Buy now 2',
                    variant: 'accent',
                    css: {
                        'background-color': 'rgb(2, 101, 220)',
                        color: 'rgb(255, 255, 255)',
                    },
                },
                checkoutParams: {
                    mv: '1',
                    promoid: 'ABC123',
                    mv2: '2',
                },
                analyticsID: 'save-now',
                daaLL: 'save-now-1',
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @ccd @ccd-save @ccd-suggested @ccd-suggested-save',
        },
        {
            tcid: '6',
            name: '@studio-suggested-save-edited-osi',
            path: '/studio.html',
            data: {
                cardid: 'cc85b026-240a-4280-ab41-7618e65daac4',
                osi: {
                    original: 'A1xn6EL4pK93bWjM8flffQpfEL-bnvtoQKQAvkx574M',
                    updated: '1RwmqQ0NVsrtYr1bj05lZCJBavU6JGa67djrwKE8k8o',
                },
                osiTags: {
                    original: {
                        productCodeTag: 'product_code/phsp',
                        offerTypeTag: 'offer_type/base',
                        marketSegmentsTag: 'market_segments/com',
                        planTypeTag: 'plan_type/abm',
                    },
                    updated: {
                        productCodeTag: 'product_code/ccsn',
                        planTypeTag: 'plan_type/puf',
                        offerTypeTag: 'offer_type/trial',
                        marketSegmentsTag: 'market_segments/edu',
                    },
                },
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @ccd @ccd-save @ccd-suggested @ccd-suggested-save',
        },
    ],
};
