export default {
    FeatureName: 'M@S Studio ACOM Pro',
    features: [
        {
            tcid: '0',
            name: '@studio-pro-edit-discard-editor-fields',
            path: '/studio.html',
            data: {
                // TODO(MWPW-200587): re-save QA fragment as pro (QA author write access pending)
                cardid: '153bc964-d558-47ba-95b5-345fa8a02087',
            },
            browserParams: '#page=fragment-editor&path=nala&fragmentId=',
            tags: '@mas-studio @acom @acom-edit @acom-pro @acom-pro-edit',
        },
        {
            tcid: '1',
            name: '@studio-pro-edit-discard-title',
            path: '/studio.html',
            data: {
                // TODO(MWPW-200587): re-save QA fragment as pro (QA author write access pending)
                cardid: '153bc964-d558-47ba-95b5-345fa8a02087',
                title: {
                    updated: 'Edited Pro Title',
                },
            },
            browserParams: '#page=fragment-editor&path=nala&fragmentId=',
            tags: '@mas-studio @acom @acom-edit @acom-pro @acom-pro-edit',
        },
        {
            tcid: '2',
            name: '@studio-pro-edit-discard-description',
            path: '/studio.html',
            data: {
                // TODO(MWPW-200587): re-save QA fragment as pro (QA author write access pending)
                cardid: '153bc964-d558-47ba-95b5-345fa8a02087',
                description: {
                    updated: 'Edited Pro description text',
                },
            },
            browserParams: '#page=fragment-editor&path=nala&fragmentId=',
            tags: '@mas-studio @acom @acom-edit @acom-pro @acom-pro-edit',
        },
        {
            tcid: '3',
            name: '@studio-pro-edit-discard-whats-included-label',
            path: '/studio.html',
            data: {
                // individuals-1 — has authored whats-included sections, so the
                // toggle renders and the label round-trips through serialize.
                // TODO(MWPW-200587): re-save QA fragment as pro (QA author write access pending)
                cardid: '4f048713-13f8-410b-94a9-c0e03d09fc34',
                whatsIncluded: {
                    label: 'Edited toggle label:',
                },
            },
            browserParams: '#page=fragment-editor&path=nala&fragmentId=',
            tags: '@mas-studio @acom @acom-edit @acom-pro @acom-pro-edit',
        },
    ],
};
