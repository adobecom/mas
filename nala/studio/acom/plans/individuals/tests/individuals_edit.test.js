import { expect, test } from '@playwright/test';
import StudioPage from '../../../../studio.page.js';
import EditorPage from '../../../../editor.page.js';
import ACOMPlansIndividualsSpec from '../specs/individuals_edit.spec.js';
import ACOMPlansIndividualsPage from '../individuals.page.js';
import AHTryBuyWidgetPage from '../../../../ahome/try-buy-widget/try-buy-widget.page.js';
import CCDSlicePage from '../../../../ccd/slice/slice.page.js';
import CCDSuggestedPage from '../../../../ccd/suggested/suggested.page.js';
import OSTPage from '../../../../ost.page.js';
import WebUtil from '../../../../../libs/webutil.js';

const { features } = ACOMPlansIndividualsSpec;
const miloLibs = process.env.MILO_LIBS || '';

let studio;
let editor;
let individuals;
let ost;
let webUtil;
let suggested;
let slice;
let trybuywidget;

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
    webUtil = new WebUtil(page);
    suggested = new CCDSuggestedPage(page);
    slice = new CCDSlicePage(page);
    trybuywidget = new AHTryBuyWidgetPage(page);
});

test.describe('M@S Studio ACOM Plans Individuals card test suite', () => {
    // @studio-plans-individuals-edit-variant-change-to-suggested - Validate variant change for plans individuals card to suggested in mas studio
    test(`${features[0].name},${features[0].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(
                await studio.getCard(data.cardid, 'plans'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'plans')).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Change variant', async () => {
            await expect(await editor.variant).toBeVisible();
            await expect(await editor.variant).toHaveAttribute(
                'default-value',
                'plans',
            );
            await editor.variant.locator('sp-picker').first().click();
            await page.getByRole('option', { name: 'suggested' }).click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Validate editor fields rendering after variant change', async () => {
            await expect(await editor.variant).toHaveAttribute(
                'default-value',
                'ccd-suggested',
            );
            await expect(await editor.size).not.toBeVisible();
            await expect(await editor.title).toBeVisible();
            await expect(await editor.subtitle).toBeVisible();
            await expect(await editor.badge).toBeVisible();
            await expect(await editor.description).toBeVisible();
            await expect(await editor.iconURL).toBeVisible();
            await expect(await editor.backgroundImage).toBeVisible();
            await expect(await editor.prices).toBeVisible();
            await expect(await editor.footer).toBeVisible();
            await expect(await editor.whatsIncluded).not.toBeVisible();
            await expect(await editor.promoText).not.toBeVisible();
            await expect(await editor.callout).not.toBeVisible();
            await expect(await editor.showStockCheckbox).not.toBeVisible();
            await expect(await editor.showQuantitySelector).not.toBeVisible();
            await expect(await editor.OSI).toBeVisible();
        });

        await test.step('step-5: Validate new variant of the card', async () => {
            await expect(
                await studio.getCard(data.cardid, 'plans'),
            ).not.toBeVisible();
            await expect(
                await studio.getCard(data.cardid, 'suggested'),
            ).toBeVisible();
            await expect(await suggested.cardTitle).toBeVisible();
            await expect(await suggested.cardDescription).toBeVisible();
            await expect(await suggested.cardPrice).toBeVisible();
            await expect(await suggested.cardIcon).toBeVisible();
            await expect(await individuals.cardWhatsIncluded).not.toBeVisible();
            await expect(await individuals.cardPromoText).not.toBeVisible();
            await expect(await individuals.cardCallout).not.toBeVisible();
            await expect(await individuals.cardStockCheckbox).not.toBeVisible();
            await expect(
                await individuals.cardQuantitySelector,
            ).not.toBeVisible();
            await expect(
                await individuals.cardSecureTransaction,
            ).not.toBeVisible();
        });
    });
    // @studio-plans-individuals-edit-variant-change-to-slice - Validate variant change for plans individuals card to slice in mas studio
    test(`${features[1].name},${features[1].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(
                await studio.getCard(data.cardid, 'plans'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'plans')).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Change variant', async () => {
            await expect(await editor.variant).toBeVisible();
            await expect(await editor.variant).toHaveAttribute(
                'default-value',
                'plans',
            );
            await editor.variant.locator('sp-picker').first().click();
            await page.getByRole('option', { name: 'slice' }).click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Validate editor fields rendering after variant change', async () => {
            await expect(await editor.variant).toHaveAttribute(
                'default-value',
                'ccd-slice',
            );
            await expect(await editor.size).toBeVisible();
            await expect(await editor.title).not.toBeVisible();
            await expect(await editor.subtitle).not.toBeVisible();
            await expect(await editor.badge).toBeVisible();
            await expect(await editor.description).toBeVisible();
            await expect(await editor.iconURL).toBeVisible();
            await expect(await editor.backgroundImage).toBeVisible();
            await expect(await editor.prices).not.toBeVisible();
            await expect(await editor.footer).toBeVisible();
            await expect(await editor.whatsIncluded).not.toBeVisible();
            await expect(await editor.promoText).not.toBeVisible();
            await expect(await editor.callout).not.toBeVisible();
            await expect(await editor.showStockCheckbox).not.toBeVisible();
            await expect(await editor.showQuantitySelector).not.toBeVisible();
            await expect(await editor.OSI).toBeVisible();
        });

        await test.step('step-5: Validate new variant of the card', async () => {
            await expect(
                await studio.getCard(data.cardid, 'plans'),
            ).not.toBeVisible();
            await expect(
                await studio.getCard(data.cardid, 'slice'),
            ).toBeVisible();

            await expect(await individuals.cardTitle).not.toBeVisible();
            await expect(await slice.cardDescription).toBeVisible();
            await expect(await slice.cardPrice).not.toBeVisible();
            await expect(await slice.cardIcon).toBeVisible();
            await expect(await individuals.cardWhatsIncluded).not.toBeVisible();
            await expect(await individuals.cardPromoText).not.toBeVisible();
            await expect(await individuals.cardCallout).not.toBeVisible();
            await expect(await individuals.cardStockCheckbox).not.toBeVisible();
            await expect(
                await individuals.cardQuantitySelector,
            ).not.toBeVisible();
            await expect(
                await individuals.cardSecureTransaction,
            ).not.toBeVisible();
        });
    });

    // @studio-plans-individuals-edit-variant-change-to-trybuywidget - Validate variant change for plans individuals card to try-buy-widget in mas studio
    test(`${features[2].name},${features[2].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[2];
        const testPage = `${baseURL}${features[2].path}${miloLibs}${features[2].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(
                await studio.getCard(data.cardid, 'plans'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'plans')).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Change variant', async () => {
            await expect(await editor.variant).toBeVisible();
            await expect(await editor.variant).toHaveAttribute(
                'default-value',
                'plans',
            );
            await editor.variant.locator('sp-picker').first().click();
            await page.getByRole('option', { name: 'try buy widget' }).click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Validate editor fields rendering after variant change', async () => {
            await expect(await editor.variant).toHaveAttribute(
                'default-value',
                'ah-try-buy-widget',
            );
            await expect(await editor.size).toBeVisible();
            await expect(await editor.title).toBeVisible();
            await expect(await editor.subtitle).not.toBeVisible();
            await expect(await editor.badge).not.toBeVisible();
            await expect(await editor.description).toBeVisible();
            await expect(await editor.iconURL).toBeVisible();
            await expect(await editor.backgroundImage).toBeVisible();
            await expect(await editor.borderColor).toBeVisible();
            await expect(await editor.backgroundColor).toBeVisible();
            await expect(await editor.prices).toBeVisible();
            await expect(await editor.footer).toBeVisible();
            await expect(await editor.whatsIncluded).not.toBeVisible();
            await expect(await editor.promoText).not.toBeVisible();
            await expect(await editor.callout).not.toBeVisible();
            await expect(await editor.showStockCheckbox).not.toBeVisible();
            await expect(await editor.showQuantitySelector).not.toBeVisible();
            await expect(await editor.OSI).toBeVisible();
        });

        await test.step('step-5: Validate new variant of the card', async () => {
            await expect(
                await studio.getCard(data.cardid, 'plans'),
            ).not.toBeVisible();
            await expect(
                await studio.getCard(data.cardid, 'ahtrybuywidget'),
            ).toBeVisible();
            await expect(await trybuywidget.cardTitle).toBeVisible();
            await expect(await trybuywidget.cardDescription).toBeVisible();
            await expect(await trybuywidget.cardPrice).toBeVisible();
            await expect(await trybuywidget.cardIcon).toBeVisible();
            await expect(await individuals.cardWhatsIncluded).not.toBeVisible();
            await expect(await individuals.cardPromoText).not.toBeVisible();
            await expect(await individuals.cardCallout).not.toBeVisible();
            await expect(await individuals.cardStockCheckbox).not.toBeVisible();
            await expect(
                await individuals.cardQuantitySelector,
            ).not.toBeVisible();
            await expect(
                await individuals.cardSecureTransaction,
            ).not.toBeVisible();
        });
    });

    // @studio-plans-individuals-edit-size - Validate edit size for plans individuals card in mas studio
    test(`${features[3].name},${features[3].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[3];
        const testPage = `${baseURL}${features[3].path}${miloLibs}${features[3].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(
                await studio.getCard(data.cardid, 'plans'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'plans')).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit size field', async () => {
            await expect(await editor.size).toBeVisible();
            await expect(await editor.size).toHaveAttribute('value', 'Default');
            await editor.size.click();
            await page
                .getByRole('option', { name: 'Wide', exact: true })
                .click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Validate new size of the card', async () => {
            await expect(
                await studio.getCard(data.cardid, 'plans'),
            ).toHaveAttribute('size', 'wide');
        });

        await test.step('step-5: Edit size field to super-wide', async () => {
            await editor.size.click();
            await page
                .getByRole('option', { name: 'Super Wide', exact: true })
                .click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-6: Validate new size of the card', async () => {
            await expect(
                await studio.getCard(data.cardid, 'plans'),
            ).toHaveAttribute('size', 'super-wide');
        });
    });

    // @studio-plans-individuals-edit-title - Validate edit title for plans individuals card in mas studio
    test(`${features[4].name},${features[4].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[4];
        const testPage = `${baseURL}${features[4].path}${miloLibs}${features[4].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(
                await studio.getCard(data.cardid, 'plans'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'plans')).dblclick();
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
    test(`${features[5].name},${features[5].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[5];
        const testPage = `${baseURL}${features[5].path}${miloLibs}${features[5].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(
                await studio.getCard(data.cardid, 'plans'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'plans')).dblclick();
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
    test(`${features[6].name},${features[6].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[6];
        const testPage = `${baseURL}${features[6].path}${miloLibs}${features[6].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(
                await studio.getCard(data.cardid, 'plans'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'plans')).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit description field', async () => {
            await expect(await editor.description).toBeVisible();
            await expect(await editor.description).toContainText(
                data.description,
            );
            await editor.description.fill(data.newDescription);
        });

        await test.step('step-4: Validate description field updated', async () => {
            await expect(await editor.description).toContainText(
                data.newDescription,
            );
            await expect(await individuals.cardDescription).toContainText(
                data.newDescription,
            );
        });
    });

    // @studio-plans-individuals-edit-mnemonic - Validate edit mnemonic for plans individuals card in mas studio
    test(`${features[7].name},${features[7].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[7];
        const testPage = `${baseURL}${features[7].path}${miloLibs}${features[7].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(
                await studio.getCard(data.cardid, 'plans'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'plans')).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit mnemonic URL field', async () => {
            await expect(await editor.iconURL).toBeVisible();
            await expect(await editor.iconURL).toHaveValue(data.iconURL);
            await editor.iconURL.fill(data.newIconURL);
        });

        await test.step('step-4: Validate mnemonic URL field updated', async () => {
            await expect(await editor.iconURL).toHaveValue(data.newIconURL);
            await expect(await individuals.cardIcon).toHaveAttribute(
                'src',
                data.newIconURL,
            );
        });
    });

    // @studio-plans-individuals-edit-callout - Validate edit callout for plans individuals card in mas studio
    test(`${features[8].name},${features[8].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[8];
        const testPage = `${baseURL}${features[8].path}${miloLibs}${features[8].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(
                await studio.getCard(data.cardid, 'plans'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'plans')).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Remove callout field', async () => {
            await expect(await editor.calloutRTE).toBeVisible();
            await expect(await editor.calloutRTE).toContainText(
                data.calloutText,
            );
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
            await expect(await editor.calloutRTE).toContainText(
                data.newCalloutText,
            );
            await expect(await individuals.cardCallout).toContainText(
                data.newCalloutText,
            );
        });
    });

    // @studio-plans-individuals-edit-promo-text - Validate edit promo text for plans individuals card in mas studio
    test(`${features[9].name},${features[9].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[9];
        const testPage = `${baseURL}${features[9].path}${miloLibs}${features[9].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(
                await studio.getCard(data.cardid, 'plans'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'plans')).dblclick();
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
            await expect(await individuals.cardPromoText).toHaveText(
                data.newPromoText,
            );
        });
    });

    // @studio-plans-individuals-edit-price - Validate edit price for plans individuals card in mas studio
    test(`${features[10].name},${features[10].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[10];
        const testPage = `${baseURL}${features[10].path}${miloLibs}${features[10].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(
                await studio.getCard(data.cardid, 'plans'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'plans')).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit price field', async () => {
            await expect(await editor.prices).toBeVisible();
            await expect(await editor.prices).toContainText(data.price);
            await expect(await editor.prices).not.toContainText(data.newPrice);
            await expect(await editor.prices).toContainText(
                data.strikethroughPrice,
            );
            await expect(await editor.prices).not.toContainText(
                data.newStrikethroughPrice,
            );

            await (await editor.prices.locator(editor.regularPrice)).dblclick();
            await expect(await ost.price).toBeVisible();
            await expect(await ost.priceUse).toBeVisible();
            await expect(await ost.unitCheckbox).toBeVisible();
            await ost.unitCheckbox.click();
            await ost.priceUse.click();
        });

        await test.step('step-4: Validate edited price in Editor panel', async () => {
            await expect(await editor.prices).toContainText(data.newPrice);
            await expect(await editor.prices).toContainText(
                data.newStrikethroughPrice,
            );
        });

        await test.step('step-5: Validate edited price field on the card', async () => {
            await expect(await individuals.cardPrice).toContainText(
                data.newPrice,
            );
            await expect(await individuals.cardPrice).toContainText(
                data.newStrikethroughPrice,
            );
        });
    });

    // @studio-plans-individuals-edit-osi - Validate edit OSI for plans individuals card in mas studio
    test(`${features[11].name},${features[11].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[11];
        const testPage = `${baseURL}${features[11].path}${miloLibs}${features[11].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(
                await studio.getCard(data.cardid, 'plans'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'plans')).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Change OSI in OST', async () => {
            await expect(await editor.OSI).toBeVisible();
            await expect(await editor.OSI).toContainText(data.osi);
            await expect(await editor.tags).toBeVisible();
            await expect(await editor.tags).toHaveAttribute(
                'value',
                new RegExp(`${data.offerTypeTag}`),
            );
            await expect(await editor.tags).toHaveAttribute(
                'value',
                new RegExp(`${data.marketSegmentsTag}`),
            );
            await expect(await editor.tags).toHaveAttribute(
                'value',
                new RegExp(`${data.planTypeTag}`),
            );
            await editor.OSIButton.click();
            await expect(await ost.searchField).toBeVisible();
            await ost.searchField.fill(data.newosi);
            await (await ost.nextButton).click();
            await expect(await ost.priceUse).toBeVisible();
            await ost.priceUse.click();
        });

        await test.step('step-4: Validate edited OSI and tags in Editor panel', async () => {
            await expect(await editor.OSI).toContainText(data.newosi);
            await expect(await editor.tags).toHaveAttribute(
                'value',
                new RegExp(`${data.newPlanTypeTag}`),
            );
            await expect(await editor.tags).toHaveAttribute(
                'value',
                new RegExp(`${data.newOfferTypeTag}`),
            );
            await expect(await editor.tags).toHaveAttribute(
                'value',
                new RegExp(`${data.newMarketSegmentsTag}`),
            );
            await expect(await editor.tags).not.toHaveAttribute(
                'value',
                new RegExp(`${data.offerTypeTag}`),
            );
            await expect(await editor.tags).not.toHaveAttribute(
                'value',
                new RegExp(`${data.marketSegmentsTag}`),
            );
            await expect(await editor.tags).not.toHaveAttribute(
                'value',
                new RegExp(`${data.planTypeTag}`),
            );
        });
    });

    // @studio-plans-individuals-edit-stock-checkbox - Validate edit stock checkbox for plans individuals card in mas studio
    test(`${features[12].name},${features[12].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[12];
        const testPage = `${baseURL}${features[12].path}${miloLibs}${features[12].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(
                await studio.getCard(data.cardid, 'plans'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'plans')).dblclick();
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
            await expect(
                await individuals.cardStockCheckboxIcon,
            ).not.toBeVisible();
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
    test(`${features[13].name},${features[13].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[13];
        const testPage = `${baseURL}${features[13].path}${miloLibs}${features[13].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(
                await studio.getCard(data.cardid, 'plans'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'plans')).dblclick();
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
            await expect(
                await individuals.cardQuantitySelector,
            ).not.toBeVisible();
        });

        await test.step('step-5: Toggle back quantity selector', async () => {
            await editor.showQuantitySelector.click();
        });

        await test.step('step-6: Validate quantity selector updated', async () => {
            await expect(await editor.showQuantitySelector).toBeChecked();
            await expect(await editor.showQuantitySelector).toBeVisible();
            await expect(await individuals.cardQuantitySelector).toBeVisible();
        });

        // add editign steps for quantity selector
    });

    // @studio-plans-individuals-edit-whats-included - Validate edit whats included for plans individuals card in mas studio
    test(`${features[14].name},${features[14].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[14];
        const testPage = `${baseURL}${features[14].path}${miloLibs}${features[14].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(
                await studio.getCard(data.cardid, 'plans'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'plans')).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit whats included field', async () => {
            await expect(await editor.whatsIncluded).toBeVisible();
            await expect(await editor.whatsIncluded).toHaveValue('');
            await expect(await individuals.cardWhatsIncluded).not.toBeVisible();
            await editor.whatsIncluded.fill(data.whatsIncludedText);
        });

        await test.step('step-4: Validate whats included field updated', async () => {
            await expect(await editor.whatsIncluded).toHaveValue(
                data.whatsIncludedText,
            );
            await expect(await individuals.cardWhatsIncluded).toBeVisible();
        });

        await test.step('step-5: Remove whats included field', async () => {
            await editor.whatsIncluded.fill('');
        });

        await test.step('step-6: Validate whats included field is removed', async () => {
            await expect(await editor.whatsIncluded).toHaveValue('');
            await expect(await individuals.cardWhatsIncluded).not.toBeVisible();
        });
    });
});
