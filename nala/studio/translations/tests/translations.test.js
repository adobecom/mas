import { test, expect, translationsPage, translationEditor, miloLibs, setTestPage } from '../../../libs/mas-test.js';
import { getTitle } from '../../../utils/fragment-tracker.js';
import TranslationsPage from '../translations.page.js';
import TranslationsSpec from '../specs/translations.spec.js';

const { features } = TranslationsSpec;

test.describe('M@S Studio Translations Test Suite', () => {
    // @studio-translations-list-load - Validate translations page loads and list is sorted (newest first)
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}`;
        setTestPage(testPage);

        await test.step('step-1: Navigate to Translations page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Wait for list to load', async () => {
            await translationsPage.waitForListToLoad();
        });

        await test.step('step-3: Validate table is visible with at least 3 projects and sorted newest first', async () => {
            await expect(translationsPage.translationTable).toBeVisible();
            const rowCount = await translationsPage.tableRows.count();
            expect(rowCount).toBeGreaterThanOrEqual(3);
            const allTitles = await translationsPage.getAllProjectTitles();
            expect(allTitles.find((t) => t.includes('loc 1'))).toBeDefined();
            expect(allTitles.find((t) => t.includes('loc 2'))).toBeDefined();
            expect(allTitles.find((t) => t.includes('loc 3'))).toBeDefined();
            const sentOnTexts = await translationsPage.getSentOnColumnTexts();
            const timestamps = sentOnTexts.map(TranslationsPage.parseSentOnText);
            for (let i = 1; i < timestamps.length; i++) {
                expect(timestamps[i]).toBeLessThanOrEqual(timestamps[i - 1]);
            }
        });

        await test.step('step-4: Validate table headers', async () => {
            await expect(translationsPage.tableHeaders.translationProject).toBeVisible();
            await expect(translationsPage.tableHeaders.translationProject).toHaveText('Translation Project');
            await expect(translationsPage.tableHeaders.lastUpdatedBy).toBeVisible();
            await expect(translationsPage.tableHeaders.lastUpdatedBy).toHaveText('Last updated by');
            await expect(translationsPage.tableHeaders.sentOn).toBeVisible();
            await expect(translationsPage.tableHeaders.sentOn).toHaveText('Sent on');
            await expect(translationsPage.tableHeaders.actions).toBeVisible();
            await expect(translationsPage.tableHeaders.actions).toHaveText('Actions');
        });
    });

    // @studio-translations-new-project-on-top - Click Create on Translations page, create project in editor, go back and verify on top, then delete
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const projectTitle = getTitle();
        const translationsUrl = `${baseURL}/studio.html${miloLibs}#page=translations&path=nala&locale=en_US`;

        await test.step('step-1: Navigate to Translations and click Create project', async () => {
            await page.goto(translationsUrl);
            await page.waitForLoadState('domcontentloaded');
            await translationsPage.waitForListToLoad();
            await expect(translationsPage.translationTable).toBeVisible();
            await translationsPage.createProjectButton.click();
            await page.waitForTimeout(2000);
            await expect(page).toHaveURL(/page=translation-editor/);
        });

        await test.step('step-2: Fill and save the new project in translation editor', async () => {
            await translationEditor.createTranslationProject();
            await translationEditor.saveTranslationProject();
        });

        await test.step('step-3: Go back to Translations and verify new project is first', async () => {
            await page.goto(translationsUrl);
            await page.waitForLoadState('domcontentloaded');
            await translationsPage.waitForListToLoad();
            await expect(translationsPage.translationTable).toBeVisible();
            await expect(translationsPage.firstRowTitleCell).toHaveText(projectTitle, { timeout: 20000 });
        });

        await test.step('step-4: Open Actions and delete the project', async () => {
            await translationsPage.firstRowActionMenu.click();
            await page.getByRole('menuitem', { name: 'Delete' }).click();
            await page.waitForTimeout(500);
            await expect(translationsPage.deleteConfirmDialog).toBeVisible({ timeout: 10000 });
            await translationsPage.deleteConfirmButton.click();
            await page.waitForTimeout(1500);
        });

        await test.step('step-5: Verify project removed from list', async () => {
            await translationsPage.waitForListToLoad();
            const firstTitle = await translationsPage.firstRowTitleCell.textContent().catch(() => '');
            expect(firstTitle).not.toBe(projectTitle);
        });
    });
});
