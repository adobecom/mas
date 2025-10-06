export default class ACOMFullPricingExpressPage {
    constructor(page) {
        this.page = page;

        // Collection selectors
        this.collection = page.locator('merch-card-collection, .card-collection, .pricing-collection');
        this.collectionTitle = page.locator('.collection-title');

        // Card element selectors for full-pricing-express variant only
        // Use specific selectors that match the actual DOM structure
        this.cardTitle = page.locator('merch-card h3, merch-card h2, merch-card h4, merch-card h1');
        this.cardIcon = page.locator('merch-card[variant="full-pricing-express"] mas-mnemonic').first();
        this.cardPrice = page.locator('merch-card span[is="inline-price"]:not([data-template="strikethrough"])');
        this.cardPriceStrikethrough = page.locator('[slot="price"] span.price-strikethrough');
        this.cardStrikethroughPrice = page.locator(
            '[slot="price"] span[is="inline-price"][data-template="strikethrough"], [slot="price"] span.price-strikethrough',
        );
        this.cardPriceLegal = page.locator('span[is="inline-price"][data-template="legal"]');
        this.cardBody = page.locator('merch-card p');
        this.cardShortDescription = page
            .locator('merch-card[variant="full-pricing-express"] div[slot="shortDescription"]')
            .first();
        this.cardCTA = page.locator('merch-card a');
        this.cardBadge = page.locator('merch-badge[slot="badge"]');
        this.cardTrialBadge = page.locator('merch-badge[slot="trial-badge"]');
        this.cardBadgeLabel = page.locator('.badge');
        this.cardDivider = page.locator('hr[slot="divider"], sp-divider, [slot="divider"]');
        this.cardPhoneLink = page.locator('a[href^="tel:"]');
        this.cardLegalLink = page.locator('a.modal-Link, a.spectrum-Link, [slot="shortDescription"] a');
        this.cardHeadingPrice = page.locator('[slot="price"] .heading-s, [slot="price"] h3');
        this.cardLink = page.locator('[slot="shortDescription"] a, a.spectrum-Link');

        // New selectors for enhanced features
        this.compareLink = page.locator('[slot="body-s"] a:has-text("Compare")');
        this.gradientFireflyCard = page.locator('[border-color="gradient-firefly-spectrum"]');
        this.mnemonicXS = page.locator('mas-mnemonic[size="xs"]');
        this.mnemonicS = page.locator('mas-mnemonic[size="s"]');
        this.mnemonicM = page.locator('mas-mnemonic[size="m"]');
        this.mnemonicL = page.locator('mas-mnemonic[size="l"]');
        this.merchIconXS = page.locator('merch-icon[size="xs"]');
        this.merchIconS = page.locator('merch-icon[size="s"]');
        this.merchIconM = page.locator('merch-icon[size="m"]');
        this.merchIconL = page.locator('merch-icon[size="l"]');

        // Full pricing express card properties:
        this.cssProp = {
            card: {
                'background-color': 'rgb(255, 255, 255)',
                'border-top-color': 'rgb(234, 234, 234)',
                'border-right-color': 'rgb(234, 234, 234)',
                'border-bottom-color': 'rgb(234, 234, 234)',
                'border-left-color': 'rgb(234, 234, 234)',
                'min-width': '0px',
                'max-width': 'none',
            },
            cardWithGradientBorder: {
                'background-color': 'rgb(255, 255, 255)',
                'min-width': '0px',
                'max-width': 'none',
            },
            icon: {
                width: '24px',
                height: '24px',
                color: 'rgb(19, 19, 19)',
            },
            title: {
                color: 'rgb(34, 34, 34)',
                'font-size': '20px',
                'font-weight': '700',
                'line-height': '26px',
            },
            price: {
                color: 'rgb(70, 70, 70)',
                'font-size': '28px',
                'font-weight': '700',
                'line-height': '36.4px',
            },
            strikethroughPrice: {
                color: 'rgb(44, 44, 44)',
                'font-size': '14px',
                'font-weight': '700',
                'line-height': '21px',
                'text-decoration-color': 'rgb(44, 44, 44)',
                'text-decoration-line': 'line-through',
            },
            body: {
                color: 'rgb(70, 70, 70)',
                'font-size': '16px',
                'font-weight': '400',
                'line-height': '20.8px',
            },
            shortDescription: {
                color: 'rgb(44, 44, 44)',
                'font-size': '12px',
                'font-weight': '400',
                'line-height': '18px',
            },
            badge: {
                'background-color': 'rgb(248, 217, 4)',
                color: 'rgb(0, 0, 0)',
                'font-size': '12px',
                'font-weight': '700',
                'line-height': '16px',
                padding: '0px 8px',
                'border-radius': '4px',
            },
            divider: {
                'border-color': 'rgb(213, 213, 213)',
                'border-width': '1px',
                'margin-top': '16px',
                'margin-bottom': '16px',
            },
            cta: {
                'background-color': 'rgb(0, 84, 182)',
                color: 'rgb(255, 255, 255)',
                'font-size': '14px',
                'font-weight': '700',
                'line-height': '20px',
                'border-radius': '999px',
                padding: '5px 14px',
            },
            legalLink: {
                color: 'rgb(39, 77, 234)',
                'font-size': '12px',
                'font-weight': '400',
                'line-height': '18px',
                'text-decoration-line': 'underline',
                'text-decoration-style': 'solid',
            },
            phoneLink: {
                color: 'rgb(39, 77, 234)',
                'font-size': '12px',
                'font-weight': '400',
                'line-height': '18px',
                'text-decoration-line': 'underline',
                'text-decoration-style': 'solid',
            },
            compareLink: {
                color: 'rgb(39, 77, 234)',
                'font-size': '14px',
                'font-weight': '400',
                'line-height': '21px',
                'text-decoration-line': 'underline',
            },
            gradientFireflyCard: {
                'background-image': 'linear-gradient(45deg, rgb(255, 20, 147), rgb(147, 51, 234))',
                'border-image': 'linear-gradient(45deg, rgb(255, 20, 147), rgb(147, 51, 234)) 1',
            },
            mnemonicXS: {
                width: '16px',
                height: '16px',
            },
            mnemonicS: {
                width: '20px',
                height: '20px',
            },
            mnemonicM: {
                width: '24px',
                height: '24px',
            },
            mnemonicL: {
                width: '32px',
                height: '32px',
            },
        };
    }
}
