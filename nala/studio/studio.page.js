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
        this.toastNegative = page.locator(
            'mas-toast >> sp-toast[variant="negative"]',
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
            plans: this.plansCard,
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

    #setupConsoleListener(consoleErrors) {
        return msg => {
            if (msg.type() === 'error') {
                const errorText = msg.text();
                let errorCode = '';
                const codeMatch = errorText.match(/(?:\[ERR[_-])?\d+\]?|(?:Error:?\s*)\d+|(?:status(?:\scode)?:?\s*)\d+/i);
                if (codeMatch) {
                    errorCode = codeMatch[0];
                    consoleErrors.push(`[${errorCode}] ${errorText}`);
                } else {
                    consoleErrors.push(errorText);
                }
            }
        };
    }

    async cloneCard() {
        let consoleErrors = [];
        const consoleListener = this.#setupConsoleListener(consoleErrors);
        this.page.on('console', consoleListener);

        try {
            await this.page.waitForSelector('div[id="editor-toolbar"] >> sp-action-button[value="clone"]', 
                { state: 'visible', timeout: 30000 });
            await expect(this.cloneCardButton).toBeEnabled();
            
            await this.cloneCardButton.scrollIntoViewIfNeeded();
            await this.page.waitForTimeout(500);
            
            await this.cloneCardButton.click({ force: true });
            
            try {
                await this.page.waitForSelector('mas-toast >> sp-toast', 
                    { state: 'visible', timeout: 15000 });
            } catch (timeoutError) {
                throw new Error(`[NO_RESPONSE] No toast appeared within 15 seconds after clicking clone button. Console errors: ${consoleErrors.join(' | ')}`);
            }
            
            // Check if it's an error toast
            if (await this.toastNegative.isVisible()) {
                const errorText = await this.toastNegative.textContent();
                throw new Error(`[ERROR_TOAST] Clone operation received error: "${errorText.trim()}". Console errors: ${consoleErrors.join(' | ')}`);
            }
            
            // Check for success toast
            if (!await this.toastPositive.isVisible()) {
                try {
                    await this.page.waitForSelector('mas-toast >> sp-toast[variant="positive"]', 
                        { state: 'visible', timeout: 30000 });
                } catch (timeoutError) {
                    throw new Error(`[TIMEOUT] Success toast did not appear within 45 seconds. Console errors: ${consoleErrors.join(' | ')}`);
                }
            }
        } finally {
            this.page.removeListener('console', consoleListener);
        }
    }

    async saveCard() {
        let consoleErrors = [];
        const consoleListener = this.#setupConsoleListener(consoleErrors);
        this.page.on('console', consoleListener);

        try {
            await this.page.waitForSelector('div[id="editor-toolbar"] >> sp-action-button[value="save"]', 
                { state: 'visible', timeout: 30000 });
            await expect(this.saveCardButton).toBeEnabled();
            
            await this.saveCardButton.scrollIntoViewIfNeeded();
            await this.page.waitForTimeout(500);
            
            await this.saveCardButton.click({ force: true });
            
            try {
                await this.page.waitForSelector('mas-toast >> sp-toast', 
                    { state: 'visible', timeout: 15000 });
            } catch (timeoutError) {
                throw new Error(`[NO_RESPONSE] No toast appeared within 15 seconds after clicking save button. Console errors: ${consoleErrors.join(' | ')}`);
            }
            
            // Check if it's an error toast
            if (await this.toastNegative.isVisible()) {
                const errorText = await this.toastNegative.textContent();
                throw new Error(`[ERROR_TOAST] Save operation received error: "${errorText.trim()}". Console errors: ${consoleErrors.join(' | ')}`);
            }
            
            // Check for success toast
            if (!await this.toastPositive.isVisible()) {
                try {
                    await this.page.waitForSelector('mas-toast >> sp-toast[variant="positive"]', 
                        { state: 'visible', timeout: 30000 });
                } catch (timeoutError) {
                    throw new Error(`[TIMEOUT] Success toast did not appear within 45 seconds. Console errors: ${consoleErrors.join(' | ')}`);
                }
            }
        } finally {
            this.page.removeListener('console', consoleListener);
        }
    }

    async deleteCard() {
        let consoleErrors = [];
        const consoleListener = this.#setupConsoleListener(consoleErrors);
        this.page.on('console', consoleListener);

        try {
            await this.page.waitForSelector('div[id="editor-toolbar"] >> sp-action-button[value="delete"]', 
                { state: 'visible', timeout: 30000 });
            await expect(this.deleteCardButton).toBeEnabled();
            
            await this.deleteCardButton.scrollIntoViewIfNeeded();
            await this.page.waitForTimeout(500);
            
            await this.deleteCardButton.click({ force: true });
            
            await expect(await this.confirmationDialog).toBeVisible();
            await this.confirmationDialog.locator(this.deleteDialog).click();
            
            try {
                await this.page.waitForSelector('mas-toast >> sp-toast', 
                    { state: 'visible', timeout: 15000 });
            } catch (timeoutError) {
                throw new Error(`[NO_RESPONSE] No toast appeared within 15 seconds after confirming delete. Console errors: ${consoleErrors.join(' | ')}`);
            }
            
            // Check if it's an error toast
            if (await this.toastNegative.isVisible()) {
                const errorText = await this.toastNegative.textContent();
                throw new Error(`[ERROR_TOAST] Delete operation received error: "${errorText.trim()}". Console errors: ${consoleErrors.join(' | ')}`);
            }
            
            // Check for success toast
            if (!await this.toastPositive.isVisible()) {
                try {
                    await this.page.waitForSelector('mas-toast >> sp-toast[variant="positive"]', 
                        { state: 'visible', timeout: 30000 });
                } catch (timeoutError) {
                    throw new Error(`[TIMEOUT] Success toast did not appear within 45 seconds. Console errors: ${consoleErrors.join(' | ')}`);
                }
            }
        } finally {
            this.page.removeListener('console', consoleListener);
        }
    }
}
