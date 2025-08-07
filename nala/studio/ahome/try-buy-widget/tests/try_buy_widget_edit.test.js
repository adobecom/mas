import { expect, test } from '@playwright/test';
import StudioPage from '../../../studio.page.js';
import EditorPage from '../../../editor.page.js';
import AHTryBuyWidgetSpec from '../specs/try_buy_widget_edit.spec.js';
import AHTryBuyWidgetPage from '../try-buy-widget.page.js';
import CCDSlicePage from '../../../ccd/slice/slice.page.js';
import CCDSuggestedPage from '../../../ccd/suggested/suggested.page.js';
import OSTPage from '../../../ost.page.js';
import WebUtil from '../../../../libs/webutil.js';

const { features } = AHTryBuyWidgetSpec;
const miloLibs = process.env.MILO_LIBS || '';

let studio;
let editor;
let slice;
let suggested;
let trybuywidget;
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
    slice = new CCDSlicePage(page);
    suggested = new CCDSuggestedPage(page);
    trybuywidget = new AHTryBuyWidgetPage(page);
    ost = new OSTPage(page);
    webUtil = new WebUtil(page);
});

test.describe('M@S Studio AHome Try Buy Widget card test suite', () => {
    // @studio-try-buy-widget-edit-title - Validate editing title for try buy widget card in mas studio
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
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ah-try-buy-widget');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Enter long string in title field', async () => {
            await expect(await editor.title).toBeVisible();
            await editor.title.click();
            await page.waitForTimeout(2000);
            await expect(await editor.title).toHaveValue(data.oldTitle);
            await editor.title.fill(data.updatedTitle);
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Validate title truncation in card', async () => {
            await expect(await trybuywidget.cardTitle).toBeVisible();
            await expect(await trybuywidget.cardTitle).toHaveText(data.newTitle);
        });

        await test.step('step-5: Edit the original title back', async () => {
            await editor.title.fill(data.oldTitle);
            await page.waitForTimeout(2000);
        });

        await test.step('step-6: Validate original title in card', async () => {
            await expect(await trybuywidget.cardTitle).toBeVisible();
            await expect(await trybuywidget.cardTitle).toHaveText(data.oldTitle);
        });
    });

    // @studio-try-buy-widget-edit-bg-color - Validate editing background color for try buy widget card in mas studio
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[0].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ah-try-buy-widget');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit background color field', async () => {
            await expect(await editor.backgroundColor).toBeVisible();
            await expect(await editor.backgroundColor).toHaveAttribute('value', data.originalBgColor);
            await editor.backgroundColor.click();
            await page.getByRole('option', { name: data.updatedBgColor }).click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Validate background color of the card', async () => {
            await expect(await studio.getCard(data.cardid)).not.toHaveAttribute('background-color', data.originalBgColor);
        });

        await test.step('step-5: Edit background color back to original', async () => {
            await editor.backgroundColor.click();
            await page.getByRole('option', { name: data.originalBgColor }).click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-6: Validate original background color of the card', async () => {
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('background-color', data.originalBgColor);
        });
    });

    // @studio-try-buy-widget-edit-border-color - Validate editing border color for try buy widget card in mas studio
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
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ah-try-buy-widget');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit border color field', async () => {
            await expect(await editor.borderColor).toBeVisible();
            await editor.borderColor.click();
            await page.getByRole('option', { name: data.updatedBorderColor }).click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Validate border color of the card', async () => {
            await expect(await studio.getCard(data.cardid)).toHaveCSS('border-top-color', data.updatedBorderCSSColor);
            await expect(await studio.getCard(data.cardid)).toHaveCSS('border-bottom-color', data.updatedBorderCSSColor);
            await expect(await studio.getCard(data.cardid)).toHaveCSS('border-left-color', data.updatedBorderCSSColor);
            await expect(await studio.getCard(data.cardid)).toHaveCSS('border-right-color', data.updatedBorderCSSColor);
        });

        await test.step('step-5: Edit border color back to original', async () => {
            await editor.borderColor.click();
            await page.getByRole('option', { name: data.originalBorderColor }).click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-6: Validate original border color of the card', async () => {
            await expect(await studio.getCard(data.cardid)).toHaveCSS('border-top-color', data.originalBorderCSSColor);
            await expect(await studio.getCard(data.cardid)).toHaveCSS('border-bottom-color', data.originalBorderCSSColor);
            await expect(await studio.getCard(data.cardid)).toHaveCSS('border-left-color', data.originalBorderCSSColor);
            await expect(await studio.getCard(data.cardid)).toHaveCSS('border-right-color', data.originalBorderCSSColor);
        });
    });

    // @studio-try-buy-widget-edit-description - Validate edit description field for try buy widget card in mas studio
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
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ah-try-buy-widget');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit description field', async () => {
            await expect(await editor.description).toBeVisible();
            await expect(await editor.description).toContainText(data.description);
            await editor.description.fill(data.updatedDescription);
        });

        await test.step('step-4: Validate update in description field of Editor panel', async () => {
            await expect(await editor.description).toContainText(data.updatedDescription);
        });

        await test.step('step-5: Validate update on the description of card', async () => {
            await expect(await trybuywidget.cardDescription).toHaveText(data.updatedDescription);
        });
    });

    // @studio-try-buy-widget-edit-mnemonic - Validate edit mnemonic field for try buy widget card in mas studio
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
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ah-try-buy-widget');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit mnemonic URL field', async () => {
            await expect(await editor.iconURL).toBeVisible();
            await expect(await editor.iconURL).toHaveValue(data.iconURL);
            await editor.iconURL.fill(data.newIconURL);
        });

        await test.step('step-4: Validate edited mnemonic field in Editor panel', async () => {
            await expect(await editor.iconURL).toHaveValue(data.newIconURL);
        });

        await test.step('step-5: Validate edited mnemonic on the card', async () => {
            await expect(await trybuywidget.cardIcon).toHaveAttribute('src', data.newIconURL);
        });
    });

    // @studio-try-buy-widget-edit-image - Validate edit background image field for single try buy widjet card in mas studio
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
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ah-try-buy-widget');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Remove background URL field', async () => {
            await expect(await editor.backgroundImage).toBeVisible();
            await expect(await editor.backgroundImage).toHaveValue(data.backgroundURL);
            await editor.backgroundImage.fill('');
        });

        await test.step('step-4: Validate edited background image url field in Editor panel', async () => {
            await expect(await editor.backgroundImage).toHaveValue('');
        });

        await test.step('step-5: Validate image is removed from the card', async () => {
            await expect(await trybuywidget.cardImage).not.toBeVisible();
        });

        await test.step('step-6: Enter new value in the background URL field', async () => {
            await editor.backgroundImage.fill(data.newBackgroundURL);
        });

        await test.step('step-7: Validate edited background image url field in Editor panel', async () => {
            await expect(await editor.backgroundImage).toHaveValue(data.newBackgroundURL);
        });

        await test.step('step-8: Validate new image on the card', async () => {
            await expect(await trybuywidget.cardImage).toBeVisible();
            await expect(await trybuywidget.cardImage).toHaveAttribute('src', data.newBackgroundURL);
        });
    });

    // @studio-try-buy-widget-edit-price - Validate editing price field for try buy widjet card in mas studio
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
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ah-try-buy-widget');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit price field', async () => {
            await expect(await editor.prices).toBeVisible();
            await expect(await editor.prices).toContainText(data.price);

            await (await editor.prices.locator(editor.regularPrice)).dblclick();
            await expect(await ost.price).toBeVisible();
            await expect(await ost.priceAnnual).toBeVisible();
            await expect(await ost.priceAnnualUse).toBeVisible();
            await ost.priceAnnualUse.click();
        });

        await test.step('step-4: Validate edited price in Editor panel', async () => {
            await expect(await editor.prices).toContainText(data.annualPrice);
            await expect(await editor.prices).toContainText(data.abmText);
        });

        await test.step('step-5: Validate edited price field on the card', async () => {
            await expect(await trybuywidget.cardPriceSlot).toBeVisible();
            await expect(await trybuywidget.cardPrice).not.toBeVisible();
            await expect(await trybuywidget.cardAnnualPrice).toBeVisible();
            await expect(await trybuywidget.cardPriceSlot).toContainText(data.abmText);
            await expect(await trybuywidget.cardAnnualPrice).toContainText(data.annualPrice);
        });
    });

    // @studio-try-buy-widget-edit-cta - Validate edit CTA for try buy widget card in mas studio
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
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ah-try-buy-widget');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit CTA field', async () => {
            await expect(await editor.footer).toBeVisible();
            await expect(await editor.footer).toContainText(data.ctaText);

            await (await editor.CTAClassSecondary).dblclick();
            await expect(await ost.checkoutTab).toBeVisible();
            await expect(await ost.workflowMenu).toBeVisible();
            await expect(await ost.ctaTextMenu).toBeEnabled();
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
            await ost.checkoutLinkUse.click();
        });

        await test.step('step-4: Validate edited CTA in Editor panel', async () => {
            await expect(await editor.footer).toContainText(data.newCtaText);
        });

        await test.step('step-5: Validate edited price field on the card', async () => {
            await expect(await trybuywidget.cardCTASlot).toContainText(data.newCtaText);
            await expect(await trybuywidget.cardCTA.first()).toHaveAttribute('data-wcs-osi', data.osi);
            await expect(await trybuywidget.cardCTA.first()).toHaveAttribute('is', 'checkout-button');

            const CTAhref = await trybuywidget.cardCTA.first().getAttribute('data-href');
            let workflowStep = decodeURI(CTAhref).split('?')[0];
            let searchParams = new URLSearchParams(decodeURI(CTAhref).split('?')[1]);

            expect(workflowStep).toContain(data.ucv3);
            expect(searchParams.get('co')).toBe(data.country);
            expect(searchParams.get('ctx')).toBe(data.ctx);
            expect(searchParams.get('lang')).toBe(data.lang);
            expect(searchParams.get('cli')).toBe(data.client);
        });
    });

    // @studio-try-buy-widget-change-to-slice - Validate card variant change from AHome try-buy-widget to ccd slice
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
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ah-try-buy-widget');
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('size', 'triple');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit card variant', async () => {
            await expect(await editor.variant).toBeVisible();
            await expect(await editor.variant).toHaveAttribute('default-value', 'ah-try-buy-widget');
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
            await expect(await editor.borderColor).not.toBeVisible();
            await expect(await editor.backgroundColor).not.toBeVisible();
            await expect(await editor.backgroundImage).toBeVisible();
            await expect(await editor.prices).not.toBeVisible();
            await expect(await editor.footer).toBeVisible();
        });

        await test.step('step-5: Validate card variant change', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ccd-slice');
            await expect(await studio.getCard(data.cardid)).not.toHaveAttribute('variant', 'ah-try-buy-widget');
            await expect(await slice.cardDescription).toBeVisible();
            await expect(await slice.cardIcon).toBeVisible();
            await expect(await slice.cardCTA.first()).toBeVisible();
            await expect(await slice.cardCTA.first()).toHaveAttribute('data-wcs-osi', data.osi);
            await expect(await slice.cardCTA.first()).toHaveAttribute('is', 'checkout-button');
        });
    });

    // @studio-try-buy-widget-change-to-suggested - Validate card variant change from AHome try-buy-widget to ccd suggested
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
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ah-try-buy-widget');
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('size', 'triple');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit card variant', async () => {
            await expect(await editor.variant).toBeVisible();
            await expect(await editor.variant).toHaveAttribute('default-value', 'ah-try-buy-widget');
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
            await expect(await editor.borderColor).not.toBeVisible();
            await expect(await editor.backgroundColor).not.toBeVisible();
            await expect(await editor.backgroundImage).toBeVisible();
            await expect(await editor.prices).toBeVisible();
            await expect(await editor.footer).toBeVisible();
        });

        await test.step('step-5: Validate card variant change', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ccd-suggested');
            await expect(await studio.getCard(data.cardid)).not.toHaveAttribute('variant', 'ah-try-buy-widget');
            await expect(await suggested.cardTitle).toBeVisible();
            await expect(await suggested.cardDescription).toBeVisible();
            await expect(await suggested.cardPrice).toBeVisible();
            await expect(await suggested.cardIcon).toBeVisible();
            await expect(await suggested.cardCTA.first()).toBeVisible();
            await expect(await suggested.cardCTA.first()).toHaveAttribute('data-wcs-osi', data.osi);
            await expect(await suggested.cardCTA.first()).toHaveAttribute('is', 'checkout-button');
        });
    });

    // @studio-try-buy-widget-add-osi - Validate adding OSI for try-buy-widget card in mas studio
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
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ah-try-buy-widget');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Choose OSI in OST', async () => {
            await expect(await editor.OSI).toBeVisible();
            await expect(await editor.tags).toBeVisible();
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.productCodeTag}`));
            await expect(await editor.OSI).not.toContainText(data.osi);
            await expect(await editor.tags).not.toHaveAttribute('value', new RegExp(`${data.planTypeTag}`));
            await expect(await editor.tags).not.toHaveAttribute('value', new RegExp(`${data.offerTypeTag}`));
            await expect(await editor.tags).not.toHaveAttribute('value', new RegExp(`${data.marketSegmentsTag}`));

            await (await editor.OSIButton).click();
            await expect(await ost.searchField).toBeVisible();
            await ost.searchField.fill(data.osi);
            await (await ost.nextButton).click();
            await expect(await ost.priceUse).toBeVisible();
            await ost.priceUse.click();
        });

        await test.step('step-4: Validate osi value in Editor panel', async () => {
            await expect(await editor.OSI).toContainText(data.osi);
        });

        await test.step('step-5: Validate tags update', async () => {
            await expect(await editor.tags).not.toHaveAttribute('value', new RegExp(`${data.productCodeTag}`));
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.newProductCodeTag}`));
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.offerTypeTag}`));
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.marketSegmentsTag}`));
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.planTypeTag}`));
        });
    });

    // @studio-try-buy-widget-edit-osi - Validate changing OSI for try-buy-widget card in mas studio
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
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ah-try-buy-widget');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Change OSI in OST', async () => {
            await expect(await editor.OSI).toBeVisible();
            await expect(await editor.OSI).toContainText(data.osi);
            await expect(await editor.tags).toBeVisible();
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.productCodeTag}`));
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.offerTypeTag}`));
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.marketSegmentsTag}`));
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.planTypeTag}`));
            await (await editor.OSIButton).click();
            await ost.backButton.click();
            await page.waitForTimeout(2000);
            await expect(await ost.searchField).toBeVisible();
            await ost.searchField.fill(data.newosi);
            await (await ost.nextButton).click();
            await expect(await ost.priceUse).toBeVisible();
            await ost.priceUse.click();
        });

        await test.step('step-4: Validate osi value in Editor panel', async () => {
            await expect(await editor.OSI).toContainText(data.newosi);
        });

        await test.step('step-5: Validate tags update', async () => {
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.productCodeTag}`));
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.newOfferTypeTag}`));
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.newMarketSegmentsTag}`));
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.newPlanTypeTag}`));
            await expect(await editor.tags).not.toHaveAttribute('value', new RegExp(`${data.planTypeTag}`));
            await expect(await editor.tags).not.toHaveAttribute('value', new RegExp(`${data.offerTypeTag}`));
            await expect(await editor.tags).not.toHaveAttribute('value', new RegExp(`${data.marketSegmentsTag}`));
        });
    });

    // @studio-try-buy-widget-edit-cta-variant - Validate edit CTA variant for try-buy-widget card in mas studio
    test(`${features[12].name},${features[12].tags}`, async ({ page, baseURL }) => {
        const { data } = features[12];
        const testPage = `${baseURL}${features[12].path}${miloLibs}${features[12].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ah-try-buy-widget');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit CTA variant', async () => {
            await expect(await editor.footer.locator(editor.linkEdit)).toBeVisible();
            await expect(await editor.CTA.first()).toBeVisible();
            await expect(await editor.CTA.first()).toHaveClass(data.variant);
            expect(await webUtil.verifyCSS(await trybuywidget.cardCTA.first(), data.ctaCSS)).toBeTruthy();
            await editor.CTA.first().click();
            await editor.footer.locator(editor.linkEdit).click();
            await expect(await editor.linkVariant).toBeVisible();
            await expect(await editor.linkSave).toBeVisible();
            await expect(await editor.getLinkVariant(data.newVariant)).toBeVisible();
            await (await editor.getLinkVariant(data.newVariant)).click();
            await editor.linkSave.click();
        });

        await test.step('step-4: Validate edited CTA variant in Editor panel', async () => {
            await expect(await editor.CTA.first()).toHaveClass(data.newVariant);
            await expect(await editor.CTA.first()).not.toHaveClass(data.variant);
        });

        await test.step('step-5: Validate edited CTA on the card', async () => {
            expect(await webUtil.verifyCSS(await trybuywidget.cardCTA.first(), data.newCtaCSS)).toBeTruthy();
            await expect(await trybuywidget.cardCTA.first()).toHaveAttribute('data-wcs-osi', data.osi);
            await expect(await trybuywidget.cardCTA.first()).toHaveAttribute('is', 'checkout-button');
        });
    });

    // @studio-try-buy-widget-edit-cta-checkout-params - Validate edit CTA checkout params for try-buy-widget card in mas studio
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
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ah-try-buy-widget');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit CTA checkout params', async () => {
            await expect(await editor.footer.locator(editor.linkEdit)).toBeVisible();
            await expect(await editor.CTA.first()).toBeVisible();
            await editor.CTA.first().click();
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
            await expect(await trybuywidget.cardCTA.first()).toHaveAttribute('data-wcs-osi', data.osi);
            await expect(await trybuywidget.cardCTA.first()).toHaveAttribute('is', 'checkout-button');
            const CTAhref = await trybuywidget.cardCTA.first().getAttribute('data-href');
            let searchParams = new URLSearchParams(decodeURI(CTAhref).split('?')[1]);
            expect(searchParams.get('mv')).toBe(data.checkoutParams.mv);
            expect(searchParams.get('promoid')).toBe(data.checkoutParams.promoid);
            expect(searchParams.get('mv2')).toBe(data.checkoutParams.mv2);
        });
    });

    // @studio-try-buy-widget-edit-analytics-ids - Validate edit analytics IDs for try buy widget card in mas studio
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
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('variant', 'ah-try-buy-widget');
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit analytics IDs', async () => {
            await expect(await editor.footer.locator(editor.linkEdit)).toBeVisible();
            await expect(await editor.CTA.first()).toBeVisible();
            await editor.CTA.first().click();
            await editor.footer.locator(editor.linkEdit).click();
            await expect(await editor.analyticsId).toBeVisible();
            await expect(await editor.linkSave).toBeVisible();
            await expect(await editor.analyticsId).toContainText(data.analyticsID);
            await expect(await trybuywidget.cardCTA.first()).toHaveAttribute('data-analytics-id', data.analyticsID);
            await expect(await trybuywidget.cardCTA.first()).toHaveAttribute('daa-ll', data.daaLL);
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('daa-lh', data.daaLH);

            await editor.analyticsId.click();
            await page.getByRole('option', { name: data.newAnalyticsID }).click();
            await editor.linkSave.click();
        });

        await test.step('step-4: Validate edited analytics IDs on the card', async () => {
            await expect(await trybuywidget.cardCTA.first()).toHaveAttribute('data-analytics-id', data.newAnalyticsID);
            await expect(await trybuywidget.cardCTA.first()).toHaveAttribute('daa-ll', data.newDaaLL);
            await expect(await studio.getCard(data.cardid)).toHaveAttribute('daa-lh', data.daaLH);
        });
    });
});
