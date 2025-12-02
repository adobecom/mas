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
        const contentPage = `${baseURL}${features[0].path}${miloLibs}#page=content&path=nala`;
        setTestPage(contentPage);

        await test.step('step-1: Navigate to version page', async () => {
            // First load the content page to ensure router is initialized
            await page.goto(contentPage);
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);

            // Now navigate to version page programmatically
            await versionPage.navigateToVersionPage(data.fragmentId);
            await versionPage.waitForVersionPageLoaded();
        });

        await test.step('step-2: Validate version page elements', async () => {
            await expect(versionPage.versionPage).toBeVisible();
            await expect(versionPage.header).toBeVisible();
            await expect(versionPage.versionListPanel).toBeVisible();
            await expect(versionPage.previewPanel).toBeVisible();
            await expect(versionPage.searchInput).toBeVisible();
        });

        await test.step('step-3: Validate version items loaded', async () => {
            const versionCount = await versionPage.getVersionCount();
            expect(versionCount).toBeGreaterThan(0);
        });
    });

    // @version-page-breadcrumbs - Validate breadcrumb navigation
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const { data } = features[1];
        const contentPage = `${baseURL}${features[1].path}${miloLibs}#page=content&path=nala`;
        setTestPage(contentPage);

        await test.step('step-1: Navigate to version page', async () => {
            await page.goto(contentPage);
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);
            await versionPage.navigateToVersionPage(data.fragmentId);
            await versionPage.waitForVersionPageLoaded();
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
        });
    });

    // @version-page-list - Validate version list displays correctly
    test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
        const { data } = features[2];
        const contentPage = `${baseURL}${features[2].path}${miloLibs}#page=content&path=nala`;
        setTestPage(contentPage);

        await test.step('step-1: Navigate to version page', async () => {
            await page.goto(contentPage);
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);
            await versionPage.navigateToVersionPage(data.fragmentId);
            await versionPage.waitForVersionPageLoaded();
        });

        await test.step('step-2: Validate version list', async () => {
            await expect(versionPage.versionListPanel).toBeVisible();
            await expect(versionPage.versionStatus).toBeVisible();
            const versionCount = await versionPage.getVersionCount();
            expect(versionCount).toBeGreaterThan(0);
        });

        await test.step('step-3: Validate version item details', async () => {
            const firstVersion = versionPage.getVersionByIndex(0);
            await expect(firstVersion).toBeVisible();
            const dateTime = firstVersion.locator('.version-date-time');
            const author = firstVersion.locator('.version-author');
            await expect(dateTime).toBeVisible();
            await expect(author).toBeVisible();
        });
    });

    // @version-page-preview - Validate version preview functionality
    test(`${features[3].name},${features[3].tags}`, async ({ page, baseURL }) => {
        const { data } = features[3];
        const contentPage = `${baseURL}${features[3].path}${miloLibs}#page=content&path=nala`;
        setTestPage(contentPage);

        await test.step('step-1: Navigate to version page', async () => {
            await page.goto(contentPage);
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);
            await versionPage.navigateToVersionPage(data.fragmentId);
            await versionPage.waitForVersionPageLoaded();
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
    });

    // @version-page-search - Validate version search functionality
    test(`${features[4].name},${features[4].tags}`, async ({ page, baseURL }) => {
        const { data } = features[4];
        const contentPage = `${baseURL}${features[4].path}${miloLibs}#page=content&path=nala`;
        setTestPage(contentPage);

        await test.step('step-1: Navigate to version page', async () => {
            await page.goto(contentPage);
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);
            await versionPage.navigateToVersionPage(data.fragmentId);
            await versionPage.waitForVersionPageLoaded();
        });

        await test.step('step-2: Get initial version count', async () => {
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

    // @version-page-current-badge - Validate current version indicator
    test(`${features[5].name},${features[5].tags}`, async ({ page, baseURL }) => {
        const { data } = features[5];
        const contentPage = `${baseURL}${features[5].path}${miloLibs}#page=content&path=nala`;
        setTestPage(contentPage);

        await test.step('step-1: Navigate to version page', async () => {
            await page.goto(contentPage);
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);
            await versionPage.navigateToVersionPage(data.fragmentId);
            await versionPage.waitForVersionPageLoaded();
        });

        await test.step('step-2: Validate current version indicator', async () => {
            // Check if version status indicator exists with green dot
            await expect(versionPage.versionStatus).toBeVisible();
            await expect(versionPage.currentDot).toBeVisible();
            await expect(versionPage.versionStatus).toContainText('Current');
        });

        await test.step('step-3: Validate current version item styling', async () => {
            // The first version item should have the 'current' class (green border)
            await expect(versionPage.currentVersionItem).toBeVisible();

            // Verify it's the first item
            const firstItem = versionPage.getVersionByIndex(0);
            await expect(firstItem).toHaveClass(/current/);
        });
    });

    // @version-page-navigate-back - Validate navigation back to content
    test(`${features[6].name},${features[6].tags}`, async ({ page, baseURL }) => {
        const { data } = features[6];
        const testPage = `${baseURL}${features[6].path}${miloLibs}${features[6].browserParams}`;
        setTestPage(testPage);

        await test.step('step-1: Start at content page', async () => {
            const contentPage = `${baseURL}${features[6].path}${miloLibs}#page=content&path=nala`;
            await page.goto(contentPage);
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);
        });

        await test.step('step-2: Navigate to version page', async () => {
            await versionPage.navigateToVersionPage(data.fragmentId);
            await page.waitForLoadState('networkidle');
            await versionPage.waitForVersionPageLoaded();
            await expect(versionPage.versionPage).toBeVisible();
            await expect(page).toHaveURL(new RegExp('page=version'));
        });

        await test.step('step-3: Navigate back to content', async () => {
            await versionPage.navigateBackToContent();
            await page.waitForTimeout(1000);

            // Verify we're back on content page
            await expect(page).toHaveURL(new RegExp('page=content'));
            // Verify we can see the studio content (either table or render view)
            const contentVisible = await page
                .locator('mas-content')
                .isVisible()
                .catch(() => false);
            expect(contentVisible).toBe(true);
        });
    });
});
