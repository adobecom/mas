import {
    test,
    expect,
    studio,
    editor,
    fries,
    ost,
    setClonedCardID,
    getClonedCardID,
    miloLibs,
    setTestPage,
} from '../../../../libs/mas-test.js';
import COMFriesSpec from '../specs/fries_save.spec.js';

const { features } = COMFriesSpec;

test.describe('M@S Studio Commerce Fries card test suite', () => {
    // @studio-fries-save-edited-RTE-fields - Validate saving card after editing title, description, and mnemonic
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.cardid}`;
        setTestPage(testPage);
        let clonedCard;

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Clone card and open editor', async () => {
            await studio.cloneCard(data.cardid);
            clonedCard = await studio.getCard(data.cardid, 'cloned');
            setClonedCardID(await clonedCard.locator('aem-fragment').getAttribute('fragment'));
            data.clonedCardID = getClonedCardID();
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await clonedCard).toBeVisible();
        });

        await test.step('step-3: Edit title field', async () => {
            await expect(await editor.title).toBeVisible();
            await editor.title.fill(data.title.updated);
        });

        await test.step('step-4: Edit description field', async () => {
            await expect(await editor.description).toBeVisible();
            await editor.description.fill(data.description.updated);
        });

        await test.step('step-5: Edit mnemonic field', async () => {
            await editor.openMnemonicModal(0);
            await editor.mnemonicUrlTab.click();
            await expect(await editor.iconURL).toBeVisible();
            await editor.iconURL.fill(data.iconURL.updated);
            await editor.saveMnemonicModal();
        });

        await test.step('step-6: Save card', async () => {
            await studio.saveCard();
        });

        await test.step('step-7: Validate edited fields in parallel', async () => {
            const validationLabels = ['title', 'description', 'mnemonic'];

            const results = await Promise.allSettled([
                // Validate title in editor and card
                test.step('Validation-1: Validate edited title', async () => {
                    await expect(await editor.title).toContainText(data.title.updated);
                    await expect(await clonedCard.locator(fries.title)).toHaveText(data.title.updated);
                }),

                // Validate description in editor and card
                test.step('Validation-2: Validate edited description', async () => {
                    await expect(await editor.description).toContainText(data.description.updated);
                    await expect(await clonedCard.locator(fries.description)).toHaveText(data.description.updated);
                }),

                // Validate mnemonic in editor and card
                test.step('Validation-3: Validate edited mnemonic', async () => {
                    await editor.openMnemonicModal(0);
                    await editor.mnemonicUrlTab.click();
                    await expect(await editor.iconURL).toHaveValue(data.iconURL.updated);
                    await editor.cancelMnemonicModal();
                    await expect(await clonedCard.locator(fries.icon).first()).toHaveAttribute('src', data.iconURL.updated);
                }),
            ]);

            // Check results and report any failures
            const failures = results
                .map((result, index) => ({ result, index }))
                .filter(({ result }) => result.status === 'rejected')
                .map(({ result, index }) => `🔍 Validation-${index + 1} (${validationLabels[index]}) failed: ${result.reason}`);

            if (failures.length > 0) {
                throw new Error(`\x1b[31m✘\x1b[0m Fries card field save validation failures:\n${failures.join('\n')}`);
            }
        });
    });

    // @studio-fries-save-edited-price - Validate saving card after editing card price
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}${data.cardid}`;
        setTestPage(testPage);
        let clonedCard;

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Clone card and open editor', async () => {
            await studio.cloneCard(data.cardid);
            clonedCard = await studio.getCard(data.cardid, 'cloned');
            setClonedCardID(await clonedCard.locator('aem-fragment').getAttribute('fragment'));
            data.clonedCardID = getClonedCardID();
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await clonedCard).toBeVisible();
        });

        await test.step('step-3: Edit price and save card', async () => {
            await expect(await editor.prices).toBeVisible();
            await (await editor.prices.locator(editor.regularPrice)).dblclick();
            await expect(await ost.price).toBeVisible();
            await expect(await ost.priceUse).toBeVisible();
            await expect(await ost.oldPriceCheckbox).toBeVisible();
            await ost.oldPriceCheckbox.click();
            await ost.priceUse.click();
            await studio.saveCard();
        });

        await test.step('step-4: Validate card price', async () => {
            await expect(await editor.prices).toContainText(data.price);
            await expect(await editor.prices).not.toContainText(data.strikethroughPrice);
            await expect(await clonedCard.locator(fries.price)).toContainText(data.price);
            await expect(await clonedCard.locator(fries.price)).not.toContainText(data.strikethroughPrice);
        });
    });

    // @studio-fries-save-edited-cta-label - Validate saving card after editing CTA label
    test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
        const { data } = features[2];
        const testPage = `${baseURL}${features[2].path}${miloLibs}${features[2].browserParams}${data.cardid}`;
        setTestPage(testPage);
        let clonedCard;

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Clone card and open editor', async () => {
            await studio.cloneCard(data.cardid);
            clonedCard = await studio.getCard(data.cardid, 'cloned');
            setClonedCardID(await clonedCard.locator('aem-fragment').getAttribute('fragment'));
            data.clonedCardID = getClonedCardID();
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await clonedCard).toBeVisible();
        });

        await test.step('step-3: Edit CTA and save card', async () => {
            if ((await editor.CTA.count()) > 0) {
                await editor.CTA.click();
                if ((await editor.footer.locator(editor.linkEdit).count()) > 0) {
                    await editor.footer.locator(editor.linkEdit).click();
                    await editor.linkText.fill(data.ctaText.updated);
                    await editor.linkSave.click();
                }
            }
            await studio.saveCard();
        });

        await test.step('step-4: Validate edited card CTA', async () => {
            if ((await editor.footer.count()) > 0) {
                await expect(await editor.footer).toContainText(data.ctaText.updated);
            }
            if ((await clonedCard.locator(fries.cta).count()) > 0) {
                await expect(await clonedCard.locator(fries.cta)).toContainText(data.ctaText.updated);
            }
        });
    });
});
