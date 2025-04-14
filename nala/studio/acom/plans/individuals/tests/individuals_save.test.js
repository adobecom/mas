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
    let cardToClean = page.locator('merch-card').filter({
        has: page.locator(`aem-fragment[fragment="${clonedCardID}"]`),
    });

    if (await editor.panel.isVisible()) {
        await editor.closeEditor.click();
        await expect(await editor.panel).not.toBeVisible();
    }

    if (await cardToClean.isVisible()) {
        await cardToClean.dblclick();
        await expect(await editor.panel).toBeVisible();
        await studio.deleteCard();
        await expect(cardToClean).not.toBeVisible();
    }

    await page.close();
});

test.describe('M@S Studio ACOM Plans Individuals card test suite', () => {
    // @studio-plans-individuals-save-edited-variant-change - Validate saving card after variant change to suggested
    test(`${features[0].name},${features[0].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);
        let clonedCard;

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

        await test.step('step-3: Clone card and open editor', async () => {
            await studio.cloneCard();
            clonedCard = await studio.getCard(data.cardid, 'plans', 'cloned');
            clonedCardID = await clonedCard
                .locator('aem-fragment')
                .getAttribute('fragment');
            data.clonedCardID = await clonedCardID;
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Change variant and save card', async () => {
            await expect(await editor.variant).toBeVisible();
            await editor.variant.locator('sp-picker').first().click();
            await page.getByRole('option', { name: 'suggested' }).click();
            await page.waitForTimeout(2000);
            await studio.saveCard();
        });

        await test.step('step-5: Verify variant change is saved', async () => {
            await expect(
                await studio.getCard(data.clonedCardID, 'plans'),
            ).not.toBeVisible();
            await expect(
                await studio.getCard(data.clonedCardID, 'suggested'),
            ).toBeVisible();
        });
    });

    // @studio-plans-individuals-save-edited-size - Validate saving card after editing size
    test(`${features[1].name},${features[1].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);
        let clonedCard;

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

        await test.step('step-3: Clone card and open editor', async () => {
            await studio.cloneCard();
            clonedCard = await studio.getCard(data.cardid, 'plans', 'cloned');
            clonedCardID = await clonedCard
                .locator('aem-fragment')
                .getAttribute('fragment');
            data.clonedCardID = await clonedCardID;
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Edit size field', async () => {
            await expect(await editor.size).toBeVisible();
            await editor.size.click();
            await page
                .getByRole('option', { name: 'Wide', exact: true })
                .click();
            await page.waitForTimeout(2000);
            await studio.saveCard();
        });

        await test.step('step-5: Verify size change is saved', async () => {
            await expect(
                await studio.getCard(data.clonedCardID, 'plans'),
            ).toHaveAttribute('size', 'wide');
        });
    });

    // @studio-plans-individuals-save-edited-title - Validate saving card after editing title
    test(`${features[2].name},${features[2].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[2];
        const testPage = `${baseURL}${features[2].path}${miloLibs}${features[2].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);
        let clonedCard;

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

        await test.step('step-3: Clone card and open editor', async () => {
            await studio.cloneCard();
            clonedCard = await studio.getCard(data.cardid, 'plans', 'cloned');
            clonedCardID = await clonedCard
                .locator('aem-fragment')
                .getAttribute('fragment');
            data.clonedCardID = await clonedCardID;
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Edit title field', async () => {
            await expect(await editor.title).toBeVisible();
            await editor.title.fill(data.newTitle);
            await studio.saveCard();
        });

        await test.step('step-5: Verify title change is saved', async () => {
            await expect(await editor.title).toHaveValue(data.newTitle);
            await expect(
                await clonedCard.locator(individuals.cardTitle),
            ).toHaveText(data.newTitle);
        });
    });

    // @studio-plans-individuals-save-edited-badge - Validate saving card after editing badge
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
                await studio.getCard(data.cardid, 'plans'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'plans')).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Clone card and open editor', async () => {
            await studio.cloneCard();
            clonedCard = await studio.getCard(data.cardid, 'plans', 'cloned');
            clonedCardID = await clonedCard
                .locator('aem-fragment')
                .getAttribute('fragment');
            data.clonedCardID = await clonedCardID;
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Edit badge field', async () => {
            await expect(await editor.badge).toBeVisible();
            await editor.badge.fill(data.newBadge);
            await studio.saveCard();
        });

        await test.step('step-5: Verify badge change is saved', async () => {
            await expect(await editor.badge).toHaveValue(data.newBadge);
            await expect(
                await clonedCard.locator(individuals.cardBadgeLabel),
            ).toHaveText(data.newBadge);
        });
    });

    // @studio-plans-individuals-save-edited-description - Validate saving card after editing description
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
                await studio.getCard(data.cardid, 'plans'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'plans')).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Clone card and open editor', async () => {
            await studio.cloneCard();
            clonedCard = await studio.getCard(data.cardid, 'plans', 'cloned');
            clonedCardID = await clonedCard
                .locator('aem-fragment')
                .getAttribute('fragment');
            data.clonedCardID = await clonedCardID;
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Edit description field', async () => {
            await expect(await editor.description).toBeVisible();
            await editor.description.fill(data.newDescription);
            await studio.saveCard();
        });

        await test.step('step-5: Verify description change is saved', async () => {
            await expect(await editor.description).toContainText(
                data.newDescription,
            );
            await expect(
                await clonedCard.locator(individuals.cardDescription),
            ).toHaveText(data.newDescription);
        });
    });

    // @studio-plans-individuals-save-edited-mnemonic - Validate saving card after editing mnemonic
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
                await studio.getCard(data.cardid, 'plans'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'plans')).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Clone card and open editor', async () => {
            await studio.cloneCard();
            clonedCard = await studio.getCard(data.cardid, 'plans', 'cloned');
            clonedCardID = await clonedCard
                .locator('aem-fragment')
                .getAttribute('fragment');
            data.clonedCardID = await clonedCardID;
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Edit mnemonic field and save card', async () => {
            await expect(await editor.iconURL).toBeVisible();
            await editor.iconURL.fill(data.newIconURL);
            await studio.saveCard();
        });

        await test.step('step-5: Verify mnemonic change is saved', async () => {
            await expect(await editor.iconURL).toHaveValue(data.newIconURL);
            await expect(
                await clonedCard.locator(individuals.cardIcon),
            ).toHaveAttribute('src', data.newIconURL);
        });
    });

    // @studio-plans-individuals-save-edited-callout - Validate saving card after editing callout
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
                await studio.getCard(data.cardid, 'plans'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'plans')).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Clone card and open editor', async () => {
            await studio.cloneCard();
            clonedCard = await studio.getCard(data.cardid, 'plans', 'cloned');
            clonedCardID = await clonedCard
                .locator('aem-fragment')
                .getAttribute('fragment');
            data.clonedCardID = await clonedCardID;
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Edit callout field', async () => {
            await expect(await editor.calloutRTE).toBeVisible();
            await editor.calloutRTE.fill(data.calloutText);
            await studio.saveCard();
        });

        await test.step('step-5: Verify callout change is saved', async () => {
            await expect(await editor.calloutRTE).toContainText(
                data.calloutText,
            );
            await expect(
                await clonedCard.locator(individuals.cardCallout),
            ).toHaveText(data.calloutText);
        });
    });

    // @studio-plans-individuals-save-edited-promo-text - Validate saving card after editing promo text
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
                await studio.getCard(data.cardid, 'plans'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'plans')).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Clone card and open editor', async () => {
            await studio.cloneCard();
            clonedCard = await studio.getCard(data.cardid, 'plans', 'cloned');
            clonedCardID = await clonedCard
                .locator('aem-fragment')
                .getAttribute('fragment');
            data.clonedCardID = await clonedCardID;
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Edit promo text field', async () => {
            await expect(await editor.promoText).toBeVisible();
            await editor.promoText.fill(data.promoText);
            await studio.saveCard();
        });

        await test.step('step-5: Verify promo text change is saved', async () => {
            await expect(await editor.promoText).toHaveValue(data.promoText);
            await expect(
                await clonedCard.locator(individuals.cardPromoText),
            ).toHaveText(data.promoText);
        });
    });

    // @studio-plans-individuals-save-edited-price - Validate saving card after editing price
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
                await studio.getCard(data.cardid, 'plans'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'plans')).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Clone card and open editor', async () => {
            await studio.cloneCard();
            clonedCard = await studio.getCard(data.cardid, 'plans', 'cloned');
            clonedCardID = await clonedCard
                .locator('aem-fragment')
                .getAttribute('fragment');
            data.clonedCardID = await clonedCardID;
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Edit price field', async () => {
            await expect(await editor.prices).toBeVisible();
            await (await editor.prices.locator(editor.regularPrice)).dblclick();
            await expect(await ost.price).toBeVisible();
            await expect(await ost.priceUse).toBeVisible();
            await expect(await ost.oldPriceCheckbox).toBeVisible();
            await ost.oldPriceCheckbox.click();
            await ost.priceUse.click();
            await studio.saveCard();
        });

        await test.step('step-5: Verify price changes are saved', async () => {
            await expect(await editor.prices).toContainText(data.price);
            await expect(await editor.prices).not.toContainText(
                data.strikethroughPrice,
            );
            await expect(
                await clonedCard.locator(individuals.cardPrice),
            ).toContainText(data.price);
            await expect(
                await clonedCard.locator(individuals.cardPrice),
            ).not.toContainText(data.strikethroughPrice);
        });
    });

    // @studio-plans-individuals-save-edited-osi - Validate saving card after editing OSI
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
                await studio.getCard(data.cardid, 'plans'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'plans')).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Clone card and open editor', async () => {
            await studio.cloneCard();
            clonedCard = await studio.getCard(data.cardid, 'plans', 'cloned');
            clonedCardID = await clonedCard
                .locator('aem-fragment')
                .getAttribute('fragment');
            data.clonedCardID = await clonedCardID;
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Change OSI and save card', async () => {
            await expect(await editor.OSI).toBeVisible();
            await expect(await editor.tags).toBeVisible();
            await editor.OSIButton.click();
            await expect(await ost.searchField).toBeVisible();
            await ost.searchField.fill(data.newosi);
            await (await ost.nextButton).click();
            await expect(await ost.priceUse).toBeVisible();
            await ost.priceUse.click();
            await studio.saveCard();
        });

        await test.step('step-5: Verify OSI changes are saved', async () => {
            await expect(await editor.OSI).toContainText(data.newosi);
            await expect(await editor.tags).toHaveAttribute(
                'value',
                new RegExp(`${data.newOfferTypeTag}`),
            );
            await expect(await editor.tags).toHaveAttribute(
                'value',
                new RegExp(`${data.newMarketSegmentsTag}`),
            );
            await expect(await editor.tags).toHaveAttribute(
                'value',
                new RegExp(`${data.newPlanTypeTag}`),
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

    // @studio-plans-individuals-save-edited-stock-checkbox - Validate saving card after editing stock checkbox
    test(`${features[10].name},${features[10].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[10];
        const testPage = `${baseURL}${features[10].path}${miloLibs}${features[10].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);
        let clonedCard;

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

        await test.step('step-3: Clone card and open editor', async () => {
            await studio.cloneCard();
            clonedCard = await studio.getCard(data.cardid, 'plans', 'cloned');
            clonedCardID = await clonedCard
                .locator('aem-fragment')
                .getAttribute('fragment');
            data.clonedCardID = await clonedCardID;
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Toggle stock checkbox', async () => {
            await expect(await editor.showStockCheckbox).toBeVisible();
            await editor.showStockCheckbox.click();
            await studio.saveCard();
        });

        await test.step('step-5: Verify stock checkbox change is saved', async () => {
            await expect(await editor.showStockCheckbox).toBeChecked();
            await expect(
                await clonedCard.locator(individuals.cardStockCheckbox),
            ).toBeVisible();
        });
    });

    // @studio-plans-individuals-save-edited-quantity-selector - Validate saving card after editing quantity selector
    test(`${features[11].name},${features[11].tags}`, async ({
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
                await studio.getCard(data.cardid, 'plans'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'plans')).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Clone card and open editor', async () => {
            await studio.cloneCard();
            clonedCard = await studio.getCard(data.cardid, 'plans', 'cloned');
            clonedCardID = await clonedCard
                .locator('aem-fragment')
                .getAttribute('fragment');
            data.clonedCardID = await clonedCardID;
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Toggle quantity selector', async () => {
            await expect(await editor.showQuantitySelector).toBeVisible();
            await editor.showQuantitySelector.click();
            await studio.saveCard();
        });

        await test.step('step-5: Verify quantity selector change is saved', async () => {
            await expect(await editor.showQuantitySelector).toBeChecked();
            await expect(
                await clonedCard.locator(individuals.cardQuantitySelector),
            ).toBeVisible();
        });
    });

    // @studio-plans-individuals-save-edited-whats-included - Validate saving card after editing whats included
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
                await studio.getCard(data.cardid, 'plans'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'plans')).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Clone card and open editor', async () => {
            await studio.cloneCard();
            clonedCard = await studio.getCard(data.cardid, 'plans', 'cloned');
            clonedCardID = await clonedCard
                .locator('aem-fragment')
                .getAttribute('fragment');
            data.clonedCardID = await clonedCardID;
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Edit whats included field and save card', async () => {
            await expect(await editor.whatsIncludedLabel).toBeVisible();
            await editor.whatsIncludedLabel.fill(data.whatsIncludedText);
            await studio.saveCard();
        });

        await test.step('step-5: Verify whats included change is saved', async () => {
            await expect(await editor.whatsIncludedLabel).toHaveValue(
                data.whatsIncludedText,
            );
            await expect(
                await clonedCard.locator(individuals.cardWhatsIncluded),
            ).toHaveText(data.whatsIncludedText);
        });
    });

    // @studio-plans-individuals-save-edited-badge-color - Validate save edited badge color for plans individuals card in mas studio
    test(`${features[13].name},${features[13].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[13];
        const testPage = `${baseURL}${features[13].path}${miloLibs}${features[13].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);
        let clonedCard;

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

        await test.step('step-3: Clone card and open editor', async () => {
            await studio.cloneCard();
            clonedCard = await studio.getCard(data.cardid, 'plans', 'cloned');
            clonedCardID = await clonedCard
                .locator('aem-fragment')
                .getAttribute('fragment');
            data.clonedCardID = await clonedCardID;
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Edit badge color field and save card', async () => {
            await expect(await editor.badgeColor).toBeVisible();
            await editor.badgeColor.click();
            await page
                .getByRole('option', { name: data.newColor, exact: true })
                .click();
            await page.waitForTimeout(2000);
            await studio.saveCard();
        });

        await test.step('step-5: Verify badge color is updated', async () => {
            expect(
                await webUtil.verifyCSS(
                    clonedCard.locator(individuals.cardBadge),
                    { 'background-color': data.newColorCSS },
                ),
            ).toBeTruthy();
            await expect(await editor.badgeColor).toContainText(data.newColor);
        });
    });

    // @studio-plans-individuals-save-edited-badge-border-color - Validate save edited badge border color for plans individuals card in mas studio
    test(`${features[14].name},${features[14].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[14];
        const testPage = `${baseURL}${features[14].path}${miloLibs}${features[14].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);
        let clonedCard;

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

        await test.step('step-3: Clone card and open editor', async () => {
            await studio.cloneCard();
            clonedCard = await studio.getCard(data.cardid, 'plans', 'cloned');
            clonedCardID = await clonedCard
                .locator('aem-fragment')
                .getAttribute('fragment');
            data.clonedCardID = await clonedCardID;
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Edit badge border color field and save card', async () => {
            await expect(await editor.badgeBorderColor).toBeVisible();
            await expect(await editor.badgeBorderColor).toContainText(
                data.color,
            );
            await editor.badgeBorderColor.click();
            await page
                .getByRole('option', { name: data.newColor, exact: true })
                .click();
            await page.waitForTimeout(2000);
            await studio.saveCard();
        });

        await test.step('step-5: Verify badge border color is updated', async () => {
            expect(
                await webUtil.verifyCSS(
                    clonedCard.locator(individuals.cardBadge),
                    {
                        'border-left-color': data.newColorCSS,
                        'border-top-color': data.newColorCSS,
                        'border-bottom-color': data.newColorCSS,
                    },
                ),
            ).toBeTruthy();
            await expect(await editor.badgeBorderColor).toContainText(
                data.newColor,
            );
        });
    });

    // @studio-plans-individuals-save-edited-card-border-color - Validate save edited card border color for plans individuals card in mas studio
    test(`${features[15].name},${features[15].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[15];
        const testPage = `${baseURL}${features[15].path}${miloLibs}${features[15].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);
        let clonedCard;

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

        await test.step('step-3: Clone card and open editor', async () => {
            await studio.cloneCard();
            clonedCard = await studio.getCard(data.cardid, 'plans', 'cloned');
            clonedCardID = await clonedCard
                .locator('aem-fragment')
                .getAttribute('fragment');
            data.clonedCardID = await clonedCardID;
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Edit card border color field and save card', async () => {
            await expect(await editor.cardBorderColor).toBeVisible();
            await expect(await editor.cardBorderColor).toContainText(
                data.color,
            );
            await editor.cardBorderColor.click();
            await page
                .getByRole('option', { name: data.newColor, exact: true })
                .click();
            await page.waitForTimeout(2000);
            await studio.saveCard();
        });

        await test.step('step-5: Verify card border color is updated', async () => {
            expect(
                await webUtil.verifyCSS(clonedCard, {
                    'border-color': data.newColorCSS,
                }),
            ).toBeTruthy();
            await expect(await editor.cardBorderColor).toContainText(
                data.newColor,
            );
        });
    });
});
