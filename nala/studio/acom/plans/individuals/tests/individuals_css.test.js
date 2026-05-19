import { test, expect, studio, plans, webUtil, miloLibs, setTestPage } from '../../../../../libs/mas-test.js';
import ACOMPlansIndividualsSpec from '../specs/individuals_css.spec.js';

const { features } = ACOMPlansIndividualsSpec;

test.describe('M@S Studio ACOM Plans Individuals card CSS test suite', () => {
    // @studio-plans-individuals-css - Validate all CSS properties for plans individuals card
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0]; // All features use the same card ID and configuration
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.cardid}`;
        const individualsCard = await studio.getCard(data.cardid);
        setTestPage(testPage);

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
            await studio.waitForCardsLoaded();
            await expect(individualsCard).toBeVisible();
            await expect(individualsCard).toHaveAttribute('variant', 'plans');
        });

        await test.step('step-3: Validate all CSS properties in parallel', async () => {
            const results = await Promise.allSettled([
                // Card container CSS
                test.step('Validation-1: Validate card container CSS', async () => {
                    expect(await webUtil.verifyCSS(individualsCard, plans.individualsCSSProp.card)).toBeTruthy();
                }),

                // Card icon CSS
                test.step('Validation-2: Validate card icon CSS', async () => {
                    expect(
                        await webUtil.verifyCSS(individualsCard.locator(plans.cardIcon), plans.individualsCSSProp.icon),
                    ).toBeTruthy();
                }),

                // Card title CSS
                test.step('Validation-3: Validate card title CSS', async () => {
                    expect(
                        await webUtil.verifyCSS(individualsCard.locator(plans.cardTitle), plans.individualsCSSProp.title),
                    ).toBeTruthy();
                }),

                // Card badge CSS
                test.step('Validation-4: Validate card badge CSS', async () => {
                    expect(
                        await webUtil.verifyCSS(individualsCard.locator(plans.cardBadge), plans.individualsCSSProp.badge),
                    ).toBeTruthy();
                }),

                // Card description CSS
                test.step('Validation-5: Validate card description CSS', async () => {
                    expect(
                        await webUtil.verifyCSS(
                            individualsCard.locator(plans.cardDescription).first(),
                            plans.individualsCSSProp.description,
                        ),
                    ).toBeTruthy();
                }),

                // Card legal link CSS
                test.step('Validation-6: Validate card legal link CSS', async () => {
                    expect(
                        await webUtil.verifyCSS(
                            individualsCard.locator(plans.cardDescription).locator(plans.cardLegalLink),
                            plans.individualsCSSProp.legalLink,
                        ),
                    ).toBeTruthy();
                }),

                // Card price CSS
                test.step('Validation-7: Validate card price CSS', async () => {
                    expect(
                        await webUtil.verifyCSS(
                            individualsCard.locator(plans.cardPriceAlternative),
                            plans.individualsCSSProp.price,
                        ),
                    ).toBeTruthy();
                }),

                // Card strikethrough price CSS
                test.step('Validation-8: Validate card strikethrough price CSS', async () => {
                    expect(
                        await webUtil.verifyCSS(
                            individualsCard.locator(plans.cardPriceStrikethrough),
                            plans.individualsCSSProp.strikethroughPrice,
                        ),
                    ).toBeTruthy();
                }),

                // Card promo text CSS
                test.step('Validation-9: Validate card promo text CSS', async () => {
                    expect(
                        await webUtil.verifyCSS(
                            individualsCard.locator(plans.cardPromoText),
                            plans.individualsCSSProp.promoText,
                        ),
                    ).toBeTruthy();
                }),

                // Card callout CSS
                test.step('Validation-10: Validate card callout CSS', async () => {
                    expect(
                        await webUtil.verifyCSS(individualsCard.locator(plans.cardCallout), plans.individualsCSSProp.callout),
                    ).toBeTruthy();
                }),

                // Skipped validations (can also run in parallel when enabled)
                // test.step.skip('Validate card stock checkbox CSS', async () => {
                //     expect(
                //         await webUtil.verifyCSS(
                //             individualsCard.locator(plans.cardStockCheckbox),
                //             plans.individualsCSSProp.stockCheckbox.text,
                //         ),
                //     ).toBeTruthy();
                //     expect(
                //         await webUtil.verifyCSS(
                //             individualsCard.locator(plans.cardStockCheckboxIcon),
                //             plans.individualsCSSProp.stockCheckbox.checkbox,
                //         ),
                //     ).toBeTruthy();
                // }),

                // test.step.skip('Validate card secure transaction CSS', async () => {
                //     expect(
                //         await webUtil.verifyCSS(
                //             individualsCard.locator(plans.cardSecureTransaction),
                //             plans.individualsCSSProp.secureTransaction,
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
                throw new Error(`\x1b[31m✘\x1b[0m Plans Individuals card CSS validation failures:\n${failures.join('\n')}`);
            }
        });
    });
});
