export default {
    FeatureName: 'M@S Studio Discount Badge',
    features: [
        {
            tcid: '0',
            name: '@studio-discount-badge-visible',
            path: '/studio.html',
            data: {
                cardid: 'ffd71e1a-c4e6-4ba4-a7a0-63a685c1cc13',
            },
            browserParams: '#page=fragment-editor&path=sandbox&fragmentId=',
            tags: '@mas-studio @discount @discount-badge',
        },
        {
            tcid: '1',
            name: '@studio-discount-badge-edit-discard',
            path: '/studio.html',
            data: {
                cardid: 'ffd71e1a-c4e6-4ba4-a7a0-63a685c1cc13',
                badge: {
                    original: 'Save',
                },
            },
            browserParams: '#page=fragment-editor&path=sandbox&fragmentId=',
            tags: '@mas-studio @discount @discount-badge @discount-badge-edit',
        },
    ],
};
