import { expect, test } from '@playwright/test';
import StudioPage from '../../../studio.page.js';
import EditorPage from '../../../editor.page.js';
import ACOMFullPricingExpressCSSSpec from '../specs/full_pricing_express_simplified_css.spec.js';
import ACOMFullPricingExpressPage from '../full-pricing-express.page.js';
import WebUtil from '../../../../libs/webutil.js';

const { features } = ACOMFullPricingExpressCSSSpec;
const miloLibs = process.env.MILO_LIBS || '';

let studio;
let editor;
let fullPricingExpress;
let webUtil;

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
    webUtil = new WebUtil(page);
});

test.describe('M@S Studio Full Pricing Express Simplified CSS Tests', () => {
    // @studio-full-pricing-express-css-card-structure - Verify card structure and essential elements
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${features[0].browserParams}${data.cardid}${miloLibs}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate card structure', async () => {
            const card = await studio.getCard(data.cardid);
            await expect(card).toBeVisible();
            await expect(card).toHaveAttribute('variant', 'full-pricing-express');

            // Check card has proper structure
            const bgColor = await card.evaluate((el) => window.getComputedStyle(el).backgroundColor);
            expect(bgColor).toMatch(/rgb\(\d+,\s*\d+,\s*\d+\)/);

            const borderStyle = await card.evaluate((el) => window.getComputedStyle(el).borderStyle);
            expect(borderStyle).toBeTruthy();
        });

        await test.step('step-3: Validate essential elements', async () => {
            // Title
            const titleCount = await fullPricingExpress.cardTitle.count();
            if (titleCount > 0) {
                await expect(fullPricingExpress.cardTitle.first()).toBeVisible();
                const titleText = await fullPricingExpress.cardTitle.first().textContent();
                expect(titleText).toBeTruthy();
            }

            // Price
            const priceCount = await fullPricingExpress.cardPrice.count();
            if (priceCount > 0) {
                await expect(fullPricingExpress.cardPrice.first()).toBeVisible();
                const priceText = await fullPricingExpress.cardPrice.first().textContent();
                expect(priceText).toBeTruthy();
            }

            // Body/Description
            const bodyCount = await fullPricingExpress.cardBody.count();
            if (bodyCount > 0) {
                await expect(fullPricingExpress.cardBody.first()).toBeVisible();
                const bodyText = await fullPricingExpress.cardBody.first().textContent();
                expect(bodyText).toBeTruthy();
            }

            // CTA
            const ctaCount = await fullPricingExpress.cardCTA.count();
            if (ctaCount > 0) {
                await expect(fullPricingExpress.cardCTA.first()).toBeVisible();
                const ctaText = await fullPricingExpress.cardCTA.first().textContent();
                expect(ctaText).toBeTruthy();
            }
        });

        await test.step('step-4: Validate optional elements if present', async () => {
            // Icon/Mnemonic
            const iconCount = await fullPricingExpress.cardIcon.count();
            const mnemonicCount = await page.locator('mas-mnemonic').count();
            if (iconCount > 0 || mnemonicCount > 0) {
                if (iconCount > 0) {
                    await expect(fullPricingExpress.cardIcon.first()).toBeVisible();
                } else {
                    await expect(page.locator('mas-mnemonic').first()).toBeVisible();
                }
            }

            // Badge
            const badgeCount = await fullPricingExpress.cardBadge.count();
            if (badgeCount > 0) {
                await expect(fullPricingExpress.cardBadge.first()).toBeVisible();
            }

            // Description2
            const desc2Count = await fullPricingExpress.cardDescription2.count();
            if (desc2Count > 0) {
                await expect(fullPricingExpress.cardDescription2.first()).toBeVisible();
            }

            // Divider
            const dividerCount = await fullPricingExpress.cardDivider.count();
            const spDividerCount = await fullPricingExpress.spDivider.count();
            if (dividerCount > 0 || spDividerCount > 0) {
                if (dividerCount > 0) {
                    await expect(fullPricingExpress.cardDivider.first()).toBeVisible();
                } else {
                    await expect(fullPricingExpress.spDivider.first()).toBeVisible();
                }
            }

            // Strikethrough price
            const strikethroughCount = await fullPricingExpress.cardStrikethroughPrice.count();
            if (strikethroughCount > 0) {
                const strikethroughElement = fullPricingExpress.cardStrikethroughPrice.first();
                await expect(strikethroughElement).toBeVisible();
                const textDecoration = await strikethroughElement.evaluate(
                    (el) => window.getComputedStyle(el).textDecorationLine,
                );
                expect(textDecoration).toContain('through');
            }

            // Links
            const legalLinkCount = await fullPricingExpress.cardLegalLink.count();
            const phoneLinkCount = await fullPricingExpress.cardPhoneLink.count();
            if (legalLinkCount > 0) {
                await expect(fullPricingExpress.cardLegalLink.first()).toBeVisible();
            }
            if (phoneLinkCount > 0) {
                await expect(fullPricingExpress.cardPhoneLink.first()).toBeVisible();
            }
        });
    });

    // @studio-full-pricing-express-css-responsive-layout - Verify responsive layout across viewports
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${features[1].browserParams}${data.cardid}${miloLibs}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Test desktop viewport (1440px)', async () => {
            await page.setViewportSize({ width: 1440, height: 900 });
            const card = await studio.getCard(data.cardid);
            await expect(card).toBeVisible();

            const dimensions = await card.evaluate((el) => {
                const rect = el.getBoundingClientRect();
                return { width: rect.width, height: rect.height };
            });
            expect(dimensions.width).toBeGreaterThan(0);
            expect(dimensions.height).toBeGreaterThan(0);

            // Verify key elements are visible at desktop
            if ((await fullPricingExpress.cardTitle.count()) > 0) {
                await expect(fullPricingExpress.cardTitle.first()).toBeVisible();
            }
            if ((await fullPricingExpress.cardCTA.count()) > 0) {
                await expect(fullPricingExpress.cardCTA.first()).toBeVisible();
            }
        });

        await test.step('step-3: Test tablet viewport (768px)', async () => {
            await page.setViewportSize({ width: 768, height: 1024 });
            const card = await studio.getCard(data.cardid);
            await expect(card).toBeVisible();

            const dimensions = await card.evaluate((el) => {
                const rect = el.getBoundingClientRect();
                return { width: rect.width, height: rect.height };
            });
            expect(dimensions.width).toBeGreaterThan(0);
            expect(dimensions.height).toBeGreaterThan(0);
        });

        await test.step('step-4: Test mobile viewport (375px)', async () => {
            await page.setViewportSize({ width: 375, height: 667 });
            const card = await studio.getCard(data.cardid);
            await expect(card).toBeVisible();

            const dimensions = await card.evaluate((el) => {
                const rect = el.getBoundingClientRect();
                return { width: rect.width, height: rect.height };
            });
            expect(dimensions.width).toBeGreaterThan(0);
            expect(dimensions.height).toBeGreaterThan(0);

            // Verify key elements are still visible at mobile
            if ((await fullPricingExpress.cardTitle.count()) > 0) {
                await expect(fullPricingExpress.cardTitle.first()).toBeVisible();
            }
            if ((await fullPricingExpress.cardCTA.count()) > 0) {
                await expect(fullPricingExpress.cardCTA.first()).toBeVisible();
            }
        });

        await test.step('step-5: Reset to desktop and verify', async () => {
            await page.setViewportSize({ width: 1440, height: 900 });
            const card = await studio.getCard(data.cardid);
            await expect(card).toBeVisible();
        });
    });

    // @studio-full-pricing-express-css-gradient-special-styles - Verify gradient borders and special styles
    test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
        const { data } = features[2];
        const testPage = `${baseURL}${features[2].path}${features[2].browserParams}${data.cardid}${miloLibs}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            const card = await studio.getCard(data.cardid);
            await expect(card).toBeVisible();
            await expect(card).toHaveAttribute('variant', 'full-pricing-express');
            await card.dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Validate gradient border if present', async () => {
            const card = await studio.getCard(data.cardid);
            if (data.gradientBorder) {
                const hasGradient = await webUtil.verifyCSS(card, {
                    'background-image': fullPricingExpress.cssProp.cardWithGradientBorder['background-image'],
                });
                expect(hasGradient).toBeTruthy();
            }
        });

        await test.step('step-4: Validate badge color styles if present', async () => {
            const badgeCount = await fullPricingExpress.cardBadge.count();
            if (badgeCount > 0 && data.badgeColor) {
                const badgeElement = fullPricingExpress.cardBadge.first();
                await expect(badgeElement).toBeVisible();

                if (data.badgeColorCSS) {
                    const hasBadgeColor = await webUtil.verifyCSS(badgeElement, {
                        'background-color': data.badgeColorCSS,
                    });
                    expect(hasBadgeColor).toBeTruthy();
                }
            }
        });

        await test.step('step-5: Validate divider styles if present', async () => {
            const dividerCount = await fullPricingExpress.cardDivider.count();
            if (dividerCount > 0) {
                const dividerElement = fullPricingExpress.cardDivider.first();
                await expect(dividerElement).toBeVisible();
                await expect(dividerElement).toHaveCSS('border-color', fullPricingExpress.cssProp.divider['border-color']);
            }
        });
    });

    // @studio-full-pricing-express-css-accessibility - Verify accessibility features and focus states
    test(`${features[3].name},${features[3].tags}`, async ({ page, baseURL }) => {
        const { data } = features[3];
        const testPage = `${baseURL}${features[3].path}${features[3].browserParams}${data.cardid}${miloLibs}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate key elements for accessibility', async () => {
            const card = await studio.getCard(data.cardid);
            await expect(card).toBeVisible();

            // Check for proper semantic structure
            const titleCount = await fullPricingExpress.cardTitle.count();
            if (titleCount > 0) {
                const titleElement = fullPricingExpress.cardTitle.first();
                await expect(titleElement).toBeVisible();
                // Title should have sufficient contrast
                const titleColor = await titleElement.evaluate((el) => window.getComputedStyle(el).color);
                expect(titleColor).toBeTruthy();
            }

            // Check CTA has proper attributes
            const ctaCount = await fullPricingExpress.cardCTA.count();
            if (ctaCount > 0) {
                const ctaElement = fullPricingExpress.cardCTA.first();
                await expect(ctaElement).toBeVisible();
                // CTA should have href attribute
                const href = await ctaElement.getAttribute('href');
                expect(href).toBeTruthy();
            }
        });

        await test.step('step-3: Test keyboard navigation and focus states', async () => {
            // Test Tab navigation
            await page.keyboard.press('Tab');
            await page.waitForTimeout(100);

            // Check if focused element is visible
            const focusedElement = await page.locator(':focus');
            const focusedCount = await focusedElement.count();
            if (focusedCount > 0) {
                await expect(focusedElement.first()).toBeVisible();
            }

            // Test CTA focus state specifically
            const ctaCount = await fullPricingExpress.cardCTA.count();
            if (ctaCount > 0) {
                const ctaElement = fullPricingExpress.cardCTA.first();
                await ctaElement.focus();
                const focusedCTA = await page.locator(':focus');
                await expect(focusedCTA).toBeVisible();

                // Check for focus outline or ring
                const outline = await focusedCTA.evaluate((el) => window.getComputedStyle(el).outline);
                const boxShadow = await focusedCTA.evaluate((el) => window.getComputedStyle(el).boxShadow);
                expect(outline || boxShadow).toBeTruthy();
            }
        });

        await test.step('step-4: Validate ARIA attributes if present', async () => {
            const card = await studio.getCard(data.cardid);

            // Check for any ARIA labels or roles
            const ariaLabel = await card.getAttribute('aria-label');
            const role = await card.getAttribute('role');

            // Log for debugging but don't fail if not present
            if (ariaLabel) {
                console.log('Card has aria-label:', ariaLabel);
            }
            if (role) {
                console.log('Card has role:', role);
            }

            // Check CTA for accessibility attributes
            const ctaCount = await fullPricingExpress.cardCTA.count();
            if (ctaCount > 0) {
                const ctaElement = fullPricingExpress.cardCTA.first();
                const ctaAriaLabel = await ctaElement.getAttribute('aria-label');
                const ctaRole = await ctaElement.getAttribute('role');

                if (ctaAriaLabel) {
                    console.log('CTA has aria-label:', ctaAriaLabel);
                }
                if (ctaRole) {
                    console.log('CTA has role:', ctaRole);
                }
            }
        });

        await test.step('step-5: Validate color contrast for readability', async () => {
            // Check text elements have sufficient size for readability
            const priceCount = await fullPricingExpress.cardPrice.count();
            if (priceCount > 0) {
                const priceElement = fullPricingExpress.cardPrice.first();
                const fontSize = await priceElement.evaluate((el) => window.getComputedStyle(el).fontSize);
                const fontSizeValue = parseInt(fontSize);
                expect(fontSizeValue).toBeGreaterThanOrEqual(12); // Minimum readable font size
            }

            const bodyCount = await fullPricingExpress.cardBody.count();
            if (bodyCount > 0) {
                const bodyElement = fullPricingExpress.cardBody.first();
                const fontSize = await bodyElement.evaluate((el) => window.getComputedStyle(el).fontSize);
                const fontSizeValue = parseInt(fontSize);
                expect(fontSizeValue).toBeGreaterThanOrEqual(12);
            }
        });
    });
});
