export default class MasSpecialoffer {
    constructor(page) {
        this.page = page;
    }

    getCard(id) {
        return this.page.locator(`merch-card:has(aem-fragment[fragment="${id}"])`);
    }

    /** All footer CTAs in the Special Offer gallery (links and buttons). */
    getGalleryFooterCtas() {
        return this.page.locator('.three-merch-cards merch-card div[slot="footer"] :is(a, button)');
    }
}
