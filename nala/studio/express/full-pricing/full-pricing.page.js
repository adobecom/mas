export default class ACOMFullPricingExpressPage {
    constructor(page) {
        this.page = page;

        this.collection = page.locator('merch-card-collection, .card-collection, .pricing-collection');
        this.collectionTitle = page.locator('.collection-title');

        this.cardTitle = page.locator('merch-card :is(h1, h2, h3, h4)');
        this.cardIcon = page.locator('mas-mnemonic');
        this.cardIconsSlot = page.locator('merch-icon[slot="icons"]');
        this.cardPrice = page.locator('merch-card span[is="inline-price"]:not([data-template="strikethrough"])');
        this.cardPriceStrikethrough = page.locator('[slot="price"] span.price-strikethrough');
        this.cardStrikethroughPrice = page.locator(
            '[slot="price"] span[is="inline-price"][data-template="strikethrough"], [slot="price"] span.price-strikethrough',
        );
        this.cardPriceStrikethroughTaxLabel = page.locator('[slot="price"] span.price-strikethrough .price-tax-inclusivity');
        this.cardPriceStrikethroughRecurrenceLabel = page.locator('[slot="price"] span.price-strikethrough .price-recurrence');
        this.cardPriceStrikethroughUnitLabel = page.locator('[slot="price"] span.price-strikethrough .price-unit-type');
        this.cardPriceLegal = page.locator('span[is="inline-price"][data-template="legal"]');
        this.cardBody = page.locator('merch-card p');
        this.cardShortDescription = page.locator('div[slot="short-description"]');
        this.cardCTA = page.locator('[slot="cta"] button, [slot="cta"] a');
        this.cardBadge = page.locator('merch-badge[slot="badge"]');
        this.cardTrialBadge = page.locator('merch-badge[slot="trial-badge"]');
        this.cardBadgeLabel = page.locator('.badge');
        this.cardDivider = page.locator('[slot^="body"] hr').first();
        this.cardPhoneLink = page.locator('a[href^="tel:"]');
        this.cardLegalLink = page.locator('a.modal-Link, a.spectrum-Link, [slot="short-description"] a');
        this.cardHeadingPrice = page.locator('[slot="price"] .heading-s, [slot="price"] h3');
        this.cardLink = page.locator('[slot="short-description"] a, a.spectrum-Link');

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

        this.cssProp = {
            divider: {
                'border-color': 'rgb(0, 0, 0)',
            },
        };
    }
}
