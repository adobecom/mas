import { expect, test } from '@playwright/test';
import StudioPage from '../../../studio.page.js';
import CCDSuggestedSpec from '../specs/suggested_save.spec.js';
import CCDSuggestedPage from '../suggested.page.js';
import CCDSlicePage from '../../slice/slice.page.js';
import AHTryBuyWidgetPage from '../../../ahome/try-buy-widget/try-buy-widget.page.js';
import OSTPage from '../../../ost.page.js';
import WebUtil from '../../../../libs/webutil.js';

const { features } = CCDSuggestedSpec;
const miloLibs = process.env.MILO_LIBS || '';

let studio;
let suggested;
let slice;
let trybuywidget;
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
    suggested = new CCDSuggestedPage(page);
    slice = new CCDSlicePage(page);
    trybuywidget = new AHTryBuyWidgetPage(page);
    ost = new OSTPage(page);
    clonedCardID = '';
    webUtil = new WebUtil(page);
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

test.describe('M@S Studio CCD Suggested card test suite', () => {
    // @studio-suggested-remove-correct-fragment - Clone card then delete, verify the correct card is removed from screen
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
                await studio.getCard(data.cardid, 'suggested'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'suggested')).dblclick();
            await expect(await studio.editorPanel).toBeVisible();
        });

        await test.step('step-3: Clone card and open editor', async () => {
            await studio.cloneCard();
            let clonedCard = await studio.getCard(
                data.cardid,
                'suggested',
                'cloned',
            );
            clonedCardID = await clonedCard
                .locator('aem-fragment')
                .getAttribute('fragment');
            data.clonedCardID = await clonedCardID;
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await page.waitForTimeout(2000);
            await studio.cloneCard();

            let clonedCardTwo = await studio.getCard(
                data.cardid,
                'suggested',
                'cloned',
                data.clonedCardID,
            );

            await expect(clonedCardTwo).toBeVisible();

            let clonedCardTwoID = await clonedCardTwo
                .locator('aem-fragment')
                .getAttribute('fragment');
            data.clonedCardTwoID = clonedCardTwoID;
        });

        await test.step('step-4: Delete cloned cards', async () => {
            const clonedCard = await studio.getCard(
                data.clonedCardID,
                'suggested',
            );

            const clonedCardTwo = await studio.getCard(
                data.clonedCardTwoID,
                'suggested',
            );

            await clonedCard.dblclick();
            await studio.deleteCard();
            await expect(clonedCard).not.toBeVisible();

            await clonedCardTwo.dblclick();
            await studio.deleteCard();
            await expect(clonedCardTwo).not.toBeVisible();
        });
    });

    // @studio-suggested-save-variant-change-to-slice - Validate saving card after variant change to ccd slice
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
                await studio.getCard(data.cardid, 'suggested'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'suggested')).dblclick();
            await expect(await studio.editorPanel).toBeVisible();
        });

        await test.step('step-3: Clone card and open editor', async () => {
            await studio.cloneCard();
            let clonedCard = await studio.getCard(
                data.cardid,
                'suggested',
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
            ).toHaveAttribute('default-value', 'ccd-suggested');
            await studio.editorPanel
                .locator(studio.editorVariant)
                .locator('sp-picker')
                .first()
                .click();
            await page.getByRole('option', { name: 'slice' }).click();
            await page.waitForTimeout(2000);
            await studio.saveCard();
        });

        await test.step('step-5: Validate variant change', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorVariant),
            ).toHaveAttribute('default-value', 'ccd-slice');
            await expect(
                await studio.getCard(data.clonedCardID, 'suggested'),
            ).not.toBeVisible();
            await expect(
                await studio.getCard(data.clonedCardID, 'slice'),
            ).toBeVisible();
            await expect(
                await (
                    await studio.getCard(data.clonedCardID, 'slice')
                ).locator(slice.cardCTA),
            ).toHaveAttribute('data-wcs-osi', data.osi);
            await expect(
                await (
                    await studio.getCard(data.clonedCardID, 'slice')
                ).locator(slice.cardCTA),
            ).toHaveAttribute('is', 'checkout-button');
        });
    });

    // @studio-suggested-save-variant-change-to-trybuywidget - Validate saving card after variant change to AHome try-buy-widget
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
                await studio.getCard(data.cardid, 'suggested'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'suggested')).dblclick();
            await expect(await studio.editorPanel).toBeVisible();
        });

        await test.step('step-3: Clone card and open editor', async () => {
            await studio.cloneCard();
            let clonedCard = await studio.getCard(
                data.cardid,
                'suggested',
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
            ).toHaveAttribute('default-value', 'ccd-suggested');
            await studio.editorPanel
                .locator(studio.editorVariant)
                .locator('sp-picker')
                .first()
                .click();
            await page.getByRole('option', { name: 'try buy widget' }).click();
            await page.waitForTimeout(2000);
            await studio.saveCard();
        });

        await test.step('step-5: Validate variant change', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorVariant),
            ).toHaveAttribute('default-value', 'ah-try-buy-widget');
            await expect(
                await studio.getCard(data.clonedCardID, 'suggested'),
            ).not.toBeVisible();
            await expect(
                await studio.getCard(data.clonedCardID, 'ahtrybuywidget'),
            ).toBeVisible();
            await expect(
                await (
                    await studio.getCard(data.clonedCardID, 'ahtrybuywidget')
                ).locator(trybuywidget.cardCTA),
            ).toHaveAttribute('data-wcs-osi', data.osi);
            await expect(
                await (
                    await studio.getCard(data.clonedCardID, 'ahtrybuywidget')
                ).locator(trybuywidget.cardCTA),
            ).toHaveAttribute('is', 'checkout-button');
        });
    });

    // @studio-suggested-save-edit-title - Validate saving card after editing card title
    test(`${features[3].name},${features[3].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[3];
        const testPage = `${baseURL}${features[3].path}${miloLibs}${features[3].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);
        let clonedCard;

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(
                await studio.getCard(data.cardid, 'suggested'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'suggested')).dblclick();
            await expect(await studio.editorPanel).toBeVisible();
        });

        await test.step('step-3: Clone card and open editor', async () => {
            await studio.cloneCard();
            clonedCard = await studio.getCard(
                data.cardid,
                'suggested',
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

        await test.step('step-4: Edit title and save card', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorTitle),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorTitle),
            ).toHaveValue(data.title);
            await studio.editorPanel
                .locator(studio.editorTitle)
                .fill(data.newTitle);
            await studio.saveCard();
        });

        await test.step('step-5: Validate edited card title', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorTitle),
            ).toHaveValue(data.newTitle);
            await expect(
                await clonedCard.locator(suggested.cardTitle),
            ).toHaveText(data.newTitle);
        });
    });

    // @studio-suggested-save-edit-eyebrow - Validate saving card after editing card eyebrow
    test(`${features[4].name},${features[4].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[4];
        const testPage = `${baseURL}${features[4].path}${miloLibs}${features[4].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);
        let clonedCard;

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(
                await studio.getCard(data.cardid, 'suggested'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'suggested')).dblclick();
            await expect(await studio.editorPanel).toBeVisible();
        });

        await test.step('step-3: Clone card and open editor', async () => {
            await studio.cloneCard();
            clonedCard = await studio.getCard(
                data.cardid,
                'suggested',
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

        await test.step('step-4: Edit eyebrow and save card', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorSubtitle),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorSubtitle),
            ).toHaveValue(data.subtitle);
            await studio.editorPanel
                .locator(studio.editorSubtitle)
                .fill(data.newSubtitle);
            await studio.saveCard();
        });

        await test.step('step-5: Validate edited card eyebrow', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorSubtitle),
            ).toHaveValue(data.newSubtitle);
            await expect(
                await clonedCard.locator(suggested.cardEyebrow),
            ).toHaveText(data.newSubtitle);
        });
    });

    // @studio-suggested-save-edit-mnemonic - Validate saving card after editing card mnemonic
    test(`${features[5].name},${features[5].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[5];
        const testPage = `${baseURL}${features[5].path}${miloLibs}${features[5].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);
        let clonedCard;

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(
                await studio.getCard(data.cardid, 'suggested'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'suggested')).dblclick();
            await expect(await studio.editorPanel).toBeVisible();
        });

        await test.step('step-3: Clone card and open editor', async () => {
            await studio.cloneCard();
            clonedCard = await studio.getCard(
                data.cardid,
                'suggested',
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

        await test.step('step-4: Edit mnemonic and save card', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorIconURL),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorIconURL),
            ).toHaveValue(data.iconURL);
            await studio.editorPanel
                .locator(studio.editorIconURL)
                .fill(data.newIconURL);
            await studio.saveCard();
        });

        await test.step('step-5: Validate edited card mnemonic', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorIconURL),
            ).toHaveValue(data.newIconURL);
            await expect(
                await clonedCard.locator(suggested.cardIcon),
            ).toHaveAttribute('src', data.newIconURL);
        });
    });

    // @studio-suggested-save-edit-description - Validate saving card after editing card description
    test(`${features[6].name},${features[6].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[6];
        const testPage = `${baseURL}${features[6].path}${miloLibs}${features[6].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);
        let clonedCard;

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(
                await studio.getCard(data.cardid, 'suggested'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'suggested')).dblclick();
            await expect(await studio.editorPanel).toBeVisible();
        });

        await test.step('step-3: Clone card and open editor', async () => {
            await studio.cloneCard();
            clonedCard = await studio.getCard(
                data.cardid,
                'suggested',
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

        await test.step('step-4: Edit description and save card', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorDescription),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorDescription),
            ).toContainText(data.description);
            await studio.editorPanel
                .locator(studio.editorDescription)
                .fill(data.newDescription);
            await studio.saveCard();
        });

        await test.step('step-5: Validate edited card description', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorDescription),
            ).toContainText(data.newDescription);
            await expect(
                await clonedCard.locator(suggested.cardDescription),
            ).toHaveText(data.newDescription);
        });
    });

    // @studio-suggested-save-edit-image - Validate saving card after editing card background image
    test(`${features[7].name},${features[7].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[7];
        const testPage = `${baseURL}${features[7].path}${miloLibs}${features[7].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);
        let clonedCard;

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(
                await studio.getCard(data.cardid, 'suggested'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'suggested')).dblclick();
            await expect(await studio.editorPanel).toBeVisible();
        });

        await test.step('step-3: Clone card and open editor', async () => {
            await studio.cloneCard();
            clonedCard = await studio.getCard(
                data.cardid,
                'suggested',
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

        await test.step('step-4: Edit fields and save card', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorBackgroundImage),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorBackgroundImage),
            ).toHaveValue('');
            await studio.editorPanel
                .locator(studio.editorBackgroundImage)
                .fill(data.newBackgroundURL);
            await studio.saveCard();
        });

        await test.step('step-5: Validate edited card image', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorBackgroundImage),
            ).toHaveValue(data.newBackgroundURL);
            await expect(await clonedCard).toHaveAttribute(
                'background-image',
                data.newBackgroundURL,
            );
        });
    });

    // @studio-suggested-save-edit-price - Validate saving card after editing card price
    test(`${features[8].name},${features[8].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[8];
        const testPage = `${baseURL}${features[8].path}${miloLibs}${features[8].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);
        let clonedCard;

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(
                await studio.getCard(data.cardid, 'suggested'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'suggested')).dblclick();
            await expect(await studio.editorPanel).toBeVisible();
        });

        await test.step('step-3: Clone card and open editor', async () => {
            await studio.cloneCard();
            clonedCard = await studio.getCard(
                data.cardid,
                'suggested',
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

        await test.step('step-4: Edit price and save card', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorPrices),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorPrices),
            ).toContainText(data.price);
            await expect(
                await studio.editorPanel.locator(studio.editorPrices),
            ).toContainText(data.strikethroughPrice);
            await (
                await studio.editorPanel.locator(studio.regularPrice)
            ).dblclick();
            await expect(await ost.price).toBeVisible();
            await expect(await ost.priceUse).toBeVisible();
            await expect(await ost.oldPriceCheckbox).toBeVisible();
            await ost.oldPriceCheckbox.click();
            await ost.priceUse.click();
            await studio.saveCard();
        });

        await test.step('step-5: Validate edited card price', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorPrices),
            ).toContainText(data.price);
            await expect(
                await studio.editorPanel.locator(studio.editorPrices),
            ).not.toContainText(data.strikethroughPrice);
            await expect(
                await clonedCard.locator(suggested.cardPrice),
            ).toContainText(data.price);
            await expect(
                await clonedCard.locator(suggested.cardPrice),
            ).not.toContainText(data.strikethroughPrice);
        });
    });

    // @studio-suggested-save-edit-cta-label - Validate saving card after editing card cta label
    test(`${features[9].name},${features[9].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[9];
        const testPage = `${baseURL}${features[9].path}${miloLibs}${features[9].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);
        let clonedCard;

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(
                await studio.getCard(data.cardid, 'suggested'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'suggested')).dblclick();
            await expect(await studio.editorPanel).toBeVisible();
        });

        await test.step('step-3: Clone card and open editor', async () => {
            await studio.cloneCard();
            clonedCard = await studio.getCard(
                data.cardid,
                'suggested',
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

        await test.step('step-4: Edit cta and save card', async () => {
            await expect(await studio.editorCTA).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorFooter),
            ).toContainText(data.ctaText);
            await studio.editorCTA.click();
            await studio.editorPanel
                .locator(studio.editorFooter)
                .locator(studio.linkEdit)
                .click();
            await expect(await studio.linkText).toBeVisible();
            await expect(await studio.linkSave).toBeVisible();
            await expect(await studio.linkText).toHaveValue(data.ctaText);
            await studio.linkText.fill(data.newCtaText);
            await studio.linkSave.click();
            await studio.saveCard();
        });

        await test.step('step-5: Validate edited card cta', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorFooter),
            ).toContainText(data.newCtaText);
            await expect(
                await clonedCard.locator(suggested.cardCTA),
            ).toContainText(data.newCtaText);
        });
    });

    // @studio-suggested-save-edit-osi - Validate saving change osi
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
                await studio.getCard(data.cardid, 'suggested'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'suggested')).dblclick();
            await expect(await studio.editorPanel).toBeVisible();
        });

        await test.step('step-3: Clone card and open editor', async () => {
            await studio.cloneCard();
            let clonedCard = await studio.getCard(
                data.cardid,
                'suggested',
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

        await test.step('step-4: Change osi and save card', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorOSI),
            ).toBeVisible();
            await expect(await studio.editorOSI).toContainText(data.osi);
            await (await studio.editorOSIButton).click();
            await expect(await ost.searchField).toBeVisible();
            await ost.searchField.fill(data.newosi);
            await (await ost.nextButton).click();
            await expect(await ost.priceUse).toBeVisible();
            await ost.priceUse.click();
            await studio.saveCard();
        });

        await test.step('step-5: Validate osi change', async () => {
            await expect(await studio.editorOSI).toContainText(data.newosi);
            await expect(await studio.editorTags).toHaveAttribute(
                'value',
                new RegExp(`${data.productCodeTag}`),
            );
            await expect(await studio.editorTags).toHaveAttribute(
                'value',
                new RegExp(`${data.newOfferTypeTag}`),
            );
            await expect(await studio.editorTags).toHaveAttribute(
                'value',
                new RegExp(`${data.newMarketSegmentsTag}`),
            );
            await expect(await studio.editorTags).toHaveAttribute(
                'value',
                new RegExp(`${data.newPlanTypeTag}`),
            );
            await expect(await studio.editorTags).not.toHaveAttribute(
                'value',
                new RegExp(`${data.planTypeTag}`),
            );
            await expect(await studio.editorTags).not.toHaveAttribute(
                'value',
                new RegExp(`${data.offerTypeTag}`),
            );
            await expect(await studio.editorTags).not.toHaveAttribute(
                'value',
                new RegExp(`${data.marketSegmentsTag}`),
            );
        });
    });

    // @studio-suggested-save-edit-cta-variant - Validate saving change CTA variant
    test.skip(`${features[11].name},${features[11].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[11];
        const testPage = `${baseURL}${features[11].path}${miloLibs}${features[11].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);
        let clonedCard;

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(
                await studio.getCard(data.cardid, 'suggested'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'suggested')).dblclick();
            await expect(await studio.editorPanel).toBeVisible();
        });

        await test.step('step-3: Clone card and open editor', async () => {
            await studio.cloneCard();
            clonedCard = await studio.getCard(
                data.cardid,
                'suggested',
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

        await test.step('step-4: Edit CTA variant and save card', async () => {
            await expect(
                await studio.editorPanel
                    .locator(studio.editorFooter)
                    .locator(studio.linkEdit),
            ).toBeVisible();
            await expect(await studio.editorCTA).toBeVisible();
            await expect(await studio.editorCTA).toHaveClass(data.variant);
            expect(
                await webUtil.verifyCSS(
                    await clonedCard.locator(suggested.cardCTA),
                    data.ctaCSS,
                ),
            ).toBeTruthy();
            await studio.editorCTA.click();
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
            await studio.saveCard();
        });

        await test.step('step-5: Validate CTA variant change', async () => {
            await expect(await studio.editorCTA).toHaveClass(data.newVariant);
            await expect(await studio.editorCTA).not.toHaveClass(data.variant);
            expect(
                await webUtil.verifyCSS(
                    await clonedCard.locator(suggested.cardCTA),
                    data.newCtaCSS,
                ),
            ).toBeTruthy();
            await expect(
                await clonedCard.locator(suggested.cardCTA),
            ).toHaveAttribute('data-wcs-osi', data.osi);
            await expect(
                await clonedCard.locator(suggested.cardCTA),
            ).toHaveAttribute('is', 'checkout-button');
        });
    });

    // @studio-suggested-save-edit-cta-checkout-params - Validate saving card after editing card cta checkout params
    test(`${features[12].name},${features[12].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[12];
        const testPage = `${baseURL}${features[12].path}${miloLibs}${features[12].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);
        let clonedCard;

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(
                await studio.getCard(data.cardid, 'suggested'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'suggested')).dblclick();
            await expect(await studio.editorPanel).toBeVisible();
        });

        await test.step('step-3: Clone card and open editor', async () => {
            await studio.cloneCard();
            clonedCard = await studio.getCard(
                data.cardid,
                'suggested',
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

        await test.step('step-4: Edit checkout params and save card', async () => {
            await expect(await studio.editorCTA).toBeVisible();
            await studio.editorCTA.click();
            await studio.editorPanel
                .locator(studio.editorFooter)
                .locator(studio.linkEdit)
                .click();
            await expect(await studio.checkoutParameters).toBeVisible();
            await expect(await studio.linkSave).toBeVisible();
            await studio.checkoutParameters.fill(data.checkoutParams);
            await studio.linkSave.click();
            await studio.saveCard();
        });

        await test.step('step-5: Validate edited cta checkout params', async () => {
            await expect(
                await clonedCard.locator(suggested.cardCTA),
            ).toHaveAttribute('data-wcs-osi', data.osi);
            await expect(
                await clonedCard.locator(suggested.cardCTA),
            ).toHaveAttribute('is', 'checkout-button');
            const CTAhref = await clonedCard
                .locator(suggested.cardCTA)
                .getAttribute('data-href');
            expect(await CTAhref).toContain(data.checkoutParams);
        });
    });
});
