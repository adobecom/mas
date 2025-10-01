export default {
    FeatureName: 'M@S Studio AHome Promoted Plans',
    features: [
        {
            tcid: '0',
            name: '@studio-promoted-plans-save-edited-border',
            path: '/studio.html',
            data: {
                cardid: '2cf0ed0e-84ea-4bd4-8e89-ddf527a7a75b',
                border: {
                    original: {
                        color: 'gradient',
                        cssColor: 'linear-gradient(135deg, #ff4885 0%, #b272eb 50%, #5d89ff 100%)',
                    },
                    updated: {
                        color: 'Transparent',
                        cssColor: 'Transparent',
                    },
                },
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @ahome @ahome-save @ahome-promoted-plans @ahome-promoted-plans-save',
        },
        {
            tcid: '1',
            name: '@studio-promoted-plans-save-variant-change',
            path: '/studio.html',
            data: {
                cardid: '2cf0ed0e-84ea-4bd4-8e89-ddf527a7a75b',
                osi: 'Mutn1LYoGojkrcMdCLO7LQlx1FyTHw27ETsfLv0h8DQ',
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @ahome @ahome-save @ahome-promoted-plans @ahome-promoted-plans-save',
        },
        {
            tcid: '2',
            name: '@studio-promoted-plans-save-edited-cta-variant',
            path: '/studio.html',
            data: {
                cardid: '2cf0ed0e-84ea-4bd4-8e89-ddf527a7a75b',
                osi: 'Mutn1LYoGojkrcMdCLO7LQlx1FyTHw27ETsfLv0h8DQ',
                variant: {
                    original: 'accent',
                    updated: 'primary',
                },
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @ahome @ahome-save @ahome-promoted-plans @ahome-promoted-plans-save',
        },
        {
            tcid: '3',
            name: '@studio-promoted-plans-save-edited-analytics-ids',
            path: '/studio.html',
            data: {
                cardid: '2cf0ed0e-84ea-4bd4-8e89-ddf527a7a75b',
                analyticsID: {
                    original: 'buy-now',
                    updated: 'save-now',
                },
                daaLL: {
                    original: 'buy-now-2',
                    updated: 'save-now-2',
                },
                daaLH: 'ccsn',
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @ahome @ahome-save @ahome-promoted-plans @ahome-promoted-plans-save',
        },
    ],
};
