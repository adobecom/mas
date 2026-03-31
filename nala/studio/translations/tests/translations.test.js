import { test, expect, translations, translationEditor, miloLibs, setTestPage } from '../../../libs/mas-test.js';
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
            await translations.waitForListToLoad();
        });

        await test.step('step-3: Validate table is visible with at least 3 projects and sorted newest first', async () => {
            await expect(translations.translationTable).toBeVisible();
            const rowCount = await translations.tableRows.count();
            expect(rowCount).toBeGreaterThanOrEqual(3);
            const allTitles = await translations.getAllProjectTitles();
            expect(allTitles.find((t) => t.includes('loc 1'))).toBeDefined();
            expect(allTitles.find((t) => t.includes('loc 2'))).toBeDefined();
            expect(allTitles.find((t) => t.includes('loc 3'))).toBeDefined();
            const sentOnTexts = await translations.getSentOnColumnTexts();
            const timestamps = sentOnTexts.map(TranslationsPage.parseSentOnText);
            for (let i = 1; i < timestamps.length; i++) {
                const prev = timestamps[i - 1];
                const curr = timestamps[i];
                if (prev > 0 && curr > 0) {
                    expect(curr).toBeLessThanOrEqual(prev);
                }
            }
        });

        await test.step('step-4: Validate table headers', async () => {
            await expect(translations.tableHeaders.translationProject).toBeVisible();
            await expect(translations.tableHeaders.translationProject).toHaveText('Translation Project');
            await expect(translations.tableHeaders.lastUpdatedBy).toBeVisible();
            await expect(translations.tableHeaders.lastUpdatedBy).toHaveText('Last updated by');
            await expect(translations.tableHeaders.sentOn).toBeVisible();
            await expect(translations.tableHeaders.sentOn).toHaveText('Sent on');
            await expect(translations.tableHeaders.actions).toBeVisible();
            await expect(translations.tableHeaders.actions).toHaveText('Actions');
        });
    });

    // @studio-translations-new-project-on-top - Click Create on Translations page, create project in editor, go back and verify on top, then delete
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const projectTitle = getTitle();
        const translationsUrl = `${baseURL}/studio.html${miloLibs}#page=translations&path=nala&locale=en_US`;

        await test.step('step-1: Navigate to Translations and click Create project', async () => {
            await page.goto(translationsUrl);
            await page.waitForLoadState('domcontentloaded');
            await translations.waitForListToLoad();
            await expect(translations.translationTable).toBeVisible();
            await translations.createProjectButton.click();
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
            await translations.waitForListToLoad();
            await expect(translations.translationTable).toBeVisible();
            await expect(translations.firstRowTitleCell).toHaveText(projectTitle, { timeout: 20000 });
        });

        await test.step('step-4: Open Actions and delete the project', async () => {
            await translations.firstRowActionMenu.click();
            await page.getByRole('menuitem', { name: 'Delete' }).click();
            await page.waitForTimeout(500);
            await expect(translations.deleteConfirmDialog).toBeVisible({ timeout: 10000 });
            await translations.deleteConfirmButton.click();
            await page.waitForTimeout(1500);
        });

        await test.step('step-5: Verify project removed from list', async () => {
            await translations.waitForListToLoad();
            const firstTitle = await translations.firstRowTitleCell.textContent().catch(() => '');
            expect(firstTitle).not.toBe(projectTitle);
        });
    });
});
