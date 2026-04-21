import { test, expect, studio, fullPricingExpress, miloLibs, setTestPage } from '../../../../libs/mas-test.js';
import EXPRESSFullPricingSpec from '../specs/full_pricing_css.spec.js';

const { features } = EXPRESSFullPricingSpec;

test.describe('M@S Studio EXPRESS Full Pricing card CSS test suite', () => {
    // @studio-full-pricing-express-css - Validate all CSS properties for full pricing express card
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.cardid}`;
        const fullPricingExpressCard = await studio.getCard(data.cardid);
        setTestPage(testPage);

        const validationLabels = ['card container', 'title', 'shortDescription', 'divider'];

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Wait for cards to fully render', async () => {
            await studio.waitForCardsLoaded();
            await expect(fullPricingExpressCard).toBeVisible();
            await expect(fullPricingExpressCard).toHaveAttribute(
                'variant',
                /(full-pricing-express|simplified-pricing-express)/,
            );
        });

        await test.step('step-3: Validate all full pricing express card CSS properties in parallel', async () => {
            const results = await Promise.allSettled([
                // Original test 1: Card structure validation
                test.step('Validation-1: Validate card element exists and has proper structure', async () => {
                    await expect(fullPricingExpressCard).toBeVisible();
                    const variant = await fullPricingExpressCard.getAttribute('variant');
                    expect(['full-pricing-express', 'simplified-pricing-express']).toContain(variant);

                    const bgColor = await fullPricingExpressCard.evaluate((el) => window.getComputedStyle(el).backgroundColor);
                    expect(bgColor).toMatch(/rgba?\(\d+,\s*\d+,\s*\d+(?:,\s*[\d.]+)?\)/);
                    const borderStyle = await fullPricingExpressCard.evaluate((el) => window.getComputedStyle(el).borderStyle);
                    expect(borderStyle).toBeTruthy();
                }),

                // Original test 2: Title element validation
                test.step('Validation-2: Validate title element', async () => {
                    const titleCount = await fullPricingExpress.cardTitle.count();
                    if (titleCount > 0) {
                        const titleElement = fullPricingExpress.cardTitle.first();
                        await expect(titleElement).toBeVisible();
                        const titleText = await titleElement.textContent();
                        expect(titleText).toBeTruthy();
                    }
                }),

                // Original test 2: ShortDescription element validation
                test.step('Validation-3: Validate shortDescription element', async () => {
                    const shortDescCount = await fullPricingExpress.cardShortDescription.count();
                    if (shortDescCount > 0) {
                        await expect(fullPricingExpress.cardShortDescription).toBeVisible();
                    }
                }),

                // Original test 3: Divider element validation
                test.step('Validation-4: Check for divider element', async () => {
                    const dividerCount = await fullPricingExpress.cardDivider.count();
                    if (dividerCount > 0) {
                        await expect(fullPricingExpress.cardDivider).toBeVisible();
                    }
                }),
            ]);

            // Check results and report any failures
            const failures = results
                .map((result, index) => ({ result, index }))
                .filter(({ result }) => result.status === 'rejected')
                .map(({ result, index }) => `🔍 Validation-${index + 1} (${validationLabels[index]}) failed: ${result.reason}`);

            if (failures.length > 0) {
                throw new Error(`\x1b[31m✘\x1b[0m Full pricing express card CSS validation failures:\n${failures.join('\n')}`);
            }
        });
    });
    // @studio-full-pricing-express-price-css - Validate CSS properties for full pricing express card price
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.cardid}`;
        const fullPricingExpressCard = await studio.getCard(data.cardid);
        setTestPage(testPage);

        const validationLabels = ['strikethrough price', 'tax label', 'recurrence label', 'unit label'];

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Wait for cards to fully render', async () => {
            await studio.waitForCardsLoaded();
            await expect(fullPricingExpressCard).toBeVisible();
            await expect(fullPricingExpressCard).toHaveAttribute(
                'variant',
                /(full-pricing-express|simplified-pricing-express)/,
            );
        });

        await test.step('step-3: Validate full pricing express card price CSS properties in parallel', async () => {
            const results = await Promise.allSettled([
                // Original test 1: Card structure validation
                test.step('Validation-1: Validate strikethrough price is loaded', async () => {
                    const stPriceCount = await fullPricingExpress.cardPriceStrikethrough.count();
                    if (stPriceCount > 0) {
                        await expect(fullPricingExpress.cardPriceStrikethrough).toBeVisible();
                    }
                }),

                test.step('Validation-2: Validate strikethrough price tax label is hidden', async () => {
                    const labelCount = await fullPricingExpress.cardPriceStrikethroughTaxLabel.count();
                    if (labelCount > 0) {
                        const labelElement = fullPricingExpress.cardPriceStrikethroughTaxLabel.first();
                        await expect(labelElement).toHaveCSS('display', 'none');
                    }
                }),

                test.step('Validation-3: Validate strikethrough price recurrence label is hidden', async () => {
                    const labelCount = await fullPricingExpress.cardPriceStrikethroughRecurrenceLabel.count();
                    if (labelCount > 0) {
                        const labelElement = fullPricingExpress.cardPriceStrikethroughRecurrenceLabel.first();
                        await expect(labelElement).toHaveCSS('display', 'none');
                    }
                }),

                test.step('Validation-4: Validate strikethrough price unit label is hidden', async () => {
                    const labelCount = await fullPricingExpress.cardPriceStrikethroughUnitLabel.count();
                    if (labelCount > 0) {
                        const labelElement = fullPricingExpress.cardPriceStrikethroughUnitLabel.first();
                        await expect(labelElement).toHaveCSS('display', 'none');
                    }
                }),
            ]);

            // Check results and report any failures
            const failures = results
                .map((result, index) => ({ result, index }))
                .filter(({ result }) => result.status === 'rejected')
                .map(({ result, index }) => `🔍 Validation-${index + 1} (${validationLabels[index]}) failed: ${result.reason}`);

            if (failures.length > 0) {
                throw new Error(
                    `\x1b[31m✘\x1b[0m Full pricing express card price CSS validation failures:\n${failures.join('\n')}`,
                );
            }
        });
    });
});
