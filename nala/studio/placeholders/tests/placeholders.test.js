import { test, expect, studio, placeholders, miloLibs, setTestPage } from '../../../libs/mas-test.js';
import PlaceholdersSpec from '../specs/placeholders.spec.js';

const { features } = PlaceholdersSpec;

function getPlaceholderLinkPattern(baseURL) {
    const canonicalBaseURL = new URL(baseURL).origin.toLowerCase();
    const escapedBaseURL = canonicalBaseURL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // URL hosts are canonicalized to lowercase; the final segment is a lowercase AEM UUID not tied to a fixture ID.
    return new RegExp(
        `^${escapedBaseURL}/studio\\.html#content-type=placeholder&page=placeholders&path=nala&locale=en_US&search=[0-9a-f-]{36}$`,
    );
}

function getSearchParam(studioLink) {
    return new URLSearchParams(new URL(studioLink).hash.slice(1)).get('search');
}

test.describe('M@S Studio Placeholders Test Suite', () => {
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

    // Test 3: @studio-placeholders-key-normalization - key strips underscores to match the dictionary token.
    test(`${features[3].name},${features[3].tags}`, async ({ page, baseURL }) => {
        const { data } = features[3];
        const testPage = `${baseURL}${features[3].path}${miloLibs}${features[3].browserParams}`;
        setTestPage(testPage);

        await test.step('step-1: Navigate to placeholders page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await placeholders.waitForTableToLoad();
        });

        await test.step('step-2: Open the create placeholder modal', async () => {
            await placeholders.clickCreateButton();
            await expect(placeholders.creationModalKeyInput).toBeVisible();
        });

        await test.step('step-3: Typed key is normalized (underscores stripped)', async () => {
            await placeholders.typePlaceholderKey(data.typedKey);
            expect(await placeholders.getPlaceholderKeyValue()).toBe(data.normalizedKey);
        });
    });

    // Test 4: @studio-placeholders-copy-link-row-menu - Copy and reopen a placeholder Studio link.
    test(`${features[4].name},${features[4].tags}`, async ({ page, baseURL }) => {
        const { data } = features[4];
        const testPage = `${baseURL}${features[4].path}${miloLibs}${features[4].browserParams}`;
        const linkPattern = getPlaceholderLinkPattern(baseURL);
        let placeholderLink;
        setTestPage(testPage);

        await test.step('step-1: Navigate to placeholders and search for the known key', async () => {
            await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await placeholders.waitForTableToLoad();
            await placeholders.searchPlaceholder(data.key);
        });

        await test.step('step-2: Validate the row menu and copy the Studio link', async () => {
            await placeholders.getRowMenuButton(data.key).click();
            await expect(placeholders.getRowMenuItems(data.key)).toHaveText(['Publish', 'Copy Link', 'Delete']);
            await placeholders.getRowMenuItems(data.key).filter({ hasText: 'Copy Link' }).click();
            await expect(placeholders.toastPositive).toHaveText('Copied 1 placeholder link(s)', { timeout: 10000 });

            placeholderLink = await page.evaluate(() => navigator.clipboard.readText());
            expect(placeholderLink).toMatch(linkPattern);
        });

        await test.step('step-3: Open the copied link and validate its UUID search result', async () => {
            const uuid = getSearchParam(placeholderLink);
            await page.goto(placeholderLink);
            await page.waitForLoadState('domcontentloaded');
            await placeholders.getPlaceholderByKey(data.key).waitFor({ state: 'visible', timeout: 10000 });

            await expect(placeholders.placeholderRows).toHaveCount(1);
            await expect(placeholders.getPlaceholderKeyCell(data.key)).toHaveText(data.key);
            await expect(placeholders.searchInput).toHaveValue(uuid);
        });
    });

    // Test 5: @studio-placeholders-copy-link-bulk - Copy two placeholder Studio links from selection.
    test(`${features[5].name},${features[5].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[5].path}${miloLibs}${features[5].browserParams}`;
        const linkPattern = getPlaceholderLinkPattern(baseURL);
        let selectedKeys;
        setTestPage(testPage);

        await test.step('step-1: Navigate to placeholders and select two rows by their keys', async () => {
            await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await placeholders.waitForPlaceholderRows();

            selectedKeys = await Promise.all(
                [0, 1].map(async (index) => (await placeholders.getPlaceholderRowData(index)).key.trim()),
            );
            await placeholders.selectPlaceholder(selectedKeys[0]);
            await placeholders.selectPlaceholder(selectedKeys[1]);
            await expect(placeholders.selectionPanel).toHaveAttribute('open', '');
            await expect(placeholders.selectionActionBar).toBeVisible();
            await expect(placeholders.selectionActionBar).toContainText('2 selected');
        });

        await test.step('step-2: Validate placeholder selection actions and copy the Studio links', async () => {
            await expect(placeholders.copyContentLinksButton).toHaveCount(0);
            await placeholders.copyStudioLinksButton.click();
            await expect(placeholders.toastPositive).toHaveText('Copied 2 placeholder link(s)', { timeout: 10000 });
        });

        await test.step('step-3: Validate the two distinct links copied to the clipboard', async () => {
            const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
            expect(clipboardText.endsWith('\n')).toBe(false);

            const links = clipboardText.split('\n');
            expect(links).toHaveLength(2);
            for (const link of links) expect(link).toMatch(linkPattern);

            const uuids = links.map(getSearchParam);
            expect(new Set(uuids).size).toBe(2);
        });
    });
});
