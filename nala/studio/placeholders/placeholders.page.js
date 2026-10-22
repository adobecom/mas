export default class PlaceholdersPage {
    constructor(page) {
        this.page = page;

        // Header elements
        this.localePicker = page.locator('mas-top-nav mas-locale-picker sp-action-menu');
        this.regionPicker = page.locator('mas-locale-picker[mode="region"] sp-action-menu');

        this.createButton = page.locator('sp-button.create-button');
        this.searchInput = page.getByRole('searchbox', { name: 'Search' });
        this.totalPlaceholdersLabel = page.locator('.placeholders-title:has-text("Total Placeholders")');

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
        this.creationModalKeyInput = this.creationModal.locator('#placeholder-key input');

        // Selection panel
        this.selectionPanel = page.locator('mas-selection-panel[open]');
        this.selectionActionBar = this.selectionPanel.locator('sp-action-bar[open]');
        this.copyStudioLinksButton = this.selectionPanel.locator('sp-action-button[label="Copy Studio Link(s)"]');
        this.copyContentLinksButton = this.selectionPanel.locator('sp-action-button[label="Copy Content Link(s)"]');

        // Loading indicator
        this.progressBar = page.locator('sp-progress-bar');

        // Toast notifications
        this.toastPositive = page.locator('mas-toast >> sp-toast[variant="positive"]');
        this.toastNegative = page.locator('mas-toast >> sp-toast[variant="negative"]');
        this.toastInfo = page.locator('mas-toast >> sp-toast[variant="info"]');
    }

    // Helper methods
    getPlaceholderByKey(key) {
        return this.placeholderRows.filter({ has: this.page.locator(`sp-table-row[value="${key}"]`) });
    }

    getPlaceholderTableRow(key) {
        return this.getPlaceholderByKey(key).locator(`sp-table-row[value="${key}"]`);
    }

    getRowMenuButton(key) {
        return this.getPlaceholderByKey(key).locator('button.action-menu-button:has(sp-icon-more)');
    }

    getRowMenuItems(key) {
        return this.getPlaceholderByKey(key).locator('.dropdown-menu .dropdown-item');
    }

    getPlaceholderKeyCell(key) {
        return this.getPlaceholderTableRow(key).locator('sp-table-cell.key');
    }

    async searchPlaceholder(searchTerm) {
        await this.searchInput.fill(searchTerm);
        await this.getPlaceholderByKey(searchTerm).waitFor({ state: 'visible', timeout: 10000 });
    }

    async selectPlaceholder(key) {
        const checkboxCell = this.getPlaceholderTableRow(key).locator('sp-table-checkbox-cell');
        await checkboxCell.waitFor({ state: 'visible', timeout: 10000 });
        await checkboxCell.click();
        await this.selectionPanel.waitFor({ state: 'attached', timeout: 10000 });
        await this.selectionActionBar.waitFor({ state: 'visible', timeout: 10000 });
    }

    async waitForTableToLoad() {
        // For test environment with path=nala, we expect placeholders to exist
        // Wait specifically for placeholder rows to appear
        await this.placeholderRows.first().waitFor({ timeout: 10000 });
    }

    async waitForPlaceholderRows() {
        // Strict wait that fails if no placeholder rows are found
        await this.placeholderRows.first().waitFor({ timeout: 10000 });
        const rowCount = await this.placeholderRows.count();
        if (rowCount === 0) {
            throw new Error('No placeholder rows found - expected at least one placeholder for path=nala');
        }
        return rowCount;
    }

    async getRowCount() {
        await this.waitForTableToLoad();
        return await this.placeholderRows.count();
    }

    async clickCreateButton() {
        await this.createButton.click();
        await this.creationModalKeyInput.waitFor({ timeout: 10000 });
    }

    async typePlaceholderKey(text) {
        await this.creationModalKeyInput.click();
        await this.creationModalKeyInput.pressSequentially(text);
    }

    async getPlaceholderKeyValue() {
        return this.creationModalKeyInput.inputValue();
    }

    async selectLocale(locale) {
        await this.localePicker.click();
        await this.localePicker.locator(`sp-menu-item:has-text("${locale}")`).click();
        await this.page.waitForTimeout(3000);
        await this.waitForTableToLoad();
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

    async getPlaceholderRowData(rowIndex = 0) {
        // Get data from a specific placeholder row
        const rows = await this.placeholderRows.all();
        if (rowIndex >= rows.length) {
            throw new Error(`Row index ${rowIndex} out of bounds (${rows.length} rows available)`);
        }

        const row = rows[rowIndex];
        const cells = await row.locator('sp-table-cell').all();

        return {
            key: await cells[0].textContent(),
            value: await cells[1].textContent(),
            status: await row.locator('mas-fragment-status').getAttribute('variant'),
            locale: await cells[3].textContent(),
            updatedBy: await cells[4].textContent(),
            updatedAt: await cells[5].textContent(),
        };
    }

    async verifyPlaceholderData(rowIndex = 0) {
        // Verify that a placeholder row contains valid data
        const data = await this.getPlaceholderRowData(rowIndex);

        // All fields should have content
        if (!data.key || data.key.trim() === '') {
            throw new Error('Placeholder key is empty');
        }
        if (!data.value || data.value.trim() === '') {
            throw new Error('Placeholder value is empty');
        }
        if (!data.status) {
            throw new Error('Placeholder status is missing');
        }
        if (!data.locale || data.locale.trim() === '') {
            throw new Error('Placeholder locale is empty');
        }

        return data;
    }

    async assertPlaceholdersExist() {
        // Strict assertion that placeholders must exist
        const rowCount = await this.waitForPlaceholderRows();
        const totalCount = await this.getTotalPlaceholdersCount();

        if (totalCount === 0) {
            throw new Error('Total placeholders count is 0 - expected at least one placeholder');
        }

        if (rowCount === 0) {
            throw new Error('No placeholder rows visible - expected at least one row');
        }

        // Verify first row has data
        await this.verifyPlaceholderData(0);

        return { rowCount, totalCount };
    }
}
