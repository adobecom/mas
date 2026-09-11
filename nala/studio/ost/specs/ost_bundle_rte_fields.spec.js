// Soft-bundle authoring must work from every OST-enabled RTE field, not just
// the Product price field. Each RTE field's toolbar cart button opens the OST
// and its "Use" routes through the same onPlaceholderSelect path, so a bundle
// (comma-joined data-wcs-osi inline-price) must insert into each field without
// the market_segments crash (MWPW-200982). Reuses the fr_FR OST fragment.
export { OST_FR_FRAGMENT } from './ost.spec.js';

// One feature per RTE field the fixture's variant renders. shortDescription is
// excluded: its toggle field-group stays hidden for this fragment's variant.
export default {
    FeatureName: 'M@S Studio OST Soft Bundle across RTE fields',
    features: [
        {
            tcid: '0',
            name: '@studio-ost-bundle-field-title',
            path: '/studio.html',
            data: { field: 'title', fieldGroup: 'title' },
            tags: '@mas-studio @ost @ost-e2e @ost-bundle-rte-fields',
        },
        {
            tcid: '1',
            name: '@studio-ost-bundle-field-prices',
            path: '/studio.html',
            data: { field: 'prices', fieldGroup: 'prices' },
            tags: '@mas-studio @ost @ost-e2e @ost-bundle-rte-fields',
        },
        {
            tcid: '2',
            name: '@studio-ost-bundle-field-promo-text',
            path: '/studio.html',
            data: { field: 'promoText', fieldGroup: 'promoText' },
            tags: '@mas-studio @ost @ost-e2e @ost-bundle-rte-fields',
        },
        {
            tcid: '3',
            name: '@studio-ost-bundle-field-description',
            path: '/studio.html',
            data: { field: 'description', fieldGroup: 'description' },
            tags: '@mas-studio @ost @ost-e2e @ost-bundle-rte-fields',
        },
        {
            tcid: '4',
            name: '@studio-ost-bundle-field-callout',
            path: '/studio.html',
            data: { field: 'callout', fieldGroup: 'callout' },
            tags: '@mas-studio @ost @ost-e2e @ost-bundle-rte-fields',
        },
        {
            tcid: '5',
            name: '@studio-ost-bundle-field-ctas',
            path: '/studio.html',
            data: { field: 'ctas', fieldGroup: 'ctas' },
            tags: '@mas-studio @ost @ost-e2e @ost-bundle-rte-fields',
        },
    ],
};
