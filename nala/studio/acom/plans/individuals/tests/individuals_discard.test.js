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
    // @studio-plans-individuals-discard-edited-variant-change - Validate variant change for plans individuals card to suggested in mas studio
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
            await editor.variant.locator('sp-picker').first().click();
            await page.getByRole('option', { name: 'suggested' }).click();
            await page.waitForTimeout(2000);
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

    // @studio-plans-individuals-discard-edited-size - Validate discard edited size for plans individuals card in mas studio
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
            await editor.size.click();
            await page
                .getByRole('option', { name: 'Wide', exact: true })
                .click();
            await page.waitForTimeout(2000);
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

    // @studio-plans-individuals-discard-edited-title - Validate discard edited title for plans individuals card in mas studio
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
            await editor.title.fill(data.newTitle);
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

    // @studio-plans-individuals-discard-edited-badge - Validate discard edited badge for plans individuals card in mas studio
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
            await editor.badge.fill(data.newBadge);
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await editor.closeEditor.click();
            await expect(await studio.confirmationDialog).toBeVisible();
            await studio.discardDialog.click();
            await expect(await editor.panel).not.toBeVisible();
        });

        await test.step('step-5: Verify there is no changes of the card', async () => {
            await expect(await individuals.cardBadgeLabel).toHaveText(data.badge);
            await (await studio.getCard(data.cardid, 'plans')).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await editor.badge).toHaveValue(data.badge);
        });
    });

    // @studio-plans-individuals-discard-edited-description - Validate discard edited description for plans individuals card in mas studio
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
            await editor.description.fill(data.newDescription);
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
            await expect(await editor.description).toContainText(
                data.description,
            );
        });
    });

    // @studio-plans-individuals-discard-edited-mnemonic - Validate discard edited mnemonic for plans individuals card in mas studio
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
            await editor.iconURL.fill(data.newIconURL);
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

    // @studio-plans-individuals-discard-edited-callout - Validate discard edited callout for plans individuals card in mas studio
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

        await test.step('step-3: Enter new value in the callout field', async () => {
            await expect(await editor.calloutRTE).toBeVisible();
            await editor.calloutRTE.fill(data.newCalloutText);
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await editor.closeEditor.click();
            await expect(await studio.confirmationDialog).toBeVisible();
            await studio.discardDialog.click();
            await expect(await editor.panel).not.toBeVisible();
        });

        await test.step('step-5: Validate callout field not updated', async () => {
            await expect(await individuals.cardCallout).toContainText(
                data.calloutText,
            );
            await (await studio.getCard(data.cardid, 'plans')).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await editor.calloutRTE).toContainText(
                data.calloutText,
            );
        });
    });

    // @studio-plans-individuals-discard-edited-promo-text - Validate discard edited promo text for plans individuals card in mas studio
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

        await test.step('step-3: Enter new value in the promo text field', async () => {
            await expect(await editor.promoText).toBeVisible();
            await editor.promoText.fill(data.newPromoText);
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await editor.closeEditor.click();
            await expect(await studio.confirmationDialog).toBeVisible();
            await studio.discardDialog.click();
            await expect(await editor.panel).not.toBeVisible();
        });

        await test.step('step-5: Validate promo text field not updated', async () => {
            await expect(await individuals.cardPromoText).toHaveText(
                data.promoText,
            );
            await (await studio.getCard(data.cardid, 'plans')).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await editor.promoText).toHaveValue(data.promoText);
        });
    });

    // @studio-plans-individuals-discard-edited-price - Validate discard edited price for plans individuals card in mas studio
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
            await (await editor.prices.locator(editor.regularPrice)).dblclick();
            await expect(await ost.price).toBeVisible();
            await expect(await ost.priceUse).toBeVisible();
            await expect(await ost.unitCheckbox).toBeVisible();
            await ost.unitCheckbox.click();
            await ost.priceUse.click();
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await editor.closeEditor.click();
            await expect(await studio.confirmationDialog).toBeVisible();
            await studio.discardDialog.click();
            await expect(await editor.panel).not.toBeVisible();
        });

        await test.step('step-5: Verify there is no changes of the card', async () => {
            await expect(await individuals.cardPrice).toContainText(data.price);
            await expect(await individuals.cardPrice).toContainText(
                data.strikethroughPrice,
            );
            await expect(await individuals.cardPrice).not.toContainText(
                data.newPrice,
            );
            await expect(await individuals.cardPrice).not.toContainText(
                data.newStrikethroughPrice,
            );
            await (await studio.getCard(data.cardid, 'plans')).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await editor.prices).toContainText(data.price);
            await expect(await editor.prices).toContainText(
                data.strikethroughPrice,
            );
            await expect(await editor.prices).not.toContainText(data.newPrice);
            await expect(await editor.prices).not.toContainText(
                data.newStrikethroughPrice,
            );
        });
    });

    // @studio-plans-individuals-discard-edited-osi - Validate discard edited OSI for plans individuals card in mas studio
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
            await expect(await editor.tags).toBeVisible();
            await editor.OSIButton.click();
            await expect(await ost.searchField).toBeVisible();
            await ost.searchField.fill(data.newosi);
            await (await ost.nextButton).click();
            await expect(await ost.priceUse).toBeVisible();
            await ost.priceUse.click();
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

    // @studio-plans-individuals-discard-edited-stock-checkbox - Validate discard edited stock checkbox for plans individuals card in mas studio
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
            await editor.showStockCheckbox.click();
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await editor.closeEditor.click();
            await expect(await studio.confirmationDialog).toBeVisible();
            await studio.discardDialog.click();
            await expect(await editor.panel).not.toBeVisible();
        });

        await test.step('step-5: Verify stock checkbox is unchecked', async () => {
            await expect(await individuals.cardStockCheckbox).toBeVisible();
            await expect(await individuals.cardStockCheckboxIcon).toBeVisible();
            await (await studio.getCard(data.cardid, 'plans')).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await editor.showStockCheckbox).toBeChecked();
        });
    });

    // @studio-plans-individuals-discard-edited-quantity-selector - Validate discard edited quantity selector for plans individuals card in mas studio
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
            await editor.showQuantitySelector.click();
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await editor.closeEditor.click();
            await expect(await studio.confirmationDialog).toBeVisible();
            await studio.discardDialog.click();
            await expect(await editor.panel).not.toBeVisible();
        });

        await test.step('step-6: Verify quantity selector is unchanged', async () => {
            await expect(await individuals.cardQuantitySelector).toBeVisible();
            await (await studio.getCard(data.cardid, 'plans')).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await editor.showQuantitySelector).toBeChecked();
        });
    });

    // @studio-plans-individuals-discard-edited-whats-included - Validate discard edited whats included for plans individuals card in mas studio
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
            await editor.whatsIncluded.fill(data.whatsIncludedText);
        });

        await test.step('step-5: Close the editor and verify discard is triggered', async () => {
            await editor.closeEditor.click();
            await expect(await studio.confirmationDialog).toBeVisible();
            await studio.discardDialog.click();
            await expect(await editor.panel).not.toBeVisible();
        });

        await test.step('step-6: Verify whats included text not updated', async () => {
            await expect(await individuals.cardWhatsIncluded).not.toBeVisible();
            await (await studio.getCard(data.cardid, 'plans')).dblclick();
            await expect(await editor.whatsIncluded).toHaveValue('');
        });
    });

    // @studio-plans-individuals-discard-edited-badge-color - Validate discard edited badge color for plans individuals card in mas studio
    test(`${features[13].name},${features[13].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[13];
        const testPage = `${baseURL}${features[13].path}${miloLibs}${features[13].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);
        const individualsCard = await studio.getCard(data.cardid, 'plans');

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

        await test.step('step-3: Edit badge color field', async () => {
            await expect(await editor.badgeColor).toBeVisible();
            await editor.badgeColor.click();
            await page
                .getByRole('option', { name: data.newColor, exact: true })
                .click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await editor.closeEditor.click();
            await expect(await studio.confirmationDialog).toBeVisible();
            await studio.discardDialog.click();
            await expect(await editor.panel).not.toBeVisible();
        });

        await test.step('step-5: Verify badge color is unchanged', async () => {
            expect(
                await webUtil.verifyCSS(
                    individualsCard.locator(individuals.cardBadge),
                    { 'background-color': data.colorCSS },
                ),
            ).toBeTruthy();
            await (await studio.getCard(data.cardid, 'plans')).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await editor.badgeColor).toContainText(data.color);
        });
    });

    // @studio-plans-individuals-discard-edited-badge-border-color - Validate discard edited badge border color for plans individuals card in mas studio
    test(`${features[14].name},${features[14].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[14];
        const testPage = `${baseURL}${features[14].path}${miloLibs}${features[14].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);
        const individualsCard = await studio.getCard(data.cardid, 'plans');

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

        await test.step('step-3: Edit badge border color field', async () => {
            await expect(await editor.badgeBorderColor).toBeVisible();
            await editor.badgeBorderColor.click();
            await page
                .getByRole('option', { name: data.newColor, exact: true })
                .click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await editor.closeEditor.click();
            await expect(await studio.confirmationDialog).toBeVisible();
            await studio.discardDialog.click();
            await expect(await editor.panel).not.toBeVisible();
        });

        await test.step('step-5: Verify badge border color is unchanged', async () => {
            expect(
                await webUtil.verifyCSS(
                    individualsCard.locator(individuals.cardBadge),
                    {
                        'border-left-color': data.colorCSS,
                        'border-top-color': data.colorCSS,
                        'border-bottom-color': data.colorCSS,
                    },
                ),
            ).toBeTruthy();
            await (await studio.getCard(data.cardid, 'plans')).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await editor.badgeBorderColor).toContainText(
                data.color,
            );
        });
    });

    // @studio-plans-individuals-discard-edited-card-border-color - Validate discard edited card border color for plans individuals card in mas studio
    test(`${features[15].name},${features[15].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[15];
        const testPage = `${baseURL}${features[15].path}${miloLibs}${features[15].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);
        const individualsCard = await studio.getCard(data.cardid, 'plans');

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

        await test.step('step-3: Edit card border color field', async () => {
            await expect(await editor.cardBorderColor).toBeVisible();
            await editor.cardBorderColor.click();
            await page
                .getByRole('option', { name: data.newColor, exact: true })
                .click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await editor.closeEditor.click();
            await expect(await studio.confirmationDialog).toBeVisible();
            await studio.discardDialog.click();
            await expect(await editor.panel).not.toBeVisible();
        });

        await test.step('step-5: Verify card border color is unchanged', async () => {
            expect(
                await webUtil.verifyCSS(individualsCard, {
                    'border-color': data.colorCSS,
                }),
            ).toBeTruthy();
            await (await studio.getCard(data.cardid, 'plans')).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await editor.cardBorderColor).toContainText(
                data.color,
            );
        });
    });
});
