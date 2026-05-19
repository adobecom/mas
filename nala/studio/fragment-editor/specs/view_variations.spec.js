export default {
    FeatureName: 'M@S Studio View Variations Navigation',
    features: [
        {
            tcid: '0',
            name: '@studio-view-variations-from-parent-editor',
            path: '/studio.html',
            data: {
                parentCardId: 'd7393fa0-f1f0-457c-af4b-aa9dc3fa1017',
            },
            browserParams: '#page=fragment-editor&path=nala&fragmentId=',
            tags: '@mas-studio @fragment-editor @view-variations',
        },
        {
            tcid: '1',
            name: '@studio-view-variations-from-variation-editor',
            path: '/studio.html',
            data: {
                parentCardId: 'd7393fa0-f1f0-457c-af4b-aa9dc3fa1017',
                variationCardId: '9f150a53-91fb-4afa-9802-812ba09d8158',
            },
            browserParams: '#page=fragment-editor&path=nala&fragmentId=',
            tags: '@mas-studio @fragment-editor @view-variations',
        },
        {
            tcid: '2',
            name: '@studio-view-variations-clear-filter',
            path: '/studio.html',
            data: {
                parentCardId: 'd7393fa0-f1f0-457c-af4b-aa9dc3fa1017',
            },
            browserParams: '#page=fragment-editor&path=nala&fragmentId=',
            tags: '@mas-studio @fragment-editor @view-variations',
        },
        {
            tcid: '3',
            name: '@studio-view-variations-deep-link',
            path: '/studio.html',
            data: {
                parentCardId: 'd7393fa0-f1f0-457c-af4b-aa9dc3fa1017',
            },
            browserParams: '#page=content&query=',
            tags: '@mas-studio @fragment-editor @view-variations',
        },
        {
            tcid: '4',
            name: '@studio-view-variations-unreachable-parent',
            path: '/studio.html',
            data: {
                unreachableId: '00000000-0000-0000-0000-000000000000',
            },
            browserParams: '#page=content&query=',
            tags: '@mas-studio @fragment-editor @view-variations',
        },
    ],
};
