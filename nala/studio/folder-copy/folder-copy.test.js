import { expect, test } from '@playwright/test';
import StudioSpec from '../studio.spec.js';
import StudioPage from '../studio.page.js';

const { features } = StudioSpec;
const miloLibs = process.env.MILO_LIBS || '';
const TEST_CARD_ID = '26f091c2-995d-4a96-a193-d62f6c73af2f';

// Track created fragments for cleanup
let createdFragments = [];
let studio;

// Helper function to select a card
async function selectCard(page, studio, cardId) {
    // Step 1: Click "Select" button in toolbar to enable selection mode
    await expect(studio.selectButton).toBeVisible();
    await studio.selectButton.click();
    await page.waitForTimeout(1000);
    
    // Step 2: Click on the card overlay to select it
    const cardElement = await studio.getCard(cardId);
    const overlay = cardElement.locator('.overlay');
    await expect(overlay).toBeVisible({ timeout: 5000 });
    await overlay.click();
    await page.waitForTimeout(1000);
    
    // Step 3: Wait for action bar
    await expect(studio.actionBar).toBeVisible({ timeout: 5000 });
}

// Helper function to open copy dialog
async function openCopyDialog(studio) {
    const copyButton = studio.actionBar.locator('sp-action-button[label="Copy to folder"]');
    await expect(copyButton).toBeVisible();
    await copyButton.click();
    await expect(studio.copyDialog).toBeVisible({ timeout: 5000 });
}

test.beforeEach(async ({ page, browserName }) => {
    test.slow();
    if (browserName === 'chromium') {
        await page.setExtraHTTPHeaders({
            'sec-ch-ua': '"Chromium";v="123", "Not:A-Brand";v="8"',
        });
    }
    studio = new StudioPage(page);
    createdFragments = []; // Reset for each test
});

test.afterEach(async ({ page, baseURL }) => {
    // Cleanup: Delete all created fragments from their respective folders
    if (createdFragments.length > 0) {
        console.log(`Cleaning up ${createdFragments.length} created fragments`);
        
        for (const fragmentInfo of createdFragments) {
            try {
                let fragmentId = fragmentInfo;
                let folder = 'nala'; // default folder
                
                // Handle if we store folder info with fragment
                if (typeof fragmentInfo === 'object') {
                    fragmentId = fragmentInfo.id;
                    folder = fragmentInfo.folder || 'nala';
                }
                
                // Navigate to the folder where fragment was copied
                const baseUrl = page.url().split('#')[0] || `${baseURL}/studio.html`;
                await page.goto(`${baseUrl}#page=content&path=${folder}`);
                await page.waitForTimeout(3000);
                
                // Search for the fragment
                const searchInput = page.locator('#actions sp-search input');
                if (await searchInput.isVisible()) {
                    await searchInput.fill(fragmentId);
                    await page.keyboard.press('Enter');
                    await page.waitForTimeout(3000);
                }
                
                // Check if fragment is found
                const card = await studio.getCard(fragmentId);
                if (await card.isVisible({ timeout: 5000 }).catch(() => false)) {
                    // Double-click to open editor
                    await card.dblclick();
                    await expect(studio.editorPanel).toBeVisible({ timeout: 5000 });
                    
                    // Delete the fragment
                    await studio.deleteCardButton.click();
                    await expect(studio.confirmationDialog).toBeVisible();
                    await studio.deleteDialog.click();
                    
                    // Wait for deletion
                    await page.waitForTimeout(3000);
                    console.log(`Deleted fragment: ${fragmentId} from ${folder} folder`);
                } else {
                    console.log(`Fragment ${fragmentId} not found in ${folder} folder (may already be deleted)`);
                }
            } catch (error) {
                console.error(`Failed to delete fragment:`, error.message);
            }
        }
        
        // Clear the array for next test
        createdFragments = [];
    }
});

