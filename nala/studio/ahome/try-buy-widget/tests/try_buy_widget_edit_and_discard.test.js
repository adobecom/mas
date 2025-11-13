import {
    test,
    expect,
    studio,
    editor,
    slice,
    suggested,
    trybuywidget,
    ost,
    webUtil,
    miloLibs,
    setTestPage,
} from '../../../../libs/mas-test.js';
import AHTryBuyWidgetSpec from '../specs/try_buy_widget_edit_and_discard.spec.js';

const { features } = AHTryBuyWidgetSpec;
test.describe('M@S Studio AHome Try Buy Widget card test suite', () => {
    // @studio-try-buy-widget-edit-discard-title - Validate editing title for try buy widget card in mas studio
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ah-try-buy-widget');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Enter long string in title field', async () => {
            await expect(await editor.title).toBeVisible();
            await editor.title.click();
            await page.waitForTimeout(2000);
            await editor.expectRteFieldToContainText(editor.title, data.title.old);
            await editor.fillRteField(editor.title, data.title.updated);
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Validate title truncation in card', async () => {
            await expect(await trybuywidget.cardTitle).toBeVisible();
            await expect(await trybuywidget.cardTitle).toHaveText(data.title.truncated);
        });

        await test.step('step-7: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-8: Verify that the changes are not reflected on the card', async () => {
            await expect(await trybuywidget.cardTitle).toBeVisible();
            await expect(await trybuywidget.cardTitle).toHaveText(data.title.old);
        });
    });

    // @studio-try-buy-widget-edit-discard-bg-color - Validate editing background color for try buy widget card in mas studio
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[0].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ah-try-buy-widget');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit background color field', async () => {
            await expect(await editor.backgroundColor).toBeVisible();
            await expect(await editor.backgroundColor).toHaveAttribute('value', data.color.original);
            await editor.backgroundColor.click();
            await page.getByRole('option', { name: data.color.updated }).click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Validate background color of the card', async () => {
            await expect(await studio.getCard(data.cardid)).not.toHaveAttribute('background-color', data.color.original);
        });

        await test.step('step-5: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-6: Verify that the changes are not reflected on the card', async () => {
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('background-color', data.color.original);
        });
    });

    // @studio-try-buy-widget-edit-discard-border-color - Validate editing border color for try buy widget card in mas studio
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
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ah-try-buy-widget');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit border color field', async () => {
            await expect(await editor.borderColor).toBeVisible();
            await editor.borderColor.click();
            await page.getByRole('option', { name: data.color.updated }).click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Validate border color of the card', async () => {
            await expect(await studio.getCard(data.cardid)).toHaveCSS('border-top-color', data.css.updated);
            await expect(await studio.getCard(data.cardid)).toHaveCSS('border-bottom-color', data.css.updated);
            await expect(await studio.getCard(data.cardid)).toHaveCSS('border-left-color', data.css.updated);
            await expect(await studio.getCard(data.cardid)).toHaveCSS('border-right-color', data.css.updated);
        });

        await test.step('step-5: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-6: Verify that the changes are not reflected on the card', async () => {
            await expect(await studio.getCard(data.cardid)).toHaveCSS('border-top-color', data.css.original);
            await expect(await studio.getCard(data.cardid)).toHaveCSS('border-bottom-color', data.css.original);
            await expect(await studio.getCard(data.cardid)).toHaveCSS('border-left-color', data.css.original);
            await expect(await studio.getCard(data.cardid)).toHaveCSS('border-right-color', data.css.original);
        });
    });

    // @studio-try-buy-widget-edit-discard-description - Validate edit description field for try buy widget card in mas studio
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
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ah-try-buy-widget');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit description field', async () => {
            await expect(await editor.description).toBeVisible();
            await editor.expectRteFieldToContainText(editor.description, data.description.original);
            await editor.fillRteField(editor.description, data.description.updated);
        });

        await test.step('step-4: Validate update in description field of Editor panel', async () => {
            await editor.expectRteFieldToContainText(editor.description, data.description.updated);
        });

        await test.step('step-5: Validate update on the description of card', async () => {
            await expect(await trybuywidget.cardDescription).toHaveText(data.description.updated);
        });

        await test.step('step-6: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-7: Verify that the changes are not reflected on the card', async () => {
            await expect(await trybuywidget.cardDescription).toHaveText(data.description.original);
        });
    });

    // @studio-try-buy-widget-edit-discard-mnemonic - Validate edit mnemonic field for try buy widget card in mas studio
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
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ah-try-buy-widget');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit mnemonic URL field', async () => {
            await expect(await editor.mnemonicEditButton.first()).toBeVisible();
            await editor.openMnemonicModal();
            await editor.mnemonicUrlTab.click();
            await expect(await editor.iconURL).toBeVisible();
            await expect(await editor.iconURL).toHaveValue(data.icon.original);
            await editor.iconURL.fill(data.icon.updated);
        });

        await test.step('step-4: Validate edited mnemonic on the card', async () => {
            await expect(await editor.iconURL).toHaveValue(data.icon.updated);
            await editor.saveMnemonicModal();
            await expect(await trybuywidget.cardIcon).toHaveAttribute('src', data.icon.updated);
        });

        await test.step('step-5: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-6: Verify that the changes are not reflected on the card', async () => {
            await expect(await trybuywidget.cardIcon).toHaveAttribute('src', data.icon.original);
        });
    });

    // @studio-try-buy-widget-edit-discard-image - Validate edit background image field for single try buy widjet card in mas studio
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
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ah-try-buy-widget');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Remove background URL field', async () => {
            await expect(await editor.backgroundImage).toBeVisible();
            await editor.expectSpectrumTextFieldToHaveValue(editor.backgroundImage, data.background.original);
            await editor.fillSpectrumTextField(editor.backgroundImage, '');
            await editor.waitForPreviewUpdate();
        });

        await test.step('step-4: Validate edited background image url field in Editor panel', async () => {
            await editor.expectSpectrumTextFieldToHaveValue(editor.backgroundImage, '');
        });

        await test.step('step-5: Validate image is removed from the card', async () => {
            await expect(async () => {
                await expect(await trybuywidget.cardImage).not.toBeVisible();
            }).toPass({ timeout: 10000, intervals: [500, 1000] });
        });

        await test.step('step-6: Enter new value in the background URL field', async () => {
            await editor.fillSpectrumTextField(editor.backgroundImage, data.background.updated);
            await editor.waitForPreviewUpdate();
        });

        await test.step('step-7: Validate edited background image url field in Editor panel', async () => {
            await editor.expectSpectrumTextFieldToHaveValue(editor.backgroundImage, data.background.updated);
        });

        await test.step('step-8: Validate new image on the card', async () => {
            await expect(async () => {
                await expect(await trybuywidget.cardImage).toBeVisible();
                await expect(await trybuywidget.cardImage).toHaveAttribute('src', data.background.updated);
            }).toPass({ timeout: 10000, intervals: [500, 1000] });
        });

        await test.step('step-9: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-10: Verify that the changes are not reflected on the card', async () => {
            await expect(await trybuywidget.cardImage).toHaveAttribute('src', data.background.original);
        });
    });

    // @studio-try-buy-widget-edit-discard-price - Validate editing and discarding price field for try buy widjet card
    test(`${features[6].name},${features[6].tags}`, async ({ page, baseURL }) => {
        const { data } = features[6];
        const testPage = `${baseURL}${features[6].path}${miloLibs}${features[6].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ah-try-buy-widget');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit price field', async () => {
            await expect(await editor.prices).toBeVisible();
            await expect(await editor.prices).toContainText(data.price);

            await (await editor.prices.locator(editor.regularPrice)).dblclick();
            await expect(await ost.price).toBeVisible();
            await expect(await ost.priceAnnual).toBeVisible();
            await expect(await ost.priceAnnualUse).toBeVisible();
            await ost.priceAnnualUse.click();
        });

        await test.step('step-4: Validate edited price in Editor panel', async () => {
            await expect(await editor.prices).toContainText(data.annualPrice);
            await expect(await editor.prices).toContainText(data.abmText);
        });

        await test.step('step-5: Validate edited price field on the card', async () => {
            await expect(await trybuywidget.cardPriceSlot).toBeVisible();
            await expect(await trybuywidget.cardPrice).not.toBeVisible();
            await expect(await trybuywidget.cardAnnualPrice).toBeVisible();
            await expect(await trybuywidget.cardPriceSlot).toContainText(data.abmText);
            await expect(await trybuywidget.cardAnnualPrice).toContainText(data.annualPrice);
        });

        await test.step('step-6: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-7: Verify that the changes are not reflected on the card', async () => {
            await expect(await trybuywidget.cardPriceSlot).toBeVisible();
            await expect(await trybuywidget.cardAnnualPrice).not.toBeVisible();
            await expect(await trybuywidget.cardPrice).toContainText(data.price);
            await expect(await trybuywidget.cardPrice).not.toContainText(data.annualPrice);
        });
    });

    // @studio-try-buy-widget-edit-discard-cta - Validate edit CTA for try buy widget card in mas studio
    test(`${features[7].name},${features[7].tags}`, async ({ page, baseURL }) => {
        const { data } = features[7];
        const testPage = `${baseURL}${features[7].path}${miloLibs}${features[7].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ah-try-buy-widget');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit CTA field', async () => {
            await expect(await editor.footer).toBeVisible();
            await expect(await editor.footer).toContainText(data.cta.text.original);

            await (await editor.CTAClassSecondary).waitFor({ state: 'visible', timeout: 5000 });
            await page.waitForTimeout(1000);
            await (await editor.CTAClassSecondary).dblclick({ force: true });
            await expect(await ost.checkoutTab).toBeVisible();
            await expect(await ost.workflowMenu).toBeVisible();
            await expect(await ost.ctaTextMenu).toBeEnabled();
            await expect(async () => {
                await ost.ctaTextMenu.click();
                await expect(
                    page.locator('div[role="option"]', {
                        hasText: `${data.cta.option}`,
                    }),
                ).toBeVisible({
                    timeout: 500,
                });
            }).toPass();
            await page
                .locator('div[role="option"]', {
                    hasText: `${data.cta.option}`,
                })
                .click();
            await ost.checkoutLinkUse.click();
        });

        // Step-4 skipped: Editor panel CTA field does not reactively update after OST configuration
        // The card CTA is validated in step-5, which is the source of truth

        await test.step('step-5: Validate edited price field on the card', async () => {
            await expect(await trybuywidget.cardCTASlot).toContainText(data.cta.text.updated);
            await expect(await trybuywidget.cardCTA.first()).toHaveAttribute('data-wcs-osi', data.osi);
            await expect(await trybuywidget.cardCTA.first()).toHaveAttribute('is', 'checkout-button');

            const CTAhref = await trybuywidget.cardCTA.first().getAttribute('data-href');
            let workflowStep = decodeURI(CTAhref).split('?')[0];
            let searchParams = new URLSearchParams(decodeURI(CTAhref).split('?')[1]);

            expect(workflowStep).toContain(data.ucv3);
            expect(searchParams.get('co')).toBe(data.country);
            expect(searchParams.get('ctx')).toBe(data.ctx);
            expect(searchParams.get('lang')).toBe(data.lang);
            expect(searchParams.get('cli')).toBe(data.client);
        });

        await test.step('step-6: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-7: Verify that the changes are not reflected on the card', async () => {
            await expect(await trybuywidget.cardCTASlot).toContainText(data.cta.text.original);
        });
    });

    // @studio-try-buy-widget-change-to-slice - Validate card variant change from AHome try-buy-widget to ccd slice
    test(`${features[8].name},${features[8].tags}`, async ({ page, baseURL }) => {
        const { data } = features[8];
        const testPage = `${baseURL}${features[8].path}${miloLibs}${features[8].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ah-try-buy-widget');
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('size', 'triple');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit card variant', async () => {
            await expect(await editor.variant).toBeVisible();
            await expect(await editor.variant).toHaveAttribute('default-value', 'ah-try-buy-widget');
            await editor.variant.locator('sp-picker').first().click();
            await page.getByRole('option', { name: 'slice' }).click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Validate editor fields rendering after variant change', async () => {
            await expect(await editor.variant).toHaveAttribute('default-value', 'ccd-slice');
            await expect(await editor.size).toBeVisible();
            await expect(await editor.title).not.toBeVisible();
            await expect(await editor.subtitle).not.toBeVisible();
            await expect(await editor.badge).toBeVisible();
            await expect(await editor.description).toBeVisible();
            await expect(await editor.mnemonicEditButton.first()).toBeVisible();
            await expect(await editor.borderColor).not.toBeVisible();
            await expect(await editor.backgroundColor).not.toBeVisible();
            await expect(await editor.backgroundImage).toBeVisible();
            await expect(await editor.prices).not.toBeVisible();
            await expect(await editor.footer).toBeVisible();
        });

        await test.step('step-5: Validate card variant change', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ccd-slice');
            await expect(await studio.getCard(data.cardid)).not.toHaveAttribute('variant', 'ah-try-buy-widget');
            await expect(await slice.cardDescription).toBeVisible();
            await expect(await slice.cardIcon).toBeVisible();
            await expect(await slice.cardCTA.first()).toBeVisible();
            await expect(await slice.cardCTA.first()).toHaveAttribute('data-wcs-osi', data.osi);
            await expect(await slice.cardCTA.first()).toHaveAttribute('is', 'checkout-button');
        });

        await test.step('step-6: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-7: Verify that the changes are not reflected on the card', async () => {
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ah-try-buy-widget');
        });
    });

    // @studio-try-buy-widget-change-to-suggested - Validate card variant change from AHome try-buy-widget to ccd suggested
    test(`${features[9].name},${features[9].tags}`, async ({ page, baseURL }) => {
        const { data } = features[9];
        const testPage = `${baseURL}${features[9].path}${miloLibs}${features[9].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ah-try-buy-widget');
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('size', 'triple');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit card variant', async () => {
            await expect(await editor.variant).toBeVisible();
            await expect(await editor.variant).toHaveAttribute('default-value', 'ah-try-buy-widget');
            await editor.variant.locator('sp-picker').first().click();
            await page.getByRole('option', { name: 'suggested' }).click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Validate editor fields rendering after variant change', async () => {
            await expect(await editor.variant).toHaveAttribute('default-value', 'ccd-suggested');
            await expect(await editor.size).not.toBeVisible();
            await expect(await editor.title).toBeVisible();
            await expect(await editor.subtitle).toBeVisible();
            await expect(await editor.badge).toBeVisible();
            await expect(await editor.description).toBeVisible();
            await expect(await editor.mnemonicEditButton.first()).toBeVisible();
            await expect(await editor.borderColor).not.toBeVisible();
            await expect(await editor.backgroundColor).not.toBeVisible();
            await expect(await editor.backgroundImage).toBeVisible();
            await expect(await editor.prices).toBeVisible();
            await expect(await editor.footer).toBeVisible();
        });

        await test.step('step-5: Validate card variant change', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ccd-suggested');
            await expect(await studio.getCard(data.cardid)).not.toHaveAttribute('variant', 'ah-try-buy-widget');
            await expect(await suggested.cardTitle).toBeVisible();
            await expect(await suggested.cardDescription).toBeVisible();
            await expect(await suggested.cardPrice).toBeVisible();
            await expect(await suggested.cardIcon).toBeVisible();
            await expect(await suggested.cardCTA.first()).toBeVisible();
            await expect(await suggested.cardCTA.first()).toHaveAttribute('data-wcs-osi', data.osi);
            await expect(await suggested.cardCTA.first()).toHaveAttribute('is', 'checkout-button');
        });

        await test.step('step-6: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-7: Verify that the changes are not reflected on the card', async () => {
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ah-try-buy-widget');
        });
    });

    // @studio-try-buy-widget-edit-discard-osi - Validate editing and discarding OSI for try-buy-widget card
    test(`${features[10].name},${features[10].tags}`, async ({ page, baseURL }) => {
        const { data } = features[10];
        const testPage = `${baseURL}${features[10].path}${miloLibs}${features[10].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ah-try-buy-widget');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Change OSI in OST', async () => {
            await expect(await editor.OSI).toBeVisible();
            await expect(await editor.OSI).toContainText(data.osi.original);
            await expect(await editor.tags).toBeVisible();
            await expect(await editor.tags).toHaveAttribute(
                'value',
                expect.stringContaining(`${data.osiTags.original.productCode}`),
            );
            await expect(await editor.tags).toHaveAttribute(
                'value',
                expect.stringContaining(`${data.osiTags.original.offerType}`),
            );
            await expect(await editor.tags).toHaveAttribute(
                'value',
                expect.stringContaining(`${data.osiTags.original.marketSegments}`),
            );
            await expect(await editor.tags).toHaveAttribute(
                'value',
                expect.stringContaining(`${data.osiTags.original.planType}`),
            );
            await (await editor.OSIButton).click();
            await ost.backButton.click();
            await page.waitForTimeout(2000);
            await expect(await ost.searchField).toBeVisible();
            await ost.searchField.fill(data.osi.updated);
            await (await ost.nextButton).click();
            await expect(await ost.priceUse).toBeVisible();
            await ost.priceUse.click();
        });

        await test.step('step-4: Validate osi value in Editor panel', async () => {
            await expect(await editor.OSI).toContainText(data.osi.updated);
        });

        await test.step('step-5: Validate tags update', async () => {
            await expect(await editor.tags).toHaveAttribute(
                'value',
                expect.stringContaining(`${data.osiTags.updated.productCode}`),
            );
            await expect(await editor.tags).toHaveAttribute(
                'value',
                expect.stringContaining(`${data.osiTags.updated.offerType}`),
            );
            await expect(await editor.tags).toHaveAttribute(
                'value',
                expect.stringContaining(`${data.osiTags.updated.marketSegments}`),
            );
            await expect(await editor.tags).toHaveAttribute(
                'value',
                expect.stringContaining(`${data.osiTags.updated.planType}`),
            );
        });

        await test.step('step-6: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-7: Open the editor and validate there are no changes', async () => {
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await editor.OSI).toContainText(data.osi.original);
            await expect(await editor.OSI).not.toContainText(data.osi.updated);
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.osiTags.original.productCode}`));
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.osiTags.original.offerType}`));
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.osiTags.original.marketSegments}`));
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.osiTags.original.planType}`));
            await expect(await editor.tags).not.toHaveAttribute('value', new RegExp(`${data.osiTags.updated.planType}`));
            await expect(await editor.tags).not.toHaveAttribute('value', new RegExp(`${data.osiTags.updated.offerType}`));
            await expect(await editor.tags).not.toHaveAttribute('value', new RegExp(`${data.osiTags.updated.marketSegments}`));
        });
    });

    // @studio-try-buy-widget-edit-discard-cta-variant - Validate editing and discarding CTA variant
    test(`${features[11].name},${features[11].tags}`, async ({ page, baseURL }) => {
        const { data } = features[11];
        const testPage = `${baseURL}${features[11].path}${miloLibs}${features[11].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ah-try-buy-widget');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit CTA variant', async () => {
            await expect(await editor.footer.locator(editor.linkEdit)).toBeVisible();
            await expect(await editor.CTA.first()).toBeVisible();
            await expect(await editor.CTA.first()).toHaveClass(data.cta.original.variant);
            expect(await webUtil.verifyCSS(await trybuywidget.cardCTA.first(), data.cta.original.css)).toBeTruthy();
            await editor.CTA.first().click();
            await editor.footer.locator(editor.linkEdit).click();
            await expect(await editor.linkVariant).toBeVisible();
            await expect(await editor.linkSave).toBeVisible();
            await expect(await editor.getLinkVariant(data.cta.updated.variant)).toBeVisible();
            await (await editor.getLinkVariant(data.cta.updated.variant)).click();
            await editor.linkSave.click();
        });

        await test.step('step-4: Validate edited CTA variant in Editor panel', async () => {
            await expect(await editor.CTA.first()).toHaveClass(data.cta.updated.variant);
            await expect(await editor.CTA.first()).not.toHaveClass(data.cta.original.variant);
        });

        await test.step('step-5: Validate edited CTA on the card', async () => {
            expect(await webUtil.verifyCSS(await trybuywidget.cardCTA.first(), data.cta.updated.css)).toBeTruthy();
            await expect(await trybuywidget.cardCTA.first()).toHaveAttribute('data-wcs-osi', data.osi);
            await expect(await trybuywidget.cardCTA.first()).toHaveAttribute('is', 'checkout-button');
        });

        await test.step('step-6: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-7: Open the editor and validate there are no changes', async () => {
            expect(await webUtil.verifyCSS(await trybuywidget.cardCTA.first(), data.cta.original.css)).toBeTruthy();
        });
    });

    // @studio-try-buy-widget-edit-discard-cta-checkout-params - Validate editing and discarding CTA checkout params
    test(`${features[12].name},${features[12].tags}`, async ({ page, baseURL }) => {
        const { data } = features[12];
        const testPage = `${baseURL}${features[12].path}${miloLibs}${features[12].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ah-try-buy-widget');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit CTA checkout params', async () => {
            await expect(await editor.footer.locator(editor.linkEdit)).toBeVisible();
            await expect(await editor.CTA.first()).toBeVisible();
            await editor.CTA.first().click();
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
            await expect(await trybuywidget.cardCTA.first()).toHaveAttribute('data-wcs-osi', data.osi);
            await expect(await trybuywidget.cardCTA.first()).toHaveAttribute('is', 'checkout-button');
            const CTAhref = await trybuywidget.cardCTA.first().getAttribute('data-href');
            let searchParams = new URLSearchParams(decodeURI(CTAhref).split('?')[1]);
            expect(searchParams.get('mv')).toBe(data.checkoutParams.mv);
            expect(searchParams.get('promoid')).toBe(data.checkoutParams.promoid);
            expect(searchParams.get('mv2')).toBe(data.checkoutParams.mv2);
        });

        await test.step('step-5: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-6: Verify there is no changes of the card', async () => {
            const changedCTAhref = await trybuywidget.cardCTA.first().getAttribute('data-href');
            let noSearchParams = new URLSearchParams(decodeURI(changedCTAhref).split('?')[1]);
            expect(noSearchParams).toBeNull;
        });
    });

    // @studio-try-buy-widget-edit-discard-analytics-ids - Validate editing and discarding analytics IDs
    test(`${features[13].name},${features[13].tags}`, async ({ page, baseURL }) => {
        const { data } = features[13];
        const testPage = `${baseURL}${features[13].path}${miloLibs}${features[13].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ah-try-buy-widget');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit analytics IDs', async () => {
            await expect(await editor.footer.locator(editor.linkEdit)).toBeVisible();
            await expect(await editor.CTA.first()).toBeVisible();
            await editor.CTA.first().click();
            await editor.footer.locator(editor.linkEdit).click();
            await expect(await editor.analyticsId).toBeVisible();
            await expect(await editor.linkSave).toBeVisible();
            await expect(await editor.analyticsId).toContainText(data.analyticsID.original);
            await expect(await trybuywidget.cardCTA.first()).toHaveAttribute('data-analytics-id', data.analyticsID.original);
            await expect(await trybuywidget.cardCTA.first()).toHaveAttribute('daa-ll', data.daaLL.original);
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('daa-lh', data.daaLH);

            await editor.analyticsId.click();
            await page.getByRole('option', { name: data.analyticsID.updated }).click();
            await editor.linkSave.click();
        });

        await test.step('step-4: Validate edited analytics IDs on the card', async () => {
            await expect(await trybuywidget.cardCTA.first()).toHaveAttribute('data-analytics-id', data.analyticsID.updated);
            await expect(await trybuywidget.cardCTA.first()).toHaveAttribute('daa-ll', data.daaLL.updated);
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('daa-lh', data.daaLH);
        });

        await test.step('step-5: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-6: Verify there is no changes of the card', async () => {
            await expect(await trybuywidget.cardCTA.first()).toHaveAttribute('data-analytics-id', data.analyticsID.original);
            await expect(await trybuywidget.cardCTA.first()).toHaveAttribute('daa-ll', data.daaLL.original);
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('daa-lh', data.daaLH);
        });
    });

    // @studio-try-buy-widget-edit-discard-product-icon-picker - Validate edit and discard product icon using icon picker for try buy widget card in mas studio
    test(`${features[14].name},${features[14].tags}`, async ({ page, baseURL }) => {
        const { data } = features[14];
        const testPage = `${baseURL}${features[14].path}${miloLibs}${features[14].browserParams}${data.cardid}`;
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
            await expect(await trybuywidget.cardIcon).toHaveAttribute('src', data.productIcon.original.src);
        });

        await test.step('step-4: Select product icon from icon picker', async () => {
            await expect(await editor.mnemonicEditButton.first()).toBeVisible();
            await editor.openMnemonicModal();
            await editor.selectProductIcon(data.productIcon.name);
            await editor.saveMnemonicModal();
            await editor.waitForPreviewUpdate();
        });

        await test.step('step-5: Validate mnemonic icon updated in editor', async () => {
            await expect(async () => {
                await expect(await trybuywidget.cardIcon).toHaveAttribute('src', data.productIcon.updated.src);
            }).toPass({ timeout: 10000, intervals: [500, 1000] });
        });

        await test.step('step-6: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-7: Validate icon reverted to original', async () => {
            await expect(await trybuywidget.cardIcon).toHaveAttribute('src', data.productIcon.original.src);
        });
    });
});
