export default {
    FeatureName: 'M@S Studio AHome Promoted Plans',
    features: [
        {
            tcid: '0',
            name: '@studio-promoted-plans-save-edited-border',
            path: '/studio.html',
            data: {
                cardid: '2cf0ed0e-84ea-4bd4-8e89-ddf527a7a75b',
                initialBorderColor: 'gradient',
                initialBorderCSSColor:
                    'linear-gradient(135deg, #ff4885 0%, #b272eb 50%, #5d89ff 100%)',
                transparentBorderColor: 'Transparent',
                transparentBorderCSSColor: 'Transparent',
            },
            browserParams: '#query=',
            tags: '@mas-studio @ahome @ahome-promoted-plans @ahome-promoted-plans-save @nopr',
        },
        {
            tcid: '1',
            name: '@studio-promoted-plans-save-variant-change',
            path: '/studio.html',
            data: {
                cardid: '2cf0ed0e-84ea-4bd4-8e89-ddf527a7a75b',
                osi: 'Mutn1LYoGojkrcMdCLO7LQlx1FyTHw27ETsfLv0h8DQ',
            },
            browserParams: '#query=',
            tags: '@mas-studio @ahome @ahome-promoted-plans @ahome-promoted-plans-save',
        },
        {
            tcid: '2',
            name: '@studio-promoted-plans-save-edited-cta-variant',
            path: '/studio.html',
            data: {
                cardid: '2cf0ed0e-84ea-4bd4-8e89-ddf527a7a75b',
                osi: 'Mutn1LYoGojkrcMdCLO7LQlx1FyTHw27ETsfLv0h8DQ',
                variant: 'accent',
                newVariant: 'primary',
            },
            browserParams: '#query=',
            tags: '@mas-studio @ahome @ahome-promoted-plans @ahome-promoted-plans-save',
        },
        {
            tcid: '3',
            name: '@studio-promoted-plans-save-edited-analytics-ids',
            path: '/studio.html',
            data: {
                cardid: '2cf0ed0e-84ea-4bd4-8e89-ddf527a7a75b',
                analyticsID: 'buy-now',
                daaLL: 'buy-now-2',
                daaLH: 'CCSN',
                newAnalyticsID: 'save-now',
                newDaaLL: 'save-now-2',
            },
            browserParams: '#query=',
            tags: '@mas-studio @ahome @promoted-plans @promoted-plans-save',
        },
    ],
};
