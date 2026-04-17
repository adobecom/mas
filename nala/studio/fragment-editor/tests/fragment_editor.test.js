import { test, expect, studio, editor, translationEditor, miloLibs, setTestPage } from '../../../libs/mas-test.js';
import FragmentEditorSpec from '../specs/fragment_editor.spec.js';

const { features } = FragmentEditorSpec;

test.describe('M@S Studio Fragment Editor Locale test suite', () => {
    // @studio-fragment-editor-locale-switch - Validate locale switching and translation project creation
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.cardid}`;
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

    // @studio-ccd-suggested-editor - Validate editor fields for CCD suggested card in mas studio
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await editor.panel).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ccd-suggested');
        });

        await test.step('step-3: Validate fields rendering', async () => {
            await expect(await editor.variant).toBeVisible();
            await expect(await editor.variant).toHaveAttribute('value', 'ccd-suggested');
            await expect(await editor.size).not.toBeVisible();
            await expect(await editor.title).toBeVisible();
            await expect(await editor.subtitle).toBeVisible();
            await expect(await editor.badge).toBeVisible();
            await expect(await editor.description).toBeVisible();
            await expect(await editor.mnemonicEditMenu).toBeVisible();
            await expect(await editor.backgroundImage).toBeVisible();
            await expect(await editor.prices).toBeVisible();
            await expect(await editor.footer).toBeVisible();
            await expect(await editor.badgeColor).not.toBeVisible();
            await expect(await editor.badgeBorderColor).not.toBeVisible();
            await expect(await editor.borderColor).not.toBeVisible();
            await expect(await editor.whatsIncludedLabel).not.toBeVisible();
            await expect(await editor.promoText).not.toBeVisible();
            await expect(await editor.callout).not.toBeVisible();
            await expect(await editor.addOnToggle).not.toBeVisible();
            await expect(await editor.quantitySelectorCheckbox).not.toBeVisible();
            await expect(await editor.OSI).toBeVisible();
        });
    });

    // @studio-ccd-slice-editor - Validate editor fields for slice card in mas studio
    test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
        const { data } = features[2];
        const testPage = `${baseURL}${features[2].path}${miloLibs}${features[2].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await editor.panel).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ccd-slice');
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('size', 'wide');
        });

        await test.step('step-3: Validate fields rendering', async () => {
            // await expect(await editor.authorPath).toBeVisible(); // removed with the new design but might be back
            await expect(await editor.variant).toBeVisible();
            await expect(await editor.variant).toHaveAttribute('value', 'ccd-slice');
            await expect(await editor.size).toBeVisible();
            await expect(await editor.title).not.toBeVisible();
            await expect(await editor.subtitle).not.toBeVisible();
            await expect(await editor.badge).toBeVisible();
            await expect(await editor.description).toBeVisible();
            await expect(await editor.mnemonicEditMenu).toBeVisible();
            await expect(await editor.backgroundImage).toBeVisible();
            await expect(await editor.prices).not.toBeVisible();
            await expect(await editor.footer).toBeVisible();
            await expect(await editor.badgeColor).not.toBeVisible();
            await expect(await editor.badgeBorderColor).not.toBeVisible();
            await expect(await editor.borderColor).not.toBeVisible();
            await expect(await editor.whatsIncludedLabel).not.toBeVisible();
            await expect(await editor.promoText).not.toBeVisible();
            await expect(await editor.callout).not.toBeVisible();
            await expect(await editor.addOnToggle).not.toBeVisible();
            await expect(await editor.quantitySelectorCheckbox).not.toBeVisible();
            await expect(await editor.OSI).toBeVisible();
        });
    });

    // @studio-try-buy-widget-editor - Validate editor fields for try buy widget card in mas studio
    test(`${features[3].name},${features[3].tags}`, async ({ page, baseURL }) => {
        const { data } = features[3];
        const testPage = `${baseURL}${features[3].path}${miloLibs}${features[3].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await editor.panel).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ah-try-buy-widget');
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('size', 'triple');
        });

        await test.step('step-3: Validate fields rendering', async () => {
            await expect(await editor.variant).toBeVisible();
            await expect(await editor.variant).toHaveAttribute('value', 'ah-try-buy-widget');
            await expect(await editor.size).toBeVisible();
            await expect(await editor.title).toBeVisible();
            await expect(await editor.description).toBeVisible();
            await expect(await editor.mnemonicEditMenu).toBeVisible();
            await expect(await editor.borderColor).toBeVisible();
            await expect(await editor.backgroundColor).toBeVisible();
            await expect(await editor.backgroundImage).toBeVisible();
            await expect(await editor.prices).toBeVisible();
            await expect(await editor.footer).toBeVisible();
            await expect(await editor.OSI).toBeVisible();
        });
    });

    // @studio-plans-individuals-editor - Validate editor fields for plans individuals card in mas studio
    test(`${features[4].name},${features[4].tags}`, async ({ page, baseURL }) => {
        const { data } = features[4];
        const testPage = `${baseURL}${features[4].path}${miloLibs}${features[4].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await editor.panel).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'plans');
        });

        await test.step('step-3: Validate fields rendering', async () => {
            await expect(await editor.variant).toBeVisible();
            await expect(await editor.variant).toHaveAttribute('value', 'plans');
            await expect(await editor.size).toBeVisible();
            await expect(await editor.title).toBeVisible();
            await expect(await editor.subtitle).toBeVisible();
            await expect(await editor.badge).toBeVisible();
            await expect(await editor.badgeColor).toBeVisible();
            await expect(await editor.badgeBorderColor).toBeVisible();
            await expect(await editor.borderColor).toBeVisible();
            await expect(await editor.description).toBeVisible();
            await expect(await editor.mnemonicEditMenu).toBeVisible();
            await expect(await editor.backgroundImage).not.toBeVisible();
            await expect(await editor.prices).toBeVisible();
            await expect(await editor.footer).toBeVisible();
            await expect(await editor.whatsIncludedLabel).toBeVisible();
            await expect(await editor.promoText).toBeVisible();
            await expect(await editor.callout).toBeVisible();
            await expect(await editor.addOnToggle).toBeVisible();
            await expect(await editor.OSI).toBeVisible();
        });
    });

    // @studio-promoted-plans-editor - Validate editor fields for promoted plans card
    test(`${features[5].name},${features[5].tags}`, async ({ page, baseURL }) => {
        const { data } = features[5];
        const testPage = `${baseURL}${features[5].path}${miloLibs}${features[5].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await editor.panel).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toBeVisible();
        });

        await test.step('step-3: Validate fields rendering', async () => {
            await expect(await editor.variant).toBeVisible();
            await expect(await editor.variant).toHaveAttribute('value', 'ah-promoted-plans');
            await expect(await editor.title).toBeVisible();
            await expect(await editor.description).toBeVisible();
            await expect(await editor.borderColor).toBeVisible();
            await expect(await editor.prices).toBeVisible();
            await expect(await editor.footer).toBeVisible();
        });
    });
});
