import { PRICE_PATTERN } from '../../../utils/commerce.js';

export default {
    FeatureName: 'M@S Studio - Variations Page',
    features: [
        {
            tcid: '0',
            name: '@studio-create-variation-editor',
            path: '/studio.html',
            browserParams: '#page=content&path=nala',
            data: {
                cardid: '6f189be0-d64b-468f-b340-92888206cce8',
                locale: 'en_CA',
                localeName: 'Canada',
                price: PRICE_PATTERN.CA.mo,
            },
            tags: '@mas-studio @regional-variations',
        },
        {
            tcid: '1',
            name: '@studio-create-variation-table-view',
            path: '/studio.html',
            browserParams: '#page=content&path=nala',
            data: {
                cardid: '6f189be0-d64b-468f-b340-92888206cce8',
                locale: 'en_CA',
                localeName: 'Canada',
                price: PRICE_PATTERN.CA.mo,
            },
            tags: '@mas-studio @regional-variations',
        },
        {
            tcid: '2',
            name: '@studio-create-variation-new-fragment',
            path: '/studio.html',
            browserParams: '#page=content&path=nala',
            data: {
                osi: 'yIcVsmjmQCHKQ-TvUJxH3-kop4ifvwoMBBzVg3qfaTg',
                variant: 'plans',
                locale: 'en_CA',
                localeName: 'Canada',
                price: PRICE_PATTERN.CA.mo,
            },
            tags: '@mas-studio @regional-variations',
        },
        {
            tcid: '3',
            name: '@studio-delete-variation',
            path: '/studio.html',
            browserParams: '#page=content&path=nala',
            data: {
                cardid: '6f189be0-d64b-468f-b340-92888206cce8',
                locale: 'en_CA',
                localeName: 'Canada',
                price: PRICE_PATTERN.CA.mo,
            },
            tags: '@mas-studio @regional-variations',
        },
    ],
};
