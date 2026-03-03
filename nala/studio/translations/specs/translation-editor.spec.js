export default {
    FeatureName: 'M@S Studio Translation Editor',
    features: [
        {
            tcid: '0',
            name: '@translation-editor-load',
            path: '/studio.html',
            browserParams: '#page=translation-editor&path=nala',
            tags: '@mas-studio @translation-editor @translation-editor-load',
            description:
                'Open translation editor via #page=translation-editor&path=nala, verify form, breadcrumb, and title field are visible',
        },
        {
            tcid: '1',
            name: '@translation-editor-create-validation',
            path: '/studio.html',
            browserParams: '#page=translation-editor&path=nala',
            tags: '@mas-studio @translation-editor @translation-editor-validation',
            description:
                'Verify it is not possible to create a project with an empty title, empty languages, or empty selected items',
        },
        {
            tcid: '2',
            name: '@translation-editor-select-languages',
            path: '/studio.html',
            browserParams: '#page=translation-editor&path=nala',
            tags: '@mas-studio @translation-editor @translation-editor-languages',
            description:
                'Select languages: verify empty state, modal, select all, toggle, remove language, Cancel discards changes',
        },
        {
            tcid: '3',
            name: '@translation-editor-select-items',
            path: '/studio.html',
            browserParams: '#page=translation-editor&path=nala',
            tags: '@mas-studio @translation-editor @translation-editor-items',
            description: 'Select items: verify empty state after languages selected',
        },
    ],
};
