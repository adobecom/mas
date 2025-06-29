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
            browserParams: '#query=',
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
            browserParams: '#query=',
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
            browserParams: '#query=',
            tags: '@mas-studio @ahome @ahome-try-buy-widget @ahome-try-buy-widget-save',
        },
        {
            tcid: '3',
            name: '@studio-try-buy-widget-save-edited-osi',
            path: '/studio.html',
            data: {
                cardid: '2d9025f7-ea56-4eeb-81b2-a52762358b9d',
                osi: 'Mutn1LYoGojkrcMdCLO7LQlx1FyTHw27ETsfLv0h8DQ',
                productCodeTag: 'product_code/ccsn',
                offerTypeTag: 'offer_type/base',
                marketSegmentsTag: 'market_segments/com',
                planTypeTag: 'plan_type/abm',
                newosi: '1RwmqQ0NVsrtYr1bj05lZCJBavU6JGa67djrwKE8k8o',
                newPlanTypeTag: 'plan_type/puf',
                newOfferTypeTag: 'offer_type/trial',
                newMarketSegmentsTag: 'market_segments/edu',
            },
            browserParams: '#query=',
            tags: '@mas-studio @ahome @ahome-try-buy-widget @ahome-try-buy-widget-save',
        },
        {
            tcid: '4',
            name: '@studio-try-buy-widget-save-edited-cta-variant',
            path: '/studio.html',
            data: {
                cardid: '2d9025f7-ea56-4eeb-81b2-a52762358b9d',
                osi: 'Mutn1LYoGojkrcMdCLO7LQlx1FyTHw27ETsfLv0h8DQ',
                variant: 'secondary',
                ctaCSS: {
                    'background-color': 'rgb(230, 230, 230)',
                    color: 'rgb(34, 34, 34)',
                },
                newVariant: 'secondary-outline',
                newCtaCSS: {
                    'background-color': 'rgba(0, 0, 0, 0)',
                    color: 'rgb(34, 34, 34)',
                },
            },
            browserParams: '#query=',
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
            browserParams: '#query=',
            tags: '@mas-studio @ahome @ahome-try-buy-widget @ahome-try-buy-widget-save',
        },
        {
            tcid: '6',
            name: '@studio-try-buy-widget-save-edited-analytics-ids',
            path: '/studio.html',
            data: {
                cardid: '2d9025f7-ea56-4eeb-81b2-a52762358b9d',
                analyticsID: 'free-trial',
                daaLL: 'free-trial-1',
                daaLH: 'ccsn',
                newAnalyticsID: 'save-now',
                newDaaLL: 'save-now-1',
            },
            browserParams: '#query=',
            tags: '@mas-studio @ahome @try-buy-widget @try-buy-widget-save',
        },
    ],
};
