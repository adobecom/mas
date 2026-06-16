// Dedicated fr_FR fragment created for NALA OST E2E coverage
// (/content/dam/mas/nala/fr_FR/ost-nala-card-fr — promo/legal/OSI price, never reuse en_GB).
export const OST_FR_FRAGMENT = '029a3452-ab2c-4381-aef9-b37f48706545';

export default {
    FeatureName: 'M@S Studio OST',
    features: [
        {
            tcid: '0',
            name: '@studio-ost-search-product',
            path: '/studio.html',
            data: {
                searchTerms: {
                    name: 'Photoshop',
                    code: 'photoshop',
                    offerId: '08A2D751F03A11405E0DC7406DC44C35',
                    osi: 'r_JXAnlFI7xD6FxWKl2ODvZriLYBoSL701Kd1hRyhe8',
                },
                expectedProduct: 'Photoshop',
            },
            tags: '@mas-studio @ost @ost-e2e',
        },
        {
            tcid: '1',
            name: '@studio-ost-filter-segments',
            path: '/studio.html',
            data: {
                filters: {
                    planType: 'ABM',
                    offerType: 'BASE',
                    customerSegment: 'INDIVIDUAL',
                    marketSegment: 'COM',
                },
            },
            tags: '@mas-studio @ost @ost-e2e',
        },
        {
            tcid: '2',
            name: '@studio-ost-select-product-shows-offers',
            path: '/studio.html',
            data: {
                product: 'Photoshop',
            },
            tags: '@mas-studio @ost @ost-e2e',
        },
        {
            tcid: '3',
            name: '@studio-ost-select-offer-configure-placeholder',
            path: '/studio.html',
            data: {
                product: 'Photoshop',
                placeholderChip: 'price',
            },
            tags: '@mas-studio @ost @ost-e2e',
        },
        {
            tcid: '4',
            name: '@studio-ost-price-placeholder-preview',
            path: '/studio.html',
            data: {
                product: 'Photoshop',
                placeholderChip: 'price',
                expectedPrice: '€',
            },
            tags: '@mas-studio @ost @ost-e2e',
        },
        {
            tcid: '5',
            name: '@studio-ost-optical-annual-price-preview',
            path: '/studio.html',
            data: {
                product: 'Photoshop',
                templates: ['optical', 'annual'],
                expectedPrice: '€',
            },
            tags: '@mas-studio @ost @ost-e2e',
        },
        {
            tcid: '6',
            name: '@studio-ost-strikethrough-price-preview',
            path: '/studio.html',
            data: {
                product: 'Photoshop',
                template: 'strikethrough',
                forbiddenLeaks: ['sr-only', '{{', '}}', 'undefined', 'NaN'],
            },
            tags: '@mas-studio @ost @ost-e2e',
        },
        {
            tcid: '7',
            name: '@studio-ost-promo-strikethrough-price-preview',
            path: '/studio.html',
            data: {
                fragmentId: OST_FR_FRAGMENT,
                promoCode: 'UMRM2MUSPr501YOC',
                template: 'price',
            },
            tags: '@mas-studio @ost @ost-e2e',
        },
        {
            tcid: '8',
            name: '@studio-ost-discount-percentage',
            path: '/studio.html',
            data: {
                promotionOffer: {
                    osi: 'r_JXAnlFI7xD6FxWKl2ODvZriLYBoSL701Kd1hRyhe8',
                    expectsAutoDiscount: true,
                },
                nonPromoOffer: {
                    osi: 'yIcVsmjmQCHKQ-TvUJxH3-kop4ifvwoMBBzVg3qfaTg',
                    expectsHint: 'Enter a reference offer OSI to calculate the discount percentage.',
                },
            },
            tags: '@mas-studio @ost @ost-e2e',
        },
        {
            tcid: '9',
            name: '@studio-ost-legal-disclaimer-preview',
            path: '/studio.html',
            data: {
                fragmentId: OST_FR_FRAGMENT,
                template: 'legal',
            },
            tags: '@mas-studio @ost @ost-e2e',
        },
        {
            tcid: '10',
            name: '@studio-ost-checkout-url-placeholder',
            path: '/studio.html',
            data: {
                product: 'Photoshop',
                placeholderChip: 'checkoutUrl',
                expectsCheckoutLink: true,
                workflowStep: 'email',
                ctaText: 'buy-now',
            },
            tags: '@mas-studio @ost @ost-e2e',
        },
        {
            tcid: '11',
            name: '@studio-ost-placeholder-option-toggles',
            path: '/studio.html',
            data: {
                product: 'Photoshop',
                template: 'price',
                toggles: {
                    // recurrence (/mois or /an) is asserted via regex in the test
                    displayPerUnit: 'par licence',
                    displayTax: 'TTC',
                },
            },
            tags: '@mas-studio @ost @ost-e2e',
        },
        {
            tcid: '12',
            name: '@studio-ost-country-landscape-selectors',
            path: '/studio.html',
            data: {
                product: 'Photoshop',
                country: 'GB',
                expectedCurrency: '£',
                sourceGap: true,
                note: 'BLOCKED: country sp-picker (ost-country-picker.js:123) and the Stage/landscape sp-switch (ost-country-picker.js:133) have NO data-testid. Cannot select them via stable CSS. SOURCE FIX required before this test can be implemented.',
            },
            tags: '@mas-studio @ost @ost-e2e',
        },
        {
            tcid: '13',
            name: '@studio-ost-deeplink-osi-preselect',
            path: '/studio.html',
            data: {
                fragmentId: OST_FR_FRAGMENT,
                osi: 'r_JXAnlFI7xD6FxWKl2ODvZriLYBoSL701Kd1hRyhe8',
            },
            tags: '@mas-studio @ost @ost-e2e',
        },
        {
            tcid: '14',
            name: '@studio-ost-deeplink-back',
            path: '/studio.html',
            data: {
                fragmentId: OST_FR_FRAGMENT,
                osi: 'r_JXAnlFI7xD6FxWKl2ODvZriLYBoSL701Kd1hRyhe8',
            },
            tags: '@mas-studio @ost @ost-e2e',
        },
        {
            tcid: '15',
            name: '@studio-ost-use-emits-placeholder',
            path: '/studio.html',
            data: {
                product: 'Photoshop',
                template: 'price',
                expectedPlaceholder: '{{price}}',
            },
            tags: '@mas-studio @ost @ost-e2e',
        },
        {
            tcid: '16',
            name: '@studio-ost-cancel-discards',
            path: '/studio.html',
            data: {
                product: 'Photoshop',
            },
            tags: '@mas-studio @ost @ost-e2e',
        },
    ],
};
