export default class TranslationEditorPage {
    constructor(page) {
        this.page = page;

        // Translation editor form
        this.form = page.locator('.translation-editor-form');
        this.breadcrumb = page.locator('.translation-editor-breadcrumb');

        // General info section
        this.titleField = page.locator('#title');

        // Selected languages section
        this.languagesEmptyState = page.locator('.languages-empty-state');
        this.languagesEmptyStateIcon = page.locator('.languages-empty-state .icon sp-icon-add[label="Add Languages"]');
        this.languagesEmptyStateLabel = page.locator('.languages-empty-state .label');
        this.selectedLangsHeader = page.locator('.selected-langs-header h2');
        this.selectedLangsSection = page.locator('.form-field.selected-langs');
        this.selectedLangsList = page.locator('.selected-langs-list');
        this.selectedLangsToggle = page.locator('.selected-langs-header .toggle-btn');
        this.addLanguagesButton = page.locator('#add-languages-overlay sp-button[slot="trigger"]');
        this.editLanguagesButton = page.locator('.selected-langs-header sp-action-button');

        // Selected items section
        this.itemsEmptyState = page.locator('.items-empty-state');
        this.itemsEmptyStateIcon = page.locator('.items-empty-state .icon sp-icon-add[label="Add Items"]');
        this.itemsEmptyStateLabel = page.locator('.items-empty-state .label');
        this.selectedFilesHeader = page.locator('.selected-files-header h2');
        this.selectedItemsHeader = page.locator('.selected-items-header h2');
        this.selectedFilesTable = page.locator('mas-select-fragments-table');
        this.addItemsButton = page.locator('#add-items-overlay sp-button[slot="trigger"]');

        // Quick actions
        this.saveButton = page.locator('mas-quick-actions mas-side-nav-item[label="Save"]');
        this.discardButton = page.locator('mas-quick-actions mas-side-nav-item[label="Discard"]');
        this.deleteButton = page.locator('mas-quick-actions mas-side-nav-item[label="Delete"]');

        // Toast / validation
        this.validationToast = page.getByText('Please fill in all required fields.');
    }
}
