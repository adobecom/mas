/* eslint-disable max-len */

import { DOCS_GALLERY_PATH } from '../../utils/commerce.js';

export const FeatureName = 'Merch Mini Compare Chart Mweb Gallery Feature';

/** Fragment IDs from web-components/docs/minicomparemweb.html */
export const MINICOMPARE_MWEB_FRAGMENT_IDS = [
    '3783cddb-fc42-4e37-a7e0-d6f306430ee8',
    '67300358-d6a5-4650-b9a1-7e97f91ad5bb',
    '127a74ee-bd16-4de2-a7a1-ad6a1ef39455',
];

export const features = [
    {
        tcid: '0',
        name: '@MAS-Minicompare-Mweb',
        path: DOCS_GALLERY_PATH.MINICOMPARE_MWEB,
        data: {
            variant: 'mini-compare-chart-mweb',
            sampleFragmentId: MINICOMPARE_MWEB_FRAGMENT_IDS[0],
        },
        tags: '@mas-docs @mas-minicompare-mweb @commerce @smoke @regression @milo',
    },
    {
        tcid: '1',
        name: '@MAS-Minicompare-Mweb-CTA-alignment',
        path: DOCS_GALLERY_PATH.MINICOMPARE_MWEB,
        data: {},
        tags: '@mas-docs @mas-minicompare-mweb @commerce @smoke @regression @milo',
    },
];
