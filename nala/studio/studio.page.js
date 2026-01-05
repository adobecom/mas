import { expect } from '@playwright/test';
import { getFragmentTitle } from '../utils/fragment-tracker.js';
import OSTPage from './ost.page';
import EditorPage from './editor.page';

export default class StudioPage {
    constructor(page) {
        this.page = page;
        this.ost = new OSTPage(page);
        this.editor = new EditorPage(page);

        this.quickActions = page.locator('.quick-actions');
        this.recentlyUpdated = page.locator('.recently-updated');
        this.gotoContent = page.locator('.quick-action-card[heading="Go to Content"]');

        this.searchInput = page.locator('#actions sp-search  input');
        this.searchIcon = page.locator('#actions sp-search[placeholder="Search"] sp-icon-search');
        this.filter = page.locator('sp-action-button[label="Filter"]');
        this.folderPicker = page.locator('mas-nav-folder-picker sp-action-menu');
        this.previewMenu = page.locator('#actions sp-action-menu[value="render"]');
        this.renderViewOption = this.previewMenu.locator('sp-menu-item[value="render"]');
        this.tableViewOption = this.previewMenu.locator('sp-menu-item[value="table"]');
        this.renderView = page.locator('#render');
        this.tableView = page.locator('sp-table');
        this.tableViewHeaders = page.locator('sp-table-head');
        this.tableViewRows = this.tableView.locator('sp-table-row');
        this.tableViewFragmentTable = (fragmentId) => this.tableView.locator(`mas-fragment-table[data-id="${fragmentId}"]`);
        this.tableViewRowByFragmentId = (fragmentId) => this.tableView.locator(`sp-table-row[value="${fragmentId}"]`);
        this.tableViewPathCell = (row) => row.locator('sp-table-cell.name');
        this.tableViewTitleCell = (row) => row.locator('sp-table-cell.title');
        this.tableViewActionsMenu = (row) => row.locator('sp-table-cell.actions sp-action-menu');
        this.tableViewCreateVariationOption = (menu) => menu.locator('sp-menu-item:has-text("Create variation")');
        this.variationDialog = page.locator('mas-variation-dialog');
        this.variationDialogLocalePicker = this.variationDialog.locator('sp-picker[placeholder="Select a locale"]');
        this.variationDialogCreateButton = this.variationDialog.locator('sp-button:has-text("Create variation")');
        this.editorPanel = page.locator('mas-fragment-editor > #fragment-editor #editor-content');
        this.confirmationDialog = page.locator('sp-dialog[variant="confirmation"]');
        this.cancelDialog = page.locator('sp-button:has-text("Cancel")');
        this.deleteDialog = page.locator('sp-button:has-text("Delete")');
        this.discardDialog = page.locator('sp-button:has-text("Discard")');
        this.toastPositive = page.locator('mas-toast >> sp-toast[variant="positive"]');
        this.toastNegative = page.locator('mas-toast >> sp-toast[variant="negative"]');
        this.toastProgress = page.locator('mas-toast >> sp-toast[variant="info"]');
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
        // Topnav panel
        this.topnav = page.locator('mas-top-nav');
        this.surfacePicker = page.locator('mas-nav-folder-picker sp-action-menu');
        this.localePicker = page.locator('mas-top-nav mas-locale-picker sp-action-menu');
        this.fragmentsTable = page.locator('.breadcrumbs-container sp-breadcrumb-item:has-text("Fragments")');
        // Sidenav toolbar
        this.sideNav = page.locator('mas-side-nav');
        this.createVariationButton = this.sideNav.locator('mas-side-nav-item[label="Create Variation"]');
        this.cloneCardButton = this.sideNav.locator('mas-side-nav-item[label="Duplicate"]');
        this.deleteCardButton = this.sideNav.locator('mas-side-nav-item[label="Delete"]');
        this.saveCardButton = this.sideNav.locator('mas-side-nav-item[label="Save"]');
        this.homeButton = this.sideNav.locator('mas-side-nav-item[label="Home"]');
        this.offersButton = this.sideNav.locator('mas-side-nav-item[label="Offers"]');
        this.fragmentsButton = this.sideNav.locator('mas-side-nav-item[label="Fragments"]');
        this.promotionsButton = this.sideNav.locator('mas-side-nav-item[label="Promotions"]');
        this.collectionsButton = this.sideNav.locator('mas-side-nav-item[label="Collections"]');
        this.placeholdersButton = this.sideNav.locator('mas-side-nav-item[label="Placeholders"]');
        this.supportButton = this.sideNav.locator('mas-side-nav-item[label="Support"]');
        // Create dialog elements
        this.createButton = page.locator('sp-button:has-text("Create")').first();
        this.createDialog = page.locator('mas-create-dialog');
        this.createDialogTitleInput = this.createDialog.locator('sp-textfield#fragment-title input');
        this.createDialogOSIButton = this.createDialog.locator('osi-field#osi #offerSelectorToolButtonOSI');
        this.createDialogCreateButton = this.createDialog.locator('sp-button:has-text("Create")');
        this.createDialogMerchCardOption = page.getByRole('menuitem', { name: 'Merch Card', exact: true }).first();
    }

