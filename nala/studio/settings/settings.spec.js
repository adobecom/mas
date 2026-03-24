export const FeatureName = 'Settings - hideTrialCTAs';

export const features = [
    {
        tcid: '1',
        name: '@MAS-Settings-hideTrialCTAs-enabled',
        path: '/studio.html',
        browserParams: '#locale=en_GB&page=content&path=nala&query=',
        data: {
            cardid: '9202ca7f-8a18-4397-b872-f9f7cf60cf5c',
            title: 'CCD Apps: Photography',
            buyCta: 'Buy now',
        },
        tags: '@mas-studio @settings @hideTrialCTAs @smoke @regression',
    },
    {
        tcid: '2',
        name: '@MAS-Settings-hideTrialCTAs-enabled-promo',
        path: '/studio.html',
        browserParams: '#locale=en_GB&page=content&path=nala&query=',
        data: {
            cardid: '0c7d3b94-ceb2-41da-9151-9251e7df0ee9',
            title: 'CCD Apps: Premiere Pro plan',
            buyCta: 'Buy now',
        },
        tags: '@mas-studio @settings @hideTrialCTAs @smoke @regression',
    },
    {
        tcid: '3',
        name: '@MAS-Settings-hideTrialCTAs-disabled',
        path: '/studio.html',
        browserParams: '#locale=en_GB&page=content&path=nala&query=',
        data: {
            cardid: '9202ca7f-8a18-4397-b872-f9f7cf60cf5c',
            title: 'CCD Apps: Photography',
            buyCta: 'Buy now',
            trialCta: 'Free trial',
        },
        tags: '@mas-studio @settings @hideTrialCTAs @regression',
    },
];
