import { test, expect, studio, editor, fries, ost, miloLibs, setTestPage } from '../../../../libs/mas-test.js';
import COMFriesSpec from '../specs/fries_edit_and_discard.spec.js';

const { features } = COMFriesSpec;

test.describe('M@S Studio Commerce Fries card test suite', () => {
    // @studio-fries-edit-discard-title - Validate edit title for fries card in mas studio
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            const card = await studio.getCard(data.cardid);
            await expect(card).toBeVisible({ timeout: 10000 });
            await card.dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit title field', async () => {
            await expect(await editor.title).toBeVisible();
            await editor.fillRteField(editor.title, data.title.updated);
        });

        await test.step('step-4: Validate edited title field in Editor panel', async () => {
            await editor.expectRteFieldToContainText(editor.title, data.title.updated);
        });

        await test.step('step-5: Validate edited title field on the card', async () => {
            await expect(await fries.title).toHaveText(data.title.updated);
        });

        await test.step('step-6: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-7: Verify there is no changes of the card', async () => {
            await expect(await fries.title).toHaveText(data.title.original);
        });
    });

    // @studio-fries-edit-discard-description - Validate edit description field for fries card in mas studio
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}${data.cardid}`;
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

        await test.step('step-3: Edit description field', async () => {
            await expect(await editor.description).toBeVisible();
            await editor.fillRteField(editor.description, data.description.updated);
        });

        await test.step('step-4: Validate edited description in Editor panel', async () => {
            await editor.expectRteFieldToContainText(editor.description, data.description.updated);
        });

        await test.step('step-5: Validate edited description on the card', async () => {
            await expect(await fries.description).toHaveText(data.description.updated);
        });

        await test.step('step-6: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-7: Verify there is no changes of the card', async () => {
            await expect(await fries.description).toContainText(data.description.original);
        });
    });

    // @studio-fries-edit-discard-mnemonic - Validate edit mnemonic URL field for fries card in mas studio
    test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
        const { data } = features[2];
        const testPage = `${baseURL}${features[2].path}${miloLibs}${features[2].browserParams}${data.cardid}`;
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

        await test.step('step-3: Edit mnemonic URL field', async () => {
            await expect(await editor.mnemonicEditButton.first()).toBeVisible();
            await editor.openMnemonicModal();
            await editor.mnemonicUrlTab.click();
            await expect(await editor.iconURL).toBeVisible();
            await expect(await editor.iconURL).toHaveValue(data.iconURL.original);
            await editor.iconURL.fill(data.iconURL.updated);
        });

        await test.step('step-4: Validate edited mnemonic URL on the card', async () => {
            await expect(await editor.iconURL).toHaveValue(data.iconURL.updated);
            await editor.saveMnemonicModal();
            await expect(await fries.icon.first()).toHaveAttribute('src', data.iconURL.updated);
        });

        await test.step('step-5: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-6: Verify there is no changes of the card', async () => {
            await expect(await fries.icon.first()).toHaveAttribute('src', data.iconURL.original);
        });
    });

    // @studio-fries-edit-discard-price - Validate edit price field for fries card in mas studio
    test(`${features[3].name},${features[3].tags}`, async ({ page, baseURL }) => {
        const { data } = features[3];
        const testPage = `${baseURL}${features[3].path}${miloLibs}${features[3].browserParams}${data.cardid}`;
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

        await test.step('step-3: Edit price field', async () => {
            await expect(await editor.prices).toBeVisible();
            // Just check that prices section exists
            const regularPriceEl = await editor.prices.locator(editor.regularPrice).first();
            if ((await regularPriceEl.count()) > 0) {
                await regularPriceEl.dblclick();
                await expect(await ost.price).toBeVisible();
                await expect(await ost.priceUse).toBeVisible();
                await expect(await ost.unitCheckbox).toBeVisible();
                await ost.unitCheckbox.click();
                await ost.priceUse.click();
            }
        });

        await test.step('step-4: Validate price was edited', async () => {
            await expect(await editor.prices).toBeVisible();
            await expect(await editor.prices).toContainText(data.price.updated);
            await expect(await editor.prices).toContainText(data.strikethroughPrice.updated);
        });

        await test.step('step-5: Validate price on the card', async () => {
            await expect(await fries.price.first()).toBeVisible();
            await expect(await fries.price.first()).toContainText(data.price.updated);
            await expect(await fries.price.first()).toContainText(data.strikethroughPrice.updated);
        });

        await test.step('step-6: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-7: Verify there is no changes of the card', async () => {
            await expect(await fries.price.first()).toBeVisible();
            await expect(await fries.price.first()).toContainText(data.price.original);
            await expect(await fries.price.first()).toContainText(data.strikethroughPrice.original);
            await expect(await fries.price.first()).not.toContainText(data.price.updated);
            await expect(await fries.price.first()).not.toContainText(data.strikethroughPrice.updated);
        });
    });

    // @studio-fries-edit-discard-cta-label - Validate edit CTA label for fries card in mas studio
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

        await test.step('step-3: Edit CTA label', async () => {
            if ((await editor.CTA.count()) > 0) {
                await expect(await editor.CTA).toBeVisible();
                await editor.CTA.click();
                if ((await editor.footer.locator(editor.linkEdit).count()) > 0) {
                    await editor.footer.locator(editor.linkEdit).click();
                    await expect(await editor.linkText).toBeVisible();
                    await expect(await editor.linkSave).toBeVisible();
                    await editor.linkText.fill(data.ctaText.updated);
                    await editor.linkSave.click();
                }
            }
        });

        await test.step('step-4: Validate edited CTA label in Editor panel', async () => {
            if ((await editor.footer.count()) > 0) {
                await expect(await editor.footer).toContainText(data.ctaText.updated);
            }
        });

        await test.step('step-5: Validate edited CTA on the card', async () => {
            if ((await fries.cta.count()) > 0) {
                await expect(await fries.cta).toContainText(data.ctaText.updated);
            }
        });

        await test.step('step-6: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-7: Verify there is no changes of the card', async () => {
            await expect(await fries.cta).toContainText(data.ctaText.original);
        });
    });

    // @studio-fries-edit-discard-product-icon-picker - Validate edit and discard product icon using icon picker for fries card in mas studio
    test(`${features[5].name},${features[5].tags}`, async ({ page, baseURL }) => {
        const { data } = features[5];
        const testPage = `${baseURL}${features[5].path}${miloLibs}${features[5].browserParams}${data.cardid}`;
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
            await expect(await fries.icon.first()).toHaveAttribute('src', data.productIcon.original.src);
        });

        await test.step('step-4: Select product icon from icon picker', async () => {
            await expect(await editor.mnemonicEditButton.first()).toBeVisible();
            await editor.openMnemonicModal();
            await editor.selectProductIcon(data.productIcon.name);
            await editor.saveMnemonicModal();
        });

        await test.step('step-5: Validate mnemonic icon updated in editor', async () => {
            await expect(await fries.icon.first()).toHaveAttribute('src', data.productIcon.updated.src);
        });

        await test.step('step-6: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-7: Validate icon reverted to original', async () => {
            await expect(await fries.icon.first()).toHaveAttribute('src', data.productIcon.original.src);
        });
    });
});
