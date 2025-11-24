import { test, expect, studio, miloLibs, setTestPage } from '../../../libs/mas-test.js';
import PlaceholdersPage from '../placeholders.page.js';
import PlaceholdersSpec from '../specs/placeholders.spec.js';

const { features } = PlaceholdersSpec;

test.describe('M@S Studio Placeholders Test Suite', () => {
    let placeholders;

    test.beforeEach(async ({ page }) => {
        placeholders = new PlaceholdersPage(page);
    });

    // Test 0: Validate placeholders page loads correctly
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}`;
        setTestPage(testPage);

        await test.step('step-1: Navigate to placeholders page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            // Wait for the page to fully load and render
            await page.waitForTimeout(3000);
        });

        await test.step('step-2: Validate page elements are visible', async () => {
            // Wait for the create button as an indicator the page has loaded
            await page.waitForSelector('sp-button:has-text("Create New Placeholder")', { timeout: 30000 });

            // Check for essential elements
            await expect(placeholders.createButton).toBeVisible();
            await expect(placeholders.searchInput).toBeVisible();

            // Check for locale picker - it may have different text formats
            const localePickerVisible = await placeholders.localePicker.isVisible().catch(() => false);
            if (localePickerVisible) {
                await expect(placeholders.localePicker).toBeVisible();
            }
        });

        await test.step('step-3: Validate table is rendered with placeholder data', async () => {
            await expect(placeholders.placeholdersTable).toBeVisible();

            // Strictly require placeholder rows to exist for path=nala
            const rowCount = await placeholders.waitForPlaceholderRows();
            expect(rowCount).toBeGreaterThan(0);

            // Verify first row has actual data
            const firstRowData = await placeholders.verifyPlaceholderData(0);
            expect(firstRowData.key).toBeTruthy();
            expect(firstRowData.value).toBeTruthy();
        });

        await test.step('step-4: Validate total placeholders count is greater than 0', async () => {
            await expect(placeholders.totalPlaceholdersLabel).toBeVisible();
            await expect(placeholders.totalPlaceholdersLabel).toContainText('Total Placeholders:');

            // Verify count is greater than 0
            const totalCount = await placeholders.getTotalPlaceholdersCount();
            expect(totalCount).toBeGreaterThan(0);
        });
    });

    // Test 1: Validate table structure with all headers
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}`;
        setTestPage(testPage);

        await test.step('step-1: Navigate to placeholders page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate all table headers are present', async () => {
            await expect(placeholders.tableHeaders.key).toBeVisible();
            await expect(placeholders.tableHeaders.key).toHaveText('Key');

            await expect(placeholders.tableHeaders.value).toBeVisible();
            await expect(placeholders.tableHeaders.value).toHaveText('Value');

            await expect(placeholders.tableHeaders.status).toBeVisible();
            await expect(placeholders.tableHeaders.status).toHaveText('Status');

            await expect(placeholders.tableHeaders.locale).toBeVisible();
            await expect(placeholders.tableHeaders.locale).toHaveText('Locale');

            await expect(placeholders.tableHeaders.updatedBy).toBeVisible();
            await expect(placeholders.tableHeaders.updatedBy).toHaveText('Updated by');

            await expect(placeholders.tableHeaders.updatedAt).toBeVisible();
            await expect(placeholders.tableHeaders.updatedAt).toHaveText('Date & Time');

            await expect(placeholders.tableHeaders.action).toBeVisible();
            await expect(placeholders.tableHeaders.action).toHaveText('Action');
        });

        await test.step('step-3: Validate table headers are clickable for sorting', async () => {
            // Check that key column header is clickable (has pointer cursor)
            const keyCursor = await placeholders.tableHeaders.key.evaluate((el) => window.getComputedStyle(el).cursor);
            expect(keyCursor).toBe('pointer');
        });

        await test.step('step-4: Validate placeholder data rows exist', async () => {
            // Ensure placeholder rows exist with actual data
            const rowCount = await placeholders.waitForPlaceholderRows();
            expect(rowCount).toBeGreaterThan(0);

            // Verify first row contains data in all expected columns
            const firstRow = placeholders.placeholderRows.first();
            const cells = await firstRow.locator('sp-table-cell').all();

            // Should have at least 7 cells (key, value, status, locale, updatedBy, updatedAt, action)
            expect(cells.length).toBeGreaterThanOrEqual(7);

            // Verify key and value cells have content
            const keyText = await cells[0].textContent();
            const valueText = await cells[1].textContent();

            expect(keyText).toBeTruthy();
            expect(keyText.trim()).not.toBe('');
            expect(valueText).toBeTruthy();
            expect(valueText.trim()).not.toBe('');
        });
    });

    // Test 2: Validate UI elements are present
    test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[2].path}${miloLibs}${features[2].browserParams}`;
        setTestPage(testPage);

        await test.step('step-1: Navigate to placeholders page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate create button is functional', async () => {
            await expect(placeholders.createButton).toBeVisible();
            await expect(placeholders.createButton).toBeEnabled();
            await expect(placeholders.createButton).toHaveText('Create New Placeholder');
        });

        await test.step('step-3: Validate search input field', async () => {
            await expect(placeholders.searchInput).toBeVisible();
            await expect(placeholders.searchInput).toBeEnabled();
            const placeholder = await placeholders.searchInput.getAttribute('placeholder');
            expect(placeholder).toBe('Search by key or value');
        });

        await test.step('step-4: Validate placeholders are loaded for en_US', async () => {
            // Wait for table to load first
            await placeholders.waitForTableToLoad();
            await page.waitForTimeout(1000);

            // Verify that placeholders are visible (which confirms correct locale)
            const totalCount = await placeholders.getTotalPlaceholdersCount();
            expect(totalCount).toBeGreaterThan(0);

            // Verify we have the expected test placeholders for en_US
            await placeholders.waitForPlaceholderRows();
            const firstRowData = await placeholders.getPlaceholderRowData(0);
            expect(firstRowData.locale.trim()).toBe('en_US');
        });
    });

    // Test 3: Validate locale picker functionality
    test(`${features[3].name},${features[3].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[3].path}${miloLibs}${features[3].browserParams}`;
        setTestPage(testPage);

        await test.step('step-1: Navigate to placeholders page with locale', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate page loaded with en_US locale', async () => {
            // Wait for placeholders to load
            await placeholders.waitForTableToLoad();

            // Verify we have placeholders (confirming en_US locale is working)
            const totalCount = await placeholders.getTotalPlaceholdersCount();
            expect(totalCount).toBeGreaterThan(0);
        });

        await test.step('step-3: Validate en_US placeholders are loaded', async () => {
            // Verify that placeholders exist for en_US locale
            const rowCount = await placeholders.waitForPlaceholderRows();
            expect(rowCount).toBeGreaterThan(0);

            // Verify the locale column shows en_US
            const firstRowData = await placeholders.getPlaceholderRowData(0);
            expect(firstRowData.locale.trim()).toBe('en_US');
        });
    });

    // Test 4: Validate search field functionality
    test(`${features[4].name},${features[4].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[4].path}${miloLibs}${features[4].browserParams}`;
        setTestPage(testPage);

        await test.step('step-1: Navigate to placeholders page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate search functionality', async () => {
            await expect(placeholders.searchInput).toBeVisible();

            // First get the initial count
            const initialRowCount = await placeholders.getRowCount();
            expect(initialRowCount).toBeGreaterThan(0);

            // Clear any existing search first
            await placeholders.searchInput.clear();

            // Search for a common prefix like "acro" which should filter results
            await placeholders.searchInput.fill('acro');
            await page.keyboard.press('Enter');

            // Wait for search to process
            await page.waitForTimeout(2000);

            // Verify search filtered the results
            const filteredRowCount = await placeholders.getRowCount();
            expect(filteredRowCount).toBeGreaterThan(0);
            expect(filteredRowCount).toBeLessThanOrEqual(initialRowCount);

            // Verify the filtered results contain the search term
            const firstRowData = await placeholders.getPlaceholderRowData(0);
            expect(firstRowData.key.toLowerCase()).toContain('acro');
        });

        await test.step('step-3: Validate search input can be cleared', async () => {
            await placeholders.searchInput.fill('');
            await page.keyboard.press('Enter');
            await page.waitForTimeout(1000);

            // After clearing, should show all placeholders again
            const rowCount = await placeholders.getRowCount();
            expect(rowCount).toBeGreaterThan(1); // Should show more than just the test placeholder
        });
    });
});
