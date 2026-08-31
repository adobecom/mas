export const FeatureName = 'Settings - hideTrialCTAs';

export const features = [
    {
        tcid: '1',
        name: '@MAS-Settings-hideTrialCTAs-enabled',
        path: '/studio.html',
        browserParams: '#locale=fr_FR&page=content&path=nala&query=',
        data: {
            cardid: 'aaeeece3-858a-44fb-ab16-1f8ebe7790a0',
        },
        tags: '@mas-studio @settings @hideTrialCTAs @smoke @regression',
    },
    {
        tcid: '2',
        name: '@MAS-Settings-hideTrialCTAs-enabled-promo',
        path: '/studio.html',
        browserParams: '#locale=fr_FR&page=content&path=nala&query=',
        data: {
            cardid: 'b3ca85bc-128e-4eb6-93a9-1f380978929b',
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
            buyCta: 'Buy now',
            trialCta: 'Free trial',
        },
        tags: '@mas-studio @settings @hideTrialCTAs @regression',
    },
];