test.describe('M@S Studio Folder Copy feature test suite', () => {
    // @studio-folder-copy-nala - Copy fragment to NALA folder
    test(`${features[11].name},${features[11].tags}`, async ({ page, baseURL }) => {
        const { data } = features[11];
        const testPage = `${baseURL}${features[11].path}${miloLibs}${features[11].browserParams}${TEST_CARD_ID}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Select card and open copy dialog', async () => {
            await expect(await studio.getCard(TEST_CARD_ID)).toBeVisible();
            
            // Select the card using helper function
            await selectCard(page, studio, TEST_CARD_ID);
            
            // Open copy dialog using helper function
            await openCopyDialog(studio);
        });

        await test.step('step-3: Configure copy settings', async () => {
            // Verify dialog elements
            await expect(studio.copyDialogFragmentName).toBeVisible();
            await expect(studio.copyDialogLocalePicker).toBeVisible();
            await expect(studio.copyDialogFolderTree).toBeVisible();
            
            // Select NALA folder
            await studio.copyDialogNalaFolder.click();
            await page.waitForTimeout(500);
            
            // Verify folder is selected
            const nalaFolderClasses = await studio.copyDialogNalaFolder.getAttribute('class');
            expect(nalaFolderClasses).toContain('selected');
            
            // Verify default locale
            await expect(studio.copyDialogLocalePicker).toHaveAttribute('value', data.locale || 'en_US');
        });

        await test.step('step-4: Execute copy operation', async () => {
            // Get the fragment name for tracking
            const fragmentName = await studio.copyDialogFragmentName.inputValue();
            
            // Click copy button
            await page.locator('sp-button:has-text("Copy")').click();
            
            // Wait for success toast
            await expect(studio.toastPositive).toBeVisible({ timeout: 10000 });
            const toastText = await studio.toastPositive.textContent();
            expect(toastText).toContain('Fragment copied to Nala');
            
            // Track for cleanup - navigate to nala folder to find the copied fragment
            await page.waitForTimeout(3000);
            
            // Navigate to nala folder
            await page.goto(`${baseURL}${features[11].path}${miloLibs}#page=content&path=nala`);
            await page.waitForTimeout(3000);
            
            // Search for the copied fragment by name
            if (await studio.searchInput.isVisible()) {
                await studio.searchInput.fill(fragmentName);
                await page.keyboard.press('Enter');
                await page.waitForTimeout(3000);
            }
            
            // Find the copied card (should be different from original)
            const copiedCards = await page.locator('merch-card').all();
            for (const card of copiedCards) {
                const fragmentId = await card.locator('aem-fragment').getAttribute('fragment');
                if (fragmentId && fragmentId !== TEST_CARD_ID) {
                    createdFragments.push({ id: fragmentId, folder: 'nala' });
                    console.log(`Tracked copied fragment for cleanup: ${fragmentId} in nala folder`);
                    break;
                }
            }
        });
    });

    // @studio-folder-copy-sandbox - Copy fragment to Sandbox folder with custom name
    test(`${features[12].name},${features[12].tags}`, async ({ page, baseURL }) => {
        const { data } = features[12];
        const testPage = `${baseURL}${features[12].path}${miloLibs}${features[12].browserParams}${TEST_CARD_ID}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Select card and open copy dialog', async () => {
            await expect(await studio.getCard(TEST_CARD_ID)).toBeVisible();
            
            // Select the card and open copy dialog
            await selectCard(page, studio, TEST_CARD_ID);
            await openCopyDialog(studio);
        });

        await test.step('step-3: Configure copy with custom settings', async () => {
            // Select Sandbox folder
            await studio.copyDialogSandboxFolder.click();
            await page.waitForTimeout(500);
            const sandboxClasses = await studio.copyDialogSandboxFolder.getAttribute('class');
            expect(sandboxClasses).toContain('selected');
            
            // Change fragment name
            await studio.copyDialogFragmentName.fill(data.customName);
            
            // Change locale
            await studio.copyDialogLocalePicker.click();
            await page.locator(`sp-menu-item[value="${data.locale}"]`).click();
        });

        await test.step('step-4: Execute copy and verify', async () => {
            // Click copy button
            await page.locator('sp-button:has-text("Copy")').click();
            
            // Wait for success toast
            await expect(studio.toastPositive).toBeVisible({ timeout: 10000 });
            const toastText = await studio.toastPositive.textContent();
            expect(toastText).toContain('Fragment copied to Sandbox');
            
            // Track for cleanup - navigate to sandbox folder
            await page.waitForTimeout(3000);
            
            // Navigate to sandbox folder
            await page.goto(`${baseURL}${features[12].path}${miloLibs}#page=content&path=sandbox`);
            await page.waitForTimeout(3000);
            
            // Search for the copied fragment
            if (await studio.searchInput.isVisible()) {
                await studio.searchInput.fill(data.customName);
                await page.keyboard.press('Enter');
                await page.waitForTimeout(3000);
            }
            
            // Find the copied card
            const copiedCards = await page.locator('merch-card').all();
            for (const card of copiedCards) {
                const fragmentId = await card.locator('aem-fragment').getAttribute('fragment');
                if (fragmentId && fragmentId !== TEST_CARD_ID) {
                    createdFragments.push({ id: fragmentId, folder: 'sandbox' });
                    console.log(`Tracked copied fragment for cleanup: ${fragmentId} in sandbox folder`);
                    break;
                }
            }
        });
    });

    // @studio-folder-copy-duplicate - Test duplicate name handling
    test(`${features[13].name},${features[13].tags}`, async ({ page, baseURL }) => {
        const { data } = features[13];
        const testPage = `${baseURL}${features[13].path}${miloLibs}${features[13].browserParams}${TEST_CARD_ID}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Create first copy', async () => {
            await expect(await studio.getCard(TEST_CARD_ID)).toBeVisible();
            
            // Select card and open copy dialog
            await selectCard(page, studio, TEST_CARD_ID);
            await openCopyDialog(studio);
            
            // Select NALA folder and copy
            await studio.copyDialogNalaFolder.click();
            const fragmentName = await studio.copyDialogFragmentName.inputValue();
            await page.locator('sp-button:has-text("Copy")').click();
            
            await expect(studio.toastPositive).toBeVisible({ timeout: 10000 });
            await page.waitForTimeout(3000);
            
            // Track first copy
            await page.goto(`${baseURL}${features[13].path}${miloLibs}#page=content&path=nala`);
            await studio.searchInput.fill(fragmentName);
            await page.keyboard.press('Enter');
            await page.waitForTimeout(2000);
            
            const firstCopy = await page.locator('merch-card').first();
            if (await firstCopy.isVisible()) {
                const firstId = await firstCopy.locator('aem-fragment').getAttribute('fragment');
                if (firstId && firstId !== TEST_CARD_ID) {
                    createdFragments.push({ id: firstId, folder: 'nala' });
                }
            }
        });

        await test.step('step-3: Create duplicate copy', async () => {
            // Go back to original card
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(await studio.getCard(TEST_CARD_ID)).toBeVisible();
            
            // Select card and open copy dialog again
            await selectCard(page, studio, TEST_CARD_ID);
            await openCopyDialog(studio);
            
            // Use same settings to force rename
            await studio.copyDialogNalaFolder.click();
            await page.locator('sp-button:has-text("Copy")').click();
            
            // Verify rename message in toast
            await expect(studio.toastPositive).toBeVisible({ timeout: 10000 });
            const toastText = await studio.toastPositive.textContent();
            expect(toastText).toContain('renamed');
            expect(toastText).toMatch(/-1'|_1'/); // Should have suffix
            
            // Track second copy
            await page.waitForTimeout(3000);
            await page.goto(`${baseURL}${features[13].path}${miloLibs}#page=content&path=nala`);
            const secondCopy = await page.locator('merch-card').all();
            for (const card of secondCopy) {
                const id = await card.locator('aem-fragment').getAttribute('fragment');
                if (id && id !== TEST_CARD_ID) {
                    // Check if not already tracked
                    const alreadyTracked = createdFragments.some(f => 
                        (typeof f === 'object' ? f.id : f) === id
                    );
                    if (!alreadyTracked) {
                        createdFragments.push({ id: id, folder: 'nala' });
                    }
                }
            }
        });
    });

    // @studio-folder-copy-cancel - Test cancel operation
    test(`${features[14].name},${features[14].tags}`, async ({ page, baseURL }) => {
        const { data } = features[14];
        const testPage = `${baseURL}${features[14].path}${miloLibs}${features[14].browserParams}${TEST_CARD_ID}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open copy dialog', async () => {
            await expect(await studio.getCard(TEST_CARD_ID)).toBeVisible();
            
            // Select card and open copy dialog
            await selectCard(page, studio, TEST_CARD_ID);
            await openCopyDialog(studio);
        });

        await test.step('step-3: Configure and cancel', async () => {
            // Select folder
            await studio.copyDialogNalaFolder.click();
            await expect(studio.copyDialogNalaFolder).toHaveClass(/selected/);
            
            // Click cancel
            await page.locator('sp-button:has-text("Cancel")').click();
            
            // Verify dialog closed
            await expect(studio.copyDialog).not.toBeVisible({ timeout: 5000 });
            
            // Verify no toast appeared
            await expect(studio.toastPositive).not.toBeVisible({ timeout: 2000 });
        });

        await test.step('step-4: Verify no copy was made', async () => {
            // Search in nala folder to confirm no new fragment
            await page.goto(`${baseURL}${features[14].path}${miloLibs}#page=content&path=nala`);
            await page.waitForTimeout(2000);
            
            // Get initial count
            const initialCards = await page.locator('merch-card').count();
            
            // Search for the original card name
            const originalCard = await studio.getCard(TEST_CARD_ID);
            if (await originalCard.isVisible()) {
                const fragmentEl = await originalCard.locator('aem-fragment');
                await studio.searchInput.fill(TEST_CARD_ID);
                await page.keyboard.press('Enter');
                await page.waitForTimeout(2000);
                
                // Should find no results (original is not in nala)
                const searchResults = await page.locator('merch-card').count();
                expect(searchResults).toBe(0);
            }
        });
    });
});