import { test, expect, studio, miloLibs, setTestPage } from '../../../libs/mas-test.js';
import BulkActionsSpec from '../specs/bulk_actions.spec.js';

const { features } = BulkActionsSpec;

test.describe('M@S Studio Bulk Actions Test Suite', () => {
    // @studio-bulk-copy-urls - Verify that selecting fragments in table view and clicking
    // "Copy URLs" copies studio fragment URLs to the clipboard and shows a success toast.
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}`;
        setTestPage(testPage);

        await test.step('step-1: Navigate to content page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Switch to table view', async () => {
            await studio.switchToTableView();
            await expect(studio.tableViewRows.first()).toBeVisible({ timeout: 15000 });
        });

        await test.step('step-3: Enter selection mode', async () => {
            const selectButton = page.locator('mas-toolbar >> sp-button').filter({ hasText: 'Select' });
            await expect(selectButton).toBeVisible({ timeout: 10000 });
            await selectButton.click();
        });

        await test.step('step-4: Select the first fragment row', async () => {
            await studio.tableViewRows.first().click();
        });

        await test.step('step-5: Verify Copy URLs button is visible in the selection action bar', async () => {
            const copyUrlsButton = page.locator('mas-selection-panel >> sp-action-button[label="Copy Code"]');
            await expect(copyUrlsButton).toBeVisible({ timeout: 5000 });
        });

        await test.step('step-6: Click Copy URLs and verify success toast', async () => {
            await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

            const copyUrlsButton = page.locator('mas-selection-panel >> sp-action-button[label="Copy Code"]');
            await copyUrlsButton.click();

            await expect(studio.toastPositive).toBeVisible({ timeout: 10000 });
            await expect(studio.toastPositive).toContainText('fragment URL');
        });
    });
});
