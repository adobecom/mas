export default {
    FeatureName: 'M@S Studio CCD Slice',
    features: [
        {
            tcid: '0',
            name: '@studio-slice-save-variant-change-to-suggested',
            path: '/studio.html',
            data: {
                cardid: '478f4f3f-0db4-461b-bf89-a7059fb9655c',
                osi: 'A1xn6EL4pK93bWjM8flffQpfEL-bnvtoQKQAvkx574M',
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @ccd @ccd-save @ccd-slice @ccd-slice-save',
        },
        // leave only background here
        {
            tcid: '2',
            name: '@studio-slice-save-edited-RTE-fields',
            path: '/studio.html',
            data: {
                cardid: '478f4f3f-0db4-461b-bf89-a7059fb9655c',
                description: 'Cloned Field Edit',
                badge: 'New Badge',
                iconURL: 'https://www.adobe.com/cc-shared/assets/img/product-icons/svg/illustrator.svg',
                backgroundURL: 'https://milo.adobe.com/assets/img/commerce/media_158c1c22b1322dd28d7912d30fb27f29aa79f79b1.png',
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @ccd @ccd-save @ccd-slice @ccd-slice-save',
        },
        {
            tcid: '4',
            name: '@studio-slice-save-edited-cta-link',
            path: '/studio.html',
            data: {
                cardid: '478f4f3f-0db4-461b-bf89-a7059fb9655c',
                cta: {
                    text: 'Buy now 2',
                    variant: 'primary-outline',
                    css: {
                        color: 'rgb(34, 34, 34)',
                    },
                },
                checkoutParams: {
                    mv: '1',
                    promoid: 'ABC123',
                    mv2: '2',
                },
                daaLL: 'buy-now-1',
                analyticsID: 'save-now',
                daaLL: 'save-now-1',
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @ccd @ccd-save @ccd-slice @ccd-slice-save',
        },
    ],
};
