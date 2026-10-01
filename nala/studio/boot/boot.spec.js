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
    {
        tcid: '5',
        name: '@MAS-Studio-Boot-spinner',
        path: '/studio.html',
        browserParams: '#locale=fr_FR&page=content&path=nala',
        tags: '@mas-studio @boot @regression',
    },
    {
        tcid: '6',
        name: '@MAS-Studio-Boot-failure-missing-module',
        path: '/studio.html',
        browserParams: '#locale=fr_FR&page=content&path=nala',
        data: {
            failingPath: '/studio/src/studio.js',
        },
        tags: '@mas-studio @boot @regression',
    },
    {
        tcid: '7',
        name: '@MAS-Studio-Boot-failure-link-error',
        path: '/studio.html',
        browserParams: '#locale=fr_FR&page=content&path=nala',
        data: {
            failingPath: '/studio/src/studio.js',
            brokenModule: "import { nalaMissingExport } from './constants.js';\nconsole.log(nalaMissingExport);\n",
        },
        tags: '@mas-studio @boot @regression',
    },
    {
        tcid: '8',
        name: '@MAS-Studio-Boot-error-cleared-when-studio-loads',
        path: '/studio.html',
        browserParams: '#locale=fr_FR&page=content&path=nala',
        data: {
            throwingPath: '/web-components/dist/mas.js',
        },
        tags: '@mas-studio @boot @regression',
    },
    {
        tcid: '9',
        name: '@MAS-Studio-Boot-css-error-cleared',
        path: '/studio.html',
        browserParams: '#locale=fr_FR&page=content&path=nala',
        data: {
            failingPath: '/studio/con-button.css',
        },
        tags: '@mas-studio @boot @regression',
    },
    {
        tcid: '10',
        name: '@MAS-Studio-Boot-lazy-view-failure',
        path: '/studio.html',
        browserParams: '#locale=fr_FR&page=placeholders&path=nala',
        data: {
            failingPath: '/studio/src/placeholders/mas-placeholders.js',
        },
        tags: '@mas-studio @boot @regression',
    },
    {
        tcid: '11',
        name: '@MAS-Studio-Boot-script-failure-stays',
        path: '/studio.html',
        browserParams: '#locale=fr_FR&page=content&path=nala',
        data: {
            failingPath: '/studio/libs/swc.js',
        },
        tags: '@mas-studio @boot @regression',
    },
    {
        tcid: '12',
        name: '@MAS-Studio-Boot-mas-evaluation-failure',
        path: '/studio.html',
        browserParams: '#locale=fr_FR&page=content&path=nala',
        data: {
            failingPath: '/web-components/dist/mas.js',
            brokenModule: 'export const broken = ;',
        },
        tags: '@mas-studio @boot @regression',
    },
    {
        tcid: '13',
        name: '@MAS-Studio-Boot-spectrum-evaluation-failure',
        path: '/studio.html',
        browserParams: '#locale=fr_FR&page=content&path=nala',
        data: {
            failingPath: '/studio/libs/swc.js',
            brokenModule: 'export const broken = ;',
        },
        tags: '@mas-studio @boot @regression',
    },
];
