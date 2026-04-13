/* eslint-disable max-len */

import { DOCS_GALLERY_PATH } from '../../utils/commerce.js';

export const FeatureName = 'Merch Catalog Gallery Feature';

/** Fragment IDs from web-components/docs/catalog.html (source: catalog.md) */
export const CATALOG_FRAGMENT_IDS = [
    '60d6f47c-8fd7-485d-a4ac-2b7baa492ab1',
    'c44bcc8c-4cfc-4514-96eb-2ccfaf15ebe8',
    '7286e63a-253e-42e3-86a8-a29f9bc72fb9',
    'd8f4315b-ecf5-47c9-a416-adf3390a4ec6',
    '9a1fd4db-54c2-47d0-9ddc-06cc6725b7bf',
];

export const features = [
    {
        tcid: '0',
        name: '@MAS-Catalog',
        path: DOCS_GALLERY_PATH.CATALOG,
        data: {
            variant: 'catalog',
            sampleFragmentId: CATALOG_FRAGMENT_IDS[0],
        },
        tags: '@mas-docs @mas-catalog @commerce @smoke @regression @milo',
    },
    {
        tcid: '1',
        name: '@MAS-Catalog-CTA-alignment',
        path: DOCS_GALLERY_PATH.CATALOG,
        data: {},
        tags: '@mas-docs @mas-catalog @commerce @smoke @regression @milo',
    },
];
