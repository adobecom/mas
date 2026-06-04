import { test, expect, studio, plansBizpro, webUtil, miloLibs, setTestPage } from '../../../../libs/mas-test.js';
import ACOMPlansBizProSpec from '../specs/plans-bizpro_css.spec.js';

const { features } = ACOMPlansBizProSpec;

test.describe('M@S Studio ACOM Plans BizPro card CSS test suite', () => {
    // @studio-plans-bizpro-css - Validate all CSS properties for plans bizpro card
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.cardid}`;
        const bizproCard = await studio.getCard(data.cardid);
        setTestPage(testPage);

        const validationLabels = ['card container', 'top card', 'title', 'description', 'price', 'whats included toggle'];

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate bizpro card is visible and has correct variant', async () => {
            await studio.waitForCardsLoaded();
            await expect(bizproCard).toBeVisible();
            await expect(bizproCard).toHaveAttribute('variant', 'plans-bizpro');
        });

        await test.step('step-3: Validate all CSS properties in parallel', async () => {
            const results = await Promise.allSettled([
                // Card container CSS (gray frame)
                test.step('Validation-1: Validate card container CSS', async () => {
                    expect(await webUtil.verifyCSS(bizproCard, plansBizpro.cssProp.card)).toBeTruthy();
                }),

                // Top card CSS (white inner card)
                test.step('Validation-2: Validate top card CSS', async () => {
                    expect(
                        await webUtil.verifyCSS(bizproCard.locator(plansBizpro.cardTopCard), plansBizpro.cssProp.topCard),
                    ).toBeTruthy();
                }),

                // Card title CSS
                test.step('Validation-3: Validate card title CSS', async () => {
                    expect(
                        await webUtil.verifyCSS(bizproCard.locator(plansBizpro.cardTitle), plansBizpro.cssProp.title),
                    ).toBeTruthy();
                }),

                // Card description CSS
                test.step('Validation-4: Validate card description CSS', async () => {
                    expect(
                        await webUtil.verifyCSS(
                            bizproCard.locator(plansBizpro.cardDescription).first(),
                            plansBizpro.cssProp.description,
                        ),
                    ).toBeTruthy();
                }),

                // Card price CSS
                test.step('Validation-5: Validate card price CSS', async () => {
                    expect(
                        await webUtil.verifyCSS(bizproCard.locator(plansBizpro.cardPrice), plansBizpro.cssProp.price),
                    ).toBeTruthy();
                }),

                // Whats included toggle CSS
                test.step('Validation-6: Validate whats included toggle CSS', async () => {
                    expect(
                        await webUtil.verifyCSS(
                            bizproCard.locator(plansBizpro.cardWhatsIncludedToggle),
                            plansBizpro.cssProp.whatsIncludedToggle,
                        ),
                    ).toBeTruthy();
                }),
            ]);

            // Check results and report any failures
            const failures = results
                .map((result, index) => ({ result, index }))
                .filter(({ result }) => result.status === 'rejected')
                .map(({ result, index }) => `🔍 Validation-${index + 1} (${validationLabels[index]}) failed: ${result.reason}`);

            if (failures.length > 0) {
                throw new Error(`\x1b[31m✘\x1b[0m Plans BizPro card CSS validation failures:\n${failures.join('\n')}`);
            }
        });

        await test.step('step-4: Validate whats included is always expanded on desktop', async () => {
            // At >=1280px the toggle is display:none and the features zone is
            // forced visible (plans-bizpro.js variantStyle media query).
            const toggle = bizproCard.locator(plansBizpro.cardWhatsIncludedToggle);
            const featuresZone = bizproCard.locator(plansBizpro.cardFeaturesZone);
            await expect(toggle).toBeHidden();
            await expect(featuresZone).toBeVisible();
            await expect(bizproCard.locator(plansBizpro.cardWhatsIncludedSection).first()).toBeVisible();
        });

        await test.step('step-5: Validate whats included toggle expands and collapses below 1280px', async () => {
            await page.setViewportSize({ width: 1024, height: 800 });
            const toggle = bizproCard.locator(plansBizpro.cardWhatsIncludedToggle);
            const featuresZone = bizproCard.locator(plansBizpro.cardFeaturesZone);
            await expect(toggle).toBeVisible();
            await expect(toggle).toHaveAttribute('aria-expanded', 'false');
            await expect(featuresZone).not.toBeVisible();
            await toggle.click();
            await expect(toggle).toHaveAttribute('aria-expanded', 'true');
            await expect(featuresZone).toBeVisible();
            await expect(bizproCard.locator(plansBizpro.cardWhatsIncludedSection).first()).toBeVisible();
            await toggle.click();
            await expect(toggle).toHaveAttribute('aria-expanded', 'false');
            await expect(featuresZone).not.toBeVisible();
        });
    });
});
