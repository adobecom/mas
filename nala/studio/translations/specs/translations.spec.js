export default {
    FeatureName: 'M@S Studio Translations',
    features: [
        {
            tcid: '0',
            name: '@studio-translations-list-load',
            path: '/studio.html',
            browserParams: '#page=translations&path=nala&locale=en_US',
            tags: '@mas-studio @translations',
            description:
                'Verify that the Translations page loads and displays the translation projects list sorted newest first',
        },
        {
            tcid: '1',
            name: '@studio-translations-new-project-on-top',
            path: '/studio.html',
            browserParams: '#page=translations&path=nala&locale=en_US',
            tags: '@mas-studio @translations',
            description: 'Create a translation project, return to Translations and verify it appears on top, then delete it',
        },
    ],
};
