import { test, expect, studio, editor, fullPricingExpress, miloLibs, setTestPage } from '../../../../libs/mas-test.js';
import EXPRESSFullPricingSpec from '../specs/full_pricing_edit_and_discard.spec.js';

const { features } = EXPRESSFullPricingSpec;

test.describe('M@S Studio EXPRESS Full Pricing card test suite', () => {
    // @studio-full-pricing-express-edit-discard-mnemonic-title - Validate edit mnemonic for full pricing express card in mas studio
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio fragment editor page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(await editor.panel).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'full-pricing-express');
        });

        await test.step('step-2: Edit mnemonic URL field', async () => {
            await expect(await fullPricingExpress.cardIconsSlot).toHaveAttribute('src', data.iconURL.original);
            await editor.openMnemonicModal();
            await editor.mnemonicUrlTab.click();
            await expect(await editor.iconURL).toBeVisible();
            await expect(await editor.iconURL).toHaveValue(data.iconURL.original);
            await editor.iconURL.fill(data.iconURL.updated);
        });

        await test.step('step-3: Validate mnemonic URL field updated', async () => {
            await expect(await editor.iconURL).toHaveValue(data.iconURL.updated);
            await editor.saveMnemonicModal();
            await expect((await studio.getCard(data.cardid)).locator(fullPricingExpress.cardIconsSlot)).toHaveAttribute(
                'src',
                data.iconURL.updated,
            );
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-5: Verify there is no changes of the card', async () => {
            await expect((await studio.getCard(data.cardid)).locator(fullPricingExpress.cardIconsSlot)).toHaveAttribute(
                'src',
                data.iconURL.original,
            );
        });
    });

    // @studio-full-pricing-express-edit-discard-shortDescription - Validate edit shortDescription for full pricing express card in mas studio
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio fragment editor page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(await editor.panel).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'full-pricing-express');
        });

        await test.step('step-2: Edit shortDescription field', async () => {
            await expect(await editor.shortDescription).toBeVisible();
            await expect(await editor.shortDescription).toContainText(data.shortDescription.original);
            await editor.shortDescription.fill(data.shortDescription.updated);
        });

        await test.step('step-3: Validate shortDescription field updated', async () => {
            await expect(await editor.shortDescription).toContainText(data.shortDescription.updated);
            await expect((await studio.getCard(data.cardid)).locator(fullPricingExpress.cardShortDescription)).toContainText(
                data.shortDescription.updated,
            );
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-5: Verify there is no changes of the card', async () => {
            await expect((await studio.getCard(data.cardid)).locator(fullPricingExpress.cardShortDescription)).toContainText(
                data.shortDescription.original,
            );
        });
    });

    // @studio-full-pricing-express-edit-discard-product-icon-picker - Validate edit and discard product icon using icon picker for full pricing express card in mas studio
    test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
        const { data } = features[2];
        const testPage = `${baseURL}${features[2].path}${miloLibs}${features[2].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio fragment editor page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate original icon', async () => {
            await expect(await editor.panel).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'full-pricing-express');
            await expect((await studio.getCard(data.cardid)).locator(fullPricingExpress.cardIconsSlot)).toHaveAttribute(
                'src',
                data.productIcon.original.src,
            );
        });

        await test.step('step-3: Select product icon from icon picker', async () => {
            await editor.openMnemonicModal();
            await editor.selectProductIcon(data.productIcon.name);
            await editor.saveMnemonicModal();
        });

        await test.step('step-4: Validate mnemonic icon updated in editor', async () => {
            await expect((await studio.getCard(data.cardid)).locator(fullPricingExpress.cardIconsSlot)).toHaveAttribute(
                'src',
                data.productIcon.updated.src,
            );
        });

        await test.step('step-5: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-6: Validate icon reverted to original', async () => {
            await expect((await studio.getCard(data.cardid)).locator(fullPricingExpress.cardIconsSlot)).toHaveAttribute(
                'src',
                data.productIcon.original.src,
            );
        });
    });
});
