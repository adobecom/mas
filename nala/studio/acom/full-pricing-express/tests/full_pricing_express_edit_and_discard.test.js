import { test, expect, studio, editor, fullPricingExpress, miloLibs, setTestPage } from '../../../../libs/mas-test.js';
import ACOMFullPricingExpressSpec from '../specs/full_pricing_express_edit_and_discard.spec.js';

const { features } = ACOMFullPricingExpressSpec;

test.describe('M@S Studio ACOM Full Pricing Express card test suite', () => {
    // @studio-full-pricing-express-edit-discard-title - Validate edit title for full pricing express card in mas studio
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(2000);
        });

        await test.step('step-2: Open card editor', async () => {
            const card = await studio.getCard(data.cardid);
            await expect(card).toBeVisible({ timeout: 10000 });
            const variant = await card.getAttribute('variant');
            expect(['full-pricing-express', 'simplified-pricing-express']).toContain(variant);
            await card.dblclick();
            await expect(await editor.panel).toBeVisible({ timeout: 10000 });
        });

        await test.step('step-3: Edit title field', async () => {
            await expect(await editor.title).toBeVisible({ timeout: 10000 });
            await editor.title.fill(data.title.updated);
        });

        await test.step('step-4: Validate title field updated', async () => {
            await expect(await editor.title).toContainText(data.title.updated);
            await expect(await fullPricingExpress.cardTitle).toContainText(data.title.updated);
        });

        await test.step('step-5: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-6: Verify there is no changes of the card', async () => {
            await expect(await fullPricingExpress.cardTitle).toContainText(data.title.original);
        });
    });

    // @studio-full-pricing-express-edit-discard-title-mnemonic - Validate edit mnemonic for full pricing express card in mas studio
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            const card = await studio.getCard(data.cardid);
            await expect(card).toBeVisible();
            const variant = await card.getAttribute('variant');
            expect(['full-pricing-express', 'simplified-pricing-express']).toContain(variant);
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit mnemonic URL field', async () => {
            await expect(await fullPricingExpress.cardIconsSlot).toHaveAttribute('src', data.iconURL.original);
            await editor.openMnemonicModal();
            await editor.mnemonicUrlTab.click();
            await expect(await editor.iconURL).toBeVisible();
            await expect(await editor.iconURL).toHaveValue(data.iconURL.original);
            await editor.iconURL.fill(data.iconURL.updated);
        });

        await test.step('step-4: Validate mnemonic URL field updated', async () => {
            await expect(await editor.iconURL).toHaveValue(data.iconURL.updated);
            await editor.saveMnemonicModal();
            await expect(await fullPricingExpress.cardIconsSlot).toHaveAttribute('src', data.iconURL.updated);
        });

        await test.step('step-5: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-6: Verify there is no changes of the card', async () => {
            await expect(await fullPricingExpress.cardIconsSlot).toHaveAttribute('src', data.iconURL.original);
        });
    });

    // @studio-full-pricing-express-edit-discard-shortDescription - Validate edit shortDescription for full pricing express card in mas studio
    test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
        const { data } = features[2];
        const testPage = `${baseURL}${features[2].path}${miloLibs}${features[2].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            const card = await studio.getCard(data.cardid);
            await expect(card).toBeVisible();
            const variant = await card.getAttribute('variant');
            expect(['full-pricing-express', 'simplified-pricing-express']).toContain(variant);
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit shortDescription field', async () => {
            await expect(await editor.shortDescription).toBeVisible();
            await expect(await editor.shortDescription).toContainText(data.shortDescription.original);
            await editor.shortDescription.fill(data.shortDescription.updated);
        });

        await test.step('step-4: Validate shortDescription field updated', async () => {
            await expect(await editor.shortDescription).toContainText(data.shortDescription.updated);
            await expect(await fullPricingExpress.cardShortDescription).toContainText(data.shortDescription.updated);
        });

        await test.step('step-5: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-6: Verify there is no changes of the card', async () => {
            await expect(await fullPricingExpress.cardShortDescription).toContainText(data.shortDescription.original);
        });
    });

    // @studio-full-pricing-express-edit-discard-cta - Validate edit CTA for full pricing express card in mas studio
    test(`${features[3].name},${features[3].tags}`, async ({ page, baseURL }) => {
        const { data } = features[3];
        const testPage = `${baseURL}${features[3].path}${miloLibs}${features[3].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            const card = await studio.getCard(data.cardid);
            await expect(card).toBeVisible();
            const variant = await card.getAttribute('variant');
            expect(['full-pricing-express', 'simplified-pricing-express']).toContain(variant);
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit CTA label', async () => {
            await expect(await editor.footer.locator(editor.linkEdit)).toBeVisible();
            await expect(await editor.CTA).toBeVisible();
            await expect(await editor.footer).toContainText(data.ctaText.original);
            await editor.CTA.click();
            await editor.footer.locator(editor.linkEdit).click();
            await expect(await editor.linkText).toBeVisible();
            await expect(await editor.linkSave).toBeVisible();
            await expect(await editor.linkText).toHaveValue(data.ctaText.original);
            await editor.linkText.fill(data.ctaText.updated);
            await editor.linkSave.click();
        });

        await test.step('step-4: Validate edited CTA label in Editor panel', async () => {
            await expect(await editor.footer).toContainText(data.ctaText.updated);
        });

        await test.step('step-5: Validate edited CTA on the card', async () => {
            await expect(await fullPricingExpress.cardCTA).toContainText(data.ctaText.updated);
        });

        await test.step('step-6: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-7: Verify there is no changes of the card', async () => {
            await expect(await fullPricingExpress.cardCTA).toContainText(data.ctaText.original);
        });
    });

    // @studio-full-pricing-express-edit-discard-product-icon-picker - Validate edit and discard product icon using icon picker for full pricing express card in mas studio
    test(`${features[4].name},${features[4].tags}`, async ({ page, baseURL }) => {
        const { data } = features[4];
        const testPage = `${baseURL}${features[4].path}${miloLibs}${features[4].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Validate original icon', async () => {
            await expect(await fullPricingExpress.cardIconsSlot).toHaveAttribute('src', data.productIcon.original.src);
        });

        await test.step('step-4: Select product icon from icon picker', async () => {
            await expect(await editor.mnemonicEditButton.first()).toBeVisible();
            await editor.openMnemonicModal();
            await editor.selectProductIcon(data.productIcon.name);
            await editor.saveMnemonicModal();
        });

        await test.step('step-5: Validate mnemonic icon updated in editor', async () => {
            await expect(await fullPricingExpress.cardIconsSlot).toHaveAttribute('src', data.productIcon.updated.src);
        });

        await test.step('step-6: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-7: Validate icon reverted to original', async () => {
            await expect(await fullPricingExpress.cardIconsSlot).toHaveAttribute('src', data.productIcon.original.src);
        });
    });
});
