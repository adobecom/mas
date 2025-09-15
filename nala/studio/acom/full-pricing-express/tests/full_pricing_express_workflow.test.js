import { expect, test } from '@playwright/test';
import StudioPage from '../../../studio.page.js';
import EditorPage from '../../../editor.page.js';
import ACOMFullPricingExpressWorkflowSpec from '../specs/full_pricing_express_workflow.spec.js';
import ACOMFullPricingExpressPage from '../full-pricing-express.page.js';
import OSTPage from '../../../ost.page.js';
import WebUtil from '../../../../libs/webutil.js';

const { features } = ACOMFullPricingExpressWorkflowSpec;
const miloLibs = process.env.MILO_LIBS || '';

let studio;
let editor;
let fullPricingExpress;
let ost;
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
    ost = new OSTPage(page);
    webUtil = new WebUtil(page);
});

test.describe('M@S Studio Full Pricing Express Workflow Tests', () => {
    // @studio-full-pricing-express-workflow-text-fields - Complete text field editing workflow
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${features[0].browserParams}${data.cardid}${miloLibs}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page and open editor', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('networkidle');
            const card = await studio.getCard(data.cardid);
            await expect(card).toBeVisible({ timeout: 10000 });
            await card.dblclick();
            await expect(await editor.panel).toBeVisible({ timeout: 10000 });
        });

        await test.step('step-2: Edit fields and mnemonic', async () => {
            // Edit title field in editor (for metadata - doesn't show on card)
            await expect(await editor.title).toBeVisible();
            await editor.title.click();
            await page.keyboard.press('Control+A');
            await page.keyboard.press('Meta+A'); // For Mac
            await page.keyboard.type(data.newTitle);
            await page.waitForTimeout(1000);
            await expect(await editor.title).toContainText(data.newTitle);

            // Edit badge
            if (data.newBadge && (await editor.badge.isVisible())) {
                await editor.badge.fill(data.newBadge);
                await page.waitForTimeout(500);
                const badgeCount = await fullPricingExpress.cardBadge.count();
                if (badgeCount > 0) {
                    await expect(fullPricingExpress.cardBadge.first()).toHaveText(data.newBadge);
                }
            }

            // Edit mnemonic/icon
            if (data.mnemonicField) {
                await expect(editor.titleFieldGroup).toBeVisible();
                const mnemonicButton = editor.titleFieldGroup.locator(editor.mnemonicButton);
                if ((await mnemonicButton.count()) > 0) {
                    await mnemonicButton.first().click();
                    await expect(editor.mnemonicModal).toBeVisible();
                    await editor.mnemonicField.fill(data.mnemonicField);
                    await editor.mnemonicSave.click();
                    await page.waitForTimeout(1000);
                }
            }
        });

        await test.step('step-3: Save changes and verify persistence', async () => {
            await expect(await editor.saveButton).toBeEnabled();
            await editor.saveButton.click();
            await page.waitForTimeout(2000);
            await expect(await editor.saveSuccess).toBeVisible();

            // Close and reopen to verify persistence
            await editor.closeEditor.click();
            await expect(await editor.panel).not.toBeVisible();

            // Verify badge persisted if it was edited
            if (data.newBadge) {
                const badgeCount = await fullPricingExpress.cardBadge.count();
                if (badgeCount > 0) {
                    await expect(fullPricingExpress.cardBadge.first()).toHaveText(data.newBadge);
                }
            }
        });

        await test.step('step-4: Reopen and verify persistence', async () => {
            // Reopen editor to verify changes were saved
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();

            // Verify title was saved
            await expect(await editor.title).toContainText(data.newTitle);

            // Verify badge was saved
            if (data.newBadge && (await editor.badge.isVisible())) {
                await expect(await editor.badge).toHaveValue(data.newBadge);
            }
        });
    });

    // @studio-full-pricing-express-workflow-price-osi - Price and OSI workflow
    test.skip(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${features[1].browserParams}${data.cardid}${miloLibs}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page and open editor', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            const card = await studio.getCard(data.cardid);
            await expect(card).toBeVisible();
            await card.dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-2: Verify price is visible', async () => {
            await expect(await editor.prices).toBeVisible();
            // Price field shows the current price
            const priceText = await editor.prices.textContent();
            expect(priceText).toBeTruthy();

            // Verify price shows on card
            const cardPriceCount = await fullPricingExpress.cardPrice.count();
            if (cardPriceCount > 0) {
                await expect(fullPricingExpress.cardPrice.first()).toBeVisible();
            }
        });

        await test.step('step-3: Verify OSI field', async () => {
            await expect(await editor.OSI).toBeVisible();
            const osiText = await editor.OSI.textContent();
            expect(osiText).toBeTruthy();
            // OSI field is present and has a value
        });

        await test.step('step-4: Save and close', async () => {
            await editor.saveButton.click();
            await page.waitForTimeout(2000);
            await expect(await editor.saveSuccess).toBeVisible();

            await editor.closeEditor.click();
            // Verify card still has price
            const cardPriceCount = await fullPricingExpress.cardPrice.count();
            if (cardPriceCount > 0) {
                await expect(fullPricingExpress.cardPrice.first()).toBeVisible();
            }
        });
    });

    // @studio-full-pricing-express-workflow-cta - CTA and links workflow
    test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
        const { data } = features[2];
        const testPage = `${baseURL}${features[2].path}${features[2].browserParams}${data.cardid}${miloLibs}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page and open editor', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            const card = await studio.getCard(data.cardid);
            await expect(card).toBeVisible();
            await card.dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-2: Edit CTA text and variant', async () => {
            await expect(await editor.footer).toBeVisible();
            await expect(await editor.CTA).toBeVisible();

            // Edit CTA text
            await editor.CTA.click();
            await editor.footer.locator(editor.linkEdit).click();
            await expect(await editor.linkText).toBeVisible();
            await editor.linkText.fill(data.newCtaText);

            // Change variant
            if (data.newVariant) {
                await expect(await editor.getLinkVariant(data.newVariant)).toBeVisible();
                await (await editor.getLinkVariant(data.newVariant)).click();
            }

            // Add checkout parameters
            if (data.checkoutParams) {
                await expect(await editor.checkoutParameters).toBeVisible();
                const checkoutParamsString = Object.keys(data.checkoutParams)
                    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(data.checkoutParams[key])}`)
                    .join('&');
                await editor.checkoutParameters.fill(checkoutParamsString);
            }

            await editor.linkSave.click();
            await expect(await fullPricingExpress.cardCTA).toContainText(data.newCtaText);
        });

        await test.step('step-3: Verify CTA was updated', async () => {
            // CTA text should be updated in the editor
            await expect(await editor.footer).toContainText(data.newCtaText);
            // CTA should be visible on card
            await expect(await fullPricingExpress.cardCTA).toBeVisible();
        });

        await test.step('step-4: Save and verify', async () => {
            await editor.saveButton.click();
            await page.waitForTimeout(2000);
            await expect(await editor.saveSuccess).toBeVisible();

            await editor.closeEditor.click();
            await expect(await fullPricingExpress.cardCTA).toContainText(data.newCtaText);

            if (data.checkoutParams) {
                const CTAhref = await fullPricingExpress.cardCTA.getAttribute('href');
                let searchParams = new URLSearchParams(decodeURI(CTAhref).split('?')[1]);
                for (const [key, value] of Object.entries(data.checkoutParams)) {
                    expect(searchParams.get(key)).toBe(value);
                }
            }
        });
    });

    // @studio-full-pricing-express-workflow-mnemonic - Parameterized mnemonic size test
    const mnemonicSizes = ['xs', 's', 'm', 'l'];
    for (const size of mnemonicSizes) {
        test.skip(`Mnemonic workflow - size ${size.toUpperCase()} @studio-full-pricing-express-workflow-mnemonic-${size}`, async ({
            page,
            baseURL,
        }) => {
            const data = {
                cardid: '53fcf015-5c28-4214-bd2b-d4c22f1774b8',
                mnemonicField: 'https://www.adobe.com/icons/photoshop.svg',
                mnemonicSize: size,
            };
            const testPage = `${baseURL}/studio.html#query=${data.cardid}${miloLibs}`;
            console.info('[Test Page]: ', testPage);

            await test.step('step-1: Go to MAS Studio test page and open editor', async () => {
                await page.goto(testPage);
                await page.waitForLoadState('domcontentloaded');
                await expect(await studio.getCard(data.cardid)).toBeVisible();
                await (await studio.getCard(data.cardid)).dblclick();
                await page.waitForTimeout(3000);
                await expect(editor.panel).toBeVisible();
            });

            await test.step('step-2: Edit mnemonic with size', async () => {
                await expect(editor.titleFieldGroup).toBeVisible();
                await expect(editor.titleFieldGroup.locator(editor.mnemonicButton)).toBeVisible();
                await editor.titleFieldGroup.locator(editor.mnemonicButton).click();
                await expect(editor.mnemonicModal).toBeVisible();

                await editor.mnemonicField.fill(data.mnemonicField);

                // Select size
                const sizeSelector =
                    (await page.locator('select[name="size"]').first()) || (await page.locator('[data-field="size"]').first());
                if (await sizeSelector.isVisible()) {
                    await sizeSelector.selectOption(data.mnemonicSize);
                }

                await editor.mnemonicSave.click();
                await page.waitForTimeout(1000);
            });

            await test.step('step-3: Verify mnemonic size and save', async () => {
                const mnemonicElement = await page.locator(`merch-card[data-card-id="${data.cardid}"] merch-icon`).first();
                if ((await mnemonicElement.count()) > 0) {
                    await expect(mnemonicElement).toHaveAttribute('size', data.mnemonicSize);
                    await expect(mnemonicElement).toHaveAttribute('src', data.mnemonicField);
                }

                await editor.saveButton.click();
                await page.waitForTimeout(2000);
                await expect(await editor.saveSuccess).toBeVisible();
            });
        });
    }

    // Note: Variant change test removed - we don't want to change card variants during testing

    // @studio-full-pricing-express-workflow-divider - Divider operations workflow
    test.skip(`${features[4].name},${features[4].tags}`, async ({ page, baseURL }) => {
        const { data } = features[4];
        const testPage = `${baseURL}${features[4].path}${features[4].browserParams}${data.cardid}${miloLibs}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page and open editor', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            const card = await studio.getCard(data.cardid);
            await expect(card).toBeVisible();
            await card.dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-2: Add divider', async () => {
            // Look for add divider button in description field
            const addDividerButton =
                editor.descriptionFieldGroup
                    .locator('button[aria-label*="divider"], button[title*="divider"], .divider-button')
                    .first() ||
                editor.panel.locator('button:has-text("Add Divider")').first() ||
                editor.panel.locator('.add-divider-button').first();
            if ((await addDividerButton.count()) > 0) {
                await addDividerButton.click();
            } else {
                // Try RTE toolbar button
                const rteButton = editor.description.locator('..//button[aria-label*="divider"]').first();
                if ((await rteButton.count()) > 0) {
                    await rteButton.click();
                }
            }
            await page.waitForTimeout(1000);
            await expect(await fullPricingExpress.cardDivider).toBeVisible();
            await expect(await fullPricingExpress.cardDivider).toHaveCSS(
                'border-color',
                fullPricingExpress.cssProp.divider['border-color'],
            );
        });

        await test.step('step-3: Save with divider', async () => {
            await editor.saveButton.click();
            await page.waitForTimeout(2000);
            await expect(await editor.saveSuccess).toBeVisible();
            await editor.closeEditor.click();
            await expect(await fullPricingExpress.cardDivider).toBeVisible();
        });

        await test.step('step-4: Remove divider', async () => {
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
            // Look for remove divider button
            const removeDividerButton = editor.panel
                .locator('button[aria-label*="remove"], button:has-text("Remove Divider")')
                .first();
            if ((await removeDividerButton.count()) > 0) {
                await removeDividerButton.click();
            }
            await page.waitForTimeout(1000);
            await expect(await fullPricingExpress.cardDivider).not.toBeVisible();
        });

        await test.step('step-5: Save without divider', async () => {
            await editor.saveButton.click();
            await page.waitForTimeout(2000);
            await expect(await editor.saveSuccess).toBeVisible();
            await editor.closeEditor.click();
            await expect(await fullPricingExpress.cardDivider).not.toBeVisible();
        });
    });

    // @studio-full-pricing-express-workflow-multiple-changes - Multiple simultaneous changes
    test(`${features[5].name},${features[5].tags}`, async ({ page, baseURL }) => {
        const { data } = features[5];
        const testPage = `${baseURL}${features[5].path}${features[5].browserParams}${data.cardid}${miloLibs}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page and open editor', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            const card = await studio.getCard(data.cardid);
            await expect(card).toBeVisible();
            await card.dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-2: Make multiple changes', async () => {
            // Edit title (for metadata only)
            await editor.title.click();
            await page.keyboard.press('Control+A');
            await page.keyboard.press('Meta+A');
            await page.keyboard.type(data.newTitle);
            await page.waitForTimeout(500);

            // Edit badge
            if (await editor.badge.isVisible()) {
                await editor.badge.fill(data.newBadge);
                await page.waitForTimeout(500);
            }

            // Edit CTA
            await editor.CTA.click();
            await editor.footer.locator(editor.linkEdit).click();
            await editor.linkText.fill(data.newCtaText);
            await editor.linkSave.click();
            await page.waitForTimeout(500);
        });

        await test.step('step-3: Save all changes', async () => {
            await editor.saveButton.click();
            await page.waitForTimeout(2000);
            await expect(await editor.saveSuccess).toBeVisible();
        });

        await test.step('step-4: Verify changes persisted', async () => {
            await editor.closeEditor.click();
            // Note: Title doesn't show on card, only icon
            await expect(await fullPricingExpress.cardCTA).toContainText(data.newCtaText);

            if (data.newBadge) {
                const badgeCount = await fullPricingExpress.cardBadge.count();
                if (badgeCount > 0) {
                    await expect(fullPricingExpress.cardBadge.first()).toHaveText(data.newBadge);
                }
            }
        });

        await test.step('step-5: Reopen and verify persistence', async () => {
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await editor.title).toContainText(data.newTitle);
            await expect(await editor.footer).toContainText(data.newCtaText);
            if (data.newBadge && (await editor.badge.isVisible())) {
                await expect(await editor.badge).toHaveValue(data.newBadge);
            }
        });
    });
});
