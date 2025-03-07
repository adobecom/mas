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
            tags: '@mas-studio @ahome @ahome-try-buy-widget @ahome-try-buy-widget-discard @nopr',
        },
        {
            tcid: '1',
            name: '@studio-try-buy-widget-discard-variant-change',
            path: '/studio.html',
            data: {
                cardid: '2d9025f7-ea56-4eeb-81b2-a52762358b9d',
            },
            browserParams: '#query=',
            tags: '@mas-studio @ahome @ahome-try-buy-widget @ahome-try-buy-widget-discard @nopr',
        },
    ],
};
