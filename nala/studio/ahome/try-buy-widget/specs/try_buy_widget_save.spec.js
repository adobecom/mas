export default {
    FeatureName: 'M@S Studio AHome Try Buy Widget',
    features: [
        {
            tcid: '0',
            name: '@studio-try-buy-widget-save-edited-size',
            path: '/studio.html',
            data: {
                cardid: '2d9025f7-ea56-4eeb-81b2-a52762358b9d',
                price: 'US$89.99/mo',
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @ahome @ahome-try-buy-widget @ahome-try-buy-widget-save',
        },
        {
            tcid: '1',
            name: '@studio-try-buy-widget-save-edited-variant-change-to-slice',
            path: '/studio.html',
            data: {
                cardid: '2d9025f7-ea56-4eeb-81b2-a52762358b9d',
                osi: 'Mutn1LYoGojkrcMdCLO7LQlx1FyTHw27ETsfLv0h8DQ',
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @ahome @ahome-try-buy-widget @ahome-try-buy-widget-save',
        },
        {
            tcid: '2',
            name: '@studio-try-buy-widget-save-variant-change-to-suggested',
            path: '/studio.html',
            data: {
                cardid: '2d9025f7-ea56-4eeb-81b2-a52762358b9d',
                osi: 'Mutn1LYoGojkrcMdCLO7LQlx1FyTHw27ETsfLv0h8DQ',
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @ahome @ahome-try-buy-widget @ahome-try-buy-widget-save',
        },
        {
            tcid: '3',
            name: '@studio-try-buy-widget-save-edited-osi',
            path: '/studio.html',
            data: {
                cardid: '2d9025f7-ea56-4eeb-81b2-a52762358b9d',
                osi: {
                    original: 'Mutn1LYoGojkrcMdCLO7LQlx1FyTHw27ETsfLv0h8DQ',
                    updated: '1RwmqQ0NVsrtYr1bj05lZCJBavU6JGa67djrwKE8k8o',
                },
                osiTags: {
                    original: {
                        productCodeTag: 'product_code/ccsn',
                        offerTypeTag: 'offer_type/base',
                        marketSegmentsTag: 'market_segments/com',
                        planTypeTag: 'plan_type/abm',
                    },
                    updated: {
                        offerTypeTag: 'offer_type/trial',
                        marketSegmentsTag: 'market_segments/edu',
                        planTypeTag: 'plan_type/puf',
                    },
                },
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @ahome @ahome-try-buy-widget @ahome-try-buy-widget-save',
        },
        {
            tcid: '4',
            name: '@studio-try-buy-widget-save-edited-cta-variant',
            path: '/studio.html',
            data: {
                cardid: '2d9025f7-ea56-4eeb-81b2-a52762358b9d',
                osi: 'Mutn1LYoGojkrcMdCLO7LQlx1FyTHw27ETsfLv0h8DQ',
                variant: {
                    original: 'secondary',
                    updated: 'secondary-outline',
                },
                ctaCSS: {
                    original: {
                        'background-color': 'rgb(230, 230, 230)',
                        color: 'rgb(34, 34, 34)',
                    },
                    updated: {
                        'background-color': 'rgba(0, 0, 0, 0)',
                        color: 'rgb(34, 34, 34)',
                    },
                },
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @ahome @ahome-try-buy-widget @ahome-try-buy-widget-save',
        },
        {
            tcid: '5',
            name: '@studio-try-buy-widget-save-edited-cta-checkout-params',
            path: '/studio.html',
            data: {
                cardid: '2d9025f7-ea56-4eeb-81b2-a52762358b9d',
                osi: 'Mutn1LYoGojkrcMdCLO7LQlx1FyTHw27ETsfLv0h8DQ',
                checkoutParams: {
                    mv: '1',
                    promoid: 'ABC123',
                    mv2: '2',
                },
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @ahome @ahome-try-buy-widget @ahome-try-buy-widget-save',
        },
        {
            tcid: '6',
            name: '@studio-try-buy-widget-save-edited-analytics-ids',
            path: '/studio.html',
            data: {
                cardid: '2d9025f7-ea56-4eeb-81b2-a52762358b9d',
                analyticsID: {
                    original: 'free-trial',
                    updated: 'save-now',
                },
                daaLL: {
                    original: 'free-trial-1',
                    updated: 'save-now-1',
                },
                daaLH: 'ccsn',
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @ahome @try-buy-widget @try-buy-widget-save',
        },
    ],
};
