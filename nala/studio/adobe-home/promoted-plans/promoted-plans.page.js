export default class CCDPromotedPlansPage {
    constructor(page) {
        this.page = page;

        this.title = page.locator('.card-title');
        this.eyebrow = page.locator('.card-eyebrow');
        this.description = page.locator('.card-description');
        this.price = page.locator('.card-price');
        this.cta = page.locator('.card-cta');
        this.icon = page.locator('.card-icon');
        this.backgroundImage = page.locator('.card-background');

        // promoted-plans card properties:
        this.cssProp = {};
    }
}
