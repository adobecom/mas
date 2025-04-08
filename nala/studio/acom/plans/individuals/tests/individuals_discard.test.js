import { expect, test } from '@playwright/test';
import StudioPage from '../../../../studio.page.js';
import EditorPage from '../../../../editor.page.js';
import ACOMPlansIndividualsSpec from '../specs/individuals_discard.spec.js';
import ACOMPlansIndividualsPage from '../individuals.page.js';
import OSTPage from '../../../../ost.page.js';
import WebUtil from '../../../../../libs/webutil.js';

const { features } = ACOMPlansIndividualsSpec;
const miloLibs = process.env.MILO_LIBS || '';

let studio;
let editor;
let individuals;
let ost;
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
    webUtil = new WebUtil(page);
});

test.describe('M@S Studio ACOM Plans Individuals card test suite', () => {
    // @studio-plans-individuals-discard-edit-variant-change - Validate variant change for plans individuals card in mas studio
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
            await expect(
                await studio.getCard(data.cardid, 'plans'),
            ).not.toBeVisible();
            await expect(
                await studio.getCard(data.cardid, 'suggested'),
            ).toBeVisible();
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await editor.closeEditor.click();
            await expect(await studio.confirmationDialog).toBeVisible();
            await studio.discardDialog.click();
            await expect(await editor.panel).not.toBeVisible();
        });

        await test.step('step-5: Verify there is no changes of the card', async () => {
            await expect(
                await studio.getCard(data.cardid, 'plans'),
            ).toBeVisible();
            await expect(
                await studio.getCard(data.cardid, 'suggested'),
            ).not.toBeVisible();
            await (await studio.getCard(data.cardid, 'plans')).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await editor.variant).toHaveAttribute(
                'default-value',
                'plans',
            );
        });
    });

    // @studio-plans-individuals-discard-edit-size - Validate discard edit size for plans individuals card in mas studio
    test(`${features[1].name},${features[1].tags}`, async ({
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

        await test.step('step-3: Edit size field', async () => {
            await expect(await editor.size).toBeVisible();
            await expect(await editor.size).toHaveAttribute('value', 'Default');
            await editor.size.click();
            await page.getByRole('option', { name: 'Wide', exact: true}).click();
            await page.waitForTimeout(2000);
            await expect(
                await studio.getCard(data.cardid, 'plans'),
            ).toHaveAttribute('size', 'wide');
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await editor.closeEditor.click();
            await expect(await studio.confirmationDialog).toBeVisible();
            await studio.discardDialog.click();
            await expect(await editor.panel).not.toBeVisible();
        });

        await test.step('step-5: Verify there is no changes of the card', async () => {
            await expect(
                await studio.getCard(data.cardid, 'plans'),
            ).toBeVisible();
            await expect(
                await studio.getCard(data.cardid, 'plans'),
            ).not.toHaveAttribute('size', 'wide');
            await (await studio.getCard(data.cardid, 'plans')).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await editor.size).toHaveAttribute('value', 'Default');
        });
    });

    // @studio-plans-individuals-discard-edit-title - Validate discard title for plans individuals card in mas studio
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

        await test.step('step-3: Edit title field', async () => {
            await expect(await editor.title).toBeVisible();
            await expect(await editor.title).toHaveValue(data.title);
            await editor.title.fill(data.newTitle);
            await expect(await editor.title).toHaveValue(data.newTitle);
            await expect(await individuals.cardTitle).toHaveText(data.newTitle);
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await editor.closeEditor.click();
            await expect(await studio.confirmationDialog).toBeVisible();
            await studio.discardDialog.click();
            await expect(await editor.panel).not.toBeVisible();

        });

        await test.step('step-5: Validate title field not updated', async () => {
            await expect(await individuals.cardTitle).toHaveText(data.title);
            await (await studio.getCard(data.cardid, 'plans')).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await editor.title).toHaveValue(data.title);
        });
    });

    // @studio-plans-individuals-discard-edit-badge - Validate discard badge for plans individuals card in mas studio
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

        await test.step('step-3: Enter new value in the badge field', async () => {
            await expect(await editor.badge).toBeVisible();
            await expect(await editor.badge).toHaveValue(data.badge);
            await editor.badge.fill(data.newBadge);
            await expect(await editor.badge).toHaveValue(data.newBadge);
            await expect(await individuals.cardBadge).toHaveText(data.newBadge);
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await editor.closeEditor.click();
            await expect(await studio.confirmationDialog).toBeVisible();
            await studio.discardDialog.click();
            await expect(await editor.panel).not.toBeVisible();
        });

        await test.step('step-5: Verify there is no changes of the card', async () => {
            await expect(await individuals.cardBadge).toHaveText(data.badge);
            await (await studio.getCard(data.cardid, 'plans')).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await editor.badge).toHaveValue(data.badge);
        });
    });

    // @studio-plans-individuals-discard-edit-description - Validate discard description for plans individuals card in mas studio
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

        await test.step('step-3: Edit description field', async () => {
            await expect(await editor.description).toBeVisible();
            await expect(await editor.description).toContainText(
                data.description,
            );
            await editor.description.fill(data.newDescription);
            await expect(await editor.description).toContainText(data.newDescription);
            await expect(await individuals.cardDescription).toContainText(data.newDescription);
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await editor.closeEditor.click();
            await expect(await studio.confirmationDialog).toBeVisible();
            await studio.discardDialog.click();
            await expect(await editor.panel).not.toBeVisible();
        });

        await test.step('step-5: Validate description field not updated', async () => {
            await expect(await individuals.cardDescription).toContainText(
                data.description,
            );
            await (await studio.getCard(data.cardid, 'plans')).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await editor.description).toContainText(data.description);
        });
    });

    // @studio-plans-individuals-discard-edit-mnemonic - Validate discard mnemonic for plans individuals card in mas studio
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

        await test.step('step-3: Edit mnemonic URL field', async () => {
            await expect(await editor.iconURL).toBeVisible();
            await expect(await editor.iconURL).toHaveValue(data.iconURL);
            await editor.iconURL.fill(data.newIconURL);
            await expect(await editor.iconURL).toHaveValue(data.newIconURL);
            await expect(await individuals.cardIcon).toHaveAttribute(
                'src',
                data.newIconURL,
            );
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await editor.closeEditor.click();
            await expect(await studio.confirmationDialog).toBeVisible();
            await studio.discardDialog.click();
            await expect(await editor.panel).not.toBeVisible();
        });

        await test.step('step-5: Validate mnemonic field not updated', async () => {
            await expect(await individuals.cardIcon).toHaveAttribute(
                'src',
                data.iconURL,
            );
            await (await studio.getCard(data.cardid, 'plans')).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await editor.iconURL).toHaveValue(data.iconURL);
        });
    });

    // @studio-plans-individuals-discard-edit-callout - Validate discard callout for plans individuals card in mas studio
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

        await test.step('step-3: Edit callout field', async () => {
            await expect(await editor.calloutRTE).toBeVisible();
            await expect(await editor.calloutRTE).toContainText(data.calloutText);
            await editor.calloutRTE.fill(data.newCalloutText);
            await expect(await editor.calloutRTE).toContainText(data.newCalloutText);
            await expect(await individuals.cardCallout).toContainText(data.newCalloutText);
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await editor.closeEditor.click();
            await expect(await studio.confirmationDialog).toBeVisible();
            await studio.discardDialog.click();
            await expect(await editor.panel).not.toBeVisible();
        });

        await test.step('step-5: Validate callout field not updated', async () => {
            await expect(await individuals.cardCallout).toContainText(data.calloutText);
            await (await studio.getCard(data.cardid, 'plans')).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await editor.calloutRTE).toContainText(data.calloutText);
        });
    });

    // @studio-plans-individuals-discard-edit-promo-text - Validate discard promo text for plans individuals card in mas studio
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

        await test.step('step-3: Edit promo text field', async () => {
            await expect(await editor.promoText).toBeVisible();
            await expect(await editor.promoText).toHaveValue(data.promoText);
            await editor.promoText.fill(data.newPromoText);
            await expect(await editor.promoText).toHaveValue(data.newPromoText);
            await expect(await individuals.cardPromoText).toHaveText(data.newPromoText);
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await editor.closeEditor.click();
            await expect(await studio.confirmationDialog).toBeVisible();
            await studio.discardDialog.click();
            await expect(await editor.panel).not.toBeVisible();
        });

        await test.step('step-5: Validate promo text field not updated', async () => {
            await expect(await individuals.cardPromoText).toHaveText(data.promoText);
            await (await studio.getCard(data.cardid, 'plans')).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await editor.promoText).toHaveValue(data.promoText);
        });
    });

    // @studio-plans-individuals-discard-edit-price - Validate discard price for plans individuals card in mas studio
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

        await test.step('step-3: Edit price field', async () => {
            await expect(await editor.prices).toBeVisible();
            await expect(await editor.prices).toContainText(data.price);
            await expect(await editor.prices).not.toContainText(data.newPrice);
            await expect(await editor.prices).toContainText(data.strikethroughPrice);
            await expect(await editor.prices).not.toContainText(data.newStrikethroughPrice);

            await (await editor.prices.locator(editor.regularPrice)).dblclick();
            await expect(await ost.price).toBeVisible();
            await expect(await ost.priceUse).toBeVisible();
            await expect(await ost.unitCheckbox).toBeVisible();
            await ost.unitCheckbox.click();
            await ost.priceUse.click();
        });

        await test.step('step-4: Validate edited price in Editor panel', async () => {
            await expect(await editor.prices).toContainText(data.newPrice);
            await expect(await editor.prices).toContainText(data.newStrikethroughPrice);
        });

        await test.step('step-5: Validate edited price field on the card', async () => {
            await expect(await individuals.cardPrice).toContainText(data.newPrice);
            await expect(await individuals.cardPrice).toContainText(data.newStrikethroughPrice);
        });

        await test.step('step-6: Close the editor and verify discard is triggered', async () => {
            await editor.closeEditor.click();
            await expect(await studio.confirmationDialog).toBeVisible();
            await studio.discardDialog.click();
            await expect(await editor.panel).not.toBeVisible();
        });

        await test.step('step-7: Verify there is no changes of the card', async () => {
            await expect(await individuals.cardPrice).toContainText(data.price);
            await expect(await individuals.cardPrice).toContainText(data.strikethroughPrice);
            await expect(await individuals.cardPrice).not.toContainText(data.newPrice);
            await expect(await individuals.cardPrice).not.toContainText(data.newStrikethroughPrice);
            await (await studio.getCard(data.cardid, 'plans')).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await editor.prices).toContainText(data.price);
            await expect(await editor.prices).toContainText(data.strikethroughPrice);
            await expect(await editor.prices).not.toContainText(data.newPrice);
            await expect(await editor.prices).not.toContainText(data.newStrikethroughPrice);
        });
    });

    // @studio-plans-individuals-discard-edit-osi - Validate discard OSI for plans individuals card in mas studio
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
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await editor.closeEditor.click();
            await expect(await studio.confirmationDialog).toBeVisible();
            await studio.discardDialog.click();
            await expect(await editor.panel).not.toBeVisible();
        });

        await test.step('step-5: Open the editor and validate there are no changes', async () => {
            await (await studio.getCard(data.cardid, 'plans')).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await editor.OSI).toContainText(data.osi);
            await expect(await editor.OSI).not.toContainText(data.newosi);
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
            await expect(await editor.tags).not.toHaveAttribute(
                'value',
                new RegExp(`${data.newPlanTypeTag}`),
            );
            await expect(await editor.tags).not.toHaveAttribute(
                'value',
                new RegExp(`${data.newOfferTypeTag}`),
            );
            await expect(await editor.tags).not.toHaveAttribute(
                'value',
                new RegExp(`${data.newMarketSegmentsTag}`),
            );
        });
    });

    // @studio-plans-individuals-discard-edit-stock-checkbox - Validate discard stock checkbox for plans individuals card in mas studio
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

        await test.step('step-3: Toggle stock checkbox', async () => {
            await expect(await editor.showStockCheckbox).toBeVisible();
            await expect(await editor.showStockCheckbox).toBeChecked();
            await expect(await individuals.StockCheckbox).toBeVisible();
            await expect(await individuals.StockCheckboxIcon).toBeVisible();
            
            await editor.showStockCheckbox.click();
            await expect(await editor.showStockCheckbox).not.toBeChecked();
            await expect(await editor.showStockCheckbox).toBeVisible();
            await expect(await individuals.StockCheckbox).not.toBeVisible();
            await expect(await individuals.StockCheckboxIcon).not.toBeVisible();
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await editor.closeEditor.click();
            await expect(await studio.confirmationDialog).toBeVisible();
            await studio.discardDialog.click();
            await expect(await editor.panel).not.toBeVisible();
        });

        await test.step('step-5: Verify stock checkbox is unchecked', async () => {
            await expect(await individuals.StockCheckbox).toBeVisible();
            await expect(await individuals.StockCheckboxIcon).toBeVisible();
            await (await studio.getCard(data.cardid, 'plans')).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await editor.showStockCheckbox).toBeChecked();
        });
    });

    // @studio-plans-individuals-discard-edit-quantity-selector - Validate discard quantity selector for plans individuals card in mas studio
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

        await test.step('step-3: Toggle quantity selector', async () => {
            await expect(await editor.showQuantitySelector).toBeVisible();
            await expect(await editor.showQuantitySelector).toBeChecked();
            await expect(await individuals.cardQuantitySelector).toBeVisible();
            
            await editor.showQuantitySelector.click();
            await expect(await editor.showQuantitySelector).not.toBeChecked();
            await expect(await editor.showQuantitySelector).toBeVisible();
            await expect(await individuals.cardQuantitySelector).not.toBeVisible();
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await editor.closeEditor.click();
            await expect(await studio.confirmationDialog).toBeVisible();
            await studio.discardDialog.click();
            await expect(await editor.panel).not.toBeVisible();
        });

        await test.step('step-5: Verify quantity selector is unchecked', async () => {
            await expect(await individuals.cardQuantitySelector).toBeVisible();
            await (await studio.getCard(data.cardid, 'plans')).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await editor.showQuantitySelector).toBeChecked();
        });
    });

    // @studio-plans-individuals-discard-edit-whats-included - Validate discard whats included for plans individuals card in mas studio
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

        await test.step('step-3: Edit whats included field', async () => {
            await expect(await editor.whatsIncluded).toBeVisible();
            await expect(await editor.whatsIncluded).toHaveValue('');
            await expect(await individuals.whatsIncluded).not.toBeVisible();
            await editor.whatsIncluded.fill(data.whatsIncludedText);
            await expect(await editor.whatsIncluded).toHaveValue(data.whatsIncludedText);
            await expect(await individuals.whatsIncluded).toBeVisible();
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await editor.closeEditor.click();
            await expect(await studio.confirmationDialog).toBeVisible();
            await studio.discardDialog.click();
            await expect(await editor.panel).not.toBeVisible();
        });

        await test.step('step-5: Verify whats included text not updated', async () => {
            await expect(await individuals.whatsIncluded).not.toBeVisible();
            await (await studio.getCard(data.cardid, 'plans')).dblclick();
            await expect(await editor.whatsIncluded).toHaveValue('');
        });
    });
    // // @studio-plans-individuals-discard-edit-cta-ost - Validate discard CTA for plans individuals card in mas studio
    // test(`${features[6].name},${features[6].tags}`, async ({
    //     page,
    //     baseURL,
    // }) => {
    //     const { data } = features[6];
    //     const testPage = `${baseURL}${features[6].path}${miloLibs}${features[6].browserParams}${data.cardid}`;
    //     console.info('[Test Page]: ', testPage);

    //     await test.step('step-1: Go to MAS Studio test page', async () => {
    //         await page.goto(testPage);
    //         await page.waitForLoadState('domcontentloaded');
    //     });

    //     await test.step('step-2: Open card editor', async () => {
    //         await expect(
    //             await studio.getCard(data.cardid, 'plans'),
    //         ).toBeVisible();
    //         await (await studio.getCard(data.cardid, 'plans')).dblclick();
    //         await expect(await editor.panel).toBeVisible();
    //     });

    //     await test.step('step-3: Edit CTA field', async () => {
    //         await expect(await editor.cta).toBeVisible();
    //         await expect(await editor.cta).toHaveValue(data.ctaText);
    //         await editor.cta.fill(data.newCtaText);
    //     });

    //     await test.step('step-4: Close the editor and verify discard is triggered', async () => {
    //         await editor.closeEditor.click();
    //         await expect(await studio.confirmationDialog).toBeVisible();
    //         await studio.discardDialog.click();
    //         await expect(await editor.panel).not.toBeVisible();
    //     });

    //     await test.step('step-5: Validate CTA field not updated', async () => {
    //         await expect(await individuals.cardCTA).toHaveText(data.ctaText);
    //     });
    // });

    // // @studio-plans-individuals-discard-edit-cta-label - Validate discard CTA label for plans individuals card in mas studio
    // test(`${features[7].name},${features[7].tags}`, async ({
    //     page,
    //     baseURL,
    // }) => {
    //     const { data } = features[7];
    //     const testPage = `${baseURL}${features[7].path}${miloLibs}${features[7].browserParams}${data.cardid}`;
    //     console.info('[Test Page]: ', testPage);

    //     await test.step('step-1: Go to MAS Studio test page', async () => {
    //         await page.goto(testPage);
    //         await page.waitForLoadState('domcontentloaded');
    //     });

    //     await test.step('step-2: Open card editor', async () => {
    //         await expect(
    //             await studio.getCard(data.cardid, 'plans'),
    //         ).toBeVisible();
    //         await (await studio.getCard(data.cardid, 'plans')).dblclick();
    //         await expect(await editor.panel).toBeVisible();
    //     });

    //     await test.step('step-3: Edit CTA label field', async () => {
    //         await expect(await editor.cta).toBeVisible();
    //         await expect(await editor.cta).toHaveValue(data.ctaText);
    //         await editor.cta.fill(data.newCtaText);
    //     });

    //     await test.step('step-4: Close the editor and verify discard is triggered', async () => {
    //         await editor.closeEditor.click();
    //         await expect(await studio.confirmationDialog).toBeVisible();
    //         await studio.discardDialog.click();
    //         await expect(await editor.panel).not.toBeVisible();
    //     });

    //     await test.step('step-5: Validate CTA label field not updated', async () => {
    //         await expect(await individuals.cardCTA).toHaveText(data.ctaText);
    //     });
    // });


    // // @studio-plans-individuals-discard-edit-cta-variant - Validate discard CTA variant for plans individuals card in mas studio
    // test(`${features[10].name},${features[10].tags}`, async ({
    //     page,
    //     baseURL,
    // }) => {
    //     const { data } = features[10];
    //     const testPage = `${baseURL}${features[10].path}${miloLibs}${features[10].browserParams}${data.cardid}`;
    //     console.info('[Test Page]: ', testPage);

    //     await test.step('step-1: Go to MAS Studio test page', async () => {
    //         await page.goto(testPage);
    //         await page.waitForLoadState('domcontentloaded');
    //     });

    //     await test.step('step-2: Open card editor', async () => {
    //         await expect(
    //             await studio.getCard(data.cardid, 'plans'),
    //         ).toBeVisible();
    //         await (await studio.getCard(data.cardid, 'plans')).dblclick();
    //         await expect(await editor.panel).toBeVisible();
    //     });

    //     await test.step('step-3: Edit CTA variant field', async () => {
    //         await expect(await editor.ctaVariant).toBeVisible();
    //         await expect(await editor.ctaVariant).toHaveValue(data.variant);
    //         await editor.ctaVariant.selectOption(data.newVariant);
    //     });

    //     await test.step('step-4: Close the editor and verify discard is triggered', async () => {
    //         await editor.closeEditor.click();
    //         await expect(await studio.confirmationDialog).toBeVisible();
    //         await studio.discardDialog.click();
    //         await expect(await editor.panel).not.toBeVisible();
    //     });

    //     await test.step('step-5: Validate CTA variant field not updated', async () => {
    //         await expect(await individuals.cardCTA).toHaveClass(data.variant);
    //     });
    // });

    // // @studio-plans-individuals-discard-edit-cta-checkout-params - Validate discard CTA checkout params for plans individuals card in mas studio
    // test(`${features[11].name},${features[11].tags}`, async ({
    //     page,
    //     baseURL,
    // }) => {
    //     const { data } = features[11];
    //     const testPage = `${baseURL}${features[11].path}${miloLibs}${features[11].browserParams}${data.cardid}`;
    //     console.info('[Test Page]: ', testPage);

    //     await test.step('step-1: Go to MAS Studio test page', async () => {
    //         await page.goto(testPage);
    //         await page.waitForLoadState('domcontentloaded');
    //     });

    //     await test.step('step-2: Open card editor', async () => {
    //         await expect(
    //             await studio.getCard(data.cardid, 'plans'),
    //         ).toBeVisible();
    //         await (await studio.getCard(data.cardid, 'plans')).dblclick();
    //         await expect(await editor.panel).toBeVisible();
    //     });

    //     await test.step('step-3: Edit checkout parameters field', async () => {
    //         await expect(await editor.checkoutParams).toBeVisible();
    //         await editor.checkoutParams.fill(
    //             JSON.stringify(data.checkoutParams),
    //         );
    //     });

    //     await test.step('step-4: Close the editor and verify discard is triggered', async () => {
    //         await editor.closeEditor.click();
    //         await expect(await studio.confirmationDialog).toBeVisible();
    //         await studio.discardDialog.click();
    //         await expect(await editor.panel).not.toBeVisible();
    //     });

    //     await test.step('step-5: Validate checkout parameters field not updated', async () => {
    //         await expect(await individuals.cardCTA).toHaveAttribute(
    //             'data-wcs-checkout-params',
    //             JSON.stringify(data.checkoutParams),
    //         );
    //     });
    // });
    

});
