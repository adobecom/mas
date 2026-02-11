import { test, expect, studio, miloLibs, setTestPage } from '../../../libs/mas-test.js';
import PlaceholdersPage from '../placeholders.page.js';
import PlaceholdersSpec from '../specs/placeholders.spec.js';

const { features } = PlaceholdersSpec;

test.describe('M@S Studio Placeholders Test Suite', () => {
    let placeholders;

    test.beforeEach(async ({ page }) => {
        placeholders = new PlaceholdersPage(page);
    });

    // Test 0: @studio-placeholders-page-load - Validate placeholders page loads correctly
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}`;
        setTestPage(testPage);

        await test.step('step-1: Navigate to placeholders page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate page elements are visible', async () => {
            await placeholders.waitForTableToLoad();
            await expect(await placeholders.createButton).toBeVisible();
            await expect(await placeholders.searchInput).toBeVisible();
            expect(await placeholders.searchInput.getAttribute('placeholder')).toContain('Search by key or value');
            await expect(await studio.localePicker).toBeVisible();
            await expect(await placeholders.totalPlaceholdersLabel).toBeVisible();
            expect(await placeholders.getTotalPlaceholdersCount()).toBeGreaterThan(0);
        });

        await test.step('step-3: Validate table headers are present', async () => {
            await expect(await placeholders.tableHeaders.key).toBeVisible();
            await expect(await placeholders.tableHeaders.key).toHaveText('Key');
            await expect(await placeholders.tableHeaders.value).toBeVisible();
            await expect(await placeholders.tableHeaders.value).toHaveText('Value');
            await expect(await placeholders.tableHeaders.status).toBeVisible();
            await expect(await placeholders.tableHeaders.status).toHaveText('Status');
            await expect(await placeholders.tableHeaders.locale).toBeVisible();
            await expect(await placeholders.tableHeaders.locale).toHaveText('Locale');
            await expect(await placeholders.tableHeaders.updatedBy).toBeVisible();
            await expect(await placeholders.tableHeaders.updatedBy).toHaveText('Updated by');
            await expect(await placeholders.tableHeaders.updatedAt).toBeVisible();
            await expect(await placeholders.tableHeaders.updatedAt).toHaveText('Date & Time');
            await expect(await placeholders.tableHeaders.action).toBeVisible();
            await expect(await placeholders.tableHeaders.action).toHaveText('Action');

            // Check that key column header is clickable (has pointer cursor)
            const keyCursor = await placeholders.tableHeaders.key.evaluate((el) => window.getComputedStyle(el).cursor);
            expect(keyCursor).toBe('pointer');
        });

        await test.step('step-4: Validate table is rendered with placeholder data', async () => {
            await expect(await placeholders.placeholdersTable).toBeVisible();
            const rowCount = await placeholders.waitForPlaceholderRows();
            expect(await rowCount).toBeGreaterThan(0);

            // Verify first row has actual data
            const firstRowData = await placeholders.verifyPlaceholderData(0);
            expect(await firstRowData.key).toBeTruthy();
            expect(await firstRowData.value).toBeTruthy();
            expect(firstRowData.locale.trim()).toBe('en_US');
        });
    });

    // Test 1: @studio-placeholders-locale-picker - Validate locale picker functionality
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}`;
        setTestPage(testPage);

        await test.step('step-1: Navigate to placeholders page with locale', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate page loaded with en_US locale', async () => {
            await placeholders.waitForTableToLoad();

            const firstRowDataEN = await placeholders.verifyPlaceholderData(0);
            expect(firstRowDataEN.locale.trim()).toBe('en_US');
        });

        await test.step('step-3: Change the placeholder locale', async () => {
            await placeholders.selectLocale(data.localePicker);
        });

        await test.step('step-4: Validate different locale placeholders are loaded', async () => {
            const firstRowDataFR = await placeholders.verifyPlaceholderData(0);
            expect(firstRowDataFR.locale.trim()).toBe(data.locale);
        });
    });

    // Test 2: @studio-placeholders-search-field - Validate search field functionality
    test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
        const { data } = features[2];
        const testPage = `${baseURL}${features[2].path}${miloLibs}${features[2].browserParams}`;
        setTestPage(testPage);

        await test.step('step-1: Navigate to placeholders page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate search functionality', async () => {
            await expect(placeholders.searchInput).toBeVisible();
            await placeholders.waitForTableToLoad();

            await placeholders.searchInput.fill(data.value);
            await page.waitForTimeout(2000);
            await placeholders.waitForTableToLoad();

            const filteredRowCount = await placeholders.getRowCount();
            expect(filteredRowCount).toBe(1);

            const firstRowData = await placeholders.getPlaceholderRowData(0);
            expect(firstRowData.key).toContain(data.key);
            expect(firstRowData.value).toContain(data.value);
        });

        await test.step('step-3: Validate search input can be cleared', async () => {
            await placeholders.searchInput.fill('');
            await page.waitForTimeout(2000);

            // After clearing, should show all placeholders again
            const rowCount = await placeholders.getRowCount();
            expect(rowCount).toBeGreaterThan(1); // Should show more than just the test placeholder
        });
    });
});


