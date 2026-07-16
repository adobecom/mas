export default class MerchCardEditorPage {
    constructor(page) {
        this.page = page;

        this.merchCardEditor = page.locator('merch-card-editor');
        this.merchCardLocReadyFieldGroup = this.merchCardEditor.locator('sp-field-group#locReady');
        this.merchCardLocReadySwitch = this.merchCardEditor.locator('sp-switch#loc-ready');
        this.merchCardLocReadyLabel = this.merchCardEditor.locator('sp-field-label[for="loc-ready"]');
        this.merchCardSendToTranslationText = this.merchCardEditor
            .locator('sp-field-group#locReady')
            .getByText('Send to translation?');

        this.editorPanel = page.locator('merch-card-editor');
        this.metadataLocReadyLabel = this.editorPanel.locator('sp-field-label[for="fragment-locready"]');
        this.metadataLocReadySwitch = this.editorPanel.locator('sp-switch#fragment-locready');

        this.cssProp = {};
    }
}
