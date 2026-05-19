/* eslint-disable max-len */

import { DOCS_GALLERY_PATH } from '../../utils/commerce.js';

export const FeatureName = 'Merch Special Offer Gallery Feature';
export const features = [
    {
        tcid: '0',
        name: '@MAS-SpecialOffer',
        path: DOCS_GALLERY_PATH.SPECIALOFFER,
        data: {
            // First card in web-components/docs/src/specialoffer.md — update strings if AEM copy changes
            id: '0381d43f-2e1d-4074-a7a6-4a748bd81be7',
            variant: 'special-offers',
            title: 'Save over 40% on Creative Cloud All Apps.',
            badge: 'Discount 50%',
            detailM: 'Students and teachers',
            description:
                'Get 20+ Creative Cloud apps, including Photoshop, Acrobat Pro, and more. Pay US$19.99/mo the first year and US$39.99/mo after that.',
            cta1: 'Free trial',
            cta2: 'Buy now',
        },
        tags: '@mas-docs @mas-special-offer @commerce @smoke @regression @milo',
    },
    {
        tcid: '1',
        name: '@MAS-SpecialOffer-CTA-alignment',
        path: DOCS_GALLERY_PATH.SPECIALOFFER,
        data: {},
        tags: '@mas-docs @mas-special-offer @commerce @smoke @regression @milo',
    },
];
