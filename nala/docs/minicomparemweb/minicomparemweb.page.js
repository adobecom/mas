export default class MasMinicompareMweb {
    constructor(page) {
        this.page = page;
    }

    getGalleryHeading() {
        return this.page.locator('#mini-compare-mweb-chart-gallery');
    }

    getCard(fragmentId) {
        return this.page.locator(`merch-card:has(aem-fragment[fragment="${fragmentId}"])`).first();
    }

    getMwebCards() {
        return this.page.locator(
            '.mini-compare-chart-mweb-gallery-content .three-merch-cards merch-card[variant="mini-compare-chart-mweb"]',
        );
    }

    getGalleryFooterCtas() {
        return this.page.locator(
            '.mini-compare-chart-mweb-gallery-content .three-merch-cards merch-card div[slot="footer"] :is(a, button)',
        );
    }
}
