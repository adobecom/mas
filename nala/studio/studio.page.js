export default class StudioPage {
    constructor(page) {
        this.page = page;

        this.quickActions = page.locator('.quick-actions');
        this.recentlyUpdated = page.locator('.recently-updated');
        this.gotoContent = page.locator(
            '.quick-action-card[heading="Go to Content"]',
        );

        this.searchInput = page.locator('sp-search  input');
        this.searchIcon = page.locator('sp-search sp-icon-magnify');
        this.filter = page.locator('sp-action-button[label="Filter"]');
        this.topFolder = page.locator('sp-picker[label="TopFolder"] > button');
        this.renderView = page.locator('#render');
        this.quickActions = page.locator('.quick-actions');
        this.editorPanel = page.locator('editor-panel > #editor');
        this.confirmationDialog = page.locator(
            'sp-dialog[variant="confirmation"]',
        );
        this.cancelDialog = page.locator('sp-button:has-text("Cancel")');
        this.deleteDialog = page.locator('sp-button:has-text("Delete")');
        this.discardDialog = page.locator('sp-button:has-text("Discard")');
        this.toastPositive = page.locator(
            'mas-toast >> sp-toast[variant="positive"]',
        );
        this.suggestedCard = page.locator(
            'merch-card[variant="ccd-suggested"]',
        );
        this.sliceCard = page.locator('merch-card[variant="ccd-slice"]');
        this.sliceCardWide = page.locator(
            'merch-card[variant="ccd-slice"][size="wide"]',
        );
        // Editor panel fields
        this.editorVariant = page.locator('#card-variant');
        this.editorSize = page.locator('#card-size');
        this.editorTitle = page.locator('#card-title input');
        this.editorSubtitle = page.locator('#card-subtitle input');
        this.editorBadge = page.locator('#card-badge input');
        this.editorIconURL = page.locator('#icon input');
        this.editorBackgroundImage = page.locator('#background-image input');
        this.editorPrices = page.locator('sp-field-group#prices');
        this.regularPrice = page.locator(
            'span[is="inline-price"][data-template="price"]',
        );
        this.strikethroughPrice = page.locator(
            'span[is="inline-price"][data-template="strikethrough"]',
        );
        this.editorFooter = page.locator('sp-field-group#ctas');
        this.editorCTA = page.locator('sp-field-group#ctas a');
        this.editorDescription = page.locator(
            'sp-field-group#description div[contenteditable="true"]',
        );
        // Editor panel toolbar
        this.cloneCard = page.locator(
            'div[id="editor-toolbar"] >> sp-action-button[value="clone"]',
        );
        this.closeEditor = page.locator(
            'div[id="editor-toolbar"] >> sp-action-button[value="close"]',
        );
        this.deleteCard = page.locator(
            'div[id="editor-toolbar"] >> sp-action-button[value="delete"]',
        );
        this.saveCard = page.locator(
            'div[id="editor-toolbar"] >> sp-action-button[value="save"]',
        );
        // RTE panel toolbar
        this.linkEdit = page.locator('#linkEditorButton');
        // Edit Link Panel
        this.linkText = page.locator('#linkText input');
        this.linkSave = page.locator('#saveButton');
    }

    async getCard(id, cardType, cloned) {
        const cardVariant = {
            suggested: this.suggestedCard,
            slice: this.sliceCard,
            'slice-wide': this.sliceCardWide,
        };

        const card = cardVariant[cardType];
        if (!card) {
            throw new Error(`Invalid card type: ${cardType}`);
        }

        if (cloned) {
            return card.filter({
                has: this.page.locator(`aem-fragment:not([fragment="${id}"])`),
            });
        }

        return card.filter({
            has: this.page.locator(`aem-fragment[fragment="${id}"]`),
        });
    }
}
