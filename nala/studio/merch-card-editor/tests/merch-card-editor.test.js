import { test, expect, editor, miloLibs, setTestPage } from '../../../libs/mas-test.js';
import MerchCardEditorSpec from '../specs/merch-card-editor.spec.js';
import MerchCardEditorPage from '../merch-card-editor.page.js';

const { features } = MerchCardEditorSpec;

test.describe('M@S Studio Merch Card Editor — Loc Ready toggle test suite', () => {
    let merchCardEditor;

    test.beforeEach(async ({ page }) => {
        merchCardEditor = new MerchCardEditorPage(page);
    });

    // @studio-merch-card-editor-loc-ready-no-duplicate — verify the duplicate "Send to translation?" toggle is gone from the merch-card editor body
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio fragment editor page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Verify merch-card editor body has rendered', async () => {
            await expect(editor.panel).toBeVisible({ timeout: 15000 });
            await expect(merchCardEditor.merchCardEditor).toBeVisible();
            // Anchor: variant picker is unconditionally rendered by merch-card-editor's template,
            // so its visibility proves the editor body finished hydrating before we assert absence below.
            await expect(editor.variant).toBeVisible();
        });

        await test.step('step-3: Verify duplicate "Send to translation?" toggle is removed from merch-card editor body', async () => {
            await expect(merchCardEditor.merchCardLocReadyFieldGroup).toHaveCount(0);
            await expect(merchCardEditor.merchCardLocReadySwitch).toHaveCount(0);
            await expect(merchCardEditor.merchCardLocReadyLabel).toHaveCount(0);
            await expect(merchCardEditor.merchCardSendToTranslationText).toHaveCount(0);
        });
    });
});
