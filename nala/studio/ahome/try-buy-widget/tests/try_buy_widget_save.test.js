import { expect, test } from '@playwright/test';
import StudioPage from '../../../studio.page.js';
import AHTryBuyWidgetSpec from '../specs/try_buy_widget_save.spec.js';
import AHTryBuyWidgetPage from '../try-buy-widget.page.js';
import OSTPage from '../../../ost.page.js';

const { features } = AHTryBuyWidgetSpec;
const miloLibs = process.env.MILO_LIBS || '';

let studio;
let trybuywidget;
let ost;
let clonedCardID;

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
    clonedCardID = '';
});

test.afterEach(async ({ page }) => {
    let cardToClean = page.locator('merch-card').filter({
        has: page.locator(`aem-fragment[fragment="${clonedCardID}"]`),
    });

    if (await studio.editorPanel.isVisible()) {
        await studio.editorPanel.locator(studio.closeEditor).click();
        await expect(await studio.editorPanel).not.toBeVisible();
    }

    if (await cardToClean.isVisible()) {
        await cardToClean.dblclick();
        await expect(await studio.editorPanel).toBeVisible();
        await studio.deleteCard();
        await expect(cardToClean).not.toBeVisible();
    }

    await page.close();
});

test.describe('M@S Studio AHome Try Buy Widget card test suite', () => {
    // @studio-try-buy-widget-edit-save - Validate editing and saving try buy widjet card in mas studio
    test.skip(`${features[0].name},${features[0].tags}`, async ({
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

        await test.step('step-3: Clone card and open editor', async () => {
            await studio.cloneCard();
            let clonedCard = await studio.getCard(
                data.cardid,
                'ahtrybuywidget-double',
                'cloned',
            );
            clonedCardID = await clonedCard
                .locator('aem-fragment')
                .getAttribute('fragment');
            data.clonedCardID = await clonedCardID;
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Edit a field and save', async () => {
            await studio.editorPanel.locator(studio.editorSize).click();
            await page.getByRole('option', { name: 'triple' }).click();
            //save card
            await studio.saveCard();
        });

        await test.step('step-4: Validate edited field in Editor panel', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorPrices),
            ).toContainText(data.price);
            await expect(
                await studio.editorPanel.locator(studio.editorSize),
            ).toContainText('Triple');
        });

        await test.step('step-5: Validate edited field on the card', async () => {
            const clonedCard = await studio.getCard(
                data.clonedCardID,
                'ahtrybuywidget-triple',
            );
            await expect(
                await studio.getCard(
                    data.clonedCardID,
                    'ahtrybuywidget-triple',
                ),
            ).toBeVisible();
            await expect(await trybuywidget.cardPrice).toBeVisible();
            await expect(await trybuywidget.cardPrice).toContainText(
                data.price,
            );

            //delete the card
            await studio.deleteCard();
            await expect(
                await studio.getCard(
                    data.clonedCardID,
                    'ahtrybuywidget-double',
                ),
            ).not.toBeVisible();
        });
    });

    // @studio-try-buy-widget-save-variant-change-to-slice - Validate saving card after variant change to ccd slice
    test.skip(`${features[1].name},${features[1].tags}`, async ({
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
                await studio.getCard(data.cardid, 'ahtrybuywidget'),
            ).toBeVisible();
            await (
                await studio.getCard(data.cardid, 'ahtrybuywidget')
            ).dblclick();
            await expect(await studio.editorPanel).toBeVisible();
        });

        await test.step('step-3: Clone card and open editor', async () => {
            await studio.cloneCard();
            let clonedCard = await studio.getCard(
                data.cardid,
                'ahtrybuywidget',
                'cloned',
            );
            clonedCardID = await clonedCard
                .locator('aem-fragment')
                .getAttribute('fragment');
            data.clonedCardID = await clonedCardID;
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Change variant and save card', async () => {
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
            // save card
            await studio.saveCard();
        });

        await test.step('step-5: Validate variant change', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorVariant),
            ).toHaveAttribute('default-value', 'slice');
            await expect(
                await studio.getCard(data.clonedCardID, 'ahtrybuywidget'),
            ).not.toBeVisible();
            await expect(
                await studio.getCard(data.clonedCardID, 'slice'),
            ).toBeVisible();
        });

        await test.step('step-6: Delete the card', async () => {
            await studio.deleteCard();
            await expect(
                await studio.getCard(data.clonedCardID, 'ahtrybuywidget'),
            ).not.toBeVisible();
            await expect(
                await studio.getCard(data.clonedCardID, 'slice'),
            ).not.toBeVisible();
        });
    });

    // @studio-try-buy-widget-save-variant-change-to-suggested - Validate saving card after variant change ccd suggested
    test.skip(`${features[2].name},${features[2].tags}`, async ({
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
                await studio.getCard(data.cardid, 'ahtrybuywidget'),
            ).toBeVisible();
            await (
                await studio.getCard(data.cardid, 'ahtrybuywidget')
            ).dblclick();
            await expect(await studio.editorPanel).toBeVisible();
        });

        await test.step('step-3: Clone card and open editor', async () => {
            await studio.cloneCard();
            let clonedCard = await studio.getCard(
                data.cardid,
                'ahtrybuywidget',
                'cloned',
            );
            clonedCardID = await clonedCard
                .locator('aem-fragment')
                .getAttribute('fragment');
            data.clonedCardID = await clonedCardID;
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Change variant and save card', async () => {
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
            await page.getByRole('option', { name: 'suggested' }).click();
            await page.waitForTimeout(2000);
            // save card
            await studio.saveCard();
        });

        await test.step('step-5: Validate variant change', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorVariant),
            ).toHaveAttribute('default-value', 'ccd-suggested');
            await expect(
                await studio.getCard(data.clonedCardID, 'suggested'),
            ).toBeVisible();
            await expect(
                await studio.getCard(data.clonedCardID, 'ahtrybuywidget'),
            ).not.toBeVisible();
        });

        await test.step('step-6: Delete the card', async () => {
            await studio.deleteCard();
            await expect(
                await studio.getCard(data.clonedCardID, 'suggested'),
            ).not.toBeVisible();
            await expect(
                await studio.getCard(data.clonedCardID, 'ahtrybuywidget'),
            ).not.toBeVisible();
        });
    });
});
