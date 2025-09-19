import { expect, test } from '@playwright/test';
import StudioPage from '../../../studio.page.js';
import EditorPage from '../../../editor.page.js';
import ACOMFullPricingExpressSpec from '../specs/full_pricing_express_save.spec.js';
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

test.describe('M@S Studio ACOM Full Pricing Express card save test suite', () => {
    // @studio-full-pricing-express-save-title-changes - Validate saving title changes for full pricing express card
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${features[0].browserParams}${data.cardid}${miloLibs}`;
        console.info('[Test Page]: ', testPage);

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
            // Clear and type new value regardless of current state
            await editor.title.clear();
            await editor.title.type(data.newTitle);
            await expect(await editor.title).toHaveText(data.newTitle);
        });

        await test.step('step-4: Save changes', async () => {
            await expect(await editor.saveButton).toBeVisible();
            await expect(await editor.saveButton).toBeEnabled();
            await editor.saveButton.click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-5: Validate save success', async () => {
            await expect(await editor.saveSuccess).toBeVisible();
            await expect(await editor.saveSuccess).toContainText('Changes saved');
        });

        await test.step('step-6: Close editor and validate persistence', async () => {
            await editor.closeButton.click();
            await expect(await editor.panel).not.toBeVisible();
            await expect(await fullPricingExpress.cardTitle).toHaveText(data.newTitle);
        });

        await test.step('step-7: Reopen editor and validate changes persisted', async () => {
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await editor.title).toHaveText(data.newTitle);
        });
    });

    // @studio-full-pricing-express-save-price-changes - Validate saving price changes for full pricing express card
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${features[1].browserParams}${data.cardid}${miloLibs}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor and edit price', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await editor.prices).toBeVisible();
            await expect(await editor.prices).toContainText(data.price);
        });

        await test.step('step-3: Save changes', async () => {
            await expect(await editor.saveButton).toBeVisible();
            await editor.saveButton.click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Validate save success and persistence', async () => {
            await expect(await editor.saveSuccess).toBeVisible();
            await editor.closeButton.click();
            await expect(await fullPricingExpress.cardPrice).toContainText(data.price);
        });
    });

    // @studio-full-pricing-express-save-body-changes - Validate saving body changes for full pricing express card
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

        await test.step('step-4: Save and validate', async () => {
            await editor.saveButton.click();
            await page.waitForTimeout(2000);
            await expect(await editor.saveSuccess).toBeVisible();
            await editor.closeButton.click();
            await expect(await fullPricingExpress.cardBody).toContainText(data.newBody);
        });
    });

    // @studio-full-pricing-express-save-shortDescription-changes - Validate saving shortDescription changes for full pricing express card
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

        await test.step('step-4: Save and validate', async () => {
            await editor.saveButton.click();
            await page.waitForTimeout(2000);
            await expect(await editor.saveSuccess).toBeVisible();
            await editor.closeButton.click();
            await expect(await fullPricingExpress.cardShortDescription).toContainText(data.newShortDescription);
        });
    });

    // @studio-full-pricing-express-save-cta-changes - Validate saving CTA changes for full pricing express card
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
            await expect(await editor.footer).toBeVisible();
            await expect(await editor.footer).toContainText(data.ctaText);
            await editor.CTA.click();
            await editor.footer.locator(editor.linkEdit).click();
            await expect(await editor.linkText).toBeVisible();
            await editor.linkText.fill(data.newCtaText);
            await editor.linkSave.click();
        });

        await test.step('step-4: Save and validate', async () => {
            await editor.saveButton.click();
            await page.waitForTimeout(2000);
            await expect(await editor.saveSuccess).toBeVisible();
            await editor.closeButton.click();
            await expect(await fullPricingExpress.cardCTA).toContainText(data.newCtaText);
        });
    });

    // @studio-full-pricing-express-save-badge-changes - Validate saving badge changes for full pricing express card
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
            await expect(await editor.badge).toBeVisible();
            await expect(await editor.badge).toHaveValue(data.badge);
            await editor.badge.fill(data.newBadge);
        });

        await test.step('step-4: Save and validate', async () => {
            await editor.saveButton.click();
            await page.waitForTimeout(2000);
            await expect(await editor.saveSuccess).toBeVisible();
            await editor.closeButton.click();
            await expect(await fullPricingExpress.cardBadge).toHaveText(data.newBadge);
        });
    });

    // @studio-full-pricing-express-save-mnemonic-changes - Validate saving mnemonic changes for full pricing express card
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
            await expect(await editor.titleFieldGroup.locator(editor.mnemonicButton)).toBeVisible();
            await editor.titleFieldGroup.locator(editor.mnemonicButton).click();
            await expect(await editor.mnemonicModal).toBeVisible();
            await expect(await editor.mnemonicField).toHaveValue(data.mnemonicField);
            await editor.mnemonicField.fill(data.newMnemonicField);
            await editor.mnemonicSave.click();
        });

        await test.step('step-4: Save and validate', async () => {
            await editor.saveButton.click();
            await page.waitForTimeout(2000);
            await expect(await editor.saveSuccess).toBeVisible();
            await editor.closeButton.click();
            await expect(await fullPricingExpress.cardIcon).toHaveAttribute('src', data.newMnemonicField);
        });
    });

    // @studio-full-pricing-express-save-divider-changes - Validate saving divider changes for full pricing express card
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
            await expect(await editor.addDividerButton).toBeVisible();
            await editor.addDividerButton.click();
            await page.waitForTimeout(1000);
            await expect(await fullPricingExpress.cardDivider).toBeVisible();
        });

        await test.step('step-4: Save and validate', async () => {
            await editor.saveButton.click();
            await page.waitForTimeout(2000);
            await expect(await editor.saveSuccess).toBeVisible();
            await editor.closeButton.click();
            await expect(await fullPricingExpress.cardDivider).toBeVisible();
        });

        await test.step('step-5: Reopen and validate divider persisted', async () => {
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await fullPricingExpress.cardDivider).toBeVisible();
        });
    });

    // @studio-full-pricing-express-save-multiple-changes - Validate saving multiple changes for full pricing express card
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
            await expect(await editor.title).toHaveText(data.title);
            await editor.title.clear();
            await editor.title.type(data.newTitle);

            // Edit body
            await expect(await editor.description).toContainText(data.body);
            await editor.description.clear();
            await editor.description.type(data.newBody);

            // Edit CTA
            await expect(await editor.footer).toContainText(data.ctaText);
            await editor.CTA.click();
            await editor.footer.locator(editor.linkEdit).click();
            await editor.linkText.fill(data.newCtaText);
            await editor.linkSave.click();
        });

        await test.step('step-4: Save all changes', async () => {
            await editor.saveButton.click();
            await page.waitForTimeout(2000);
            await expect(await editor.saveSuccess).toBeVisible();
        });

        await test.step('step-5: Validate all changes persisted', async () => {
            await editor.closeButton.click();
            await expect(await fullPricingExpress.cardTitle).toHaveText(data.newTitle);
            await expect(await fullPricingExpress.cardBody).toContainText(data.newBody);
            await expect(await fullPricingExpress.cardCTA).toContainText(data.newCtaText);
        });
    });

    // @studio-full-pricing-express-save-validation-success - Validate save success indicators
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
            await expect(await editor.title).toHaveText(data.title);
            await editor.title.clear();
            await editor.title.type(data.newTitle);
        });

        await test.step('step-4: Validate save button state', async () => {
            await expect(await editor.saveButton).toBeVisible();
            await expect(await editor.saveButton).toBeEnabled();
            await expect(await editor.saveButton).toContainText('Save');
        });

        await test.step('step-5: Save and validate success indicators', async () => {
            await editor.saveButton.click();
            await page.waitForTimeout(2000);
            await expect(await editor.saveSuccess).toBeVisible();
            await expect(await editor.saveSuccess).toContainText('Changes saved');
            await expect(await editor.saveButton).toBeDisabled();
        });

        await test.step('step-6: Validate changes are applied', async () => {
            await expect(await fullPricingExpress.cardTitle).toHaveText(data.newTitle);
            await expect(await editor.title).toHaveText(data.newTitle);
        });
    });
});
