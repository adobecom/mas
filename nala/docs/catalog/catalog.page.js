export default class MasCatalog {
    constructor(page) {
        this.page = page;
    }

    getGalleryHeading() {
        return this.page.locator('#catalog-gallery');
    }

    getCard(fragmentId) {
        return this.page.locator(`merch-card:has(aem-fragment[fragment="${fragmentId}"])`).first();
    }

    getCatalogCards() {
        return this.page.locator('.three-merch-cards.catalog merch-card[variant="catalog"]');
    }

    getGalleryFooterCtas() {
        return this.page.locator('.three-merch-cards.catalog merch-card div[slot="footer"] :is(a, button)');
    }
}
