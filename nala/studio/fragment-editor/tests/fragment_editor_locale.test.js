import { test, expect, studio, editor, translationEditor, miloLibs, setTestPage } from '../../../libs/mas-test.js';
import FragmentEditorLocaleSpec from '../specs/fragment_editor_locale.spec.js';

const { features } = FragmentEditorLocaleSpec;

test.describe('M@S Studio Fragment Editor Locale test suite', () => {
    // @studio-fragment-editor-locale-switch - Validate locale switching and translation project creation
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio fragment editor page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Verify editor panel is visible', async () => {
            await expect(editor.panel).toBeVisible({ timeout: 15000 });
        });

        await test.step('step-3: Switch locale to TR via locale picker', async () => {
            await expect(studio.localePicker).toBeVisible();
            await expect(studio.localePicker).toHaveAttribute('value', data.defaultLocale);
            await studio.selectLocale(data.trLocalePicker);
        });

        await test.step('step-4: Verify missing variation panel appears', async () => {
            await expect(editor.missingVariationPanel).toBeVisible({ timeout: 10000 });
            await expect(editor.viewSourceFragmentButton).toBeVisible();
            await expect(editor.createTranslationProjectButton).toBeVisible();
        });

        await test.step('step-5: Click View US (EN) version button', async () => {
            await editor.viewSourceFragmentButton.click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-6: Verify navigation back to en_US fragment', async () => {
            await expect(studio.localePicker).toHaveAttribute('value', data.defaultLocale);
            await expect(editor.panel).toBeVisible({ timeout: 10000 });
            await expect(editor.missingVariationPanel).not.toBeVisible();
        });

        await test.step('step-7: Switch locale to FR', async () => {
            await studio.selectLocale(data.frLocalePicker);
        });

        await test.step('step-8: Verify missing variation panel appears for FR', async () => {
            await expect(editor.missingVariationPanel).toBeVisible({ timeout: 10000 });
            await expect(editor.createTranslationProjectButton).toBeVisible();
        });

        await test.step('step-9: Click Create translation project button', async () => {
            await editor.createTranslationProjectButton.click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-10: Verify navigation to translation editor page', async () => {
            await expect(page).toHaveURL(/page=translation-editor/);
        });

        await test.step('step-11: Verify translation editor form is visible', async () => {
            await expect(translationEditor.form).toBeVisible({ timeout: 10000 });
            await expect(translationEditor.titleField).toBeVisible();
        });
    });
});
