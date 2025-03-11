export default {
    FeatureName: 'M@S Studio AHome Try Buy Widget',
    features: [
        {
            tcid: '0',
            name: '@studio-try-buy-widget-discard-price',
            path: '/studio.html',
            data: {
                cardid: '2d9025f7-ea56-4eeb-81b2-a52762358b9d',
                price: 'US$79.99/mo',
                newPrice: 'US$79.99/moper license',
            },
            browserParams: '#query=',
            tags: '@mas-studio @ahome @ahome-try-buy-widget @ahome-try-buy-widget-discard',
        },
        {
            tcid: '1',
            name: '@studio-try-buy-widget-discard-variant-change',
            path: '/studio.html',
            data: {
                cardid: '2d9025f7-ea56-4eeb-81b2-a52762358b9d',
            },
            browserParams: '#query=',
            tags: '@mas-studio @ahome @ahome-try-buy-widget @ahome-try-buy-widget-discard',
        },
        {
            tcid: '2',
            name: '@studio-try-buy-widget-discard-change-osi',
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
            tags: '@mas-studio @ccd @ccd-try-buy-widget @ccd-try-buy-widget-discard',
        },
    ],
};
