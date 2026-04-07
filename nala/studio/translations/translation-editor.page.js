import { expect } from '@playwright/test';
import { getTitle } from '../../utils/fragment-tracker.js';

export default class TranslationEditorPage {
    constructor(page) {
        this.page = page;

        // Translation editor form
        this.form = page.locator('.translation-editor-form');
        this.breadcrumb = page.locator('.nav-breadcrumbs sp-breadcrumbs');

        // General info section
        this.titleField = page.locator('#title');

        // Selected languages section
        this.addLanguagesButton = page.locator('#add-languages-overlay [slot="trigger"]').first();

        this.selectedItemsHeader = page
            .locator('mas-translation-editor')
            .getByRole('heading', { name: /Selected items\s*\(\d+\)/ });
        this.addItemsButton = page.locator('#add-items-overlay [slot="trigger"]').first();
        this.selectedItemsToggleButton = page.locator('.form-field.selected-items .selected-items-header sp-button.toggle-btn');
        this.selectedItemsExpandedPanel = page
            .locator('mas-translation-editor mas-items-selector')
            .filter({ hasText: /Fragments\s*\(\d+\)/ });

        // Tabs
        this.cardsTab = page.locator('mas-items-selector sp-tab[value="cards"]');
        this.collectionsTab = page.locator('mas-items-selector sp-tab[value="collections"]');
        this.placeholdersTab = page.locator('mas-items-selector sp-tab[value="placeholders"]');

        // Table
        const fragmentsTab = page.getByRole('tabpanel', { name: 'Fragments' });
        this.selectItemsTable = fragmentsTab.locator('mas-select-items-table');
        this.cardsTable = fragmentsTab.locator('mas-select-items-table');
        this.tableRows = this.cardsTable.locator('sp-table-body sp-table-row');
        this.tableRowCheckbox = (index) =>
            this.cardsTable.locator('sp-table-body sp-table-row').nth(index).locator('sp-checkbox');

        // Quick actions
        this.saveButton = page.locator('mas-quick-actions sp-action-button[title="Save"]');
        this.sendToLocButton = page.locator('mas-quick-actions sp-action-button[title="Send to Localization"]');

        // Select items dialog
        this.selectItemsDialog = page.getByRole('dialog', { name: 'Select items' });
        this.addSelectedItemsButton = this.selectItemsDialog.getByRole('button', { name: 'Add selected items' });
        this.selectedItemsButton = page.locator('mas-items-selector .selected-items-count sp-button');

        this.searchInput = fragmentsTab.locator(
            'mas-search-and-filters sp-search input, mas-search-and-filters input[type="search"]',
        );
        this.fragmentsResultCount = fragmentsTab.locator('mas-search-and-filters .result-count');
        this.appliedFilterTags = fragmentsTab.locator('mas-search-and-filters .applied-filters sp-tag');

        // Filters
        this.filterButtons = page.locator('sp-action-button.filter-trigger');
        this.filterPopover = page.locator('sp-popover.filter-popover[open]').first();

        // Collections tab
        const collectionsTabPanel = page.getByRole('tabpanel', { name: 'Collections' });
        this.selectItemsTableCollections = collectionsTabPanel.locator('mas-select-items-table');
        this.tableRowsCollections = this.selectItemsTableCollections.locator('sp-table-body sp-table-row');
        this.tableRowCheckboxCollections = (index) =>
            this.selectItemsTableCollections.locator('sp-table-body sp-table-row').nth(index).locator('sp-checkbox');

        // Placeholders tab
        const placeholdersTabPanel = page.getByRole('tabpanel', { name: 'Placeholders' });
        this.selectItemsTablePlaceholders = placeholdersTabPanel.locator('mas-select-items-table');
        this.tableRowsPlaceholders = this.selectItemsTablePlaceholders.locator('sp-table-body sp-table-row');
        this.tableRowCheckboxPlaceholders = (index) =>
            this.selectItemsTablePlaceholders.locator('sp-table-body sp-table-row').nth(index).locator('sp-checkbox');

        // Copy offer ID
        this.copyOfferIdButton = this.cardsTable.locator('sp-action-button[aria-label="Copy Offer ID to clipboard"]');

        // Expand/collapse button
        this.expandRowButton = (index) =>
            this.cardsTable.locator('sp-table-body sp-table-row').nth(index).locator('sp-button.expand-button').first();

        // View-only mode
        this.viewOnlyCardsTab = page.getByRole('tabpanel', { name: /Fragments\s*\(\d+\)/ }).first();

        this.deleteButton = page.locator('mas-quick-actions sp-action-button[title="Delete"]');
        this.editLanguagesButton = page.locator('.selected-langs-header sp-action-button', { hasText: 'Edit' });
        this.editItemsButton = page.locator('.selected-items-header sp-action-button', { hasText: 'Edit' });

        this.COLUMNS = {
            OFFER: 2,
            FRAGMENT_TITLE: 3,
            OFFER_ID: 4,
            PATH: 5,
            STATUS: 6,
        };
    }

