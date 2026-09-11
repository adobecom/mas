import { test, expect, studio, pro, webUtil, miloLibs, setTestPage } from '../../../../libs/mas-test.js';
import ACOMProSpec from '../specs/pro_css.spec.js';

const { features } = ACOMProSpec;

test.describe('M@S Studio ACOM Pro card CSS test suite', () => {
    // @studio-pro-css - Validate all CSS properties for pro card
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.cardid}`;
        const proCard = await studio.getCard(data.cardid);
        setTestPage(testPage);

        const validationLabels = [
            'Pro CSS tokens',
            'card container',
            'top card',
            'title',
            'description',
            'price',
            'whats included toggle',
        ];

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate pro card is visible and has correct variant', async () => {
            await studio.waitForCardsLoaded();
            await expect(proCard).toBeVisible();
            await expect(proCard).toHaveAttribute('variant', 'pro');
        });

        await test.step('step-3: Validate all CSS properties in parallel', async () => {
            const results = await Promise.allSettled([
                test.step('Validation-1: Validate Pro CSS tokens', async () => {
                    expect(await webUtil.verifyCSS(proCard, pro.cssProp.tokens)).toBeTruthy();
                }),

                // Card container CSS (gray frame)
                test.step('Validation-2: Validate card container CSS', async () => {
                    expect(await webUtil.verifyCSS(proCard, pro.cssProp.card)).toBeTruthy();
                }),

                // Top card CSS (white inner card)
                test.step('Validation-3: Validate top card CSS', async () => {
                    expect(await webUtil.verifyCSS(proCard.locator(pro.cardTopCard), pro.cssProp.topCard)).toBeTruthy();
                }),

                // Card title CSS
                test.step('Validation-4: Validate card title CSS', async () => {
                    expect(await webUtil.verifyCSS(proCard.locator(pro.cardTitle), pro.cssProp.title)).toBeTruthy();
                }),

                // Card description CSS
                test.step('Validation-5: Validate card description CSS', async () => {
                    expect(
                        await webUtil.verifyCSS(proCard.locator(pro.cardDescription).first(), pro.cssProp.description),
                    ).toBeTruthy();
                }),

                // Card price CSS
                test.step('Validation-6: Validate card price CSS', async () => {
                    expect(await webUtil.verifyCSS(proCard.locator(pro.cardPrice), pro.cssProp.price)).toBeTruthy();
                }),

                // Whats included toggle CSS
                test.step('Validation-7: Validate whats included toggle CSS', async () => {
                    expect(
                        await webUtil.verifyCSS(proCard.locator(pro.cardWhatsIncludedToggle), pro.cssProp.whatsIncludedToggle),
                    ).toBeTruthy();
                }),
            ]);

            // Check results and report any failures
            const failures = results
                .map((result, index) => ({ result, index }))
                .filter(({ result }) => result.status === 'rejected')
                .map(({ result, index }) => `🔍 Validation-${index + 1} (${validationLabels[index]}) failed: ${result.reason}`);

            if (failures.length > 0) {
                throw new Error(`\x1b[31m✘\x1b[0m Pro card CSS validation failures:\n${failures.join('\n')}`);
            }
        });

        await test.step('step-4: Validate whats included is always expanded on desktop', async () => {
            // At >=1280px the toggle is display:none and the features zone is
            // forced visible (pro.js variantStyle media query).
            const toggle = proCard.locator(pro.cardWhatsIncludedToggle);
            const featuresZone = proCard.locator(pro.cardFeaturesZone);
            await expect(toggle).toBeHidden();
            await expect(featuresZone).toBeVisible();
            await expect(proCard.locator(pro.cardWhatsIncludedSection).first()).toBeVisible();
        });

        await test.step('step-5: Validate whats included toggle expands and collapses below 1280px', async () => {
            await page.setViewportSize({ width: 1024, height: 800 });
            const toggle = proCard.locator(pro.cardWhatsIncludedToggle);
            const featuresZone = proCard.locator(pro.cardFeaturesZone);
            await expect(toggle).toBeVisible();
            await expect(toggle).toHaveAttribute('aria-expanded', 'false');
            await expect(featuresZone).not.toBeVisible();
            await toggle.click();
            await expect(toggle).toHaveAttribute('aria-expanded', 'true');
            await expect(featuresZone).toBeVisible();
            await expect(proCard.locator(pro.cardWhatsIncludedSection).first()).toBeVisible();
            await toggle.click();
            await expect(toggle).toHaveAttribute('aria-expanded', 'false');
            await expect(featuresZone).not.toBeVisible();
        });
    });
});
