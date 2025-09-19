export default {
    FeatureName: 'M@S Studio Folder Copy UI Validation',
    features: [
        {
            tcid: '0',
            name: '@studio-folder-copy-ui-button-exists',
            path: '/studio.html',
            data: {
                cardid: 'e3901ae8-e87f-4821-8e27-6e31d2e5ffa3', // CCD Suggested test card
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @folder-copy @ui-validation',
        },
        {
            tcid: '1',
            name: '@studio-folder-copy-ui-dialog-opens',
            path: '/studio.html',
            data: {
                cardid: 'e3901ae8-e87f-4821-8e27-6e31d2e5ffa3', // CCD Suggested test card
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @folder-copy @ui-validation',
        },
        {
            tcid: '2',
            name: '@studio-folder-copy-ui-selection-mode',
            path: '/studio.html',
            data: {},
            browserParams: '#page=content&path=nala',
            tags: '@mas-studio @folder-copy @ui-validation @selection-mode',
        },
        {
            tcid: '3',
            name: '@studio-folder-copy-ui-dialog-validation',
            path: '/studio.html',
            data: {
                cardid: 'e3901ae8-e87f-4821-8e27-6e31d2e5ffa3', // CCD Suggested test card
                testFragmentName: 'Test Fragment Name',
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @folder-copy @ui-validation @dialog-validation',
        },
    ],
};