export default class SuggestedPage {
    constructor(page) {
        this.page = page;

        this.cardIcon = page.locator('merch-icon');
        this.cardTitle = this.page.locator('h3[slot="heading-xs"]');
        this.cardEyebrow = page.locator('h4[slot="detail-s"]');
        this.cardDescription = page
            .locator('div[slot="body-xs"] p')
            .first();
        this.cardLegalLink = page.locator('div[slot="body-xs"] p > a');
        this.cardPrice = page.locator('p[slot="price"]');
        this.cardCTA = page.locator('div[slot="cta"] > sp-button');
        this.cardCTALink = page.locator(
            'div[slot="cta"] a[is="checkout-link"]',
        );
        // this.price = page.locator('span[data-template="price"]');
        // this.priceStrikethrough = page.locator(
        //     'span[data-template="strikethrough"]',
        // );
    }
}
