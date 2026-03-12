export default {
    FeatureName: 'M@S Studio CCD Suggested',
    features: [
        {
            tcid: '0',
            name: '@studio-suggested-remove-correct-fragment',
            path: '/studio.html',
            data: {
                cardid: 'cc85b026-240a-4280-ab41-7618e65daac4',
            },
            browserParams: '#page=fragment-editor&path=nala&fragmentId=',
            tags: '@mas-studio @ccd @ccd-save @ccd-suggested @ccd-suggested-save @nopr', // enable when the preview is fixed
        },
        {
            tcid: '1',
            name: '@studio-suggested-save-variant-change-to-slice',
            path: '/studio.html',
            data: {
                cardid: 'cc85b026-240a-4280-ab41-7618e65daac4',
                osi: 'A1xn6EL4pK93bWjM8flffQpfEL-bnvtoQKQAvkx574M',
            },
            browserParams: '#page=fragment-editor&path=nala&fragmentId=',
            tags: '@mas-studio @ccd @ccd-save @ccd-suggested @ccd-suggested-save',
        },
        {
            tcid: '2',
            name: '@studio-suggested-save-edited-RTE-fields',
            path: '/studio.html',
            data: {
                cardid: 'cc85b026-240a-4280-ab41-7618e65daac4',
                subtitle: 'New Subtitle',
                backgroundURL: 'https://milo.adobe.com/assets/img/commerce/media_1d63dab9ee1edbf371d6f0548516c9e12b3ea3ff4.png',
            },
            browserParams: '#page=fragment-editor&path=nala&fragmentId=',
            tags: '@mas-studio @ccd @ccd-save @ccd-suggested @ccd-suggested-save',
        },
    ],
};
