import { expect, test } from '@playwright/test';
import StudioPage from '../../../studio.page.js';
import EditorPage from '../../../editor.page.js';
import ACOMFullPricingExpressSpec from '../specs/full_pricing_express_edit.spec.js';
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

test.describe('M@S Studio ACOM Full Pricing Express card test suite', () => {
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${features[0].browserParams}${data.cardid}${miloLibs}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);
        });

        await test.step('step-2: Open card editor', async () => {
            const card = await studio.getCard(data.cardid);
            await expect(card).toBeVisible({ timeout: 10000 });
            const variant = await card.getAttribute('variant');
            expect(['full-pricing-express', 'simplified-pricing-express']).toContain(variant);
            await card.dblclick();
            await page.waitForTimeout(1000);
            await expect(await editor.panel).toBeVisible({ timeout: 10000 });
        });

        await test.step('step-3: Edit title field', async () => {
            await expect(await editor.title).toBeVisible({ timeout: 10000 });
            await editor.title.fill(data.newTitle);
        });

        await test.step('step-4: Validate title field updated', async () => {
            await expect(await editor.title).toContainText(data.newTitle);
            await expect(await fullPricingExpress.cardTitle).toContainText(data.newTitle);
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
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit mnemonic URL field', async () => {
            await expect(await editor.iconURL).toBeVisible();
            await expect(await editor.iconURL).toHaveValue(data.iconURL);
            await editor.iconURL.fill(data.newIconURL);
        });

        await test.step('step-4: Validate mnemonic field updated', async () => {
            await expect(await editor.iconURL).toHaveValue(data.newIconURL);
            await expect(await fullPricingExpress.cardIconsSlot).toHaveAttribute('src', data.newIconURL);
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
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit shortDescription field', async () => {
            await expect(await editor.shortDescription).toBeVisible();
            await expect(await editor.shortDescription).toContainText(data.shortDescription);
            await editor.shortDescription.fill(data.newShortDescription);
        });

        await test.step('step-4: Validate shortDescription field updated', async () => {
            await expect(await editor.shortDescription).toContainText(data.newShortDescription);
            await expect(await fullPricingExpress.cardShortDescription).toContainText(data.newShortDescription);
        });
    });

    test(`${features[3].name},${features[3].tags}`, async ({ page, baseURL }) => {
        const { data } = features[3];
        const testPage = `${baseURL}${features[3].path}${features[3].browserParams}${data.cardid}${miloLibs}`;
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
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit CTA label', async () => {
            await expect(await editor.footer.locator(editor.linkEdit)).toBeVisible();
            await expect(await editor.CTA).toBeVisible();
            await expect(await editor.footer).toContainText(data.ctaText);
            await editor.CTA.click();
            await editor.footer.locator(editor.linkEdit).click();
            await expect(await editor.linkText).toBeVisible();
            await expect(await editor.linkSave).toBeVisible();
            await expect(await editor.linkText).toHaveValue(data.ctaText);
            await editor.linkText.fill(data.newCtaText);
            await editor.linkSave.click();
        });

        await test.step('step-4: Validate edited CTA label in Editor panel', async () => {
            await expect(await editor.footer).toContainText(data.newCtaText);
        });

        await test.step('step-5: Validate edited CTA on the card', async () => {
            await expect(await fullPricingExpress.cardCTA).toContainText(data.newCtaText);
        });
    });
});
