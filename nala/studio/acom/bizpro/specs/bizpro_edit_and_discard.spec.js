export default {
    FeatureName: 'M@S Studio ACOM BizPro',
    features: [
        {
            tcid: '0',
            name: '@studio-bizpro-edit-discard-editor-fields',
            path: '/studio.html',
            data: {
                cardid: '153bc964-d558-47ba-95b5-345fa8a02087',
            },
            browserParams: '#page=fragment-editor&path=nala&fragmentId=',
            tags: '@mas-studio @acom @acom-edit @acom-bizpro @acom-bizpro-edit',
        },
        {
            tcid: '1',
            name: '@studio-bizpro-edit-discard-title',
            path: '/studio.html',
            data: {
                cardid: '153bc964-d558-47ba-95b5-345fa8a02087',
                title: {
                    updated: 'Edited BizPro Title',
                },
            },
            browserParams: '#page=fragment-editor&path=nala&fragmentId=',
            tags: '@mas-studio @acom @acom-edit @acom-bizpro @acom-bizpro-edit',
        },
        {
            tcid: '2',
            name: '@studio-bizpro-edit-discard-description',
            path: '/studio.html',
            data: {
                cardid: '153bc964-d558-47ba-95b5-345fa8a02087',
                description: {
                    updated: 'Edited BizPro description text',
                },
            },
            browserParams: '#page=fragment-editor&path=nala&fragmentId=',
            tags: '@mas-studio @acom @acom-edit @acom-bizpro @acom-bizpro-edit',
        },
        {
            tcid: '3',
            name: '@studio-bizpro-edit-discard-whats-included-label',
            path: '/studio.html',
            data: {
                // individuals-1 — has authored whats-included sections, so the
                // toggle renders and the label round-trips through serialize.
                cardid: '4f048713-13f8-410b-94a9-c0e03d09fc34',
                whatsIncluded: {
                    label: 'Edited toggle label:',
                },
            },
            browserParams: '#page=fragment-editor&path=nala&fragmentId=',
            tags: '@mas-studio @acom @acom-edit @acom-bizpro @acom-bizpro-edit',
        },
    ],
};
