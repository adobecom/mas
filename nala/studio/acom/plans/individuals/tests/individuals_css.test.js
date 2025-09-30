import { expect, test } from '@playwright/test';
import StudioPage from '../../../../studio.page.js';
import ACOMPlansIndividualsSpec from '../specs/individuals_css.spec.js';
import ACOMPlansIndividualsPage from '../individuals.page.js';
import WebUtil from '../../../../../libs/webutil.js';

const { features } = ACOMPlansIndividualsSpec;
const miloLibs = process.env.MILO_LIBS || '';

let studio;
let individuals;
let webUtil;

test.beforeEach(async ({ page, browserName }) => {
    test.slow();
    if (browserName === 'chromium') {
        await page.setExtraHTTPHeaders({
            'sec-ch-ua': '"Chromium";v="123", "Not:A-Brand";v="8"',
        });
    }
    studio = new StudioPage(page);
    individuals = new ACOMPlansIndividualsPage(page);
    webUtil = new WebUtil(page);
});

test.describe('M@S Studio ACOM Plans Individuals card CSS test suite', () => {
    // @studio-plans-individuals-css - Validate all CSS properties for plans individuals card
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0]; // All features use the same card ID and configuration
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.cardid}`;
        const individualsCard = await studio.getCard(data.cardid);
        console.info('[Test Page]: ', testPage);

        const validationLabels = [
            'card container',
            'icon',
            'title',
            'badge',
            'description',
            'legal link',
            'price',
            'strikethrough price',
            'promo text',
            'callout',
        ];

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate individuals card is visible and has correct variant', async () => {
            await expect(individualsCard).toBeVisible();
            await expect(individualsCard).toHaveAttribute('variant', 'plans');
        });

        await test.step('step-3: Validate all CSS properties in parallel', async () => {
            const results = await Promise.allSettled([
                // Card container CSS
                test.step('Validation-1: Validate card container CSS', async () => {
                    expect(await webUtil.verifyCSS(individualsCard, individuals.cssProp.card)).toBeTruthy();
                }),

                // Card icon CSS
                test.step('Validation-2: Validate card icon CSS', async () => {
                    expect(
                        await webUtil.verifyCSS(individualsCard.locator(individuals.cardIcon), individuals.cssProp.icon),
                    ).toBeTruthy();
                }),

                // Card title CSS
                test.step('Validation-3: Validate card title CSS', async () => {
                    expect(
                        await webUtil.verifyCSS(individualsCard.locator(individuals.cardTitle), individuals.cssProp.title),
                    ).toBeTruthy();
                }),

                // Card badge CSS
                test.step('Validation-4: Validate card badge CSS', async () => {
                    expect(
                        await webUtil.verifyCSS(individualsCard.locator(individuals.cardBadge), individuals.cssProp.badge),
                    ).toBeTruthy();
                }),

                // Card description CSS
                test.step('Validation-5: Validate card description CSS', async () => {
                    expect(
                        await webUtil.verifyCSS(
                            individualsCard.locator(individuals.cardDescription).first(),
                            individuals.cssProp.description,
                        ),
                    ).toBeTruthy();
                }),

                // Card legal link CSS
                test.step('Validation-6: Validate card legal link CSS', async () => {
                    expect(
                        await webUtil.verifyCSS(
                            individualsCard.locator(individuals.cardDescription).locator(individuals.cardLegalLink),
                            individuals.cssProp.legalLink,
                        ),
                    ).toBeTruthy();
                }),

                // Card price CSS
                test.step('Validation-7: Validate card price CSS', async () => {
                    expect(
                        await webUtil.verifyCSS(individualsCard.locator(individuals.cardPrice), individuals.cssProp.price),
                    ).toBeTruthy();
                }),

                // Card strikethrough price CSS
                test.step('Validation-8: Validate card strikethrough price CSS', async () => {
                    expect(
                        await webUtil.verifyCSS(
                            individualsCard.locator(individuals.cardPriceStrikethrough),
                            individuals.cssProp.strikethroughPrice,
                        ),
                    ).toBeTruthy();
                }),

                // Card promo text CSS
                test.step('Validation-9: Validate card promo text CSS', async () => {
                    expect(
                        await webUtil.verifyCSS(
                            individualsCard.locator(individuals.cardPromoText),
                            individuals.cssProp.promoText,
                        ),
                    ).toBeTruthy();
                }),

                // Card callout CSS
                test.step('Validation-10: Validate card callout CSS', async () => {
                    expect(
                        await webUtil.verifyCSS(individualsCard.locator(individuals.cardCallout), individuals.cssProp.callout),
                    ).toBeTruthy();
                }),

                // Skipped validations (can also run in parallel when enabled)
                // test.step.skip('Validate card stock checkbox CSS', async () => {
                //     expect(
                //         await webUtil.verifyCSS(
                //             individualsCard.locator(individuals.cardStockCheckbox),
                //             individuals.cssProp.stockCheckbox.text,
                //         ),
                //     ).toBeTruthy();
                //     expect(
                //         await webUtil.verifyCSS(
                //             individualsCard.locator(individuals.cardStockCheckboxIcon),
                //             individuals.cssProp.stockCheckbox.checkbox,
                //         ),
                //     ).toBeTruthy();
                // }),

                // test.step.skip('Validate card secure transaction CSS', async () => {
                //     expect(
                //         await webUtil.verifyCSS(
                //             individualsCard.locator(individuals.cardSecureTransaction),
                //             individuals.cssProp.secureTransaction,
                //         ),
                //     ).toBeTruthy();
                // }),
            ]);

            // Check results and report any failures
            const failures = results
                .map((result, index) => ({ result, index }))
                .filter(({ result }) => result.status === 'rejected')
                .map(({ result, index }) => `🔍 Validation-${index + 1} (${validationLabels[index]}) failed: ${result.reason}`);

            if (failures.length > 0) {
                throw new Error(`❌ Plans Individuals card CSS validation failures:\n${failures.join('\n')}`);
            }
        });
    });
});
