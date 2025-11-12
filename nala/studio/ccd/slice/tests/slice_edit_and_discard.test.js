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
import CCDSliceSpec from '../specs/slice_edit_and_discard.spec.js';

const { features } = CCDSliceSpec;

test.describe('M@S Studio CCD Slice card test suite', () => {
    // @studio-slice-variant-change-to-suggested - Validate card variant change from slice to suggested
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
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ccd-slice');
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('size', 'wide');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit card variant', async () => {
            await expect(await editor.variant).toBeVisible();
            await expect(await editor.variant).toHaveAttribute('default-value', 'ccd-slice');
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
            await expect(await editor.backgroundImage).toBeVisible();
            await expect(await editor.prices).toBeVisible();
            await expect(await editor.footer).toBeVisible();
        });

        await test.step('step-5: Validate card variant change', async () => {
            await expect(await studio.getCard(data.cardid)).not.toHaveAttribute('variant', 'ccd-slice');
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ccd-suggested');
            await expect(await (await studio.getCard(data.cardid)).locator(suggested.cardCTA)).toHaveAttribute(
                'data-wcs-osi',
                data.osi,
            );
            await expect(await (await studio.getCard(data.cardid)).locator(suggested.cardCTA)).toHaveAttribute(
                'is',
                'checkout-button',
            );
        });

        await test.step('step-6: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-7: Verify there is no changes of the card', async () => {
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ccd-slice');
            await expect(await studio.getCard(data.cardid)).not.toHaveAttribute('variant', 'ccd-suggested');
        });
    });

    // @studio-slice-edit-discard-size - Validate edit size for slice card in mas studio
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
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ccd-slice');
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('size', 'wide');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit size field', async () => {
            await expect(await editor.size).toBeVisible();
            await expect(await editor.size).toHaveAttribute('value', 'wide');
            await editor.size.click();
            await page.getByRole('option', { name: 'default' }).click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Validate new size of the card', async () => {
            await expect(await studio.getCard(data.cardid)).not.toHaveAttribute('size', 'wide');
        });

        await test.step('step-5: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-6: Verify there is no changes of the card', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('size', 'wide');
        });
    });

    // @studio-slice-edit-discard-badge - Validate edit badge field for slice card in mas studio
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
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ccd-slice');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Remove badge field', async () => {
            await expect(await editor.badge).toBeVisible();
            await editor.expectSpectrumTextFieldToHaveValue(editor.badge, data.badge.original);
            await editor.fillSpectrumTextField(editor.badge, '');
            await editor.waitForPreviewUpdate();
        });

        await test.step('step-4: Validate edited badge field in Editor panel', async () => {
            await editor.expectSpectrumTextFieldToHaveValue(editor.badge, '');
        });

        await test.step('step-5: Validate badge is removed from the card', async () => {
            await expect(await slice.cardBadge).not.toBeVisible();
        });

        await test.step('step-6: Enter new value in the badge field', async () => {
            await editor.fillSpectrumTextField(editor.badge, data.badge.updated);
            await editor.waitForPreviewUpdate();
        });

        await test.step('step-7: Validate edited badge field in Editor panel', async () => {
            await editor.expectSpectrumTextFieldToHaveValue(editor.badge, data.badge.updated);
        });

        await test.step('step-8: Validate new badge on the card', async () => {
            await expect(await slice.cardBadge).toBeVisible();
            await expect(await slice.cardBadge).toHaveText(data.badge.updated);
        });

        await test.step('step-9: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-10: Verify there is no changes of the card', async () => {
            await expect(await slice.cardBadge).toHaveText(data.badge.original);
        });
    });

    // @studio-slice-edit-discard-description - Validate edit description field for slice card in mas studio
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
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ccd-slice');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit description field', async () => {
            await expect(await editor.description).toBeVisible();
            await editor.expectRteFieldToContainText(editor.description, data.description.original);
            await editor.fillRteField(editor.description, data.description.updated);
        });

        await test.step('step-4: Validate edited description field in Editor panel', async () => {
            await editor.expectRteFieldToContainText(editor.description, data.description.updated);
        });

        await test.step('step-5: Validate edited description on the card', async () => {
            await expect(await slice.cardDescription).toHaveText(data.description.updated);
        });

        await test.step('step-6: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-7: Verify there is no changes of the card', async () => {
            await expect(await slice.cardDescription).toContainText(data.description.original);
        });
    });

    // @studio-slice-edit-discard-mnemonic - Validate edit mnemonic URL field for slice card in mas studio
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
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ccd-slice');
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

        await test.step('step-4: Validate edited mnemonic src on the card', async () => {
            await expect(await editor.iconURL).toHaveValue(data.iconURL.updated);
            await editor.saveMnemonicModal();
            await expect(await slice.cardIcon).toHaveAttribute('src', data.iconURL.updated);
        });

        await test.step('step-5: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-6: Verify there is no changes of the card', async () => {
            await expect(await slice.cardIcon).toHaveAttribute('src', data.iconURL.original);
        });
    });

    // @studio-slice-edit-discard-image - Validate edit background image field for slice card in mas studio
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
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ccd-slice');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Remove background URL field', async () => {
            await expect(await editor.backgroundImage).toBeVisible();
            await editor.expectSpectrumTextFieldToHaveValue(editor.backgroundImage, data.backgroundURL.original);
            await editor.fillSpectrumTextField(editor.backgroundImage, '');
            await editor.waitForPreviewUpdate();
        });

        await test.step('step-4: Validate edited background image url field in Editor panel', async () => {
            await editor.expectSpectrumTextFieldToHaveValue(editor.backgroundImage, '');
        });

        await test.step('step-5: Validate image is removed from the card', async () => {
            await expect(await slice.cardImage).not.toBeVisible();
        });

        await test.step('step-6: Enter new value in the background URL field', async () => {
            await editor.fillSpectrumTextField(editor.backgroundImage, data.backgroundURL.updated);
            await editor.waitForPreviewUpdate();
        });

        await test.step('step-7: Validate edited background image url field in Editor panel', async () => {
            await editor.expectSpectrumTextFieldToHaveValue(editor.backgroundImage, data.backgroundURL.updated);
        });

        await test.step('step-8: Validate new image on the card', async () => {
            await expect(await slice.cardImage).toBeVisible();
            await expect(await slice.cardImage).toHaveAttribute('src', data.backgroundURL.updated);
        });

        await test.step('step-9: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-10: Verify there is no changes of the card', async () => {
            await expect(await slice.cardImage).toBeVisible();
            await expect(await slice.cardImage).toHaveAttribute('src', data.backgroundURL.original);
        });
    });

    // @studio-slice-edit-discard-price - Validate edit price field for slice card in mas studio
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
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ccd-slice');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit price field', async () => {
            await expect(await editor.description).toBeVisible();
            await editor.expectRteFieldToContainText(editor.description, data.price);
            await editor.expectRteFieldToContainText(editor.description, data.strikethroughPrice);

            await editor.description.locator(editor.regularPrice).dblclick();
            await expect(await ost.priceStrikethrough).toBeVisible();
            await expect(await ost.priceStrikethroughUse).toBeVisible();
            await expect(await ost.priceStrikethrough).not.toContainText(data.price);
            await expect(await ost.priceStrikethrough).toContainText(data.strikethroughPrice);
            await expect(await ost.priceStrikethrough.locator('.price-strikethrough')).toHaveCSS(
                'text-decoration-line',
                'line-through',
            );
            await ost.priceStrikethroughUse.click();
        });

        await test.step('step-4: Validate edited price field in Editor panel', async () => {
            await editor.expectRteFieldToContainText(editor.description, data.strikethroughPrice);
            await expect(await editor.description).not.toContainText(data.price);
            await expect(await editor.description.locator(editor.strikethroughPrice).locator('.price-strikethrough')).toHaveCSS(
                'text-decoration-line',
                'line-through',
            );
        });

        await test.step('step-5: Validate edited price field on the card', async () => {
            await expect(await slice.cardDescription).toContainText(data.strikethroughPrice);
            await expect(await slice.cardDescription).not.toContainText(data.price);
            await expect(await slice.cardDescription.locator(slice.cardPriceStrikethrough)).toHaveCSS(
                'text-decoration-line',
                'line-through',
            );
        });

        await test.step('step-6: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-7: Verify there is no changes of the card', async () => {
            await expect(await slice.cardDescription.locator(slice.cardPrice)).toContainText(data.price);
            await expect(await slice.cardDescription.locator(slice.cardPromoPriceStrikethrough)).toContainText(
                data.strikethroughPrice,
            );
        });
    });

    // @studio-slice-edit-discard-cta-ost - Validate edit CTA for slice card in mas studio
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
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ccd-slice');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit CTA field', async () => {
            await expect(await editor.footer).toBeVisible();
            await expect(await editor.footer).toContainText(data.ctaText.original);

            await editor.CTA.waitFor({ state: 'visible', timeout: 5000 });
            await page.waitForTimeout(1000);
            await editor.CTA.dblclick({ force: true });
            await expect(await ost.checkoutTab).toBeVisible();
            await expect(await ost.workflowMenu).toBeVisible();
            await expect(await ost.ctaTextMenu).toBeEnabled();
            await expect(await ost.checkoutLinkUse).toBeVisible();
            await expect(async () => {
                await ost.ctaTextMenu.click();
                await expect(
                    page.locator('div[role="option"]', {
                        hasText: `${data.ctaText.option}`,
                    }),
                ).toBeVisible({
                    timeout: 500,
                });
            }).toPass();
            await page
                .locator('div[role="option"]', {
                    hasText: `${data.ctaText.option}`,
                })
                .click();
            await ost.checkoutLinkUse.click();
        });

        await test.step('step-4: Validate edited CTA in Editor panel', async () => {
            await expect(await editor.footer).toContainText(data.ctaText.updated);
        });

        await test.step('step-5: Validate edited CTA on the card', async () => {
            await expect(await slice.cardCTA).toContainText(data.ctaText.updated);
            await expect(await slice.cardCTA).toHaveAttribute('data-wcs-osi', data.osi);
            await expect(await slice.cardCTA).toHaveAttribute('is', 'checkout-button');

            const CTAhref = await slice.cardCTA.getAttribute('data-href');
            let workflowStep = decodeURI(CTAhref).split('?')[0];
            let searchParams = new URLSearchParams(decodeURI(CTAhref).split('?')[1]);

            expect(workflowStep).toContain(data.ucv3);
            expect(searchParams.get('co')).toBe(data.country);
            expect(searchParams.get('ctx')).toBe(data.ctx);
            expect(searchParams.get('lang')).toBe(data.lang);
            expect(searchParams.get('cli')).toBe(data.client);
            //@TODO: update promo code and uncomment this
            // expect(searchParams.get('apc')).toBe(data.promo);
        });

        await test.step('step-6: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-7: Verify there is no changes of the card', async () => {
            await expect(await slice.cardCTA).toContainText(data.ctaText.original);
        });
    });

    // @studio-slice-edit-discard-cta-label - Validate edit CTA label for slice card in mas studio
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
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ccd-slice');
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
            await expect(await slice.cardCTA).toContainText(data.ctaText.updated);
            await expect(await slice.cardCTA).toHaveAttribute('data-wcs-osi', data.osi);
            await expect(await slice.cardCTA).toHaveAttribute('is', 'checkout-button');
        });

        await test.step('step-6: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-7: Verify there is no changes of the card', async () => {
            await expect(await slice.cardCTA).toContainText(data.ctaText.original);
        });
    });

    // @studio-slice-edit-discard-price-promo - Validate edit price promo for slice card in mas studio
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
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ccd-slice');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit promo field', async () => {
            await expect(await editor.description.locator(editor.regularPrice)).toHaveAttribute(
                'data-promotion-code',
                data.promo.original,
            );
            await expect(await slice.cardDescription.locator(slice.cardPriceSlot)).toHaveAttribute(
                'data-promotion-code',
                data.promo.original,
            );
            await editor.description.locator(editor.regularPrice).dblclick();
            await expect(await ost.promoField).toBeVisible();
            await expect(await ost.promoLabel).toBeVisible();
            await expect(await ost.promoLabel).toContainText(data.promo.original);
            await expect(await ost.promoField).toHaveValue(data.promo.original);

            await ost.promoField.fill(data.promo.updated);
            await expect(await ost.promoLabel).toContainText(data.promo.updated);
            await expect(await ost.promoField).toHaveValue(data.promo.updated);
            await ost.priceUse.click();
        });

        await test.step('step-4: Validate promo change in Editor panel', async () => {
            await expect(await editor.description.locator(editor.regularPrice)).toHaveAttribute(
                'data-promotion-code',
                data.promo.updated,
            );
        });

        await test.step('step-5: Validate edited price promo on the card', async () => {
            await expect(await slice.cardDescription.locator(slice.cardPriceSlot)).toHaveAttribute(
                'data-promotion-code',
                data.promo.updated,
            );
        });

        await test.step('step-6: Remove promo', async () => {
            await editor.description.locator(editor.regularPrice).dblclick();
            await expect(await ost.promoField).toBeVisible();
            await expect(await ost.promoLabel).toBeVisible();

            await ost.promoField.fill('');
            await expect(await ost.promoLabel).toContainText('no promo');
            await expect(await ost.promoField).toHaveValue('');
            await ost.priceUse.click();
        });

        await test.step('step-7: Validate promo removal in Editor panel', async () => {
            await expect(await editor.description.locator(editor.regularPrice)).not.toHaveAttribute(
                'data-promotion-code',
                data.promo.updated,
            );
        });

        await test.step('step-8: Validate removed price promo on the card', async () => {
            await expect(await slice.cardDescription.locator(slice.cardPriceSlot)).not.toHaveAttribute(
                'data-promotion-code',
                data.promo.updated,
            );
        });
    });

    // @studio-slice-edit-discard-cta-promo - Validate edit cta promo for slice card in mas studio
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
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ccd-slice');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit CTA promo field', async () => {
            await expect(await editor.CTA).toHaveAttribute('data-promotion-code', data.promo.original);
            await expect(await slice.cardCTA).toHaveAttribute('data-promotion-code', data.promo.original);

            const CTAhref = await slice.cardCTA.getAttribute('data-href');
            let workflowStep = decodeURI(CTAhref).split('?')[0];
            let searchParams = new URLSearchParams(decodeURI(CTAhref).split('?')[1]);

            expect(workflowStep).toContain(data.ucv3);
            expect(searchParams.get('co')).toBe(data.country);
            expect(searchParams.get('ctx')).toBe(data.ctx);
            expect(searchParams.get('lang')).toBe(data.lang);
            expect(searchParams.get('cli')).toBe(data.client);
            //@TODO: update promo code and uncomment this
            // expect(searchParams.get('apc')).toBe(data.promo.original);

            await editor.CTA.dblclick();
            await expect(await ost.checkoutTab).toBeVisible();
            await expect(await ost.promoField).toBeVisible();
            await expect(await ost.promoLabel).toBeVisible();
            await expect(await ost.promoLabel).toContainText(data.promo.original);
            await expect(await ost.promoField).toHaveValue(data.promo.original);

            await ost.promoField.fill(data.promo.updated);
            expect(await ost.promoLabel).toContainText(data.promo.updated);
            await expect(await ost.promoField).toHaveValue(data.promo.updated);
            await ost.checkoutLinkUse.click();
        });

        await test.step('step-4: Validate edited CTA promo in Editor panel', async () => {
            await expect(await editor.CTA).toHaveAttribute('data-promotion-code', data.promo.updated);
        });

        await test.step('step-5: Validate edited CTA promo on the card', async () => {
            const newCTA = await slice.cardCTA;
            await expect(newCTA).toHaveAttribute('data-promotion-code', data.promo.updated);
            await expect(newCTA).toHaveAttribute('data-href', new RegExp(`${data.ucv3}`));
            await expect(newCTA).toHaveAttribute('data-href', new RegExp(`co=${data.country}`));
            await expect(newCTA).toHaveAttribute('data-href', new RegExp(`ctx=${data.ctx}`));
            await expect(newCTA).toHaveAttribute('data-href', new RegExp(`lang=${data.lang}`));
            await expect(newCTA).toHaveAttribute('data-href', new RegExp(`cli=${data.client}`));
            //@TODO: update promo code and uncomment this
            // await expect(newCTA).toHaveAttribute('data-href', new RegExp(`apc=${data.promo.updated}`));
        });

        await test.step('step-6: Remove promo', async () => {
            await editor.CTA.dblclick();
            await expect(await ost.checkoutTab).toBeVisible();
            await expect(await ost.promoField).toBeVisible();
            await expect(await ost.promoLabel).toBeVisible();

            await ost.promoField.fill('');
            expect(await ost.promoLabel).toContainText('no promo');
            await expect(await ost.promoField).toHaveValue('');
            await ost.checkoutLinkUse.click();
        });

        await test.step('step-7: Validate promo removed in Editor panel', async () => {
            await expect(await editor.CTA).not.toHaveAttribute('data-promotion-code');
        });

        await test.step('step-8: Validate CTA promo removed from the card', async () => {
            await expect(await slice.cardCTA).not.toHaveAttribute('data-promotion-code');
            await expect(await slice.cardCTA).not.toHaveAttribute('data-href', /apc=/);
        });
    });

    // @studio-slice-variant-change-to-trybuywidget - Validate card variant change from slice to AHome try-buy-widget
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
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ccd-slice');
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('size', 'wide');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit card variant', async () => {
            await expect(await editor.variant).toBeVisible();
            await expect(await editor.variant).toHaveAttribute('default-value', 'ccd-slice');
            await editor.variant.locator('sp-picker').first().click();
            await page.getByRole('option', { name: 'try buy widget' }).click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Validate editor fields rendering after variant change', async () => {
            await expect(await editor.variant).toHaveAttribute('default-value', 'ah-try-buy-widget');
            await expect(await editor.size).toBeVisible();
            await expect(await editor.title).toBeVisible();
            await expect(await editor.subtitle).not.toBeVisible();
            await expect(await editor.badge).toBeVisible();
            await expect(await editor.description).toBeVisible();
            await expect(await editor.mnemonicEditButton.first()).toBeVisible();
            await expect(await editor.borderColor).toBeVisible();
            await expect(await editor.backgroundColor).toBeVisible();
            await expect(await editor.backgroundImage).toBeVisible();
            await expect(await editor.prices).toBeVisible();
            await expect(await editor.footer).toBeVisible();
        });

        await test.step('step-5: Validate card variant change', async () => {
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ah-try-buy-widget');
            await expect(await studio.getCard(data.cardid)).not.toHaveAttribute('variant', 'ccd-slice');
            await expect(await trybuywidget.cardTitle).toBeVisible();
            await expect(await trybuywidget.cardDescription).toBeVisible();
            await expect(await trybuywidget.cardPrice).toBeVisible();
            await expect(await trybuywidget.cardIcon).toBeVisible();
            await expect(await trybuywidget.cardCTA).toBeVisible();
            await expect(await trybuywidget.cardCTA).toHaveAttribute('data-wcs-osi', data.osi);
            await expect(await trybuywidget.cardCTA).toHaveAttribute('is', 'checkout-button');
        });

        await test.step('step-6: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-7: Verify there is no changes of the card', async () => {
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ccd-slice');
            await expect(await studio.getCard(data.cardid)).not.toHaveAttribute('variant', 'ah-try-buy-widget');
        });
    });

    // @studio-slice-add-osi - Validate adding OSI for slice card in mas studio
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
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ccd-slice');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Choose OSI in OST', async () => {
            await expect(await editor.OSI).toBeVisible();
            await expect(await editor.tags).toBeVisible();
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.productCodeTag}`));
            await expect(await editor.OSI).not.toContainText(data.osi);
            await expect(await editor.tags).not.toHaveAttribute('value', new RegExp(`${data.planTypeTag}`));
            await expect(await editor.tags).not.toHaveAttribute('value', new RegExp(`${data.offerTypeTag}`));
            await expect(await editor.tags).not.toHaveAttribute('value', new RegExp(`${data.marketSegmentsTag}`));

            await (await editor.OSIButton).click();
            await ost.backButton.click();
            await expect(await ost.searchField).toBeVisible();
            await ost.searchField.fill(data.osi);
            await (await ost.nextButton).click();
            await expect(await ost.priceUse).toBeVisible();
            await ost.priceUse.click();
        });

        await test.step('step-4: Validate osi value in Editor panel', async () => {
            await expect(await editor.OSI).toContainText(data.osi);
        });

        await test.step('step-5: Validate tags update', async () => {
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.productCodeTag}`));
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.offerTypeTag}`));
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.marketSegmentsTag}`));
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.planTypeTag}`));
        });
    });

    // @studio-slice-edit-discard-osi - Validate changing OSI for slice card in mas studio
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
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ccd-slice');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Change OSI in OST', async () => {
            await expect(await editor.OSI).toBeVisible();
            await expect(await editor.OSI).toContainText(data.osi.original);
            await expect(await editor.tags).toBeVisible();
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.osiTags.original.productCodeTag}`));
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.osiTags.original.offerTypeTag}`));
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.osiTags.original.marketSegmentsTag}`));
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.osiTags.original.planTypeTag}`));
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
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.osiTags.updated.productCodeTag}`));
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.osiTags.updated.offerTypeTag}`));
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.osiTags.updated.marketSegmentsTag}`));
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.osiTags.updated.planTypeTag}`));
            await expect(await editor.tags).not.toHaveAttribute('value', new RegExp(`${data.osiTags.original.productCodeTag}`));
            await expect(await editor.tags).not.toHaveAttribute('value', new RegExp(`${data.osiTags.original.planTypeTag}`));
            await expect(await editor.tags).not.toHaveAttribute('value', new RegExp(`${data.osiTags.original.offerTypeTag}`));
            await expect(await editor.tags).not.toHaveAttribute(
                'value',
                new RegExp(`${data.osiTags.original.marketSegmentsTag}`),
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
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.osiTags.original.productCodeTag}`));
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.osiTags.original.offerTypeTag}`));
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.osiTags.original.marketSegmentsTag}`));
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.osiTags.original.planTypeTag}`));
            await expect(await editor.tags).not.toHaveAttribute('value', new RegExp(`${data.osiTags.updated.planTypeTag}`));
            await expect(await editor.tags).not.toHaveAttribute('value', new RegExp(`${data.osiTags.updated.offerTypeTag}`));
            await expect(await editor.tags).not.toHaveAttribute(
                'value',
                new RegExp(`${data.osiTags.updated.marketSegmentsTag}`),
            );
        });
    });

    // @studio-slice-edit-discard-cta-variant - Validate edit CTA variant for slice card in mas studio
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
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ccd-slice');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit CTA variant', async () => {
            await expect(await editor.footer.locator(editor.linkEdit)).toBeVisible();
            await expect(await editor.CTA).toBeVisible();
            await expect(await editor.CTA).toHaveClass(data.cta.original.variant);
            expect(await webUtil.verifyCSS(await slice.cardCTA, data.cta.original.css)).toBeTruthy();
            await editor.CTA.click();
            await editor.footer.locator(editor.linkEdit).click();
            await expect(await editor.linkVariant).toBeVisible();
            await expect(await editor.linkSave).toBeVisible();
            await expect(await editor.getLinkVariant(data.cta.updated.variant)).toBeVisible();
            await (await editor.getLinkVariant(data.cta.updated.variant)).click();
            await editor.linkSave.click();
        });

        await test.step('step-4: Validate edited CTA variant in Editor panel', async () => {
            await expect(await editor.CTA).toHaveClass(data.cta.updated.variant);
            await expect(await editor.CTA).not.toHaveClass(data.cta.original.variant);
        });

        await test.step('step-5: Validate edited CTA on the card', async () => {
            expect(await webUtil.verifyCSS(await slice.cardCTA, data.cta.updated.css)).toBeTruthy();
            await expect(await slice.cardCTA).toHaveAttribute('data-wcs-osi', data.osi);
            await expect(await slice.cardCTA).toHaveAttribute('is', 'checkout-button');
        });

        await test.step('step-6: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-7: Open the editor and validate there are no changes', async () => {
            expect(await webUtil.verifyCSS(await slice.cardCTA, data.cta.original.css)).toBeTruthy();
        });
    });

    // @studio-slice-edit-discard-cta-checkout-params - Validate edit CTA checkout params for slice card in mas studio
    test(`${features[15].name},${features[15].tags}`, async ({ page, baseURL }) => {
        const { data } = features[15];
        const testPage = `${baseURL}${features[15].path}${miloLibs}${features[15].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ccd-slice');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit CTA checkout parameters', async () => {
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
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Validate edited CTA on the card', async () => {
            await expect(await slice.cardCTA).toHaveAttribute('data-wcs-osi', data.osi);
            await expect(await slice.cardCTA).toHaveAttribute('is', 'checkout-button');
            const CTAhref = await slice.cardCTA.getAttribute('data-href');
            let searchParams = new URLSearchParams(decodeURI(CTAhref).split('?')[1]);
            expect(searchParams.get('mv')).toBe(data.checkoutParams.mv);
            expect(searchParams.get('promoid')).toBe(data.checkoutParams.promoid);
            expect(searchParams.get('mv2')).toBe(data.checkoutParams.mv2);
        });

        await test.step('step-5: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-6: Verify there is no changes of the card', async () => {
            const changedCTAhref = await slice.cardCTA.getAttribute('data-href');
            let noSearchParams = new URLSearchParams(decodeURI(changedCTAhref).split('?')[1]);
            expect(noSearchParams).toBeNull;
        });
    });

    // @studio-slice-edit-discard-analytics-ids - Validate edit analytics IDs for slice card in mas studio
    test(`${features[16].name},${features[16].tags}`, async ({ page, baseURL }) => {
        const { data } = features[16];
        const testPage = `${baseURL}${features[16].path}${miloLibs}${features[16].browserParams}${data.cardid}`;
        setTestPage(testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ccd-slice');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit analytics IDs', async () => {
            await expect(await editor.footer.locator(editor.linkEdit)).toBeVisible();
            await expect(await editor.CTA).toBeVisible();
            await editor.CTA.click();
            await editor.footer.locator(editor.linkEdit).click();
            await expect(await editor.analyticsId).toBeVisible();
            await expect(await editor.linkSave).toBeVisible();
            await expect(await editor.analyticsId).toContainText(data.analyticsID.original);
            await expect(await slice.cardCTA).toHaveAttribute('data-analytics-id', data.analyticsID.original);
            await expect(await slice.cardCTA).toHaveAttribute('daa-ll', data.daaLL.original);
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('daa-lh', data.daaLH);

            await editor.analyticsId.click();
            await page.getByRole('option', { name: data.analyticsID.updated }).click();
            await editor.linkSave.click();
        });

        await test.step('step-4: Validate edited analytics IDs on the card', async () => {
            await expect(await slice.cardCTA).toHaveAttribute('data-analytics-id', data.analyticsID.updated);
            await expect(await slice.cardCTA).toHaveAttribute('daa-ll', data.daaLL.updated);
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('daa-lh', data.daaLH);
        });

        await test.step('step-5: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-6: Verify there is no changes of the card', async () => {
            await expect(await slice.cardCTA).toHaveAttribute('data-analytics-id', data.analyticsID.original);
            await expect(await slice.cardCTA).toHaveAttribute('daa-ll', data.daaLL.original);
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('daa-lh', data.daaLH);
        });
    });

    // @studio-slice-edit-discard-product-icon-picker - Validate edit and discard product icon using icon picker for slice card in mas studio
    test(`${features[17].name},${features[17].tags}`, async ({ page, baseURL }) => {
        const { data } = features[17];
        const testPage = `${baseURL}${features[17].path}${miloLibs}${features[17].browserParams}${data.cardid}`;
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
            await expect(await slice.cardIcon.first()).toHaveAttribute('src', data.productIcon.original.src);
        });

        await test.step('step-4: Select product icon from icon picker', async () => {
            await expect(await editor.mnemonicEditButton.first()).toBeVisible();
            await editor.openMnemonicModal();
            await editor.selectProductIcon(data.productIcon.name);
            await editor.saveMnemonicModal();
        });

        await test.step('step-5: Validate mnemonic icon updated in editor', async () => {
            await expect(await slice.cardIcon.first()).toHaveAttribute('src', data.productIcon.updated.src);
        });

        await test.step('step-6: Close the editor and verify discard is triggered', async () => {
            await studio.discardEditorChanges(editor);
        });

        await test.step('step-7: Validate icon reverted to original', async () => {
            await expect(await slice.cardIcon.first()).toHaveAttribute('src', data.productIcon.original.src);
        });
    });
});
