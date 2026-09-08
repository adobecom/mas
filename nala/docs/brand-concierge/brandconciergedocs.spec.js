import { DOCS_GALLERY_PATH } from '../../utils/commerce.js';

export const FeatureName = 'Merch Brand Concierge Gallery Feature';
export const features = [
    {
        tcid: '0',
        name: '@MAS-BrandConcierge',
        path: DOCS_GALLERY_PATH.BRAND_CONCIERGE,
        data: {
            id: 'd723cb3e-399a-45ef-b899-9b687ca0703d',
            variant: 'brand-concierge-product',
            title: 'Creative Cloud Pro',
            badge: 'Best Offer',
            description: 'Get 20+ apps, including Photoshop, Illustrator, and Premiere, plus Adobe Firefly creative AI.',
            cta: 'Buy now',
        },
        tags: '@mas-docs @mas-brand-concierge @commerce @smoke @regression @milo',
    },
    {
        tcid: '1',
        name: '@MAS-BrandConcierge-CTA-alignment',
        path: DOCS_GALLERY_PATH.BRAND_CONCIERGE,
        data: {},
        tags: '@mas-docs @mas-brand-concierge @commerce @smoke @regression @milo',
    },
    {
        tcid: '2',
        name: '@MAS-BrandConcierge-no-badge-card',
        path: DOCS_GALLERY_PATH.BRAND_CONCIERGE,
        data: {
            id: 'ce25f8f8-f8a3-4567-9af8-aee76c1dd96b',
            variant: 'brand-concierge-product',
            title: 'Adobe Premiere Pro',
            description: 'Professional video and film editing.',
            cta: 'Buy now',
        },
        tags: '@mas-docs @mas-brand-concierge @commerce @smoke @regression @milo',
    },
];
