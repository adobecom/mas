export default {
    FeatureName: 'M@S Studio Content Table Sort',
    features: [
        {
            tcid: '0',
            name: '@studio-content-sort-headers',
            path: '/studio.html',
            browserParams: '#page=content&path=nala',
            tags: '@mas-studio @sort',
        },
        {
            tcid: '1',
            name: '@studio-content-sort-toggle-direction',
            path: '/studio.html',
            browserParams: '#page=content&path=nala',
            tags: '@mas-studio @sort',
        },
        {
            tcid: '2',
            name: '@studio-content-sort-deeplink',
            path: '/studio.html',
            browserParams: '#page=content&path=nala&sortBy=title&sortDirection=desc',
            tags: '@mas-studio @sort',
        },
    ],
};
