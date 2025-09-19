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
    // @studio-folder-copy-ui-button-exists - Validate copy to folder button exists in toolbar
    test('@studio-folder-copy-ui-button-exists - Validate copy to folder button exists', async ({ page, baseURL }) => {
        const testCardId = 'e3901ae8-e87f-4821-8e27-6e31d2e5ffa3'; // CCD Suggested test card
        const testPage = `${baseURL}/studio.html${miloLibs}#page=content&path=nala&query=${testCardId}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(testCardId)).toBeVisible();
            await (await studio.getCard(testCardId)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Validate copy to folder button exists', async () => {
            // Check that the copy to folder button is present in the toolbar
            await expect(studio.copyToFolderButton).toBeVisible();
            await expect(studio.copyToFolderButton).toBeEnabled();
        });

        await test.step('step-4: Close editor without copying', async () => {
            await editor.closeEditor.click();
            await expect(await editor.panel).not.toBeVisible();
        });
    });

    // @studio-folder-copy-ui-dialog-opens - Validate copy dialog opens when button is clicked
    test('@studio-folder-copy-ui-dialog-opens - Validate copy dialog opens', async ({ page, baseURL }) => {
        const testCardId = 'e3901ae8-e87f-4821-8e27-6e31d2e5ffa3'; // CCD Suggested test card
        const testPage = `${baseURL}/studio.html${miloLibs}#page=content&path=nala&query=${testCardId}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(testCardId)).toBeVisible();
            await (await studio.getCard(testCardId)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Click copy to folder button', async () => {
            await expect(studio.copyToFolderButton).toBeVisible();
            await studio.copyToFolderButton.click();
            await page.waitForTimeout(1000); // Wait for dialog animation
        });

        await test.step('step-4: Validate copy dialog is visible', async () => {
            // Check if the copy dialog element exists in DOM
            const dialogExists = await page.evaluate(() => {
                // Check in toolbar shadow DOM
                const toolbar = document.querySelector('mas-toolbar');
                if (toolbar?.shadowRoot) {
                    const dialog = toolbar.shadowRoot.querySelector('mas-copy-dialog');
                    if (dialog) return true;
                }
                // Check in document
                const dialog = document.querySelector('mas-copy-dialog');
                return dialog !== null;
            });
            expect(dialogExists).toBeTruthy();
        });

        await test.step('step-5: Validate dialog elements are present', async () => {
            // Check for folder picker
            const folderPickerVisible = await studio.getCopyDialogElement('sp-picker');
            expect(folderPickerVisible).not.toBeNull();

            // Check for fragment name input
            const nameInputVisible = await studio.getCopyDialogElement('sp-textfield');
            expect(nameInputVisible).not.toBeNull();

            // Check for cancel button
            const cancelButtonVisible = await studio.getCopyDialogElement('sp-button:has-text("Cancel")');
            expect(cancelButtonVisible).not.toBeNull();

            // Check for copy button (but don't click it!)
            const copyButtonVisible = await studio.getCopyDialogElement('sp-button:has-text("Copy")');
            expect(copyButtonVisible).not.toBeNull();
        });

        await test.step('step-6: Cancel dialog without copying', async () => {
            // Click cancel button to close dialog
            await studio.clickCopyDialogElement('sp-button:has-text("Cancel")');
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
        });

        await test.step('step-7: Close editor', async () => {
            await editor.closeEditor.click();
            await expect(await editor.panel).not.toBeVisible();
        });
    });

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

        await test.step('step-6: Cancel without copying', async () => {
            // Click cancel in dialog
            await studio.clickCopyDialogElement('sp-button:has-text("Cancel")');
            await page.waitForTimeout(500);

            // Exit selection mode
            const cancelSelectionButton = page.locator('sp-button:has-text("Cancel")');
            if (await cancelSelectionButton.isVisible()) {
                await cancelSelectionButton.click();
            }
        });
    });

    // @studio-folder-copy-ui-dialog-validation - Validate copy dialog input fields
    test('@studio-folder-copy-ui-dialog-validation - Validate dialog input fields', async ({ page, baseURL }) => {
        const testCardId = 'e3901ae8-e87f-4821-8e27-6e31d2e5ffa3'; // CCD Suggested test card
        const testPage = `${baseURL}/studio.html${miloLibs}#page=content&path=nala&query=${testCardId}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(testCardId)).toBeVisible();
            await (await studio.getCard(testCardId)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Open copy dialog', async () => {
            await studio.copyToFolderButton.click();
            await page.waitForTimeout(1000);
        });

        await test.step('step-4: Validate folder picker interactions', async () => {
            // Click on folder picker to open dropdown
            await studio.clickCopyDialogElement('sp-picker');
            await page.waitForTimeout(500);

            // Validate dropdown opened (would show folder options)
            const pickerOpen = await page.evaluate(() => {
                const toolbar = document.querySelector('mas-toolbar');
                let dialog = null;
                if (toolbar?.shadowRoot) {
                    dialog = toolbar.shadowRoot.querySelector('mas-copy-dialog');
                }
                if (!dialog) {
                    dialog = document.querySelector('mas-copy-dialog');
                }
                if (!dialog || !dialog.shadowRoot) return false;
                const picker = dialog.shadowRoot.querySelector('sp-picker');
                return picker && picker.open;
            });
            expect(pickerOpen).toBeTruthy();
        });

        await test.step('step-5: Validate name input field', async () => {
            // Try to set a value in the name field
            await studio.setCopyDialogInputValue('sp-textfield', 'Test Fragment Name');

            // Verify the value was set
            const nameValue = await studio.getCopyDialogInputValue('sp-textfield');
            expect(nameValue).toBe('Test Fragment Name');
        });

        await test.step('step-6: Cancel without copying', async () => {
            await studio.clickCopyDialogElement('sp-button:has-text("Cancel")');
            await page.waitForTimeout(500);
            await editor.closeEditor.click();
            await expect(await editor.panel).not.toBeVisible();
        });
    });
});