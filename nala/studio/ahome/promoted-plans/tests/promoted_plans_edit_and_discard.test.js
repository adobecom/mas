import { expect, test } from '@playwright/test';
import StudioPage from '../../../studio.page.js';
import EditorPage from '../../../editor.page.js';
import AHPromotedPlansSpec from '../specs/promoted_plans_edit_and_discard.spec.js';
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
    // @studio-promoted-plans-edit-and-discard-title - Validate editing and discarding title for promoted plans card
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
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ah-promoted-plans');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Enter long string in title field', async () => {
            await expect(await editor.title).toBeVisible();
            await expect(await editor.title).toHaveValue(data.title.original);
            await editor.title.fill(data.title.updated);
        });

        await test.step('step-4: Validate title truncation in card', async () => {
            await expect(await editor.title).toHaveValue(data.title.updated);
            await expect(await promotedplans.cardTitle).toHaveText(data.title.truncated);
        });

        await test.step('step-5: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-6: Validate title field not updated', async () => {
            await expect(await promotedplans.cardTitle).toHaveText(data.title.original);
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await editor.title).toHaveValue(data.title.original);
        });
    });

    // @studio-promoted-plans-edit-and-discard-gradient-border - Validate editing and discarding gradient border
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);
        const promotedPlansCard = await studio.getCard(data.cardid);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(promotedPlansCard).toBeVisible();
            await expect(promotedPlansCard).toHaveAttribute('variant', 'ah-promoted-plans');
            await promotedPlansCard.dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit border color field', async () => {
            await expect(await editor.borderColor).toBeVisible();
            await expect(await editor.borderColor).toContainText(data.standardBorder.color);
            await expect(promotedPlansCard).toHaveAttribute('border-color', data.standardBorder.cssColor);
            await editor.borderColor.click();
            await page.waitForSelector(`sp-menu-item[value="${data.gradientBorder.value}"]`, {
                state: 'visible',
            });
            await page.locator(`sp-menu-item[value="${data.gradientBorder.value}"]`).first().click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Validate border color applied to card', async () => {
            await expect(await editor.borderColor).toContainText(data.gradientBorder.color);
            await expect(promotedPlansCard).toHaveAttribute('border-color', data.gradientBorder.cssColor);
            await expect(promotedPlansCard).toHaveAttribute('gradient-border', 'true');
        });

        await test.step('step-5: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-6: Verify border reverted', async () => {
            await expect(promotedPlansCard).toHaveAttribute('border-color', data.standardBorder.cssColor);
            await promotedPlansCard.dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await editor.borderColor).toContainText(data.standardBorder.color);
        });
    });

    // @studio-promoted-plans-edit-and-discard-description - Validate editing and discarding description
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
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ah-promoted-plans');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Update description field', async () => {
            await expect(await editor.description).toBeVisible();
            await expect(await editor.description).toContainText(data.description.original);
            await editor.description.fill(data.description.updated);
        });

        await test.step('step-4: Validate updated description field updated', async () => {
            await expect(await editor.description).toContainText(data.description.updated);
            await expect(await promotedplans.cardDescription).toContainText(data.description.updated);
        });

        await test.step('step-5: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-6: Open the editor and validate there are no changes', async () => {
            await expect(await promotedplans.cardDescription).toContainText(data.description.original);
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await editor.description).toContainText(data.description.original);
        });
    });

    // @studio-promoted-plans-edit-and-discard-analytics-ids - Validate editing and discarding analytics IDs
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
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ah-promoted-plans');
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

            await expect(await editor.analyticsId).toContainText(data.analyticsID.original);
            await expect(await promotedplans.cardCTA.nth(1)).toHaveAttribute('data-analytics-id', data.analyticsID.original);
            // await expect(await promotedplans.cardCTA.nth(1)).toHaveAttribute(
            //     'daa-ll',
            //     data.daaLL.original
            // );
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('daa-lh', data.daaLH);

            await editor.analyticsId.click();
            await page.getByRole('option', { name: data.analyticsID.updated }).click();
            await editor.linkSave.click();
        });

        await test.step('step-4: Validate edited analytics IDs on the card', async () => {
            await expect(await promotedplans.cardCTA.nth(1)).toHaveAttribute('data-analytics-id', data.analyticsID.updated);
            // await expect(await promotedplans.cardCTA.nth(1)).toHaveAttribute(
            //     'daa-ll',
            //     data.daaLL.updated
            // );
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('daa-lh', data.daaLH);
        });

        await test.step('step-5: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-6: Verify there is no changes of the card', async () => {
            await expect(await promotedplans.cardCTA.nth(1)).toHaveAttribute('data-analytics-id', data.analyticsID.original);
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('daa-lh', data.daaLH);
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
            await editor.CTA.nth(2).click();
            await editor.footer.locator(editor.linkEdit).click();
            await expect(await editor.analyticsId).toContainText(data.analyticsID.original);
        });
    });
});
