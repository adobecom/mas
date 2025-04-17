import { expect, test } from '@playwright/test';
import StudioPage from '../../../studio.page.js';
import AHPromotedPlansSpec from '../specs/promoted_plans_edit.spec.js';
import AHPromotedPlansPage from '../promoted-plans.page.js';
import OSTPage from '../../../ost.page.js';
import WebUtil from '../../../../libs/webutil.js';

const { features } = AHPromotedPlansSpec;
const miloLibs = process.env.MILO_LIBS || '';

let studio;
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
    promotedplans = new AHPromotedPlansPage(page);
    ost = new OSTPage(page);
    webUtil = new WebUtil(page);
});

test.describe('M@S Studio AHome Promoted Plans card test suite', () => {
    // @studio-promoted-plans-editor - Validate editor fields for promoted plans card in mas studio
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
            await expect(await studio.editorPanel).toBeVisible();
        });

        await test.step('step-3: Validate fields rendering', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorVariant),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorVariant),
            ).toHaveAttribute('default-value', 'ah-promoted-plans');
            await expect(
                await studio.editorPanel.locator(studio.editorSize),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorTitle),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorDescription),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorBorderColor),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorBackgroundColor),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorPromoText),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorPrices),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorFooter),
            ).toBeVisible();
        });
    });

    // @studio-promoted-plans-edit-title - Validate editing title for promoted plans card in mas studio
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
            await expect(await studio.editorPanel).toBeVisible();
        });

        await test.step('step-3: Enter long string in title field', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorTitle),
            ).toBeVisible();
            await studio.editorPanel.locator(studio.editorTitle).click();
            await page.waitForTimeout(2000);
            await expect(
                await studio.editorPanel.locator(studio.editorTitle),
            ).toHaveValue(data.oldTitle);
            await studio.editorPanel
                .locator(studio.editorTitle)
                .fill(data.updatedTitle);
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Validate title truncation in card', async () => {
            await expect(await promotedplans.cardTitle).toBeVisible();
            await expect(await promotedplans.cardTitle).toHaveText(
                data.newTitle,
            );
        });

        await test.step('step-5: Edit the original title back', async () => {
            await studio.editorPanel
                .locator(studio.editorTitle)
                .fill(data.oldTitle);
            await page.waitForTimeout(2000);
        });

        await test.step('step-6: Validate original title in card', async () => {
            await expect(await promotedplans.cardTitle).toBeVisible();
            await expect(await promotedplans.cardTitle).toHaveText(
                data.oldTitle,
            );
        });
    });

    // @studio-promoted-plans-edit-gradient-border - Validate editing gradient border color for promoted plans card
    test(`${features[2].name},${features[2].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[2];
        const testPage = `${baseURL}${features[2].path}${miloLibs}${features[2].browserParams}${data.cardid}`;
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
            await expect(await studio.editorPanel).toBeVisible();
        });

        await test.step('step-3: Edit border color field to gradient', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorBorderColor),
            ).toBeVisible();

            await studio.editorPanel.locator(studio.editorBorderColor).click();
            await page
                .getByRole('option', { name: data.gradientBorderColor })
                .click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Validate gradient border applied to card', async () => {
            await expect(await promotedplans.cardBorderGradient).toBeVisible();

            const borderColor = await (
                await studio.getCard(data.cardid, 'ah-promoted-plans')
            ).getAttribute('border-color');

            expect(borderColor).toBe(data.gradientBorderCSSColor);
        });
    });

    // @studio-promoted-plans-edit-description - Validate editing description for promoted plans card
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
            await expect(await studio.editorPanel).toBeVisible();
        });

        await test.step('step-3: Update description field', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorDescription),
            ).toBeVisible();

            // Get the current HTML from the editor
            const currentHTML = await studio.editorPanel
                .locator(studio.editorDescription)
                .innerHTML();

            // Create updated HTML
            let updatedHTML = currentHTML.replace(
                data.description,
                data.updatedDescription,
            );

            // Set the updated HTML in the editor
            await studio.editorPanel
                .locator(studio.editorDescription)
                .evaluate((el, html) => {
                    el.innerHTML = html;
                    const event = new Event('change', { bubbles: true });
                    el.dispatchEvent(event);
                }, updatedHTML);

            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Validate updated description in card', async () => {
            await expect(await promotedplans.cardDescription).toBeVisible();
            const descriptionText =
                await promotedplans.cardDescription.textContent();
            expect(descriptionText.trim()).toBe(data.updatedDescription);
        });

        await test.step('step-5: Restore original description', async () => {
            // Get the current HTML from the editor
            const currentHTML = await studio.editorPanel
                .locator(studio.editorDescription)
                .innerHTML();

            // Create restored HTML
            let restoredHTML = currentHTML.replace(
                data.updatedDescription,
                data.description,
            );

            // Set the restored HTML in the editor
            await studio.editorPanel
                .locator(studio.editorDescription)
                .evaluate((el, html) => {
                    el.innerHTML = html;
                    const event = new Event('change', { bubbles: true });
                    el.dispatchEvent(event);
                }, restoredHTML);

            await page.waitForTimeout(2000);
        });

        await test.step('step-6: Validate original description restored in card', async () => {
            await expect(await promotedplans.cardDescription).toBeVisible();
            const descriptionText =
                await promotedplans.cardDescription.textContent();
            expect(descriptionText.trim()).toBe(data.description);
        });
    });
});
