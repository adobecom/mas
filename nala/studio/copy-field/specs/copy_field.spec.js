export default {
    FeatureName: 'M@S Studio Copy Field',
    features: [
        {
            tcid: '0',
            name: '@studio-copy-field-popover-tax-label',
            // MWPW-193548 reproducer fragment in the acom surface, fr_FR locale.
            // FR_fr is in DISPLAY_ALL_TAX_COUNTRIES so the rendered card preview
            // carries a `.price-tax-inclusivity` "TTC" label; the Copy Field popover
            // preview must mirror that — before the fix it dropped to `26,21 €/mois`.
            path: '/studio.html',
            browserParams: '#locale=fr_FR&page=fragment-editor&path=acom&fragmentId=',
            data: {
                cardid: '7f72b2a4-2ebc-48e6-bcec-4239b5aa35b2',
                priceField: 'Prices',
            },
            tags: '@mas-studio @copy-field',
        },
    ],
};
