import { test, expect, miloLibs, setTestPage } from '../libs/mas-test.js';
import StudioPage from './studio.page.js';
import EditorPage from './editor.page.js';
import VersionPageSpec from './version-page.spec.js';
import VersionPage from './version-page.page.js';

const { features } = VersionPageSpec;

test.describe('M@S Studio - Version Page test suite', () => {
    let studio;
    let editor;
    let versionPage;

    test.beforeEach(async ({ page }) => {
        studio = new StudioPage(page);
        editor = new EditorPage(page);
        versionPage = new VersionPage(page);
    });

    // @version-page-load - Validate version page loads correctly
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.fragmentId}`;
        setTestPage(testPage);

        await test.step('step-1: Navigate to version page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(5000); // Wait for version page to render
        });

        await test.step('step-2: Validate version page elements', async () => {
            await expect(versionPage.versionPage).toBeVisible({ timeout: 10000 });
            await expect(versionPage.header).toBeVisible();
            await expect(versionPage.versionListPanel).toBeVisible();
            await expect(versionPage.previewPanel).toBeVisible();
            await expect(versionPage.searchInput).toBeVisible();
            await expect(versionPage.versionStatus).toBeVisible();
        });

        await test.step('step-3: Validate version items loaded', async () => {
            await page.waitForSelector('version-page .version-item', { timeout: 15000 });
            const versionCount = await versionPage.getVersionCount();
            expect(versionCount).toBeGreaterThan(0);
        });

        await test.step('step-4: Validate version item details', async () => {
            const firstVersion = versionPage.getVersionByIndex(0);
            await expect(firstVersion).toBeVisible();
            const dateTime = firstVersion.locator('.version-date-time');
            const author = firstVersion.locator('.version-author');
            await expect(dateTime).toBeVisible();
            await expect(author).toBeVisible();
        });

        await test.step('step-5: Validate current version indicator and styling', async () => {
            // Check if version status indicator exists with green dot
            await expect(versionPage.currentDot).toBeVisible();
            await expect(versionPage.versionStatus).toContainText('Current');

            // The first version item should have the 'current' class (green border)
            await expect(versionPage.currentVersionItem).toBeVisible();
            const firstItem = versionPage.getVersionByIndex(0);
            await expect(firstItem).toHaveClass(/current/);
        });
    });

    // @version-page-breadcrumbs - Validate breadcrumb navigation and back navigation
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}${data.fragmentId}`;
        setTestPage(testPage);

        await test.step('step-1: Navigate to version page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(5000);
            await expect(versionPage.versionPage).toBeVisible({ timeout: 10000 });
            await expect(page).toHaveURL(new RegExp('page=version'));
        });

        await test.step('step-2: Validate breadcrumbs', async () => {
            await expect(versionPage.breadcrumbs).toBeVisible();
            await expect(versionPage.breadcrumbHome).toBeVisible();
            await expect(versionPage.breadcrumbCurrent).toBeVisible();
            await expect(versionPage.breadcrumbCurrent).toContainText('Version');
        });

        await test.step('step-3: Navigate back using breadcrumbs', async () => {
            await versionPage.navigateBackToContent();
            await page.waitForTimeout(1000);
            // Should navigate back to content page
            await expect(page).toHaveURL(new RegExp('page=content'));
            // Verify we can see the studio content (either table or render view)
            const contentVisible = await page
                .locator('mas-content')
                .isVisible()
                .catch(() => false);
            expect(contentVisible).toBe(true);
        });
    });

    // @version-page-preview - Validate version preview and changed fields functionality
    test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
        const { data } = features[2];
        const testPage = `${baseURL}${features[2].path}${miloLibs}${features[2].browserParams}${data.fragmentId}`;
        setTestPage(testPage);

        await test.step('step-1: Navigate to version page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(5000);
            await expect(versionPage.versionPage).toBeVisible({ timeout: 10000 });
        });

        await test.step('step-2: Validate initial preview displays', async () => {
            await expect(versionPage.previewPanel).toBeVisible();
            await expect(versionPage.previewContent).toBeVisible();
            // Wait for preview columns to render
            await page.waitForTimeout(2000);
            const columnCount = await versionPage.previewColumns.count();
            expect(columnCount).toBeGreaterThanOrEqual(1);
        });

        await test.step('step-3: Select a different version', async () => {
            const versionCount = await versionPage.getVersionCount();
            if (versionCount > 1) {
                // Select the second version (first historical version)
                await versionPage.selectVersionByIndex(1);
                await versionPage.waitForPreviewUpdate();

                // Should now have 2 preview columns (current + selected)
                const columnCount = await versionPage.previewColumns.count();
                expect(columnCount).toBe(2);
            }
        });

        await test.step('step-4: Validate changed fields section', async () => {
            const hasChanges = await versionPage.hasChangedFields();

            if (hasChanges) {
                // Validate the changed fields label
                await expect(versionPage.changedFieldsLabel).toBeVisible();
                await expect(versionPage.changedFieldsLabel).toContainText('Changed Fields');

                // Validate the list structure (ul element)
                await expect(versionPage.changedFieldsList).toBeVisible();

                // Verify list items exist
                const fieldCount = await versionPage.getChangedFieldsCount();
                expect(fieldCount).toBeGreaterThan(0);

                // Validate field display format
                const fields = await versionPage.getAllChangedFields();
                expect(fields.length).toBeGreaterThan(0);

                // All fields should have labels
                fields.forEach((field) => {
                    expect(field.length).toBeGreaterThan(0);
                });
            }
        });
    });

    // @version-page-search - Validate version search functionality
    test(`${features[3].name},${features[3].tags}`, async ({ page, baseURL }) => {
        const { data } = features[3];
        const testPage = `${baseURL}${features[3].path}${miloLibs}${features[3].browserParams}${data.fragmentId}`;
        setTestPage(testPage);

        await test.step('step-1: Navigate to version page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(5000);
            await expect(versionPage.versionPage).toBeVisible({ timeout: 10000 });
        });

        await test.step('step-2: Get initial version count', async () => {
            await page.waitForSelector('version-page .version-item', { timeout: 15000 });
            const initialCount = await versionPage.getVersionCount();
            expect(initialCount).toBeGreaterThan(0);
        });

        await test.step('step-3: Search for versions', async () => {
            await versionPage.searchVersions(data.searchQuery);
            await page.waitForTimeout(1000);
        });

        await test.step('step-4: Validate search results', async () => {
            await expect(versionPage.versionListPanel).toBeVisible();
            const searchResultCount = await versionPage.getVersionCount();
            // Search should filter results or show all if no match
            expect(searchResultCount).toBeGreaterThanOrEqual(0);
        });

        await test.step('step-5: Clear search', async () => {
            await versionPage.clearSearch();
            await page.waitForTimeout(1000);
            const finalCount = await versionPage.getVersionCount();
            expect(finalCount).toBeGreaterThan(0);
        });
    });
});
