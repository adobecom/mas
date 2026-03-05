export default class ProjectEditorComponent {
    constructor(page) {
        this.page = page;
        this.form = page.locator('.translation-editor-form');
        this.titleField = page.locator('sp-textfield#title');
        this.saveButton = page.locator('sp-action-button[title="Save"]');
        this.addLanguagesButton = page.getByRole('button', { name: 'Add Languages' });
        this.addItemsButton = page.getByRole('button', { name: 'Add Items' });
        this.selectLanguagesDialog = page.getByRole('dialog', { name: 'Select languages' });
        this.selectItemsDialog = page.getByRole('dialog', { name: 'Select items' });
    }

    async addLanguageAndConfirm() {
        await this.addLanguagesButton.click();
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
}
