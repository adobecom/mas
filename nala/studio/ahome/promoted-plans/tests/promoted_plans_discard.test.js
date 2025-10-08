import { test, expect, studio, editor, promotedplans, miloLibs } from '../../../../libs/mas-test.js';
import AHPromotedPlansSpec from '../specs/promoted_plans_discard.spec.js';

const { features } = AHPromotedPlansSpec;

test.describe('M@S Studio AHome Promoted Plans Discard test suite', () => {
    // @studio-promoted-plans-discard-edited-title - Validate discarding title changes for promoted plans card
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit title field', async () => {
            await expect(await editor.title).toBeVisible();
            await editor.title.fill(data.newTitle);
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await editor.closeEditor.click();
            await expect(await studio.confirmationDialog).toBeVisible();
            await studio.discardDialog.click();
            await expect(await editor.panel).not.toBeVisible();
        });

        await test.step('step-5: Validate title field not updated', async () => {
            await expect(await promotedplans.cardTitle).toHaveText(data.title);
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await editor.title).toContainText(data.title);
        });
    });

    // @studio-promoted-plans-discard-edited-gradient-border - Validate discarding gradient border changes
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Change to Transparent border', async () => {
            await expect(await editor.borderColor).toBeVisible();
            await editor.borderColor.click();
            await page.getByRole('option', { name: data.transparentBorderColor }).click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await editor.closeEditor.click();
            await expect(await studio.confirmationDialog).toBeVisible();
            await studio.discardDialog.click();
            await expect(await editor.panel).not.toBeVisible();
        });

        await test.step('step-5: Verify border reverted', async () => {
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('border-color', data.standardBorderCSSColor);
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await editor.borderColor).toContainText(data.standardBorderColor);
        });
    });

    // @studio-promoted-plans-discard-edited-edit-cta-variant - Validate discarding CTA variant changes
    test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
        const { data } = features[2];
        const testPage = `${baseURL}${features[2].path}${miloLibs}${features[2].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit CTA variant', async () => {
            await expect(await editor.footer.locator(editor.linkEdit)).toBeVisible();
            await expect(await editor.CTA.nth(2)).toBeVisible();
            await editor.CTA.nth(2).click();
            await editor.footer.locator(editor.linkEdit).click();
            await expect(await editor.linkVariant).toBeVisible();
            await expect(await editor.linkSave).toBeVisible();
            await (await editor.getLinkVariant(data.newVariant)).click();
            await editor.linkSave.click();
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await editor.closeEditor.click();
            await expect(await studio.confirmationDialog).toBeVisible();
            await studio.discardDialog.click();
            await expect(await editor.panel).not.toBeVisible();
        });

        await test.step('step-5: Open the editor and validate there are no changes', async () => {
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await editor.CTA.nth(2)).toBeVisible();
            await expect(await editor.CTA.nth(2)).not.toHaveClass(data.newVariant);
            await expect(await editor.CTA.nth(2)).toHaveClass(data.variant);
        });
    });

    // @studio-promoted-plans-discard-edited-edit-description - Validate discarding description changes
    test(`${features[3].name},${features[3].tags}`, async ({ page, baseURL }) => {
        const { data } = features[3];
        const testPage = `${baseURL}${features[3].path}${miloLibs}${features[3].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-4: Edit description field', async () => {
            await expect(await editor.description).toBeVisible();
            await editor.description.fill(data.newDescription);
        });

        await test.step('step-5: Close the editor and verify discard is triggered', async () => {
            await editor.closeEditor.click();
            await expect(await studio.confirmationDialog).toBeVisible();
            await studio.discardDialog.click();
            await expect(await editor.panel).not.toBeVisible();
        });

        await test.step('step-6: Open the editor and validate there are no changes', async () => {
            await expect(await promotedplans.cardDescription).toContainText(data.description);
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await editor.description).toContainText(data.description);
        });
    });

    // @studio-promoted-plans-discard-edited-analytics-ids - Validate discard edited analytics IDs for promoted plans card in mas studio
    test(`${features[4].name},${features[4].tags}`, async ({ page, baseURL }) => {
        const { data } = features[4];
        const testPage = `${baseURL}${features[4].path}${miloLibs}${features[4].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit analytics IDs', async () => {
            await expect(await editor.footer.locator(editor.linkEdit)).toBeVisible();
            await expect(await editor.CTA.nth(2)).toBeVisible();
            await editor.CTA.nth(2).click();
            await editor.footer.locator(editor.linkEdit).click();
            await expect(await editor.analyticsId).toBeVisible();
            await expect(await editor.linkSave).toBeVisible();
            await expect(await editor.analyticsId).toContainText(data.analyticsID);
            await editor.analyticsId.click();
            await page.getByRole('option', { name: data.newAnalyticsID }).click();
            await editor.linkSave.click();
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await editor.closeEditor.click();
            await expect(await studio.confirmationDialog).toBeVisible();
            await studio.discardDialog.click();
            await expect(await editor.panel).not.toBeVisible();
        });

        await test.step('step-5: Verify there is no changes of the card', async () => {
            await expect(await promotedplans.cardCTA.nth(1)).toHaveAttribute('data-analytics-id', data.analyticsID);
            // await expect(await promotedplans.cardCTA.nth(1)).toHaveAttribute(
            //     'daa-ll',
            //     data.daaLL
            // );
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('daa-lh', data.daaLH);
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
            await editor.CTA.nth(2).click();
            await editor.footer.locator(editor.linkEdit).click();
            await expect(await editor.analyticsId).toContainText(data.analyticsID);
        });
    });
});
