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
    ],
};
