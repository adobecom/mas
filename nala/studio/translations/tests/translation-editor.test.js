import { test, expect, translationEditor, miloLibs, setTestPage } from '../../../libs/mas-test.js';
import TranslationEditorLoadSpec from '../specs/translation-editor.spec.js';

const { features } = TranslationEditorLoadSpec;

test.describe('M@S Studio Translation Editor test suite', () => {
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio translation editor page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Verify translation editor form, breadcrumb, and title field are visible', async () => {
            await expect(translationEditor.form).toBeVisible({ timeout: 10000 });
            await expect(translationEditor.breadcrumb).toBeVisible();
            await expect(translationEditor.titleField).toBeVisible();
        });
    });

    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio translation editor page (new project)', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(translationEditor.form).toBeVisible({ timeout: 10000 });
        });

        await test.step('step-2: Verify cannot create with empty title - add language to enable Save, leave title empty, click Save', async () => {
            await translationEditor.addLanguagesButton.click();
            const langCheckbox = translationEditor.addLangsDialog.locator('sp-checkbox').first();
            await expect(langCheckbox).toBeVisible({ timeout: 5000 });
            await langCheckbox.click();
            await translationEditor.addLangsDialog.getByRole('button', { name: 'Confirm' }).click();
            await expect(translationEditor.saveButton).toBeEnabled({ timeout: 5000 });
            await translationEditor.saveButton.click();
            await expect(translationEditor.validationToast).toBeVisible({ timeout: 5000 });
        });

        await test.step('step-3: Verify cannot create with empty languages - fill title, remove language, add item, click Save', async () => {
            await translationEditor.titleField.fill('Test Project');
            await translationEditor.addLanguagesButton.click();
            const checkedLangCheckbox = translationEditor.addLangsDialog.locator('sp-checkbox:checked').first();
            await expect(checkedLangCheckbox).toBeVisible({ timeout: 5000 });
            await checkedLangCheckbox.click();
            await translationEditor.addLangsDialog.getByRole('button', { name: 'Confirm' }).click();
            await translationEditor.addItemsButton.click();
            const firstItemCheckbox = translationEditor.addItemsDialog.locator('mas-select-items-table sp-checkbox').first();
            await expect(firstItemCheckbox).toBeVisible({ timeout: 15000 });
            await firstItemCheckbox.click();
            await translationEditor.addItemsDialog.getByRole('button', { name: 'Add selected items' }).click();
            await expect(translationEditor.saveButton).toBeEnabled({ timeout: 5000 });
            await translationEditor.saveButton.click();
            await expect(translationEditor.validationToast).toBeVisible({ timeout: 5000 });
        });

        await test.step('step-4: Verify cannot create with empty selected items - add language, remove item, click Save', async () => {
            await translationEditor.addLanguagesButton.click();
            const langCheckbox = translationEditor.addLangsDialog.locator('sp-checkbox').first();
            await langCheckbox.click();
            await translationEditor.addLangsDialog.getByRole('button', { name: 'Confirm' }).click();
            await translationEditor.addItemsButton.click();
            const checkedItemCheckbox = translationEditor.addItemsDialog.locator('sp-checkbox:checked').first();
            await expect(checkedItemCheckbox).toBeVisible({ timeout: 5000 });
            await checkedItemCheckbox.click();
            await translationEditor.addItemsDialog.getByRole('button', { name: 'Add selected items' }).click();
            await translationEditor.saveButton.click();
            await expect(translationEditor.validationToast).toBeVisible({ timeout: 5000 });
        });
    });

    test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[2].path}${miloLibs}${features[2].browserParams}`;
        setTestPage(testPage);
        let removedLocale;

        await test.step('step-1: Go to MAS Studio translation editor page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(translationEditor.form).toBeVisible({ timeout: 10000 });
        });

        await test.step('step-2: Verify languages empty state - plus icon, Add languages, and helper text', async () => {
            await expect(translationEditor.languagesEmptyState).toBeVisible();
            await expect(translationEditor.languagesEmptyStateIcon).toBeVisible();
            await expect(translationEditor.languagesEmptyStateLabel).toContainText('Add languages');
            await expect(translationEditor.languagesEmptyStateLabel).toContainText(
                'Choose one or more languages for your translation project.',
            );
        });

        const languagesCountText = translationEditor.addLangsDialog.locator('mas-translation-languages >> .nmb-languages');

        await test.step('step-3: Verify Select languages modal text - no selection, 1 selected, multiple selected', async () => {
            await translationEditor.addLanguagesButton.click();
            await expect(translationEditor.addLangsDialog).toBeVisible({ timeout: 5000 });
            await expect(languagesCountText).toHaveText('39 languages');
            const firstLangCheckbox = translationEditor.addLangsDialog
                .locator('mas-translation-languages >> sp-table sp-checkbox')
                .first();
            await firstLangCheckbox.click();
            await expect(languagesCountText).toHaveText('1 language selected');
            const secondLangCheckbox = translationEditor.addLangsDialog
                .locator('mas-translation-languages >> sp-table sp-checkbox')
                .nth(1);
            await secondLangCheckbox.click();
            await expect(languagesCountText).toHaveText('2 languages selected');
            await translationEditor.addLangsDialog.getByRole('button', { name: 'Cancel' }).click();
        });

        await test.step('step-4: Open modal, select all languages, close modal', async () => {
            await translationEditor.addLanguagesButton.click();
            await expect(translationEditor.addLangsDialog).toBeVisible({ timeout: 5000 });
            const selectAllCheckbox = translationEditor.addLangsDialog.getByRole('checkbox', { name: 'Select all' });
            await selectAllCheckbox.click();
            await translationEditor.addLangsDialog.getByRole('button', { name: 'Confirm' }).click();
            await expect(translationEditor.selectedLangsSection).toBeVisible({ timeout: 5000 });
        });

        await test.step('step-5: Test toggle - expand and verify all languages are displayed', async () => {
            await translationEditor.selectedLangsToggle.click();
            await expect(translationEditor.selectedLangsList).toBeVisible();
            const listText = await translationEditor.selectedLangsList.textContent();
            expect(listText.length).toBeGreaterThan(0);
            await translationEditor.selectedLangsToggle.click();
            await expect(translationEditor.selectedLangsList).not.toBeVisible();
        });

        const selectedLangsList = page.locator('mas-translation-editor >> .selected-langs-list');

        await test.step('step-6: Reopen modal, remove one language, save', async () => {
            await translationEditor.editLanguagesButton.click();
            await expect(translationEditor.addLangsDialog).toBeVisible({ timeout: 5000 });
            const firstChecked = translationEditor.addLangsDialog
                .locator('mas-translation-languages >> sp-table sp-checkbox')
                .first();
            await expect(firstChecked).toBeVisible();
            removedLocale = (await firstChecked.textContent()).trim();
            await firstChecked.click();
            await translationEditor.addLangsDialog.getByRole('button', { name: 'Confirm' }).click();
            await expect(selectedLangsList).toBeVisible({ timeout: 5000 });
            await expect(selectedLangsList).not.toContainText(removedLocale);
        });

        await test.step('step-7: Open modal, add the language back, click Cancel, verify not added', async () => {
            await translationEditor.editLanguagesButton.click();
            await expect(translationEditor.addLangsDialog).toBeVisible({ timeout: 5000 });
            const localeToRevert = translationEditor.addLangsDialog
                .locator('mas-translation-languages >> sp-table sp-checkbox')
                .filter({ hasText: removedLocale });
            await expect(localeToRevert).toBeVisible();
            await localeToRevert.click();
            await translationEditor.addLangsDialog.getByRole('button', { name: 'Cancel' }).click();
            await translationEditor.selectedLangsToggle.click();
            await expect(selectedLangsList).toBeVisible({ timeout: 5000 });
            await expect(selectedLangsList).not.toContainText(removedLocale);
        });
    });

    test(`${features[3].name},${features[3].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[3].path}${miloLibs}${features[3].browserParams}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio translation editor page (new project)', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(translationEditor.form).toBeVisible({ timeout: 10000 });
        });

        await test.step('step-2: Add one language to reach Select items section', async () => {
            await translationEditor.addLanguagesButton.click();
            await expect(translationEditor.addLangsDialog).toBeVisible({ timeout: 5000 });
            const langCheckbox = translationEditor.addLangsDialog.locator('sp-checkbox').first();
            await langCheckbox.click();
            await translationEditor.addLangsDialog.getByRole('button', { name: 'Confirm' }).click();
            await expect(translationEditor.selectedLangsSection).toBeVisible({ timeout: 5000 });
        });

        await test.step('step-3: Verify Select items empty state - plus icon, Add Items, and helper text', async () => {
            await expect(translationEditor.itemsEmptyState).toBeVisible();
            await expect(translationEditor.itemsEmptyStateIcon).toBeVisible();
            await expect(translationEditor.itemsEmptyStateLabel).toContainText('Add Items');
            await expect(translationEditor.itemsEmptyStateLabel).toContainText('Choose items that need to be translated.');
        });
    });
});
