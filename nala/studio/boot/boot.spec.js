export const FeatureName = 'M@S Studio Boot';

export const features = [
    {
        tcid: '1',
        name: '@MAS-Studio-Boot-versioned-assets',
        path: '/studio.html',
        browserParams: '#locale=fr_FR&page=content&path=nala',
        tags: '@mas-studio @boot @smoke @regression',
    },
    {
        tcid: '2',
        name: '@MAS-Studio-Boot-cache-salt',
        path: '/studio.html',
        browserParams: '#locale=fr_FR&page=content&path=nala',
        data: {
            cb: '3',
        },
        tags: '@mas-studio @boot @regression',
    },
    {
        tcid: '3',
        name: '@MAS-Studio-Boot-salt-rejects-markup',
        path: '/studio.html',
        browserParams: '#locale=fr_FR&page=content&path=nala',
        data: {
            cb: '"><img id="nala-cb-injected" src="x">',
        },
        tags: '@mas-studio @boot @regression',
    },
    {
        tcid: '4',
        name: '@MAS-Studio-Boot-invalid-versions-fallback',
        path: '/studio.html',
        browserParams: '#locale=fr_FR&page=content&path=nala',
        tags: '@mas-studio @boot @regression',
    },
];
