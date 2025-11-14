import { expect } from '@playwright/test';
import { getCurrentRunId } from '../utils/fragment-tracker.js';
import OSTPage from './ost.page';

export default class StudioPage {
    constructor(page) {
        this.page = page;
        this.ost = new OSTPage(page);

        this.quickActions = page.locator('.quick-actions');
        this.recentlyUpdated = page.locator('.recently-updated');
        this.gotoContent = page.locator('.quick-action-card[heading="Go to Content"]');

        this.searchInput = page.locator('#actions sp-search  input');
        this.searchIcon = page.locator('#actions sp-search[placeholder="Search"] sp-icon-magnify');
        this.filter = page.locator('sp-action-button[label="Filter"]');
        this.renderView = page.locator('#render');
        this.quickActions = page.locator('.quick-actions');
        this.editorPanel = page.locator('editor-panel > #editor');
        this.confirmationDialog = page.locator('sp-dialog[variant="confirmation"]');
        this.cancelDialog = page.locator('sp-button:has-text("Cancel")');
        this.deleteDialog = page.locator('sp-button:has-text("Delete")');
        this.discardDialog = page.locator('sp-button:has-text("Discard")');
        this.toastPositive = page.locator('mas-toast >> sp-toast[variant="positive"]');
        this.toastNegative = page.locator('mas-toast >> sp-toast[variant="negative"]');
        this.suggestedCard = page.locator('merch-card[variant="ccd-suggested"]');
        this.sliceCard = page.locator('merch-card[variant="ccd-slice"]');
        this.sliceCardWide = page.locator('merch-card[variant="ccd-slice"][size="wide"]');
        this.emptyCard = page.locator('merch-card[variant="invalid-variant"]');
        this.ahTryBuyWidgetCard = page.locator('merch-card[variant="ah-try-buy-widget"]');
        this.ahTryBuyWidgetTripleCard = page.locator('merch-card[variant="ah-try-buy-widget"][size="triple"]');
        this.ahTryBuyWidgetSingleCard = page.locator('merch-card[variant="ah-try-buy-widget"][size="single"]');
        this.ahTryBuyWidgetDoubleCard = page.locator('merch-card[variant="ah-try-buy-widget"][size="double"]');
        this.plansCard = page.locator('merch-card[variant="plans"]');
        this.ahPromotedPlansCard = page.locator('merch-card[variant="ah-promoted-plans"]');
        this.ahPromotedPlansCardGradientBorder = page.locator(
            'merch-card[variant="ah-promoted-plans"][gradient-border="true"]',
        );
        // Editor panel toolbar
        this.cloneCardButton = page.locator('div[id="editor-toolbar"] >> sp-action-button[value="clone"]');
        this.deleteCardButton = page.locator('div[id="editor-toolbar"] >> sp-action-button[value="delete"]');
        this.saveCardButton = page.locator('div[id="editor-toolbar"] >> sp-action-button[value="save"]');
        // Topnav panel
        this.topnav = page.locator('mas-top-nav');
        this.surfacePicker = page.locator('mas-nav-folder-picker sp-action-menu');
        this.localePicker = page.locator('mas-nav-locale-picker sp-action-menu');
        // Sidenav toolbar
        this.sideNav = page.locator('mas-side-nav');
        this.homeButton = this.sideNav.locator('mas-side-nav-item[label="Home"]');
        this.offersButton = this.sideNav.locator('mas-side-nav-item[label="Offers"]');
        this.fragmentsButton = this.sideNav.locator('mas-side-nav-item[label="Fragments"]');
        this.promotionsButton = this.sideNav.locator('mas-side-nav-item[label="Promotions"]');
        this.collectionsButton = this.sideNav.locator('mas-side-nav-item[label="Collections"]');
        this.placeholdersButton = this.sideNav.locator('mas-side-nav-item[label="Placeholders"]');
        this.supportButton = this.sideNav.locator('mas-side-nav-item[label="Support"]');
    }