    async createTranslationProject() {
        const title = getTitle();
        await expect(this.form).toBeVisible({ timeout: 10000 });

        // Fill title
        await this.titleField.click();
        await this.page.keyboard.type(title);
        await this.page.waitForTimeout(300);

        // Add languages
        await this.addLanguagesButton.click();
        const selectLangsDialog = this.page.getByRole('dialog', { name: 'Select languages' });
        await expect(selectLangsDialog).toBeVisible({ timeout: 10000 });
        await this.page.locator('.select-all-lang sp-checkbox').click();
        await this.page.locator('sp-dialog-wrapper.add-langs-dialog sp-button[variant="accent"]').click();
        await expect(selectLangsDialog).not.toBeVisible({ timeout: 5000 });

        // Add items
        await this.addItemsButton.click();
        await expect(this.cardsTab).toBeVisible({ timeout: 10000 });
        await this.cardsTab.click();
        await expect(this.tableRows.first()).toBeVisible({ timeout: 30000 });
        await this.tableRowCheckbox(0).click();
        await this.addSelectedItemsButton.click();
        await expect(this.selectItemsDialog).not.toBeVisible({ timeout: 10000 });
        return title;
    }

    async saveTranslationProject() {
        await expect(this.saveButton).toBeEnabled({ timeout: 10000 });
        await this.saveButton.click();
        await this.page.waitForTimeout(2000);
    }

    async expectCardRowsMatchSearchTerm(term) {
        const rows = this.tableRows;
        const q = term.toLowerCase();
        const count = await rows.count();
        expect(count).toBeGreaterThan(0);
        for (let i = 0; i < count; i++) {
            const row = rows.nth(i);
            const title = (await row.locator('sp-table-cell').nth(this.COLUMNS.FRAGMENT_TITLE).textContent()).toLowerCase();
            const offer = (await row.locator('sp-table-cell').nth(this.COLUMNS.OFFER).textContent()).toLowerCase();
            const offerId = (await row.locator('sp-table-cell').nth(this.COLUMNS.OFFER_ID).textContent()).toLowerCase();
            const matches = title.includes(q) || offer.includes(q) || offerId.includes(q);
            expect(matches).toBe(true);
        }
    }

    async expectResultCountMatchesTableRows() {
        await expect(this.fragmentsResultCount).toHaveText(/\d+\s+result/i, { timeout: 30000 });
        const text = await this.fragmentsResultCount.textContent();
        const m = text?.match(/(\d+)/);
        const expected = m ? parseInt(m[1], 10) : 0;
        await expect(this.tableRows).toHaveCount(expected);
    }

    async expectCardRowsColumnContains(columnIndex, substring) {
        const rows = this.tableRows;
        const count = await rows.count();
        expect(count).toBeGreaterThan(0);
        for (let i = 0; i < count; i++) {
            await expect(rows.nth(i).locator('sp-table-cell').nth(columnIndex)).toContainText(substring, { ignoreCase: true });
        }
    }
}
