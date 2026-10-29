import { DOCS_GALLERY_PATH } from '../../utils/commerce.js';

export const FeatureName = 'Merch Product Gallery Feature';
export const features = [
    {
        tcid: '0',
        name: '@MAS-Product-C2',
        path: DOCS_GALLERY_PATH.PRODUCT_C2,
        data: {
            id: '75f34a57-f29f-41d9-bbf6-370537a4efbb',
            variant: 'product-c2',
            subtitle: 'Adobe Acrobat Pro Product-C2',
            badge: 'C2 Badge',
            description: 'Product description for Product-C2 card',
            cta: 'Free trial',
            bgcolor: 'black',
            mainPriceText: 'Regularly at US$69.99/mo Alternatively at US$34.99/mo',
        },
        tags: '@mas-docs @mas-product-c2 @commerce @smoke @regression @milo',
    },
    {
        tcid: '2',
        name: '@MAS-Product-C2-Gray',
        path: DOCS_GALLERY_PATH.PRODUCT_C2,
        data: {
            id: 'f5521876-24b3-41eb-a390-4e0b1c0aa535',
            variant: 'product-c2',
            subtitle: 'Adobe Acrobat Pro Product-C2 Gray',
            description: 'Product description for Product-C2 card gray',
            bgcolor: 'gray',
            cta1: 'Free trial',
            cta2: 'See all plans',
            mainPriceText: 'US$19.99/moexcl. tax',
        },
        tags: '@mas-docs @mas-product-c2 @commerce @smoke @regression @milo',
    },
];
