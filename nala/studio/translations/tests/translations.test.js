import { test, expect, miloLibs, setTestPage, translationEditor } from '../../../libs/mas-test.js';
import TranslationsPage from '../translations.page.js';
import ProjectEditorComponent from '../translation-editor-component.page.js';
import TranslationsSpec from '../specs/translations.spec.js';

const { features } = TranslationsSpec;

test.describe('M@S Studio Translations Test Suite', () => {
    let translationsPage;

    test.beforeEach(async ({ page }) => {
        translationsPage = new TranslationsPage(page);
    });

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
        const translationEditorForTest = new ProjectEditorComponent(page);
        const projectTitle = `Nala Translation ${Date.now()}`;
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
            await expect(translationEditorForTest.form).toBeVisible({ timeout: 10000 });
            await expect(translationEditorForTest.titleField).toBeVisible({ timeout: 5000 });

            await page.evaluate((title) => {
                const editorEl =
                    document.querySelector('mas-studio')?.shadowRoot?.querySelector('mas-translation-editor') ||
                    document.querySelector('mas-translation-editor');
                if (!editorEl?.shadowRoot) return;
                const titleField = editorEl.shadowRoot.querySelector('sp-textfield#title');
                if (!titleField) return;
                titleField.value = title;
                titleField.dispatchEvent(new InputEvent('input', { bubbles: true }));
            }, projectTitle);

            await translationEditorForTest.addLanguageAndConfirm();
            await translationEditorForTest.addOneItemAndConfirm();
            await expect(translationEditorForTest.saveButton).toBeEnabled({ timeout: 10000 });
            await translationEditorForTest.saveButton.click();
            await page.waitForTimeout(4000);
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

    // @studio-translations-sent-on-sort - Verify sorting in the Sent on column
    test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[2].path}${miloLibs}${features[2].browserParams}`;
        setTestPage(testPage);

        await test.step('step-1: Wait for table to load', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await translationsPage.waitForListToLoad();
        });

        await test.step('step-2: Verify table with projects is visible (at least 3 rows)', async () => {
            await expect(translationsPage.translationTable).toBeVisible();
            expect(await translationsPage.tableRows.count()).toBeGreaterThanOrEqual(3);
        });

        await test.step('step-3: Click Sent on header and verify table remains unchanged', async () => {
            const rowCountBefore = await translationsPage.tableRows.count();
            await translationsPage.sentOnHeader.click();
            await page.waitForTimeout(500);
            await expect(translationsPage.translationTable).toBeVisible();
            const rowCountAfter = await translationsPage.tableRows.count();
            expect(rowCountAfter).toBe(rowCountBefore);
        });

        await test.step('step-4: Verify projects are sorted properly in Sent on column', async () => {
            const sentOnTexts = await translationsPage.getSentOnColumnTexts();
            const timestamps = sentOnTexts.map(TranslationsPage.parseSentOnText);
            const isDescending = timestamps.every((t, i) => i === 0 || t <= timestamps[i - 1]);
            const isAscending = timestamps.every((t, i) => i === 0 || t >= timestamps[i - 1]);
            expect(isDescending || isAscending).toBe(true);
        });
    });

    // @studio-translations-actions-dropdown - Actions dropdown items
    test(`${features[3].name},${features[3].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[3].path}${miloLibs}${features[3].browserParams}`;
        setTestPage(testPage);

        await test.step('step-1: Navigate and wait for table', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await translationsPage.waitForListToLoad();
        });

        await test.step('step-2: Table with projects is visible', async () => {
            await expect(translationsPage.translationTable).toBeVisible();
            expect(await translationsPage.tableRows.count()).toBeGreaterThanOrEqual(3);
        });

        await test.step('step-3: Open Actions on first row and verify menu items and their status (enabled/disabled)', async () => {
            await translationsPage.firstRowActionMenu.click();
            const editItem = page.getByRole('menuitem', { name: 'Edit' });
            const duplicateItem = page.getByRole('menuitem', { name: 'Duplicate' });
            const archiveItem = page.getByRole('menuitem', { name: 'Archive' });
            const deleteItem = page.getByRole('menuitem', { name: 'Delete' });
            const cancelItem = page.getByRole('menuitem', { name: 'Cancel' });
            await expect(editItem).toBeVisible();
            await expect(duplicateItem).toBeVisible();
            await expect(archiveItem).toBeVisible();
            await expect(deleteItem).toBeVisible();
            await expect(cancelItem).toBeVisible();
            await expect(editItem).not.toHaveAttribute('disabled');
            await expect(deleteItem).not.toHaveAttribute('disabled');
            await expect(duplicateItem).toHaveAttribute('disabled');
            await expect(archiveItem).toHaveAttribute('disabled');
            await expect(cancelItem).toHaveAttribute('disabled');
        });
    });

    // @studio-translations-edit-opens-editor - Edit opens translation editor with project id in URL
    test(`${features[4].name},${features[4].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[4].path}${miloLibs}${features[4].browserParams}`;
        setTestPage(testPage);

        await test.step('step-1: Navigate and wait for table', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await translationsPage.waitForListToLoad();
            await expect(translationsPage.translationTable).toBeVisible();
        });

        await test.step('step-2: Click Edit on first row and verify URL has translation-editor and project id', async () => {
            await translationsPage.clickEditForRow(0);
            await expect(page).toHaveURL(/page=translation-editor/);
            await expect(page).toHaveURL(/translationProjectId=/);
            const hash = new URL(page.url()).hash;
            const params = new URLSearchParams(hash.slice(1));
            const projectId = params.get('translationProjectId');
            expect(projectId).toBeTruthy();
            expect(projectId.length).toBeGreaterThan(0);
        });

        await test.step('step-3: Translation editor form is visible', async () => {
            await expect(translationEditor.form).toBeVisible({ timeout: 10000 });
        });
    });

    // @studio-translations-create-project-opens-editor - Create project opens editor without project id
    test(`${features[5].name},${features[5].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[5].path}${miloLibs}${features[5].browserParams}`;
        setTestPage(testPage);

        await test.step('step-1: Navigate and wait for table', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await translationsPage.waitForListToLoad();
            await expect(translationsPage.translationTable).toBeVisible();
        });

        await test.step('step-2: Click Create project and verify URL has translation-editor and no project id', async () => {
            await translationsPage.createProjectButton.click();
            await expect(page).toHaveURL(/page=translation-editor/);
            const hash = new URL(page.url()).hash;
            const params = new URLSearchParams(hash.slice(1));
            const projectId = params.get('translationProjectId');
            expect(projectId === null).toBe(true);
        });

        await test.step('step-3: Translation editor form is visible', async () => {
            await expect(translationEditor.form).toBeVisible({ timeout: 10000 });
        });
    });
});
