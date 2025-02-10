export default class CCDSlicePage {
    constructor(page) {
        this.page = page;

        this.cardIcon = page.locator('merch-icon');
        this.cardBadge = page.locator('.ccd-slice-badge');
        this.cardImage = page.locator('div[slot="image"] img');
        this.cardDescription = page
            .locator('div[slot="body-s"] p > strong')
            .first();
        this.cardLegalLink = page.locator('div[slot="body-s"] p > a');
        this.cardCTA = page.locator('div[slot="footer"] > sp-button');
        this.cardCTALink = page.locator(
            'div[slot="footer"] a[is="checkout-link"]',
        );
        // this.price = page.locator('span[data-template="price"]');
        // this.priceStrikethrough = page.locator(
        //     'span[data-template="strikethrough"]',
        // );
    }
}
