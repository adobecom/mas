export default {
    FeatureName: 'M@S Studio Folder Copy UI Validation',
    features: [
        {
            tcid: '0',
            name: '@studio-folder-copy-ui-button-exists',
            path: '/studio.html',
            data: {
                cardid: '206a8742-0289-4196-92d4-ced99ec4191e', // CCD Suggested test card
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @folder-copy @ui-validation',
        },
        {
            tcid: '1',
            name: '@studio-folder-copy-ui-dialog-opens',
            path: '/studio.html',
            data: {
                cardid: '206a8742-0289-4196-92d4-ced99ec4191e', // CCD Suggested test card
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
                cardid: '206a8742-0289-4196-92d4-ced99ec4191e', // CCD Suggested test card
                testFragmentName: 'Test Fragment Name',
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @folder-copy @ui-validation @dialog-validation',
        },
    ],
};