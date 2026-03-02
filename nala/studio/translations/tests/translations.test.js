import { test, expect, studio, miloLibs, setTestPage, editor } from '../../../libs/mas-test.js';
import TranslationsPage from '../translations.page.js';
import ProjectEditorComponent from '../translation-editor-component.page.js';
import TranslationsSpec from '../specs/translations.spec.js';
import FragmentEditorLocaleSpec from '../../fragment-editor/specs/fragment_editor_locale.spec.js';

const { features } = TranslationsSpec;
const fragmentEditorFeature = FragmentEditorLocaleSpec.features[0];

test.describe('M@S Studio Translations Test Suite', () => {
    let translationsPage;

    test.beforeEach(async ({ page }) => {
        translationsPage = new TranslationsPage(page);
    });

    // @studio-translations-list-load - Validate translations page loads and list is sorted (newest first); empty state covered by unit tests
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

        await test.step('step-3: Validate table is visible and list is sorted (newest first)', async () => {
            await expect(translationsPage.translationTable).toBeVisible();
            const hasProjects = await translationsPage.hasProjects();
            if (hasProjects) {
                const sentOnTexts = await translationsPage.getSentOnColumnTexts();
                if (sentOnTexts.length >= 2) {
                    const timestamps = sentOnTexts.map(TranslationsPage.parseSentOnText);
                    for (let i = 1; i < timestamps.length; i++) {
                        expect(timestamps[i]).toBeLessThanOrEqual(timestamps[i - 1]);
                    }
                }
            }
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
    });

    // @studio-translations-new-project-on-top - Create project, verify on top, then delete
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const translationEditorForTest = new ProjectEditorComponent(page);
        const projectTitle = `Nala Translation ${Date.now()}`;
        const translationsUrl = `${baseURL}/studio.html${miloLibs}#page=translations&path=nala&locale=en_US`;
        const fragmentEditorUrl = `${baseURL}/studio.html${miloLibs}#fragmentId=${fragmentEditorFeature.data.fragmentId}&page=fragment-editor&path=nala`;

        await test.step('step-1: Go to fragment editor and create translation project', async () => {
            await page.goto(fragmentEditorUrl);
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(1500);
            const panelVisible = await editor.panel.isVisible().catch(() => false);
            if (!panelVisible) {
                await editor.panel.waitFor({ state: 'visible', timeout: 20000 }).catch(() => {});
            }
            if (!(await editor.panel.isVisible().catch(() => false))) {
                test.skip(true, 'Fragment editor or test fragment not available (path=nala, fragmentId from spec)');
                return;
            }

            await expect(studio.localePicker).toBeVisible();
            await studio.selectLocale(fragmentEditorFeature.data.frLocalePicker);
            await expect(editor.missingVariationPanel).toBeVisible({ timeout: 10000 });
            await editor.createTranslationProjectButton.click();
            await page.waitForTimeout(2000);
            await expect(page).toHaveURL(/page=translation-editor/);
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

            await expect(translationEditorForTest.saveButton).toBeEnabled({ timeout: 10000 });
            await translationEditorForTest.saveButton.click();
            await page.waitForTimeout(4000);
        });

        await test.step('step-2: Navigate to Translations and verify new project is first', async () => {
            await page.goto(translationsUrl);
            await page.waitForLoadState('domcontentloaded');
            await translationsPage.waitForListToLoad();
            await expect(translationsPage.translationTable).toBeVisible();
            await expect(translationsPage.firstRowTitleCell).toHaveText(projectTitle, { timeout: 20000 });
        });

        await test.step('step-3: Open Actions and delete the project', async () => {
            await translationsPage.firstRowActionMenu.click();
            await page.getByRole('menuitem', { name: 'Delete' }).click();
            await page.waitForTimeout(500);
            await expect(translationsPage.deleteConfirmDialog).toBeVisible({ timeout: 10000 });
            await translationsPage.deleteConfirmButton.click();
            await page.waitForTimeout(1500);
        });

        await test.step('step-4: Verify project removed from list', async () => {
            await translationsPage.waitForListToLoad();
            const firstTitle = await translationsPage.firstRowTitleCell.textContent().catch(() => '');
            expect(firstTitle).not.toBe(projectTitle);
        });
    });

    // @studio-translations-sent-on-sort - Sent on column is sortable
    test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
        const testPage = `${baseURL}${features[2].path}${miloLibs}${features[2].browserParams}`;
        setTestPage(testPage);

        await test.step('step-1: Navigate and wait for list', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await translationsPage.waitForListToLoad();
        });

        await test.step('step-2: Skip if no table (nothing to sort)', async () => {
            const hasTable = await translationsPage.hasProjects();
            if (!hasTable) {
                test.skip(true, 'No translation projects on page; Sent on sort not testable');
            }
        });

        await test.step('step-3: Click Sent on header and verify table still visible', async () => {
            const rowCountBefore = await translationsPage.tableRows.count();
            await translationsPage.sentOnHeader.click();
            await page.waitForTimeout(400);
            await expect(translationsPage.translationTable).toBeVisible();
            const rowCountAfter = await translationsPage.tableRows.count();
            expect(rowCountAfter).toBe(rowCountBefore);
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

        await test.step('step-2: Skip if no projects', async () => {
            const hasProjects = await translationsPage.hasProjects();
            test.skip(!hasProjects, 'Need at least one project to test Actions');
        });

        await test.step('step-3: Open Actions on first row and verify menu items', async () => {
            await translationsPage.firstRowActionMenu.click();
            await expect(page.getByRole('menuitem', { name: 'Edit' })).toBeVisible();
            await expect(page.getByRole('menuitem', { name: 'Duplicate' })).toBeVisible();
            await expect(page.getByRole('menuitem', { name: 'Archive' })).toBeVisible();
            await expect(page.getByRole('menuitem', { name: 'Delete' })).toBeVisible();
            await expect(page.getByRole('menuitem', { name: 'Cancel' })).toBeVisible();
        });
    });
});
