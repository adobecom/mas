export default class MerchCardEditorPage {
    constructor(page) {
        this.page = page;

        this.merchCardEditor = page.locator('merch-card-editor');
        this.merchCardLocReadyFieldGroup = this.merchCardEditor.locator('sp-field-group#locReady');
        this.merchCardLocReadySwitch = this.merchCardEditor.locator('sp-switch#loc-ready');
        this.merchCardLocReadyLabel = this.merchCardEditor.locator('sp-field-label[for="loc-ready"]');
        this.merchCardSendToTranslationText = this.merchCardEditor.getByText('Send to translation?');

        this.cssProp = {};
    }
}
