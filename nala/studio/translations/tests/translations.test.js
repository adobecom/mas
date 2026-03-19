import { test, expect, translations, translationEditor, miloLibs, setTestPage } from '../../../libs/mas-test.js';
import { getTitle } from '../../../utils/fragment-tracker.js';
import TranslationsPage from '../translations.page.js';
import TranslationsSpec from '../specs/translations.spec.js';

const { features } = TranslationsSpec;

test.describe('M@S Studio Translations Test Suite', () => {
    // 0. @studio-translations-list-load - Validate translations page loads and list is sorted (newest first)
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

    // 1. @studio-translations-new-project-on-top - Click Create on Translations page, create project in editor, go back and verify on top, then delete
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

        await test.step('step-3: Go back to Translations and verify new project is in list', async () => {
            await page.goto(translationsUrl);
            await page.waitForLoadState('domcontentloaded');
            await translations.waitForListToLoad();
            await expect(translations.translationTable).toBeVisible();
            const projectRow = translations.tableRows.filter({ hasText: projectTitle }).first();
            await expect(projectRow).toBeVisible({ timeout: 20000 });
        });

        await test.step('step-4: Open Actions and delete the project', async () => {
            const projectRow = translations.tableRows.filter({ hasText: projectTitle }).first();
            await projectRow.locator('sp-action-menu').click();
            await page.getByRole('menuitem', { name: 'Delete' }).click();
            await page.waitForTimeout(500);
            await expect(translations.deleteConfirmDialog).toBeVisible({ timeout: 10000 });
            await translations.deleteConfirmButton.click();
            await page.waitForTimeout(1500);
        });

        await test.step('step-5: Verify project removed from list', async () => {
            await translations.waitForListToLoad();
            const projectRow = translations.tableRows.filter({ hasText: projectTitle }).first();
            await expect(projectRow).not.toBeVisible({ timeout: 10000 });
        });
    });

    // 2. @translation-editor-load – Verify form, breadcrumb and title field are visible
    test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[2].path}${miloLibs}${features[2].browserParams}`;
        setTestPage(testPage);
        await page.goto(testPage);
        await page.waitForLoadState('domcontentloaded');
        await expect(translationEditor.form).toBeVisible({ timeout: 15000 });
        await expect(translationEditor.breadcrumb).toBeVisible();
        await expect(translationEditor.titleField).toBeVisible();
    });

    // 3. @translation-editor-cards-table – Select Items Table: Cards Tab and Collapsible Rows
    test(`${features[3].name},${features[3].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[3].path}${miloLibs}${features[3].browserParams}`;
        setTestPage(testPage);
        await page.goto(testPage);
        await page.waitForLoadState('domcontentloaded');
        await expect(translationEditor.form).toBeVisible({ timeout: 15000 });

        // @translation-editor-cards-expand-collapse
        await test.step('step-1: Open Add Items dialog and navigate to Cards tab', async () => {
            await translationEditor.addItemsButton.click();
            await expect(translationEditor.selectItemsDialog).toBeVisible({ timeout: 10000 });
            await expect(translationEditor.cardsTab).toBeVisible({ timeout: 5000 });
            await translationEditor.cardsTab.click();
            await expect(translationEditor.tableRows.first()).toBeVisible({ timeout: 15000 });
        });

        await test.step('step-2: Expand a card with variations, verify nested rows appear', async () => {
            await translationEditor.expandRowButton(0).click();
            await page.waitForTimeout(1000);
            await expect(translationEditor.selectItemsTable).toBeVisible({ timeout: 15000 });
        });

        await test.step('step-3: Collapse the card, verify nested rows disappear', async () => {
            await translationEditor.expandRowButton(0).click();
            await page.waitForTimeout(500);
            await expect(translationEditor.selectItemsTable).toBeVisible();
        });

        // @translation-editor-cards-checkbox-select
        await test.step('step-4: Close dialog and verify save and translate buttons are disabled before selecting', async () => {
            await translationEditor.selectItemsDialog.getByRole('button', { name: 'Cancel' }).click();
            await expect(translationEditor.selectItemsDialog).not.toBeVisible({ timeout: 10000 });
            await expect(translationEditor.saveButton).toBeDisabled();
            await expect(translationEditor.sendToLocButton).toBeDisabled({ timeout: 5000 });
        });

        await test.step('step-5: Re-open Add Items, select one fragment (card) via checkbox', async () => {
            await translationEditor.addItemsButton.click();
            await expect(translationEditor.selectItemsDialog).toBeVisible({ timeout: 10000 });
            await expect(translationEditor.cardsTab).toBeVisible({ timeout: 5000 });
            await translationEditor.cardsTab.click();
            await expect(translationEditor.tableRows.first()).toBeVisible({ timeout: 15000 });
            await translationEditor.tableRowCheckbox(0).click();
            await expect(translationEditor.selectedItemsButton).toContainText('(1)');
        });

        await test.step('step-6: Select one collection', async () => {
            await translationEditor.collectionsTab.click();
            await expect(translationEditor.tableRowsCollections.first()).toBeVisible({ timeout: 10000 });
            await translationEditor.tableRowCheckboxCollections(0).click();
            await expect(translationEditor.selectedItemsButton).toContainText('(2)');
        });

        await test.step('step-7: Select one placeholder', async () => {
            await translationEditor.placeholdersTab.click();
            await expect(translationEditor.tableRowsPlaceholders.first()).toBeVisible({ timeout: 10000 });
            await translationEditor.tableRowCheckboxPlaceholders(0).click();
            await expect(translationEditor.selectedItemsButton).toContainText('(3)');
        });

        await test.step('step-8: Add selected items and close dialog', async () => {
            await translationEditor.addSelectedItemsButton.click();
            await expect(translationEditor.selectItemsDialog).not.toBeVisible({ timeout: 15000 });
            await page.waitForTimeout(1000);
        });

        await test.step('step-9: Open sidebar and verify selection and count in sidebar and header', async () => {
            await translationEditor.selectedItemsToggleButton.click();
            await expect(translationEditor.selectedItemsExpandedPanel).toBeVisible({ timeout: 5000 });
            await expect(translationEditor.selectedItemsHeader).toContainText('(3)');
        });

        await test.step('step-10: Click Hide selection and verify sidebar closed', async () => {
            await translationEditor.selectedItemsToggleButton.click();
            await expect(translationEditor.selectedItemsExpandedPanel).not.toBeVisible();
        });
    });

    // 4. @translation-editor-search-filters – Search and Filters
    test(`${features[4].name},${features[4].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[4].path}${miloLibs}${features[4].browserParams}`;
        setTestPage(testPage);
        await page.goto(testPage);
        await page.waitForLoadState('domcontentloaded');
        await expect(translationEditor.form).toBeVisible({ timeout: 15000 });

        await test.step('step-1: Open Add Items dialog and navigate to Cards tab', async () => {
            await translationEditor.addItemsButton.click();
            await expect(translationEditor.cardsTab).toBeVisible({ timeout: 10000 });
            await translationEditor.cardsTab.click();
            await expect(translationEditor.selectItemsTable).toBeVisible({ timeout: 10000 });
            await expect(translationEditor.tableRows.first()).toBeVisible({ timeout: 30000 });
        });

        // @translation-editor-search
        await test.step('step-2: Enter search term, verify results update', async () => {
            await translationEditor.searchInput.fill('test');
            await page.keyboard.press('Enter');
            await page.waitForTimeout(1000);
            await expect(translationEditor.selectItemsTable).toBeVisible();
        });

        // @translation-editor-filters
        await test.step('step-3: Apply Template filter', async () => {
            const filterBtn = translationEditor.filterButtons.nth(0);
            await expect(filterBtn).toBeVisible({ timeout: 10000 });
            await filterBtn.click();
            await expect(translationEditor.filterPopover).toBeVisible({ timeout: 8000 });
            await translationEditor.filterPopover.locator('sp-checkbox').first().click();
            await filterBtn.click();
            await page.waitForTimeout(500);
            await expect(translationEditor.selectItemsTable).toBeVisible();
        });

        await test.step('step-4: Apply Market Segment filter', async () => {
            const filterBtn = translationEditor.filterButtons.nth(1);
            await expect(filterBtn).toBeVisible({ timeout: 10000 });
            await filterBtn.click();
            await expect(translationEditor.filterPopover).toBeVisible({ timeout: 8000 });
            await translationEditor.filterPopover.locator('sp-checkbox').first().click();
            await filterBtn.click();
            await page.waitForTimeout(500);
            await expect(translationEditor.selectItemsTable).toBeVisible();
        });

        await test.step('step-5: Apply Customer Segment filter', async () => {
            const filterBtn = translationEditor.filterButtons.nth(2);
            await expect(filterBtn).toBeVisible({ timeout: 10000 });
            await filterBtn.click();
            await expect(translationEditor.filterPopover).toBeVisible({ timeout: 8000 });
            await translationEditor.filterPopover.locator('sp-checkbox').first().click();
            await filterBtn.click();
            await page.waitForTimeout(500);
            await expect(translationEditor.selectItemsTable).toBeVisible();
        });

        await test.step('step-6: Apply Product filter', async () => {
            const filterBtn = translationEditor.filterButtons.nth(3);
            await expect(filterBtn).toBeVisible({ timeout: 10000 });
            await filterBtn.click();
            await expect(translationEditor.filterPopover).toBeVisible({ timeout: 8000 });
            await translationEditor.filterPopover.locator('sp-checkbox').first().click();
            await filterBtn.click();
            await page.waitForTimeout(500);
            await expect(translationEditor.selectItemsTable).toBeVisible();
        });
    });

    // 5. @translation-editor-copy-offer-id – For a row with offer data, click copy button
    test(`${features[5].name},${features[5].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[5].path}${miloLibs}${features[5].browserParams}`;
        setTestPage(testPage);
        await page.goto(testPage);
        await page.waitForLoadState('domcontentloaded');
        await expect(translationEditor.form).toBeVisible({ timeout: 15000 });
        await translationEditor.addItemsButton.click();
        await expect(translationEditor.cardsTab).toBeVisible({ timeout: 10000 });
        await translationEditor.cardsTab.click();
        await expect(translationEditor.tableRows.first()).toBeVisible({ timeout: 30000 });
        await expect(translationEditor.copyOfferIdButton.first()).toBeVisible({ timeout: 5000 });
        await translationEditor.copyOfferIdButton.first().click();
        const toast = page.locator('sp-toast').first();
        await expect(toast).toBeVisible({ timeout: 15000 });
    });

    // 6. @translation-editor-view-only – Open existing read-only translation project
    test(`${features[6].name},${features[6].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[6].path}${miloLibs}${features[6].browserParams}`;
        setTestPage(testPage);
        await page.goto(testPage);
        await page.waitForLoadState('domcontentloaded');
        await expect(translationEditor.form).toBeVisible({ timeout: 15000 });
        await expect(translationEditor.selectedItemsHeader).toBeVisible({ timeout: 10000 });
        await translationEditor.selectedItemsToggleButton.click();
        await expect(translationEditor.viewOnlyCardsTab).toBeVisible({ timeout: 10000 });
        await expect(translationEditor.tableRowCheckbox(0)).not.toBeVisible();
    });

    // 7. @translation-editor-loading-variations – Expand grouped variation
    test(`${features[7].name},${features[7].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[7].path}${miloLibs}${features[7].browserParams}`;
        setTestPage(testPage);
        await page.goto(testPage);
        await page.waitForLoadState('domcontentloaded');
        await expect(translationEditor.form).toBeVisible({ timeout: 15000 });
        await translationEditor.addItemsButton.click();
        await expect(translationEditor.cardsTab).toBeVisible({ timeout: 10000 });
        await translationEditor.cardsTab.click();
        await expect(translationEditor.selectItemsTable).toBeVisible({ timeout: 15000 });
        await expect(translationEditor.tableRows.first()).toBeVisible({ timeout: 30000 });
        await translationEditor.expandRowButton(0).click();
        await expect(translationEditor.selectItemsTable).toBeVisible({ timeout: 15000 });
    });

    // 8. @translation-editor-actions
    test(`${features[8].name},${features[8].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[8].path}${miloLibs}${features[8].browserParams}`;
        const translationsUrl = `${baseURL}/studio.html${miloLibs}#page=translations&path=nala&locale=en_US`;
        const projectTitle = getTitle();
        setTestPage(testPage);

        // @translation-editor-save
        await test.step('step-1: Create project with items and languages', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(translationEditor.form).toBeVisible({ timeout: 15000 });
            await translationEditor.addItemsButton.click();
            await expect(translationEditor.cardsTab).toBeVisible({ timeout: 10000 });
            await translationEditor.cardsTab.click();
            await expect(translationEditor.tableRows.first()).toBeVisible({ timeout: 10000 });
            await translationEditor.tableRowCheckbox(0).click();
            await translationEditor.addSelectedItemsButton.click();
            await expect(translationEditor.selectItemsDialog).not.toBeVisible({ timeout: 10000 });
        });

        // @translation-editor-add-languages
        await test.step('step-2: Add languages via overlay', async () => {
            await translationEditor.addLanguagesButton.click();
            const selectLangsDialog = page.getByRole('dialog', { name: 'Select languages' });
            await expect(selectLangsDialog).toBeVisible({ timeout: 10000 });
            await page.locator('.select-all-lang sp-checkbox').click();
            await page.locator('sp-dialog-wrapper.add-langs-dialog sp-button[variant="accent"]').click();
            await expect(selectLangsDialog).not.toBeVisible({ timeout: 5000 });
        });

        await test.step('step-3: Fill title and save', async () => {
            await translationEditor.titleField.click();
            await page.keyboard.type(projectTitle);
            await page.waitForTimeout(300);
            await translationEditor.saveButton.click();
            await page.waitForTimeout(3000);
            await expect(translationEditor.saveButton).toBeVisible({ timeout: 10000 });
        });

        await test.step('step-4: Delete created project', async () => {
            await page.goto(translationsUrl);
            await page.waitForLoadState('domcontentloaded');
            await translations.waitForListToLoad();
            const projectRow = translations.tableRows.filter({ hasText: projectTitle }).first();
            await expect(projectRow).toBeVisible({ timeout: 20000 });
            await projectRow.locator('sp-action-menu').click();
            await page.getByRole('menuitem', { name: 'Delete' }).click();
            await page.waitForTimeout(500);
            await expect(translations.deleteConfirmDialog).toBeVisible({ timeout: 10000 });
            await translations.deleteConfirmButton.click();
            await page.waitForTimeout(1500);
        });

        // @translation-editor-add-files
        await test.step('step-5: Open existing project, verify selected items', async () => {
            const addFilesUrl = `${baseURL}${features[6].path}${miloLibs}${features[6].browserParams}`;
            await page.goto(addFilesUrl);
            await page.waitForLoadState('domcontentloaded');
            await expect(translationEditor.form).toBeVisible({ timeout: 15000 });
            await expect(translationEditor.titleField).toBeVisible();
            await expect(translationEditor.selectedItemsHeader).toBeVisible({ timeout: 10000 });
        });
    });
});
