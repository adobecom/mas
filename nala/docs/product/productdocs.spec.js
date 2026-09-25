/* eslint-disable max-len */

import { DOCS_GALLERY_PATH } from '../../utils/commerce.js';

export const FeatureName = 'Merch Product Gallery Feature';
export const features = [
    {
        tcid: '0',
        name: '@MAS-Product',
        path: DOCS_GALLERY_PATH.PRODUCT,
        data: {
            id: '8018a162-6c15-48b4-b44b-504c640e66d2',
            variant: 'product',
            title: 'Acrobat Pro for teams',
            badge: 'Most popular',
            description:
                'Essential PDF solution with full conversion and editing capabilities, advanced e-sign features, and more with a price US$34.99/mo and See more',
            cta: 'Buy now',
        },
        tags: '@mas-docs @mas-product @commerce @smoke @regression @milo',
    },
    {
        tcid: '1',
        name: '@MAS-Product-CTA-alignment',
        path: DOCS_GALLERY_PATH.PRODUCT,
        data: {},
        tags: '@mas-docs @mas-product @commerce @smoke @regression @milo',
    },
    {
        tcid: '2',
        name: '@MAS-Product-CTA-modal-trigger',
        path: DOCS_GALLERY_PATH.PRODUCT,
        data: {
            id: 'bdf14ab4-b467-45c5-9d27-e561c6bccb48',
            variant: 'product',
        },
        tags: '@mas-docs @mas-product @commerce @smoke @regression @milo',
    },
];
