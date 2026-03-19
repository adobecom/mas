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
    }
    async addOneItemAndConfirm() {
        await this.addItemsButton.click();
        await this.selectItemsDialog.waitFor({ state: 'visible', timeout: 10000 });
        await this.page.waitForTimeout(2000);
        await this.page.evaluate(() => {
            function findAllInShadow(root, selector) {
                const list = [];
                const direct = root.querySelectorAll(selector);
                direct.forEach((el) => list.push(el));
                root.querySelectorAll('*').forEach((node) => {
                    if (node.shadowRoot) list.push(...findAllInShadow(node.shadowRoot, selector));
                });
                return list;
            }
            const tables = findAllInShadow(document.body, 'mas-select-items-table');
            // When MWPW-190616 is fixed, change back to clicking the row instead of the checkbox
            // const tableEl = tables.find((el) => el.shadowRoot?.querySelector('sp-table.fragments-table sp-table-row'));
            // const row = tableEl?.shadowRoot?.querySelector('sp-table.fragments-table sp-table-row');
            // if (row) row.click();
            const tableEl = tables.find((el) => el.shadowRoot?.querySelector('sp-table.fragments-table'));
            if (!tableEl?.shadowRoot) return;
            const checkboxes = findAllInShadow(tableEl.shadowRoot, 'sp-checkbox');
            const checkbox = checkboxes[0];
            if (checkbox) checkbox.click();
        });
        await this.page.waitForTimeout(500);
        await this.selectItemsDialog.getByRole('button', { name: 'Add selected items' }).click();
        await this.selectItemsDialog.waitFor({ state: 'hidden', timeout: 5000 });
        this.filterButtons = page.locator('sp-action-button.filter-trigger');
        this.filterPopover = page.locator('sp-popover.filter-popover[open]').first();

        const collectionsTabPanel = page.getByRole('tabpanel', { name: 'Collections' });
        const placeholdersTabPanel = page.getByRole('tabpanel', { name: 'Placeholders' });
        this.selectItemsTableCollections = collectionsTabPanel.locator('mas-select-items-table');
        this.selectItemsTablePlaceholders = placeholdersTabPanel.locator('mas-select-items-table');

        // Collections / Placeholders table rows and checkboxes
        this.tableRowsCollections = this.selectItemsTableCollections.locator('sp-table-body sp-table-row');
        this.tableRowCheckboxCollections = (index) =>
            this.selectItemsTableCollections.locator('sp-table-body sp-table-row').nth(index).locator('sp-checkbox');
        this.tableRowsPlaceholders = this.selectItemsTablePlaceholders.locator('sp-table-body sp-table-row');
        this.tableRowCheckboxPlaceholders = (index) =>
            this.selectItemsTablePlaceholders.locator('sp-table-body sp-table-row').nth(index).locator('sp-checkbox');

        this.copyOfferIdButton = this.cardsTable.locator('sp-action-button[aria-label="Copy Offer ID to clipboard"]');

        // Loading state
        this.expandRowButton = (index) =>
            this.cardsTable
                .locator('sp-table-body sp-table-row')
                .nth(index)
                .locator('button[aria-label*="expand"], sp-action-button')
                .first();

        // View-only mode
        this.viewOnlyCardsTab = page.getByRole('tabpanel', { name: /Fragments\s*\(\d+\)/ }).first();
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
        await expect(this.tableRows.first()).toBeVisible({ timeout: 10000 });
        await this.tableRowCheckbox(0).click();
        await this.addSelectedItemsButton.click();
        await expect(this.selectItemsDialog).not.toBeVisible({ timeout: 10000 });
    }

    async saveTranslationProject() {
        await expect(this.saveButton).toBeEnabled({ timeout: 10000 });
        await this.saveButton.click();
        await this.page.waitForTimeout(2000);
    }
}
