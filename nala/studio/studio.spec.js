export default {
    FeatureName: 'M@S Studio',
    features: [
        {
            tcid: '0',
            name: '@studio-load',
            path: '/studio.html',
            tags: '@mas-studio @monitor',
        },
        {
            tcid: '1',
            name: '@studio-direct-search',
            path: '/studio.html',
            data: {
                cardid: '206a8742-0289-4196-92d4-ced99ec4191e',
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio',
        },
        {
            tcid: '2',
            name: '@studio-search-field',
            path: '/studio.html',
            data: {
                cardid: '206a8742-0289-4196-92d4-ced99ec4191e',
            },
            browserParams: '#path=nala&page=content',
            tags: '@mas-studio',
        },
        {
            tcid: '3',
            name: '@studio-empty-card',
            path: '/studio.html',
            data: {
                cardid: '0bf35134-e5e4-4664-88d9-4b78203bf625',
            },
            browserParams: '#path=nala&page=content',
            tags: '@mas-studio',
        },
        {
            tcid: '4',
            name: '@studio-goto-content',
            path: '/studio.html',
            tags: '@mas-studio @monitor',
        },
        {
            tcid: '5',
            name: '@studio-ccd-suggested-editor',
            path: '/studio.html',
            data: {
                cardid: '206a8742-0289-4196-92d4-ced99ec4191e',
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @ccd @ccd-suggested',
        },
        {
            tcid: '6',
            name: '@studio-ccd-slice-editor',
            path: '/studio.html',
            data: {
                cardid: '8cf16da3-a95d-4186-8a74-e0a2386631a6',
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @ccd @ccd-slice',
        },
        {
            tcid: '7',
            name: '@studio-try-buy-widget-editor',
            path: '/studio.html',
            data: {
                cardid: '02ee0d3c-a472-44a1-b15a-f65c24eefc4b',
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @ahome @ahome-try-buy-widget',
        },
        {
            tcid: '8',
            name: '@studio-card-dblclick-info',
            path: '/studio.html',
            data: {
                cardid: '206a8742-0289-4196-92d4-ced99ec4191e',
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio',
        },
        {
            tcid: '9',
            name: '@studio-plans-individuals-editor',
            path: '/studio.html',
            data: {
                cardid: '45e50a68-9bd7-4fc2-9665-12f39140a1be',
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @acom @acom-plans @acom-plans-individuals',
        },
        {
            tcid: '10',
            name: '@studio-promoted-plans-editor',
            path: '/studio.html',
            data: {
                cardid: '2cf0ed0e-84ea-4bd4-8e89-ddf527a7a75b',
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @ahome @ahome-promoted-plans',
        },
    ],
};
