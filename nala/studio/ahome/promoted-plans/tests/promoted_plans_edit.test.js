import { expect, test } from '@playwright/test';
import StudioPage from '../../../studio.page.js';
import EditorPage from '../../../editor.page.js';
import AHPromotedPlansSpec from '../specs/promoted_plans_edit.spec.js';
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
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Validate fields rendering', async () => {
            await expect(await editor.variant).toBeVisible();
            await expect(await editor.variant).toHaveAttribute('default-value', 'ah-promoted-plans');
            await expect(await editor.size).toBeVisible();
            await expect(await editor.title).toBeVisible();
            await expect(await editor.description).toBeVisible();
            await expect(await editor.borderColor).toBeVisible();
            await expect(await editor.backgroundColor).toBeVisible();
            await expect(await editor.promoText).toBeVisible();
            await expect(await editor.prices).toBeVisible();
            await expect(await editor.footer).toBeVisible();
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
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Enter long string in title field', async () => {
            await expect(await editor.title).toBeVisible();
            await editor.title.click();
            await page.waitForTimeout(2000);
            await expect(await editor.title).toHaveValue(
                data.oldTitle,
            );
            await editor.title.fill(data.updatedTitle);
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Validate title truncation in card', async () => {
            await expect(await promotedplans.cardTitle).toBeVisible();
            await expect(await promotedplans.cardTitle).toHaveText(
                data.newTitle,
            );
        });

        await test.step('step-5: Edit the original title back', async () => {
            await editor.title.fill(data.oldTitle);
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
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit border color field to gradient', async () => {
            await expect(await editor.borderColor).toBeVisible();

            await editor.borderColor.click();
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
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Update description field', async () => {
            await expect(await editor.description).toBeVisible();

            // Get the current HTML from the editor
            const currentHTML = await editor.description.innerHTML();

            // Create updated HTML
            let updatedHTML = currentHTML.replace(
                data.description,
                data.updatedDescription,
            );

            // Set the updated HTML in the editor
            await editor.description.evaluate((el, html) => {
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
            const currentHTML = await editor.description.innerHTML();

            // Create restored HTML
            let restoredHTML = currentHTML.replace(
                data.updatedDescription,
                data.description,
            );

            // Set the restored HTML in the editor
            await editor.description.evaluate((el, html) => {
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
