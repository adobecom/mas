import { test, expect, studio, brandConcierge, webUtil, miloLibs, setTestPage } from '../../../../libs/mas-test.js';
import BrandConciergeSpec from '../specs/brand_concierge_css.spec.js';

const { features } = BrandConciergeSpec;

test.describe('M@S Studio Sandbox Brand Concierge Product card CSS test suite', () => {
    // @studio-brand-concierge-css - Validate all CSS properties for brand concierge product card
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.cardid}`;
        const card = await studio.getCard(data.cardid);
        setTestPage(testPage);

        const validationLabels = ['card container', 'title', 'price', 'description', 'body', 'footer'];

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate card is visible and has correct variant', async () => {
            await studio.waitForCardsLoaded();
            await expect(card).toBeVisible();
            await expect(card).toHaveAttribute('variant', 'brand-concierge-product');
        });

        await test.step('step-3: Validate all CSS properties in parallel', async () => {
            const results = await Promise.allSettled([
                test.step('Validation-1: Validate card container CSS', async () => {
                    expect(await webUtil.verifyCSS(card, brandConcierge.cssProp.card)).toBeTruthy();
                }),

                test.step('Validation-2: Validate card title CSS', async () => {
                    expect(
                        await webUtil.verifyCSS(card.locator(brandConcierge.cardTitle), brandConcierge.cssProp.title),
                    ).toBeTruthy();
                }),

                test.step('Validation-3: Validate card price CSS', async () => {
                    expect(
                        await webUtil.verifyCSS(card.locator(brandConcierge.cardPrice), brandConcierge.cssProp.price),
                    ).toBeTruthy();
                }),

                test.step('Validation-4: Validate card description CSS', async () => {
                    expect(
                        await webUtil.verifyCSS(
                            card.locator(brandConcierge.cardDescription).first(),
                            brandConcierge.cssProp.description,
                        ),
                    ).toBeTruthy();
                }),

                test.step('Validation-5: Validate card body CSS', async () => {
                    expect(
                        await webUtil.verifyCSS(card.locator(brandConcierge.cardBody), brandConcierge.cssProp.body),
                    ).toBeTruthy();
                }),

                test.step('Validation-6: Validate card footer CSS', async () => {
                    expect(
                        await webUtil.verifyCSS(card.locator(brandConcierge.cardFooter), brandConcierge.cssProp.footer),
                    ).toBeTruthy();
                }),
            ]);

            const failures = results
                .map((result, index) => ({ result, index }))
                .filter(({ result }) => result.status === 'rejected')
                .map(({ result, index }) => `🔍 Validation-${index + 1} (${validationLabels[index]}) failed: ${result.reason}`);

            if (failures.length > 0) {
                throw new Error(
                    `\x1b[31m✘\x1b[0m Brand Concierge Product card CSS validation failures:\n${failures.join('\n')}`,
                );
            }
        });
    });
});
