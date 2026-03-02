export default class ProjectEditorComponent {
    constructor(page) {
        this.page = page;
        this.form = page.locator('.translation-editor-form');
        this.titleField = page.locator('sp-textfield#title');
        this.saveButton = page.locator('sp-action-button[title="Save"]');
    }
}
