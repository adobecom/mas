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
import AHTryBuyWidgetSpec from '../specs/try_buy_widget_edit_and_discard.spec.js';

const { features } = AHTryBuyWidgetSpec;
test.describe('M@S Studio AHome Try Buy Widget card test suite', () => {
    // @studio-try-buy-widget-edit-discard-bg-color - Validate editing background color for try buy widget card in mas studio
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio fragment editor page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(await editor.panel).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ah-try-buy-widget');
        });

        await test.step('step-2: Edit background color field', async () => {
            await expect(await editor.backgroundColor).toBeVisible();
            await expect(await editor.backgroundColor).toHaveAttribute('value', data.color.original);
            await editor.backgroundColor.scrollIntoViewIfNeeded();
            await editor.backgroundColor.click();
            await expect(await editor.backgroundColor.locator('sp-menu-item').first()).toBeVisible();
            await page.getByRole('option', { name: data.color.updated }).click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-3: Validate background color of the card', async () => {
            await expect(await studio.getCard(data.cardid)).not.toHaveAttribute('background-color', data.color.original);
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-5: Verify that the changes are not reflected on the card', async () => {
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('background-color', data.color.original);
        });
    });

    // @studio-try-buy-widget-edit-discard-border-color - Validate editing border color for try buy widget card in mas studio
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio fragment editor page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(await editor.panel).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ah-try-buy-widget');
        });

        await test.step('step-2: Edit border color field', async () => {
            await expect(await editor.borderColor).toBeVisible();
            await editor.borderColor.scrollIntoViewIfNeeded();
            await editor.borderColor.click();
            await expect(await editor.borderColor.locator('sp-menu-item').first()).toBeVisible();
            await page.getByRole('option', { name: data.color.updated }).click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-3: Validate border color of the card', async () => {
            await expect(await studio.getCard(data.cardid)).toHaveCSS('border-top-color', data.css.updated);
            await expect(await studio.getCard(data.cardid)).toHaveCSS('border-bottom-color', data.css.updated);
            await expect(await studio.getCard(data.cardid)).toHaveCSS('border-left-color', data.css.updated);
            await expect(await studio.getCard(data.cardid)).toHaveCSS('border-right-color', data.css.updated);
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-5: Verify that the changes are not reflected on the card', async () => {
            await expect(await studio.getCard(data.cardid)).toHaveCSS('border-top-color', data.css.original);
            await expect(await studio.getCard(data.cardid)).toHaveCSS('border-bottom-color', data.css.original);
            await expect(await studio.getCard(data.cardid)).toHaveCSS('border-left-color', data.css.original);
            await expect(await studio.getCard(data.cardid)).toHaveCSS('border-right-color', data.css.original);
        });
    });

    // @studio-try-buy-widget-edit-discard-image - Validate edit background image field for single try buy widjet card in mas studio
    test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
        const { data } = features[2];
        const testPage = `${baseURL}${features[2].path}${miloLibs}${features[2].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio fragment editor page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(await editor.panel).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ah-try-buy-widget');
        });

        await test.step('step-2: Remove background URL field', async () => {
            await expect(await editor.backgroundImage).toBeVisible();
            await expect(await editor.backgroundImage).toHaveValue(data.background.original);
            await editor.backgroundImage.fill('');
        });

        await test.step('step-3: Validate edited background image url field in Editor panel', async () => {
            await expect(await editor.backgroundImage).toHaveValue('');
        });

        await test.step('step-4: Validate image is removed from the card', async () => {
            await expect(await trybuywidget.cardImage).not.toBeVisible();
        });

        await test.step('step-5: Enter new value in the background URL field', async () => {
            await editor.backgroundImage.fill(data.background.updated);
        });

        await test.step('step-6: Validate edited background image url field in Editor panel', async () => {
            await expect(await editor.backgroundImage).toHaveValue(data.background.updated);
        });

        await test.step('step-7: Validate new image on the card', async () => {
            await expect(await trybuywidget.cardImage).toBeVisible();
            await expect(await trybuywidget.cardImage).toHaveAttribute('src', data.background.updated);
        });

        await test.step('step-8: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-9: Verify that the changes are not reflected on the card', async () => {
            await expect(await trybuywidget.cardImage).toHaveAttribute('src', data.background.original);
        });
    });
});
