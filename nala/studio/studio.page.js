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

    async getCard(id, cloned, secondID) {
        const card = this.page.locator('merch-card');
        if (!card) {
            throw new Error(`No merch card found`);
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

    async #retryOperation(operation, shouldReload = false, maxRetries = 3) {
        const attempts = [];
        let lastError = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                if (shouldReload && attempt > 1) {
                    const client = await this.page.context().newCDPSession(this.page);
                    await client.send('Network.enable');
                    await client.send('Network.clearBrowserCache');
                    await this.page.reload({ waitUntil: 'networkidle' });
                }
                
                await operation();
                return; // Success - exit the retry loop
            } catch (error) {
                lastError = error;
                attempts.push(`[Attempt ${attempt}/${maxRetries}] ${error.message}`);
                
                if (attempt === maxRetries) {
                    const errorMessage = `All attempts failed:\n\n${attempts.join('\n\n')}`;
                    throw new Error(errorMessage);
                }
            }
        }
    }

    async cloneCard(cardId) {
        if (!cardId) {
            throw new Error('cardId is required parameter for cloneCard');
        }

        const consoleErrors = [];
        const consoleListener = this.#setupConsoleListener(consoleErrors);
        this.page.on('console', consoleListener);

        try {
            await this.#retryOperation(async () => {
                consoleErrors.length = 0; // Clear console errors at the start of each attempt
                
                // Ensure the original card is visible and open in editor
                await expect(await this.getCard(cardId)).toBeVisible();
                await (await this.getCard(cardId)).dblclick();
                await expect(await this.page.locator('editor-panel > #editor')).toBeVisible();

                // Wait for clone button and ensure it's enabled
                await this.page.waitForSelector('div[id="editor-toolbar"] >> sp-action-button[value="clone"]', 
                    { state: 'visible', timeout: 30000 });
                await expect(this.cloneCardButton).toBeEnabled();
                
                await this.cloneCardButton.scrollIntoViewIfNeeded();
                await this.page.waitForTimeout(500);
                
                await this.cloneCardButton.click({ force: true });

                // First wait for any toast (15s)
                try {
                    await this.page.waitForSelector('mas-toast >> sp-toast', { state: 'visible', timeout: 15000 });
                } catch (e) {
                    console.log('[WARN] Toast not shown after 15s, continuing to wait...');
                }

                // Check for error toast
                if (await this.toastNegative.isVisible()) {
                    const errorText = await this.toastNegative.textContent();
                    throw new Error(`[ERROR_TOAST] Clone operation received error: "${errorText.trim()}"`);
                }

                // Wait for success toast (additional 15s)
                try {
                    await this.toastPositive.waitFor({ timeout: 30000 });
                } catch (e) {
                    throw new Error('[NO_RESPONSE] Clone operation failed - no success toast shown');
                }

                if (consoleErrors.length > 0) {
                    throw new Error(consoleErrors.join(' | '));
                }
            }, true);
        } catch (e) {
            if (e.message.includes('\nAll attempts failed:')) {
                throw e; // Don't modify the error if it's from retryOperation
            }
            throw new Error(e.message); // Just pass the message without the stack
        } finally {
            this.page.removeListener('console', consoleListener);
        }
    }

    async saveCard() {
        const consoleErrors = [];
        const consoleListener = this.#setupConsoleListener(consoleErrors);
        this.page.on('console', consoleListener);

        try {
            await this.page.waitForSelector('div[id="editor-toolbar"] >> sp-action-button[value="save"]', 
                { state: 'visible', timeout: 30000 });
            
            let isFirstAttempt = true;
            await this.#retryOperation(async () => {
                await this.saveCardButton.scrollIntoViewIfNeeded();
                await this.page.waitForTimeout(500);
                
                const isEnabled = await this.saveCardButton.isEnabled();
                
                // On retry attempts, if button is disabled, consider it a success
                if (!isFirstAttempt && !isEnabled) {
                    return;
                }
                
                if (isEnabled) {
                    await this.saveCardButton.click({ force: true });
                }
                
                // First wait for any toast (15s)
                try {
                    await this.page.waitForSelector('mas-toast >> sp-toast', { state: 'visible', timeout: 15000 });
                } catch (e) {
                    console.log('[WARN] Toast not shown after 15s, continuing to wait...');
                }

                // Check for error toast
                if (await this.toastNegative.isVisible()) {
                    const errorText = await this.toastNegative.textContent();
                    throw new Error(`[ERROR_TOAST] Save operation received error: "${errorText.trim()}"`);
                }

                // Wait for success toast (additional 15s)
                try {
                    await this.toastPositive.waitFor({ timeout: 30000 });
                } catch (e) {
                    // If no toast appeared and button is disabled, consider it a success
                    if (!(await this.saveCardButton.isEnabled())) {
                        return;
                    }
                    throw new Error('[NO_RESPONSE] Save operation failed - no success toast shown');
                }
                
                isFirstAttempt = false;
            });

            if (consoleErrors.length > 0) {
                throw new Error(`[CONSOLE_ERROR] ${consoleErrors.join(', ')}`);
            }
        } catch (e) {
            if (e.message.includes('[')) {
                throw e;
            }
            throw new Error(`[UNKNOWN_ERROR] ${e.message}`);
        } finally {
            this.page.removeListener('console', consoleListener);
        }
    }

    async deleteCard(cardId) {
        const consoleErrors = [];
        const consoleListener = this.#setupConsoleListener(consoleErrors);
        this.page.on('console', consoleListener);

        try {
            await expect(await this.getCard(cardId)).toBeVisible();
            await (await this.getCard(cardId)).dblclick();
            await expect(await this.page.locator('editor-panel > #editor')).toBeVisible();

            await this.page.waitForSelector('div[id="editor-toolbar"] >> sp-action-button[value="delete"]', 
                { state: 'visible', timeout: 30000 });
            await expect(this.deleteCardButton).toBeEnabled();
            
            await this.#retryOperation(async () => {
                await this.deleteCardButton.scrollIntoViewIfNeeded();
                await this.page.waitForTimeout(500);
                
                await this.deleteCardButton.click({ force: true });
                
                await expect(await this.confirmationDialog).toBeVisible();
                await this.confirmationDialog.locator(this.deleteDialog).click();

                // First wait for any toast (15s)
                try {
                    await this.page.waitForSelector('mas-toast >> sp-toast', { state: 'visible', timeout: 15000 });
                } catch (e) {
                    console.log('[WARN] Toast not shown after 15s, continuing to wait...');
                }

                // Check for error toast
                if (await this.toastNegative.isVisible()) {
                    const errorText = await this.toastNegative.textContent();
                    throw new Error(`[ERROR_TOAST] Delete operation received error: "${errorText.trim()}"`);
                }

                // Wait for success toast (additional 15s)
                try {
                    await this.toastPositive.waitFor({ timeout: 30000 });
                } catch (e) {
                    // Check if editor panel is still visible
                    const isEditorVisible = await this.editorPanel.isVisible().catch(() => false);
                    
                    // If editor is not visible anymore, consider it a success
                    if (!isEditorVisible) {
                        return;
                    }
                    throw new Error('[NO_RESPONSE] Delete operation failed - no success toast shown');
                }
            });

            if (consoleErrors.length > 0) {
                throw new Error(`[CONSOLE_ERROR] ${consoleErrors.join(', ')}`);
            }
        } catch (e) {
            if (e.message.includes('[')) {
                throw e;
            }
            throw new Error(`[UNKNOWN_ERROR] ${e.message}`);
        } finally {
            this.page.removeListener('console', consoleListener);
        }
    }
}
