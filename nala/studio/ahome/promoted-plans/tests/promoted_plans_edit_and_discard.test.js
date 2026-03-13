import { test, expect, studio, editor, promotedplans, miloLibs, setTestPage } from '../../../../libs/mas-test.js';
import AHPromotedPlansSpec from '../specs/promoted_plans_edit_and_discard.spec.js';

const { features } = AHPromotedPlansSpec;

test.describe('M@S Studio AHome Promoted Plans card test suite', () => {
    // @studio-promoted-plans-edit-discard-gradient-border - Validate editing and discarding gradient border
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.cardid}`;
        setTestPage(testPage);
        const promotedPlansCard = await studio.getCard(data.cardid);

        await test.step('step-1: Go to MAS Studio fragment editor page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(await editor.panel).toBeVisible();
            await expect(await promotedPlansCard).toBeVisible();
            await expect(await promotedPlansCard).toHaveAttribute('variant', 'ah-promoted-plans');
        });

        await test.step('step-2: Edit border color field', async () => {
            await expect(await editor.borderColor).toBeVisible();
            await expect(await editor.borderColor).toContainText(data.standardBorder.color);
            await expect(promotedPlansCard).toHaveAttribute('border-color', data.standardBorder.cssColor);
            await editor.borderColor.scrollIntoViewIfNeeded();
            await editor.borderColor.click();
            await expect(await editor.borderColor.locator('sp-menu-item').first()).toBeVisible();
            await page.waitForSelector(`sp-menu-item[value="${data.gradientBorder.value}"]`, {
                state: 'visible',
            });
            await page.locator(`sp-menu-item[value="${data.gradientBorder.value}"]`).first().click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-3: Validate border color applied to card', async () => {
            await expect(await editor.borderColor).toContainText(data.gradientBorder.color);
            await expect(promotedPlansCard).toHaveAttribute('border-color', data.gradientBorder.cssColor);
            await expect(promotedPlansCard).toHaveAttribute('gradient-border', 'true');
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-5: Verify border reverted', async () => {
            await expect(promotedPlansCard).toHaveAttribute('border-color', data.standardBorder.cssColor);
        });
    });
});
