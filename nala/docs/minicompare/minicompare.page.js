export default class MasMinicompare {
    constructor(page) {
        this.page = page;
    }

    getCard(id) {
        return this.page.locator(`merch-card:has(aem-fragment[fragment="${id}"])`);
    }

    getGalleryFooterCtas() {
        return this.page.locator('.three-merch-cards merch-card div[slot="footer"] :is(a, button)');
    }

    getMnemonicRow(id, index = 0) {
        return this.getCard(id).locator('merch-whats-included merch-mnemonic-list').nth(index);
    }
}
