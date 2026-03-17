import { expect } from '@playwright/test';
import { getTitle } from '../../utils/fragment-tracker.js';

export default class TranslationEditorPage {
    constructor(page) {
        this.page = page;

        // Translation editor form
        this.form = page.locator('.translation-editor-form');
        this.breadcrumb = page.locator('.translation-editor-breadcrumb');

        // General info section
        this.titleField = page.locator('#title');

        // Selected languages section
        this.selectedLangsHeader = page.locator('.selected-langs-header h2');
        this.selectedLangsList = page.locator('.selected-langs-list');
        this.addLanguagesButton = page.locator('#add-languages-overlay sp-button[slot="trigger"]');

        // Selected files section
        this.selectedFilesHeader = page.locator('.selected-files-header h2');
        this.selectedFilesTable = page.locator('mas-select-fragments-table');
        this.addFilesButton = page.locator('#add-files-overlay sp-button[slot="trigger"]');

        // Quick actions
        this.saveButton = page.locator('mas-quick-actions mas-side-nav-item[label="Save"]');
        this.discardButton = page.locator('mas-quick-actions mas-side-nav-item[label="Discard"]');
        this.deleteButton = page.locator('mas-quick-actions mas-side-nav-item[label="Delete"]');

        // Translation editor (Spectrum / mas-translation-editor) - used when opened from Translations page
        this.titleInput = page.locator('mas-studio >> mas-translation-editor >> sp-textfield#title >> input');
        this.titleFieldSpectrum = page.locator('sp-textfield#title');
        this.saveButtonSpectrum = page.locator('sp-action-button[title="Save"]');
        this.addLanguagesButtonRole = page.getByRole('button', { name: 'Add Languages' });
        this.addItemsButton = page.getByRole('button', { name: 'Add Items' });
        this.selectLanguagesDialog = page.getByRole('dialog', { name: 'Select languages' });
        this.selectItemsDialog = page.getByRole('dialog', { name: 'Select items' });
    }

    async addLanguageAndConfirm() {
        await this.addLanguagesButtonRole.click();
        await this.selectLanguagesDialog.waitFor({ state: 'visible', timeout: 10000 });
        await this.page.locator('sp-checkbox').nth(1).click();
        await this.selectLanguagesDialog.getByRole('button', { name: 'Confirm' }).click();
        await this.selectLanguagesDialog.waitFor({ state: 'hidden', timeout: 5000 });
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
            const tableEl = tables.find((el) => el.shadowRoot?.querySelector('sp-table.fragments-table sp-table-row'));
            const row = tableEl?.shadowRoot?.querySelector('sp-table.fragments-table sp-table-row');
            if (row) row.click();
        });
        await this.page.waitForTimeout(500);
        await this.selectItemsDialog.getByRole('button', { name: 'Add selected items' }).click();
        await this.selectItemsDialog.waitFor({ state: 'hidden', timeout: 5000 });
    }

    async createTranslationProject() {
        const title = getTitle();
        await expect(this.form).toBeVisible({ timeout: 10000 });
        await expect(this.titleFieldSpectrum).toBeVisible({ timeout: 5000 });
        await this.titleInput.fill(title);
        await this.addLanguageAndConfirm();
        await this.addOneItemAndConfirm();
    }

    async saveTranslationProject() {
        await expect(this.saveButtonSpectrum).toBeEnabled({ timeout: 10000 });
        await this.saveButtonSpectrum.click();
        await this.page.waitForTimeout(2000);
    }
}
