/* eslint-disable max-len */

import { DOCS_GALLERY_PATH } from '../../utils/commerce.js';

export const FeatureName = 'Merch Image Gallery Feature';
export const features = [
    {
        tcid: '0',
        name: '@MAS-Image',
        path: DOCS_GALLERY_PATH.IMAGE,
        data: {
            id: 'f7fdf15d-bcb0-40c4-9a8f-fa103fc640e7',
            variant: 'image',
            title: 'Photoshop',
            badge: 'Best Offer',
            promoText: 'This is promo offer for Photoshop product',
            description: 'Create gorgeous images, rich graphics, and incredible art.',
            cta1: 'Buy now',
            cta2: 'Free trial',
        },
        tags: '@mas-docs @mas-image @commerce @smoke @regression @milo',
    },
    {
        tcid: '1',
        name: '@MAS-Image-CTA-alignment',
        path: DOCS_GALLERY_PATH.IMAGE,
        data: {},
        tags: '@mas-docs @mas-image @commerce @smoke @regression @milo',
    },
];
