export default class TryBuyWidgetPage {
    constructor(page) {
        this.page = page;

        this.cardTitle = page.locator('h3[slot="heading-xxxs"]');
        this.cardDescription = page.locator('div[slot="body-xxs"]');
        this.cardIcon = page.locator('merch-icon[slot="icons"]');
        this.cardImage = page.locator('div[slot="image"] img');
        this.cardPriceSlot = page.locator('p[slot="price"]');
        this.cardPrice = page
            .locator('span[data-template="price"] > .price')
            .first();
        this.cardPriceStrikethrough = page.locator(
            'span[data-template="price"] > .price-strikethrough',
        );
        this.cardCTASlot = page.locator('div[slot="cta"]');
    }
}
