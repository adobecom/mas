import { expect } from '@playwright/test';
import { getCurrentRunId } from '../utils/fragment-tracker.js';
import { getTestPage } from '../libs/mas-test.js';
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
        this.folderPicker = page.locator('mas-top-nav mas-nav-folder-picker sp-action-menu');
        this.localePicker = page.locator('mas-top-nav mas-nav-locale-picker sp-action-menu');
        this.renderView = page.locator('#render');
        this.quickActions = page.locator('.quick-actions');
        this.fragmentEditor = page.locator('mas-fragment-editor');
        this.confirmationDialog = page.locator('sp-dialog[variant="confirmation"]');
        this.cancelDialog = page.locator('sp-button:has-text("Cancel")');
        this.deleteDialog = page.locator('sp-button:has-text("Delete")');
        this.discardDialog = page.locator('sp-button:has-text("Discard")');
        this.toastPositive = page.locator('mas-toast >> sp-toast[variant="positive"]');
        this.toastNegative = page.locator('mas-toast >> sp-toast[variant="negative"]');
        this.alertBanner = page.locator('mas-alert-banner sp-alert-banner');
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
        // Side nav operation buttons (for fragment editor)
        this.saveFragmentButton = page.locator('mas-side-nav mas-side-nav-item[label="Save"]');
        this.duplicateFragmentButton = page.locator('mas-side-nav mas-side-nav-item[label="Duplicate"]');
        this.deleteFragmentButton = page.locator('mas-side-nav mas-side-nav-item[label="Delete"]');
        this.createVariationButton = page.locator('mas-side-nav mas-side-nav-item[label="Create Variation"]');
        this.publishFragmentButton = page.locator('mas-side-nav mas-side-nav-item[label="Publish"]');
        this.unpublishFragmentButton = page.locator('mas-side-nav mas-side-nav-item[label="Unpublish"]');
        this.copyCodeButton = page.locator('mas-side-nav mas-side-nav-item[label="Copy Code"]');

        // Create variation dialog
        this.createVariationDialog = page.locator('mas-create-variation-dialog');
        this.createVariationLocalePicker = page.locator('mas-create-variation-dialog sp-picker#locale-picker');
        this.createVariationConfirmButton = page.locator(
            'mas-create-variation-dialog sp-dialog-wrapper sp-button[slot="button"]:has-text("Create variation")',
        );
        this.createVariationCancelButton = page.locator(
            'mas-create-variation-dialog sp-dialog-wrapper sp-button[slot="button"]:has-text("Cancel")',
        );

        // Fragment editor elements
        this.fragmentEditorContent = page.locator('mas-fragment-editor #fragment-editor');
        this.fragmentEditorFormColumn = page.locator('mas-fragment-editor #form-column');
        this.fragmentEditorPreviewColumn = page.locator('mas-fragment-editor #preview-column');
        this.fragmentEditorBreadcrumbs = page.locator('mas-fragment-editor sp-breadcrumbs');
        this.fragmentEditorDerivedFrom = page.locator('mas-fragment-editor .derived-from-container');

        // Editor component selectors
        this.merchCardEditor = page.locator('mas-fragment-editor merch-card-editor');
        this.merchCardCollectionEditor = page.locator('mas-fragment-editor merch-card-collection-editor');

        // Fragment field selectors (works for both card and collection editors)
        this.fragmentTitleField = page.locator(
            'merch-card-editor sp-textfield#fragment-title input, merch-card-collection-editor sp-textfield#fragment-title input',
        );
        this.fragmentDescriptionField = page.locator(
            'merch-card-editor sp-textfield#fragment-description input, merch-card-collection-editor sp-textfield#fragment-description input',
        );
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

    getCurrentFragmentId() {
        const url = this.page.url();
        const hashPart = url.split('#')[1] || '';
        const params = new URLSearchParams(hashPart);
        return params.get('fragmentId');
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
                await this.page.waitForSelector('mas-fragment-editor #fragment-editor', {
                    state: 'visible',
                    timeout: 30000,
                });
                await this.page.waitForTimeout(1000); // Give editor time to stabilize

                // Wait for duplicate button and ensure it's enabled
                await this.page.waitForSelector('mas-side-nav mas-side-nav-item[label="Duplicate"]', {
                    state: 'visible',
                    timeout: 5000,
                });
                await expect(this.duplicateFragmentButton).toBeEnabled();

                await this.duplicateFragmentButton.scrollIntoViewIfNeeded();
                await this.page.waitForTimeout(500);

                await this.duplicateFragmentButton.click();

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

                // Wait for any toast (no progress circle in side nav)
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
                await this.saveFragmentButton.scrollIntoViewIfNeeded();
                await this.page.waitForTimeout(500);

                const isEnabled = await this.saveFragmentButton.isEnabled();

                // Only consider disabled button a success on retry attempts
                if (attempt > 1 && !isEnabled) {
                    return;
                }

                if (!isEnabled) {
                    throw new Error('[BUTTON_DISABLED] Save button is not enabled');
                }

                await this.saveFragmentButton.click();

                // Wait for any toast (no progress circle in side nav)
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
                await this.toastPositive.waitFor({ timeout: 25000 }).catch(() => {
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
            await this.page.waitForSelector('mas-fragment-editor #fragment-editor', {
                state: 'visible',
                timeout: 30000,
            });
            await this.page.waitForTimeout(1500); // Give editor time to stabilize

            await this.#retryOperation(async (attempt) => {
                // Wait for delete button and ensure it's enabled
                await this.page.waitForSelector('mas-side-nav mas-side-nav-item[label="Delete"]', {
                    state: 'visible',
                    timeout: 5000,
                });
                await expect(this.deleteFragmentButton).toBeEnabled();

                await this.deleteFragmentButton.scrollIntoViewIfNeeded();
                await this.page.waitForTimeout(500);

                await this.deleteFragmentButton.click();
                await expect(await this.confirmationDialog).toBeVisible();
                await this.confirmationDialog.locator(this.deleteDialog).click();

                // Wait for any toast (no progress circle in side nav)
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

    async cleanupAfterTest(clonedCardID, baseURL, miloLibs = '') {
        // Navigate to content page if we're in the editor
        const currentUrl = this.page.url();
        if (currentUrl.includes('page=fragment-editor')) {
            await this.page.goto(`${baseURL}/studio.html${miloLibs}#page=content&path=nala`);
            await this.page.waitForLoadState('domcontentloaded');
        }

        // Check if card exists and is visible
        const card = await this.getCard(clonedCardID);
        const isCardVisible = await card.isVisible().catch(() => false);

        // If card exists but is not visible, navigate to make it visible
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
        const testPageUrl = getTestPage();

        if (!testPageUrl) {
            throw new Error('Test page URL not set. Please call setTestPage() before opening the editor.');
        }

        await this.page.goto(testPageUrl);

        await this.page.waitForTimeout(500);
        const dialogVisible = await this.confirmationDialog.isVisible().catch(() => false);

        if (dialogVisible) {
            await this.discardDialog.click();
            await this.page.waitForLoadState('domcontentloaded');
            await this.page.waitForTimeout(1000);
        }

        await this.fragmentEditor.waitFor({ state: 'hidden', timeout: 5000 });
        await expect(this.fragmentEditor).not.toBeVisible();
    }
}
