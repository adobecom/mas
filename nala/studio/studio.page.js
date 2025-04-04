import { expect } from '@playwright/test';

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
        this.folderPicker = page.locator('mas-folder-picker sp-action-menu');
        this.renderView = page.locator('#render');
        this.quickActions = page.locator('.quick-actions');
        // this.editorPanel = page.locator('editor-panel > #editor');
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
        this.emptyCard = page.locator('merch-card[variant="invalid-variant"]');
        this.ahTryBuyWidgetCard = page.locator(
            'merch-card[variant="ah-try-buy-widget"]',
        );
        this.ahTryBuyWidgetTripleCard = page.locator(
            'merch-card[variant="ah-try-buy-widget"][size="triple"]',
        );
        this.ahTryBuyWidgetSingleCard = page.locator(
            'merch-card[variant="ah-try-buy-widget"][size="single"]',
        );
        this.ahTryBuyWidgetDoubleCard = page.locator(
            'merch-card[variant="ah-try-buy-widget"][size="double"]',
        );
        this.plansCard = page.locator('merch-card[variant="plans"]');
        // Editor panel toolbar
        this.cloneCardButton = page.locator(
            'div[id="editor-toolbar"] >> sp-action-button[value="clone"]',
        );
        this.deleteCardButton = page.locator(
            'div[id="editor-toolbar"] >> sp-action-button[value="delete"]',
        );
        this.saveCardButton = page.locator(
            'div[id="editor-toolbar"] >> sp-action-button[value="save"]',
        );
    }

    async getCard(id, cardType, cloned, secondID) {
        const cardVariant = {
            suggested: this.suggestedCard,
            slice: this.sliceCard,
            'slice-wide': this.sliceCardWide,
            ahtrybuywidget: this.ahTryBuyWidgetCard,
            'ahtrybuywidget-triple': this.ahTryBuyWidgetTripleCard,
            'ahtrybuywidget-single': this.ahTryBuyWidgetSingleCard,
            'ahtrybuywidget-double': this.ahTryBuyWidgetDoubleCard,

            empty: this.emptyCard,
        };

        const card = cardVariant[cardType];
        if (!card) {
            throw new Error(`Invalid card type: ${cardType}`);
        }

        if (cloned) {
            let baseSelector = `aem-fragment:not([fragment="${id}"])`;
            const selector = secondID
                ? `${baseSelector}:not([fragment="${secondID}"])`
                : baseSelector;
            return card.filter({
                has: this.page.locator(selector),
            });
        }

        return card.filter({
            has: this.page.locator(`aem-fragment[fragment="${id}"]`),
        });
    }

    async cloneCard() {
        await expect(await this.cloneCardButton).toBeEnabled();
        await this.cloneCardButton.click();
        await expect(await this.toastPositive).toHaveText(
            'Fragment successfully copied.',
        );
    }

    async saveCard() {
        await expect(await this.saveCardButton).toBeEnabled();
        await this.saveCardButton.click();
        await expect(await this.toastPositive).toHaveText(
            'Fragment successfully saved.',
        );
    }

    async deleteCard() {
        await expect(await this.deleteCardButton).toBeEnabled();
        await this.deleteCardButton.click();
        await expect(await this.confirmationDialog).toBeVisible();
        await this.confirmationDialog.locator(this.deleteDialog).click();
        await expect(await this.toastPositive).toHaveText(
            'Fragment successfully deleted.',
        );
    }
}
