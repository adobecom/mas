import { test, expect, studio, slice, webUtil, miloLibs, setTestPage } from '../../../../libs/mas-test.js';

import CCDSliceSpec from '../specs/slice_css.spec.js';

const { features } = CCDSliceSpec;

test.describe('M@S Studio CCD Slice card CSS test suite', () => {
    // @studio-slice-css-single - Validate all CSS properties for single slice card
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.cardid}`;
        const sliceCard = await studio.getCard(data.cardid);
        setTestPage(testPage);

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

        await test.step('step-1: Go to test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate slice card is visible and has correct variant', async () => {
            await expect(sliceCard).toBeVisible();
            await expect(sliceCard).toHaveAttribute('variant', 'ccd-slice');
        });

        await test.step('step-3: Validate all slice card CSS properties in parallel', async () => {
            const results = await Promise.allSettled([
                // Card container CSS
                test.step('Validation-1: Validate slice card container CSS', async () => {
                    expect(await webUtil.verifyCSS(sliceCard, slice.cssProp.card)).toBeTruthy();
                }),

                // Card badge CSS
                test.step('Validation-2: Validate slice card badge CSS', async () => {
                    expect(await webUtil.verifyCSS(sliceCard.locator(slice.cardBadge), slice.cssProp.badge)).toBeTruthy();
                }),

                // Card description CSS
                test.step('Validation-3: Validate slice card description CSS', async () => {
                    expect(
                        await webUtil.verifyCSS(
                            sliceCard.locator(slice.cardDescription).locator('p > strong').first(),
                            slice.cssProp.description,
                        ),
                    ).toBeTruthy();
                }),

                // Card mnemonic CSS
                test.step('Validation-4: Validate slice card mnemonic CSS', async () => {
                    expect(await webUtil.verifyCSS(sliceCard.locator(slice.cardIcon), slice.cssProp.mnemonic)).toBeTruthy();
                }),

                // Card size CSS
                test.step('Validation-5: Validate slice card size CSS', async () => {
                    expect(await webUtil.verifyCSS(sliceCard, slice.cssProp.singleSize)).toBeTruthy();
                }),

                // Card price CSS
                test.step('Validation-6: Validate slice card price CSS', async () => {
                    expect(await webUtil.verifyCSS(sliceCard.locator(slice.cardPrice), slice.cssProp.price)).toBeTruthy();
                }),

                // Card strikethrough price CSS
                test.step('Validation-7: Validate slice card strikethrough price CSS', async () => {
                    expect(
                        await webUtil.verifyCSS(
                            sliceCard.locator(slice.cardPromoPriceStrikethrough),
                            slice.cssProp.strikethroughPrice,
                        ),
                    ).toBeTruthy();
                }),

                // Card CTA CSS
                test.step('Validation-8: Validate slice card CTA CSS', async () => {
                    expect(await webUtil.verifyCSS(sliceCard.locator(slice.cardCTA), slice.cssProp.cta)).toBeTruthy();
                }),

                // Card legal link CSS
                test.step('Validation-9: Validate slice card legal link CSS', async () => {
                    expect(
                        await webUtil.verifyCSS(sliceCard.locator(slice.cardLegalLink), slice.cssProp.legalLink),
                    ).toBeTruthy();
                }),
            ]);

            // Check results and report any failures
            const failures = results
                .map((result, index) => ({ result, index }))
                .filter(({ result }) => result.status === 'rejected')
                .map(({ result, index }) => `🔍 Validation-${index + 1} (${validationLabels[index]}) failed: ${result.reason}`);

            if (failures.length > 0) {
                throw new Error(`\x1b[31m✘\x1b[0m Slice card CSS validation failures:\n${failures.join('\n')}`);
            }
        });
    });

    // @studio-slice-css-double - Validate all CSS properties for double slice card
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}${data.cardid}`;
        const sliceCard = await studio.getCard(data.cardid);
        setTestPage(testPage);

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

        await test.step('step-1: Go to test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate slice card is visible and has correct variant', async () => {
            await expect(sliceCard).toBeVisible();
            await expect(sliceCard).toHaveAttribute('variant', 'ccd-slice');
        });

        await test.step('step-3: Validate all slice card CSS properties in parallel', async () => {
            const results = await Promise.allSettled([
                // Card container CSS
                test.step('Validation-1: Validate slice card container CSS', async () => {
                    expect(await webUtil.verifyCSS(sliceCard, slice.cssProp.card)).toBeTruthy();
                }),

                // Card badge CSS
                test.step('Validation-2: Validate slice card badge CSS', async () => {
                    expect(await webUtil.verifyCSS(sliceCard.locator(slice.cardBadge), slice.cssProp.badge)).toBeTruthy();
                }),

                // Card description CSS
                test.step('Validation-3: Validate slice card description CSS', async () => {
                    expect(
                        await webUtil.verifyCSS(
                            sliceCard.locator(slice.cardDescription).locator('p > strong').first(),
                            slice.cssProp.description,
                        ),
                    ).toBeTruthy();
                }),

                // Card mnemonic CSS
                test.step('Validation-4: Validate slice card mnemonic CSS', async () => {
                    expect(await webUtil.verifyCSS(sliceCard.locator(slice.cardIcon), slice.cssProp.mnemonic)).toBeTruthy();
                }),

                // Card size CSS
                test.step('Validation-5: Validate slice card size CSS', async () => {
                    expect(await webUtil.verifyCSS(sliceCard, slice.cssProp.doubleSize)).toBeTruthy();
                }),

                // Card price CSS
                test.step('Validation-6: Validate slice card price CSS', async () => {
                    expect(await webUtil.verifyCSS(sliceCard.locator(slice.cardPrice), slice.cssProp.price)).toBeTruthy();
                }),

                // Card strikethrough price CSS
                test.step('Validation-7: Validate slice card strikethrough price CSS', async () => {
                    expect(
                        await webUtil.verifyCSS(
                            sliceCard.locator(slice.cardPromoPriceStrikethrough),
                            slice.cssProp.strikethroughPrice,
                        ),
                    ).toBeTruthy();
                }),

                // Card CTA CSS
                test.step('Validation-8: Validate slice card CTA CSS', async () => {
                    expect(await webUtil.verifyCSS(sliceCard.locator(slice.cardCTA), slice.cssProp.cta)).toBeTruthy();
                }),

                // Card legal link CSS
                test.step('Validation-9: Validate slice card legal link CSS', async () => {
                    expect(
                        await webUtil.verifyCSS(sliceCard.locator(slice.cardLegalLink), slice.cssProp.legalLink),
                    ).toBeTruthy();
                }),
            ]);

            // Check results and report any failures
            const failures = results
                .map((result, index) => ({ result, index }))
                .filter(({ result }) => result.status === 'rejected')
                .map(({ result, index }) => `🔍 Validation-${index + 1} (${validationLabels[index]}) failed: ${result.reason}`);

            if (failures.length > 0) {
                throw new Error(`\x1b[31m✘\x1b[0m Slice card CSS validation failures:\n${failures.join('\n')}`);
            }
        });
    });
});
