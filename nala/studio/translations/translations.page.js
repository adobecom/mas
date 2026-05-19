export default class TranslationsPage {
    constructor(page) {
        this.page = page;

        const translationHost = page.locator('mas-translation');
        this.loadingIndicator = translationHost.locator('.loading-container sp-progress-circle');

        this.translationTable = translationHost.locator('sp-table.item-table');
        this.tableHeaders = {
            translationProject: translationHost.locator('sp-table-head-cell:has-text("Translation Project")'),
            lastUpdatedBy: translationHost.locator('sp-table-head-cell:has-text("Last updated by")'),
            sentOn: translationHost.locator('sp-table-head-cell:has-text("Sent on")'),
            actions: translationHost.locator('sp-table-head-cell:has-text("Actions")'),
        };
        this.emptyState = translationHost.locator('.translation-empty-state');

        this.tableRows = translationHost.locator('sp-table.item-table sp-table-row');

        this.firstRow = translationHost.locator('sp-table.item-table sp-table-row').first();
        this.firstRowTitleCell = this.firstRow.locator('sp-table-cell').nth(0);
        this.firstRowActionMenu = this.firstRow.locator('sp-action-menu');

        this.deleteConfirmDialog = page.getByRole('dialog', { name: 'Delete Translation Project' });
        this.deleteConfirmButton = this.deleteConfirmDialog.getByRole('button', { name: 'Delete' });

        this.createProjectButton = translationHost.locator('sp-button.create-button');
    }

    getRow(index) {
        return this.tableRows.nth(index);
    }

    async getProjectTitleFromRow(index) {
        const row = this.getRow(index);
        const cell = row.locator('sp-table-cell').first();
        return (await cell.textContent())?.trim() ?? '';
    }

    async getAllProjectTitles() {
        const count = await this.tableRows.count();
        const titles = [];
        for (let i = 0; i < count; i++) {
            const title = await this.getProjectTitleFromRow(i);
            titles.push(title);
        }
        return titles;
    }

    async waitForListToLoad(timeout = 15000) {
        const dataRow = this.translationTable.locator('sp-table-row:not(.skeleton-row)').first();
        await dataRow.or(this.emptyState).waitFor({ state: 'visible', timeout });
    }

    async getSentOnColumnTexts() {
        const rows = this.tableRows;
        const count = await rows.count();
        const texts = [];
        for (let i = 0; i < count; i++) {
            const cell = rows.nth(i).locator('sp-table-cell').nth(2);
            texts.push(await cell.textContent());
        }
        return texts;
    }

    parseSentOnText(text) {
        const t = (text || '').trim();
        if (!t || t === 'N/A') return 0;
        const d = new Date(t);
        return Number.isNaN(d.getTime()) ? 0 : d.getTime();
    }
}
