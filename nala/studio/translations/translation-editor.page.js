import { expect } from '@playwright/test';
import { getCurrentRunId, getTitle } from '../../utils/fragment-tracker.js';
import { beginFragmentCreation, completeFragmentCreation } from '../../utils/fragment-ledger.js';

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
        this.addItemsSelector = page.locator('#add-items-overlay sp-dialog-wrapper.add-items-dialog mas-items-selector');

        // Tabs
        this.cardsTab = this.addItemsSelector.locator('sp-tab[value="cards"]');
        this.collectionsTab = this.addItemsSelector.locator('sp-tab[value="collections"]');
        this.placeholdersTab = this.addItemsSelector.locator('sp-tab[value="placeholders"]');

        // Table
        const fragmentsTab = this.addItemsSelector.getByRole('tabpanel', { name: 'Fragments' });
        this.selectItemsTable = fragmentsTab.locator('mas-select-items-table');
        this.cardsTable = fragmentsTab.locator('mas-select-items-table');
        this.tableRows = this.cardsTable.locator('sp-table-body > mas-collapsible-table-row > sp-table-row');
        this.tableRowCheckbox = (index) => this.tableRows.nth(index).locator('sp-checkbox');

        // Quick actions
        this.saveButton = page.locator('mas-quick-actions sp-action-button[title="Save"]');
        this.sendToLocButton = page.locator('mas-quick-actions sp-action-button[title="Send to Localization"]');

        // Select items dialog
        this.selectItemsDialog = page.getByRole('dialog', { name: 'Select items' });
        this.addSelectedItemsButton = this.selectItemsDialog.getByRole('button', { name: 'Add selected items' });
        this.selectedItemsButton = this.addItemsSelector.locator('.selected-items-count sp-button');
        this.importUrlButton = this.addItemsSelector.locator('sp-button.import-url-btn');
        this.importUrlInput = this.addItemsSelector.locator('textarea.import-url-input');
        this.importedUrlRows = this.addItemsSelector.locator('.import-item-row');
        this.importToastPositive = this.addItemsSelector.locator('.import-url-view sp-toast[variant="positive"]');
        this.importToastNegative = this.addItemsSelector.locator('.import-url-view sp-toast[variant="negative"]');

        this.searchInput = this.addItemsSelector.locator('.dialog-header sp-search input');
        this.fragmentsResultCount = fragmentsTab.locator('mas-search-and-filters .result-count');
        this.appliedFilterTags = fragmentsTab.locator('mas-search-and-filters .applied-filters sp-tag');

        // Filters
        this.filterPicker = (label) =>
            label === 'Template'
                ? fragmentsTab
                      .locator('overlay-trigger')
                      .filter({ has: page.getByRole('button', { name: /^Template(?:\s|$)/ }) })
                : fragmentsTab.locator(`aem-tag-picker-field[label="${label}"]`);

        // Collections tab
        const collectionsTabPanel = this.addItemsSelector.getByRole('tabpanel', { name: 'Collections' });
        this.selectItemsTableCollections = collectionsTabPanel.locator('mas-select-items-table');
        this.tableRowsCollections = this.selectItemsTableCollections.locator('sp-table-body sp-table-row');
        this.tableRowCheckboxCollections = (index) =>
            this.selectItemsTableCollections.locator('sp-table-body sp-table-row').nth(index).locator('sp-checkbox');

        // Placeholders tab
        const placeholdersTabPanel = this.addItemsSelector.getByRole('tabpanel', { name: 'Placeholders' });
        this.selectItemsTablePlaceholders = placeholdersTabPanel.locator('mas-select-items-table');
        this.tableRowsPlaceholders = this.selectItemsTablePlaceholders.locator('sp-table-body sp-table-row');
        this.tableRowCheckboxPlaceholders = (index) =>
            this.selectItemsTablePlaceholders.locator('sp-table-body sp-table-row').nth(index).locator('sp-checkbox');

        // Copy offer ID
        this.copyOfferIdButton = this.cardsTable.locator('sp-action-button[aria-label="Copy Offer ID to clipboard"]');

        // Expand/collapse button
        this.expandRowButton = (index) => this.tableRows.nth(index).locator('sp-button.ghost-button').first();

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
        await this.page.locator('.select-all-row sp-checkbox').click();
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
        const creation = beginFragmentCreation('translation');
        await this.saveButton.click();
        await expect(this.page.locator('mas-toast sp-toast[variant="positive"]')).toBeVisible();
        await completeFragmentCreation(creation, this.page, 'mas-translation-editor', 'translationProject');
    }

    async pasteImportUrl(url) {
        await this.importUrlInput.evaluate((input, text) => {
            const clipboardData = new DataTransfer();
            clipboardData.setData('text/plain', text);
            input.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, clipboardData }));
        }, url);
    }

    async selectFilter(label, option) {
        const picker = this.filterPicker(label);
        const trigger = picker.locator('sp-action-button[slot="trigger"]');
        const popover = picker.locator('sp-popover');
        await trigger.click();
        await expect(popover).toBeVisible();
        await popover.getByRole('checkbox', { name: option, exact: true }).check();
        if (label === 'Template') {
            await trigger.click();
        } else {
            const selectedPath = await popover
                .locator('sp-checkbox')
                .filter({ has: this.page.getByRole('checkbox', { name: option, exact: true }) })
                .getAttribute('value');
            await expect.poll(() => picker.evaluate((field) => field.tempValue)).toContain(selectedPath);
            await popover.getByRole('button', { name: 'Apply', exact: true }).click();
            await expect.poll(() => picker.evaluate((field) => field.value)).toContain(selectedPath);
        }
        await expect(popover).toBeHidden();
    }

    async getSearchSourceTitle() {
        const table = await this.cardsTable.elementHandle();
        const title = await this.page.waitForFunction(
            ({ table, runId }) =>
                table.itemsToDisplay.find(
                    ({ title }) =>
                        title &&
                        (!title.startsWith('MAS.Nala.Automation.') ||
                            (runId && title.startsWith(`MAS.Nala.Automation.${runId}.source.`))),
                )?.title,
            { table, runId: getCurrentRunId() },
        );
        return (await title.jsonValue()).trim();
    }

    async expectCardRowsMatchSearchTerm(term) {
        const rows = this.tableRows;
        const q = term.toLowerCase();
        await expect(async () => {
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
        }).toPass({ timeout: 30000 });
    }

    async expectResultCountMatchesTableRows() {
        await expect(this.fragmentsResultCount).toHaveText(/\d+\s+result/i, { timeout: 30000 });
        await expect
            .poll(
                async () => {
                    const [text, rows] = await Promise.all([
                        this.fragmentsResultCount.textContent(),
                        this.cardsTable.locator('sp-table-body > mas-collapsible-table-row').count(),
                    ]);
                    const counter = Number.parseInt(text, 10);
                    return { counter, rows, agrees: counter === rows };
                },
                { timeout: 30000 },
            )
            .toMatchObject({ agrees: true });
    }

    async expectCardRowsColumnContains(columnIndex, substring) {
        const rows = this.tableRows;
        await expect(async () => {
            const count = await rows.count();
            expect(count).toBeGreaterThan(0);
            for (let i = 0; i < count; i++) {
                await expect(rows.nth(i).locator('sp-table-cell').nth(columnIndex)).toContainText(substring, {
                    ignoreCase: true,
                });
            }
        }).toPass({ timeout: 30000 });
    }
}
