export default {
    FeatureName: 'M@S Studio CCD Suggested',
    features: [
        {
            tcid: '0',
            name: '@studio-suggested-variant-change-to-slice',
            path: '/studio.html',
            data: {
                cardid: '48a759ce-3c9a-4158-9bc3-b21ffa07e8e4',
                osi: 'yIcVsmjmQCHKQ-TvUJxH3-kop4ifvwoMBBzVg3qfaTg',
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @ccd @ccd-edit @ccd-suggested @ccd-suggested-edit',
        },
        {
            tcid: '2',
            name: '@studio-suggested-edit-discard-eyebrow',
            path: '/studio.html',
            data: {
                cardid: '48a759ce-3c9a-4158-9bc3-b21ffa07e8e4',
                subtitle: {
                    original: 'do not edit',
                    updated: 'Change subtitle',
                },
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @ccd @ccd-edit @ccd-suggested @ccd-suggested-edit',
        },
        {
            tcid: '5',
            name: '@studio-suggested-edit-discard-background',
            path: '/studio.html',
            data: {
                cardid: '48a759ce-3c9a-4158-9bc3-b21ffa07e8e4',
                newBackgroundURL:
                    'https://milo.adobe.com/assets/img/commerce/media_1d63dab9ee1edbf371d6f0548516c9e12b3ea3ff4.png',
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio @ccd @ccd-edit @ccd-suggested @ccd-suggested-edit',
        },
    ],
};
