import { test, expect, studio, suggested, webUtil, miloLibs } from '../../../../libs/mas-test.js';
import CCDSuggestedSpec from '../specs/suggested_css.spec.js';

const { features } = CCDSuggestedSpec;

test.describe('M@S Studio CCD Suggested card CSS test suite', () => {
    // @studio-suggested-css - Validate all CSS properties for suggested card
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.cardid}`;
        const suggestedCard = await studio.getCard(data.cardid);
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate suggested card is visible and has correct variant', async () => {
            await expect(suggestedCard).toBeVisible();
            await expect(suggestedCard).toHaveAttribute('variant', 'ccd-suggested');
        });

        await test.step('step-3: Validate all CSS properties in parallel', async () => {
            const validationLabels = [
                'card container',
                'eyebrow',
                'description',
                'mnemonic',
                'title',
                'price',
                'strikethrough price',
                'CTA',
                'legal link',
            ];

            const results = await Promise.allSettled([
                // Card container CSS
                test.step('Validation-1: Validate card container CSS', async () => {
                    expect(await webUtil.verifyCSS(suggestedCard, suggested.cssProp.card)).toBeTruthy();
                }),

                // Card eyebrow CSS
                test.step('Validation-2: Validate card eyebrow CSS', async () => {
                    expect(
                        await webUtil.verifyCSS(suggestedCard.locator(suggested.cardEyebrow), suggested.cssProp.eyebrow),
                    ).toBeTruthy();
                }),

                // Card description CSS
                test.step('Validation-3: Validate card description CSS', async () => {
                    expect(
                        await webUtil.verifyCSS(
                            suggestedCard.locator(suggested.cardDescription),
                            suggested.cssProp.description,
                        ),
                    ).toBeTruthy();
                }),

                // Card mnemonic CSS
                test.step('Validation-4: Validate card mnemonic CSS', async () => {
                    expect(
                        await webUtil.verifyCSS(suggestedCard.locator(suggested.cardIcon), suggested.cssProp.mnemonic),
                    ).toBeTruthy();
                }),

                // Card title CSS
                test.step('Validation-5: Validate card title CSS', async () => {
                    expect(
                        await webUtil.verifyCSS(suggestedCard.locator(suggested.cardTitle), suggested.cssProp.title),
                    ).toBeTruthy();
                }),

                // Card price CSS
                test.step('Validation-6: Validate card price CSS', async () => {
                    expect(
                        await webUtil.verifyCSS(suggestedCard.locator(suggested.cardPrice), suggested.cssProp.price),
                    ).toBeTruthy();
                }),

                // Card strikethrough price CSS
                test.step('Validation-7: Validate card strikethrough price CSS', async () => {
                    expect(
                        await webUtil.verifyCSS(
                            suggestedCard.locator(suggested.cardPrice).locator(suggested.priceStrikethrough),
                            suggested.cssProp.strikethroughPrice,
                        ),
                    ).toBeTruthy();
                }),

                // Card CTA CSS
                test.step('Validation-8: Validate card CTA CSS', async () => {
                    expect(
                        await webUtil.verifyCSS(suggestedCard.locator(suggested.cardCTA), suggested.cssProp.cta),
                    ).toBeTruthy();
                }),

                // Card legal link CSS
                test.step('Validation-9: Validate card legal link CSS', async () => {
                    expect(
                        await webUtil.verifyCSS(suggestedCard.locator(suggested.cardLegalLink), suggested.cssProp.legalLink),
                    ).toBeTruthy();
                }),
            ]);

            // Check results and report any failures
            const failures = results
                .map((result, index) => ({ result, index }))
                .filter(({ result }) => result.status === 'rejected')
                .map(({ result, index }) => `🔍 Validation-${index + 1} (${validationLabels[index]}) failed: ${result.reason}`);

            if (failures.length > 0) {
                throw new Error(`❌ Suggested card CSS validation failures:\n${failures.join('\n')}`);
            }
        });
    });
});
