export default class BulkActionsPage {
    constructor(page) {
        this.page = page;
        this.bulkPublishEditor = page.locator('mas-bulk-publish-editor');
        this.addBySearchButton = this.bulkPublishEditor.locator('[data-testid="add-by-search-btn"]');
        this.addItemsDialog = page.locator('mas-add-items-dialog');
        this.searchInput = this.addItemsDialog.locator('sp-search');
        this.fragmentsTab = this.addItemsDialog.locator('sp-tab[value="cards"]');
        this.collectionsTab = this.addItemsDialog.locator('sp-tab[value="collections"]');
        this.placeholdersTab = this.addItemsDialog.locator('sp-tab[value="placeholders"]');
        this.itemsTable = this.addItemsDialog.locator('mas-select-items-table:not([hidden])');
        this.selectAllCheckbox = this.addItemsDialog.locator(
            'mas-select-items-table:not([hidden]) sp-checkbox[aria-label="Select all loaded items"]',
        );
        this.tableRowCheckboxes = this.addItemsDialog.locator('mas-select-items-table:not([hidden]) sp-table-body sp-checkbox');
        this.addSelectedButton = this.addItemsDialog.locator('sp-button[variant="accent"]');
    }

    async openBulkPublishAddBySearch() {
        await this.addBySearchButton.click();
        await this.addItemsDialog.waitFor({ state: 'visible' });
    }

    async switchToTab(tabName) {
        const tabMap = {
            cards: this.fragmentsTab,
            collections: this.collectionsTab,
            placeholders: this.placeholdersTab,
        };
        await tabMap[tabName].click();
    }

    async searchFor(query) {
        await this.searchInput.fill(query);
        await this.searchInput.press('Enter');
    }

    async clickSelectAll() {
        await this.selectAllCheckbox.click();
    }
}
