export default class MasBrandConcierge {
    constructor(page) {
        this.page = page;
    }

    getCard(id) {
        return this.page.locator(`merch-card:has(aem-fragment[fragment="${id}"])`).first();
    }

    getStudioLink(id) {
        return this.page.locator(`.commerce-item:has(aem-fragment[fragment="${id}"]) a.commerce-link`);
    }
}
