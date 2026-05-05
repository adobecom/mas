export default {
    FeatureName: 'M@S Studio Commerce Fries',
    features: [
        {
            tcid: '0',
            name: '@studio-fries-edit-discard-trial-badge',
            path: '/studio.html',
            data: {
                cardid: '9620f75c-96cd-4ec3-a431-275a53d8860c',
                trialBadge: {
                    original: '7-day free trial',
                    updated: 'Change trial badge',
                },
            },
            browserParams: '#page=fragment-editor&path=nala&fragmentId=',
            tags: '@mas-studio @commerce @commerce-fries @commerce-fries-edit',
        },
        {
            tcid: '1',
            name: '@studio-fries-edit-discard-trial-badge-color',
            path: '/studio.html',
            data: {
                cardid: '9620f75c-96cd-4ec3-a431-275a53d8860c',
                color: {
                    original: 'Green 800',
                    updated: 'Yellow 300',
                },
                colorCSS: {
                    original: 'rgb(7, 147, 85)',
                    updated: 'rgb(255, 222, 44)',
                },
            },
            browserParams: '#page=fragment-editor&path=nala&fragmentId=',
            tags: '@mas-studio @commerce @commerce-fries @commerce-fries-edit',
        },
        {
            tcid: '2',
            name: '@studio-fries-edit-discard-trial-badge-border-color',
            path: '/studio.html',
            data: {
                cardid: '9620f75c-96cd-4ec3-a431-275a53d8860c',
                color: {
                    original: 'Green 800',
                    updated: 'Yellow 300',
                },
                colorCSS: {
                    original: 'rgb(7, 147, 85)',
                    updated: 'rgb(255, 222, 44)',
                },
            },
            browserParams: '#page=fragment-editor&path=nala&fragmentId=',
            tags: '@mas-studio @commerce @commerce-fries @commerce-fries-edit',
        },
    ],
};
