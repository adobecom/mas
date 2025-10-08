import { expect, test } from '@playwright/test';
import StudioPage from '../../../studio.page.js';
import EditorPage from '../../../editor.page.js';
import ACOMFullPricingExpressSpec from '../specs/full_pricing_express_discard.spec.js';
import ACOMFullPricingExpressPage from '../full-pricing-express.page.js';

const { features } = ACOMFullPricingExpressSpec;
const miloLibs = process.env.MILO_LIBS || '';

let studio;
let editor;
let fullPricingExpress;

test.beforeEach(async ({ page, browserName }) => {
    test.slow();
    if (browserName === 'chromium') {
        await page.setExtraHTTPHeaders({
            'sec-ch-ua': '"Chromium";v="123", "Not:A-Brand";v="8"',
        });
    }
    studio = new StudioPage(page);
    editor = new EditorPage(page);
    fullPricingExpress = new ACOMFullPricingExpressPage(page);
});

test.describe('M@S Studio ACOM Full Pricing Express card discard test suite', () => {
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${features[0].browserParams}${data.cardid}${miloLibs}`;
        console.info('[Test Page]: ', testPage);

        let originalTitle;

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            const card = await studio.getCard(data.cardid);
            await expect(card).toBeVisible();
            const variant = await card.getAttribute('variant');
            expect(['full-pricing-express', 'simplified-pricing-express']).toContain(variant);
            await card.dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit title field', async () => {
            await expect(await editor.title).toBeVisible();
            originalTitle = await editor.title.textContent();
            await editor.title.fill(data.newTitle);
            await expect(await editor.title).toContainText(data.newTitle);
            await expect(await fullPricingExpress.cardTitle).toContainText(data.newTitle);
        });

        await test.step('step-4: Discard changes', async () => {
            await expect(await editor.discardButton).toBeVisible();
            await expect(await editor.discardButton).toBeEnabled();
            await editor.discardButton.click();
        });

        await test.step('step-5: Validate discard confirmation dialog', async () => {
            await expect(await editor.discardConfirmDialog).toBeVisible();
            await expect(await editor.discardConfirmDialog).toContainText(data.discardDialogText);
            await expect(await editor.discardConfirmButton).toBeVisible();
            await expect(await editor.cancelDiscardButton).toBeVisible();
        });

        await test.step('step-6: Confirm discard', async () => {
            await editor.discardConfirmButton.click();
            await page.waitForTimeout(1000);
        });

        await test.step('step-7: Validate changes are reverted', async () => {
            await expect(await editor.title).toContainText(originalTitle);
            await expect(await fullPricingExpress.cardTitle).toContainText(originalTitle);
            await expect(await editor.discardButton).toBeDisabled();
        });
    });

    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${features[1].browserParams}${data.cardid}${miloLibs}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            const card = await studio.getCard(data.cardid);
            await expect(card).toBeVisible();
            const variant = await card.getAttribute('variant');
            expect(['full-pricing-express', 'simplified-pricing-express']).toContain(variant);
            await card.dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit shortDescription field', async () => {
            await expect(await editor.shortDescription).toBeVisible();
            await expect(await editor.shortDescription).toContainText(data.shortDescription);
            await editor.shortDescription.fill(data.newShortDescription);
            await expect(await editor.shortDescription).toContainText(data.newShortDescription);
        });

        await test.step('step-4: Discard and validate', async () => {
            await editor.discardButton.click();
            await editor.discardConfirmButton.click();
            await page.waitForTimeout(1000);
            await expect(await editor.shortDescription).toContainText(data.shortDescription);
            await expect(await fullPricingExpress.cardShortDescription).toContainText(data.shortDescription);
        });
    });

    test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
        const { data } = features[2];
        const testPage = `${baseURL}${features[2].path}${features[2].browserParams}${data.cardid}${miloLibs}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            const card = await studio.getCard(data.cardid);
            await expect(card).toBeVisible();
            const variant = await card.getAttribute('variant');
            expect(['full-pricing-express', 'simplified-pricing-express']).toContain(variant);
            await card.dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Make a change', async () => {
            await editor.title.fill(data.newTitle);
            await expect(await editor.discardButton).toBeEnabled();
        });

        await test.step('step-4: Validate confirmation dialog elements', async () => {
            await editor.discardButton.click();
            await expect(await editor.discardConfirmDialog).toBeVisible();
            await expect(await editor.discardConfirmDialog).toContainText(data.discardDialogText);
            await expect(await editor.discardConfirmButton).toBeVisible();
            await expect(await editor.discardConfirmButton).toContainText('Discard');
            await expect(await editor.cancelDiscardButton).toBeVisible();
            await expect(await editor.cancelDiscardButton).toContainText('Cancel');
        });

        await test.step('step-5: Confirm discard and validate', async () => {
            await editor.discardConfirmButton.click();
            await expect(await editor.discardConfirmDialog).not.toBeVisible();
            await expect(await editor.title).toContainText(data.title);
        });
    });
});
