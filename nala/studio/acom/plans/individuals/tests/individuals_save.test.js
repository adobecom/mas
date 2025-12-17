import {
    test,
    expect,
    studio,
    editor,
    individuals,
    ost,
    setClonedCardID,
    getClonedCardID,
    webUtil,
    miloLibs,
    setTestPage,
} from '../../../../../libs/mas-test.js';
import ACOMPlansIndividualsSpec from '../specs/individuals_save.spec.js';

const { features } = ACOMPlansIndividualsSpec;

test.describe('M@S Studio ACOM Plans Individuals card test suite', () => {
    // @studio-plans-individuals-save-edited-variant-change - Validate saving card after variant change to suggested
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

        await test.step('step-3: Change variant and save card', async () => {
            await expect(await editor.variant).toBeVisible();
            await editor.variant.locator('sp-picker').first().click();
            await page.getByRole('option', { name: 'suggested' }).click();
            await page.waitForTimeout(2000);
            await studio.saveCard();
        });

        await test.step('step-4: Verify variant change is saved', async () => {
            await expect(await studio.getCard(data.clonedCardID)).not.toHaveAttribute('variant', 'plans');
            await expect(await studio.getCard(data.clonedCardID)).toHaveAttribute('variant', 'ccd-suggested');
        });
    });

    // @studio-plans-individuals-save-edited-size - Validate saving card after editing size
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

        await test.step('step-3: Edit size field', async () => {
            await expect(await editor.size).toBeVisible();
            await editor.size.scrollIntoViewIfNeeded();
            await editor.size.click();
            await page.getByRole('option', { name: 'Wide', exact: true }).click();
            await page.waitForTimeout(2000);
            await studio.saveCard();
        });

        await test.step('step-4: Verify size change is saved', async () => {
            await expect(await studio.getCard(data.clonedCardID)).toHaveAttribute('size', 'wide');
        });
    });

    // @studio-plans-individuals-save-edited-RTE-fields - Validate field edits and save for plans individuals card in mas studio
    // Combines: title, badge, description, mnemonic, callout, promo text, OSI, stock checkbox, what's included, and color changes
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
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await clonedCard).toBeVisible();
        });

        await test.step('step-3: Edit title field', async () => {
            await expect(await editor.title).toBeVisible();
            await editor.title.fill(data.title);
        });

        await test.step('step-4: Edit badge field', async () => {
            await expect(await editor.badge).toBeVisible();
            await editor.badge.fill(data.badge);
        });

        await test.step('step-5: Edit description field', async () => {
            await expect(await editor.description).toBeVisible();
            await editor.description.fill(data.description);
        });

        await test.step('step-6: Edit mnemonic field', async () => {
            await editor.openMnemonicModal();
            await editor.mnemonicUrlTab.click();
            await expect(await editor.iconURL).toBeVisible();
            await editor.iconURL.fill(data.iconURL);
            await editor.saveMnemonicModal();
        });

        await test.step('step-7: Edit callout field', async () => {
            await expect(await editor.calloutRTE).toBeVisible();
            await editor.calloutRTE.fill(data.callout);
        });

        await test.step('step-8: Edit promo text field', async () => {
            await expect(await editor.promoText).toBeVisible();
            await editor.promoText.fill(data.promoText);
        });

        await test.step('step-9: Edit OSI', async () => {
            await expect(await editor.OSI).toBeVisible();
            await expect(await editor.tags).toBeVisible();
            await editor.OSIButton.click();
            await ost.backButton.click();
            await page.waitForTimeout(2000);
            await expect(await ost.searchField).toBeVisible();
            await ost.searchField.fill(data.osi.updated);
            await (await ost.nextButton).click();
            await expect(await ost.priceUse).toBeVisible();
            await ost.priceUse.click();
        });

        await test.step('step-10: Edit whats included field', async () => {
            await expect(await editor.whatsIncludedLabel).toBeVisible();
            await editor.whatsIncludedLabel.fill(data.whatsIncludedText);
        });

        await test.step('step-11: Edit badge color', async () => {
            await expect(await editor.badgeColor).toBeVisible();
            await editor.badgeColor.scrollIntoViewIfNeeded();
            await editor.badgeColor.click();
            await expect(await editor.badgeColor.locator('sp-menu-item').first()).toBeVisible();
            await page.getByRole('option', { name: data.badgeColor.name, exact: true }).click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-12: Edit badge border color', async () => {
            await expect(await editor.badgeBorderColor).toBeVisible();
            await editor.badgeBorderColor.scrollIntoViewIfNeeded();
            await editor.badgeBorderColor.click();
            await expect(await editor.badgeBorderColor.locator('sp-menu-item').first()).toBeVisible();
            await page.getByRole('option', { name: data.badgeBorderColor.name, exact: true }).click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-13: Edit card border color', async () => {
            await expect(await editor.borderColor).toBeVisible();
            await editor.borderColor.scrollIntoViewIfNeeded();
            await editor.borderColor.click();
            await expect(await editor.borderColor.locator('sp-menu-item').first()).toBeVisible();
            await page.getByRole('option', { name: data.borderColor.name, exact: true }).click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-14: Save card with all changes', async () => {
            await studio.saveCard();
        });

        await test.step('step-16: Validate all field changes in parallel', async () => {
            const validationLabels = [
                'title',
                'badge',
                'description',
                'mnemonic',
                'callout',
                'promo text',
                'OSI',
                'whats included',
                'badge color',
                'badge border color',
                'card border color',
            ];

            const results = await Promise.allSettled([
                test.step('Validation-1: Verify title saved', async () => {
                    await expect(await editor.title).toContainText(data.title);
                    await expect(await clonedCard.locator(individuals.cardTitle)).toHaveText(data.title);
                }),

                test.step('Validation-2: Verify badge saved', async () => {
                    await expect(await editor.badge).toHaveValue(data.badge);
                    await expect(await clonedCard.locator(individuals.cardBadge)).toHaveText(data.badge);
                }),

                test.step('Validation-3: Verify description saved', async () => {
                    await expect(await editor.description).toContainText(data.description);
                    await expect(await clonedCard.locator(individuals.cardDescription)).toHaveText(data.description);
                }),

                test.step('Validation-4: Verify mnemonic saved', async () => {
                    await editor.openMnemonicModal();
                    await editor.mnemonicUrlTab.click();
                    await expect(await editor.iconURL).toHaveValue(data.iconURL);
                    await editor.cancelMnemonicModal();
                    await expect(await clonedCard.locator(individuals.cardIcon)).toHaveAttribute('src', data.iconURL);
                }),

                test.step('Validation-5: Verify callout saved', async () => {
                    await expect(await editor.calloutRTE).toContainText(data.callout);
                    await expect(await clonedCard.locator(individuals.cardCallout)).toHaveText(data.callout);
                }),

                test.step('Validation-6: Verify promo text saved', async () => {
                    await expect(await editor.promoText).toHaveValue(data.promoText);
                    await expect(await clonedCard.locator(individuals.cardPromoText)).toHaveText(data.promoText);
                }),

                test.step('Validation-7: Verify OSI changes saved', async () => {
                    await expect(await editor.OSI).toContainText(data.osi.updated);
                    await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.osiTags.updated.offerType}`));
                    await expect(await editor.tags).toHaveAttribute(
                        'value',
                        new RegExp(`${data.osiTags.updated.marketSegment}`),
                    );
                    await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.osiTags.updated.planType}`));
                    await expect(await editor.OSI).not.toContainText(data.osi.original);
                    await expect(await editor.tags).not.toHaveAttribute(
                        'value',
                        new RegExp(`${data.osiTags.original.offerType}`),
                    );
                    await expect(await editor.tags).not.toHaveAttribute(
                        'value',
                        new RegExp(`${data.osiTags.original.marketSegment}`),
                    );
                    await expect(await editor.tags).not.toHaveAttribute(
                        'value',
                        new RegExp(`${data.osiTags.original.planType}`),
                    );
                }),

                test.step('Validation-8: Verify whats included saved', async () => {
                    await expect(await editor.whatsIncludedLabel).toHaveValue(data.whatsIncludedText);
                    await expect(await clonedCard.locator(individuals.cardWhatsIncluded)).toHaveText(data.whatsIncludedText);
                }),

                test.step('Validation-9: Verify badge color saved', async () => {
                    await expect(await editor.badgeColor).toContainText(data.badgeColor.name);
                    expect(
                        await webUtil.verifyCSS(clonedCard.locator(individuals.cardBadge), {
                            'background-color': data.badgeColor.css,
                        }),
                    ).toBeTruthy();
                }),

                test.step('Validation-10: Verify badge border color saved', async () => {
                    await expect(await editor.badgeBorderColor).toContainText(data.badgeBorderColor.name);
                    expect(
                        await webUtil.verifyCSS(clonedCard.locator(individuals.cardBadge), {
                            'border-left-color': data.badgeBorderColor.css,
                            'border-top-color': data.badgeBorderColor.css,
                            'border-bottom-color': data.badgeBorderColor.css,
                        }),
                    ).toBeTruthy();
                }),

                test.step('Validation-11: Verify card border color saved', async () => {
                    await expect(await editor.borderColor).toContainText(data.borderColor.name);
                    expect(
                        await webUtil.verifyCSS(clonedCard, {
                            'border-color': data.borderColor.css,
                        }),
                    ).toBeTruthy();
                }),
            ]);

            // Check results and report any failures
            const failures = results
                .map((result, index) => ({ result, index }))
                .filter(({ result }) => result.status === 'rejected')
                .map(({ result, index }) => `🔍 Validation-${index + 1} (${validationLabels[index]}) failed: ${result.reason}`);

            if (failures.length > 0) {
                throw new Error(
                    `\x1b[31m✘\x1b[0m Plans Individuals card RTE field save validation failures:\n${failures.join('\n')}`,
                );
            }
        });
    });

    // @studio-plans-individuals-save-edited-price - Validate saving card after editing price
    test(`${features[3].name},${features[3].tags}`, async ({ page, baseURL }) => {
        const { data } = features[3];
        const testPage = `${baseURL}${features[3].path}${miloLibs}${features[3].browserParams}${data.cardid}`;
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
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await clonedCard).toBeVisible();
        });

        await test.step('step-3: Edit price field', async () => {
            await expect(await editor.prices).toBeVisible();
            await (await editor.prices.locator(editor.regularPrice)).dblclick();
            await expect(await ost.price).toBeVisible();
            await expect(await ost.priceUse).toBeVisible();
            await expect(await ost.oldPriceCheckbox).toBeVisible();
            await ost.oldPriceCheckbox.click();
            await ost.priceUse.click();
            await studio.saveCard();
        });

        await test.step('step-4: Verify price changes are saved', async () => {
            await expect(await editor.prices).toContainText(data.price);
            await expect(await editor.prices).not.toContainText(data.strikethroughPrice);
            await expect(await clonedCard.locator(individuals.cardPrice)).toContainText(data.price);
            await expect(await clonedCard.locator(individuals.cardPrice)).not.toContainText(data.strikethroughPrice);
        });
    });

    // @studio-plans-individuals-save-edited-quantity-selector - Validate saving card after editing quantity selector
    test(`${features[4].name},${features[4].tags}`, async ({ page, baseURL }) => {
        const { data } = features[4];
        const testPage = `${baseURL}${features[4].path}${miloLibs}${features[4].browserParams}${data.cardid}`;
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
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await clonedCard).toBeVisible();
        });

        await test.step('step-3: Toggle quantity selector', async () => {
            await expect(await editor.showQuantitySelector).toBeVisible();
            await editor.showQuantitySelector.click();
            await studio.saveCard();
        });

        await test.step('step-4: Verify quantity selector change is saved', async () => {
            await expect(await editor.showQuantitySelector).toBeChecked();
            await expect(await clonedCard.locator(individuals.cardQuantitySelector)).toBeVisible();
        });
    });

    // @studio-plans-individuals-save-edited-cta - Validate CTA edits and save for plans individuals card in mas studio
    // Combines: CTA label, variant, and checkout parameters editing
    test(`${features[5].name},${features[5].tags}`, async ({ page, baseURL }) => {
        const { data } = features[5];
        const testPage = `${baseURL}${features[5].path}${miloLibs}${features[5].browserParams}${data.cardid}`;
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
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await clonedCard).toBeVisible();
        });

        await test.step('step-3: Open link edit form and make all CTA edits', async () => {
            await expect(await editor.CTA).toBeVisible();
            await expect(await editor.footer).toContainText(data.cta.original.label);
            await expect(await editor.CTA).toHaveClass(data.cta.original.variant);
            expect(await webUtil.verifyCSS(await clonedCard.locator(individuals.cardCTA), data.cta.original.css)).toBeTruthy();

            // Open link edit form
            await editor.CTA.click();
            await editor.footer.locator(editor.linkEdit).click();

            // Edit 1: Change CTA label
            await expect(await editor.linkText).toBeVisible();
            await expect(await editor.linkText).toHaveValue(data.cta.original.label);
            await editor.linkText.fill(data.cta.updated.label);

            // Edit 2: Change CTA variant
            await expect(await editor.linkVariant).toBeVisible();
            await expect(await editor.getLinkVariant(data.cta.updated.variant)).toBeVisible();
            await (await editor.getLinkVariant(data.cta.updated.variant)).click();

            // Edit 3: Add checkout parameters
            await expect(await editor.checkoutParameters).toBeVisible();
            const checkoutParamsString = Object.keys(data.checkoutParams)
                .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(data.checkoutParams[key])}`)
                .join('&');
            await editor.checkoutParameters.fill(checkoutParamsString);

            // Save all changes
            await expect(await editor.linkSave).toBeVisible();
            await editor.linkSave.click();
        });

        await test.step('step-4: Save card with all CTA changes', async () => {
            await studio.saveCard();
        });

        await test.step('step-5: Validate all CTA changes in parallel', async () => {
            const results = await Promise.allSettled([
                test.step('Validation-1: Verify CTA label saved', async () => {
                    await expect(await editor.footer).toContainText(data.cta.updated.label);
                    await expect(await clonedCard.locator(individuals.cardCTA)).toContainText(data.cta.updated.label);
                }),

                test.step('Validation-2: Verify CTA variant saved', async () => {
                    await expect(await editor.CTA).toHaveClass(data.cta.updated.variant);
                    await expect(await editor.CTA).not.toHaveClass(data.cta.original.variant);
                    expect(
                        await webUtil.verifyCSS(await clonedCard.locator(individuals.cardCTA), data.cta.updated.css),
                    ).toBeTruthy();
                }),

                test.step('Validation-3: Verify checkout parameters saved', async () => {
                    await expect(await clonedCard.locator(individuals.cardCTA)).toHaveAttribute(
                        'data-wcs-osi',
                        data.osi.updated,
                    );
                    await expect(await clonedCard.locator(individuals.cardCTA)).toHaveAttribute('is', 'checkout-link');
                    const CTAhref = await clonedCard.locator(individuals.cardCTA).getAttribute('href');
                    let searchParams = new URLSearchParams(decodeURI(CTAhref).split('?')[1]);
                    expect(searchParams.get('mv')).toBe(data.checkoutParams.mv);
                    expect(searchParams.get('promoid')).toBe(data.checkoutParams.promoid);
                    expect(searchParams.get('mv2')).toBe(data.checkoutParams.mv2);
                }),
            ]);

            // Check results and report any failures
            const failures = results
                .map((result, index) => ({ result, index }))
                .filter(({ result }) => result.status === 'rejected')
                .map(({ result, index }) => `🔍 Validation-${index + 1} failed: ${result.reason}`);

            if (failures.length > 0) {
                throw new Error(
                    `\x1b[31m✘\x1b[0m Plans Individuals card CTA save validation failures:\n${failures.join('\n')}`,
                );
            }
        });
    });

    // @studio-plans-individuals-save-add-description-price-legal-disclamer - Validate save adding legal disclamer in description for plans individuals card in mas studio
    test(`${features[6].name},${features[6].tags}`, async ({ page, baseURL }) => {
        const { data } = features[6];
        const testPage = `${baseURL}${features[6].path}${miloLibs}${features[6].browserParams}${data.cardid}`;
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
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await clonedCard).toBeVisible();
        });

        await test.step('step-3: Edit description field', async () => {
            await expect(await editor.description).toBeVisible();
            await expect(await editor.description).not.toContainText(data.legalDisclaimer);
            await editor.descriptionFieldGroup.locator(editor.OSTButton).click();
            await ost.legalDisclaimer.scrollIntoViewIfNeeded();
            await expect(await ost.legalDisclaimer).not.toContainText(data.legalDisclaimer);
            await expect(await ost.unitCheckbox).toBeVisible();
            await expect(await ost.taxlabelCheckbox).toBeVisible();
            await ost.unitCheckbox.click();
            await ost.taxlabelCheckbox.click();
            await expect(await ost.legalDisclaimer).toContainText(data.legalDisclaimer);
            await expect(await ost.legalDisclaimerUse).toBeVisible();
            await ost.legalDisclaimerUse.click();
            await studio.saveCard();
        });

        await test.step('step-4: Validate description field updated', async () => {
            await expect(await editor.description).toContainText(data.legalDisclaimer);
            await expect(await clonedCard.locator(individuals.cardDescription)).toContainText(data.cardLegalDisclaimer);
        });
    });

    // @studio-plans-individuals-save-product-icon-picker - Validate save product icon using icon picker for plans individuals card in mas studio
    test(`${features[7].name},${features[7].tags}`, async ({ page, baseURL }) => {
        const { data } = features[7];
        const testPage = `${baseURL}${features[7].path}${miloLibs}${features[7].browserParams}${data.cardid}`;
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

        await test.step('step-3: Validate original icon', async () => {
            await expect(await clonedCard.locator(individuals.cardIcon)).toHaveAttribute('src', data.productIcon.original.src);
        });

        await test.step('step-4: Select product icon from icon picker', async () => {
            await editor.openMnemonicModal();
            await editor.selectProductIcon(data.productIcon.name);
            await editor.saveMnemonicModal();
            await studio.saveCard();
        });

        await test.step('step-5: Validate mnemonic icon saved', async () => {
            await expect(await clonedCard.locator(individuals.cardIcon)).toHaveAttribute('src', data.productIcon.updated.src);
        });
    });
});
