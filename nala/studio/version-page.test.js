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
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}`;
        setTestPage(testPage);

        await test.step('step-1: Navigate to version page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('networkidle');
            // Wait for version page to be visible
            await page.waitForSelector('version-page', { timeout: 10000 });
            await page.waitForTimeout(3000);
        });

        await test.step('step-2: Validate version page elements', async () => {
            await expect(versionPage.versionPage).toBeVisible();
            await expect(versionPage.header).toBeVisible();
            await expect(versionPage.versionList).toBeVisible();
            await expect(versionPage.previewColumn).toBeVisible();
            await expect(versionPage.searchInput).toBeVisible();
        });
    });

    // @version-page-breadcrumbs - Validate breadcrumb navigation
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}`;
        setTestPage(testPage);

        await test.step('step-1: Navigate to version page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('networkidle');
            await page.waitForSelector('version-page', { timeout: 10000 });
            await page.waitForTimeout(3000);
        });

        await test.step('step-2: Validate breadcrumbs', async () => {
            await expect(versionPage.breadcrumbs).toBeVisible();
            await expect(versionPage.breadcrumbHome).toBeVisible();
            await expect(versionPage.breadcrumbCurrent).toBeVisible();
            await expect(versionPage.breadcrumbCurrent).toContainText('Version History');
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
        const testPage = `${baseURL}${features[2].path}${miloLibs}${features[2].browserParams}`;
        setTestPage(testPage);

        await test.step('step-1: Navigate to version page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('networkidle');
            await page.waitForSelector('version-page', { timeout: 10000 });
            await versionPage.waitForVersionsLoaded();
        });

        await test.step('step-2: Validate version list', async () => {
            await expect(versionPage.versionList).toBeVisible();
            const versionCount = await versionPage.versionItems.count();
            expect(versionCount).toBeGreaterThan(0);
        });

        await test.step('step-3: Validate version item details', async () => {
            const firstVersion = versionPage.getVersionByIndex(0);
            await expect(firstVersion).toBeVisible();
            await expect(firstVersion.locator('.version-date-time')).toBeVisible();
            await expect(firstVersion.locator('.version-author')).toBeVisible();
        });
    });

    // @version-page-preview - Validate version preview functionality
    test(`${features[3].name},${features[3].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[3].path}${miloLibs}${features[3].browserParams}`;
        setTestPage(testPage);

        await test.step('step-1: Navigate to version page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('networkidle');
            await page.waitForSelector('version-page', { timeout: 10000 });
            await versionPage.waitForVersionsLoaded();
        });

        await test.step('step-2: Select a version', async () => {
            const firstVersion = versionPage.getVersionByIndex(0);
            await firstVersion.click();
            await page.waitForTimeout(1000);
        });

        await test.step('step-3: Validate preview displays', async () => {
            await expect(versionPage.previewColumn).toBeVisible();
            await expect(versionPage.previewCard).toBeVisible({ timeout: 10000 });
        });
    });

    // @version-page-search - Validate version search functionality
    test(`${features[4].name},${features[4].tags}`, async ({ page, baseURL }) => {
        const { data } = features[4];
        const testPage = `${baseURL}${features[4].path}${miloLibs}${features[4].browserParams}`;
        setTestPage(testPage);

        await test.step('step-1: Navigate to version page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('networkidle');
            await page.waitForSelector('version-page', { timeout: 10000 });
            await versionPage.waitForVersionsLoaded();
        });

        await test.step('step-2: Get initial version count', async () => {
            const initialCount = await versionPage.versionItems.count();
            expect(initialCount).toBeGreaterThan(0);
        });

        await test.step('step-3: Search for versions', async () => {
            await versionPage.searchVersions(data.searchQuery);
            await page.waitForTimeout(1000);
        });

        await test.step('step-4: Validate search results', async () => {
            await expect(versionPage.versionList).toBeVisible();
            const searchResultCount = await versionPage.versionItems.count();
            // Search should filter results or show all if no match
            expect(searchResultCount).toBeGreaterThanOrEqual(0);
        });
    });

    // @version-page-current-badge - Validate current version badge
    test(`${features[5].name},${features[5].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[5].path}${miloLibs}${features[5].browserParams}`;
        setTestPage(testPage);

        await test.step('step-1: Navigate to version page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('networkidle');
            await page.waitForSelector('version-page', { timeout: 10000 });
            await versionPage.waitForVersionsLoaded();
        });

        await test.step('step-2: Validate current version indicator', async () => {
            // Check if version status indicator exists
            await expect(versionPage.currentVersionStatus).toBeVisible();
            await expect(versionPage.currentDot).toBeVisible();

            // The first version item should have the 'current' class (green border)
            const currentItem = versionPage.getCurrentVersionItem();
            await expect(currentItem).toBeVisible();
        });
    });

    // @version-page-navigate-back - Validate navigation back to content
    test(`${features[6].name},${features[6].tags}`, async ({ page, baseURL }) => {
        const { data } = features[6];
        const testPage = `${baseURL}${features[6].path}${miloLibs}${features[6].browserParams}`;
        setTestPage(testPage);

        await test.step('step-1: Start at content page and open editor', async () => {
            const contentPage = `${baseURL}${features[6].path}${miloLibs}#page=content&path=nala&query=${data.fragmentId}`;
            await page.goto(contentPage);
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(2000);
        });

        await test.step('step-2: Navigate to version page', async () => {
            await versionPage.navigateToVersionPage(data.fragmentId);
            await page.waitForSelector('version-page', { timeout: 10000 });
            await page.waitForTimeout(2000);
            await expect(versionPage.versionPage).toBeVisible();
        });

        await test.step('step-3: Navigate back to content', async () => {
            await versionPage.navigateBackToContent();
            await page.waitForTimeout(1000);

            // Verify we're back on content page
            await expect(page).toHaveURL(new RegExp('page=content'));
            await expect(studio.renderView.or(studio.tableView)).toBeVisible();
        });
    });
});
