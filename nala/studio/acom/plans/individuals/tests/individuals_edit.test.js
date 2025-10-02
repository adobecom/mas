import {
    test,
    expect,
    studio,
    editor,
    individuals,
    slice,
    suggested,
    trybuywidget,
    ost,
    webUtil,
    miloLibs,
} from '../../../../../libs/mas-test.js';
import ACOMPlansIndividualsSpec from '../specs/individuals_edit.spec.js';

const { features } = ACOMPlansIndividualsSpec;

test.describe('M@S Studio ACOM Plans Individuals card test suite', () => {
    // @studio-plans-individuals-edit-variant-change-to-suggested - Validate variant change for plans individuals card to suggested in mas studio
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'plans');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Change variant', async () => {
            await expect(await editor.variant).toBeVisible();
            await expect(await editor.variant).toHaveAttribute('default-value', 'plans');
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
            await expect(await editor.iconURL).toBeVisible();
            await expect(await editor.backgroundImage).toBeVisible();
            await expect(await editor.prices).toBeVisible();
            await expect(await editor.footer).toBeVisible();
            await expect(await editor.whatsIncludedLabel).not.toBeVisible();
            await expect(await editor.promoText).not.toBeVisible();
            await expect(await editor.callout).not.toBeVisible();
            await expect(await editor.showAddOn).not.toBeVisible();
            await expect(await editor.showQuantitySelector).not.toBeVisible();
            await expect(await editor.OSI).toBeVisible();
        });

        await test.step('step-5: Validate new variant of the card', async () => {
            await expect(await studio.getCard(data.cardid)).not.toHaveAttribute('variant', 'plans');
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ccd-suggested');
            await expect(await suggested.cardTitle).toBeVisible();
            await expect(await suggested.cardDescription).toBeVisible();
            await expect(await suggested.cardPrice).toBeVisible();
            await expect(await suggested.cardIcon).toBeVisible();
            await expect(await individuals.cardWhatsIncluded).not.toBeVisible();
            await expect(await individuals.cardPromoText).not.toBeVisible();
            await expect(await individuals.cardCallout).not.toBeVisible();
            await expect(await individuals.cardStockCheckbox).not.toBeVisible();
            await expect(await individuals.cardQuantitySelector).not.toBeVisible();
            await expect(await individuals.cardSecureTransaction).not.toBeVisible();
        });
    });

    // @studio-plans-individuals-edit-variant-change-to-slice - Validate variant change for plans individuals card to slice in mas studio
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'plans');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Change variant', async () => {
            await expect(await editor.variant).toBeVisible();
            await expect(await editor.variant).toHaveAttribute('default-value', 'plans');
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
            await expect(await editor.iconURL).toBeVisible();
            await expect(await editor.backgroundImage).toBeVisible();
            await expect(await editor.prices).not.toBeVisible();
            await expect(await editor.footer).toBeVisible();
            await expect(await editor.whatsIncludedLabel).not.toBeVisible();
            await expect(await editor.promoText).not.toBeVisible();
            await expect(await editor.callout).not.toBeVisible();
            await expect(await editor.showAddOn).not.toBeVisible();
            await expect(await editor.showQuantitySelector).not.toBeVisible();
            await expect(await editor.OSI).toBeVisible();
        });

        await test.step('step-5: Validate new variant of the card', async () => {
            await expect(await studio.getCard(data.cardid)).not.toHaveAttribute('variant', 'plans');
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ccd-slice');

            await expect(await individuals.cardTitle).not.toBeVisible();
            await expect(await slice.cardDescription).toBeVisible();
            await expect(await slice.cardPrice).not.toBeVisible();
            await expect(await slice.cardIcon).toBeVisible();
            await expect(await individuals.cardWhatsIncluded).not.toBeVisible();
            await expect(await individuals.cardPromoText).not.toBeVisible();
            await expect(await individuals.cardCallout).not.toBeVisible();
            await expect(await individuals.cardStockCheckbox).not.toBeVisible();
            await expect(await individuals.cardQuantitySelector).not.toBeVisible();
            await expect(await individuals.cardSecureTransaction).not.toBeVisible();
        });
    });

    // @studio-plans-individuals-edit-variant-change-to-trybuywidget - Validate variant change for plans individuals card to try-buy-widget in mas studio
    test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
        const { data } = features[2];
        const testPage = `${baseURL}${features[2].path}${miloLibs}${features[2].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'plans');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Change variant', async () => {
            await expect(await editor.variant).toBeVisible();
            await expect(await editor.variant).toHaveAttribute('default-value', 'plans');
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
            await expect(await editor.iconURL).toBeVisible();
            await expect(await editor.backgroundImage).toBeVisible();
            await expect(await editor.borderColor).toBeVisible();
            await expect(await editor.backgroundColor).toBeVisible();
            await expect(await editor.prices).toBeVisible();
            await expect(await editor.footer).toBeVisible();
            await expect(await editor.whatsIncludedLabel).not.toBeVisible();
            await expect(await editor.promoText).not.toBeVisible();
            await expect(await editor.callout).not.toBeVisible();
            await expect(await editor.showAddOn).not.toBeVisible();
            await expect(await editor.showQuantitySelector).not.toBeVisible();
            await expect(await editor.OSI).toBeVisible();
        });

        await test.step('step-5: Validate new variant of the card', async () => {
            await expect(await studio.getCard(data.cardid)).not.toHaveAttribute('variant', 'plans');
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ah-try-buy-widget');
            await expect(await trybuywidget.cardTitle).toBeVisible();
            await expect(await trybuywidget.cardDescription).toBeVisible();
            await expect(await trybuywidget.cardPrice).toBeVisible();
            await expect(await trybuywidget.cardIcon).toBeVisible();
            await expect(await individuals.cardWhatsIncluded).not.toBeVisible();
            await expect(await individuals.cardPromoText).not.toBeVisible();
            await expect(await individuals.cardCallout).not.toBeVisible();
            await expect(await individuals.cardStockCheckbox).not.toBeVisible();
            await expect(await individuals.cardQuantitySelector).not.toBeVisible();
            await expect(await individuals.cardSecureTransaction).not.toBeVisible();
        });
    });

    // @studio-plans-individuals-edit-size - Validate edit size for plans individuals card in mas studio
    test(`${features[3].name},${features[3].tags}`, async ({ page, baseURL }) => {
        const { data } = features[3];
        const testPage = `${baseURL}${features[3].path}${miloLibs}${features[3].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'plans');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit size field', async () => {
            await expect(await editor.size).toBeVisible();
            await expect(await editor.size).toHaveAttribute('value', 'Default');
            await editor.size.click();
            await page.getByRole('option', { name: 'Wide', exact: true }).click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Validate new size of the card', async () => {
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('size', 'wide');
        });

        await test.step('step-5: Edit size field to super-wide', async () => {
            await editor.size.click();
            await page.getByRole('option', { name: 'Super Wide', exact: true }).click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-6: Validate new size of the card', async () => {
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('size', 'super-wide');
        });
    });

    // @studio-plans-individuals-edit-title - Validate edit title for plans individuals card in mas studio
    test(`${features[4].name},${features[4].tags}`, async ({ page, baseURL }) => {
        const { data } = features[4];
        const testPage = `${baseURL}${features[4].path}${miloLibs}${features[4].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'plans');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit title field', async () => {
            await expect(await editor.title).toBeVisible();
            await expect(await editor.title).toHaveValue(data.title);
            await editor.title.fill(data.newTitle);
        });

        await test.step('step-4: Validate title field updated', async () => {
            await expect(await editor.title).toHaveValue(data.newTitle);
            await expect(await individuals.cardTitle).toHaveText(data.newTitle);
        });
    });

    // @studio-plans-individuals-edit-badge - Validate edit badge for plans individuals card in mas studio
    test(`${features[5].name},${features[5].tags}`, async ({ page, baseURL }) => {
        const { data } = features[5];
        const testPage = `${baseURL}${features[5].path}${miloLibs}${features[5].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'plans');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Remove badge field', async () => {
            await expect(await editor.badge).toBeVisible();
            await expect(await editor.badge).toHaveValue(data.badge);
            await editor.badge.fill('');
        });

        await test.step('step-4: Validate badge field is removed', async () => {
            await expect(await editor.badge).toHaveValue('');
            await expect(await individuals.cardBadge).not.toBeVisible();
        });

        await test.step('step-5: Enter new value in the badge field', async () => {
            await editor.badge.fill(data.newBadge);
        });

        await test.step('step-6: Validate badge field updated', async () => {
            await expect(await editor.badge).toHaveValue(data.newBadge);
            await expect(await individuals.cardBadge).toHaveText(data.newBadge);
        });
    });

    // @studio-plans-individuals-edit-description - Validate edit description for plans individuals card in mas studio
    test(`${features[6].name},${features[6].tags}`, async ({ page, baseURL }) => {
        const { data } = features[6];
        const testPage = `${baseURL}${features[6].path}${miloLibs}${features[6].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'plans');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit description field', async () => {
            await expect(await editor.description).toBeVisible();
            await expect(await editor.description).toContainText(data.description);
            await editor.description.fill(data.newDescription);
        });

        await test.step('step-4: Validate description field updated', async () => {
            await expect(await editor.description).toContainText(data.newDescription);
            await expect(await individuals.cardDescription).toContainText(data.newDescription);
        });
    });

    // @studio-plans-individuals-edit-mnemonic - Validate edit mnemonic for plans individuals card in mas studio
    test(`${features[7].name},${features[7].tags}`, async ({ page, baseURL }) => {
        const { data } = features[7];
        const testPage = `${baseURL}${features[7].path}${miloLibs}${features[7].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'plans');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit mnemonic URL field', async () => {
            await expect(await editor.iconURL).toBeVisible();
            await expect(await editor.iconURL).toHaveValue(data.iconURL);
            await editor.iconURL.fill(data.newIconURL);
        });

        await test.step('step-4: Validate mnemonic URL field updated', async () => {
            await expect(await editor.iconURL).toHaveValue(data.newIconURL);
            await expect(await individuals.cardIcon).toHaveAttribute('src', data.newIconURL);
        });
    });

    // @studio-plans-individuals-edit-callout - Validate edit callout for plans individuals card in mas studio
    test(`${features[8].name},${features[8].tags}`, async ({ page, baseURL }) => {
        const { data } = features[8];
        const testPage = `${baseURL}${features[8].path}${miloLibs}${features[8].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'plans');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Remove callout field', async () => {
            await expect(await editor.calloutRTE).toBeVisible();
            await expect(await editor.calloutRTE).toContainText(data.calloutText);
            await editor.calloutRTE.click();
            await editor.calloutRTE.fill('');
        });

        await test.step('step-4: Validate callout field is removed', async () => {
            await expect(await individuals.cardCallout).not.toBeVisible();
        });

        await test.step('step-5: Enter new value in the callout field', async () => {
            await editor.calloutRTE.fill(data.newCalloutText);
        });

        await test.step('step-6: Validate callout field updated', async () => {
            await expect(await editor.calloutRTE).toContainText(data.newCalloutText);
            await expect(await individuals.cardCallout).toContainText(data.newCalloutText);
        });
    });

    // @studio-plans-individuals-edit-promo-text - Validate edit promo text for plans individuals card in mas studio
    test(`${features[9].name},${features[9].tags}`, async ({ page, baseURL }) => {
        const { data } = features[9];
        const testPage = `${baseURL}${features[9].path}${miloLibs}${features[9].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'plans');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Remove promo text field', async () => {
            await expect(await editor.promoText).toBeVisible();
            await expect(await editor.promoText).toHaveValue(data.promoText);
            await editor.promoText.fill('');
        });

        await test.step('step-4: Validate promo text field is removed', async () => {
            await expect(await editor.promoText).toHaveValue('');
            await expect(await individuals.cardPromoText).not.toBeVisible();
        });

        await test.step('step-5: Enter new value in the promo text field', async () => {
            await editor.promoText.fill(data.newPromoText);
        });

        await test.step('step-6: Validate promo text field updated', async () => {
            await expect(await editor.promoText).toHaveValue(data.newPromoText);
            await expect(await individuals.cardPromoText).toHaveText(data.newPromoText);
        });
    });

    // @studio-plans-individuals-edit-price - Validate edit price for plans individuals card in mas studio
    test(`${features[10].name},${features[10].tags}`, async ({ page, baseURL }) => {
        const { data } = features[10];
        const testPage = `${baseURL}${features[10].path}${miloLibs}${features[10].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'plans');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit price field', async () => {
            await expect(await editor.prices).toBeVisible();
            await expect(await editor.prices).toContainText(data.price);
            await expect(await editor.prices).not.toContainText(data.newPrice);
            await expect(await editor.prices).toContainText(data.strikethroughPrice);
            await expect(await editor.prices).not.toContainText(data.newStrikethroughPrice);
            await expect(await editor.prices.locator(editor.promoStrikethroughPrice)).toHaveCSS(
                'text-decoration-line',
                'line-through',
            );
            await (await editor.prices.locator(editor.regularPrice)).dblclick();
            await expect(await ost.price).toBeVisible();
            await expect(await ost.price).toContainText(data.price);
            await expect(await ost.price).not.toContainText(data.newPrice);
            await expect(await ost.price).toContainText(data.strikethroughPrice);
            await expect(await ost.price).not.toContainText(data.newStrikethroughPrice);
            await expect(await ost.pricePromoStrikethrough).toHaveCSS('text-decoration-line', 'line-through');

            await expect(await ost.priceUse).toBeVisible();
            await expect(await ost.unitCheckbox).toBeVisible();
            await ost.unitCheckbox.click();
            await expect(await ost.price).toContainText(data.newPrice);
            await expect(await ost.price).toContainText(data.newStrikethroughPrice);
            await expect(await ost.pricePromoStrikethrough).toHaveCSS('text-decoration-line', 'line-through');
            await ost.priceUse.click();
        });

        await test.step('step-4: Validate edited price in Editor panel', async () => {
            await expect(await editor.prices).toContainText(data.newPrice);
            await expect(await editor.prices).toContainText(data.newStrikethroughPrice);
            await expect(await editor.prices.locator(editor.promoStrikethroughPrice)).toHaveCSS(
                'text-decoration-line',
                'line-through',
            );
        });

        await test.step('step-5: Validate edited price field on the card', async () => {
            await expect(await individuals.cardPrice).not.toContainText(data.newPrice);
            await expect(await individuals.cardPrice).not.toContainText(data.newStrikethroughPrice);
            await expect(await individuals.cardPrice).toContainText(data.price);
            await expect(await individuals.cardPrice).toContainText(data.strikethroughPrice);
            await expect(await individuals.cardPriceStrikethrough).toHaveCSS('text-decoration-line', 'line-through');
            await expect(await individuals.cardPriceLegal).toBeVisible();
            await expect(await individuals.cardPriceLegal).toContainText(data.legalText);
        });
    });

    // @studio-plans-individuals-edit-osi - Validate edit OSI for plans individuals card in mas studio
    test(`${features[11].name},${features[11].tags}`, async ({ page, baseURL }) => {
        const { data } = features[11];
        const testPage = `${baseURL}${features[11].path}${miloLibs}${features[11].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'plans');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Change OSI in OST', async () => {
            await expect(await editor.OSI).toBeVisible();
            await expect(await editor.OSI).toContainText(data.osi);
            await expect(await editor.tags).toBeVisible();
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.offerTypeTag}`));
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.marketSegmentsTag}`));
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.planTypeTag}`));
            await editor.OSIButton.click();
            await ost.backButton.click();
            await page.waitForTimeout(2000);
            await expect(await ost.searchField).toBeVisible();
            await ost.searchField.fill(data.newosi);
            await (await ost.nextButton).click();
            await expect(await ost.priceUse).toBeVisible();
            await ost.priceUse.click();
        });

        await test.step('step-4: Validate edited OSI and tags in Editor panel', async () => {
            await expect(await editor.OSI).toContainText(data.newosi);
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.newPlanTypeTag}`));
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.newOfferTypeTag}`));
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.newMarketSegmentsTag}`));
            await expect(await editor.tags).not.toHaveAttribute('value', new RegExp(`${data.offerTypeTag}`));
            await expect(await editor.tags).not.toHaveAttribute('value', new RegExp(`${data.marketSegmentsTag}`));
            await expect(await editor.tags).not.toHaveAttribute('value', new RegExp(`${data.planTypeTag}`));
        });
    });

    // @studio-plans-individuals-edit-stock-checkbox - Validate edit stock checkbox for plans individuals card in mas studio
    test.skip(`${features[12].name},${features[12].tags}`, async ({ page, baseURL }) => {
        const { data } = features[12];
        const testPage = `${baseURL}${features[12].path}${miloLibs}${features[12].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'plans');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Toggle stock checkbox', async () => {
            await expect(await editor.showStockCheckbox).toBeVisible();
            await expect(await editor.showStockCheckbox).toBeChecked();
            await expect(await individuals.cardStockCheckbox).toBeVisible();
            await expect(await individuals.cardStockCheckboxIcon).toBeVisible();
            await editor.showStockCheckbox.click();
        });

        await test.step('step-4: Validate stock checkbox updated', async () => {
            await expect(await editor.showStockCheckbox).not.toBeChecked();
            await expect(await editor.showStockCheckbox).toBeVisible();
            await expect(await individuals.cardStockCheckbox).not.toBeVisible();
            await expect(await individuals.cardStockCheckboxIcon).not.toBeVisible();
        });

        await test.step('step-5: Toggle back stock checkbox', async () => {
            await editor.showStockCheckbox.click();
        });

        await test.step('step-6: Validate stock checkbox updated', async () => {
            await expect(await editor.showStockCheckbox).toBeChecked();
            await expect(await editor.showStockCheckbox).toBeVisible();
            await expect(await individuals.cardStockCheckbox).toBeVisible();
            await expect(await individuals.cardStockCheckboxIcon).toBeVisible();
        });
    });

    // @studio-plans-individuals-edit-quantity-selector - Validate edit quantity selector for plans individuals card in mas studio
    test(`${features[13].name},${features[13].tags}`, async ({ page, baseURL }) => {
        const { data } = features[13];
        const testPage = `${baseURL}${features[13].path}${miloLibs}${features[13].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'plans');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Toggle quantity selector', async () => {
            await expect(await editor.showQuantitySelector).toBeVisible();
            await expect(await editor.showQuantitySelector).toBeChecked();
            await expect(await individuals.cardQuantitySelector).toBeVisible();
            await editor.showQuantitySelector.click();
        });

        await test.step('step-4: Validate quantity selector updated', async () => {
            await expect(await editor.showQuantitySelector).not.toBeChecked();
            await expect(await editor.showQuantitySelector).toBeVisible();
            await expect(await individuals.cardQuantitySelector).not.toBeVisible();
        });

        await test.step('step-5: Toggle back quantity selector', async () => {
            await editor.showQuantitySelector.click();
        });

        await test.step('step-6: Validate quantity selector updated', async () => {
            await expect(await editor.showQuantitySelector).toBeChecked();
            await expect(await editor.showQuantitySelector).toBeVisible();
            await expect(await individuals.cardQuantitySelector).toBeVisible();
        });

        await test.step('step-7: Edit quantity selector start value', async () => {
            await expect(await editor.quantitySelectorStart).toBeVisible();
            await expect(await editor.quantitySelectorStart).toHaveValue(data.startValue);
            await editor.quantitySelectorStart.fill(data.newStartValue);
            await expect(await editor.quantitySelectorStart).toHaveValue(data.newStartValue);
        });

        await test.step('step-8: Edit quantity selector step value', async () => {
            await expect(await editor.quantitySelectorStep).toBeVisible();
            await expect(await editor.quantitySelectorStep).toHaveValue(data.stepValue);
            await editor.quantitySelectorStep.fill(data.newStepValue);
            await expect(await editor.quantitySelectorStep).toHaveValue(data.newStepValue);
        });

        await test.step('step-10: Validate quantity selector step value on card', async () => {
            await expect(await individuals.cardQuantitySelector).toHaveAttribute('step', data.newStepValue);
            await expect(await individuals.cardQuantitySelector).toHaveAttribute('min', data.newStartValue);
            // Test stepping through values
            await individuals.cardQuantitySelector.locator('button').click();
            await individuals.cardQuantitySelector.locator('button').press('ArrowDown');
            await individuals.cardQuantitySelector.locator('button').press('Enter');
            await expect(await individuals.cardQuantitySelector.locator('.text-field-input')).toHaveValue(
                String(Number(data.newStartValue) + Number(data.newStepValue)),
            );
        });
    });

    // @studio-plans-individuals-edit-whats-included - Validate edit whats included for plans individuals card in mas studio
    test(`${features[14].name},${features[14].tags}`, async ({ page, baseURL }) => {
        const { data } = features[14];
        const testPage = `${baseURL}${features[14].path}${miloLibs}${features[14].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'plans');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit whats included field', async () => {
            await expect(await editor.whatsIncludedLabel).toBeVisible();
            await expect(await editor.whatsIncludedLabel).toHaveValue('');
            await expect(await individuals.cardWhatsIncluded).not.toBeVisible();
            await editor.whatsIncludedLabel.fill(data.whatsIncludedText);
        });

        await test.step('step-4: Validate whats included field updated', async () => {
            await expect(await editor.whatsIncludedLabel).toHaveValue(data.whatsIncludedText);
            await expect(await individuals.cardWhatsIncluded).toBeVisible();
            await expect(await individuals.cardWhatsIncludedLabel).toHaveText(data.whatsIncludedText);
        });

        await test.step('step-5: Add icon to whats included', async () => {
            await expect(await editor.whatsIncludedAddIcon).toBeVisible();
            await editor.whatsIncludedAddIcon.click();

            await expect(await editor.whatsIncludedIconURL).toBeVisible();
            await expect(await editor.whatsIncludedIconLabel).toBeVisible();

            await editor.whatsIncludedIconURL.fill(data.iconURL);
            await editor.whatsIncludedIconLabel.fill(data.iconLabel);
        });

        await test.step('step-6: Validate icon added to whats included', async () => {
            await expect(await individuals.cardWhatsIncludedIcon).toBeVisible();
            await expect(await individuals.cardWhatsIncludedIcon).toHaveAttribute('src', data.iconURL);
            await expect(await individuals.cardWhatsIncludedIconLabel).toHaveText(data.iconLabel);
        });

        await test.step('step-7: Remove whats included label field', async () => {
            await editor.whatsIncludedLabel.fill('');
        });

        await test.step('step-8: Validate whats included label is removed', async () => {
            await expect(await editor.whatsIncludedLabel).toHaveValue('');
            await expect(await individuals.cardWhatsIncludedLabel).not.toBeVisible();
            await expect(await individuals.cardWhatsIncludedIcon).toBeVisible();
            await expect(await individuals.cardWhatsIncludedIconLabel).toBeVisible();
        });

        await test.step('step-9: Remove whats included icon', async () => {
            await expect(await editor.whatsIncludedIconRemoveButton).toBeVisible();
            await editor.whatsIncludedIconRemoveButton.click();
        });

        await test.step('step-10: Validate whats included field is removed', async () => {
            await expect(await editor.whatsIncludedLabel).toHaveValue('');
            await expect(await editor.whatsIncludedIconURL).not.toBeVisible();
            await expect(await editor.whatsIncludedIconLabel).not.toBeVisible();
            await expect(await individuals.cardWhatsIncluded).not.toBeVisible();
            await expect(await individuals.cardWhatsIncludedIcon).not.toBeVisible();
            await expect(await individuals.cardWhatsIncludedIconLabel).not.toBeVisible();
        });
    });

    // @studio-plans-individuals-edit-badge-color - Validate edit badge color for plans individuals card in mas studio
    test(`${features[15].name},${features[15].tags}`, async ({ page, baseURL }) => {
        const { data } = features[15];
        const testPage = `${baseURL}${features[15].path}${miloLibs}${features[15].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);
        const individualsCard = await studio.getCard(data.cardid);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(individualsCard).toBeVisible();
            await expect(individualsCard).toHaveAttribute('variant', 'plans');
            await individualsCard.dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit badge color field', async () => {
            await expect(await editor.badgeColor).toBeVisible();
            await expect(await editor.badgeColor).toContainText(data.color);
            await editor.badgeColor.click();
            await page.getByRole('option', { name: data.newColor, exact: true }).click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Validate badge color field updated', async () => {
            await expect(await editor.badgeColor).toContainText(data.newColor);
            expect(
                await webUtil.verifyCSS(individualsCard.locator(individuals.cardBadge), {
                    'background-color': data.newColorCSS,
                }),
            ).toBeTruthy();
        });
    });

    // @studio-plans-individuals-edit-badge-border-color - Validate edit badge border color for plans individuals card in mas studio
    test(`${features[16].name},${features[16].tags}`, async ({ page, baseURL }) => {
        const { data } = features[16];
        const testPage = `${baseURL}${features[16].path}${miloLibs}${features[16].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);
        const individualsCard = await studio.getCard(data.cardid);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(individualsCard).toBeVisible();
            await expect(individualsCard).toHaveAttribute('variant', 'plans');
            await individualsCard.dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit badge border color field', async () => {
            await expect(await editor.badgeBorderColor).toBeVisible();
            await expect(await editor.badgeBorderColor).toContainText(data.color);
            await editor.badgeBorderColor.click();
            await page.getByRole('option', { name: data.newColor, exact: true }).click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Validate badge border color field updated', async () => {
            await expect(await editor.badgeBorderColor).toContainText(data.newColor);
            expect(
                await webUtil.verifyCSS(individualsCard.locator(individuals.cardBadge), {
                    'border-left-color': data.newColorCSS,
                    'border-top-color': data.newColorCSS,
                    'border-bottom-color': data.newColorCSS,
                }),
            ).toBeTruthy();
        });
    });

    // @studio-plans-individuals-edit-card-border-color - Validate edit card border color for plans individuals card in mas studio
    test(`${features[17].name},${features[17].tags}`, async ({ page, baseURL }) => {
        const { data } = features[17];
        const testPage = `${baseURL}${features[17].path}${miloLibs}${features[17].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);
        const individualsCard = await studio.getCard(data.cardid);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(individualsCard).toBeVisible();
            await expect(individualsCard).toHaveAttribute('variant', 'plans');
            await individualsCard.dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit card border color field', async () => {
            await expect(await editor.cardBorderColor).toBeVisible();
            await expect(await editor.cardBorderColor).toContainText(data.color);
            await editor.cardBorderColor.click();
            await page.getByRole('option', { name: data.newColor, exact: true }).click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Validate card border color field updated', async () => {
            await expect(await editor.cardBorderColor).toContainText(data.newColor);
            expect(
                await webUtil.verifyCSS(individualsCard, {
                    'border-color': data.newColorCSS,
                }),
            ).toBeTruthy();
        });
    });

    // @studio-plans-individuals-edit-price-promo - Validate edit price promo for plans individuals card in mas studio
    test(`${features[18].name},${features[18].tags}`, async ({ page, baseURL }) => {
        const { data } = features[18];
        const testPage = `${baseURL}${features[18].path}${miloLibs}${features[18].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'plans');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit promo field', async () => {
            await expect(await editor.prices.locator(editor.regularPrice)).toHaveAttribute('data-promotion-code', data.promo);
            await expect(await individuals.cardPrice).toHaveAttribute('data-promotion-code', data.promo);
            await (await editor.prices.locator(editor.regularPrice)).dblclick();

            await expect(await ost.promoField).toBeVisible();
            await expect(await ost.promoLabel).toBeVisible();
            await expect(await ost.promoLabel).toContainText(data.promo);
            await expect(await ost.promoField).toHaveValue(data.promo);

            await ost.promoField.fill(data.newPromo);
            await expect(await ost.promoLabel).toContainText(data.newPromo);
            await expect(await ost.promoField).toHaveValue(data.newPromo);
            await ost.priceUse.click();
        });

        await test.step('step-4: Validate promo change in Editor panel', async () => {
            await expect(await editor.prices.locator(editor.regularPrice)).toHaveAttribute(
                'data-promotion-code',
                data.newPromo,
            );
        });

        await test.step('step-5: Validate edited price promo on the card', async () => {
            await expect(await individuals.cardPrice).toHaveAttribute('data-promotion-code', data.newPromo);
        });

        await test.step('step-6: Remove promo', async () => {
            await (await editor.prices.locator(editor.regularPrice)).dblclick();
            await expect(await ost.promoField).toBeVisible();
            await expect(await ost.promoLabel).toBeVisible();

            await ost.promoField.fill('');
            await expect(await ost.promoLabel).toContainText('no promo');
            await expect(await ost.promoField).toHaveValue('');
            await ost.priceUse.click();
        });

        await test.step('step-7: Validate promo removed in Editor panel', async () => {
            await expect(await editor.prices.locator(editor.regularPrice)).not.toHaveAttribute('data-promotion-code');
        });

        await test.step('step-8: Validate price promo removed from the card', async () => {
            await expect(await individuals.cardPrice).not.toHaveAttribute('data-promotion-code');
        });
    });

    // @studio-plans-individuals-phone-number - Validate phone number for plans individuals card in mas studio
    test(`${features[19].name},${features[19].tags}`, async ({ page, baseURL }) => {
        const { data } = features[19];
        const testPage = `${baseURL}${features[19].path}${miloLibs}${features[19].browserParams}${data.cardid}`;
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

        await test.step('step-3: Add phone link to the description', async () => {
            await expect(await editor.descriptionFieldGroup.locator(editor.linkEdit)).toBeVisible();
            await editor.descriptionFieldGroup.locator(editor.linkEdit).click();
            await expect(editor.phoneLinkTab).toBeVisible();
            await editor.phoneLinkTab.click();
            await expect(await editor.phoneLinkText).toBeVisible();
            await expect(await editor.linkSave).toBeVisible();
            await editor.phoneLinkText.fill(data.phoneNumber);
            await editor.linkSave.click();
        });

        await test.step('step-4: Validate phone link addition in Editor panel', async () => {
            await expect(await editor.description.locator(editor.phoneLink)).toHaveText(data.phoneNumber);
        });

        await test.step('step-5: Validate phone link addition on the card', async () => {
            await expect(await individuals.cardPhoneLink).toHaveText(data.phoneNumber);
        });
    });

    // @studio-plans-individuals-edit-cta-variant - Validate edit CTA variant for plans individuals card in mas studio
    test(`${features[20].name},${features[20].tags}`, async ({ page, baseURL }) => {
        const { data } = features[20];
        const testPage = `${baseURL}${features[20].path}${miloLibs}${features[20].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'plans');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit CTA variant', async () => {
            await expect(await editor.footer.locator(editor.linkEdit)).toBeVisible();
            await expect(await editor.CTA).toBeVisible();
            await expect(await editor.CTA).toHaveClass(data.variant);
            expect(await webUtil.verifyCSS(await individuals.cardCTA, data.ctaCSS)).toBeTruthy();
            await editor.CTA.click();
            await editor.footer.locator(editor.linkEdit).click();
            await expect(await editor.linkVariant).toBeVisible();
            await expect(await editor.linkSave).toBeVisible();
            await expect(await editor.getLinkVariant(data.newVariant)).toBeVisible();
            await (await editor.getLinkVariant(data.newVariant)).click();
            await editor.linkSave.click();
        });

        await test.step('step-4: Validate edited CTA variant in Editor panel', async () => {
            await expect(await editor.CTA).toHaveClass(data.newVariant);
            await expect(await editor.CTA).not.toHaveClass(data.variant);
        });

        await test.step('step-5: Validate edited CTA on the card', async () => {
            expect(await webUtil.verifyCSS(await individuals.cardCTA, data.newCtaCSS)).toBeTruthy();
            await expect(await individuals.cardCTA).toHaveAttribute('data-wcs-osi', data.osi);
            await expect(await individuals.cardCTA).toHaveAttribute('is', 'checkout-link');
        });
    });

    // @studio-plans-individuals-edit-cta-checkout-params - Validate edit CTA checkout params for plans individuals card in mas studio
    test(`${features[21].name},${features[21].tags}`, async ({ page, baseURL }) => {
        const { data } = features[21];
        const testPage = `${baseURL}${features[21].path}${miloLibs}${features[21].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'plans');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit CTA checkout params', async () => {
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
        });

        await test.step('step-4: Validate edited CTA on the card', async () => {
            await expect(await individuals.cardCTA).toHaveAttribute('data-wcs-osi', data.osi);
            await expect(await individuals.cardCTA).toHaveAttribute('is', 'checkout-link');
            const CTAhref = await individuals.cardCTA.getAttribute('href');
            let searchParams = new URLSearchParams(decodeURI(CTAhref).split('?')[1]);
            expect(searchParams.get('mv')).toBe(data.checkoutParams.mv);
            expect(searchParams.get('promoid')).toBe(data.checkoutParams.promoid);
            expect(searchParams.get('mv2')).toBe(data.checkoutParams.mv2);
        });
    });

    // @studio-plans-individuals-edit-cta-ost - Validate edit CTA for plans individuals card in mas studio
    test(`${features[22].name},${features[22].tags}`, async ({ page, baseURL }) => {
        const { data } = features[22];
        const testPage = `${baseURL}${features[22].path}${miloLibs}${features[22].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'plans');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit CTA in OST', async () => {
            await expect(await editor.footer).toBeVisible();
            await expect(await editor.footer).toContainText(data.ctaText);
            await expect(await individuals.cardCTA).toHaveAttribute('data-wcs-osi', data.osi);
            await expect(await individuals.cardCTA).toHaveAttribute('is', 'checkout-link');
            await expect(await individuals.cardCTA).toHaveAttribute('data-checkout-workflow-step', data.workflowStep);

            await (await editor.CTA).dblclick();
            await expect(await ost.checkoutTab).toBeVisible();
            await expect(await ost.workflowMenu).toBeVisible();
            await expect(await ost.ctaTextMenu).toBeEnabled();
            await expect(await ost.checkoutLink).toBeVisible();
            await expect(await ost.checkoutLinkUse).toBeVisible();
            await expect(await ost.checkoutLink).toHaveAttribute('data-checkout-workflow-step', data.workflowStep);
            await expect(async () => {
                await ost.ctaTextMenu.click();
                await expect(
                    page.locator('div[role="option"]', {
                        hasText: `${data.newCtaOption}`,
                    }),
                ).toBeVisible({
                    timeout: 500,
                });
            }).toPass();
            await page
                .locator('div[role="option"]', {
                    hasText: `${data.newCtaOption}`,
                })
                .click();
            await expect(async () => {
                await ost.workflowMenu.click();
                await expect(
                    page.locator('div[role="option"]', {
                        hasText: `${data.newWorkflowStep}`,
                    }),
                ).toBeVisible({
                    timeout: 500,
                });
            }).toPass();
            await page
                .locator('div[role="option"]', {
                    hasText: `${data.newWorkflowOption}`,
                })
                .click();
            await expect(await ost.checkoutLink).toHaveAttribute('data-checkout-workflow-step', data.newWorkflowStep);
            await ost.checkoutLinkUse.click();
        });

        await test.step('step-4: Validate edited CTA in Editor panel', async () => {
            await expect(await editor.footer).toContainText(data.newCtaText);
        });

        await test.step('step-5: Validate edited CTA on the card', async () => {
            await expect(await individuals.cardCTA).toContainText(data.newCtaText);
            await expect(await individuals.cardCTA).toHaveAttribute('data-wcs-osi', data.osi);
            await expect(await individuals.cardCTA).toHaveAttribute('is', 'checkout-link');
            await expect(await individuals.cardCTA).toHaveAttribute('data-checkout-workflow-step', data.newWorkflowStep);

            const CTAhref = await individuals.cardCTA.getAttribute('href');
            let workflowStep = decodeURI(CTAhref).split('?')[0];
            let searchParams = new URLSearchParams(decodeURI(CTAhref).split('?')[1]);

            expect(workflowStep).toContain(data.newUcv3);
            expect(searchParams.get('co')).toBe(data.country);
            expect(searchParams.get('ctx')).toBe(data.ctx);
            expect(searchParams.get('lang')).toBe(data.lang);
            expect(searchParams.get('cli')).toBe(data.client);
            expect(searchParams.get('apc')).toBe(data.promo);
        });
    });

    // @studio-plans-individuals-edit-cta-label - Validate edit CTA label for plans individuals card in mas studio
    test(`${features[23].name},${features[23].tags}`, async ({ page, baseURL }) => {
        const { data } = features[23];
        const testPage = `${baseURL}${features[23].path}${miloLibs}${features[23].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'plans');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit CTA label', async () => {
            await expect(await editor.footer.locator(editor.linkEdit)).toBeVisible();
            await expect(await editor.CTA).toBeVisible();
            await expect(await editor.footer).toContainText(data.ctaText);
            await editor.CTA.click();
            await editor.footer.locator(editor.linkEdit).click();
            await expect(await editor.linkText).toBeVisible();
            await expect(await editor.linkSave).toBeVisible();
            await expect(await editor.linkText).toHaveValue(data.ctaText);
            await editor.linkText.fill(data.newCtaText);
            await editor.linkSave.click();
        });

        await test.step('step-4: Validate edited CTA label in Editor panel', async () => {
            await expect(await editor.footer).toContainText(data.newCtaText);
        });

        await test.step('step-5: Validate edited CTA on the card', async () => {
            await expect(await individuals.cardCTA).toContainText(data.newCtaText);
            await expect(await individuals.cardCTA).toHaveAttribute('data-wcs-osi', data.osi);
            await expect(await individuals.cardCTA).toHaveAttribute('is', 'checkout-link');
        });
    });

    // @studio-plans-individuals-edit-cta-promo - Validate edit cta promo for plans individuals card in mas studio
    test(`${features[24].name},${features[24].tags}`, async ({ page, baseURL }) => {
        const { data } = features[24];
        const testPage = `${baseURL}${features[24].path}${miloLibs}${features[24].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'plans');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit CTA promo field', async () => {
            await expect(await editor.CTA).toHaveAttribute('data-promotion-code', data.promo);
            await expect(await individuals.cardCTA).toHaveAttribute('data-promotion-code', data.promo);

            const CTAhref = await individuals.cardCTA.getAttribute('href');
            let workflowStep = decodeURI(CTAhref).split('?')[0];
            let searchParams = new URLSearchParams(decodeURI(CTAhref).split('?')[1]);

            expect(workflowStep).toContain(data.ucv3);
            expect(searchParams.get('co')).toBe(data.country);
            expect(searchParams.get('ctx')).toBe(data.ctx);
            expect(searchParams.get('lang')).toBe(data.lang);
            expect(searchParams.get('cli')).toBe(data.client);
            expect(searchParams.get('apc')).toBe(data.promo);

            await (await editor.CTA).dblclick();
            await expect(await ost.checkoutTab).toBeVisible();
            await expect(await ost.promoField).toBeVisible();
            await expect(await ost.promoLabel).toBeVisible();
            await expect(await ost.promoLabel).toContainText(data.promo);
            await expect(await ost.promoField).toHaveValue(data.promo);

            await ost.promoField.fill(data.newPromo);
            expect(await ost.promoLabel).toContainText(data.newPromo);
            await expect(await ost.promoField).toHaveValue(data.newPromo);
            await ost.checkoutLinkUse.click();
        });

        await test.step('step-4: Validate edited CTA promo in Editor panel', async () => {
            await expect(await editor.CTA).toHaveAttribute('data-promotion-code', data.newPromo);
        });

        await test.step('step-5: Validate edited CTA promo on the card', async () => {
            const newCTA = await individuals.cardCTA;
            await expect(newCTA).toHaveAttribute('data-promotion-code', data.newPromo);
            await expect(newCTA).toHaveAttribute('href', new RegExp(`${data.ucv3}`));
            await expect(newCTA).toHaveAttribute('href', new RegExp(`co=${data.country}`));
            await expect(newCTA).toHaveAttribute('href', new RegExp(`ctx=${data.ctx}`));
            await expect(newCTA).toHaveAttribute('href', new RegExp(`lang=${data.lang}`));
            await expect(newCTA).toHaveAttribute('href', new RegExp(`cli=${data.client}`));
            await expect(newCTA).toHaveAttribute('href', new RegExp(`apc=${data.newPromo}`));
        });

        await test.step('step-6: Remove promo', async () => {
            await (await editor.CTA).dblclick();
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
            await expect(await individuals.cardCTA).not.toHaveAttribute('data-promotion-code');
            await expect(await individuals.cardCTA).not.toHaveAttribute('href', /apc=/);
        });
    });

    // @studio-plans-individuals-add-description-price-legal-disclamer - Validate adding legal disclamer in description for plans individuals card in mas studio
    test(`${features[25].name},${features[25].tags}`, async ({ page, baseURL }) => {
        const { data } = features[25];
        const testPage = `${baseURL}${features[25].path}${miloLibs}${features[25].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'plans');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit description field', async () => {
            await expect(await editor.description).toBeVisible();
            await expect(await editor.description).not.toContainText(data.legalDisclaimer);
            await editor.descriptionFieldGroup.locator(editor.OSTButton).click();
            await ost.backButton.click();
            await page.waitForTimeout(2000);
            await expect(await ost.searchField).toBeVisible();
            await ost.searchField.fill(data.newosi);
            await (await ost.nextButton).click();
            await ost.legalDisclaimer.scrollIntoViewIfNeeded();
            await expect(await ost.legalDisclaimer).not.toContainText(data.cardLegalDisclaimer);
            await expect(await ost.unitCheckbox).toBeVisible();
            await ost.unitCheckbox.click();
            await expect(await ost.legalDisclaimer).toContainText(data.cardLegalDisclaimer);
            await expect(await ost.legalDisclaimerUse).toBeVisible();
            await ost.legalDisclaimerUse.click();
            await page.waitForTimeout(5000);
        });

        await test.step('step-4: Validate description field updated', async () => {
            await expect(await editor.description).toContainText(data.legalDisclaimer);
            await expect(await individuals.cardDescription).toContainText(data.cardLegalDisclaimer);
        });
    });
});
