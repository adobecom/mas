export default class PromoHistoryPage {
    constructor(page) {
        this.page = page;
        this.panel = page.locator('mas-promotion-history');
        this.cards = this.panel.locator('.history-card[data-event-id]');
        this.restoreSelectedButton = this.panel.locator('#restore-selected');
        this.confirmation = this.panel.locator('#restore-confirmation');
        this.confirmRestore = this.confirmation.getByRole('button', { name: 'Restore', exact: true });
    }

    async open(projectId) {
        const url = new URL(this.page.url());
        url.hash = new URLSearchParams({ page: 'promotions-history', promotionId: projectId, path: 'nala' }).toString();
        await this.page.goto(url.toString());
    }
}
