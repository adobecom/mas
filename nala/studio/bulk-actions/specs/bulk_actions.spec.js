export default {
    FeatureName: 'M@S Studio Bulk Actions',
    features: [
        {
            tcid: '0',
            name: '@studio-bulk-copy-urls',
            path: '/studio.html',
            browserParams: '#path=nala&page=content',
            tags: '@mas-studio @bulk-actions',
        },
        {
            tcid: '1',
            name: '@studio-action-menu-copy-code',
            path: '/studio.html',
            browserParams: '#path=nala&page=content',
            tags: '@mas-studio @bulk-actions @action-menu',
        },
        {
            tcid: '2',
            name: '@studio-bulk-publish-select-all-fragments',
            path: '/studio.html',
            browserParams: '#path=nala&page=content',
            tags: '@mas-studio @bulk-actions @bulk-publish @select-all',
            data: {
                searchQuery: 'nala-bulk-publish-fr_FR',
                tab: 'cards',
            },
        },
        {
            tcid: '3',
            name: '@studio-bulk-publish-select-all-collections',
            path: '/studio.html',
            browserParams: '#path=nala&page=content',
            tags: '@mas-studio @bulk-actions @bulk-publish @select-all',
            data: {
                searchQuery: 'nala-bulk-publish-fr_FR',
                tab: 'collections',
            },
        },
        {
            tcid: '4',
            name: '@studio-bulk-publish-select-all-placeholders',
            path: '/studio.html',
            browserParams: '#path=nala&page=content',
            tags: '@mas-studio @bulk-actions @bulk-publish @select-all',
            data: {
                searchQuery: 'nala-bulk-publish-fr_FR',
                tab: 'placeholders',
            },
        },
    ],
};
