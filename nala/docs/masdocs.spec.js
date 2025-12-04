/* eslint-disable max-len */
import { DOCS_GALLERY_PATH } from '../utils/commerce.js';

export const FeatureName = 'Merch CCD Card Feature';
export const features = [
    // Checkout Link Page
    {
        tcid: '0',
        name: '@MAS-DOCS-checkout-link',
        path: DOCS_GALLERY_PATH.CHECKOUT_LINK,
        browserParams: '?theme=dark',
        tags: '@mas-docs @checkout-link @commerce @smoke @regression @milo',
    },
    // Merch Card Page
    {
        tcid: '0',
        name: '@MAS-DOCS-merch-card',
        path: DOCS_GALLERY_PATH.MERCH_CARD,
        tags: '@mas-docs @merch-card @commerce @smoke @regression @milo',
    },
];
