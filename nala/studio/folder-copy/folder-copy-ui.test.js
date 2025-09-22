import { expect, test } from '@playwright/test';
import StudioPage from '../studio.page.js';
import EditorPage from '../editor.page.js';

const miloLibs = process.env.MILO_LIBS || '';

let studio;
let editor;

test.beforeEach(async ({ page, browserName }) => {
    test.slow();
    if (browserName === 'chromium') {
        await page.setExtraHTTPHeaders({
            'sec-ch-ua': '"Chromium";v="123", "Not:A-Brand";v="8"',
        });
    }
    studio = new StudioPage(page);
    editor = new EditorPage(page);
});

test.describe('M@S Studio Folder Copy UI Validation', () => {
    // @studio-folder-copy-ui-selection-mode - Validate selection mode copy UI
    test('@studio-folder-copy-ui-selection-mode - Validate selection mode copy UI', async ({ page, baseURL }) => {
        const testPage = `${baseURL}/studio.html${miloLibs}#page=content&path=nala`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio content page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(await studio.renderView).toBeVisible();
        });

        await test.step('step-2: Enter selection mode', async () => {
            // Click Select button to enter selection mode
            await expect(studio.selectButton).toBeVisible();
            await studio.selectButton.click();
            await page.waitForTimeout(500);
        });

        await test.step('step-3: Select a card', async () => {
            // Click on first card's overlay to select it
            const firstCardOverlay = studio.cardOverlay.first();
            await expect(firstCardOverlay).toBeVisible();
            await firstCardOverlay.click();
            await page.waitForTimeout(500);
        });

        await test.step('step-4: Validate action bar appears with copy button', async () => {
            // Check action bar is visible
            await expect(studio.actionBar).toBeVisible();

            // Check copy to folder button in selection panel
            const copyButton = page.locator('sp-action-button[label="Copy to folder"]');
            await expect(copyButton).toBeVisible();
        });

        await test.step('step-5: Click copy button to open dialog', async () => {
            const copyButton = page.locator('sp-action-button[label="Copy to folder"]');
            await copyButton.click();
            await page.waitForTimeout(1000);

            // Validate dialog opened
            const dialogExists = await page.evaluate(() => {
                const toolbar = document.querySelector('mas-toolbar');
                if (toolbar?.shadowRoot) {
                    const dialog = toolbar.shadowRoot.querySelector('mas-copy-dialog');
                    if (dialog) return true;
                }
                const dialog = document.querySelector('mas-copy-dialog');
                return dialog !== null;
            });
            expect(dialogExists).toBeTruthy();
        });

        await test.step('step-6: Validate dialog elements and cancel without copying', async () => {
            // Check for folder picker
            const folderPickerVisible = await studio.getCopyDialogElement('sp-picker');
            expect(folderPickerVisible).not.toBeNull();

            // Check for fragment name input
            const nameInputVisible = await studio.getCopyDialogElement('sp-textfield');
            expect(nameInputVisible).not.toBeNull();

            // Check that dialog wrapper exists with confirm/cancel buttons
            const dialogWrapper = await studio.getCopyDialogElement('sp-dialog-wrapper');
            expect(dialogWrapper).not.toBeNull();

            // Cancel the dialog using the cancel event on the dialog wrapper
            await page.evaluate(() => {
                const toolbar = document.querySelector('mas-toolbar');
                let dialog = null;
                if (toolbar?.shadowRoot) {
                    dialog = toolbar.shadowRoot.querySelector('mas-copy-dialog');
                }
                if (!dialog) {
                    dialog = document.querySelector('mas-copy-dialog');
                }
                if (dialog && dialog.shadowRoot) {
                    const wrapper = dialog.shadowRoot.querySelector('sp-dialog-wrapper');
                    if (wrapper) {
                        wrapper.dispatchEvent(new CustomEvent('cancel'));
                    }
                }
            });
            await page.waitForTimeout(500);

            // Verify dialog is closed
            const dialogClosed = await page.evaluate(() => {
                const toolbar = document.querySelector('mas-toolbar');
                if (toolbar?.shadowRoot) {
                    const dialog = toolbar.shadowRoot.querySelector('mas-copy-dialog');
                    if (dialog && dialog.open === false) return true;
                }
                const dialog = document.querySelector('mas-copy-dialog');
                return !dialog || dialog.open === false;
            });
            expect(dialogClosed).toBeTruthy();

            // Exit selection mode
            const cancelSelectionButton = page.locator('sp-button:has-text("Cancel")');
            if (await cancelSelectionButton.isVisible()) {
                await cancelSelectionButton.click();
            }
        });
    });
});
