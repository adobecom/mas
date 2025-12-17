export default {
    FeatureName: 'M@S Studio Placeholders',
    features: [
        {
            tcid: '0',
            name: '@studio-placeholders-page-load',
            path: '/studio.html',
            browserParams: '#page=placeholders&path=nala&locale=en_US',
            tags: '@mas-studio @placeholders @smoke',
            description: 'Verify that placeholders page loads correctly with all essential elements for en_US locale',
        },
        {
            tcid: '1',
            name: '@studio-placeholders-locale-picker',
            path: '/studio.html',
            data: {
                locale: 'fr_FR',
            },
            browserParams: '#page=placeholders&path=nala&locale=en_US',
            tags: '@mas-studio @placeholders',
            description: 'Verify locale picker is functional',
        },
        {
            tcid: '2',
            name: '@studio-placeholders-search-field',
            path: '/studio.html',
            data: {
                key: 'test',
                value: 'test - do not remove or modify',
            },
            browserParams: '#page=placeholders&path=nala&locale=en_US',
            tags: '@mas-studio @placeholders',
            description: 'Validate search functionality works with en_US locale placeholders',
        },
    ],
};