    async getCard(id, cloned, secondID) {
        const card = this.page.locator('merch-card');
        if (!card) {
            throw new Error(`No merch card found`);
        }

        if (cloned) {
            const baseSelector = `aem-fragment:not([fragment="${id}"])`;
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
                await this.editorPanel.waitFor({
                    state: 'visible',
                    timeout: 30000,
                });
                await this.page.waitForTimeout(1000); // Give editor time to stabilize

                // Wait for clone button and ensure it's enabled
                await expect(this.cloneCardButton).toBeVisible();
                await expect(this.cloneCardButton).toBeEnabled();

                await this.cloneCardButton.scrollIntoViewIfNeeded();
                await this.page.waitForTimeout(500);

                await this.cloneCardButton.click({ force: true });

                // Wait for fragment title dialog and enter title
                await this.page.waitForSelector('sp-dialog[variant="confirmation"]', {
                    state: 'visible',
                    timeout: 15000,
                });

                // Enter fragment title with run ID
                const titleInput = this.page.locator('sp-dialog[variant="confirmation"] sp-textfield input');
                await titleInput.fill(getFragmentTitle());

                await this.page.locator('sp-dialog[variant="confirmation"] sp-button:has-text("Clone")').click();

                // Wait for progress circle
                await this.page
                    .waitForSelector('sp-dialog[variant="confirmation"] sp-button sp-progress-circle', {
                        state: 'visible',
                        timeout: 15000,
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

                            return `${msg}${attemptConsoleErrors.length ? `\nConsole errors:\n${attemptConsoleErrors.join('\n')}` : ''}`;
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

                // Wait for progress toast
                await this.toastProgress
                    .waitFor({
                        state: 'visible',
                        timeout: 5000,
                    })
                    .catch(() => {
                        throw new Error('[CLICK_FAILED] Save button click did not trigger progress circle');
                    });

                // Wait for any toast (excluding progress toast)
                await this.page
                    .waitForSelector('mas-toast >> sp-toast:not([variant="info"])', {
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

                            return `${msg}${attemptConsoleErrors.length ? `\nConsole errors:\n${attemptConsoleErrors.join('\n')}` : ''}`;
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
            const isEditorVisible = await this.editorPanel.isVisible().catch(() => false);
            if (!isEditorVisible) {
                const card = await this.getCard(cardId);
                await expect(card).toBeVisible();
                await card.dblclick();
                await this.editorPanel.waitFor({
                    state: 'visible',
                    timeout: 30000,
                });
            }
            await this.page.waitForTimeout(1500); // Give editor time to stabilize

            await this.#retryOperation(async (attempt) => {
                // Wait for delete button and ensure it's enabled
                await this.deleteCardButton.waitFor({
                    state: 'visible',
                    timeout: 5000,
                });
                await expect(this.deleteCardButton).toBeEnabled();

                await this.deleteCardButton.scrollIntoViewIfNeeded();
                await this.page.waitForTimeout(500);

                await this.deleteCardButton.click({ force: true });
                await expect(await this.confirmationDialog).toBeVisible();
                await this.confirmationDialog.locator(this.deleteDialog).click();

                // Wait for progress toast
                await this.toastProgress
                    .waitFor({
                        state: 'visible',
                        timeout: 5000,
                    })
                    .catch(() => {
                        throw new Error('[CLICK_FAILED] Delete confirmation did not trigger progress toast');
                    });

                // Wait for any toast
                await this.page
                    .waitForSelector('mas-toast >> sp-toast:not([variant="info"])', {
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

                            return `${msg}${attemptConsoleErrors.length ? `\nConsole errors:\n${attemptConsoleErrors.join('\n')}` : ''}`;
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
        // await editor.closeEditor.click(); // discard and close buttons were removed with the new UI. Enable back when implemented
        await this.page.goBack();
        await expect(await this.confirmationDialog).toBeVisible();
        await this.discardDialog.click();
        await expect(await editor.panel).not.toBeVisible();
    }

    /**
     * Switch to table view
     */
    async switchToTableView() {
        // Check if already in table view
        const isTableViewVisible = await this.tableView.isVisible().catch(() => false);
        if (isTableViewVisible) {
            // Already in table view, no need to switch
            return;
        }

        // Switch to table view
        await expect(this.previewMenu).toBeVisible({ timeout: 10000 });
        await this.previewMenu.scrollIntoViewIfNeeded();
        await this.previewMenu.click();
        await this.page.waitForTimeout(500);
        await expect(this.tableViewOption).toBeVisible({ timeout: 10000 });
        await this.tableViewOption.click();
        await this.page.waitForTimeout(2000);
        await expect(this.tableView).toBeVisible({ timeout: 15000 });
    }

    /**
     * Create a new fragment
     * Fragment title and card title are automatically generated with run ID (similar to cloneCard) to be cleaned up after execution of the test
     * @param {Object} options - Configuration options
     * @param {string} options.osi - OSI to search and select
     * @param {string} options.variant - Variant type to select in the editor (e.g., 'ccd-suggested', 'ccd-slice', 'plans', 'ah-try-buy-widget')
     * @returns {Promise<string>} The fragment ID of the created card
     */
    async createFragment({ osi, variant }) {
        if (!osi) {
            throw new Error('osi is required parameter');
        }
        if (!variant) {
            throw new Error('variant is required parameter');
        }

        await expect(this.createButton).toBeVisible({ timeout: 10000 });
        await this.createButton.click();

        await expect(this.createDialogMerchCardOption).toBeVisible({ timeout: 10000 });
        await this.createDialogMerchCardOption.click();

        await expect(this.createDialog).toBeVisible({ timeout: 15000 });
        await this.page.waitForTimeout(500);

        await expect(this.createDialogTitleInput).toBeVisible({ timeout: 10000 });
        const titleWithRunId = getFragmentTitle();
        await this.createDialogTitleInput.fill(titleWithRunId);

        await expect(this.createDialogOSIButton).toBeVisible({ timeout: 10000 });
        await this.createDialogOSIButton.click();

        await expect(this.ost.searchField).toBeVisible({ timeout: 15000 });
        await this.ost.searchField.fill(osi);
        await this.ost.nextButton.click();
        await expect(this.ost.priceUse).toBeVisible({ timeout: 10000 });
        await this.ost.priceUse.click();
        await this.page.waitForTimeout(1000);

        await expect(this.createDialogCreateButton).toBeVisible({ timeout: 10000 });
        await this.createDialogCreateButton.click();

        // Wait for positive toast to appear and then disappear after fragment creation
        await this.toastPositive.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {
            // If toast doesn't appear, continue
        });
        await this.toastPositive.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {
            // If toast disappears quickly or doesn't appear, continue
        });

        await this.editorPanel.waitFor({
            state: 'visible',
            timeout: 30000,
        });
        await this.page.waitForTimeout(1000);

        await expect(this.editor.variant).toBeVisible({ timeout: 10000 });
        await this.editor.variant.locator('sp-picker').first().click();
        await this.page.locator(`sp-menu-item[value="${variant}"]`).first().click();
        await this.page.waitForTimeout(1000);

        await expect(this.deleteCardButton).not.toHaveAttribute('disabled', { timeout: 30000 });
        await expect(this.saveCardButton).not.toHaveAttribute('disabled', { timeout: 30000 });

        // Enter card title (auto-generated with run ID, same as fragment title)
        await expect(this.editor.title).toBeVisible({ timeout: 10000 });
        await this.editor.title.fill(titleWithRunId);

        await expect(this.editor.prices).toBeVisible({ timeout: 10000 });
        const pricesOSTButton = this.editor.prices.locator(this.editor.OSTButton);
        await expect(pricesOSTButton).toBeVisible({ timeout: 10000 });
        await pricesOSTButton.click();

        await expect(this.ost.priceUse).toBeVisible({ timeout: 15000 });
        await this.ost.priceUse.click();
        await this.page.waitForTimeout(1000);

        await this.saveCard();

        // Wait for positive toast to disappear before navigating away
        await this.toastPositive.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {
            // If toast doesn't appear or disappears quickly, continue
        });

        const currentUrl = this.page.url();
        const fragmentIdMatch = currentUrl.match(/fragment=([^&]+)/);
        let fragmentId = fragmentIdMatch ? fragmentIdMatch[1] : null;

        // If not in URL, get from card preview in editor
        if (!fragmentId) {
            fragmentId = await this.page
                .locator('aem-fragment[fragment]')
                .first()
                .getAttribute('fragment')
                .catch(() => null);
        }

        if (!fragmentId) {
            throw new Error('Failed to retrieve fragment ID from URL or card preview');
        }

        return fragmentId;
    }

    /**
     * Create a variation - supports both table view and editor sidenav
     * @param {string} fragmentId - The fragment ID to create variation for
     * @param {string} locale - The regional locale (e.g., 'en_AU')
     * @returns {Promise<string>} The variation fragment ID
     */
    async createVariation(fragmentId, locale) {
        if (!fragmentId) {
            throw new Error('fragmentId is required parameter');
        }
        if (!locale) {
            throw new Error('locale is required parameter');
        }

        // Check if we're in the editor (editor panel is visible)
        const isInEditor = await this.editorPanel.isVisible().catch(() => false);

        if (isInEditor) {
            // Create variation from editor sidenav
            await expect(this.createVariationButton).toBeVisible();
            await expect(this.createVariationButton).toBeEnabled();

            await this.createVariationButton.scrollIntoViewIfNeeded();
            await this.page.waitForTimeout(500);

            await this.createVariationButton.click({ force: true });
        } else {
            // Create variation from table view
            await this.switchToTableView();

            const fragmentRow = this.tableViewRowByFragmentId(fragmentId);
            await expect(fragmentRow).toBeVisible();

            const actionsMenu = this.tableViewActionsMenu(fragmentRow);
            await expect(actionsMenu).toBeVisible();
            await actionsMenu.click();

            const createVariationOption = this.tableViewCreateVariationOption(actionsMenu);
            await expect(createVariationOption).toBeVisible();
            await createVariationOption.click();
        }

        await expect(this.variationDialog).toBeVisible();
        await this.page.waitForTimeout(500);

        await expect(this.variationDialogLocalePicker).toBeVisible();
        await this.variationDialogLocalePicker.click();
        await this.page.waitForTimeout(500);

        const localeOption = this.variationDialog.locator(`sp-menu-item[value="${locale}"]`).first();
        await expect(localeOption).toBeVisible();
        await localeOption.click();
        await this.page.waitForTimeout(500);

        await expect(this.variationDialogCreateButton).toBeEnabled();
        await this.variationDialogCreateButton.click();

        // Wait for positive toast to appear and disappear
        await this.toastPositive.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {
            // If toast doesn't appear, continue
        });
        await this.toastPositive.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {
            // If toast disappears quickly or doesn't appear, continue
        });

        // Wait for editor to open (if not already open)
        await this.editorPanel.waitFor({
            state: 'visible',
            timeout: 30000,
        });
        await this.page.waitForTimeout(1000);

        await expect(this.editor.fragmentTitle).toBeVisible();
        const titleWithRunId = getFragmentTitle();
        await this.editor.fragmentTitle.fill(titleWithRunId);
        await this.page.waitForTimeout(500);

        await this.saveCard();

        // Wait for positive toast to disappear
        await this.toastPositive.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {
            // If toast doesn't appear or disappears quickly, continue
        });

        // Get the variation fragment ID from URL
        const currentUrl = this.page.url();
        const variationIdMatch = currentUrl.match(/fragment=([^&]+)/);
        let variationId = variationIdMatch ? variationIdMatch[1] : null;

        if (!variationId) {
            // Try to get from card preview in editor
            variationId = await this.page
                .locator('aem-fragment[fragment]')
                .first()
                .getAttribute('fragment')
                .catch(() => null);
        }

        if (!variationId) {
            throw new Error('Failed to retrieve variation fragment ID from URL or card preview');
        }

        return variationId;
    }
}
