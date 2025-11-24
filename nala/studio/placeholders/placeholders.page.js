export default class PlaceholdersPage {
    constructor(page) {
        this.page = page;

        // Header elements
        this.localePicker = page.locator('button:has-text("Country:")');
        this.createButton = page.locator('sp-button:has-text("Create New Placeholder")');

        // Search and filters
        this.searchInput = page.locator('sp-search[placeholder="Search by key or value"]');
        this.totalPlaceholdersLabel = page.locator('h2:has-text("Total Placeholders")');

        // Table elements
        this.placeholdersTable = page.locator('sp-table');
        this.tableHeaders = {
            key: page.locator('sp-table-head-cell:has-text("Key")'),
            value: page.locator('sp-table-head-cell:has-text("Value")'),
            status: page.locator('sp-table-head-cell:has-text("Status")'),
            locale: page.locator('sp-table-head-cell:has-text("Locale")'),
            updatedBy: page.locator('sp-table-head-cell:has-text("Updated by")'),
            updatedAt: page.locator('sp-table-head-cell:has-text("Date & Time")'),
            action: page.locator('sp-table-head-cell:has-text("Action")'),
        };

        // Table rows
        this.placeholderRows = page.locator('mas-placeholders-item');
        this.tableRows = page.locator('sp-table-row');
        this.noPlaceholdersMessage = page.locator('text=No placeholders found');

        // Creation modal
        this.creationModal = page.locator('mas-placeholders-creation-modal');

        // Selection panel
        this.selectionPanel = page.locator('mas-selection-panel');

        // Loading indicator
        this.progressBar = page.locator('sp-progress-bar');

        // Toast notifications
        this.toastPositive = page.locator('mas-toast >> sp-toast[variant="positive"]');
        this.toastNegative = page.locator('mas-toast >> sp-toast[variant="negative"]');
        this.toastInfo = page.locator('mas-toast >> sp-toast[variant="info"]');
    }

    // Helper methods
    async getPlaceholderByKey(key) {
        return this.page.locator(`sp-table-row[value="${key}"]`);
    }

    async searchPlaceholder(searchTerm) {
        await this.searchInput.fill(searchTerm);
        await this.page.keyboard.press('Enter');
        await this.page.waitForTimeout(1000);
    }

    async waitForTableToLoad() {
        // Wait for either placeholder rows or no placeholders message
        await this.page.waitForSelector('mas-placeholders-item, text=No placeholders found', { timeout: 10000 });
    }

    async getRowCount() {
        await this.waitForTableToLoad();
        return await this.placeholderRows.count();
    }

    async clickCreateButton() {
        await this.createButton.click();
        await this.page.waitForSelector('mas-placeholders-creation-modal', { state: 'visible' });
    }

    async selectLocale(locale) {
        await this.localePicker.click();
        await this.page.locator(`sp-menu-item:has-text("${locale}")`).click();
    }

    async sortByColumn(columnName) {
        const column = this.tableHeaders[columnName.toLowerCase()];
        if (column) {
            await column.click();
        }
    }

    async isTableEmpty() {
        const noPlaceholdersVisible = await this.noPlaceholdersMessage.isVisible().catch(() => false);
        const rowCount = await this.placeholderRows.count();
        return noPlaceholdersVisible || rowCount === 0;
    }

    async getTotalPlaceholdersCount() {
        const text = await this.totalPlaceholdersLabel.textContent();
        const match = text.match(/Total Placeholders:\s*(\d+)/);
        return match ? parseInt(match[1]) : 0;
    }
}
