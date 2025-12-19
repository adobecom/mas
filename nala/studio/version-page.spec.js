export default {
    FeatureName: 'M@S Studio - Version Page',
    features: [
        {
            tcid: '0',
            name: '@version-page-load',
            path: '/studio.html',
            data: {
                fragmentId: '206a8742-0289-4196-92d4-ced99ec4191e',
            },
            browserParams: '#page=version&path=nala&fragmentId=',
            tags: '@mas-studio @version',
        },
        {
            tcid: '1',
            name: '@version-page-preview',
            path: '/studio.html',
            data: {
                fragmentId: '206a8742-0289-4196-92d4-ced99ec4191e',
            },
            browserParams: '#page=version&path=nala&fragmentId=',
            tags: '@mas-studio @version',
        },
        {
            tcid: '2',
            name: '@version-page-search',
            path: '/studio.html',
            data: {
                fragmentId: '206a8742-0289-4196-92d4-ced99ec4191e',
                searchQuery: '1.0',
            },
            browserParams: '#page=version&path=nala&fragmentId=',
            tags: '@mas-studio @version',
        },
    ],
};
