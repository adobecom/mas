import { expect, test } from '@playwright/test';
import StudioPage from '../../../studio.page.js';
import EditorPage from '../../../editor.page.js';
import AHPromotedPlansSpec from '../specs/promoted_plans_discard.spec.js';
import AHPromotedPlansPage from '../promoted-plans.page.js';
import WebUtil from '../../../../libs/webutil.js';

const { features } = AHPromotedPlansSpec;
const miloLibs = process.env.MILO_LIBS || '';

let studio;
let editor;
let promotedplans;
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
    webUtil = new WebUtil(page);
});

test.describe('M@S Studio AHome Promoted Plans Discard test suite', () => {
    // @studio-promoted-plans-discard-title - Validate discarding title changes for promoted plans card
    test(`${features[0].name},${features[0].tags}`, async ({
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

        await test.step('step-3: Verify current title', async () => {
            await expect(await promotedplans.cardTitle).toBeVisible();
            await expect(await promotedplans.cardTitle).toHaveText(data.title);
            await expect(await editor.panel.locator(editor.title)).toHaveValue(
                data.title,
            );
        });

        await test.step('step-4: Update the title', async () => {
            await editor.panel.locator(editor.title).fill(data.newTitle);
            await page.waitForTimeout(2000);

            await expect(await promotedplans.cardTitle).toHaveText(
                data.newTitle,
            );
        });

        await test.step('step-5: Discard changes', async () => {
            await editor.panel.locator(editor.closeEditor).click();
            await expect(await studio.confirmationDialog).toBeVisible();
            await studio.confirmationDialog
                .locator(studio.discardDialog)
                .click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-6: Verify title reverted', async () => {
            await expect(await promotedplans.cardTitle).toHaveText(data.title);
        });
    });

    // @studio-promoted-plans-discard-gradient-border - Validate discarding gradient border changes
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

        await test.step('step-3: Change to Transparent border', async () => {
            await expect(
                await editor.panel.locator(editor.borderColor),
            ).toBeVisible();

            await editor.panel.locator(editor.borderColor).click();
            await page
                .getByRole('option', { name: data.transparentBorderColor })
                .click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Discard changes', async () => {
            await editor.panel.locator(editor.closeEditor).click();
            await expect(await studio.confirmationDialog).toBeVisible();
            await studio.confirmationDialog
                .locator(studio.discardDialog)
                .click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-5: Verify border reverted', async () => {
            const card = await studio.getCard(data.cardid, 'ah-promoted-plans');
            const borderColor = await card.getAttribute('border-color');
            expect(borderColor).toBe(data.gradientBorderCSSColor);
        });
    });

    // @studio-promoted-plans-discard-edit-cta-variant - Validate discarding CTA variant changes
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

        await test.step('step-3: Edit CTA variant', async () => {
            await expect(
                await editor.panel
                    .locator(editor.footer)
                    .locator(editor.linkEdit),
            ).toBeVisible();
            await expect(await editor.CTA.nth(2)).toBeVisible();
            await expect(await editor.CTA.nth(2)).toHaveClass(data.variant);
            await editor.CTA.nth(1).click();
            await editor.panel
                .locator(editor.footer)
                .locator(editor.linkEdit)
                .click();
            await expect(await editor.linkVariant).toBeVisible();
            await expect(await editor.linkSave).toBeVisible();

            // Get the variant button and click it
            const variantButton = await editor.getLinkVariant(data.newVariant);
            await expect(variantButton).toBeVisible();
            await variantButton.click();

            await editor.linkSave.click();
            await page.waitForTimeout(5000);
            await expect(await editor.CTA.nth(1)).toHaveClass(data.newVariant);

            // Revert back to original variant
            await editor.CTA.nth(1).click();
            await editor.panel
                .locator(editor.footer)
                .locator(editor.linkEdit)
                .click();
            await expect(await editor.linkVariant).toBeVisible();

            const originalVariantButton = await editor.getLinkVariant(
                data.variant,
            );
            await expect(originalVariantButton).toBeVisible();
            await originalVariantButton.click();

            await editor.linkSave.click();
            await page.waitForTimeout(5000);
            await expect(await editor.CTA.nth(2)).toHaveClass(data.variant);
            await expect(await editor.CTA.nth(2)).not.toHaveClass(
                data.newVariant,
            );
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await editor.panel.locator(editor.closeEditor).click();
            await expect(
                await editor.panel.locator(studio.confirmationDialog),
            ).toBeVisible();
            await editor.panel.locator(studio.discardDialog).click();
            await expect(await editor.panel).not.toBeVisible();
        });

        await test.step('step-5: Open the editor and validate there are no changes', async () => {
            await (
                await studio.getCard(data.cardid, 'ah-promoted-plans')
            ).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await editor.CTA.nth(2)).toBeVisible();
            await expect(await editor.CTA.nth(2)).toHaveClass(data.variant);
        });
    });

    // @studio-promoted-plans-discard-edit-description - Validate discarding description changes
    test(`${features[4].name},${features[4].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[4];
        const testPage = `${baseURL}${features[4].path}${miloLibs}${features[4].browserParams}${data.cardid}`;
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

        await test.step('step-3: Verify current description', async () => {
            await expect(await promotedplans.cardDescription).toBeVisible();
            const descriptionText =
                await promotedplans.cardDescription.textContent();
            expect(descriptionText.trim()).toBe(data.description);
        });

        await test.step('step-4: Update description', async () => {
            await expect(
                await editor.panel.locator(editor.description),
            ).toBeVisible();

            const currentHTML = await editor.panel
                .locator(editor.description)
                .innerHTML();

            const updatedHTML = currentHTML.replace(
                data.description,
                data.newDescription,
            );

            await editor.panel
                .locator(editor.description)
                .evaluate((el, html) => {
                    el.innerHTML = html;
                    const event = new Event('change', { bubbles: true });
                    el.dispatchEvent(event);
                }, updatedHTML);

            await page.waitForTimeout(2000);

            await expect(await promotedplans.cardDescription).toBeVisible();
            const updatedDescriptionText =
                await promotedplans.cardDescription.textContent();
            expect(updatedDescriptionText.trim()).toBe(data.newDescription);
        });

        await test.step('step-5: Discard changes', async () => {
            await editor.panel.locator(editor.closeEditor).click();
            await expect(await studio.confirmationDialog).toBeVisible();
            await studio.confirmationDialog
                .locator(studio.discardDialog)
                .click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-6: Verify description reverted', async () => {
            await expect(await promotedplans.cardDescription).toBeVisible();
            const descriptionText =
                await promotedplans.cardDescription.textContent();
            expect(descriptionText.trim()).toBe(data.description);
        });
    });
});
