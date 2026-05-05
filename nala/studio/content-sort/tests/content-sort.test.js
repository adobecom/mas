import { test, expect, studio, miloLibs, setTestPage } from '../../../libs/mas-test.js';
import ContentSortSpec from '../specs/content-sort.spec.js';

const { features } = ContentSortSpec;

test.describe('M@S Studio Content Table Sort Test Suite', () => {
    // @studio-content-sort-headers — clicking each sortable header updates the URL hash and the indicator icon
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}`;
        setTestPage(testPage);

        await test.step('step-1: Open content page in table view', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await studio.waitForCardsLoaded();
            await studio.switchToTableView();
            await expect(studio.tableView).toBeVisible();
        });

        await test.step('step-2: Default state — no sort param in URL, idle indicator on each sortable header', async () => {
            expect(page.url()).not.toMatch(/sortBy=/);
            await expect(studio.tableViewSortIndicatorIdle('path')).toBeVisible();
            await expect(studio.tableViewSortIndicatorIdle('title')).toBeVisible();
            await expect(studio.tableViewSortIndicatorIdle('modifiedAt')).toBeVisible();
        });

        await test.step('step-3: Click Path header → URL gains sortBy=path, indicator becomes asc', async () => {
            await studio.tableViewSortableHeader('path').click();
            await expect(page).toHaveURL(/sortBy=path/);
            // sortDirection=asc is the default → router strips it from the hash
            expect(page.url()).not.toMatch(/sortDirection=/);
            await expect(studio.tableViewSortIndicatorAsc('path')).toBeVisible();
        });

        await test.step('step-4: Click Title header → URL switches to sortBy=title, Path returns to idle', async () => {
            await studio.tableViewSortableHeader('title').click();
            await expect(page).toHaveURL(/sortBy=title/);
            expect(page.url()).not.toMatch(/sortBy=path/);
            await expect(studio.tableViewSortIndicatorAsc('title')).toBeVisible();
            await expect(studio.tableViewSortIndicatorIdle('path')).toBeVisible();
        });

        await test.step('step-5: Click Last modified header → URL has sortBy=modifiedAt&sortDirection=desc', async () => {
            await studio.tableViewSortableHeader('modifiedAt').click();
            await expect(page).toHaveURL(/sortBy=modifiedAt/);
            await expect(page).toHaveURL(/sortDirection=desc/);
            await expect(studio.tableViewSortIndicatorDesc('modifiedAt')).toBeVisible();
            await expect(studio.tableViewSortIndicatorIdle('title')).toBeVisible();
        });

        await test.step('step-6: Table remains mounted across all sort changes', async () => {
            await expect(studio.tableView).toBeVisible();
        });
    });

    // @studio-content-sort-toggle-direction — clicking the same header twice flips direction; switching column resets it
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}`;
        setTestPage(testPage);

        await test.step('step-1: Open content page in table view', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await studio.waitForCardsLoaded();
            await studio.switchToTableView();
            await expect(studio.tableView).toBeVisible();
        });

        await test.step('step-2: First click on Path → asc', async () => {
            await studio.tableViewSortableHeader('path').click();
            await expect(studio.tableViewSortIndicatorAsc('path')).toBeVisible();
            expect(page.url()).not.toMatch(/sortDirection=/);
        });

        await test.step('step-3: Second click on Path → desc', async () => {
            await studio.tableViewSortableHeader('path').click();
            await expect(page).toHaveURL(/sortDirection=desc/);
            await expect(studio.tableViewSortIndicatorDesc('path')).toBeVisible();
        });

        await test.step('step-4: Switching to Title resets direction to asc (sortDirection stripped from URL)', async () => {
            await studio.tableViewSortableHeader('title').click();
            await expect(page).toHaveURL(/sortBy=title/);
            expect(page.url()).not.toMatch(/sortDirection=desc/);
            await expect(studio.tableViewSortIndicatorAsc('title')).toBeVisible();
        });
    });

    // @studio-content-sort-deeplink — opening a URL with sort params lands in the corresponding sorted state
    test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[2].path}${miloLibs}${features[2].browserParams}`;
        setTestPage(testPage);

        await test.step('step-1: Open content page with sortBy=title&sortDirection=desc in URL', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await studio.waitForCardsLoaded();
            await studio.switchToTableView();
            await expect(studio.tableView).toBeVisible();
        });

        await test.step('step-2: Title header shows desc indicator on first paint', async () => {
            await expect(studio.tableViewSortIndicatorDesc('title')).toBeVisible();
            await expect(studio.tableViewSortIndicatorIdle('path')).toBeVisible();
            await expect(studio.tableViewSortIndicatorIdle('modifiedAt')).toBeVisible();
        });

        await test.step('step-3: Sort URL params survive the page load', async () => {
            expect(page.url()).toMatch(/sortBy=title/);
            expect(page.url()).toMatch(/sortDirection=desc/);
        });
    });
});
