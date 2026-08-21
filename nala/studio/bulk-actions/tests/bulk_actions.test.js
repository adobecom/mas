import { test, expect, studio, miloLibs, setTestPage } from '../../../libs/mas-test.js';
import BulkActionsPage from '../page/bulk_actions.page.js';
import BulkActionsSpec from '../specs/bulk_actions.spec.js';

const { features } = BulkActionsSpec;

test.describe('M@S Studio Bulk Actions Test Suite', () => {
    // @studio-bulk-copy-urls - Verify that selecting fragments in table view and clicking
    // "Copy Content Link(s)" in the selection panel copies code to clipboard and shows a success toast.
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

        await test.step('step-5: Verify Copy Content Link(s) button is visible in the selection action bar', async () => {
            const copyLinkButton = page.locator('mas-selection-panel >> sp-action-button[label="Copy Content Link(s)"]');
            await expect(copyLinkButton).toBeVisible({ timeout: 5000 });
        });

        await test.step('step-6: Click Copy Content Link(s) and verify success toast', async () => {
            await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

            const copyLinkButton = page.locator('mas-selection-panel >> sp-action-button[label="Copy Content Link(s)"]');
            await copyLinkButton.click();

            await expect(studio.toastPositive).toBeVisible({ timeout: 10000 });
            await expect(studio.toastPositive).toContainText('code snippet');
        });
    });

    // @studio-action-menu-copy-code - Verify that clicking "Copy Link" in the fragment
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

        await test.step('step-4: Open action menu and verify Copy Link option', async () => {
            const firstRow = studio.tableViewRows.first();
            const actionsMenu = studio.tableViewActionsMenu(firstRow);
            await actionsMenu.click();
            const copyLinkOption = studio.tableViewCopyLinkOption(actionsMenu);
            await expect(copyLinkOption).toBeVisible();
        });

        await test.step('step-5: Click Copy Link and verify success toast', async () => {
            await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

            const firstRow = studio.tableViewRows.first();
            const actionsMenu = studio.tableViewActionsMenu(firstRow);
            const copyLinkOption = studio.tableViewCopyLinkOption(actionsMenu);
            await copyLinkOption.click();

            await expect(studio.toastPositive).toBeVisible({ timeout: 10000 });
            await expect(studio.toastPositive).toContainText('Link copied');
        });
    });

    const runSelectAllTest = (featureIndex, label) => {
        test(`${features[featureIndex].name},${features[featureIndex].tags}`, async ({ page, baseURL }) => {
            const { data } = features[featureIndex];
            const bulkActions = new BulkActionsPage(page);

            await test.step(`step-1: Navigate to Bulk Publish list (${label})`, async () => {
                await bulkActions.navigateToBulkPublishList(baseURL, miloLibs);
            });

            await test.step('step-2: Create a new bulk publish project', async () => {
                await bulkActions.createNewProject();
            });

            await test.step(`step-3: Open Add by search dialog and switch to the ${data.tab} tab`, async () => {
                await bulkActions.openBulkPublishAddBySearch();
                await bulkActions.switchToTab(data.tab);
            });

            await test.step(`step-4: Search for ${data.searchQuery} and wait for results`, async () => {
                await bulkActions.searchFor(data.searchQuery);
                await expect(bulkActions.tableRowCheckboxes.first()).toBeVisible();
            });

            await test.step('step-5: Click the header Select All checkbox', async () => {
                await bulkActions.clickSelectAll();
            });

            await test.step('step-6: Verify every visible row checkbox is checked', async () => {
                const count = await bulkActions.tableRowCheckboxes.count();
                expect(count).toBeGreaterThan(0);
                for (let i = 0; i < count; i += 1) {
                    await expect(bulkActions.tableRowCheckboxes.nth(i)).toHaveJSProperty('checked', true);
                }
            });

            await test.step('step-7: Verify the Add selected items button is enabled', async () => {
                await expect(bulkActions.addSelectedButton).toBeEnabled();
            });
        });
    };

    runSelectAllTest(2, 'Fragments');
    runSelectAllTest(3, 'Collections');
    runSelectAllTest(4, 'Placeholders');
});
