export default class PromotedPlansPage {
    constructor(page) {
        this.page = page;

        this.cardTitle = page.locator('h3[slot="heading-xxxs"]');
        this.cardDescription = page.locator('div[slot="body-xxs"]');
        this.cardIcon = page.locator('merch-icon[slot="icons"]');
        this.cardPriceSlot = page.locator('p[slot="price"]');
        this.cardPrice = page
            .locator('span[data-template="price"] .price')
            .first();
        this.cardPriceStrikethrough = page.locator(
            'span[data-template="price"] .price-strikethrough',
        );
        this.priceRecurrenceText = page.locator('p[slot="price"] em');
        this.termsLink = page.locator('div[slot="cta"] a.spectrum-Link');
        this.cardCTA = page.locator('div[slot="cta"] button');
        this.freeTrialButton = page.locator(
            'div[slot="cta"] button[data-analytics-id="free-trial"]',
        );
        this.buyNowButton = page.locator(
            'div[slot="cta"] button[data-analytics-id="buy-now"]',
        );
        this.cardBorderGradient = page.locator(
            'merch-card[gradient-border="true"]',
        );
    }
}
