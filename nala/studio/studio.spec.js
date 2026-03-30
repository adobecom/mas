import { PRICE_PATTERN } from '../utils/commerce.js';

export default {
    FeatureName: 'M@S Studio',
    features: [
        {
            tcid: '0',
            name: '@studio-load',
            path: '/studio.html',
            tags: '@mas-studio @monitor',
        },
        {
            tcid: '1',
            name: '@studio-direct-search',
            path: '/studio.html',
            data: {
                cardid: '48a759ce-3c9a-4158-9bc3-b21ffa07e8e4',
            },
            browserParams: '#page=content&query=',
            tags: '@mas-studio',
        },
        {
            tcid: '2',
            name: '@studio-search-field',
            path: '/studio.html',
            data: {
                cardid: '48a759ce-3c9a-4158-9bc3-b21ffa07e8e4',
            },
            browserParams: '#path=nala&page=content',
            tags: '@mas-studio',
        },
        {
            tcid: '3',
            name: '@studio-empty-card',
            path: '/studio.html',
            data: {
                cardid: '0bf35134-e5e4-4664-88d9-4b78203bf625',
            },
            browserParams: '#path=nala&page=content',
            tags: '@mas-studio',
        },
        {
            tcid: '4',
            name: '@studio-goto-content',
            path: '/studio.html',
            tags: '@mas-studio @monitor',
        },
        {
            tcid: '5',
            name: '@studio-card-dblclick',
            path: '/studio.html',
            data: {
                cardid: '48a759ce-3c9a-4158-9bc3-b21ffa07e8e4',
            },
            browserParams: '#page=content&path=nala&query=',
            tags: '@mas-studio',
        },
        {
            tcid: '6',
            name: '@studio-surface-change',
            path: '/studio.html',
            tags: '@mas-studio',
        },
        {
            tcid: '7',
            name: '@studio-locale-change',
            data: {
                localePicker: 'French (FR)',
                locale: 'fr_FR',
            },
            path: '/studio.html',
            tags: '@mas-studio',
        },
        {
            tcid: '8',
            name: '@studio-table-view',
            path: '/studio.html',
            browserParams: '#page=content&path=nala',
            tags: '@mas-studio',
        },
        {
            tcid: '9',
            name: '@studio-create-fragment',
            path: '/studio.html',
            browserParams: '#page=content&path=nala',
            data: {
                osi: 'yIcVsmjmQCHKQ-TvUJxH3-kop4ifvwoMBBzVg3qfaTg',
                variant: 'plans',
            },
            tags: '@mas-studio @acom @acom-create @acom-save @acom-plans @acom-plans-save @acom-plans-individuals @acom-plans-individuals-save',
        },
        {
            tcid: '10',
            name: '@studio-load-variation',
            path: '/studio.html',
            browserParams: '#page=content&path=nala&query=',
            data: {
                cardid: '481a2002-9a4e-447b-a990-b3e56fdb2d14',
                variationid: '287ef7ee-b0e3-4d95-a689-578de492ceae',
                price: PRICE_PATTERN.US.mo,
            },
            tags: '@mas-studio @regional-variations',
        },
    ],
};
