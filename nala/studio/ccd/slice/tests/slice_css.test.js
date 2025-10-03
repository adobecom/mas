import { test, expect, studio, slice, webUtil, miloLibs } from '../../../../libs/mas-test.js';

import CCDSliceSpec from '../specs/slice_css.spec.js';

const { features } = CCDSliceSpec;

test.describe('M@S Studio CCD Slice card CSS test suite', () => {
    // @studio-slice-css - Validate all CSS properties for slice cards
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const singleCardPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.singleCardID}`;
        const doubleCardPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.doubleCardID}`;
        const singleSliceCard = await studio.getCard(data.singleCardID);
        const doubleSliceCard = await studio.getCard(data.doubleCardID);
        console.info('[Test Page]: ', singleCardPage);

        const validationLabels = [
            'card container',
            'badge',
            'description',
            'mnemonic',
            'size',
            'price',
            'strikethrough price',
            'CTA',
            'legal link',
        ];

        await test.step('step-1: Go to single card test page', async () => {
            await page.goto(singleCardPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate single slice card is visible and has correct variant', async () => {
            await expect(singleSliceCard).toBeVisible();
            await expect(singleSliceCard).toHaveAttribute('variant', 'ccd-slice');
        });

        await test.step('step-3: Validate all single slice card CSS properties in parallel', async () => {
            const results = await Promise.allSettled([
                // Card container CSS
                test.step('Validation-1: Validate single slice card container CSS', async () => {
                    expect(await webUtil.verifyCSS(singleSliceCard, slice.cssProp.card)).toBeTruthy();
                }),

                // Card badge CSS
                test.step('Validation-2: Validate single slice card badge CSS', async () => {
                    expect(await webUtil.verifyCSS(singleSliceCard.locator(slice.cardBadge), slice.cssProp.badge)).toBeTruthy();
                }),

                // Card description CSS
                test.step('Validation-3: Validate single slice card description CSS', async () => {
                    expect(
                        await webUtil.verifyCSS(
                            singleSliceCard.locator(slice.cardDescription).locator('p > strong').first(),
                            slice.cssProp.description,
                        ),
                    ).toBeTruthy();
                }),

                // Card mnemonic CSS
                test.step('Validation-4: Validate single slice card mnemonic CSS', async () => {
                    expect(
                        await webUtil.verifyCSS(singleSliceCard.locator(slice.cardIcon), slice.cssProp.mnemonic),
                    ).toBeTruthy();
                }),

                // Card size CSS
                test.step('Validation-5: Validate single slice card size CSS', async () => {
                    expect(await webUtil.verifyCSS(singleSliceCard, slice.cssProp.singleSize)).toBeTruthy();
                }),

                // Card price CSS
                test.step('Validation-6: Validate single slice card price CSS', async () => {
                    expect(await webUtil.verifyCSS(singleSliceCard.locator(slice.cardPrice), slice.cssProp.price)).toBeTruthy();
                }),

                // Card strikethrough price CSS
                test.step('Validation-7: Validate single slice card strikethrough price CSS', async () => {
                    expect(
                        await webUtil.verifyCSS(
                            singleSliceCard.locator(slice.cardPromoPriceStrikethrough),
                            slice.cssProp.strikethroughPrice,
                        ),
                    ).toBeTruthy();
                }),

                // Card CTA CSS
                test.step('Validation-8: Validate single slice card CTA CSS', async () => {
                    expect(await webUtil.verifyCSS(singleSliceCard.locator(slice.cardCTA), slice.cssProp.cta)).toBeTruthy();
                }),

                // Card legal link CSS
                test.step('Validation-9: Validate single slice card legal link CSS', async () => {
                    expect(
                        await webUtil.verifyCSS(singleSliceCard.locator(slice.cardLegalLink), slice.cssProp.legalLink),
                    ).toBeTruthy();
                }),
            ]);

            // Check results and report any failures
            const failures = results
                .map((result, index) => ({ result, index }))
                .filter(({ result }) => result.status === 'rejected')
                .map(({ result, index }) => `🔍 Validation-${index + 1} (${validationLabels[index]}) failed: ${result.reason}`);

            if (failures.length > 0) {
                throw new Error(`❌ Single slice card CSS validation failures:\n${failures.join('\n')}`);
            }
        });

        await test.step('step-4: Go to double card test page', async () => {
            console.info('[Test Page]: ', doubleCardPage);
            await page.goto(doubleCardPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-5: Validate double slice card is visible and has correct variant', async () => {
            await expect(doubleSliceCard).toBeVisible();
            await expect(doubleSliceCard).toHaveAttribute('variant', 'ccd-slice');
        });

        await test.step('step-6: Validate all double slice card CSS properties in parallel', async () => {
            const results = await Promise.allSettled([
                // Card container CSS
                test.step('Validation-1: Validate double slice card container CSS', async () => {
                    expect(await webUtil.verifyCSS(doubleSliceCard, slice.cssProp.card)).toBeTruthy();
                }),

                // Card badge CSS
                test.step('Validation-2: Validate double slice card badge CSS', async () => {
                    expect(await webUtil.verifyCSS(doubleSliceCard.locator(slice.cardBadge), slice.cssProp.badge)).toBeTruthy();
                }),

                // Card description CSS
                test.step('Validation-3: Validate double slice card description CSS', async () => {
                    expect(
                        await webUtil.verifyCSS(
                            doubleSliceCard.locator(slice.cardDescription).locator('p > strong').first(),
                            slice.cssProp.description,
                        ),
                    ).toBeTruthy();
                }),

                // Card mnemonic CSS
                test.step('Validation-4: Validate double slice card mnemonic CSS', async () => {
                    expect(
                        await webUtil.verifyCSS(doubleSliceCard.locator(slice.cardIcon), slice.cssProp.mnemonic),
                    ).toBeTruthy();
                }),

                // Card size CSS
                test.step('Validation-5: Validate double slice card size CSS', async () => {
                    expect(await webUtil.verifyCSS(doubleSliceCard, slice.cssProp.doubleSize)).toBeTruthy();
                }),

                // Card price CSS
                test.step('Validation-6: Validate double slice card price CSS', async () => {
                    expect(await webUtil.verifyCSS(doubleSliceCard.locator(slice.cardPrice), slice.cssProp.price)).toBeTruthy();
                }),

                // Card strikethrough price CSS
                test.step('Validation-7: Validate double slice card strikethrough price CSS', async () => {
                    expect(
                        await webUtil.verifyCSS(
                            doubleSliceCard.locator(slice.cardPromoPriceStrikethrough),
                            slice.cssProp.strikethroughPrice,
                        ),
                    ).toBeTruthy();
                }),

                // Card CTA CSS
                test.step('Validation-8: Validate double slice card CTA CSS', async () => {
                    expect(await webUtil.verifyCSS(doubleSliceCard.locator(slice.cardCTA), slice.cssProp.cta)).toBeTruthy();
                }),

                // Card legal link CSS
                test.step('Validation-9: Validate double slice card legal link CSS', async () => {
                    expect(
                        await webUtil.verifyCSS(doubleSliceCard.locator(slice.cardLegalLink), slice.cssProp.legalLink),
                    ).toBeTruthy();
                }),
            ]);

            // Check results and report any failures
            const failures = results
                .map((result, index) => ({ result, index }))
                .filter(({ result }) => result.status === 'rejected')
                .map(({ result, index }) => `🔍 Validation-${index + 1} (${validationLabels[index]}) failed: ${result.reason}`);

            if (failures.length > 0) {
                throw new Error(`❌ Double slice card CSS validation failures:\n${failures.join('\n')}`);
            }
        });
    });
});
