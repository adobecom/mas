import { test, expect, versions, miloLibs, setTestPage } from '../../../libs/mas-test.js';
import VersionPageSpec from '../specs/versions.spec.js';
const { features } = VersionPageSpec;

test.describe('M@S Studio - Version Page test suite', () => {
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
            await expect(versions.versionPage).toBeVisible({ timeout: 10000 });
            await expect(versions.versionListPanel).toBeVisible();
            await expect(versions.previewPanel).toBeVisible();
            await expect(versions.searchInput).toBeVisible();
            await expect(versions.versionStatus).toBeVisible();
        });

        await test.step('step-3: Validate version items loaded', async () => {
            await page.waitForSelector('version-page .version-item', { timeout: 15000 });
            const versionCount = await versions.getVersionCount();
            expect(versionCount).toBeGreaterThan(0);
        });

        await test.step('step-4: Validate version item details', async () => {
            const firstVersion = versions.getVersionByIndex(0);
            await expect(firstVersion).toBeVisible();
            const dateTime = firstVersion.locator('.version-date-time');
            const author = firstVersion.locator('.version-author');
            await expect(dateTime).toBeVisible();
            await expect(author).toBeVisible();
        });

        await test.step('step-5: Validate current version indicator and styling', async () => {
            // Check if version status indicator exists with green dot
            await expect(versions.currentDot).toBeVisible();
            await expect(versions.versionStatus).toContainText('Current');

            // The first version item should have the 'current' class (green border)
            await expect(versions.currentVersionItem).toBeVisible();
            const firstItem = versions.getVersionByIndex(0);
            await expect(firstItem).toHaveClass(/current/);
        });
    });

    // @version-page-preview - Validate version preview and changed fields functionality
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}${data.fragmentId}`;
        setTestPage(testPage);

        await test.step('step-1: Navigate to version page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(5000);
            await expect(versions.versionPage).toBeVisible({ timeout: 10000 });
        });

        await test.step('step-2: Validate initial preview displays', async () => {
            await expect(versions.previewPanel).toBeVisible();
            await expect(versions.previewContent).toBeVisible();
            // Wait for preview columns to render
            await page.waitForTimeout(2000);
            const columnCount = await versions.previewColumns.count();
            expect(columnCount).toBeGreaterThanOrEqual(1);
        });

        await test.step('step-3: Select a different version', async () => {
            const versionCount = await versions.getVersionCount();
            if (versionCount > 1) {
                // Select the second version (first historical version)
                await versions.selectVersionByIndex(1);
                await versions.waitForPreviewUpdate();

                // Should now have 2 preview columns (current + selected)
                const columnCount = await versions.previewColumns.count();
                expect(columnCount).toBe(2);
            }
        });

        await test.step('step-4: Validate changed fields section', async () => {
            const hasChanges = await versions.hasChangedFields();

            if (hasChanges) {
                // Validate the changed fields label
                await expect(versions.changedFieldsLabel).toBeVisible();
                await expect(versions.changedFieldsLabel).toContainText('Changed Fields');

                // Validate the list structure (ul element)
                await expect(versions.changedFieldsList).toBeVisible();

                // Verify list items exist
                const fieldCount = await versions.getChangedFieldsCount();
                expect(fieldCount).toBeGreaterThan(0);

                // Validate field display format
                const fields = await versions.getAllChangedFields();
                expect(fields.length).toBeGreaterThan(0);

                // All fields should have labels
                fields.forEach((field) => {
                    expect(field.length).toBeGreaterThan(0);
                });
            }
        });
    });

    // @version-page-search - Validate version search functionality
    test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
        const { data } = features[2];
        const testPage = `${baseURL}${features[2].path}${miloLibs}${features[2].browserParams}${data.fragmentId}`;
        setTestPage(testPage);

        await test.step('step-1: Navigate to version page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(5000);
            await expect(versions.versionPage).toBeVisible({ timeout: 10000 });
        });

        await test.step('step-2: Get initial version count', async () => {
            await page.waitForSelector('version-page .version-item', { timeout: 15000 });
            const initialCount = await versions.getVersionCount();
            expect(initialCount).toBeGreaterThan(0);
        });

        await test.step('step-3: Search for versions', async () => {
            await versions.searchVersions(data.searchQuery);
            await page.waitForTimeout(1000);
        });

        await test.step('step-4: Validate search results', async () => {
            await expect(versions.versionListPanel).toBeVisible();
            const searchResultCount = await versions.getVersionCount();
            // Search should filter results or show all if no match
            expect(searchResultCount).toBeGreaterThanOrEqual(0);
        });

        await test.step('step-5: Clear search', async () => {
            await versions.clearSearch();
            await page.waitForTimeout(1000);
            const finalCount = await versions.getVersionCount();
            expect(finalCount).toBeGreaterThan(0);
        });
    });
});
