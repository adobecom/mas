import { expect } from '@playwright/test';
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
        this.folderPicker = page.locator('mas-folder-picker sp-action-menu');
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

        // Copy dialog selectors
        this.copyToFolderButton = page.locator('sp-action-button:has(sp-icon-folder-add)');
        // The copy dialog is rendered inside mas-toolbar's shadow DOM
        // But Playwright can't access shadow DOM directly, so we'll use evaluator
        this.copyDialog = page.locator('mas-copy-dialog');

        // Selection panel
        this.selectionPanel = page.locator('mas-selection-panel');
        this.selectionPanelCopyButton = page.locator('mas-selection-panel sp-action-button[label="Copy to folder"]');

        // Selection mode
        this.selectButton = page.locator('sp-button:has-text("Select")');
        this.cardOverlay = page.locator('.overlay');
        this.actionBar = page.locator('sp-action-bar');
    }

    // Helper methods for shadow DOM interaction
    async getCopyDialogElement(selector) {
        return this.page.evaluate((sel) => {
            // First try to find dialog in toolbar's shadow DOM
            const toolbar = document.querySelector('mas-toolbar');
            let dialog = null;

            if (toolbar?.shadowRoot) {
                dialog = toolbar.shadowRoot.querySelector('mas-copy-dialog');
            }

            // Fallback to document if not found in toolbar
            if (!dialog) {
                dialog = document.querySelector('mas-copy-dialog');
            }

            if (!dialog || !dialog.shadowRoot) return null;

            // Handle text-based selectors
            if (sel.includes(':has-text(')) {
                // Extract the base selector and text
                const match = sel.match(/(.+):has-text\("(.+)"\)/);
                if (match) {
                    const baseSelector = match[1];
                    const text = match[2];
                    const elements = dialog.shadowRoot.querySelectorAll(baseSelector);
                    return Array.from(elements).find((el) => el.textContent.includes(text)) || null;
                }
            }

            return dialog.shadowRoot.querySelector(sel);
        }, selector);
    }

    async clickCopyDialogElement(selector) {
        await this.page.evaluate((sel) => {
            // First try to find dialog in toolbar's shadow DOM
            const toolbar = document.querySelector('mas-toolbar');
            let dialog = null;

            if (toolbar?.shadowRoot) {
                dialog = toolbar.shadowRoot.querySelector('mas-copy-dialog');
            }

            // Fallback to document if not found in toolbar
            if (!dialog) {
                dialog = document.querySelector('mas-copy-dialog');
            }

            if (!dialog || !dialog.shadowRoot) return;

            // Handle text-based selectors
            let element;
            if (sel.includes(':has-text(')) {
                // Extract the text from the selector
                const match = sel.match(/(.+):has-text\("(.+)"\)/);
                if (match) {
                    const baseSelector = match[1];
                    const text = match[2];
                    const elements = dialog.shadowRoot.querySelectorAll(baseSelector);
                    element = Array.from(elements).find((el) => el.textContent.includes(text));
                }
            } else {
                element = dialog.shadowRoot.querySelector(sel);
            }

            if (!element) return;

            // For Spectrum pickers, click the button that opens the dropdown
            if (element.tagName === 'SP-PICKER' && element.shadowRoot) {
                const button = element.shadowRoot.querySelector('button');
                if (button) {
                    button.click();
                    return;
                }
            }

            // Default click behavior
            element.click();
        }, selector);
    }

    async getCopyDialogInputValue(selector) {
        return this.page.evaluate((sel) => {
            // First try to find dialog in toolbar's shadow DOM
            const toolbar = document.querySelector('mas-toolbar');
            let dialog = null;

            if (toolbar?.shadowRoot) {
                dialog = toolbar.shadowRoot.querySelector('mas-copy-dialog');
            }

            // Fallback to document if not found in toolbar
            if (!dialog) {
                dialog = document.querySelector('mas-copy-dialog');
            }

            if (!dialog || !dialog.shadowRoot) return null;
            const element = dialog.shadowRoot.querySelector(sel);
            if (!element) return null;

            // For Spectrum components, use the value property directly
            if (element.value !== undefined) {
                return element.value;
            }

            // For elements with shadow DOM, try to find input inside
            if (element.shadowRoot) {
                const innerInput = element.shadowRoot.querySelector('input, textarea, sp-textfield');
                return innerInput ? innerInput.value : null;
            }

            return null;
        }, selector);
    }

    async setCopyDialogInputValue(selector, value) {
        await this.page.evaluate(
            ({ sel, val }) => {
                // First try to find dialog in toolbar's shadow DOM
                const toolbar = document.querySelector('mas-toolbar');
                let dialog = null;

                if (toolbar?.shadowRoot) {
                    dialog = toolbar.shadowRoot.querySelector('mas-copy-dialog');
                }

                // Fallback to document if not found in toolbar
                if (!dialog) {
                    dialog = document.querySelector('mas-copy-dialog');
                }

                if (!dialog || !dialog.shadowRoot) return;
                const element = dialog.shadowRoot.querySelector(sel);
                if (!element) return;

                // For Spectrum components, set value and dispatch events
                if (element.value !== undefined) {
                    element.value = val;
                    element.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
                    element.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
                } else if (element.shadowRoot) {
                    // For elements with shadow DOM, find and update inner input
                    const innerInput = element.shadowRoot.querySelector('input, textarea');
                    if (innerInput) {
                        innerInput.value = val;
                        innerInput.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
                        innerInput.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
                    }
                }
            },
            { sel: selector, val: value },
        );
    }

    async isCopyDialogElementVisible(selector) {
        return this.page.evaluate((sel) => {
            // First try to find dialog in toolbar's shadow DOM
            const toolbar = document.querySelector('mas-toolbar');
            let dialog = null;

            if (toolbar?.shadowRoot) {
                dialog = toolbar.shadowRoot.querySelector('mas-copy-dialog');
            }

            // Fallback to document if not found in toolbar
            if (!dialog) {
                dialog = document.querySelector('mas-copy-dialog');
            }

            if (!dialog || !dialog.shadowRoot) return false;
            const element = dialog.shadowRoot.querySelector(sel);
            if (!element) return false;

            // Check if element is visible
            const rect = element.getBoundingClientRect();
            const isVisible = rect.width > 0 && rect.height > 0;

            // For Spectrum components with shadow DOM, check if they have visible content
            if (element.shadowRoot) {
                // Check if there's a visible input or other content inside
                const innerInput = element.shadowRoot.querySelector('input, textarea, [role="textbox"]');
                if (innerInput) {
                    const innerRect = innerInput.getBoundingClientRect();
                    return innerRect.width > 0 && innerRect.height > 0;
                }
                // For other shadow DOM elements, check if the host is visible
                return isVisible;
            }

            return isVisible;
        }, selector);
    }

    async getCopyDialogElementAttribute(selector, attribute) {
        return this.page.evaluate(
            ({ sel, attr }) => {
                // First try to find dialog in toolbar's shadow DOM
                const toolbar = document.querySelector('mas-toolbar');
                let dialog = null;

                if (toolbar?.shadowRoot) {
                    dialog = toolbar.shadowRoot.querySelector('mas-copy-dialog');
                }

                // Fallback to document if not found in toolbar
                if (!dialog) {
                    dialog = document.querySelector('mas-copy-dialog');
                }

                if (!dialog || !dialog.shadowRoot) return null;

                // Handle text-based selectors
                let element;
                if (sel.includes(':has-text(')) {
                    // Extract the text from the selector
                    const match = sel.match(/(.+):has-text\("(.+)"\)/);
                    if (match) {
                        const baseSelector = match[1];
                        const text = match[2];
                        const elements = dialog.shadowRoot.querySelectorAll(baseSelector);
                        element = Array.from(elements).find((el) => el.textContent.includes(text));
                    }
                } else {
                    element = dialog.shadowRoot.querySelector(sel);
                }

                return element ? element.getAttribute(attr) : null;
            },
            { sel: selector, attr: attribute },
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

                // Enter fragment title
                const titleInput = this.page.locator('sp-dialog[variant="confirmation"] sp-textfield input');
                await titleInput.fill('MAS Nala Automation Cloned Fragment');

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
}
