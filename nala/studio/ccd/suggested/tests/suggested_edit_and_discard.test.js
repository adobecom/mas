import {
    test,
    expect,
    studio,
    editor,
    slice,
    suggested,
    trybuywidget,
    ost,
    webUtil,
    miloLibs,
    setTestPage,
} from '../../../../libs/mas-test.js';
import CCDSuggestedSpec from '../specs/suggested_edit_and_discard.spec.js';

const { features } = CCDSuggestedSpec;

test.describe('M@S Studio CCD Suggested card test suite', () => {
    // @studio-suggested-variant-change-to-slice - Validate card variant change from suggested to slice
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio fragment editor page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(await editor.panel).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ccd-suggested');
        });

        await test.step('step-2: Edit card variant', async () => {
            await expect(await editor.variant).toBeVisible();
            await expect(await editor.variant).toHaveAttribute('value', 'ccd-suggested');
            await editor.variant.click();
            await page.getByRole('option', { name: 'slice' }).click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-3: Validate editor fields rendering after variant change', async () => {
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
        });

        await test.step('step-4: Validate card variant change', async () => {
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ccd-slice');
            await expect(await studio.getCard(data.cardid)).not.toHaveAttribute('variant', 'ccd-suggested');
            await expect(await suggested.cardTitle).not.toBeVisible();
            await expect(await suggested.cardEyebrow).not.toBeVisible();
            await expect(await slice.cardCTA).toHaveAttribute('data-wcs-osi', data.osi);
            await expect(await slice.cardCTA).toHaveAttribute('is', 'checkout-button');
        });

        await test.step('step-5: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-6: Verify there is no changes of the card', async () => {
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ccd-suggested');
            await expect(await studio.getCard(data.cardid)).not.toHaveAttribute('variant', 'ccd-slice');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await editor.variant).toHaveAttribute('value', 'ccd-suggested');
        });
    });

    // @studio-suggested-edit-discard-eyebrow - Validate edit eyebrow field for suggested card in mas studio
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio fragment editor page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(await editor.panel).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ccd-suggested');
        });

        await test.step('step-2: Edit eyebrow field', async () => {
            await expect(await editor.subtitle).toBeVisible();
            await expect(await editor.subtitle).toHaveValue(data.subtitle.original);
            await editor.subtitle.fill(data.subtitle.updated);
        });

        await test.step('step-3: Validate edited eyebrow/subtitle field in Editor panel', async () => {
            await expect(await editor.subtitle).toHaveValue(data.subtitle.updated);
        });

        await test.step('step-4: Validate edited eyebrow field on the card', async () => {
            await expect(await suggested.cardEyebrow).toHaveText(data.subtitle.updated);
        });

        await test.step('step-5: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-6: Verify there is no changes of the card', async () => {
            await expect(await suggested.cardEyebrow).toHaveText(data.subtitle.original);
        });
    });

    // @studio-suggested-edit-discard-background - Validate edit eyebrow field for suggested card in mas studio
    test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
        const { data } = features[2];
        const testPage = `${baseURL}${features[2].path}${miloLibs}${features[2].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio fragment editor page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(await editor.panel).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ccd-suggested');
        });

        await test.step('step-2: Edit background URL field', async () => {
            await expect(await editor.backgroundImage).toBeVisible();
            await expect(await editor.backgroundImage).toHaveValue('');
            await editor.backgroundImage.fill(data.newBackgroundURL);
        });

        await test.step('step-3: Validate edited background image URL field in Editor panel', async () => {
            await expect(await editor.backgroundImage).toHaveValue(data.newBackgroundURL);
        });

        await test.step('step-4: Validate edited background image URL field on the card', async () => {
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('background-image', data.newBackgroundURL);
        });

        await test.step('step-5: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-6: Verify there is no changes of the card', async () => {
            await expect(await studio.getCard(data.cardid)).not.toHaveAttribute('background-image', data.newBackgroundURL);
        });
    });
});
