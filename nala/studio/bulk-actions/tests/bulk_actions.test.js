import { test, expect, studio, miloLibs, setTestPage } from '../../../libs/mas-test.js';
import BulkActionsSpec from '../specs/bulk_actions.spec.js';

const { features } = BulkActionsSpec;

test.describe('M@S Studio Bulk Actions Test Suite', () => {
    // @studio-bulk-copy-urls - Verify that selecting fragments in table view and clicking
    // "Copy Code" in the selection panel copies code to clipboard and shows a success toast.
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

        await test.step('step-5: Verify Copy Code button is visible in the selection action bar', async () => {
            const copyCodeButton = page.locator('mas-selection-panel >> sp-action-button[label="Copy Code"]');
            await expect(copyCodeButton).toBeVisible({ timeout: 5000 });
        });

        await test.step('step-6: Click Copy Code and verify success toast', async () => {
            await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

            const copyCodeButton = page.locator('mas-selection-panel >> sp-action-button[label="Copy Code"]');
            await copyCodeButton.click();

            await expect(studio.toastPositive).toBeVisible({ timeout: 10000 });
            await expect(studio.toastPositive).toContainText('code snippet');
        });
    });

    // @studio-action-menu-copy-code - Verify that clicking "Copy Code" in the fragment
    // table row action menu ("...") copies code to clipboard and shows a success toast.
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}`;
        setTestPage(testPage);

        await test.step('step-1: Navigate to content page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Switch to table view', async () => {
            await studio.switchToTableView();
            await expect(studio.tableViewRows.first()).toBeVisible({ timeout: 15000 });
        });

        await test.step('step-3: Verify "..." action menu is visible in the Actions column', async () => {
            const firstRow = studio.tableViewRows.first();
            const actionsMenu = studio.tableViewActionsMenu(firstRow);
            await expect(actionsMenu).toBeVisible();
        });

        await test.step('step-4: Open action menu and verify Copy Code option', async () => {
            const firstRow = studio.tableViewRows.first();
            const actionsMenu = studio.tableViewActionsMenu(firstRow);
            await actionsMenu.click();
            const copyCodeOption = studio.tableViewCopyCodeOption(actionsMenu);
            await expect(copyCodeOption).toBeVisible();
        });

        await test.step('step-5: Click Copy Code and verify success toast', async () => {
            await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

            const firstRow = studio.tableViewRows.first();
            const actionsMenu = studio.tableViewActionsMenu(firstRow);
            const copyCodeOption = studio.tableViewCopyCodeOption(actionsMenu);
            await copyCodeOption.click();

            await expect(studio.toastPositive).toBeVisible({ timeout: 10000 });
            await expect(studio.toastPositive).toContainText('Code copied');
        });
    });
});
