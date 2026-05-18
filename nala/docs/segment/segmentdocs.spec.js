/* eslint-disable max-len */

import { DOCS_GALLERY_PATH } from '../../utils/commerce.js';

export const FeatureName = 'Merch Segment Gallery Feature';
export const features = [
    {
        tcid: '0',
        name: '@MAS-Segment',
        path: DOCS_GALLERY_PATH.SEGMENT,
        data: {
            id: '5bf2044e-773c-458e-9b5f-efdb238cdcf1',
            variant: 'segment',
            title: 'Photoshop Titling Extra Long',
            badge: '50% discount',
            description:
                'Save over 70% on 20+ Creative Cloud apps. Includes 100GB of cloud storage, Adobe Fonts, and Adobe Portfolio. We can add an OST price in the copy too: US$89.99/mo and on link',
            cta1: 'Free trial',
            cta2: 'Buy now',
        },
        tags: '@mas-docs @mas-segment @commerce @smoke @regression @milo',
    },
    {
        tcid: '1',
        name: '@MAS-Segment-CTA-alignment',
        path: DOCS_GALLERY_PATH.SEGMENT,
        data: {},
        tags: '@mas-docs @mas-segment @commerce @smoke @regression @milo',
    },
    {
        tcid: '2',
        name: '@MAS-Segment-st-price-labels',
        path: DOCS_GALLERY_PATH.SEGMENT,
        data: {
            id: '87088898-81df-4fb0-9b51-0d7ff8938467',
            variant: 'segment',
            calloutPriceText: 'Regularly at US$34.49/moper licenseexcl. tax Alternatively at US$17.24/moper licenseexcl. tax',
        },
        tags: '@mas-docs @mas-segment @commerce @smoke @regression @milo',
    },    
];
