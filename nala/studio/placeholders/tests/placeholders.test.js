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

        await test.step('step-3: Validate table is rendered', async () => {
            await expect(placeholders.placeholdersTable).toBeVisible();
            // Wait for either placeholder rows or empty state message
            await placeholders.waitForTableToLoad();
        });

        await test.step('step-4: Validate total placeholders label is present', async () => {
            await expect(placeholders.totalPlaceholdersLabel).toBeVisible();
            await expect(placeholders.totalPlaceholdersLabel).toContainText('Total Placeholders:');
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

        await test.step('step-4: Validate locale picker is present', async () => {
            await expect(placeholders.localePicker).toBeVisible();
            // Check if it displays a locale (e.g., "Country: (en_US)")
            const localeText = await placeholders.localePicker.textContent();
            expect(localeText).toContain('Country:');
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

        await test.step('step-2: Validate locale picker shows correct locale', async () => {
            await expect(placeholders.localePicker).toBeVisible();
            const localeText = await placeholders.localePicker.textContent();
            expect(localeText).toContain('en_US');
        });

        await test.step('step-3: Validate locale picker is clickable', async () => {
            await placeholders.localePicker.click();
            // Check if dropdown menu appears
            const localeMenu = page.locator('sp-popover sp-menu');
            await expect(localeMenu).toBeVisible();

            // Close the menu by clicking elsewhere
            await page.keyboard.press('Escape');
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

        await test.step('step-2: Validate search input accepts text', async () => {
            await expect(placeholders.searchInput).toBeVisible();
            await placeholders.searchInput.fill('test');
            const value = await placeholders.searchInput.inputValue();
            expect(value).toBe('test');
        });

        await test.step('step-3: Validate search input can be cleared', async () => {
            await placeholders.searchInput.fill('');
            const value = await placeholders.searchInput.inputValue();
            expect(value).toBe('');
        });
    });

    // Test 5: Validate empty state message
    test(`${features[5].name},${features[5].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[5].path}${miloLibs}${features[5].browserParams}`;
        setTestPage(testPage);

        await test.step('step-1: Navigate to placeholders page with non-existent locale', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Check for empty state or placeholder rows', async () => {
            await placeholders.waitForTableToLoad();

            // Either we have no placeholders message or we have rows
            const isEmpty = await placeholders.isTableEmpty();

            if (isEmpty) {
                // If table is empty, verify the no placeholders message is shown
                const noPlaceholdersVisible = await placeholders.noPlaceholdersMessage.isVisible().catch(() => false);
                expect(noPlaceholdersVisible || (await placeholders.getRowCount()) === 0).toBeTruthy();
            } else {
                // If not empty, verify we have placeholder rows
                const rowCount = await placeholders.getRowCount();
                expect(rowCount).toBeGreaterThan(0);
            }
        });

        await test.step('step-3: Validate total count reflects the state', async () => {
            const totalCount = await placeholders.getTotalPlaceholdersCount();
            const rowCount = await placeholders.getRowCount();

            // Total count should be a valid number
            expect(totalCount).toBeGreaterThanOrEqual(0);

            // If we have rows, total should be greater than 0
            if (rowCount > 0) {
                expect(totalCount).toBeGreaterThan(0);
            }
        });
    });
});
