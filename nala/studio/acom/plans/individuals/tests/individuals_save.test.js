import { expect, test } from '@playwright/test';
import StudioPage from '../../../../studio.page.js';
import EditorPage from '../../../../editor.page.js';
import ACOMPlansIndividualsSpec from '../specs/individuals_save.spec.js';
import ACOMPlansIndividualsPage from '../individuals.page.js';
import OSTPage from '../../../../ost.page.js';
import WebUtil from '../../../../../libs/webutil.js';

const { features } = ACOMPlansIndividualsSpec;
const miloLibs = process.env.MILO_LIBS || '';

let studio;
let editor;
let individuals;
let ost;
let clonedCardID;
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
    individuals = new ACOMPlansIndividualsPage(page);
    ost = new OSTPage(page);
    clonedCardID = '';
    webUtil = new WebUtil(page);
});

test.afterEach(async ({ page }) => {
    if (await editor.panel.isVisible()) {
        await editor.closeEditor.click();
        await expect(await editor.panel).not.toBeVisible();
    }

    if (await (await studio.getCard(clonedCardID)).isVisible()) {
        await studio.deleteCard(clonedCardID);
        await expect(await studio.getCard(clonedCardID)).not.toBeVisible();
    }

    await page.close();
});

test.describe('M@S Studio ACOM Plans Individuals card test suite', () => {
    // @studio-plans-individuals-save-edited-variant-change - Validate saving card after variant change to suggested
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);
        let clonedCard;

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Clone card and open editor', async () => {
            await studio.cloneCard(data.cardid);
            clonedCard = await studio.getCard(data.cardid, 'cloned');
            clonedCardID = await clonedCard.locator('aem-fragment').getAttribute('fragment');
            data.clonedCardID = await clonedCardID;
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await page.waitForTimeout(2000);
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
        console.info('[Test Page]: ', testPage);
        let clonedCard;

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Clone card and open editor', async () => {
            await studio.cloneCard(data.cardid);
            clonedCard = await studio.getCard(data.cardid, 'cloned');
            clonedCardID = await clonedCard.locator('aem-fragment').getAttribute('fragment');
            data.clonedCardID = await clonedCardID;
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await page.waitForTimeout(2000);
        });

        await test.step('step-3: Edit size field', async () => {
            await expect(await editor.size).toBeVisible();
            await editor.size.click();
            await page.getByRole('option', { name: 'Wide', exact: true }).click();
            await page.waitForTimeout(2000);
            await studio.saveCard();
        });

        await test.step('step-4: Verify size change is saved', async () => {
            await expect(await studio.getCard(data.clonedCardID)).toHaveAttribute('size', 'wide');
        });
    });

    // @studio-plans-individuals-save-comprehensive - Validate comprehensive field edits and save for plans individuals card in mas studio
    // Each edit is done sequentially, card is saved once, then all validations run in parallel
    // Combines: title, badge, description, mnemonic, callout, promo text, OSI, stock checkbox, and color changes
    test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
        const { data } = features[2];
        const testPage = `${baseURL}${features[2].path}${miloLibs}${features[2].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);
        let clonedCard;

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Clone card and open editor', async () => {
            await studio.cloneCard(data.cardid);
            clonedCard = await studio.getCard(data.cardid, 'cloned');
            clonedCardID = await clonedCard.locator('aem-fragment').getAttribute('fragment');
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await page.waitForTimeout(2000);
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
            await expect(await editor.iconURL).toBeVisible();
            await editor.iconURL.fill(data.iconURL);
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
            await ost.searchField.fill(data.osi);
            await (await ost.nextButton).click();
            await expect(await ost.priceUse).toBeVisible();
            await ost.priceUse.click();
        });

        await test.step('step-10: Toggle stock checkbox', async () => {
            await expect(await editor.showStockCheckbox).toBeVisible();
            await editor.showStockCheckbox.click();
        });

        await test.step('step-11: Edit badge color', async () => {
            await expect(await editor.badgeColor).toBeVisible();
            await editor.badgeColor.click();
            await page.getByRole('option', { name: data.badgeColor.name, exact: true }).click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-12: Edit badge border color', async () => {
            await expect(await editor.badgeBorderColor).toBeVisible();
            await editor.badgeBorderColor.click();
            await page.getByRole('option', { name: data.badgeBorderColor.name, exact: true }).click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-13: Edit card border color', async () => {
            await expect(await editor.cardBorderColor).toBeVisible();
            await editor.cardBorderColor.click();
            await page.getByRole('option', { name: data.cardBorderColor.name, exact: true }).click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-14: Save card with all changes', async () => {
            await studio.saveCard();
        });

        await test.step('step-15: Validate all field changes in parallel', async () => {
            const results = await Promise.allSettled([
                test.step('Validation-1: Verify title saved', async () => {
                    await expect(await editor.title).toHaveValue(data.title);
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
                    await expect(await editor.iconURL).toHaveValue(data.iconURL);
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
                    await expect(await editor.OSI).toContainText(data.osi);
                    await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.osiTags.offerType}`));
                    await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.osiTags.marketSegment}`));
                    await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.osiTags.planType}`));
                }),

                test.step('Validation-8: Verify stock checkbox saved', async () => {
                    await expect(await editor.showStockCheckbox).toBeChecked();
                    await expect(await clonedCard.locator(individuals.cardStockCheckbox)).toBeVisible();
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
                    await expect(await editor.cardBorderColor).toContainText(data.cardBorderColor.name);
                    expect(
                        await webUtil.verifyCSS(clonedCard, {
                            'border-color': data.cardBorderColor.css,
                        }),
                    ).toBeTruthy();
                }),
            ]);

            // Check results and report any failures
            const failures = results
                .map((result, index) => ({ result, index }))
                .filter(({ result }) => result.status === 'rejected')
                .map(({ result, index }) => `Validation ${index + 1} failed: ${result.reason}`);

            if (failures.length > 0) {
                throw new Error(`Comprehensive save validation failures:\n${failures.join('\n')}`);
            }
        });
    });

    // @studio-plans-individuals-save-edited-price - Validate saving card after editing price
    test(`${features[8].name},${features[8].tags}`, async ({ page, baseURL }) => {
        const { data } = features[8];
        const testPage = `${baseURL}${features[8].path}${miloLibs}${features[8].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);
        let clonedCard;

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Clone card and open editor', async () => {
            await studio.cloneCard(data.cardid);
            clonedCard = await studio.getCard(data.cardid, 'cloned');
            clonedCardID = await clonedCard.locator('aem-fragment').getAttribute('fragment');
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await page.waitForTimeout(2000);
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

    // Note: OSI editing is covered in comprehensive test above

    // Note: Stock checkbox editing is covered in comprehensive test above

    // @studio-plans-individuals-save-edited-quantity-selector - Validate saving card after editing quantity selector
    test(`${features[11].name},${features[11].tags}`, async ({ page, baseURL }) => {
        const { data } = features[11];
        const testPage = `${baseURL}${features[11].path}${miloLibs}${features[11].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);
        let clonedCard;

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Clone card and open editor', async () => {
            await studio.cloneCard(data.cardid);
            clonedCard = await studio.getCard(data.cardid, 'cloned');
            clonedCardID = await clonedCard.locator('aem-fragment').getAttribute('fragment');
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await page.waitForTimeout(2000);
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

    // @studio-plans-individuals-save-edited-whats-included - Validate saving card after editing whats included
    test(`${features[12].name},${features[12].tags}`, async ({ page, baseURL }) => {
        const { data } = features[12];
        const testPage = `${baseURL}${features[12].path}${miloLibs}${features[12].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);
        let clonedCard;

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Clone card and open editor', async () => {
            await studio.cloneCard(data.cardid);
            clonedCard = await studio.getCard(data.cardid, 'cloned');
            clonedCardID = await clonedCard.locator('aem-fragment').getAttribute('fragment');
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await page.waitForTimeout(2000);
        });

        await test.step('step-3: Edit whats included field and save card', async () => {
            await expect(await editor.whatsIncludedLabel).toBeVisible();
            await editor.whatsIncludedLabel.fill(data.whatsIncludedText);
            await studio.saveCard();
        });

        await test.step('step-4: Verify whats included change is saved', async () => {
            await expect(await editor.whatsIncludedLabel).toHaveValue(data.whatsIncludedText);
            await expect(await clonedCard.locator(individuals.cardWhatsIncluded)).toHaveText(data.whatsIncludedText);
        });
    });

    // Note: Badge color editing is covered in comprehensive test above

    // Note: Badge border color editing is covered in comprehensive test above

    // Note: Card border color editing is covered in comprehensive test above

    // @studio-plans-individuals-save-comprehensive-cta - Validate comprehensive CTA edits and save for plans individuals card in mas studio
    // Each edit is done sequentially within the link edit form, card is saved once, then all validations run in parallel
    // Combines: CTA label, variant, and checkout parameters editing
    test(`${features[16].name},${features[16].tags}`, async ({ page, baseURL }) => {
        const { data } = features[16];
        const testPage = `${baseURL}${features[16].path}${miloLibs}${features[16].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);
        let clonedCard;

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Clone card and open editor', async () => {
            await studio.cloneCard(data.cardid);
            clonedCard = await studio.getCard(data.cardid, 'cloned');
            clonedCardID = await clonedCard.locator('aem-fragment').getAttribute('fragment');
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await page.waitForTimeout(2000);
        });

        await test.step('step-3: Open link edit form and make all CTA edits', async () => {
            await expect(await editor.CTA).toBeVisible();
            await expect(await editor.footer).toContainText(data.label.old);
            await expect(await editor.CTA).toHaveClass(data.variant.old);
            expect(await webUtil.verifyCSS(await clonedCard.locator(individuals.cardCTA), data.variant.oldCSS)).toBeTruthy();

            // Open link edit form
            await editor.CTA.click();
            await editor.footer.locator(editor.linkEdit).click();

            // Edit 1: Change CTA label
            await expect(await editor.linkText).toBeVisible();
            await expect(await editor.linkText).toHaveValue(data.label.old);
            await editor.linkText.fill(data.label.new);

            // Edit 2: Change CTA variant
            await expect(await editor.linkVariant).toBeVisible();
            await expect(await editor.getLinkVariant(data.variant.new)).toBeVisible();
            await (await editor.getLinkVariant(data.variant.new)).click();

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
                    await expect(await editor.footer).toContainText(data.label.new);
                    await expect(await clonedCard.locator(individuals.cardCTA)).toContainText(data.label.new);
                }),

                test.step('Validation-2: Verify CTA variant saved', async () => {
                    await expect(await editor.CTA).toHaveClass(data.variant.new);
                    await expect(await editor.CTA).not.toHaveClass(data.variant.old);
                    expect(
                        await webUtil.verifyCSS(await clonedCard.locator(individuals.cardCTA), data.variant.newCSS),
                    ).toBeTruthy();
                }),

                test.step('Validation-3: Verify checkout parameters saved', async () => {
                    await expect(await clonedCard.locator(individuals.cardCTA)).toHaveAttribute('data-wcs-osi', data.osi);
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
                .map(({ result, index }) => `Validation ${index + 1} failed: ${result.reason}`);

            if (failures.length > 0) {
                throw new Error(`Comprehensive CTA save validation failures:\n${failures.join('\n')}`);
            }
        });
    });

    // Note: CTA variant editing is covered in comprehensive CTA test above

    // Note: CTA checkout parameters editing is covered in comprehensive CTA test above

    // @studio-plans-individuals-save-add-description-price-legal-disclamer - Validate save adding legal disclamer in description for plans individuals card in mas studio
    test(`${features[19].name},${features[19].tags}`, async ({ page, baseURL }) => {
        const { data } = features[19];
        const testPage = `${baseURL}${features[19].path}${miloLibs}${features[19].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);
        let clonedCard;

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Clone card and open editor', async () => {
            await studio.cloneCard(data.cardid);
            clonedCard = await studio.getCard(data.cardid, 'cloned');
            clonedCardID = await clonedCard.locator('aem-fragment').getAttribute('fragment');
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await page.waitForTimeout(2000);
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
});
