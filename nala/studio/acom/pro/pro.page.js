export default class ACOMProCardPage {
    constructor(page) {
        this.page = page;

        // Card element selectors (light DOM slots)
        this.cardIcon = page.locator('merch-icon').first();
        this.cardSubtitle = page.locator('[slot="subtitle"]');
        this.cardTitle = page.locator('h3[slot="heading-xs"]');
        this.cardDescription = page.locator('div[slot="body-xs"]');
        // CSS (font/color) is applied to the slotted <p>, and the inner price
        // span markup varies per fragment — target the slotted element itself.
        this.cardPrice = page.locator('p[slot="heading-m"]');
        this.cardPromoText = page.locator('p[slot="promo-text"]');
        this.cardLegalText = page.locator('[slot="legal-text"]');
        this.cardCallout = page.locator('div[slot="callout-content"]');
        this.cardAddon = page.locator('merch-addon[slot="addon"]');
        this.cardCTA = page.locator('div[slot="footer"] > a[is="checkout-link"]');
        this.cardQuantitySelector = page.locator('merch-quantity-select');
        this.cardWhatsIncluded = page.locator('div[slot="whats-included"]');
        this.cardWhatsIncludedSection = page.locator('div[slot="whats-included"] .section');

        // Shadow DOM elements (Playwright locators pierce shadow roots)
        this.cardTopCard = page.locator('.top-card');
        this.cardWhatsIncludedToggle = page.locator('button.whats-included-toggle');
        this.cardWhatsIncludedToggleLabel = page.locator('.whats-included-toggle-label');
        this.cardFeaturesZone = page.locator('.features-zone');
        this.cardLicenseZone = page.locator('.license-zone');
        this.cardLicenseSelectTrigger = page.locator('button.license-select-trigger');
        this.cardSecureTransaction = page.locator('.secure-transaction-label');

        // Pro card CSS properties:
        this.cssProp = {
            tokens: {
                '--consonant-merch-card-pro-bg-default': '#fff',
                '--consonant-merch-card-pro-bg-subtle': '#f8f8f8',
                '--consonant-merch-card-pro-text-color': '#000',
            },
            card: {
                'background-color': 'rgb(248, 248, 248)',
                'border-radius': '16px',
            },
            topCard: {
                'background-color': 'rgb(255, 255, 255)',
                'border-radius': '12px',
                padding: '24px',
            },
            title: {
                color: 'rgb(0, 0, 0)',
                'font-size': '24px',
                'font-weight': '900',
                'line-height': '24px',
            },
            description: {
                color: 'rgb(0, 0, 0)',
                'font-size': '14px',
                'font-weight': '400',
                'line-height': '18px',
            },
            price: {
                color: 'rgb(0, 0, 0)',
                'font-size': '18px',
                'font-weight': '900',
                'line-height': '21px',
            },
            whatsIncludedToggle: {
                color: 'rgb(0, 0, 0)',
                'font-size': '14px',
                'font-weight': '700',
                'line-height': '18px',
                cursor: 'pointer',
            },
            licenseSelectTrigger: {
                'background-color': 'rgb(255, 255, 255)',
                'border-radius': '8px',
                height: '40px',
                'font-size': '14px',
            },
        };
    }
}
