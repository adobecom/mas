export default {
    FeatureName: 'M@S Studio ACOM BizPro',
    features: [
        {
            tcid: '0',
            name: '@studio-bizpro-edit-discard-editor-fields',
            path: '/studio.html',
            data: {
                cardid: '9fb5ce85-1a9e-46df-8982-485bd9019d3b',
            },
            browserParams: '#page=fragment-editor&path=sandbox&fragmentId=',
            tags: '@mas-studio @acom @acom-edit @acom-bizpro @acom-bizpro-edit',
        },
        {
            tcid: '1',
            name: '@studio-bizpro-edit-discard-title',
            path: '/studio.html',
            data: {
                cardid: '9fb5ce85-1a9e-46df-8982-485bd9019d3b',
                title: {
                    updated: 'Edited BizPro Title',
                },
            },
            browserParams: '#page=fragment-editor&path=sandbox&fragmentId=',
            tags: '@mas-studio @acom @acom-edit @acom-bizpro @acom-bizpro-edit',
        },
        {
            tcid: '2',
            name: '@studio-bizpro-edit-discard-description',
            path: '/studio.html',
            data: {
                cardid: '9fb5ce85-1a9e-46df-8982-485bd9019d3b',
                description: {
                    updated: 'Edited BizPro description text',
                },
            },
            browserParams: '#page=fragment-editor&path=sandbox&fragmentId=',
            tags: '@mas-studio @acom @acom-edit @acom-bizpro @acom-bizpro-edit',
        },
        {
            tcid: '3',
            name: '@studio-bizpro-edit-discard-whats-included-label',
            path: '/studio.html',
            data: {
                // individuals-1 — has authored whats-included sections, so the
                // toggle renders and the label round-trips through serialize.
                cardid: '3004a00c-bec2-4944-90f0-914e0319b826',
                whatsIncluded: {
                    label: 'Edited toggle label:',
                },
            },
            browserParams: '#page=fragment-editor&path=sandbox&fragmentId=',
            tags: '@mas-studio @acom @acom-edit @acom-bizpro @acom-bizpro-edit',
        },
    ],
};
