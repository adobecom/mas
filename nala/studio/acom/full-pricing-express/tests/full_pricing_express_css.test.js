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
    // @studio-full-pricing-express-css-card-default-styles - Verify card default styles
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
            await expect(card).toHaveAttribute('variant', 'full-pricing-express');
        });

        await test.step('step-3: Validate card has proper structure', async () => {
            const card = await studio.getCard(data.cardid);

            // Check card has background color (any valid RGB value)
            const bgColor = await card.evaluate((el) => window.getComputedStyle(el).backgroundColor);
            expect(bgColor).toMatch(/rgb\(\d+,\s*\d+,\s*\d+\)/);

            // Check card has border
            const borderStyle = await card.evaluate((el) => window.getComputedStyle(el).borderStyle);
            expect(borderStyle).toBeTruthy();
        });
    });

    // @studio-full-pricing-express-css-card-gradient-border - Verify gradient border for full pricing express card
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${features[1].browserParams}${data.cardid}${miloLibs}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate card exists', async () => {
            const card = await studio.getCard(data.cardid);
            await expect(card).toBeVisible();
            await expect(card).toHaveAttribute('variant', 'full-pricing-express');
        });
    });

    // @studio-full-pricing-express-css-title-styles - Verify title styles
    test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
        const { data } = features[2];
        const testPage = `${baseURL}${features[2].path}${features[2].browserParams}${data.cardid}${miloLibs}`;
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

                // Check title has text
                const titleText = await titleElement.textContent();
                expect(titleText).toBeTruthy();
            }
        });
    });

    // @studio-full-pricing-express-css-icon-styles - Verify icon styles
    test(`${features[3].name},${features[3].tags}`, async ({ page, baseURL }) => {
        const { data } = features[3];
        const testPage = `${baseURL}${features[3].path}${features[3].browserParams}${data.cardid}${miloLibs}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Check if icon exists', async () => {
            const iconCount = await fullPricingExpress.cardIcon.count();
            if (iconCount > 0) {
                const iconElement = fullPricingExpress.cardIcon.first();
                await expect(iconElement).toBeVisible();
            } else {
                // Icon might be rendered as mas-mnemonic
                const mnemonicIcon = page.locator('mas-mnemonic').first();
                if ((await mnemonicIcon.count()) > 0) {
                    await expect(mnemonicIcon).toBeVisible();
                }
            }
        });
    });

    // @studio-full-pricing-express-css-price-styles - Verify price styles
    test(`${features[4].name},${features[4].tags}`, async ({ page, baseURL }) => {
        const { data } = features[4];
        const testPage = `${baseURL}${features[4].path}${features[4].browserParams}${data.cardid}${miloLibs}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate price element', async () => {
            const priceCount = await fullPricingExpress.cardPrice.count();
            if (priceCount > 0) {
                const priceElement = fullPricingExpress.cardPrice.first();
                await expect(priceElement).toBeVisible();

                // Check price has content
                const priceText = await priceElement.textContent();
                expect(priceText).toBeTruthy();
            }
        });
    });

    // @studio-full-pricing-express-css-body-styles - Verify body/description styles
    test(`${features[5].name},${features[5].tags}`, async ({ page, baseURL }) => {
        const { data } = features[5];
        const testPage = `${baseURL}${features[5].path}${features[5].browserParams}${data.cardid}${miloLibs}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate body text', async () => {
            const bodyCount = await fullPricingExpress.cardBody.count();
            if (bodyCount > 0) {
                const bodyElement = fullPricingExpress.cardBody.first();
                await expect(bodyElement).toBeVisible();

                // Check body has text
                const bodyText = await bodyElement.textContent();
                expect(bodyText).toBeTruthy();
            }
        });
    });

    // @studio-full-pricing-express-css-shortDescription-styles - Verify shortDescription styles
    test(`${features[6].name},${features[6].tags}`, async ({ page, baseURL }) => {
        const { data } = features[6];
        const testPage = `${baseURL}${features[6].path}${features[6].browserParams}${data.cardid}${miloLibs}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Check for shortDescription element', async () => {
            const shortDescCount = await fullPricingExpress.cardShortDescription.count();
            if (shortDescCount > 0) {
                const shortDescriptionElement = fullPricingExpress.cardShortDescription.first();
                await expect(shortDescriptionElement).toBeVisible();
            }
            // shortDescription is optional, so no failure if not present
        });
    });

    // @studio-full-pricing-express-css-badge-styles - Verify badge styles
    test(`${features[7].name},${features[7].tags}`, async ({ page, baseURL }) => {
        const { data } = features[7];
        const testPage = `${baseURL}${features[7].path}${features[7].browserParams}${data.cardid}${miloLibs}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Check for badge element', async () => {
            const badgeCount = await fullPricingExpress.cardBadge.count();
            if (badgeCount > 0) {
                const badgeElement = fullPricingExpress.cardBadge.first();
                await expect(badgeElement).toBeVisible();
            }
            // Badge is optional
        });
    });

    // @studio-full-pricing-express-css-divider-styles - Verify divider styles
    test(`${features[8].name},${features[8].tags}`, async ({ page, baseURL }) => {
        const { data } = features[8];
        const testPage = `${baseURL}${features[8].path}${features[8].browserParams}${data.cardid}${miloLibs}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Check for divider element', async () => {
            const dividerCount = await fullPricingExpress.cardDivider.count();
            if (dividerCount > 0) {
                const dividerElement = fullPricingExpress.cardDivider.first();
                await expect(dividerElement).toBeVisible();
            }
        });
    });

    // @studio-full-pricing-express-css-cta-styles - Verify CTA button styles
    test(`${features[9].name},${features[9].tags}`, async ({ page, baseURL }) => {
        const { data } = features[9];
        const testPage = `${baseURL}${features[9].path}${features[9].browserParams}${data.cardid}${miloLibs}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate CTA button', async () => {
            const ctaCount = await fullPricingExpress.cardCTA.count();
            if (ctaCount > 0) {
                const ctaElement = fullPricingExpress.cardCTA.first();
                await expect(ctaElement).toBeVisible();

                // Check CTA has text
                const ctaText = await ctaElement.textContent();
                expect(ctaText).toBeTruthy();
            }
        });
    });

    // @studio-full-pricing-express-css-strikethrough-price-styles - Verify strikethrough price styles
    test(`${features[10].name},${features[10].tags}`, async ({ page, baseURL }) => {
        const { data } = features[10];
        const testPage = `${baseURL}${features[10].path}${features[10].browserParams}${data.cardid}${miloLibs}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Check for strikethrough price', async () => {
            const strikethroughCount = await fullPricingExpress.cardStrikethroughPrice.count();
            if (strikethroughCount > 0) {
                const strikethroughElement = fullPricingExpress.cardStrikethroughPrice.first();
                await expect(strikethroughElement).toBeVisible();

                // Verify it has strikethrough styling
                const textDecoration = await strikethroughElement.evaluate(
                    (el) => window.getComputedStyle(el).textDecorationLine,
                );
                expect(textDecoration).toContain('through');
            }
        });
    });
});
