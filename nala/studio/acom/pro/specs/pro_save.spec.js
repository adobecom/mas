export default {
    FeatureName: 'M@S Studio ACOM Pro',
    features: [
        {
            tcid: '0',
            name: '@studio-pro-save-edited-fields',
            path: '/studio.html',
            data: {
                // TODO(MWPW-200587): re-save QA fragment as pro (QA author write access pending)
                cardid: '6edac1ee-89f9-4432-aa42-008a360fa537',
                title: 'Saved Pro Title',
                whatsIncludedLabel: 'Saved toggle label:',
            },
            browserParams: '#page=fragment-editor&path=nala&fragmentId=',
            tags: '@mas-studio @acom @acom-save @acom-pro @acom-pro-save',
        },
    ],
};