    async getCard(id, cloned, secondID) {
        const card = this.page.locator('merch-card');
        if (!card) {
            throw new Error(`No merch card found`);
        }

        if (cloned) {
            let baseSelector = `aem-fragment:not([fragment="${id}"])`;
            const selector = secondID ? `${baseSelector}:not([fragment="${secondID}"])` : baseSelector;
            return card.filter({
                has: this.page.locator(selector),
            });
        }

        return card.filter({
            has: this.page.locator(`aem-fragment[fragment="${id}"]`),
        });
    }

    #setupConsoleListener(consoleErrors) {
        return (msg) => {
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

    async #retryOperation(operation, shouldReload = false, maxRetries = 2) {
        const attempts = [];

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                if (shouldReload && attempt > 1) {
                    // Wait for network to be idle before reload
                    await this.page.waitForLoadState('networkidle').catch(() => {});

                    // Perform reload
                    await this.page.reload({ waitUntil: 'networkidle', timeout: 30000 }).catch(async (e) => {
                        // If reload fails, try navigating to the current URL
                        const url = this.page.url();
                        await this.page.goto(url, {
                            waitUntil: 'networkidle',
                            timeout: 30000,
                        });
                    });

                    // Wait for page to be ready
                    await this.page.waitForLoadState('domcontentloaded');
                }

                await operation(attempt);
                return; // Success - exit the retry loop
            } catch (error) {
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
            await this.#retryOperation(async (attempt) => {
                // Open editor (needed after each reload)
                const card = await this.getCard(cardId);
                await expect(card).toBeVisible();
                await card.dblclick();
                await this.page.waitForSelector('editor-panel > #editor', {
                    state: 'visible',
                    timeout: 30000,
                });
                await this.page.waitForTimeout(1000); // Give editor time to stabilize

                // Wait for clone button and ensure it's enabled
                await this.page.waitForSelector('div[id="editor-toolbar"] >> sp-action-button[value="clone"]', {
                    state: 'visible',
                    timeout: 5000,
                });
                await expect(this.cloneCardButton).toBeEnabled();

                await this.cloneCardButton.scrollIntoViewIfNeeded();
                await this.page.waitForTimeout(500);

                await this.cloneCardButton.click({ force: true });

                // Wait for fragment title dialog and enter title
                await this.page.waitForSelector('sp-dialog[variant="confirmation"]', {
                    state: 'visible',
                    timeout: 5000,
                });

                // Enter fragment title with run ID
                const runId = getCurrentRunId();
                const titleInput = this.page.locator('sp-dialog[variant="confirmation"] sp-textfield input');
                await titleInput.fill(`MAS Nala Automation Cloned Fragment [${runId}]`);

                await this.page.locator('sp-dialog[variant="confirmation"] sp-button:has-text("Clone")').click();

                // Wait for progress circle
                await this.page
                    .waitForSelector('div[id="editor-toolbar"] >> sp-action-button[value="clone"] sp-progress-circle', {
                        state: 'visible',
                        timeout: 5000,
                    })
                    .catch(() => {
                        throw new Error('[CLICK_FAILED] Clone button click did not trigger progress circle');
                    });

                // Wait for any toast
                await this.page
                    .waitForSelector('mas-toast >> sp-toast', {
                        state: 'visible',
                        timeout: 15000,
                    })
                    .catch(() => {}); // Ignore timeout, we'll check for specific toasts next

                // Check for error toast first
                if (await this.toastNegative.isVisible()) {
                    const errorText = await this.toastNegative.textContent();
                    throw new Error(`[ERROR_TOAST] Clone operation received error: "${errorText.trim()}"`);
                }

                // Wait for success toast
                await this.toastPositive.waitFor({ timeout: 15000 }).catch(() => {
                    throw new Error('[NO_RESPONSE] Clone operation failed - no success toast shown');
                });
            }, true);
        } catch (e) {
            // On failure, collect all attempt errors and console logs
            if (e.message.includes('\nAll attempts failed:')) {
                // Extract individual attempt errors from the combined error message
                const attemptErrors = e.message
                    .split('\n\n')
                    .filter((msg) => msg.startsWith('[Attempt'))
                    .map((msg) => {
                        const attemptMatch = msg.match(/\[Attempt (\d+)\/\d+\]/);
                        if (attemptMatch) {
                            const attemptNum = parseInt(attemptMatch[1]);
                            // Get console errors that occurred during this attempt
                            const attemptConsoleErrors = consoleErrors
                                .slice((attemptNum - 1) * 3, attemptNum * 3) // Assuming max 3 errors per attempt
                                .filter((err) => err); // Remove any undefined entries

                            return `${msg}${attemptConsoleErrors.length ? '\nConsole errors:\n' + attemptConsoleErrors.join('\n') : ''}`;
                        }
                        return msg;
                    });
                throw new Error(`All attempts failed:\n\n${attemptErrors.join('\n\n')}`);
            }
            throw new Error(e.message);
        } finally {
            this.page.removeListener('console', consoleListener);
        }
    }

    async saveCard() {
        const consoleErrors = [];
        const consoleListener = this.#setupConsoleListener(consoleErrors);
        this.page.on('console', consoleListener);

        try {
            await this.#retryOperation(async (attempt) => {
                await this.saveCardButton.scrollIntoViewIfNeeded();
                await this.page.waitForTimeout(500);

                const isEnabled = await this.saveCardButton.isEnabled();

                // Only consider disabled button a success on retry attempts
                if (attempt > 1 && !isEnabled) {
                    return;
                }

                if (!isEnabled) {
                    throw new Error('[BUTTON_DISABLED] Save button is not enabled');
                }

                await this.saveCardButton.click({ force: true });

                // Wait for progress circle
                await this.page
                    .waitForSelector('div[id="editor-toolbar"] >> sp-action-button[value="save"] sp-progress-circle', {
                        state: 'visible',
                        timeout: 5000,
                    })
                    .catch(() => {
                        throw new Error('[CLICK_FAILED] Save button click did not trigger progress circle');
                    });

                // Wait for any toast
                await this.page
                    .waitForSelector('mas-toast >> sp-toast', {
                        state: 'visible',
                        timeout: 15000,
                    })
                    .catch(() => {}); // Ignore timeout, we'll check for specific toasts next

                // Check for error toast first
                if (await this.toastNegative.isVisible()) {
                    const errorText = await this.toastNegative.textContent();

                    // If it's the specific "Save completed but couldn't retrieve" message, consider it a success
                    if (errorText.includes('Save completed but the updated fragment could not be retrieved')) {
                        return; // Exit successfully
                    }

                    throw new Error(`[ERROR_TOAST] Save operation received error: "${errorText.trim()}"`);
                }

                // Wait for success toast
                await this.toastPositive.waitFor({ timeout: 15000 }).catch(() => {
                    throw new Error('[NO_RESPONSE] Save operation failed - no success toast shown');
                });
            });
        } catch (e) {
            // On failure, collect all attempt errors and console logs
            if (e.message.includes('\nAll attempts failed:')) {
                // Extract individual attempt errors from the combined error message
                const attemptErrors = e.message
                    .split('\n\n')
                    .filter((msg) => msg.startsWith('[Attempt'))
                    .map((msg) => {
                        const attemptMatch = msg.match(/\[Attempt (\d+)\/\d+\]/);
                        if (attemptMatch) {
                            const attemptNum = parseInt(attemptMatch[1]);
                            // Get console errors that occurred during this attempt
                            const attemptConsoleErrors = consoleErrors
                                .slice((attemptNum - 1) * 3, attemptNum * 3) // Assuming max 3 errors per attempt
                                .filter((err) => err); // Remove any undefined entries

                            return `${msg}${attemptConsoleErrors.length ? '\nConsole errors:\n' + attemptConsoleErrors.join('\n') : ''}`;
                        }
                        return msg;
                    });
                throw new Error(`All attempts failed:\n\n${attemptErrors.join('\n\n')}`);
            }
            throw new Error(e.message);
        } finally {
            this.page.removeListener('console', consoleListener);
        }
    }

    async deleteCard(cardId) {
        if (!cardId) {
            throw new Error('cardId is required parameter for deleteCard');
        }

        const consoleErrors = [];
        const consoleListener = this.#setupConsoleListener(consoleErrors);
        this.page.on('console', consoleListener);

        try {
            // First ensure card exists and editor is open
            const card = await this.getCard(cardId);
            await expect(card).toBeVisible();
            await card.dblclick();
            await this.page.waitForSelector('editor-panel > #editor', {
                state: 'visible',
                timeout: 30000,
            });
            await this.page.waitForTimeout(1500); // Give editor time to stabilize

            await this.#retryOperation(async (attempt) => {
                // Wait for delete button and ensure it's enabled
                await this.page.waitForSelector('div[id="editor-toolbar"] >> sp-action-button[value="delete"]', {
                    state: 'visible',
                    timeout: 5000,
                });
                await expect(this.deleteCardButton).toBeEnabled();

                await this.deleteCardButton.scrollIntoViewIfNeeded();
                await this.page.waitForTimeout(500);

                await this.deleteCardButton.click({ force: true });
                await expect(await this.confirmationDialog).toBeVisible();
                await this.confirmationDialog.locator(this.deleteDialog).click();

                // Wait for progress circle
                await this.page
                    .waitForSelector('div[id="editor-toolbar"] >> sp-action-button[value="delete"] sp-progress-circle', {
                        state: 'visible',
                        timeout: 5000,
                    })
                    .catch(() => {
                        throw new Error('[CLICK_FAILED] Delete confirmation did not trigger progress circle');
                    });

                // Wait for any toast
                await this.page
                    .waitForSelector('mas-toast >> sp-toast', {
                        state: 'visible',
                        timeout: 15000,
                    })
                    .catch(() => {}); // Ignore timeout, we'll check for specific toasts next

                // Check for error toast first
                if (await this.toastNegative.isVisible()) {
                    const errorText = await this.toastNegative.textContent();
                    throw new Error(`[ERROR_TOAST] Delete operation received error: "${errorText.trim()}"`);
                }

                // Wait for success toast
                await this.toastPositive.waitFor({ timeout: 15000 }).catch(() => {
                    throw new Error('[NO_RESPONSE] Delete operation failed - no success toast shown');
                });
            });
        } catch (e) {
            // On failure, collect all attempt errors and console logs
            if (e.message.includes('\nAll attempts failed:')) {
                // Extract individual attempt errors from the combined error message
                const attemptErrors = e.message
                    .split('\n\n')
                    .filter((msg) => msg.startsWith('[Attempt'))
                    .map((msg) => {
                        const attemptMatch = msg.match(/\[Attempt (\d+)\/\d+\]/);
                        if (attemptMatch) {
                            const attemptNum = parseInt(attemptMatch[1]);
                            // Get console errors that occurred during this attempt
                            const attemptConsoleErrors = consoleErrors
                                .slice((attemptNum - 1) * 3, attemptNum * 3) // Assuming max 3 errors per attempt
                                .filter((err) => err); // Remove any undefined entries

                            return `${msg}${attemptConsoleErrors.length ? '\nConsole errors:\n' + attemptConsoleErrors.join('\n') : ''}`;
                        }
                        return msg;
                    });
                throw new Error(`All attempts failed:\n\n${attemptErrors.join('\n\n')}`);
            }
            throw new Error(e.message);
        } finally {
            this.page.removeListener('console', consoleListener);
        }
    }

    async cleanupAfterTest(editor, clonedCardID, baseURL, miloLibs = '') {
        // Close editor panel if open
        if (await editor.panel.isVisible()) {
            await editor.closeEditor.click();
            await expect(await editor.panel).not.toBeVisible();
        }

        // Check if card exists and is visible
        const card = await this.getCard(clonedCardID);
        const isCardVisible = await card.isVisible().catch(() => false);

        // If card exists but is not visible (covered by overlay), navigate to make it visible
        if (!isCardVisible && (await card.count()) > 0) {
            const clonedCardPath = `${baseURL}/studio.html${miloLibs}#page=content&path=nala&query=${clonedCardID}`;
            await this.page.goto(clonedCardPath);
            await this.page.waitForLoadState('domcontentloaded');
        }

        // Delete the card if it's visible
        if (await card.isVisible()) {
            await this.deleteCard(clonedCardID);
            await expect(await card).not.toBeVisible();
        }
    }

    async discardEditorChanges(editor) {
        // Close the editor and verify discard is triggered
        await editor.closeEditor.click();
        await expect(await this.confirmationDialog).toBeVisible();
        await this.discardDialog.click();
        await expect(await editor.panel).not.toBeVisible();
    }
}
