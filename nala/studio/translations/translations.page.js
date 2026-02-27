export default class TranslationsPage {
    constructor(page) {
        this.page = page;

        const translationHost = page.locator('mas-translation');
        this.loadingIndicator = translationHost.locator('.loading-container sp-progress-circle');

        this.translationTable = translationHost.locator('sp-table.translation-table');
        this.tableHeaders = {
            translationProject: translationHost.locator('sp-table-head-cell:has-text("Translation Project")'),
            lastUpdatedBy: translationHost.locator('sp-table-head-cell:has-text("Last updated by")'),
            sentOn: translationHost.locator('sp-table-head-cell:has-text("Sent on")'),
            actions: translationHost.locator('sp-table-head-cell:has-text("Actions")'),
        };
        this.emptyState = translationHost.locator('.translation-empty-state');
    }

    async waitForListToLoad(timeout = 15000) {
        await this.loadingIndicator.waitFor({ state: 'hidden', timeout }).catch(() => {});
        await Promise.race([
            this.translationTable.waitFor({ state: 'visible', timeout }),
            this.emptyState.waitFor({ state: 'visible', timeout }),
        ]);
    }

    async hasProjects() {
        return await this.translationTable.isVisible();
    }
}
