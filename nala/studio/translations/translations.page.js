export default class TranslationsPage {
    constructor(page) {
        this.page = page;

        // Translations list is inside mas-translation (shadow DOM)
        const translationHost = page.locator('mas-translation');

        // Loading indicator
        this.loadingIndicator = translationHost.locator('.loading-container sp-progress-circle');

        // Table (when projects exist)
        this.translationTable = translationHost.locator('sp-table.translation-table');
        this.tableHeaders = {
            translationProject: translationHost.locator('sp-table-head-cell:has-text("Translation Project")'),
            lastUpdatedBy: translationHost.locator('sp-table-head-cell:has-text("Last updated by")'),
            sentOn: translationHost.locator('sp-table-head-cell:has-text("Sent on")'),
            actions: translationHost.locator('sp-table-head-cell:has-text("Actions")'),
        };
        this.tableRows = translationHost.locator('sp-table.translation-table sp-table-row');

        // Empty state (when no projects)
        this.emptyState = translationHost.locator('.translation-empty-state');
        this.emptyStateMessage = translationHost.locator('text=No translation projects found.');
    }

    // Wait for the translations list to finish loading (either table or empty state visible).
    async waitForListToLoad(timeout = 15000) {
        await this.loadingIndicator.waitFor({ state: 'hidden', timeout }).catch(() => {
            // Loading may have already finished
        });
        await Promise.race([
            this.translationTable.waitFor({ state: 'visible', timeout }),
            this.emptyState.waitFor({ state: 'visible', timeout }),
        ]);
    }

    // Returns true if the table with projects is visible, false if empty state is shown.
    async hasProjects() {
        return await this.translationTable.isVisible();
    }

    // Get number of project rows in the table.
    async getProjectRowCount() {
        return await this.tableRows.count();
    }
}
