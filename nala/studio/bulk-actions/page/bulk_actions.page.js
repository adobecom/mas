import { expect } from '@playwright/test';

export default class BulkActionsPage {
    constructor(page) {
        this.page = page;
        this.bulkPublishList = page.locator('mas-bulk-publish');
        this.createProjectButton = this.bulkPublishList.locator('[data-testid="create-btn"]');
        this.bulkPublishEditor = page.locator('mas-bulk-publish-editor');
        this.addBySearchButton = this.bulkPublishEditor.locator('[data-testid="add-by-search-btn"]');
        this.addItemsDialog = page.locator('mas-add-items-dialog');
        this.searchInput = this.addItemsDialog.locator('.search-row sp-search');
        this.fragmentsTab = this.addItemsDialog.locator('sp-tab[value="cards"]');
        this.collectionsTab = this.addItemsDialog.locator('sp-tab[value="collections"]');
        this.placeholdersTab = this.addItemsDialog.locator('sp-tab[value="placeholders"]');
        this.selectAllCheckbox = this.addItemsDialog.locator(
            'mas-select-items-table:not([hidden]) sp-checkbox[aria-label="Select all loaded items"]',
        );
        this.tableRowCheckboxes = this.addItemsDialog.locator('mas-select-items-table:not([hidden]) sp-table-body sp-checkbox');
        this.addSelectedButton = this.addItemsDialog.getByRole('button', { name: 'Add selected items' });
    }

    async navigateToBulkPublishList(baseURL, miloLibs) {
        const url = `${baseURL}/studio.html${miloLibs}#page=bulkPublish&path=nala`;
        await this.page.goto(url);
        await this.page.waitForLoadState('domcontentloaded');
        await this.bulkPublishList.waitFor({ state: 'visible' });
    }

    async createNewProject() {
        await this.createProjectButton.click();
        await this.bulkPublishEditor.waitFor({ state: 'visible' });
    }

    async openBulkPublishAddBySearch() {
        await this.addBySearchButton.click();
        await this.searchInput.waitFor({ state: 'visible' });
    }

    async switchToTab(tabName) {
        const tabMap = {
            cards: this.fragmentsTab,
            collections: this.collectionsTab,
            placeholders: this.placeholdersTab,
        };
        await tabMap[tabName].click();
        if (tabName === 'cards') {
            await this.addItemsDialog.locator('.filter-row mas-search-and-filters').waitFor({ state: 'visible' });
        } else {
            await this.addItemsDialog.locator('mas-search-and-filters[search-only]').waitFor({ state: 'attached' });
            await expect(this.addItemsDialog.locator('.filter-row')).toHaveCount(0);
        }
    }

    async searchFor(query) {
        const innerInput = this.searchInput.locator('input');
        await innerInput.fill(query);
        await innerInput.press('Enter');
    }

    async clickSelectAll() {
        await this.selectAllCheckbox.click();
    }
}
