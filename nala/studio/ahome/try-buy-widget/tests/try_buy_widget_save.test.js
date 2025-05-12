import { expect, test } from '@playwright/test';
import StudioPage from '../../../studio.page.js';
import EditorPage from '../../../editor.page.js';
import AHTryBuyWidgetSpec from '../specs/try_buy_widget_save.spec.js';
import AHTryBuyWidgetPage from '../try-buy-widget.page.js';
import CCDSlicePage from '../../../ccd/slice/slice.page.js';
import CCDSuggestedPage from '../../../ccd/suggested/suggested.page.js';
import OSTPage from '../../../ost.page.js';
import WebUtil from '../../../../libs/webutil.js';

const { features } = AHTryBuyWidgetSpec;
const miloLibs = process.env.MILO_LIBS || '';

let studio;
let editor;
let trybuywidget;
let slice;
let suggested;
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
    trybuywidget = new AHTryBuyWidgetPage(page);
    slice = new CCDSlicePage(page);
    suggested = new CCDSuggestedPage(page);
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

test.describe('M@S Studio AHome Try Buy Widget card test suite', () => {
    // @studio-try-buy-widget-save-edited-size - Validate saving edited size for try buy widjet card in mas studio
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

        await test.step('step-2: Clone card and open editor', async () => {
            await studio.cloneCard(data.cardid);
            let clonedCard = await studio.getCard(data.cardid, 'cloned');
            clonedCardID = await clonedCard
                .locator('aem-fragment')
                .getAttribute('fragment');
            data.clonedCardID = await clonedCardID;
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await page.waitForTimeout(2000);
        });

        await test.step('step-3: Edit a field and save', async () => {
            await editor.size.click();
            await page.getByRole('option', { name: 'triple' }).click();
            await studio.saveCard();
        });

        await test.step('step-4: Validate edited field in Editor panel', async () => {
            await expect(await editor.prices).toContainText(data.price);
            await expect(await editor.size).toContainText('Triple');
        });

        await test.step('step-5: Validate edited field on the card', async () => {
            const clonedCard = await studio.getCard(data.clonedCardID);
            await expect(clonedCard).toBeVisible();
            await expect(
                await clonedCard.locator(trybuywidget.cardPrice),
            ).toBeVisible();
            await expect(
                await clonedCard.locator(trybuywidget.cardPrice),
            ).toContainText(data.price);
        });
    });

    // @studio-try-buy-widget-save-edited-variant-change-to-slice - Validate saving card after variant change to ccd slice
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

        await test.step('step-2: Clone card and open editor', async () => {
            await studio.cloneCard(data.cardid);
            let clonedCard = await studio.getCard(data.cardid, 'cloned');
            clonedCardID = await clonedCard
                .locator('aem-fragment')
                .getAttribute('fragment');
            data.clonedCardID = await clonedCardID;
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await page.waitForTimeout(2000);
        });

        await test.step('step-3: Change variant and save card', async () => {
            await expect(await editor.variant).toBeVisible();
            await expect(await editor.variant).toHaveAttribute(
                'default-value',
                'ah-try-buy-widget',
            );
            await editor.variant.locator('sp-picker').first().click();
            await page.getByRole('option', { name: 'slice' }).click();
            await page.waitForTimeout(2000);
            await studio.saveCard();
        });

        await test.step('step-4: Validate variant change', async () => {
            await expect(await editor.variant).toHaveAttribute(
                'default-value',
                'ccd-slice',
            );
            await expect(
                await studio.getCard(data.clonedCardID),
            ).not.toHaveAttribute('variant', 'ah-try-buy-widget');
            await expect(
                await studio.getCard(data.clonedCardID),
            ).toHaveAttribute('variant', 'ccd-slice');
            await expect(
                await (await studio.getCard(data.clonedCardID))
                    .locator(slice.cardCTA)
                    .first(),
            ).toHaveAttribute('data-wcs-osi', data.osi);
            await expect(
                await (await studio.getCard(data.clonedCardID))
                    .locator(slice.cardCTA)
                    .first(),
            ).toHaveAttribute('is', 'checkout-button');
        });
    });

    // @studio-try-buy-widget-save-edited-variant-change-to-suggested - Validate saving card after variant change ccd suggested
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

        await test.step('step-2: Clone card and open editor', async () => {
            await studio.cloneCard(data.cardid);
            let clonedCard = await studio.getCard(data.cardid, 'cloned');
            clonedCardID = await clonedCard
                .locator('aem-fragment')
                .getAttribute('fragment');
            data.clonedCardID = await clonedCardID;
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await page.waitForTimeout(2000);
        });

        await test.step('step-3: Change variant and save card', async () => {
            await expect(await editor.variant).toBeVisible();
            await expect(await editor.variant).toHaveAttribute(
                'default-value',
                'ah-try-buy-widget',
            );
            await editor.variant.locator('sp-picker').first().click();
            await page.getByRole('option', { name: 'suggested' }).click();
            await page.waitForTimeout(2000);
            await studio.saveCard();
        });

        await test.step('step-4: Validate variant change', async () => {
            await expect(await editor.variant).toHaveAttribute(
                'default-value',
                'ccd-suggested',
            );
            await expect(
                await studio.getCard(data.clonedCardID),
            ).toHaveAttribute('variant', 'ccd-suggested');
            await expect(
                await studio.getCard(data.clonedCardID),
            ).not.toHaveAttribute('variant', 'ah-try-buy-widget');
            await expect(
                await (await studio.getCard(data.clonedCardID))
                    .locator(suggested.cardCTA)
                    .first(),
            ).toHaveAttribute('data-wcs-osi', data.osi);
            await expect(
                await (await studio.getCard(data.clonedCardID))
                    .locator(suggested.cardCTA)
                    .first(),
            ).toHaveAttribute('is', 'checkout-button');
        });
    });

    // @studio-try-buy-widget-save-edited-osi - Validate saving change osi
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

        await test.step('step-2: Clone card and open editor', async () => {
            await studio.cloneCard(data.cardid);
            let clonedCard = await studio.getCard(data.cardid, 'cloned');
            clonedCardID = await clonedCard
                .locator('aem-fragment')
                .getAttribute('fragment');
            data.clonedCardID = await clonedCardID;
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await page.waitForTimeout(2000);
        });

        await test.step('step-3: Change osi and save card', async () => {
            await expect(await editor.OSI).toBeVisible();
            await expect(await editor.OSI).toContainText(data.osi);
            await (await editor.OSIButton).click();
            await expect(await ost.searchField).toBeVisible();
            await ost.searchField.fill(data.newosi);
            await (await ost.nextButton).click();
            await expect(await ost.priceUse).toBeVisible();
            await ost.priceUse.click();
            await studio.saveCard();
        });

        await test.step('step-4: Validate osi change', async () => {
            await expect(await editor.OSI).toContainText(data.newosi);
            await expect(await editor.tags).toHaveAttribute(
                'value',
                new RegExp(`${data.productCodeTag}`),
            );
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
                new RegExp(`${data.planTypeTag}`),
            );
            await expect(await editor.tags).not.toHaveAttribute(
                'value',
                new RegExp(`${data.offerTypeTag}`),
            );
            await expect(await editor.tags).not.toHaveAttribute(
                'value',
                new RegExp(`${data.marketSegmentsTag}`),
            );
        });
    });

    // @studio-try-buy-widget-save-edited-cta-variant - Validate saving change CTA variant
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

        await test.step('step-2: Clone card and open editor', async () => {
            await studio.cloneCard(data.cardid);
            clonedCard = await studio.getCard(data.cardid, 'cloned');
            clonedCardID = await clonedCard
                .locator('aem-fragment')
                .getAttribute('fragment');
            data.clonedCardID = await clonedCardID;
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await page.waitForTimeout(2000);
        });

        await test.step('step-3: Edit CTA variant and save card', async () => {
            await expect(
                await editor.footer.locator(editor.linkEdit),
            ).toBeVisible();
            await expect(await editor.CTA.first()).toBeVisible();
            await expect(await editor.CTA.first()).toHaveClass(data.variant);
            expect(
                await webUtil.verifyCSS(
                    await trybuywidget.cardCTA.first(),
                    data.ctaCSS,
                ),
            ).toBeTruthy();
            await editor.CTA.first().click();
            await editor.footer.locator(editor.linkEdit).click();
            await expect(await editor.linkVariant).toBeVisible();
            await expect(await editor.linkSave).toBeVisible();
            await expect(
                await editor.getLinkVariant(data.newVariant),
            ).toBeVisible();
            await (await editor.getLinkVariant(data.newVariant)).click();
            await editor.linkSave.click();
            await studio.saveCard();
        });

        await test.step('step-4: Validate CTA variant change', async () => {
            await expect(await editor.CTA.first()).toHaveClass(data.newVariant);
            await expect(await editor.CTA.first()).not.toHaveClass(
                data.variant,
            );
            expect(
                await webUtil.verifyCSS(
                    await clonedCard.locator(trybuywidget.cardCTA).first(),
                    data.newCtaCSS,
                ),
            ).toBeTruthy();
            await expect(
                await clonedCard.locator(trybuywidget.cardCTA).first(),
            ).toHaveAttribute('data-wcs-osi', data.osi);
            await expect(
                await clonedCard.locator(trybuywidget.cardCTA).first(),
            ).toHaveAttribute('is', 'checkout-button');
        });
    });

    // @studio-try-buy-widget-save-edited-cta-checkout-params - Validate saving card after editing card cta checkout params
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

        await test.step('step-2: Clone card and open editor', async () => {
            await studio.cloneCard(data.cardid);
            clonedCard = await studio.getCard(data.cardid, 'cloned');
            clonedCardID = await clonedCard
                .locator('aem-fragment')
                .getAttribute('fragment');
            data.clonedCardID = await clonedCardID;
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await page.waitForTimeout(2000);
        });

        await test.step('step-3: Edit checkout params and save card', async () => {
            await expect(await editor.CTA.first()).toBeVisible();
            await editor.CTA.first().click();
            await editor.footer.locator(editor.linkEdit).click();
            await expect(await editor.checkoutParameters).toBeVisible();
            await expect(await editor.linkSave).toBeVisible();

            const checkoutParamsString = Object.keys(data.checkoutParams)
                .map(
                    (key) =>
                        `${encodeURIComponent(key)}=${encodeURIComponent(data.checkoutParams[key])}`,
                )
                .join('&');
            await editor.checkoutParameters.fill(checkoutParamsString);
            await editor.linkSave.click();
            await studio.saveCard();
        });

        await test.step('step-4: Validate edited cta checkout params', async () => {
            await expect(
                await clonedCard.locator(trybuywidget.cardCTA).first(),
            ).toHaveAttribute('data-wcs-osi', data.osi);
            await expect(
                await clonedCard.locator(trybuywidget.cardCTA).first(),
            ).toHaveAttribute('is', 'checkout-button');
            const CTAhref = await clonedCard
                .locator(trybuywidget.cardCTA)
                .first()
                .getAttribute('data-href');
            let searchParams = new URLSearchParams(
                decodeURI(CTAhref).split('?')[1],
            );
            expect(searchParams.get('mv')).toBe(data.checkoutParams.mv);
            // expect(searchParams.get('cs')).toBe(data.checkoutParams.cs);
            expect(searchParams.get('promoid')).toBe(
                data.checkoutParams.promoid,
            );
            expect(searchParams.get('mv2')).toBe(data.checkoutParams.mv2);
        });
    });
});
