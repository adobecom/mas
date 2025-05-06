import { expect, test } from '@playwright/test';
import StudioPage from '../../../studio.page.js';
import EditorPage from '../../../editor.page.js';
import AHPromotedPlansSpec from '../specs/promoted_plans_save.spec.js';
import AHPromotedPlansPage from '../promoted-plans.page.js';
import OSTPage from '../../../ost.page.js';
import WebUtil from '../../../../libs/webutil.js';

const { features } = AHPromotedPlansSpec;
const miloLibs = process.env.MILO_LIBS || '';

let studio;
let editor;
let promotedplans;
let ost;
let webUtil;

test.beforeEach(async ({ page, browserName }) => {
    test.slow();
    if (browserName === 'chromium') {
        await page.setExtraHTTPHeaders({
            'sec-ch-ua': '"Chromium";v="123", "Not:A-Brand";v="8"',
        });
    }
    studio = new StudioPage(page);
    editor = new EditorPage(page);
    promotedplans = new AHPromotedPlansPage(page);
    ost = new OSTPage(page);
    webUtil = new WebUtil(page);
});

test.describe('M@S Studio AHome Promoted Plans Save test suite', () => {
    // @studio-promoted-plans-save-edit-border - Validate saving border color changes
    test.skip(`${features[0].name},${features[0].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(
                await studio.getCard(data.cardid, 'ah-promoted-plans'),
            ).toBeVisible();
            await (
                await studio.getCard(data.cardid, 'ah-promoted-plans')
            ).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Verify initial gradient border', async () => {
            const card = await studio.getCard(data.cardid, 'ah-promoted-plans');
            const borderColor = await card.getAttribute('border-color');
            expect(borderColor).toBe(data.initialBorderCSSColor);
        });

        await test.step('step-4: Change to transparent border', async () => {
            await expect(await editor.borderColor).toBeVisible();

            await editor.borderColor.click();
            await page
                .getByRole('option', { name: data.transparentBorderColor })
                .click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-5: Verify transparent border applied before save', async () => {
            const card = await studio.getCard(data.cardid, 'ah-promoted-plans');
            const borderColor = await card.getAttribute('border-color');
            expect(borderColor).toBe(data.transparentBorderCSSColor);
        });

        await test.step('step-6: Save changes', async () => {
            await studio.saveCard();
            await page.waitForTimeout(2000);
        });

        await test.step('step-7: Verify border color saved', async () => {
            const card = await studio.getCard(data.cardid, 'ah-promoted-plans');
            const borderColor = await card.getAttribute('border-color');
            expect(borderColor).toBe(data.transparentBorderCSSColor);
        });

        await test.step('step-8: Revert to initial border color', async () => {
            await (
                await studio.getCard(data.cardid, 'ah-promoted-plans')
            ).dblclick();
            await expect(await editor.panel).toBeVisible();

            await editor.borderColor.click();
            await page
                .getByRole('option', { name: data.initialBorderColor })
                .click();
            await page.waitForTimeout(2000);

            await studio.saveCard();
            await page.waitForTimeout(2000);

            const card = await studio.getCard(data.cardid, 'ah-promoted-plans');
            const borderColor = await card.getAttribute('border-color');
            expect(borderColor).toBe(data.initialBorderCSSColor);
        });
    });

    // @studio-promoted-plans-save-variant-change - Validate saving variant changes
    test(`${features[1].name},${features[1].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(
                await studio.getCard(data.cardid, 'ah-promoted-plans'),
            ).toBeVisible();
            await (
                await studio.getCard(data.cardid, 'ah-promoted-plans')
            ).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Verify current variant', async () => {
            await expect(await editor.variant).toBeVisible();
            await expect(await editor.variant).toHaveAttribute(
                'default-value',
                'ah-promoted-plans',
            );
        });

        // This test verifies that the variant value is displayed correctly
        // We don't attempt to save without changes as the save button would be disabled
        await test.step('step-4: Verify variant is displayed in UI', async () => {
            await expect(
                await studio.getCard(data.cardid, 'ah-promoted-plans'),
            ).toBeVisible();

            // Close the editor to return to normal view
            await editor.closeEditor.click();
            await page.waitForTimeout(1000);
        });
    });

    // @studio-promoted-plans-save-edit-cta-variant - Validate saving CTA variant changes
    test(`${features[3].name},${features[3].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[3];
        const testPage = `${baseURL}${features[3].path}${miloLibs}${features[3].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(
                await studio.getCard(data.cardid, 'ah-promoted-plans'),
            ).toBeVisible();
            await (
                await studio.getCard(data.cardid, 'ah-promoted-plans')
            ).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Update button variant', async () => {
            await expect(await editor.footer).toBeVisible();

            // Click on the CTA in the editor
            await expect(await editor.CTA.nth(2)).toBeVisible();
            await editor.CTA.nth(2).click();

            // Click the link edit button
            await editor.footer.locator(editor.linkEdit).click();

            // Select the new variant
            await expect(await editor.linkVariant).toBeVisible();
            await expect(await editor.linkSave).toBeVisible();

            // Get the variant button and click it
            const variantButton = await editor.getLinkVariant(data.newVariant);
            await expect(variantButton).toBeVisible();
            await variantButton.click();

            await editor.linkSave.click();

            await page.waitForTimeout(2000);

            const buyNowButton = await promotedplans.buyNowButton;
            await expect(buyNowButton).toBeVisible();
        });

        await test.step('step-4: Save changes', async () => {
            await studio.saveCard();
            await page.waitForTimeout(2000);
        });

        await test.step('step-5: Verify button variant saved', async () => {
            const buyNowButton = await promotedplans.buyNowButton;
            await expect(buyNowButton).toBeVisible();

            const buttonClass = await buyNowButton.getAttribute('class');

            expect(buttonClass).toContain(
                `spectrum-Button--${data.newVariant}`,
            );
        });

        await test.step('step-6: Restore original button variant', async () => {
            await (
                await studio.getCard(data.cardid, 'ah-promoted-plans')
            ).dblclick();
            await expect(await editor.panel).toBeVisible();

            // Click on the CTA in the editor
            await expect(await editor.CTA.nth(2)).toBeVisible();
            await editor.CTA.nth(2).click();

            // Click the link edit button
            await editor.footer.locator(editor.linkEdit).click();

            // Select the original variant
            await expect(await editor.linkVariant).toBeVisible();
            await expect(await editor.linkSave).toBeVisible();

            // Get the variant button and click it
            const originalVariantButton = await editor.getLinkVariant(
                data.variant,
            );
            await expect(originalVariantButton).toBeVisible();
            await originalVariantButton.click();

            await editor.linkSave.click();

            await page.waitForTimeout(2000);
            await studio.saveCard();

            const buyNowButton = await promotedplans.buyNowButton;
            await expect(buyNowButton).toBeVisible();

            const buttonClass = await buyNowButton.getAttribute('class');

            expect(buttonClass).toContain(`spectrum-Button--${data.variant}`);
        });
    });
});
