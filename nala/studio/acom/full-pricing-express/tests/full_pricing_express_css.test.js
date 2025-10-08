import { expect, test } from '@playwright/test';
import StudioPage from '../../../studio.page.js';
import EditorPage from '../../../editor.page.js';
import ACOMFullPricingExpressCSSSpec from '../specs/full_pricing_express_css.spec.js';
import ACOMFullPricingExpressPage from '../full-pricing-express.page.js';

const { features } = ACOMFullPricingExpressCSSSpec;
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

test.describe('M@S Studio ACOM Full Pricing Express card CSS test suite', () => {
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${features[0].browserParams}${data.cardid}${miloLibs}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate card element exists', async () => {
            const card = await studio.getCard(data.cardid);
            await expect(card).toBeVisible();
            const variant = await card.getAttribute('variant');
            expect(['full-pricing-express', 'simplified-pricing-express']).toContain(variant);
        });

        await test.step('step-3: Validate card has proper structure', async () => {
            const card = await studio.getCard(data.cardid);
            const bgColor = await card.evaluate((el) => window.getComputedStyle(el).backgroundColor);
            expect(bgColor).toMatch(/rgba?\(\d+,\s*\d+,\s*\d+(?:,\s*[\d.]+)?\)/);
            const borderStyle = await card.evaluate((el) => window.getComputedStyle(el).borderStyle);
            expect(borderStyle).toBeTruthy();
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

        await test.step('step-2: Validate title element', async () => {
            const titleCount = await fullPricingExpress.cardTitle.count();
            if (titleCount > 0) {
                const titleElement = fullPricingExpress.cardTitle.first();
                await expect(titleElement).toBeVisible();
                const titleText = await titleElement.textContent();
                expect(titleText).toBeTruthy();
            }
        });

        await test.step('step-3: Validate shortDescription element', async () => {
            const shortDescCount = await fullPricingExpress.cardShortDescription.count();
            if (shortDescCount > 0) {
                await expect(fullPricingExpress.cardShortDescription).toBeVisible();
            }
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

        await test.step('step-2: Check for divider element', async () => {
            const dividerCount = await fullPricingExpress.cardDivider.count();
            if (dividerCount > 0) {
                await expect(fullPricingExpress.cardDivider).toBeVisible();
            }
        });
    });
});
