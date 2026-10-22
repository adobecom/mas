export default {
    FeatureName: 'M@S Studio Bulk Publish',
    features: [
        {
            tcid: '0',
            name: '@studio-bulk-publish-import-placeholder-url',
            path: '/studio.html',
            data: {
                key: 'test',
                placeholderPath: '/content/dam/mas/nala/en_US/dictionary/test',
            },
            browserParams: '#page=bulkPublishEditor&path=nala',
            tags: '@mas-studio @bulk-publish',
        },
    ],
};
