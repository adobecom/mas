import { expect, test } from '@playwright/test';
import StudioPage from '../../../studio.page.js';
import AHTryBuyWidgetSpec from '../specs/try_buy_widget_discard.spec.js';
import AHTryBuyWidgetPage from '../try-buy-widget.page.js';
import OSTPage from '../../../ost.page.js';

const { features } = AHTryBuyWidgetSpec;
const miloLibs = process.env.MILO_LIBS || '';

let studio;
let trybuywidget;
let ost;

test.beforeEach(async ({ page, browserName }) => {
    test.slow();
    if (browserName === 'chromium') {
        await page.setExtraHTTPHeaders({
            'sec-ch-ua': '"Chromium";v="123", "Not:A-Brand";v="8"',
        });
    }
    studio = new StudioPage(page);
    trybuywidget = new AHTryBuyWidgetPage(page);
    ost = new OSTPage(page);
});

test.describe('M@S Studio AHome Try Buy Widget card test suite', () => {
    // @studio-try-buy-widget-edit-discard-price - Validate editing and discarding changes for try buy widjet card in mas studio
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
                await studio.getCard(data.cardid, 'ahtrybuywidget-double'),
            ).toBeVisible();
            await (
                await studio.getCard(data.cardid, 'ahtrybuywidget-double')
            ).dblclick();
            await expect(await studio.editorPanel).toBeVisible();
        });

        await test.step('step-3: Edit price field', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorPrices),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorPrices),
            ).toContainText(data.price);
            await expect(
                await studio.editorPanel.locator(studio.editorPrices),
            ).not.toContainText(data.newPrice);

            await (
                await studio.editorPanel
                    .locator(studio.editorPrices)
                    .locator(studio.regularPrice)
            ).dblclick();
            await expect(await ost.price).toBeVisible();
            await expect(await ost.priceUse).toBeVisible();
            await expect(await ost.unitCheckbox).toBeVisible();
            await ost.unitCheckbox.click();
            await ost.priceUse.click();
        });

        await test.step('step-4: Validate edited price in Editor panel', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorPrices),
            ).toContainText(data.newPrice);
        });

        await test.step('step-5: Validate edited price field on the card', async () => {
            await expect(await trybuywidget.cardPriceSlot).toBeVisible();
            await expect(await trybuywidget.cardPrice).toBeVisible();
            await expect(await trybuywidget.cardPrice).toContainText(
                data.newPrice,
            );
        });

        await test.step('step-6: Close the editor to discard changes', async () => {
            await studio.editorPanel.locator(studio.closeEditor).click();
            await expect(
                await studio.editorPanel.locator(studio.confirmationDialog),
            ).toBeVisible();
            await studio.editorPanel.locator(studio.discardDialog).click();
            await expect(await studio.editorPanel).not.toBeVisible();
        });

        await test.step('step-7: Verify that the changes are not reflected on the card', async () => {
            await expect(await trybuywidget.cardPriceSlot).toBeVisible();
            await expect(await trybuywidget.cardPrice).toBeVisible();
            await expect(await trybuywidget.cardPrice).toContainText(
                data.price,
            );
            await expect(await trybuywidget.cardPrice).not.toContainText(
                data.newPrice,
            );
        });
    });

    // @studio-try-buy-widget-discard-variant-change - Validate variant change for AHome try-buy-widget card in mas studio
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
                await studio.getCard(data.cardid, 'ahtrybuywidget-double'),
            ).toBeVisible();
            await (
                await studio.getCard(data.cardid, 'ahtrybuywidget-double')
            ).dblclick();
            await expect(await studio.editorPanel).toBeVisible();
        });

        await test.step('step-3: Change variant', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorVariant),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorVariant),
            ).toHaveAttribute('default-value', 'ah-try-buy-widget');
            await studio.editorPanel
                .locator(studio.editorVariant)
                .locator('sp-picker')
                .first()
                .click();
            await page.getByRole('option', { name: 'slice' }).click();
            await page.waitForTimeout(2000);
            await expect(
                await studio.getCard(data.cardid, 'ahtrybuywidget-double'),
            ).not.toBeVisible();
            await expect(
                await studio.getCard(data.cardid, 'slice'),
            ).toBeVisible();
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await studio.editorPanel.locator(studio.closeEditor).click();
            await expect(
                await studio.editorPanel.locator(studio.confirmationDialog),
            ).toBeVisible();
            await studio.editorPanel.locator(studio.discardDialog).click();
            await expect(await studio.editorPanel).not.toBeVisible();
        });

        await test.step('step-5: Verify there is no changes of the card', async () => {
            await expect(
                await studio.getCard(data.cardid, 'ahtrybuywidget-double'),
            ).toBeVisible();
            await expect(
                await studio.getCard(data.cardid, 'slice'),
            ).not.toBeVisible();
        });
    });

    // @studio-try-buy-widget-discard-edit-osi - Validate changing OSI for AH try-buy-widget card in mas studio
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
                await studio.getCard(data.cardid, 'ahtrybuywidget-double'),
            ).toBeVisible();
            await (
                await studio.getCard(data.cardid, 'ahtrybuywidget-double')
            ).dblclick();
            await expect(await studio.editorPanel).toBeVisible();
        });

        await test.step('step-3: Change OSI in OST', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorOSI),
            ).toBeVisible();
            await expect(await studio.editorOSI).toContainText(data.osi);
            await expect(await studio.editorTags).toBeVisible();
            await expect(await studio.editorTags).toHaveAttribute(
                'value',
                new RegExp(`${data.productCodeTag}`),
            );
            await expect(await studio.editorTags).toHaveAttribute(
                'value',
                new RegExp(`${data.offerTypeTag}`),
            );
            await expect(await studio.editorTags).toHaveAttribute(
                'value',
                new RegExp(`${data.marketSegmentsTag}`),
            );
            await expect(await studio.editorTags).toHaveAttribute(
                'value',
                new RegExp(`${data.planTypeTag}`),
            );
            await (await studio.editorOSIButton).click();
            await expect(await ost.searchField).toBeVisible();
            await ost.searchField.fill(data.newosi);
            await (await ost.nextButton).click();
            await expect(await ost.priceUse).toBeVisible();
            await ost.priceUse.click();
            await expect(await studio.editorOSI).toContainText(data.newosi);
            await expect(await studio.editorTags).toHaveAttribute(
                'value',
                new RegExp(`${data.newPlanTypeTag}`),
            );
            await expect(await studio.editorTags).toHaveAttribute(
                'value',
                new RegExp(`${data.newOfferTypeTag}`),
            );
            await expect(await studio.editorTags).toHaveAttribute(
                'value',
                new RegExp(`${data.newMarketSegmentsTag}`),
            );
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await studio.editorPanel.locator(studio.closeEditor).click();
            await expect(
                await studio.editorPanel.locator(studio.confirmationDialog),
            ).toBeVisible();
            await studio.editorPanel.locator(studio.discardDialog).click();
            await expect(await studio.editorPanel).not.toBeVisible();
        });

        await test.step('step-4: Open the editor and validate there are no changes', async () => {
            await (
                await studio.getCard(data.cardid, 'ahtrybuywidget-double')
            ).dblclick();
            await expect(await studio.editorPanel).toBeVisible();
            await expect(await studio.editorOSI).toContainText(data.osi);
            await expect(await studio.editorOSI).not.toContainText(data.newosi);
            await expect(await studio.editorTags).toHaveAttribute(
                'value',
                new RegExp(`${data.productCodeTag}`),
            );
            await expect(await studio.editorTags).toHaveAttribute(
                'value',
                new RegExp(`${data.offerTypeTag}`),
            );
            await expect(await studio.editorTags).toHaveAttribute(
                'value',
                new RegExp(`${data.marketSegmentsTag}`),
            );
            await expect(await studio.editorTags).toHaveAttribute(
                'value',
                new RegExp(`${data.planTypeTag}`),
            );
            await expect(await studio.editorTags).not.toHaveAttribute(
                'value',
                new RegExp(`${data.newPlanTypeTag}`),
            );
            await expect(await studio.editorTags).not.toHaveAttribute(
                'value',
                new RegExp(`${data.newOfferTypeTag}`),
            );
            await expect(await studio.editorTags).not.toHaveAttribute(
                'value',
                new RegExp(`${data.newMarketSegmentsTag}`),
            );
        });
    });

    // @studio-try-buy-widget-discard-edit-cta-variant - Validate changing CTA variant for AH try-buy-widget card in mas studio
    test.skip(`${features[3].name},${features[3].tags}`, async ({
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
                await studio.getCard(data.cardid, 'ahtrybuywidget-double'),
            ).toBeVisible();
            await (
                await studio.getCard(data.cardid, 'ahtrybuywidget-double')
            ).dblclick();
            await expect(await studio.editorPanel).toBeVisible();
        });

        await test.step('step-3: Edit CTA variant', async () => {
            await expect(
                await studio.editorPanel
                    .locator(studio.editorFooter)
                    .locator(studio.linkEdit),
            ).toBeVisible();
            await expect(await studio.editorCTA.first()).toBeVisible();
            await expect(await studio.editorCTA.first()).toHaveClass(
                data.variant,
            );
            await studio.editorCTA.first().click();
            await studio.editorPanel
                .locator(studio.editorFooter)
                .locator(studio.linkEdit)
                .click();
            await expect(await studio.linkVariant).toBeVisible();
            await expect(await studio.linkSave).toBeVisible();
            await expect(
                await studio.getLinkVariant(data.newVariant),
            ).toBeVisible();
            await (await studio.getLinkVariant(data.newVariant)).click();
            await studio.linkSave.click();
            await expect(await studio.editorCTA.first()).toHaveClass(
                data.newVariant,
            );
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await studio.editorPanel.locator(studio.closeEditor).click();
            await expect(
                await studio.editorPanel.locator(studio.confirmationDialog),
            ).toBeVisible();
            await studio.editorPanel.locator(studio.discardDialog).click();
            await expect(await studio.editorPanel).not.toBeVisible();
        });

        await test.step('step-4: Open the editor and validate there are no changes', async () => {
            await (
                await studio.getCard(data.cardid, 'ahtrybuywidget-double')
            ).dblclick();
            await expect(await studio.editorPanel).toBeVisible();
            await expect(await studio.editorCTA.first()).toBeVisible();
            await expect(await studio.editorCTA.first()).toHaveClass(
                data.variant,
            );
            await expect(await studio.editorCTA.first()).not.toHaveClass(
                data.newVariant,
            );
        });
    });
});
