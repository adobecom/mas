import { expect, test } from '@playwright/test';
import StudioPage from '../../../studio.page.js';
import EditorPage from '../../../editor.page.js';
import ACOMFullPricingExpressSpec from '../specs/full_pricing_express_edit.spec.js';
import ACOMFullPricingExpressPage from '../full-pricing-express.page.js';
import OSTPage from '../../../ost.page.js';
import WebUtil from '../../../../libs/webutil.js';

const { features } = ACOMFullPricingExpressSpec;
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

test.describe('M@S Studio ACOM Full Pricing Express card test suite', () => {
    // Note: Variant change test removed - we don't want to change card variants during testing

    // @studio-full-pricing-express-edit-size - Validate edit size for full pricing express card in mas studio
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${features[0].browserParams}${data.cardid}${miloLibs}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            const card = await studio.getCard(data.cardid);
            await expect(card).toBeVisible();
            // Check for either full-pricing-express or simplified-pricing-express variant
            const variant = await card.getAttribute('variant');
            expect(['full-pricing-express', 'simplified-pricing-express']).toContain(variant);
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit size field', async () => {
            await expect(await editor.size).toBeVisible();
            await expect(await editor.size).toHaveAttribute('value', 'Default');
            await editor.size.click();
            await page.getByRole('option', { name: 'Wide', exact: true }).click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Validate new size of the card', async () => {
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('size', 'wide');
        });

        await test.step('step-5: Edit size field to super-wide', async () => {
            await editor.size.click();
            await page.getByRole('option', { name: 'Super Wide', exact: true }).click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-6: Validate new size of the card', async () => {
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('size', 'super-wide');
        });
    });

    // @studio-full-pricing-express-edit-title - Validate edit title for full pricing express card in mas studio
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${features[1].browserParams}${data.cardid}${miloLibs}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);
        });

        await test.step('step-2: Open card editor', async () => {
            const card = await studio.getCard(data.cardid);
            await expect(card).toBeVisible({ timeout: 10000 });
            // Check for either full-pricing-express or simplified-pricing-express variant
            const variant = await card.getAttribute('variant');
            expect(['full-pricing-express', 'simplified-pricing-express']).toContain(variant);
            await card.dblclick();
            await page.waitForTimeout(1000);
            await expect(await editor.panel).toBeVisible({ timeout: 10000 });
        });

        await test.step('step-3: Edit title field', async () => {
            await expect(await editor.title).toBeVisible({ timeout: 10000 });
            // For RTE field, clear and type new value regardless of current state
            await editor.title.clear();
            await editor.title.type(data.newTitle);
        });

        await test.step('step-4: Validate title field updated', async () => {
            await expect(await editor.title).toHaveText(data.newTitle);
            await expect(await fullPricingExpress.cardTitle).toHaveText(data.newTitle);
        });
    });

    // @studio-full-pricing-express-edit-title-mnemonic - Validate edit title mnemonic for full pricing express card in mas studio
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
            // Check for either full-pricing-express or simplified-pricing-express variant
            const variant = await card.getAttribute('variant');
            expect(['full-pricing-express', 'simplified-pricing-express']).toContain(variant);
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Open mnemonic modal for title', async () => {
            await expect(editor.titleFieldGroup).toBeVisible();
            await expect(editor.titleFieldGroup.locator(editor.mnemonicButton)).toBeVisible();
            await editor.titleFieldGroup.locator(editor.mnemonicButton).click();
            await expect(editor.mnemonicModal).toBeVisible();
        });

        await test.step('step-4: Edit mnemonic field', async () => {
            await expect(editor.mnemonicField).toBeVisible();
            await expect(editor.mnemonicField).toHaveValue(data.mnemonicField);
            await editor.mnemonicField.fill(data.newMnemonicField);
        });

        await test.step('step-5: Save mnemonic changes', async () => {
            await expect(editor.mnemonicSave).toBeVisible();
            await editor.mnemonicSave.click();
            await expect(editor.mnemonicModal).not.toBeVisible();
        });

        await test.step('step-6: Validate mnemonic field updated', async () => {
            await expect(await fullPricingExpress.cardIcon).toHaveAttribute('src', data.newMnemonicField);
        });
    });

    // @studio-full-pricing-express-edit-price - Validate edit price for full pricing express card in mas studio
    test(`${features[3].name},${features[3].tags}`, async ({ page, baseURL }) => {
        const { data } = features[3];
        const testPage = `${baseURL}${features[3].path}${features[3].browserParams}${data.cardid}${miloLibs}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            const card = await studio.getCard(data.cardid);
            await expect(card).toBeVisible();
            // Check for either full-pricing-express or simplified-pricing-express variant
            const variant = await card.getAttribute('variant');
            expect(['full-pricing-express', 'simplified-pricing-express']).toContain(variant);
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit price field', async () => {
            await expect(await editor.prices).toBeVisible();
            await expect(await editor.prices).toContainText(data.price);
            await (await editor.prices.locator(editor.regularPrice)).dblclick();
            await expect(await ost.price).toBeVisible();
            await expect(await ost.price).toContainText(data.price);
            await expect(await ost.priceUse).toBeVisible();
            await ost.priceUse.click();
        });

        await test.step('step-4: Validate edited price in Editor panel', async () => {
            await expect(await editor.prices).toContainText(data.newPrice);
        });

        await test.step('step-5: Validate edited price field on the card', async () => {
            await expect(await fullPricingExpress.cardPrice).toContainText(data.newPrice);
        });
    });

    // @studio-full-pricing-express-edit-osi - Validate edit OSI for full pricing express card in mas studio
    test(`${features[4].name},${features[4].tags}`, async ({ page, baseURL }) => {
        const { data } = features[4];
        const testPage = `${baseURL}${features[4].path}${features[4].browserParams}${data.cardid}${miloLibs}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            const card = await studio.getCard(data.cardid);
            await expect(card).toBeVisible();
            // Check for either full-pricing-express or simplified-pricing-express variant
            const variant = await card.getAttribute('variant');
            expect(['full-pricing-express', 'simplified-pricing-express']).toContain(variant);
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Change OSI in OST', async () => {
            await expect(await editor.OSI).toBeVisible();
            await expect(await editor.OSI).toContainText(data.osi);
            await expect(await editor.tags).toBeVisible();
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.offerTypeTag}`));
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.marketSegmentsTag}`));
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.planTypeTag}`));
            await editor.OSIButton.click();
            await ost.backButton.click();
            await page.waitForTimeout(2000);
            await expect(await ost.searchField).toBeVisible();
            await ost.searchField.fill(data.newosi);
            await (await ost.nextButton).click();
            await expect(await ost.priceUse).toBeVisible();
            await ost.priceUse.click();
        });

        await test.step('step-4: Validate edited OSI and tags in Editor panel', async () => {
            await expect(await editor.OSI).toContainText(data.newosi);
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.newPlanTypeTag}`));
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.newOfferTypeTag}`));
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.newMarketSegmentsTag}`));
            await expect(await editor.tags).not.toHaveAttribute('value', new RegExp(`${data.offerTypeTag}`));
            await expect(await editor.tags).not.toHaveAttribute('value', new RegExp(`${data.marketSegmentsTag}`));
            await expect(await editor.tags).not.toHaveAttribute('value', new RegExp(`${data.planTypeTag}`));
        });
    });

    // @studio-full-pricing-express-edit-body - Validate edit body for full pricing express card in mas studio
    test(`${features[5].name},${features[5].tags}`, async ({ page, baseURL }) => {
        const { data } = features[5];
        const testPage = `${baseURL}${features[5].path}${features[5].browserParams}${data.cardid}${miloLibs}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            const card = await studio.getCard(data.cardid);
            await expect(card).toBeVisible();
            // Check for either full-pricing-express or simplified-pricing-express variant
            const variant = await card.getAttribute('variant');
            expect(['full-pricing-express', 'simplified-pricing-express']).toContain(variant);
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit body field', async () => {
            await expect(await editor.description).toBeVisible();
            await expect(await editor.description).toContainText(data.body);
            await editor.description.clear();
            await editor.description.type(data.newBody);
        });

        await test.step('step-4: Validate body field updated', async () => {
            await expect(await editor.description).toContainText(data.newBody);
            await expect(await fullPricingExpress.cardBody).toContainText(data.newBody);
        });
    });

    // @studio-full-pricing-express-edit-shortDescription - Validate edit shortDescription for full pricing express card in mas studio
    test(`${features[6].name},${features[6].tags}`, async ({ page, baseURL }) => {
        const { data } = features[6];
        const testPage = `${baseURL}${features[6].path}${features[6].browserParams}${data.cardid}${miloLibs}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            const card = await studio.getCard(data.cardid);
            await expect(card).toBeVisible();
            // Check for either full-pricing-express or simplified-pricing-express variant
            const variant = await card.getAttribute('variant');
            expect(['full-pricing-express', 'simplified-pricing-express']).toContain(variant);
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit shortDescription field', async () => {
            await expect(await editor.shortDescription).toBeVisible();
            await expect(await editor.shortDescription).toContainText(data.shortDescription);
            await editor.shortDescription.clear();
            await editor.shortDescription.type(data.newShortDescription);
        });

        await test.step('step-4: Validate shortDescription field updated', async () => {
            await expect(await editor.shortDescription).toContainText(data.newShortDescription);
            await expect(await fullPricingExpress.cardShortDescription).toContainText(data.newShortDescription);
        });
    });

    // @studio-full-pricing-express-edit-cta - Validate edit CTA for full pricing express card in mas studio
    test(`${features[7].name},${features[7].tags}`, async ({ page, baseURL }) => {
        const { data } = features[7];
        const testPage = `${baseURL}${features[7].path}${features[7].browserParams}${data.cardid}${miloLibs}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            const card = await studio.getCard(data.cardid);
            await expect(card).toBeVisible();
            // Check for either full-pricing-express or simplified-pricing-express variant
            const variant = await card.getAttribute('variant');
            expect(['full-pricing-express', 'simplified-pricing-express']).toContain(variant);
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit CTA label', async () => {
            await expect(await editor.footer.locator(editor.linkEdit)).toBeVisible();
            await expect(await editor.CTA).toBeVisible();
            await expect(await editor.footer).toContainText(data.ctaText);
            await editor.CTA.click();
            await editor.footer.locator(editor.linkEdit).click();
            await expect(await editor.linkText).toBeVisible();
            await expect(await editor.linkSave).toBeVisible();
            await expect(await editor.linkText).toHaveValue(data.ctaText);
            await editor.linkText.fill(data.newCtaText);
            await editor.linkSave.click();
        });

        await test.step('step-4: Validate edited CTA label in Editor panel', async () => {
            await expect(await editor.footer).toContainText(data.newCtaText);
        });

        await test.step('step-5: Validate edited CTA on the card', async () => {
            await expect(await fullPricingExpress.cardCTA).toContainText(data.newCtaText);
        });
    });

    // @studio-full-pricing-express-edit-divider-insertion - Validate divider insertion for full pricing express card in mas studio
    test(`${features[8].name},${features[8].tags}`, async ({ page, baseURL }) => {
        const { data } = features[8];
        const testPage = `${baseURL}${features[8].path}${features[8].browserParams}${data.cardid}${miloLibs}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            const card = await studio.getCard(data.cardid);
            await expect(card).toBeVisible();
            // Check for either full-pricing-express or simplified-pricing-express variant
            const variant = await card.getAttribute('variant');
            expect(['full-pricing-express', 'simplified-pricing-express']).toContain(variant);
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Insert divider', async () => {
            await expect(await editor.addDividerButton).toBeVisible();
            await editor.addDividerButton.click();
            await page.waitForTimeout(1000);
        });

        await test.step('step-4: Validate divider insertion', async () => {
            await expect(await fullPricingExpress.cardDivider).toBeVisible();
            await expect(await fullPricingExpress.cardDivider).toHaveCSS(
                'border-color',
                fullPricingExpress.cssProp.divider['border-color'],
            );
        });
    });

    // @studio-full-pricing-express-edit-divider-removal - Validate divider removal for full pricing express card in mas studio
    test(`${features[9].name},${features[9].tags}`, async ({ page, baseURL }) => {
        const { data } = features[9];
        const testPage = `${baseURL}${features[9].path}${features[9].browserParams}${data.cardid}${miloLibs}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            const card = await studio.getCard(data.cardid);
            await expect(card).toBeVisible();
            // Check for either full-pricing-express or simplified-pricing-express variant
            const variant = await card.getAttribute('variant');
            expect(['full-pricing-express', 'simplified-pricing-express']).toContain(variant);
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Remove existing divider', async () => {
            await expect(await fullPricingExpress.cardDivider).toBeVisible();
            await expect(await editor.removeDividerButton).toBeVisible();
            await editor.removeDividerButton.click();
            await page.waitForTimeout(1000);
        });

        await test.step('step-4: Validate divider removal', async () => {
            await expect(await fullPricingExpress.cardDivider).not.toBeVisible();
        });
    });

    // @studio-full-pricing-express-edit-badge - Validate edit badge for full pricing express card in mas studio
    test(`${features[10].name},${features[10].tags}`, async ({ page, baseURL }) => {
        const { data } = features[10];
        const testPage = `${baseURL}${features[10].path}${features[10].browserParams}${data.cardid}${miloLibs}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            const card = await studio.getCard(data.cardid);
            await expect(card).toBeVisible();
            // Check for either full-pricing-express or simplified-pricing-express variant
            const variant = await card.getAttribute('variant');
            expect(['full-pricing-express', 'simplified-pricing-express']).toContain(variant);
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit badge field', async () => {
            await expect(await editor.badge).toBeVisible();
            await expect(await editor.badge).toHaveValue(data.badge);
            await editor.badge.fill(data.newBadge);
        });

        await test.step('step-4: Validate badge field updated', async () => {
            await expect(await editor.badge).toHaveValue(data.newBadge);
            await expect(await fullPricingExpress.cardBadge).toHaveText(data.newBadge);
        });
    });

    // @studio-full-pricing-express-edit-badge-color - Validate edit badge color for full pricing express card in mas studio
    test(`${features[11].name},${features[11].tags}`, async ({ page, baseURL }) => {
        const { data } = features[11];
        const testPage = `${baseURL}${features[11].path}${features[11].browserParams}${data.cardid}${miloLibs}`;
        console.info('[Test Page]: ', testPage);
        const fullPricingExpressCard = await studio.getCard(data.cardid);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(fullPricingExpressCard).toBeVisible();
            await expect(fullPricingExpressCard).toHaveAttribute('variant', 'full-pricing-express');
            await fullPricingExpressCard.dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit badge color field', async () => {
            await expect(await editor.badgeColor).toBeVisible();
            await expect(await editor.badgeColor).toContainText(data.color);
            await editor.badgeColor.click();
            await page.getByRole('option', { name: data.newColor, exact: true }).click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Validate badge color field updated', async () => {
            await expect(await editor.badgeColor).toContainText(data.newColor);
            expect(
                await webUtil.verifyCSS(fullPricingExpressCard.locator(fullPricingExpress.cardBadge), {
                    'background-color': data.newColorCSS,
                }),
            ).toBeTruthy();
        });
    });

    // @studio-full-pricing-express-edit-gradient-border - Validate gradient border for full pricing express card in mas studio
    test(`${features[12].name},${features[12].tags}`, async ({ page, baseURL }) => {
        const { data } = features[12];
        const testPage = `${baseURL}${features[12].path}${features[12].browserParams}${data.cardid}${miloLibs}`;
        console.info('[Test Page]: ', testPage);
        const fullPricingExpressCard = await studio.getCard(data.cardid);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(fullPricingExpressCard).toBeVisible();
            await expect(fullPricingExpressCard).toHaveAttribute('variant', 'full-pricing-express');
            await fullPricingExpressCard.dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Validate gradient border is present', async () => {
            if (data.gradientBorder) {
                expect(
                    await webUtil.verifyCSS(fullPricingExpressCard, {
                        'background-image': fullPricingExpress.cssProp.cardWithGradientBorder['background-image'],
                    }),
                ).toBeTruthy();
            }
        });
    });

    // @studio-full-pricing-express-phone-number - Validate phone number for full pricing express card in mas studio
    test(`${features[13].name},${features[13].tags}`, async ({ page, baseURL }) => {
        const { data } = features[13];
        const testPage = `${baseURL}${features[13].path}${features[13].browserParams}${data.cardid}${miloLibs}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Add phone link to the body', async () => {
            await expect(await editor.descriptionFieldGroup.locator(editor.linkEdit)).toBeVisible();
            await editor.descriptionFieldGroup.locator(editor.linkEdit).click();
            await expect(editor.phoneLinkTab).toBeVisible();
            await editor.phoneLinkTab.click();
            await expect(await editor.phoneLinkText).toBeVisible();
            await expect(await editor.linkSave).toBeVisible();
            await editor.phoneLinkText.fill(data.phoneNumber);
            await editor.linkSave.click();
        });

        await test.step('step-4: Validate phone link addition in Editor panel', async () => {
            await expect(await editor.description.locator(editor.phoneLink)).toHaveText(data.phoneNumber);
        });

        await test.step('step-5: Validate phone link addition on the card', async () => {
            await expect(await fullPricingExpress.cardPhoneLink).toHaveText(data.phoneNumber);
        });
    });

    // @studio-full-pricing-express-edit-cta-variant - Validate edit CTA variant for full pricing express card in mas studio
    test(`${features[14].name},${features[14].tags}`, async ({ page, baseURL }) => {
        const { data } = features[14];
        const testPage = `${baseURL}${features[14].path}${features[14].browserParams}${data.cardid}${miloLibs}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            const card = await studio.getCard(data.cardid);
            await expect(card).toBeVisible();
            // Check for either full-pricing-express or simplified-pricing-express variant
            const variant = await card.getAttribute('variant');
            expect(['full-pricing-express', 'simplified-pricing-express']).toContain(variant);
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit CTA variant', async () => {
            await expect(await editor.footer.locator(editor.linkEdit)).toBeVisible();
            await expect(await editor.CTA).toBeVisible();
            await expect(await editor.CTA).toHaveClass(data.variant);
            expect(await webUtil.verifyCSS(await fullPricingExpress.cardCTA, data.ctaCSS)).toBeTruthy();
            await editor.CTA.click();
            await editor.footer.locator(editor.linkEdit).click();
            await expect(await editor.linkVariant).toBeVisible();
            await expect(await editor.linkSave).toBeVisible();
            await expect(await editor.getLinkVariant(data.newVariant)).toBeVisible();
            await (await editor.getLinkVariant(data.newVariant)).click();
            await editor.linkSave.click();
        });

        await test.step('step-4: Validate edited CTA variant in Editor panel', async () => {
            await expect(await editor.CTA).toHaveClass(data.newVariant);
            await expect(await editor.CTA).not.toHaveClass(data.variant);
        });

        await test.step('step-5: Validate edited CTA on the card', async () => {
            expect(await webUtil.verifyCSS(await fullPricingExpress.cardCTA, data.newCtaCSS)).toBeTruthy();
            await expect(await fullPricingExpress.cardCTA).toHaveAttribute('data-wcs-osi', data.osi);
            await expect(await fullPricingExpress.cardCTA).toHaveAttribute('is', 'checkout-link');
        });
    });

    // @studio-full-pricing-express-edit-cta-checkout-params - Validate edit CTA checkout params for full pricing express card in mas studio
    test(`${features[15].name},${features[15].tags}`, async ({ page, baseURL }) => {
        const { data } = features[15];
        const testPage = `${baseURL}${features[15].path}${features[15].browserParams}${data.cardid}${miloLibs}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            const card = await studio.getCard(data.cardid);
            await expect(card).toBeVisible();
            // Check for either full-pricing-express or simplified-pricing-express variant
            const variant = await card.getAttribute('variant');
            expect(['full-pricing-express', 'simplified-pricing-express']).toContain(variant);
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit CTA checkout params', async () => {
            await expect(await editor.footer.locator(editor.linkEdit)).toBeVisible();
            await expect(await editor.CTA).toBeVisible();
            await editor.CTA.click();
            await editor.footer.locator(editor.linkEdit).click();
            await expect(await editor.checkoutParameters).toBeVisible();
            await expect(await editor.linkSave).toBeVisible();

            const checkoutParamsString = Object.keys(data.checkoutParams)
                .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(data.checkoutParams[key])}`)
                .join('&');
            await editor.checkoutParameters.fill(checkoutParamsString);
            await editor.linkSave.click();
        });

        await test.step('step-4: Validate edited CTA on the card', async () => {
            await expect(await fullPricingExpress.cardCTA).toHaveAttribute('data-wcs-osi', data.osi);
            await expect(await fullPricingExpress.cardCTA).toHaveAttribute('is', 'checkout-link');
            const CTAhref = await fullPricingExpress.cardCTA.getAttribute('href');
            let searchParams = new URLSearchParams(decodeURI(CTAhref).split('?')[1]);
            expect(searchParams.get('mv')).toBe(data.checkoutParams.mv);
            expect(searchParams.get('promoid')).toBe(data.checkoutParams.promoid);
            expect(searchParams.get('mv2')).toBe(data.checkoutParams.mv2);
        });
    });

    // @studio-full-pricing-express-edit-price-promo - Validate edit price promo for full pricing express card in mas studio
    test(`${features[16].name},${features[16].tags}`, async ({ page, baseURL }) => {
        const { data } = features[16];
        const testPage = `${baseURL}${features[16].path}${features[16].browserParams}${data.cardid}${miloLibs}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            const card = await studio.getCard(data.cardid);
            await expect(card).toBeVisible();
            // Check for either full-pricing-express or simplified-pricing-express variant
            const variant = await card.getAttribute('variant');
            expect(['full-pricing-express', 'simplified-pricing-express']).toContain(variant);
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit promo field', async () => {
            await expect(await editor.prices.locator(editor.regularPrice)).toHaveAttribute('data-promotion-code', data.promo);
            await expect(await fullPricingExpress.cardPrice).toHaveAttribute('data-promotion-code', data.promo);
            await (await editor.prices.locator(editor.regularPrice)).dblclick();

            await expect(await ost.promoField).toBeVisible();
            await expect(await ost.promoLabel).toBeVisible();
            await expect(await ost.promoLabel).toContainText(data.promo);
            await expect(await ost.promoField).toHaveValue(data.promo);

            await ost.promoField.fill(data.newPromo);
            await expect(await ost.promoLabel).toContainText(data.newPromo);
            await expect(await ost.promoField).toHaveValue(data.newPromo);
            await ost.priceUse.click();
        });

        await test.step('step-4: Validate promo change in Editor panel', async () => {
            await expect(await editor.prices.locator(editor.regularPrice)).toHaveAttribute(
                'data-promotion-code',
                data.newPromo,
            );
        });

        await test.step('step-5: Validate edited price promo on the card', async () => {
            await expect(await fullPricingExpress.cardPrice).toHaveAttribute('data-promotion-code', data.newPromo);
        });
    });

    // @studio-full-pricing-express-edit-cta-promo - Validate edit cta promo for full pricing express card in mas studio
    test(`${features[17].name},${features[17].tags}`, async ({ page, baseURL }) => {
        const { data } = features[17];
        const testPage = `${baseURL}${features[17].path}${features[17].browserParams}${data.cardid}${miloLibs}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            const card = await studio.getCard(data.cardid);
            await expect(card).toBeVisible();
            // Check for either full-pricing-express or simplified-pricing-express variant
            const variant = await card.getAttribute('variant');
            expect(['full-pricing-express', 'simplified-pricing-express']).toContain(variant);
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit CTA promo field', async () => {
            await expect(await editor.CTA).toHaveAttribute('data-promotion-code', data.promo);
            await expect(await fullPricingExpress.cardCTA).toHaveAttribute('data-promotion-code', data.promo);

            const CTAhref = await fullPricingExpress.cardCTA.getAttribute('href');
            let workflowStep = decodeURI(CTAhref).split('?')[0];
            let searchParams = new URLSearchParams(decodeURI(CTAhref).split('?')[1]);

            expect(workflowStep).toContain(data.ucv3);
            expect(searchParams.get('co')).toBe(data.country);
            expect(searchParams.get('ctx')).toBe(data.ctx);
            expect(searchParams.get('lang')).toBe(data.lang);
            expect(searchParams.get('cli')).toBe(data.client);
            expect(searchParams.get('apc')).toBe(data.promo);

            await (await editor.CTA).dblclick();
            await expect(await ost.checkoutTab).toBeVisible();
            await expect(await ost.promoField).toBeVisible();
            await expect(await ost.promoLabel).toBeVisible();
            await expect(await ost.promoLabel).toContainText(data.promo);
            await expect(await ost.promoField).toHaveValue(data.promo);

            await ost.promoField.fill(data.newPromo);
            expect(await ost.promoLabel).toContainText(data.newPromo);
            await expect(await ost.promoField).toHaveValue(data.newPromo);
            await ost.checkoutLinkUse.click();
        });

        await test.step('step-4: Validate edited CTA promo in Editor panel', async () => {
            await expect(await editor.CTA).toHaveAttribute('data-promotion-code', data.newPromo);
        });

        await test.step('step-5: Validate edited CTA promo on the card', async () => {
            const newCTA = await fullPricingExpress.cardCTA;
            await expect(newCTA).toHaveAttribute('data-promotion-code', data.newPromo);
            await expect(newCTA).toHaveAttribute('href', new RegExp(`${data.ucv3}`));
            await expect(newCTA).toHaveAttribute('href', new RegExp(`co=${data.country}`));
            await expect(newCTA).toHaveAttribute('href', new RegExp(`ctx=${data.ctx}`));
            await expect(newCTA).toHaveAttribute('href', new RegExp(`lang=${data.lang}`));
            await expect(newCTA).toHaveAttribute('href', new RegExp(`cli=${data.client}`));
            await expect(newCTA).toHaveAttribute('href', new RegExp(`apc=${data.newPromo}`));
        });
    });

    // @studio-full-pricing-express-edit-mnemonic-size-xs - Test editing mnemonic with extra small size
    test(`${features[18].name},${features[18].tags}`, async ({ page, baseURL }) => {
        const { data } = features[18];
        const testPage = `${baseURL}${features[18].path}${features[18].browserParams}${data.cardid}${miloLibs}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await (await studio.getCard(data.cardid)).dblclick();
            await page.waitForTimeout(3000);
            await expect(editor.cardEditor).toBeVisible();
        });

        await test.step('step-3: Edit mnemonic with XS size', async () => {
            await expect(editor.getField('mnemonicField')).toBeVisible();
            await editor.getField('mnemonicField').click();
            await page.waitForTimeout(1000);

            const urlField = editor.getModalField('mnemonicField', 'src') || page.locator('input[name="src"]').first();
            await urlField.fill(data.mnemonicField);

            if (data.mnemonicText) {
                const textField = editor.getModalField('mnemonicField', 'text') || page.locator('input[name="text"]').first();
                await textField.fill(data.mnemonicText);
            }

            const sizeSelector = page.locator('select[name="size"]').first() || page.locator('[data-field="size"]').first();
            await sizeSelector.selectOption(data.mnemonicSize);

            await editor.saveModal('mnemonicField');
            await page.waitForTimeout(1000);
        });

        await test.step('step-4: Verify mnemonic size', async () => {
            await expect(fullPricingExpress.mnemonicXS).toBeVisible();
            await expect(fullPricingExpress.merchIconXS).toHaveAttribute('size', data.mnemonicSize);
            await expect(fullPricingExpress.merchIconXS).toHaveAttribute('src', data.mnemonicField);
        });
    });

    // @studio-full-pricing-express-edit-mnemonic-size-s - Test editing mnemonic with small size
    test(`${features[19].name},${features[19].tags}`, async ({ page, baseURL }) => {
        const { data } = features[19];
        const testPage = `${baseURL}${features[19].path}${features[19].browserParams}${data.cardid}${miloLibs}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await (await studio.getCard(data.cardid)).dblclick();
            await page.waitForTimeout(3000);
            await expect(editor.cardEditor).toBeVisible();
        });

        await test.step('step-3: Edit mnemonic with S size', async () => {
            await expect(editor.getField('mnemonicField')).toBeVisible();
            await editor.getField('mnemonicField').click();
            await page.waitForTimeout(1000);

            const urlField = editor.getModalField('mnemonicField', 'src') || page.locator('input[name="src"]').first();
            await urlField.fill(data.mnemonicField);

            if (data.mnemonicText) {
                const textField = editor.getModalField('mnemonicField', 'text') || page.locator('input[name="text"]').first();
                await textField.fill(data.mnemonicText);
            }

            const sizeSelector = page.locator('select[name="size"]').first() || page.locator('[data-field="size"]').first();
            await sizeSelector.selectOption(data.mnemonicSize);

            await editor.saveModal('mnemonicField');
            await page.waitForTimeout(1000);
        });

        await test.step('step-4: Verify mnemonic size', async () => {
            await expect(fullPricingExpress.mnemonicS).toBeVisible();
            await expect(fullPricingExpress.merchIconS).toHaveAttribute('size', data.mnemonicSize);
            await expect(fullPricingExpress.merchIconS).toHaveAttribute('src', data.mnemonicField);
        });
    });

    // @studio-full-pricing-express-edit-mnemonic-size-m - Test editing mnemonic with medium size
    test(`${features[20].name},${features[20].tags}`, async ({ page, baseURL }) => {
        const { data } = features[20];
        const testPage = `${baseURL}${features[20].path}${features[20].browserParams}${data.cardid}${miloLibs}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await (await studio.getCard(data.cardid)).dblclick();
            await page.waitForTimeout(3000);
            await expect(editor.cardEditor).toBeVisible();
        });

        await test.step('step-3: Edit mnemonic with M size', async () => {
            await expect(editor.getField('mnemonicField')).toBeVisible();
            await editor.getField('mnemonicField').click();
            await page.waitForTimeout(1000);

            const urlField = editor.getModalField('mnemonicField', 'src') || page.locator('input[name="src"]').first();
            await urlField.fill(data.mnemonicField);

            if (data.mnemonicText) {
                const textField = editor.getModalField('mnemonicField', 'text') || page.locator('input[name="text"]').first();
                await textField.fill(data.mnemonicText);
            }

            const sizeSelector = page.locator('select[name="size"]').first() || page.locator('[data-field="size"]').first();
            await sizeSelector.selectOption(data.mnemonicSize);

            await editor.saveModal('mnemonicField');
            await page.waitForTimeout(1000);
        });

        await test.step('step-4: Verify mnemonic size', async () => {
            await expect(fullPricingExpress.mnemonicM).toBeVisible();
            await expect(fullPricingExpress.merchIconM).toHaveAttribute('size', data.mnemonicSize);
            await expect(fullPricingExpress.merchIconM).toHaveAttribute('src', data.mnemonicField);
        });
    });

    // @studio-full-pricing-express-edit-mnemonic-size-l - Test editing mnemonic with large size
    test(`${features[21].name},${features[21].tags}`, async ({ page, baseURL }) => {
        const { data } = features[21];
        const testPage = `${baseURL}${features[21].path}${features[21].browserParams}${data.cardid}${miloLibs}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await (await studio.getCard(data.cardid)).dblclick();
            await page.waitForTimeout(3000);
            await expect(editor.cardEditor).toBeVisible();
        });

        await test.step('step-3: Edit mnemonic with L size', async () => {
            await expect(editor.getField('mnemonicField')).toBeVisible();
            await editor.getField('mnemonicField').click();
            await page.waitForTimeout(1000);

            const urlField = editor.getModalField('mnemonicField', 'src') || page.locator('input[name="src"]').first();
            await urlField.fill(data.mnemonicField);

            if (data.mnemonicText) {
                const textField = editor.getModalField('mnemonicField', 'text') || page.locator('input[name="text"]').first();
                await textField.fill(data.mnemonicText);
            }

            const sizeSelector = page.locator('select[name="size"]').first() || page.locator('[data-field="size"]').first();
            await sizeSelector.selectOption(data.mnemonicSize);

            await editor.saveModal('mnemonicField');
            await page.waitForTimeout(1000);
        });

        await test.step('step-4: Verify mnemonic size', async () => {
            await expect(fullPricingExpress.mnemonicL).toBeVisible();
            await expect(fullPricingExpress.merchIconL).toHaveAttribute('size', data.mnemonicSize);
            await expect(fullPricingExpress.merchIconL).toHaveAttribute('src', data.mnemonicField);
        });
    });

    // @studio-full-pricing-express-edit-mnemonic-size-change - Test changing mnemonic size in modal
    test(`${features[22].name},${features[22].tags}`, async ({ page, baseURL }) => {
        const { data } = features[22];
        const testPage = `${baseURL}${features[22].path}${features[22].browserParams}${data.cardid}${miloLibs}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await (await studio.getCard(data.cardid)).dblclick();
            await page.waitForTimeout(3000);
            await expect(editor.cardEditor).toBeVisible();
        });

        await test.step('step-3: Set initial mnemonic size', async () => {
            await expect(editor.getField('mnemonicField')).toBeVisible();
            await editor.getField('mnemonicField').click();
            await page.waitForTimeout(1000);

            const urlField = editor.getModalField('mnemonicField', 'src') || page.locator('input[name="src"]').first();
            await urlField.fill(data.mnemonicField);

            const sizeSelector = page.locator('select[name="size"]').first() || page.locator('[data-field="size"]').first();
            await sizeSelector.selectOption(data.initialSize);

            await editor.saveModal('mnemonicField');
            await page.waitForTimeout(1000);
        });

        await test.step('step-4: Change mnemonic size', async () => {
            await editor.getField('mnemonicField').click();
            await page.waitForTimeout(1000);

            const sizeSelector = page.locator('select[name="size"]').first() || page.locator('[data-field="size"]').first();
            await sizeSelector.selectOption(data.newSize);

            await editor.saveModal('mnemonicField');
            await page.waitForTimeout(1000);
        });

        await test.step('step-5: Verify size change', async () => {
            const mnemonicElement = await page.locator(`merch-card[data-card-id="${data.cardid}"] merch-icon`).first();
            await expect(mnemonicElement).toHaveAttribute('size', data.newSize);
        });
    });

    // @studio-full-pricing-express-edit-collection-layout - Test editing collection layout
    test(`${features[23].name},${features[23].tags}`, async ({ page, baseURL }) => {
        const { data } = features[23];
        const testPage = `${baseURL}${features[23].path}${features[23].browserParams}${data.cardid}${miloLibs}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Select collection view', async () => {
            const collectionRadio = await page.locator('#collection-view-radio');
            await collectionRadio.click();
            await page.waitForTimeout(1000);
        });

        await test.step('step-3: Edit layout settings', async () => {
            const layoutSelector = await page.locator('select#card-layout');
            await layoutSelector.selectOption(data.layout);

            const columnsInput = await page.locator('input#card-columns');
            await columnsInput.fill(data.columns.toString());
        });

        await test.step('step-4: Verify collection layout', async () => {
            const collection = await page.locator('.merch-card-collection');
            await expect(collection).toHaveAttribute('data-layout', data.layout);
            await expect(collection).toHaveCSS('grid-template-columns', new RegExp(`repeat\\(${data.columns}`));
        });
    });

    // @studio-full-pricing-express-edit-compare-feature - Test editing compare feature
    test(`${features[24].name},${features[24].tags}`, async ({ page, baseURL }) => {
        const { data } = features[24];
        const testPage = `${baseURL}${features[24].path}${features[24].browserParams}${data.cardid}${miloLibs}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await (await studio.getCard(data.cardid)).dblclick();
            await page.waitForTimeout(3000);
            await expect(editor.cardEditor).toBeVisible();
        });

        await test.step('step-3: Enable compare feature', async () => {
            const compareCheckbox = await page.locator('#enable-compare');
            await compareCheckbox.check();

            const compareField = await page.locator('input#compare-field');
            await compareField.fill(data.compareText);
        });

        await test.step('step-4: Verify compare feature', async () => {
            const compareElement = await page.locator(`merch-card[data-card-id="${data.cardid}"] .compare-section`);
            await expect(compareElement).toBeVisible();
            await expect(compareElement).toContainText(data.compareText);
        });
    });

    // @studio-full-pricing-express-edit-divider - Test editing divider
    test(`${features[25].name},${features[25].tags}`, async ({ page, baseURL }) => {
        const { data } = features[25];
        const testPage = `${baseURL}${features[25].path}${features[25].browserParams}${data.cardid}${miloLibs}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await (await studio.getCard(data.cardid)).dblclick();
            await page.waitForTimeout(3000);
            await expect(editor.cardEditor).toBeVisible();
        });

        await test.step('step-3: Add divider', async () => {
            const dividerButton = await page.locator('button#add-divider');
            await dividerButton.click();

            if (data.dividerStyle) {
                const styleSelector = await page.locator('select#divider-style');
                await styleSelector.selectOption(data.dividerStyle);
            }
        });

        await test.step('step-4: Verify divider', async () => {
            const divider = await page.locator(`merch-card[data-card-id="${data.cardid}"] hr`);
            await expect(divider).toBeVisible();
            if (data.dividerStyle) {
                await expect(divider).toHaveClass(data.dividerStyle);
            }
        });
    });
});
