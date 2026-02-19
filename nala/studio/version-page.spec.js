// Fragment ID used for Nala version history tests (MWPW-186852)
export const NALA_VERSION_FRAGMENT_ID = '635b0b65-e42c-485d-9591-4e19156a8548';

export default {
    FeatureName: 'M@S Studio - Version Page',
    features: [
        {
            tcid: '0',
            name: '@version-page-load',
            path: '/studio.html',
            data: {
                fragmentId: '48a759ce-3c9a-4158-9bc3-b21ffa07e8e4',
            },
            browserParams: '#page=version&path=nala&fragmentId=',
            tags: '@mas-studio @version',
        },
        {
            tcid: '1',
            name: '@version-page-preview',
            path: '/studio.html',
            data: {
                fragmentId: '48a759ce-3c9a-4158-9bc3-b21ffa07e8e4',
            },
            browserParams: '#page=version&path=nala&fragmentId=',
            tags: '@mas-studio @version',
        },
        {
            tcid: '2',
            name: '@version-page-search',
            path: '/studio.html',
            data: {
                fragmentId: '48a759ce-3c9a-4158-9bc3-b21ffa07e8e4',
                searchQuery: '1.0',
            },
            browserParams: '#page=version&path=nala&fragmentId=',
            tags: '@mas-studio @version',
        },
        // Nala version tests - fragment 635b0b65-e42c-485d-9591-4e19156a8548, compare 1.3 vs 1.0
        {
            tcid: '3',
            name: '@version-page-nala-preview-changed-fields',
            path: '/studio.html',
            data: {
                fragmentId: NALA_VERSION_FRAGMENT_ID,
            },
            browserParams: '#page=version&path=nala&fragmentId=',
            tags: '@mas-studio @version @nala',
        },
        {
            tcid: '4',
            name: '@version-page-nala-breadcrumb-to-editor',
            path: '/studio.html',
            data: {
                fragmentId: NALA_VERSION_FRAGMENT_ID,
            },
            browserParams: '#page=version&path=nala&fragmentId=',
            tags: '@mas-studio @version @nala',
        },
        {
            tcid: '5',
            name: '@version-page-nala-breadcrumb-to-fragments-table',
            path: '/studio.html',
            data: {
                fragmentId: NALA_VERSION_FRAGMENT_ID,
            },
            browserParams: '#page=version&path=nala&fragmentId=',
            tags: '@mas-studio @version @nala',
        },
        {
            tcid: '6',
            name: '@version-page-nala-clone-restore',
            path: '/studio.html',
            data: {
                fragmentId: NALA_VERSION_FRAGMENT_ID,
            },
            browserParams: '#page=fragment-editor&path=nala&fragmentId=',
            tags: '@mas-studio @version @nala',
        },
        {
            tcid: '7',
            name: '@version-page-nala-search-by-author',
            path: '/studio.html',
            data: {
                fragmentId: NALA_VERSION_FRAGMENT_ID,
            },
            browserParams: '#page=version&path=nala&fragmentId=',
            tags: '@mas-studio @version @nala',
        },
    ],
};
