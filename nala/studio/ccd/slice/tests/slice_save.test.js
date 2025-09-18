import { expect, test } from '@playwright/test';
import StudioPage from '../../../studio.page.js';
import EditorPage from '../../../editor.page.js';
import CCDSliceSpec from '../specs/slice_save.spec.js';
import CCDSlicePage from '../slice.page.js';
import CCDSuggestedPage from '../../suggested/suggested.page.js';
import AHTryBuyWidgetPage from '../../../ahome/try-buy-widget/try-buy-widget.page.js';
import OSTPage from '../../../ost.page.js';
import WebUtil from '../../../../libs/webutil.js';

const { features } = CCDSliceSpec;
const miloLibs = process.env.MILO_LIBS || '';

let studio;
let editor;
let slice;
let suggested;
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
    editor = new EditorPage(page);
    slice = new CCDSlicePage(page);
    suggested = new CCDSuggestedPage(page);
    trybuywidget = new AHTryBuyWidgetPage(page);
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

test.describe('M@S Studio CCD Slice card test suite', () => {
    // @studio-slice-save-variant-change-to-suggested - Validate saving card after variant change to ccd suggested
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Clone card and open editor', async () => {
            await studio.cloneCard(data.cardid);
            let clonedCard = await studio.getCard(data.cardid, 'cloned');
            clonedCardID = await clonedCard.locator('aem-fragment').getAttribute('fragment');
            data.clonedCardID = await clonedCardID;
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await page.waitForTimeout(2000);
        });

        await test.step('step-3: Change variant and save card', async () => {
            await expect(await editor.variant).toBeVisible();
            await expect(await editor.variant).toHaveAttribute('default-value', 'ccd-slice');
            await editor.variant.locator('sp-picker').first().click();
            await page.getByRole('option', { name: 'suggested' }).click();
            await page.waitForTimeout(2000);
            await studio.saveCard();
        });

        await test.step('step-4: Validate variant change', async () => {
            await expect(await editor.variant).toHaveAttribute('default-value', 'ccd-suggested');
            await expect(await studio.getCard(data.clonedCardID)).not.toHaveAttribute('variant', 'ccd-slice');
            await expect(await studio.getCard(data.clonedCardID)).toHaveAttribute('variant', 'ccd-suggested');
            await expect(await (await studio.getCard(data.clonedCardID)).locator(suggested.cardCTA)).toHaveAttribute(
                'data-wcs-osi',
                data.osi,
            );
            await expect(await (await studio.getCard(data.clonedCardID)).locator(suggested.cardCTA)).toHaveAttribute(
                'is',
                'checkout-button',
            );
        });
    });

    // @studio-slice-save-variant-change-to-trybuywidget - Validate saving card after variant change to AHome try-buy-widget
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Clone card and open editor', async () => {
            await studio.cloneCard(data.cardid);
            let clonedCard = await studio.getCard(data.cardid, 'cloned');
            clonedCardID = await clonedCard.locator('aem-fragment').getAttribute('fragment');
            data.clonedCardID = await clonedCardID;
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await page.waitForTimeout(2000);
        });

        await test.step('step-3: Change variant and save card', async () => {
            await expect(await editor.variant).toBeVisible();
            await expect(await editor.variant).toHaveAttribute('default-value', 'ccd-slice');
            await editor.variant.locator('sp-picker').first().click();
            await page.getByRole('option', { name: 'try buy widget' }).click();
            await page.waitForTimeout(2000);
            await studio.saveCard();
        });

        await test.step('step-4: Validate variant change', async () => {
            await expect(await editor.variant).toHaveAttribute('default-value', 'ah-try-buy-widget');
            await expect(await studio.getCard(data.clonedCardID)).not.toHaveAttribute('variant', 'ccd-slice');
            await expect(await studio.getCard(data.clonedCardID)).toHaveAttribute('variant', 'ah-try-buy-widget');
            await expect(await (await studio.getCard(data.clonedCardID)).locator(trybuywidget.cardCTA)).toHaveAttribute(
                'data-wcs-osi',
                data.osi,
            );
            await expect(await (await studio.getCard(data.clonedCardID)).locator(trybuywidget.cardCTA)).toHaveAttribute(
                'is',
                'checkout-button',
            );
        });
    });

    // @studio-slice-save-edited-size - Validate saving card after editing card size
    test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
        const { data } = features[2];
        const testPage = `${baseURL}${features[2].path}${miloLibs}${features[2].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Clone card and open editor', async () => {
            await studio.cloneCard(data.cardid);
            let clonedCard = await studio.getCard(data.cardid, 'cloned');
            clonedCardID = await clonedCard.locator('aem-fragment').getAttribute('fragment');
            data.clonedCardID = await clonedCardID;
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await page.waitForTimeout(2000);
        });

        await test.step('step-3: Edit size and save card', async () => {
            await expect(await editor.size).toBeVisible();
            await editor.size.click();
            await page.getByRole('option', { name: 'default' }).click();
            await studio.saveCard();
        });

        await test.step('step-4: Validate edited card size', async () => {
            await expect(await studio.getCard(data.clonedCardID)).not.toHaveAttribute('size', 'wide');
        });
    });

    // @studio-slice-save-edited-description - Validate saving card after editing card description
    test(`${features[3].name},${features[3].tags}`, async ({ page, baseURL }) => {
        const { data } = features[3];
        const testPage = `${baseURL}${features[3].path}${miloLibs}${features[3].browserParams}${data.cardid}`;
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

        await test.step('step-3: Edit description and save card', async () => {
            await expect(await editor.description).toBeVisible();
            await expect(await editor.description).toContainText(data.description);
            await editor.description.fill(data.newDescription);
            await studio.saveCard();
        });

        await test.step('step-4: Validate edited card description', async () => {
            await expect(await editor.description).toContainText(data.newDescription);
            await expect(await clonedCard.locator(slice.cardDescription)).toHaveText(data.newDescription);
        });
    });

    // @studio-slice-save-edited-badge - Validate saving card after editing card badge
    test(`${features[4].name},${features[4].tags}`, async ({ page, baseURL }) => {
        const { data } = features[4];
        const testPage = `${baseURL}${features[4].path}${miloLibs}${features[4].browserParams}${data.cardid}`;
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

        await test.step('step-3: Edit badge and save card', async () => {
            await expect(await editor.badge).toBeVisible();
            await editor.badge.fill(data.newBadge);
            await studio.saveCard();
        });

        await test.step('step-4: Validate edited cardbadge', async () => {
            await expect(await editor.badge).toHaveValue(data.newBadge);
            await expect(await clonedCard.locator(slice.cardBadge)).toBeVisible();
            await expect(await clonedCard.locator(slice.cardBadge)).toHaveText(data.newBadge);
        });
    });

    // @studio-slice-save-edited-mnemonic - Validate saving card after editing card mnemonic
    test(`${features[5].name},${features[5].tags}`, async ({ page, baseURL }) => {
        const { data } = features[5];
        const testPage = `${baseURL}${features[5].path}${miloLibs}${features[5].browserParams}${data.cardid}`;
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

        await test.step('step-3: Edit mnemonic and save card', async () => {
            await expect(await editor.iconURL).toBeVisible();
            await expect(await editor.iconURL).toHaveValue(data.iconURL);
            await editor.iconURL.fill(data.newIconURL);
            await studio.saveCard();
        });

        await test.step('step-4: Validate edited card mnemonic', async () => {
            await expect(await editor.iconURL).toHaveValue(data.newIconURL);
            await expect(await clonedCard.locator(slice.cardIcon)).toHaveAttribute('src', data.newIconURL);
        });
    });

    // @studio-slice-save-edited-image - Validate saving card after editing card image
    test(`${features[6].name},${features[6].tags}`, async ({ page, baseURL }) => {
        const { data } = features[6];
        const testPage = `${baseURL}${features[6].path}${miloLibs}${features[6].browserParams}${data.cardid}`;
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

        await test.step('step-3: Edit background image and save card', async () => {
            await expect(await editor.backgroundImage).toBeVisible();
            await expect(await editor.backgroundImage).toHaveValue(data.backgroundURL);
            await editor.backgroundImage.fill(data.newBackgroundURL);
            await studio.saveCard();
        });

        await test.step('step-4: Validate edited card image', async () => {
            await expect(await editor.backgroundImage).toHaveValue(data.newBackgroundURL);
            await expect(await clonedCard.locator(slice.cardImage)).toBeVisible();
            await expect(await clonedCard.locator(slice.cardImage)).toHaveAttribute('src', data.newBackgroundURL);
        });
    });

    // @studio-slice-save-edited-price - Validate saving card after editing card price
    test(`${features[7].name},${features[7].tags}`, async ({ page, baseURL }) => {
        const { data } = features[7];
        const testPage = `${baseURL}${features[7].path}${miloLibs}${features[7].browserParams}${data.cardid}`;
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

        await test.step('step-3: Edit price and save card', async () => {
            await expect(await editor.description).toBeVisible();
            await expect(await clonedCard.locator(slice.cardDescription)).toContainText(data.strikethroughPrice);
            await (await editor.description.locator(editor.regularPrice)).dblclick();
            await expect(await ost.price).toBeVisible();
            await expect(await ost.priceUse).toBeVisible();
            await expect(await ost.oldPriceCheckbox).toBeVisible();
            await ost.oldPriceCheckbox.click();
            await ost.priceUse.click();
            await studio.saveCard();
        });

        await test.step('step-4: Validate edited fields in Editor panel', async () => {
            await expect(await editor.description).toContainText(data.price);
            await expect(await editor.description).not.toContainText(data.strikethroughPrice);
            await expect(await clonedCard.locator(slice.cardDescription)).toContainText(data.price);
            await expect(await clonedCard.locator(slice.cardDescription)).not.toContainText(data.strikethroughPrice);
        });
    });

    // @studio-slice-save-edited-cta-label - Validate saving card after editing card cta label
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
            data.clonedCardID = await clonedCardID;
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await page.waitForTimeout(2000);
        });

        await test.step('step-3: Edit cta and save card', async () => {
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
            await studio.saveCard();
        });

        await test.step('step-4: Validate edited card cta', async () => {
            await expect(await editor.footer).toContainText(data.newCtaText);
            await expect(await clonedCard.locator(slice.cardCTA)).toContainText(data.newCtaText);
            await expect(await clonedCard.locator(slice.cardCTA)).toHaveAttribute('data-wcs-osi', data.osi);
            await expect(await clonedCard.locator(slice.cardCTA)).toHaveAttribute('is', 'checkout-button');
        });
    });

    // @studio-slice-save-edited-osi - Validate saving change osi
    test(`${features[9].name},${features[9].tags}`, async ({ page, baseURL }) => {
        const { data } = features[9];
        const testPage = `${baseURL}${features[9].path}${miloLibs}${features[9].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Clone card and open editor', async () => {
            await studio.cloneCard(data.cardid);
            let clonedCard = await studio.getCard(data.cardid, 'cloned');
            clonedCardID = await clonedCard.locator('aem-fragment').getAttribute('fragment');
            data.clonedCardID = await clonedCardID;
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await page.waitForTimeout(2000);
        });

        await test.step('step-3: Change osi and save card', async () => {
            await expect(await editor.OSI).toBeVisible();
            await expect(await editor.OSI).toContainText(data.osi);
            await editor.OSIButton.click();
            await ost.backButton.click();
            await page.waitForTimeout(2000);
            await expect(await ost.searchField).toBeVisible();
            await ost.searchField.fill(data.newosi);
            await (await ost.nextButton).click();
            await expect(await ost.priceUse).toBeVisible();
            await ost.priceUse.click();
            await studio.saveCard();
        });

        await test.step('step-4: Validate osi change', async () => {
            await expect(await editor.OSI).toContainText(data.newosi);
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.newProductCodeTag}`));
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.newOfferTypeTag}`));
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.newMarketSegmentsTag}`));
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.newPlanTypeTag}`));
            await expect(await editor.tags).not.toHaveAttribute('value', new RegExp(`${data.planTypeTag}`));
            await expect(await editor.tags).not.toHaveAttribute('value', new RegExp(`${data.offerTypeTag}`));
            await expect(await editor.tags).not.toHaveAttribute('value', new RegExp(`${data.marketSegmentsTag}`));
        });
    });

    // @studio-slice-save-edited-cta-variant - Validate saving change CTA variant
    test(`${features[10].name},${features[10].tags}`, async ({ page, baseURL }) => {
        const { data } = features[10];
        const testPage = `${baseURL}${features[10].path}${miloLibs}${features[10].browserParams}${data.cardid}`;
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

        await test.step('step-3: Edit CTA variant and save card', async () => {
            await expect(await editor.footer.locator(editor.linkEdit)).toBeVisible();
            await expect(await editor.CTA).toBeVisible();
            await expect(await editor.CTA).toHaveClass(data.variant);
            expect(await webUtil.verifyCSS(await clonedCard.locator(slice.cardCTA), data.ctaCSS)).toBeTruthy();
            await editor.CTA.click();
            await editor.footer.locator(editor.linkEdit).click();
            await expect(await editor.linkVariant).toBeVisible();
            await expect(await editor.linkSave).toBeVisible();
            await expect(await editor.getLinkVariant(data.newVariant)).toBeVisible();
            await (await editor.getLinkVariant(data.newVariant)).click();
            await editor.linkSave.click();
            await studio.saveCard();
        });

        await test.step('step-4: Validate CTA variant change', async () => {
            await expect(await editor.CTA).toHaveClass(data.newVariant);
            await expect(await editor.CTA).not.toHaveClass(data.variant);
            expect(await webUtil.verifyCSS(await clonedCard.locator(slice.cardCTA), data.newCtaCSS)).toBeTruthy();
            await expect(await clonedCard.locator(slice.cardCTA)).toHaveAttribute('data-wcs-osi', data.osi);
            await expect(await clonedCard.locator(slice.cardCTA)).toHaveAttribute('is', 'checkout-button');
        });
    });

    // @studio-slice-save-edited-cta-checkout-params - Validate saving card after editing card cta checkout params
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
            data.clonedCardID = await clonedCardID;
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await page.waitForTimeout(2000);
        });

        await test.step('step-3: Edit checkout params and save card', async () => {
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
            await studio.saveCard();
        });

        await test.step('step-4: Validate edited cta checkout params', async () => {
            await expect(await clonedCard.locator(slice.cardCTA)).toHaveAttribute('data-wcs-osi', data.osi);
            await expect(await clonedCard.locator(slice.cardCTA)).toHaveAttribute('is', 'checkout-button');
            const CTAhref = await clonedCard.locator(slice.cardCTA).getAttribute('data-href');
            let searchParams = new URLSearchParams(decodeURI(CTAhref).split('?')[1]);
            expect(searchParams.get('mv')).toBe(data.checkoutParams.mv);
            expect(searchParams.get('promoid')).toBe(data.checkoutParams.promoid);
            expect(searchParams.get('mv2')).toBe(data.checkoutParams.mv2);
        });
    });

    // @studio-slice-save-edited-analytics-ids - Validate saving card after editing analytics IDs
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
            data.clonedCardID = await clonedCardID;
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await page.waitForTimeout(2000);
        });

        await test.step('step-3: Edit analytics IDs and save card', async () => {
            await expect(await editor.CTA).toBeVisible();
            await editor.CTA.click();
            await editor.footer.locator(editor.linkEdit).click();
            await expect(await editor.analyticsId).toBeVisible();
            await expect(await editor.linkSave).toBeVisible();
            await editor.analyticsId.click();
            await page.getByRole('option', { name: data.newAnalyticsID }).click();
            await editor.linkSave.click();
            await studio.saveCard();
        });

        await test.step('step-4: Validate edited analytics IDs are saved', async () => {
            await expect(await clonedCard.locator(slice.cardCTA)).toHaveAttribute('data-analytics-id', data.newAnalyticsID);
            await expect(await clonedCard.locator(slice.cardCTA)).toHaveAttribute('daa-ll', data.newDaaLL);
            await expect(await clonedCard).toHaveAttribute('daa-lh', data.daaLH);
        });
    });
});
