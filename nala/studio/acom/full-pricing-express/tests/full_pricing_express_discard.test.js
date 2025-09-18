import { expect, test } from '@playwright/test';
import StudioPage from '../../../studio.page.js';
import EditorPage from '../../../editor.page.js';
import ACOMFullPricingExpressSpec from '../specs/full_pricing_express_discard.spec.js';
import ACOMFullPricingExpressPage from '../full-pricing-express.page.js';

const { features } = ACOMFullPricingExpressSpec;
const miloLibs = process.env.MILO_LIBS || '';

let studio;
let editor;
let fullPricingExpress;

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
});

test.describe('M@S Studio ACOM Full Pricing Express card discard test suite', () => {
    // @studio-full-pricing-express-discard-title-changes - Validate discarding title changes for full pricing express card
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${features[0].browserParams}${data.cardid}${miloLibs}`;
        console.info('[Test Page]: ', testPage);

        let originalTitle;

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'full-pricing-express');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit title field', async () => {
            await expect(await editor.title).toBeVisible();
            // Store original title for later verification
            originalTitle = await editor.title.textContent();
            await editor.title.clear();
            await editor.title.type(data.newTitle);
            await expect(await editor.title).toHaveText(data.newTitle);
            await expect(await fullPricingExpress.cardTitle).toHaveText(data.newTitle);
        });

        await test.step('step-4: Discard changes', async () => {
            await expect(await editor.discardButton).toBeVisible();
            await expect(await editor.discardButton).toBeEnabled();
            await editor.discardButton.click();
        });

        await test.step('step-5: Validate discard confirmation dialog', async () => {
            await expect(await editor.discardConfirmDialog).toBeVisible();
            await expect(await editor.discardConfirmDialog).toContainText('Are you sure you want to discard your changes?');
            await expect(await editor.discardConfirmButton).toBeVisible();
            await expect(await editor.cancelDiscardButton).toBeVisible();
        });

        await test.step('step-6: Confirm discard', async () => {
            await editor.discardConfirmButton.click();
            await page.waitForTimeout(1000);
        });

        await test.step('step-7: Validate changes are reverted', async () => {
            await expect(await editor.title).toHaveText(originalTitle);
            await expect(await fullPricingExpress.cardTitle).toHaveText(originalTitle);
            await expect(await editor.discardButton).toBeDisabled();
        });
    });

    // @studio-full-pricing-express-discard-price-changes - Validate discarding price changes for full pricing express card
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${features[1].browserParams}${data.cardid}${miloLibs}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor and note original price', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await editor.prices).toBeVisible();
            await expect(await editor.prices).toContainText(data.price);
            await expect(await fullPricingExpress.cardPrice).toContainText(data.price);
        });

        await test.step('step-3: Discard any changes', async () => {
            await editor.discardButton.click();
            await expect(await editor.discardConfirmDialog).toBeVisible();
            await editor.discardConfirmButton.click();
            await page.waitForTimeout(1000);
        });

        await test.step('step-4: Validate original price is preserved', async () => {
            await expect(await editor.prices).toContainText(data.price);
            await expect(await fullPricingExpress.cardPrice).toContainText(data.price);
        });
    });

    // @studio-full-pricing-express-discard-body-changes - Validate discarding body changes for full pricing express card
    test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
        const { data } = features[2];
        const testPage = `${baseURL}${features[2].path}${features[2].browserParams}${data.cardid}${miloLibs}`;
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

        await test.step('step-3: Edit body field', async () => {
            await expect(await editor.description).toBeVisible();
            await expect(await editor.description).toContainText(data.body);
            await editor.description.clear();
            await editor.description.type(data.newBody);
            await expect(await editor.description).toContainText(data.newBody);
        });

        await test.step('step-4: Discard changes', async () => {
            await editor.discardButton.click();
            await editor.discardConfirmButton.click();
            await page.waitForTimeout(1000);
        });

        await test.step('step-5: Validate changes are reverted', async () => {
            await expect(await editor.description).toContainText(data.body);
            await expect(await fullPricingExpress.cardBody).toContainText(data.body);
        });
    });

    // @studio-full-pricing-express-discard-shortDescription-changes - Validate discarding shortDescription changes for full pricing express card
    test(`${features[3].name},${features[3].tags}`, async ({ page, baseURL }) => {
        const { data } = features[3];
        const testPage = `${baseURL}${features[3].path}${features[3].browserParams}${data.cardid}${miloLibs}`;
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

        await test.step('step-3: Edit shortDescription field', async () => {
            await expect(await editor.shortDescription).toBeVisible();
            await expect(await editor.shortDescription).toContainText(data.shortDescription);
            await editor.shortDescription.clear();
            await editor.shortDescription.type(data.newShortDescription);
            await expect(await editor.shortDescription).toContainText(data.newShortDescription);
        });

        await test.step('step-4: Discard and validate', async () => {
            await editor.discardButton.click();
            await editor.discardConfirmButton.click();
            await page.waitForTimeout(1000);
            await expect(await editor.shortDescription).toContainText(data.shortDescription);
            await expect(await fullPricingExpress.cardShortDescription).toContainText(data.shortDescription);
        });
    });

    // @studio-full-pricing-express-discard-cta-changes - Validate discarding CTA changes for full pricing express card
    test(`${features[4].name},${features[4].tags}`, async ({ page, baseURL }) => {
        const { data } = features[4];
        const testPage = `${baseURL}${features[4].path}${features[4].browserParams}${data.cardid}${miloLibs}`;
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

        await test.step('step-3: Edit CTA text', async () => {
            await expect(await editor.footer).toContainText(data.ctaText);
            await editor.CTA.click();
            await editor.footer.locator(editor.linkEdit).click();
            await editor.linkText.fill(data.newCtaText);
            await editor.linkSave.click();
            await expect(await editor.footer).toContainText(data.newCtaText);
        });

        await test.step('step-4: Discard and validate', async () => {
            await editor.discardButton.click();
            await editor.discardConfirmButton.click();
            await page.waitForTimeout(1000);
            await expect(await editor.footer).toContainText(data.ctaText);
            await expect(await fullPricingExpress.cardCTA).toContainText(data.ctaText);
        });
    });

    // @studio-full-pricing-express-discard-badge-changes - Validate discarding badge changes for full pricing express card
    test(`${features[5].name},${features[5].tags}`, async ({ page, baseURL }) => {
        const { data } = features[5];
        const testPage = `${baseURL}${features[5].path}${features[5].browserParams}${data.cardid}${miloLibs}`;
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

        await test.step('step-3: Edit badge field', async () => {
            await expect(await editor.badge).toHaveValue(data.badge);
            await editor.badge.fill(data.newBadge);
            await expect(await fullPricingExpress.cardBadge).toHaveText(data.newBadge);
        });

        await test.step('step-4: Discard and validate', async () => {
            await editor.discardButton.click();
            await editor.discardConfirmButton.click();
            await page.waitForTimeout(1000);
            await expect(await editor.badge).toHaveValue(data.badge);
            await expect(await fullPricingExpress.cardBadge).toHaveText(data.badge);
        });
    });

    // @studio-full-pricing-express-discard-mnemonic-changes - Validate discarding mnemonic changes for full pricing express card
    test(`${features[6].name},${features[6].tags}`, async ({ page, baseURL }) => {
        const { data } = features[6];
        const testPage = `${baseURL}${features[6].path}${features[6].browserParams}${data.cardid}${miloLibs}`;
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

        await test.step('step-3: Edit mnemonic field', async () => {
            await editor.titleFieldGroup.locator(editor.mnemonicButton).click();
            await expect(await editor.mnemonicModal).toBeVisible();
            await expect(await editor.mnemonicField).toHaveValue(data.mnemonicField);
            await editor.mnemonicField.fill(data.newMnemonicField);
            await editor.mnemonicSave.click();
            await expect(await fullPricingExpress.cardIcon).toHaveAttribute('src', data.newMnemonicField);
        });

        await test.step('step-4: Discard and validate', async () => {
            await editor.discardButton.click();
            await editor.discardConfirmButton.click();
            await page.waitForTimeout(1000);
            await expect(await fullPricingExpress.cardIcon).toHaveAttribute('src', data.mnemonicField);
        });
    });

    // @studio-full-pricing-express-discard-divider-changes - Validate discarding divider changes for full pricing express card
    test(`${features[7].name},${features[7].tags}`, async ({ page, baseURL }) => {
        const { data } = features[7];
        const testPage = `${baseURL}${features[7].path}${features[7].browserParams}${data.cardid}${miloLibs}`;
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

        await test.step('step-3: Add divider', async () => {
            const initialDividerState = await fullPricingExpress.cardDivider.isVisible();
            await editor.addDividerButton.click();
            await page.waitForTimeout(1000);
            if (!initialDividerState) {
                await expect(await fullPricingExpress.cardDivider).toBeVisible();
            }
        });

        await test.step('step-4: Discard and validate', async () => {
            await editor.discardButton.click();
            await editor.discardConfirmButton.click();
            await page.waitForTimeout(1000);
            // Divider state should be reverted to initial state
        });
    });

    // @studio-full-pricing-express-discard-multiple-changes - Validate discarding multiple changes for full pricing express card
    test(`${features[8].name},${features[8].tags}`, async ({ page, baseURL }) => {
        const { data } = features[8];
        const testPage = `${baseURL}${features[8].path}${features[8].browserParams}${data.cardid}${miloLibs}`;
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

        await test.step('step-3: Edit multiple fields', async () => {
            // Edit title
            await editor.title.clear();
            await editor.title.type(data.newTitle);
            await expect(await fullPricingExpress.cardTitle).toHaveText(data.newTitle);

            // Edit body
            await editor.description.clear();
            await editor.description.type(data.newBody);
            await expect(await fullPricingExpress.cardBody).toContainText(data.newBody);

            // Edit CTA
            await editor.CTA.click();
            await editor.footer.locator(editor.linkEdit).click();
            await editor.linkText.fill(data.newCtaText);
            await editor.linkSave.click();
            await expect(await fullPricingExpress.cardCTA).toContainText(data.newCtaText);
        });

        await test.step('step-4: Discard all changes', async () => {
            await editor.discardButton.click();
            await editor.discardConfirmButton.click();
            await page.waitForTimeout(1000);
        });

        await test.step('step-5: Validate all changes are reverted', async () => {
            await expect(await editor.title).toHaveText(data.title);
            await expect(await fullPricingExpress.cardTitle).toHaveText(data.title);
            await expect(await editor.description).toContainText(data.body);
            await expect(await fullPricingExpress.cardBody).toContainText(data.body);
            await expect(await editor.footer).toContainText(data.ctaText);
            await expect(await fullPricingExpress.cardCTA).toContainText(data.ctaText);
        });
    });

    // @studio-full-pricing-express-discard-confirmation-dialog - Validate discard confirmation dialog behavior
    test(`${features[9].name},${features[9].tags}`, async ({ page, baseURL }) => {
        const { data } = features[9];
        const testPage = `${baseURL}${features[9].path}${features[9].browserParams}${data.cardid}${miloLibs}`;
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

        await test.step('step-3: Make a change', async () => {
            await editor.title.clear();
            await editor.title.type(data.newTitle);
            await expect(await editor.discardButton).toBeEnabled();
        });

        await test.step('step-4: Validate confirmation dialog elements', async () => {
            await editor.discardButton.click();
            await expect(await editor.discardConfirmDialog).toBeVisible();
            await expect(await editor.discardConfirmDialog).toContainText('Are you sure you want to discard your changes?');
            await expect(await editor.discardConfirmButton).toBeVisible();
            await expect(await editor.discardConfirmButton).toContainText('Discard');
            await expect(await editor.cancelDiscardButton).toBeVisible();
            await expect(await editor.cancelDiscardButton).toContainText('Cancel');
        });

        await test.step('step-5: Confirm discard and validate', async () => {
            await editor.discardConfirmButton.click();
            await expect(await editor.discardConfirmDialog).not.toBeVisible();
            await expect(await editor.title).toHaveText(data.title);
        });
    });

    // @studio-full-pricing-express-discard-cancel-discard - Validate canceling discard operation
    test(`${features[10].name},${features[10].tags}`, async ({ page, baseURL }) => {
        const { data } = features[10];
        const testPage = `${baseURL}${features[10].path}${features[10].browserParams}${data.cardid}${miloLibs}`;
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

        await test.step('step-3: Make a change', async () => {
            await expect(await editor.title).toHaveText(data.title);
            await editor.title.clear();
            await editor.title.type(data.newTitle);
            await expect(await editor.title).toHaveText(data.newTitle);
        });

        await test.step('step-4: Start discard process and cancel', async () => {
            await editor.discardButton.click();
            await expect(await editor.discardConfirmDialog).toBeVisible();
            await editor.cancelDiscardButton.click();
        });

        await test.step('step-5: Validate changes are preserved', async () => {
            await expect(await editor.discardConfirmDialog).not.toBeVisible();
            await expect(await editor.title).toHaveText(data.newTitle);
            await expect(await fullPricingExpress.cardTitle).toHaveText(data.newTitle);
            await expect(await editor.discardButton).toBeEnabled();
        });
    });
});
