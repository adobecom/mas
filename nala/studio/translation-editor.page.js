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
    }
}
