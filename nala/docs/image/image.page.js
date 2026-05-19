export default class MasImage {
    constructor(page) {
        this.page = page;
    }

    getCard(id) {
        return this.page.locator(`merch-card:has(aem-fragment[fragment="${id}"])`);
    }

    /** All footer CTA buttons in the image gallery (three cards). */
    getGalleryFooterCtas() {
        return this.page.locator('.three-merch-cards merch-card div[slot="footer"] button');
    }
}
