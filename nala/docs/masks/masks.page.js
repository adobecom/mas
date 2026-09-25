export default class MasksPage {
    constructor(page) {
        this.page = page;
        this.btnMask = page.locator('#btnMask');
        this.btnUnMask = page.locator('#btnUnMask');
    }

    card(fragmentId) {
        const fragment = this.page.locator(`aem-fragment[fragment="${fragmentId}"]`);
        const card = this.page.locator('merch-card').filter({ has: fragment });
        return {
            card,
            badge: card.locator('[slot="badge"] merch-badge').or(card.locator('merch-badge')),
            title: card.locator('h3[slot="heading-xs"]'),
            description: card.locator('[slot="body-xs"]'),
            bodyM: card.locator('[slot="body-m"]'),
        };
    }
}
