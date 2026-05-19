import { test, expect, studio, editor, miloLibs, setTestPage } from '../../../libs/mas-test.js';
import ViewVariationsSpec from '../specs/view_variations.spec.js';

const { features } = ViewVariationsSpec;

test.describe('M@S Studio View Variations Navigation test suite', () => {
    // @studio-view-variations-from-parent-editor - Navigate from parent editor to focused list view
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.parentCardId}`;
        setTestPage(testPage);
        // TODO: promote to editor page object once stable
        const viewVariationsLink = page.locator('mas-fragment-editor .related-variations-link');
        const focusedParentRow = page.locator(`.mas-fragment[data-id="${data.parentCardId}"]`);

        await test.step('step-1: Go to MAS Studio fragment editor page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Verify editor panel is visible', async () => {
            await expect(editor.panel).toBeVisible({ timeout: 15000 });
        });

        await test.step('step-3: Click View variations link', async () => {
            await expect(viewVariationsLink).toBeVisible({ timeout: 10000 });
            await viewVariationsLink.click();
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Verify URL hash includes query=<parentCardId>', async () => {
            await expect(page).toHaveURL(new RegExp(`page=content`));
            await expect(page).toHaveURL(new RegExp(`query=${data.parentCardId}`));
        });

        await test.step('step-5: Verify focused parent row is visible', async () => {
            await expect(focusedParentRow).toBeVisible({ timeout: 15000 });
        });

        await test.step('step-6: Verify variation rows are nested inside the parent', async () => {
            await expect(studio.regionalVariationsTable(data.parentCardId)).toBeVisible({ timeout: 15000 });
        });
    });

    // @studio-view-variations-from-variation-editor - Variation editor links to parent, not variation
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}${data.parentCardId}`;
        setTestPage(testPage);
        // TODO: promote to editor page object once stable
        const viewVariationsLink = page.locator('mas-fragment-editor .related-variations-link');
        const focusedParentRow = page.locator(`.mas-fragment[data-id="${data.parentCardId}"]`);

        await test.step('step-1: Go to MAS Studio fragment editor page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Verify editor panel is visible', async () => {
            await expect(editor.panel).toBeVisible({ timeout: 15000 });
        });

        await test.step('step-3: Switch locale to TR to open the variation in the editor', async () => {
            await expect(studio.localePicker).toBeVisible();
            await expect(studio.localePicker).toHaveAttribute('value', data.defaultLocale);
            await studio.selectLocale(data.variationLocalePicker);
            await expect(studio.localePicker).toHaveAttribute('value', data.variationLocale);
        });

        await test.step('step-4: Click View variations link', async () => {
            await expect(viewVariationsLink).toBeVisible({ timeout: 10000 });
            await viewVariationsLink.click();
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(2000);
        });

        await test.step('step-5: Verify URL hash includes the parent id, not the variation id', async () => {
            await expect(page).toHaveURL(new RegExp(`page=content`));
            await expect(page).toHaveURL(new RegExp(`query=${data.parentCardId}`));
        });

        await test.step('step-6: Verify focused parent row is visible', async () => {
            await expect(focusedParentRow).toBeVisible({ timeout: 15000 });
        });

        await test.step('step-7: Verify variation rows are nested inside the parent', async () => {
            await expect(studio.regionalVariationsTable(data.parentCardId)).toBeVisible({ timeout: 15000 });
        });
    });

    // @studio-view-variations-clear-filter - Clearing the toolbar search removes the focused filter
    test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
        const { data } = features[2];
        const testPage = `${baseURL}${features[2].path}${miloLibs}${features[2].browserParams}${data.parentCardId}`;
        setTestPage(testPage);
        // TODO: promote to editor page object once stable
        const viewVariationsLink = page.locator('mas-fragment-editor .related-variations-link');
        const focusedParentRow = page.locator(`.mas-fragment[data-id="${data.parentCardId}"]`);

        await test.step('step-1: Go to MAS Studio fragment editor page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Verify editor panel is visible', async () => {
            await expect(editor.panel).toBeVisible({ timeout: 15000 });
        });

        await test.step('step-3: Click View variations link', async () => {
            await expect(viewVariationsLink).toBeVisible({ timeout: 10000 });
            await viewVariationsLink.click();
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Verify focused parent row is visible', async () => {
            await expect(focusedParentRow).toBeVisible({ timeout: 15000 });
            await expect(page).toHaveURL(new RegExp(`query=${data.parentCardId}`));
        });

        await test.step('step-5: Clear the toolbar search', async () => {
            await expect(studio.searchInput).toBeVisible({ timeout: 10000 });
            await studio.searchInput.fill('');
            await studio.searchInput.press('Enter');
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(2000);
        });

        await test.step('step-6: Verify URL hash no longer contains query=', async () => {
            await expect(page).not.toHaveURL(/query=/);
        });

        await test.step('step-7: Verify multiple fragments are now visible', async () => {
            await expect.poll(async () => page.locator('.mas-fragment').count(), { timeout: 15000 }).toBeGreaterThan(1);
        });
    });

    // @studio-view-variations-deep-link - Deep link to focused view renders parent + variations
    test(`${features[3].name},${features[3].tags}`, async ({ page, baseURL }) => {
        const { data } = features[3];
        const testPage = `${baseURL}${features[3].path}${miloLibs}${features[3].browserParams}${data.parentCardId}`;
        setTestPage(testPage);
        const focusedParentRow = page.locator(`.mas-fragment[data-id="${data.parentCardId}"]`);

        await test.step('step-1: Go directly to focused content view via deep link', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Verify focused parent row is visible', async () => {
            await expect(focusedParentRow).toBeVisible({ timeout: 30000 });
        });

        await test.step('step-3: Verify variation rows are nested inside the parent', async () => {
            await expect(studio.regionalVariationsTable(data.parentCardId)).toBeVisible({ timeout: 15000 });
        });

        await test.step('step-4: Verify URL hash retains query=<parentCardId>', async () => {
            await expect(page).toHaveURL(new RegExp(`query=${data.parentCardId}`));
        });
    });

    // @studio-view-variations-unreachable-parent - Empty state for unreachable UUID; clear control works
    test(`${features[4].name},${features[4].tags}`, async ({ page, baseURL }) => {
        const { data } = features[4];
        const testPage = `${baseURL}${features[4].path}${miloLibs}${features[4].browserParams}${data.unreachableId}`;
        setTestPage(testPage);

        await test.step('step-1: Go to content view with unreachable UUID', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Verify empty-state message renders', async () => {
            await expect(page.getByText('No fragment found', { exact: false })).toBeVisible({ timeout: 30000 });
        });

        await test.step('step-3: Verify search field still shows the UUID', async () => {
            await expect(studio.searchInput).toBeVisible({ timeout: 10000 });
            await expect(studio.searchInput).toHaveValue(data.unreachableId);
        });

        await test.step('step-4: Clear the toolbar search and verify URL query is removed', async () => {
            await studio.searchInput.fill('');
            await studio.searchInput.press('Enter');
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(2000);
            await expect(page).not.toHaveURL(/query=/);
        });
    });
});
