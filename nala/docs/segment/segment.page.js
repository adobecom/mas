export default class MasSegment {
    constructor(page) {
        this.page = page;
    }

    getCard(id) {
        return this.page.locator(`merch-card:has(aem-fragment[fragment="${id}"])`).first();
    }

    /** All footer CTAs in the Segment gallery (links and buttons). */
    getGalleryFooterCtas() {
        return this.page.locator('.three-merch-cards merch-card div[slot="footer"] :is(a, button)');
    }
}
