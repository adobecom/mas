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
        {
            tcid: '2',
            name: '@studio-translations-sent-on-sort',
            path: '/studio.html',
            browserParams: '#page=translations&path=nala&locale=en_US',
            tags: '@mas-studio @translations',
            description: 'Verify Sent on column is sortable',
        },
        {
            tcid: '3',
            name: '@studio-translations-actions-dropdown',
            path: '/studio.html',
            browserParams: '#page=translations&path=nala&locale=en_US',
            tags: '@mas-studio @translations',
            description: 'Verify Actions dropdown shows Edit, Duplicate, Archive, Delete, Cancel',
        },
        {
            tcid: '4',
            name: '@studio-translations-edit-opens-editor',
            path: '/studio.html',
            browserParams: '#page=translations&path=nala&locale=en_US',
            tags: '@mas-studio @translations',
            description: 'Edit action opens translation editor page with project id in URL',
        },
        {
            tcid: '5',
            name: '@studio-translations-create-project-opens-editor',
            path: '/studio.html',
            browserParams: '#page=translations&path=nala&locale=en_US',
            tags: '@mas-studio @translations',
            description: 'Create project button opens translation editor with no project id in URL',
        },
    ],
};
