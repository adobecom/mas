export default {
    FeatureName: 'M@S Studio - Version Page',
    features: [
        {
            tcid: '0',
            name: '@version-page-load',
            path: '/studio.html',
            data: {
                fragmentId: '48a759ce-3c9a-4158-9bc3-b21ffa07e8e4',
            },
            browserParams: '#page=version&path=nala&fragmentId=',
            tags: '@mas-studio @version',
        },
        {
            tcid: '1',
            name: '@version-page-preview',
            path: '/studio.html',
            data: {
                fragmentId: '48a759ce-3c9a-4158-9bc3-b21ffa07e8e4',
            },
            browserParams: '#page=version&path=nala&fragmentId=',
            tags: '@mas-studio @version',
        },
        {
            tcid: '2',
            name: '@version-page-search',
            path: '/studio.html',
            data: {
                fragmentId: '48a759ce-3c9a-4158-9bc3-b21ffa07e8e4',
                searchQuery: '1.0',
            },
            browserParams: '#page=version&path=nala&fragmentId=',
            tags: '@mas-studio @version',
        },
    ],
};
