import { test, expect, studio, editor, fries, webUtil, miloLibs, setTestPage } from '../../../../libs/mas-test.js';
import COMFriesSpec from '../specs/fries_edit_and_discard.spec.js';

const { features } = COMFriesSpec;

test.describe('M@S Studio Commerce Fries card test suite', () => {
    // @studio-fries-edit-discard-trial-badge - Validate edit trial badge for fries card in mas studio
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio fragment editor page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-2: Remove badge field', async () => {
            await expect(await editor.trialBadge).toBeVisible();
            await expect(await editor.trialBadge).toHaveText(data.trialBadge.original);
            await editor.trialBadge.click();
            await page.waitForTimeout(500);
            await page.keyboard.press('ControlOrMeta+A');
            await page.keyboard.press('Backspace');
            await page.waitForTimeout(1000);
            await expect(await editor.trialBadge).toHaveText('');
        });

        await test.step('step-3: Validate badge field is removed', async () => {
            await expect(await editor.trialBadge).toHaveText('');
            await expect((await studio.getCard(data.cardid)).locator(fries.trialBadge)).not.toBeVisible();
        });

        await test.step('step-4: Enter new value in the badge field', async () => {
            await editor.trialBadge.fill(data.trialBadge.updated);
        });

        await test.step('step-5: Validate badge field updated', async () => {
            await expect(await editor.trialBadge).toHaveText(data.trialBadge.updated);
            await expect((await studio.getCard(data.cardid)).locator(fries.trialBadge)).toHaveText(data.trialBadge.updated);
        });

        await test.step('step-6: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-7: Verify there is no changes of the card', async () => {
            await expect((await studio.getCard(data.cardid)).locator(fries.trialBadge)).toHaveText(data.trialBadge.original);
        });
    });

    // @studio-fries-edit-discard-trial-badge-color - Validate edit trial badge color for fries card in mas studio
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}${data.cardid}`;
        setTestPage(testPage);
        const friesCard = await studio.getCard(data.cardid);

        await test.step('step-1: Go to MAS Studio fragment editor page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-2: Edit badge color field', async () => {
            await expect(await editor.trialBadgeColor).toBeVisible();
            await expect(await editor.trialBadgeColor).toContainText(data.color.original);
            await editor.trialBadgeColor.scrollIntoViewIfNeeded();
            await editor.trialBadgeColor.click();
            await expect(await editor.trialBadgeColor.locator('sp-menu-item').first()).toBeVisible();
            await page.getByRole('option', { name: data.color.updated, exact: true }).click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-3: Validate badge color field updated', async () => {
            await expect(await editor.trialBadgeColor).toContainText(data.color.updated);
            expect(
                await webUtil.verifyCSS(friesCard.locator(fries.trialBadge), {
                    color: data.colorCSS.updated,
                }),
            ).toBeTruthy();
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-5: Verify badge color is unchanged', async () => {
            expect(
                await webUtil.verifyCSS(friesCard.locator(fries.trialBadge), {
                    color: data.colorCSS.original,
                }),
            ).toBeTruthy();
        });
    });

    // @studio-fries-edit-discard-trial-badge-border-color - Validate edit trial badge border color for fries card in mas studio
    test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
        const { data } = features[2];
        const testPage = `${baseURL}${features[2].path}${miloLibs}${features[2].browserParams}${data.cardid}`;
        setTestPage(testPage);
        const friesCard = await studio.getCard(data.cardid);

        await test.step('step-1: Go to MAS Studio fragment editor page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-2: Edit badge border color field', async () => {
            await expect(await editor.trialBadgeBorderColor).toBeVisible();
            await expect(await editor.trialBadgeBorderColor).toContainText(data.color.original);
            await editor.trialBadgeBorderColor.scrollIntoViewIfNeeded();
            await editor.trialBadgeBorderColor.click();
            await expect(await editor.trialBadgeBorderColor.locator('sp-menu-item').first()).toBeVisible();
            await page.getByRole('option', { name: data.color.updated, exact: true }).click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-3: Validate badge border color field updated', async () => {
            await expect(await editor.trialBadgeBorderColor).toContainText(data.color.updated);
            expect(
                await webUtil.verifyCSS(friesCard.locator(fries.trialBadge), {
                    'border-color': data.colorCSS.updated,
                }),
            ).toBeTruthy();
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-5: Verify badge border color is unchanged', async () => {
            expect(
                await webUtil.verifyCSS(friesCard.locator(fries.trialBadge), {
                    'border-color': data.colorCSS.original,
                }),
            ).toBeTruthy();
        });
    });
});
