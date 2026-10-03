import { expect } from '@playwright/test';
import { getTitle } from '../utils/fragment-tracker.js';
import { beginFragmentCreation, completeFragmentCreation } from '../utils/fragment-ledger.js';
import { trackEditorReads, waitForEditorReady } from '../libs/editor-bootstrap.js';
import OSTPage from './ost.page';
import EditorPage from './editor.page';

export default class StudioPage {
    constructor(page) {
        this.page = page;
        trackEditorReads(page);
        this.ost = new OSTPage(page);
        this.editor = new EditorPage(page);

        this.quickActions = page.locator('.quick-actions');
        this.recentlyUpdated = page.locator('.recently-updated');
        this.gotoContent = page.locator('.quick-action-card[heading="Go to Content"]');

        this.searchInput = page.locator('#actions sp-search  input');
        this.searchIcon = page.locator('#actions sp-search[placeholder="Search"] sp-icon-search');
        this.filter = page.locator('sp-action-button[label="Filter"]');
        this.filterPanel = page.locator('mas-filter-panel');
        this.createdByTag = this.filterPanel.locator('sp-tag sp-icon-user');
        this.folderPicker = page.locator('mas-nav-folder-picker sp-action-menu');
        this.previewMenu = page.locator('#actions sp-action-menu[value="render"]');
        this.renderViewOption = this.previewMenu.locator('sp-menu-item[value="render"]');
        this.tableViewOption = this.previewMenu.locator('sp-menu-item[value="table"]');
        this.renderView = page.locator('#render:not(.next-page-skeletons)');
        this.tableView = page.locator('#content > sp-table');
        this.contentTableBody = page.locator('#content sp-table-body');
        this.tableViewHeaders = page.locator('sp-table-head');
        this.tableViewRows = this.tableView.locator('sp-table-row');
        this.tableViewFragmentTable = (fragmentId) => this.tableView.locator(`mas-fragment-table[data-id="${fragmentId}"]`);
        this.expandButton = (fragmentId) => this.tableViewFragmentTable(fragmentId).locator('button.expand-button');
        this.groupedVariationsTab = (parentFragmentId) =>
            this.tableView.locator(
                `mas-fragment:has(mas-fragment-table[data-id="${parentFragmentId}"]) mas-fragment-variations sp-tab[value="grouped"]`,
            );
        this.groupedVariationsTabPanel = (parentFragmentId) =>
            this.tableView.locator(
                `mas-fragment:has(mas-fragment-table[data-id="${parentFragmentId}"]) mas-fragment-variations sp-tab-panel[value="grouped"]`,
            );
        this.localeVariationsTabPanel = (parentFragmentId) =>
            this.tableView.locator(
                `mas-fragment:has(mas-fragment-table[data-id="${parentFragmentId}"]) mas-fragment-variations sp-tab-panel[value="locale"]`,
            );
        this.regionalVariationsTable = (parentFragmentId) =>
            this.tableView.locator(
                `mas-fragment:has(mas-fragment-table[data-id="${parentFragmentId}"]) mas-fragment-variations sp-tab-panel[value="locale"] mas-fragment-table`,
            );
        this.groupedVariationsTable = (parentFragmentId) =>
            this.tableView.locator(
                `mas-fragment:has(mas-fragment-table[data-id="${parentFragmentId}"]) mas-fragment-variations sp-tab-panel[value="grouped"] mas-fragment-table`,
            );
        this.tableViewRowByFragmentId = (fragmentId) =>
            this.tableView.locator(
                `sp-table-row[value="${fragmentId}"], mas-fragment-table[data-id="${fragmentId}"] sp-table-row`,
            );
        this.tableViewPathCell = (row) => row.locator('sp-table-cell.name');
        this.tableViewTitleCell = (row) => row.locator('sp-table-cell.title');
        this.tableViewPriceCell = (row) => row.locator('sp-table-cell.price');
        this.tableViewActionsMenu = (row) => row.locator('sp-table-cell.actions sp-action-menu');
        this.tableViewCreateVariationOption = (menu) => menu.locator('sp-menu-item:has-text("Create variation")');
        this.tableViewCopyLinkOption = (menu) => menu.locator('sp-menu-item:has-text("Copy Link")');
        this.variationDialog = page.locator('mas-variation-dialog > sp-dialog');
        this.variationDialogLocalePicker = this.variationDialog.locator('sp-picker[placeholder="Select a locale"]');
        this.variationDialogCreateButton = this.variationDialog.locator('sp-button:has-text("Create variation")');
        this.quickActions = page.locator('.quick-actions');
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
        this.fragmentsTable = page.locator('.nav-breadcrumbs sp-breadcrumb-item:not([hidden]):has-text("Fragments")').first();
        // Sidenav toolbar
        this.sideNav = page.locator('mas-side-nav');
        this.cloneCardButton = this.sideNav.locator('mas-side-nav-item[label="Duplicate"]');
        this.deleteCardButton = this.sideNav.locator('mas-side-nav-item[label="Delete"]');
        this.saveCardButton = this.sideNav.locator('mas-side-nav-item[label="Save"]');
        this.publishCardButton = this.sideNav.locator('mas-side-nav-item[label="Publish"]');
        this.createVariationButton = this.sideNav.locator('mas-side-nav-item[label="Create Variation"]');
        this.versionHistoryButton = this.sideNav.locator('mas-side-nav-item[label="History"]');
        this.copyFieldButton = this.sideNav.locator('mas-side-nav-item[label="Copy Field"]');
        // Side-nav renders the Copy Field popover inside its shadow root; Playwright CSS selectors pierce shadow.
        this.copyFieldPopover = this.sideNav.locator('sp-popover[open]');
        this.copyFieldRow = (label) =>
            this.copyFieldPopover.locator('sp-menu-item', { has: this.page.locator(`.field-label:text-is("${label}")`) });
        this.copyFieldRowValue = (label) => this.copyFieldRow(label).locator('.field-value');
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

    /**
     * Open a test's starting route; eligible editor suites override only setup.
     */
    async openPage(url) {
        await this.page.goto(url, { waitUntil: 'domcontentloaded' });
    }

    /**
     * Wait for cards to load on both content and fragment-editor pages.
     * Content pages render mas-fragment-render (lazy loaded via IntersectionObserver).
     * Fragment-editor pages render merch-card directly inside mas-fragment-editor.
     * @param {number} [minMerchCardsInRender=1] When >1, scroll until #render has at least this many merch-cards (lazy rows hydrate after intersecting).
     */
    async waitForCardsLoaded(minMerchCardsInRender = 1) {
        const fragmentRender = this.page.locator('mas-fragment-render').first();
        const fragmentEditor = this.page.locator('mas-fragment-editor').first();

        const winner = await Promise.race([
            fragmentRender.waitFor({ state: 'attached', timeout: 30000 }).then(() => 'content'),
            fragmentEditor.waitFor({ state: 'attached', timeout: 30000 }).then(() => 'editor'),
        ]);

        if (winner === 'content') {
            try {
                await fragmentRender.scrollIntoViewIfNeeded();
            } catch {
                /* Grid hosts can detach during navigation/search */
            }

            const min = Math.max(1, minMerchCardsInRender);
            const main = this.page.locator('.main-container').first();
            await expect
                .poll(
                    async () => {
                        const count = await this.renderView.locator('merch-card').count();
                        if (count < min)
                            await main.evaluate((el) => {
                                el.scrollTop = el.scrollHeight;
                            });
                        return count;
                    },
                    { timeout: 30000 },
                )
                .toBeGreaterThanOrEqual(min);
        }

        await this.page.locator('merch-card').first().waitFor({ state: 'visible', timeout: 30000 });

        if (minMerchCardsInRender > 1) {
            await expect
                .poll(async () => this.renderView.locator('merch-card').count(), { timeout: 30000 })
                .toBeGreaterThanOrEqual(minMerchCardsInRender);
        }
    }

    /**
     * Select a locale from the locale picker dropdown
     * @param {string} localeName - The display name of the locale (e.g., 'French (FR)', 'Turkish (TR)')
     */
    async selectLocale(localeName) {
        const params = new URLSearchParams(new URL(this.page.url()).hash.slice(1));
        if (params.get('page') === 'fragment-editor') {
            await waitForEditorReady(this.page, params.get('fragmentId'));
        }
        await this.localePicker.click();
        await this.page.getByRole('menuitem', { name: localeName }).click();
        await expect(this.localePicker).toHaveJSProperty('open', false);
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
                    // Perform reload
                    await this.page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(async (e) => {
                        // If reload fails, try navigating to the current URL
                        const url = this.page.url();
                        await this.page.goto(url, {
                            waitUntil: 'domcontentloaded',
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
                // Open editor only if not already visible
                const editorAlreadyVisible = await this.editorPanel.isVisible().catch(() => false);
                if (!editorAlreadyVisible) {
                    const card = await this.getCard(cardId);
                    await expect(card).toBeVisible();
                    await card.dblclick();
                    await this.editorPanel.waitFor({
                        state: 'visible',
                        timeout: 30000,
                    });
                }

                await waitForEditorReady(this.page, cardId);

                await expect(this.cloneCardButton).toBeVisible({ timeout: 10000 });
                await expect(this.cloneCardButton).toBeEnabled({ timeout: 15000 });

                await this.cloneCardButton.scrollIntoViewIfNeeded();

                // Hover over the button to ensure it's interactive and ready
                await this.cloneCardButton.hover({ timeout: 5000 });

                // Verify button is still enabled after hover
                const isEnabled = await this.cloneCardButton.isEnabled();
                if (!isEnabled) {
                    throw new Error('[BUTTON_DISABLED] Clone button is not enabled after hover');
                }

                // Click the button - try normal click first, then force if needed
                try {
                    await this.cloneCardButton.click({ timeout: 5000 });
                } catch (clickError) {
                    await this.cloneCardButton.click({ force: true });
                }

                // Wait for fragment title dialog and enter title
                await this.page
                    .waitForSelector('sp-dialog[variant="confirmation"]', {
                        state: 'visible',
                        timeout: 15000,
                    })
                    .catch(() => {
                        throw new Error('[CLICK_FAILED] Clone button click did not trigger confirmation dialog');
                    });

                // Enter fragment title with run ID
                const titleInput = this.page.locator('sp-dialog[variant="confirmation"] sp-textfield input');
                await titleInput.fill(getTitle());

                const creation = beginFragmentCreation('clone');
                await this.page.locator('sp-dialog[variant="confirmation"] sp-button:has-text("Clone")').click();
                await this.page
                    .locator('sp-dialog[variant="confirmation"] sp-button sp-progress-circle')
                    .waitFor({ state: 'visible', timeout: 15000 });

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
                await expect
                    .poll(() => {
                        const id = new URLSearchParams(new URL(this.page.url()).hash.slice(1)).get('fragmentId');
                        return !!id && id !== cardId;
                    })
                    .toBe(true);
                const id = new URLSearchParams(new URL(this.page.url()).hash.slice(1)).get('fragmentId');
                await waitForEditorReady(this.page, id);
                await completeFragmentCreation(creation, this.page);
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
            await this.#retryOperation(async () => {
                await this.saveCardButton.scrollIntoViewIfNeeded();

                const isEnabled = await this.saveCardButton.isEnabled();

                if (!isEnabled) {
                    throw new Error('[BUTTON_DISABLED] Save button is not enabled');
                }

                const id = await this.page.locator('mas-fragment-editor').evaluate((editor) => editor.fragment.id);
                const [response] = await Promise.all([
                    this.page.waitForResponse(
                        (response) =>
                            response.request().method() === 'PUT' &&
                            new URL(response.url()).pathname.endsWith(`/cf/fragments/${id}`),
                    ),
                    this.saveCardButton.click(),
                ]);
                expect(response.ok(), 'Fragment save must succeed').toBe(true);
                await this.page.waitForFunction((id) => {
                    const repo = document.querySelector('mas-repository');
                    return !repo.operation.get() && repo.fragmentInEdit?.id === id && !repo.fragmentInEdit.hasChanges;
                }, id);
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

    /**
     * Publish the current fragment. Expects editor to be open. Clicks Publish in side nav and waits for success toast.
     */
    async publishCard() {
        await this.publishCardButton.click();
        const publishToast = this.page.locator('mas-toast sp-toast[variant="positive"]:has-text("successfully published")');
        await expect(publishToast).toBeVisible({ timeout: 20000 });
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
            await waitForEditorReady(this.page, cardId);

            await this.#retryOperation(async (attempt) => {
                // Wait for delete button and ensure it's enabled
                await this.deleteCardButton.waitFor({
                    state: 'visible',
                    timeout: 5000,
                });
                await expect(this.deleteCardButton).toBeEnabled();

                await this.deleteCardButton.scrollIntoViewIfNeeded();

                await this.deleteCardButton.click({ force: true });
                await expect(await this.confirmationDialog).toBeVisible();
                const [response] = await Promise.all([
                    this.page.waitForResponse(
                        (response) =>
                            response.request().method() === 'DELETE' &&
                            new URL(response.url()).pathname.endsWith(`/fragments/${cardId}/deleteAndUnpublish`),
                    ),
                    this.toastProgress.waitFor({ state: 'visible', timeout: 5000 }),
                    this.confirmationDialog.locator(this.deleteDialog).click(),
                ]);
                expect(response.ok(), 'Fragment deletion must succeed').toBe(true);
                await this.page.waitForFunction(() => !document.querySelector('mas-repository').operation.get());

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
        const fragmentUrl = this.page.url();
        await expect(this.fragmentsTable).toBeVisible();
        await this.fragmentsTable.scrollIntoViewIfNeeded();
        await this.fragmentsTable.click();
        // await this.page.goBack();
        await expect(await this.confirmationDialog).toBeVisible();
        await this.discardDialog.click();
        await expect(await editor.panel).not.toBeVisible();
        await this.page.goto(fragmentUrl);
        await this.page.waitForLoadState('domcontentloaded');
        await this.waitForCardsLoaded();
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
        await expect(this.tableViewOption).toBeVisible({ timeout: 10000 });
        await this.tableViewOption.click();
        await expect(this.tableView).toBeVisible({ timeout: 15000 });
    }

    async expandRowIfCollapsed(fragmentId) {
        const expandButton = this.expandButton(fragmentId);
        const isCollapsed = await expandButton.locator('> sp-icon-chevron-right').count();
        if (isCollapsed) await expandButton.click();
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

        await expect(this.createDialogTitleInput).toBeVisible({ timeout: 10000 });
        const titleWithRunId = getTitle();
        await this.createDialogTitleInput.fill(titleWithRunId);

        await expect(this.createDialogOSIButton).toBeVisible({ timeout: 10000 });
        await this.createDialogOSIButton.click();

        await expect(this.ost.searchField).toBeVisible({ timeout: 15000 });
        await this.ost.searchField.fill(osi);
        await this.ost.nextButton.click();
        await expect(this.ost.priceUse).toBeVisible({ timeout: 10000 });
        await this.ost.priceUse.click();
        await expect(this.ost.popup).not.toBeVisible();

        await expect(this.createDialogCreateButton).toBeVisible({ timeout: 10000 });
        const creation = beginFragmentCreation('create');
        await this.createDialogCreateButton.click();

        await expect(this.toastPositive).toBeVisible({ timeout: 15000 });
        await expect(this.createDialog).not.toBeVisible();

        await this.editorPanel.waitFor({
            state: 'visible',
            timeout: 30000,
        });
        const fragmentId = await completeFragmentCreation(creation, this.page);
        await waitForEditorReady(this.page, fragmentId, { preview: false });

        await expect(this.editor.variant).toBeVisible({ timeout: 10000 });
        await this.editor.variant.click();
        await this.page.locator(`sp-menu-item[value="${variant}"]`).first().click();
        await expect(this.editor.variant).toHaveJSProperty('value', variant);

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
        await expect(this.ost.popup).not.toBeVisible();

        await this.saveCard();

        await expect(this.page.locator(`merch-card:has(aem-fragment[fragment="${fragmentId}"])`)).toHaveAttribute(
            'variant',
            variant,
        );
        await waitForEditorReady(this.page, fragmentId);
        return fragmentId;
    }

    /**
     * Create a variation - supports both table view and editor sidenav
     * @param {string} fragmentId - The fragment ID to create variation for
     * @param {string} locale - The regional locale (e.g., 'en_CA')
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
            await waitForEditorReady(this.page, fragmentId);

            await expect(this.createVariationButton).toBeVisible({ timeout: 10000 });
            await expect(this.createVariationButton).toBeEnabled({ timeout: 15000 });

            await this.createVariationButton.scrollIntoViewIfNeeded();

            // Hover over the button to ensure it's interactive and ready
            await this.createVariationButton.hover({ timeout: 5000 });

            // Verify button is still enabled after hover
            const isEnabled = await this.createVariationButton.isEnabled();
            if (!isEnabled) {
                throw new Error('[BUTTON_DISABLED] Create variation button is not enabled after hover');
            }

            // Click the button - try normal click first, then force if needed
            try {
                await this.createVariationButton.click({ timeout: 5000 });
            } catch (clickError) {
                // If normal click fails, try with force
                await this.createVariationButton.click({ force: true });
            }
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

        await expect(this.variationDialogLocalePicker).toBeVisible();
        await expect(this.variationDialogLocalePicker).toBeEnabled();
        await this.variationDialogLocalePicker.scrollIntoViewIfNeeded();
        await this.variationDialogLocalePicker.click({ force: true, timeout: 5000 });

        const localeOption = this.page.locator(`sp-menu-item[value="${locale}"]:visible`).first();
        await expect(localeOption).toBeVisible();
        try {
            await localeOption.click({ timeout: 5000 });
        } catch (localeOptionClickError) {
            await localeOption.click({ force: true });
        }
        await expect(this.variationDialogLocalePicker).toHaveJSProperty('value', locale);

        await expect(this.variationDialogCreateButton).toBeEnabled();
        const creation = beginFragmentCreation('variation');
        await this.variationDialogCreateButton.click();

        await expect(this.variationDialog).not.toBeVisible();
        await expect
            .poll(() => {
                const id = new URLSearchParams(new URL(this.page.url()).hash.slice(1)).get('fragmentId');
                return !!id && id !== fragmentId;
            })
            .toBe(true);

        // Wait for editor to open (if not already open)
        await this.editorPanel.waitFor({
            state: 'visible',
            timeout: 30000,
        });
        const variationId = new URLSearchParams(new URL(this.page.url()).hash.slice(1)).get('fragmentId');
        await waitForEditorReady(this.page, variationId);
        await completeFragmentCreation(creation, this.page);
        return variationId;
    }
}
