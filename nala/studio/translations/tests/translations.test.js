import { test, expect, studio, miloLibs, setTestPage } from '../../../libs/mas-test.js';
import TranslationsPage from '../translations.page.js';
import TranslationsSpec from '../specs/translations.spec.js';

const { features } = TranslationsSpec;

test.describe('M@S Studio Translations Test Suite', () => {
    let translationsPage;

    test.beforeEach(async ({ page }) => {
        translationsPage = new TranslationsPage(page);
    });

    // @studio-translations-list-load - Validate translations page loads and list or empty state is displayed.
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}`;
        setTestPage(testPage);

        await test.step('step-1: Navigate to Translations page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Wait for list to load (table or empty state)', async () => {
            await translationsPage.waitForListToLoad();
        });

        await test.step('step-3: Validate either table or empty state is visible', async () => {
            const tableVisible = await translationsPage.translationTable.isVisible();
            const emptyVisible = await translationsPage.emptyState.isVisible();
            expect(tableVisible || emptyVisible).toBeTruthy();
        });

        await test.step('step-4: If table is shown, validate table headers', async () => {
            if (await translationsPage.hasProjects()) {
                await expect(translationsPage.tableHeaders.translationProject).toBeVisible();
                await expect(translationsPage.tableHeaders.translationProject).toHaveText('Translation Project');
                await expect(translationsPage.tableHeaders.lastUpdatedBy).toBeVisible();
                await expect(translationsPage.tableHeaders.lastUpdatedBy).toHaveText('Last updated by');
                await expect(translationsPage.tableHeaders.sentOn).toBeVisible();
                await expect(translationsPage.tableHeaders.sentOn).toHaveText('Sent on');
                await expect(translationsPage.tableHeaders.actions).toBeVisible();
                await expect(translationsPage.tableHeaders.actions).toHaveText('Actions');
            }
        });

        await test.step('step-5: Verify studio chrome is present', async () => {
            await expect(studio.sideNav).toBeVisible();
            await expect(studio.localePicker).toBeVisible();
        });
    });
});
