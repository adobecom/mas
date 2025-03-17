import { expect, test } from '@playwright/test';
import StudioPage from '../../../studio.page.js';
import AHTryBuyWidgetSpec from '../specs/try_buy_widget_edit.spec.js';
import AHTryBuyWidgetPage from '../try-buy-widget.page.js';
import CCDSlicePage from '../../../ccd/slice/slice.page.js';
import CCDSuggestedPage from '../../../ccd/suggested/suggested.page.js';
import OSTPage from '../../../ost.page.js';
import WebUtil from '../../../../libs/webutil.js';

const { features } = AHTryBuyWidgetSpec;
const miloLibs = process.env.MILO_LIBS || '';

let studio;
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
    slice = new CCDSlicePage(page);
    suggested = new CCDSuggestedPage(page);
    trybuywidget = new AHTryBuyWidgetPage(page);
    ost = new OSTPage(page);
    webUtil = new WebUtil(page);
});

test.describe('M@S Studio AHome Try Buy Widget card test suite', () => {
    // @studio-try-buy-widget-editor - Validate editor fields for try buy widget card in mas studio
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
                await studio.getCard(data.cardid, 'ahtrybuywidget-triple'),
            ).toBeVisible();
            await (
                await studio.getCard(data.cardid, 'ahtrybuywidget-triple')
            ).dblclick();
            await expect(await studio.editorPanel).toBeVisible();
        });

        await test.step('step-3: Validate fields rendering', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorVariant),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorVariant),
            ).toHaveAttribute('default-value', 'ah-try-buy-widget');
            await expect(
                await studio.editorPanel.locator(studio.editorSize),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorTitle),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorDescription),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorIconURL),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorBorderColor),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorBackgroundColor),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorBackgroundImage),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorPrices),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorFooter),
            ).toBeVisible();
        });
    });

    // @studio-try-buy-widget-edit-title - Validate editing title for try buy widget card in mas studio
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
                await studio.getCard(data.cardid, 'ahtrybuywidget-triple'),
            ).toBeVisible();
            await (
                await studio.getCard(data.cardid, 'ahtrybuywidget-triple')
            ).dblclick();
            await expect(await studio.editorPanel).toBeVisible();
        });

        await test.step('step-3: Enter long string in title field', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorTitle),
            ).toBeVisible();
            await studio.editorPanel.locator(studio.editorTitle).click();
            await page.waitForTimeout(2000);
            await expect(
                await studio.editorPanel.locator(studio.editorTitle),
            ).toHaveValue(data.oldTitle);
            await studio.editorPanel
                .locator(studio.editorTitle)
                .fill(data.updatedTitle);
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Validate title truncation in card', async () => {
            await expect(await trybuywidget.cardTitle).toBeVisible();
            await expect(await trybuywidget.cardTitle).toHaveText(
                data.newTitle,
            );
        });

        await test.step('step-5: Edit the original title back', async () => {
            await studio.editorPanel
                .locator(studio.editorTitle)
                .fill(data.oldTitle);
            await page.waitForTimeout(2000);
        });

        await test.step('step-6: Validate original title in card', async () => {
            await expect(await trybuywidget.cardTitle).toBeVisible();
            await expect(await trybuywidget.cardTitle).toHaveText(
                data.oldTitle,
            );
        });
    });

    // @studio-try-buy-widget-edit-bg-color - Validate editing background color for try buy widget card in mas studio
    test(`${features[2].name},${features[2].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[2];
        const testPage = `${baseURL}${features[2].path}${miloLibs}${features[1].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(
                await studio.getCard(data.cardid, 'ahtrybuywidget-triple'),
            ).toBeVisible();
            await (
                await studio.getCard(data.cardid, 'ahtrybuywidget-triple')
            ).dblclick();
            await expect(await studio.editorPanel).toBeVisible();
        });

        await test.step('step-3: Edit background color field', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorBackgroundColor),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorBackgroundColor),
            ).toHaveAttribute('value', data.originalBgColor);
            await studio.editorPanel
                .locator(studio.editorBackgroundColor)
                .click();
            await page
                .getByRole('option', { name: data.updatedBgColor })
                .click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Validate background color of the card', async () => {
            await expect(
                await studio.getCard(data.cardid, 'ahtrybuywidget-triple'),
            ).not.toHaveAttribute('background-color', data.originalBgColor);
        });

        await test.step('step-5: Edit background color field back to gray', async () => {
            await studio.editorPanel
                .locator(studio.editorBackgroundColor)
                .click();
            await page
                .getByRole('option', { name: data.originalBgColor })
                .click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Validate original background color of the card', async () => {
            await expect(
                await studio.getCard(data.cardid, 'ahtrybuywidget-triple'),
            ).toHaveAttribute('background-color', data.originalBgColor);
        });
    });

    // @studio-try-buy-widget-edit-bg-color - Validate editing border color for try buy widget card in mas studio
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
                await studio.getCard(data.cardid, 'ahtrybuywidget-triple'),
            ).toBeVisible();
            await (
                await studio.getCard(data.cardid, 'ahtrybuywidget-triple')
            ).dblclick();
            await expect(await studio.editorPanel).toBeVisible();
        });

        await test.step('step-3: Edit border color field', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorBorderColor),
            ).toBeVisible();
            await studio.editorPanel.locator(studio.editorBorderColor).click();
            await page
                .getByRole('option', { name: data.updatedBorderColor })
                .click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Validate border color of the card', async () => {
            await expect(
                await studio.getCard(data.cardid, 'ahtrybuywidget-triple'),
            ).toHaveCSS('border-top-color', data.updatedBorderCSSColor);
            await expect(
                await studio.getCard(data.cardid, 'ahtrybuywidget-triple'),
            ).toHaveCSS('border-bottom-color', data.updatedBorderCSSColor);
            await expect(
                await studio.getCard(data.cardid, 'ahtrybuywidget-triple'),
            ).toHaveCSS('border-left-color', data.updatedBorderCSSColor);
            await expect(
                await studio.getCard(data.cardid, 'ahtrybuywidget-triple'),
            ).toHaveCSS('border-right-color', data.updatedBorderCSSColor);
        });

        await test.step('step-5: Edit border color field back to gray', async () => {
            await studio.editorPanel.locator(studio.editorBorderColor).click();
            await page
                .getByRole('option', { name: data.originalBorderColor })
                .click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Validate original border color of the card', async () => {
            await expect(
                await studio.getCard(data.cardid, 'ahtrybuywidget-triple'),
            ).toHaveCSS('border-top-color', data.originalBorderCSSColor);
            await expect(
                await studio.getCard(data.cardid, 'ahtrybuywidget-triple'),
            ).toHaveCSS('border-bottom-color', data.originalBorderCSSColor);
            await expect(
                await studio.getCard(data.cardid, 'ahtrybuywidget-triple'),
            ).toHaveCSS('border-left-color', data.originalBorderCSSColor);
            await expect(
                await studio.getCard(data.cardid, 'ahtrybuywidget-triple'),
            ).toHaveCSS('border-right-color', data.originalBorderCSSColor);
        });
    });

    // @studio-try-buy-widget-edit-description - Validate edit description field for try buy widget card in mas studio
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
                await studio.getCard(data.cardid, 'ahtrybuywidget-triple'),
            ).toBeVisible();
            await (
                await studio.getCard(data.cardid, 'ahtrybuywidget-triple')
            ).dblclick();
            await expect(await studio.editorPanel).toBeVisible();
        });

        await test.step('step-3: Edit description field', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorDescription),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorDescription),
            ).toContainText(data.description);
            await studio.editorPanel
                .locator(studio.editorDescription)
                .fill(data.updatedDescription);
        });

        await test.step('step-4: Validate update in description field of Editor panel', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorDescription),
            ).toContainText(data.updatedDescription);
        });

        await test.step('step-5: Validate update on the description of card', async () => {
            await expect(await trybuywidget.cardDescription).toHaveText(
                data.updatedDescription,
            );
        });
    });

    // @studio-try-buy-widget-edit-mnemonic - Validate edit mnemonic field for try buy widget card in mas studio
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
                await studio.getCard(data.cardid, 'ahtrybuywidget-triple'),
            ).toBeVisible();
            await (
                await studio.getCard(data.cardid, 'ahtrybuywidget-triple')
            ).dblclick();
            await expect(await studio.editorPanel).toBeVisible();
        });

        await test.step('step-3: Edit mnemonic URL field', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorIconURL),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorIconURL),
            ).toHaveValue(data.iconURL);
            await studio.editorPanel
                .locator(studio.editorIconURL)
                .fill(data.newIconURL);
        });

        await test.step('step-4: Validate edited mnemonic field in Editor panel', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorIconURL),
            ).toHaveValue(data.newIconURL);
        });

        await test.step('step-5: Validate edited mnemonic on the card', async () => {
            await expect(await trybuywidget.cardIcon).toHaveAttribute(
                'src',
                data.newIconURL,
            );
        });
    });

    // @studio-try-buy-widget-edit-image - Validate edit background image field for single try buy widjet card in mas studio
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
                await studio.getCard(data.cardid, 'ahtrybuywidget-single'),
            ).toBeVisible();
            await (
                await studio.getCard(data.cardid, 'ahtrybuywidget-single')
            ).dblclick();
            await expect(await studio.editorPanel).toBeVisible();
        });

        await test.step('step-3: Remove background URL field', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorBackgroundImage),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorBackgroundImage),
            ).toHaveValue(data.backgroundURL);
            await studio.editorPanel
                .locator(studio.editorBackgroundImage)
                .fill('');
        });

        await test.step('step-4: Validate edited background image url field in Editor panel', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorBackgroundImage),
            ).toHaveValue('');
        });

        await test.step('step-5: Validate image is removed from the card', async () => {
            await expect(await trybuywidget.cardImage).not.toBeVisible();
        });

        await test.step('step-6: Enter new value in the background URL field', async () => {
            await studio.editorPanel
                .locator(studio.editorBackgroundImage)
                .fill(data.newBackgroundURL);
        });

        await test.step('step-7: Validate edited background image url field in Editor panel', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorBackgroundImage),
            ).toHaveValue(data.newBackgroundURL);
        });

        await test.step('step-8: Validate new image on the card', async () => {
            await expect(await trybuywidget.cardImage).toBeVisible();
            await expect(await trybuywidget.cardImage).toHaveAttribute(
                'src',
                data.newBackgroundURL,
            );
        });
    });

    // @studio-try-buy-widget-edit-price - Validate editing price field for try buy widjet card in mas studio
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
                await studio.getCard(data.cardid, 'ahtrybuywidget-triple'),
            ).toBeVisible();
            await (
                await studio.getCard(data.cardid, 'ahtrybuywidget-triple')
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
            await expect(
                await studio.editorPanel.locator(studio.editorPrices),
            ).toContainText(data.abmText);
        });

        await test.step('step-5: Validate edited price field on the card', async () => {
            await expect(await trybuywidget.cardPriceSlot).toBeVisible();
            await expect(await trybuywidget.cardPrice).toBeVisible();
            await expect(await trybuywidget.cardPriceSlot).toContainText(
                data.abmText,
            );
            await expect(await trybuywidget.cardPrice).toContainText(
                data.newPrice,
            );
        });
    });

    // @studio-try-buy-widget-edit-cta - Validate edit CTA for try buy widget card in mas studio
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
                await studio.getCard(data.cardid, 'ahtrybuywidget-triple'),
            ).toBeVisible();
            await (
                await studio.getCard(data.cardid, 'ahtrybuywidget-triple')
            ).dblclick();
            await expect(await studio.editorPanel).toBeVisible();
        });

        await test.step('step-3: Edit CTA field', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorFooter),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorFooter),
            ).toContainText(data.ctaText);

            await (
                await studio.editorPanel.locator(studio.editorCTAClassSecondary)
            ).dblclick();
            await expect(await ost.checkoutTab).toBeVisible();
            await expect(await ost.workflowMenu).toBeVisible();
            await expect(await ost.ctaTextMenu).toBeEnabled();
            await expect(async () => {
                await ost.ctaTextMenu.click();
                await expect(
                    page.locator('div[role="option"]', {
                        hasText: `${data.newCtaText}`,
                    }),
                ).toBeVisible({
                    timeout: 500,
                });
            }).toPass();
            await page
                .locator('div[role="option"]', {
                    hasText: `${data.newCtaText}`,
                })
                .click();
            await ost.checkoutLinkUse.click();
        });

        await test.step('step-4: Validate edited CTA in Editor panel', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorFooter),
            ).toContainText(data.newCtaText);
        });

        await test.step('step-5: Validate edited price field on the card', async () => {
            await expect(await trybuywidget.cardCTASlot).toContainText(
                data.newCtaText,
            );
            await expect(await trybuywidget.cardCTA.first()).toHaveAttribute(
                'data-wcs-osi',
                data.osi,
            );
            await expect(await trybuywidget.cardCTA.first()).toHaveAttribute(
                'is',
                'checkout-button',
            );

            const CTAhref = await trybuywidget.cardCTA
                .first()
                .getAttribute('data-href');
            let workflowStep = decodeURI(CTAhref).split('?')[0];
            let searchParams = new URLSearchParams(
                decodeURI(CTAhref).split('?')[1],
            );

            expect(workflowStep).toContain(data.ucv3);
            expect(searchParams.get('co')).toBe(data.country);
            expect(searchParams.get('ctx')).toBe(data.ctx);
            expect(searchParams.get('lang')).toBe(data.lang);
            expect(searchParams.get('cli')).toBe(data.client);
        });
    });

    // @studio-try-buy-widget-change-to-slice - Validate card variant change from AHome try-buy-widget to ccd slice
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
                await studio.getCard(data.cardid, 'ahtrybuywidget-triple'),
            ).toBeVisible();
            await (
                await studio.getCard(data.cardid, 'ahtrybuywidget-triple')
            ).dblclick();
            await expect(await studio.editorPanel).toBeVisible();
        });

        await test.step('step-3: Edit card variant', async () => {
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
        });

        await test.step('step-4: Validate editor fields rendering after variant change', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorVariant),
            ).toHaveAttribute('default-value', 'ccd-slice');
            await expect(
                await studio.editorPanel.locator(studio.editorSize),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorTitle),
            ).not.toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorSubtitle),
            ).not.toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorBadge),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorDescription),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorIconURL),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorBorderColor),
            ).not.toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorBackgroundColor),
            ).not.toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorBackgroundImage),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorPrices),
            ).not.toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorFooter),
            ).toBeVisible();
        });

        await test.step('step-5: Validate card variant change', async () => {
            await expect(
                await studio.getCard(data.cardid, 'slice'),
            ).toBeVisible();
            await expect(
                await studio.getCard(data.cardid, 'ahtrybuywidget-triple'),
            ).not.toBeVisible();
            await expect(await slice.cardDescription).toBeVisible();
            await expect(await slice.cardIcon).toBeVisible();
            await expect(await slice.cardCTA.first()).toBeVisible();
            await expect(await slice.cardCTA.first()).toHaveAttribute(
                'data-wcs-osi',
                data.osi,
            );
            await expect(await slice.cardCTA.first()).toHaveAttribute(
                'is',
                'checkout-button',
            );
        });
    });

    // @studio-try-buy-widget-change-to-suggested - Validate card variant change from AHome try-buy-widget to ccd suggested
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
                await studio.getCard(data.cardid, 'ahtrybuywidget-triple'),
            ).toBeVisible();
            await (
                await studio.getCard(data.cardid, 'ahtrybuywidget-triple')
            ).dblclick();
            await expect(await studio.editorPanel).toBeVisible();
        });

        await test.step('step-3: Edit card variant', async () => {
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
        });

        await test.step('step-4: Validate editor fields rendering after variant change', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorVariant),
            ).toHaveAttribute('default-value', 'ccd-suggested');
            await expect(
                await studio.editorPanel.locator(studio.editorSize),
            ).not.toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorTitle),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorSubtitle),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorBadge),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorDescription),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorIconURL),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorBorderColor),
            ).not.toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorBackgroundColor),
            ).not.toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorBackgroundImage),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorPrices),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorFooter),
            ).toBeVisible();
        });

        await test.step('step-5: Validate card variant change', async () => {
            await expect(
                await studio.getCard(data.cardid, 'suggested'),
            ).toBeVisible();
            await expect(
                await studio.getCard(data.cardid, 'ahtrybuywidget-triple'),
            ).not.toBeVisible();
            await expect(await suggested.cardTitle).toBeVisible();
            await expect(await suggested.cardDescription).toBeVisible();
            await expect(await suggested.cardPrice).toBeVisible();
            await expect(await suggested.cardIcon).toBeVisible();
            await expect(await suggested.cardCTA.first()).toBeVisible();
            await expect(await suggested.cardCTA.first()).toHaveAttribute(
                'data-wcs-osi',
                data.osi,
            );
            await expect(await suggested.cardCTA.first()).toHaveAttribute(
                'is',
                'checkout-button',
            );
        });
    });

    // @studio-try-buy-widget-add-osi - Validate adding OSI for try-buy-widget card in mas studio
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
                await studio.getCard(data.cardid, 'ahtrybuywidget-triple'),
            ).toBeVisible();
            await (
                await studio.getCard(data.cardid, 'ahtrybuywidget-triple')
            ).dblclick();
            await expect(await studio.editorPanel).toBeVisible();
        });

        await test.step('step-3: Choose OSI in OST', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorOSI),
            ).toBeVisible();
            await expect(await studio.editorTags).toBeVisible();
            await expect(await studio.editorTags).toHaveAttribute(
                'value',
                new RegExp(`${data.productCodeTag}`),
            );
            await expect(await studio.editorOSI).not.toContainText(data.osi);
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

            await (await studio.editorOSIButton).click();
            await expect(await ost.searchField).toBeVisible();
            await ost.searchField.fill(data.osi);
            await (await ost.nextButton).click();
            await expect(await ost.priceUse).toBeVisible();
            await ost.priceUse.click();
        });

        await test.step('step-4: Validate osi value in Editor panel', async () => {
            await expect(await studio.editorOSI).toContainText(data.osi);
        });

        await test.step('step-5: Validate tags update', async () => {
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
        });
    });

    // @studio-try-buy-widget-edit-osi - Validate changing OSI for try-buy-widget card in mas studio
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
        });

        await test.step('step-4: Validate osi value in Editor panel', async () => {
            await expect(await studio.editorOSI).toContainText(data.newosi);
        });

        await test.step('step-5: Validate tags update', async () => {
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

    // @studio-try-buy-widget-edit-cta-variant - Validate edit CTA variant for try-buy-widget card in mas studio
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
                await studio.getCard(data.cardid, 'ahtrybuywidget-triple'),
            ).toBeVisible();
            await (
                await studio.getCard(data.cardid, 'ahtrybuywidget-triple')
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
            expect(
                await webUtil.verifyCSS(
                    await trybuywidget.cardCTA.first(),
                    data.ctaCSS,
                ),
            ).toBeTruthy();
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
        });

        await test.step('step-4: Validate edited CTA variant in Editor panel', async () => {
            await expect(await studio.editorCTA.first()).toHaveClass(
                data.newVariant,
            );
            await expect(await studio.editorCTA.first()).not.toHaveClass(
                data.variant,
            );
        });

        await test.step('step-5: Validate edited CTA on the card', async () => {
            expect(
                await webUtil.verifyCSS(
                    await trybuywidget.cardCTA.first(),
                    data.newCtaCSS,
                ),
            ).toBeTruthy();
            await expect(await trybuywidget.cardCTA.first()).toHaveAttribute(
                'data-wcs-osi',
                data.osi,
            );
            await expect(await trybuywidget.cardCTA.first()).toHaveAttribute(
                'is',
                'checkout-button',
            );
        });
    });

    // @studio-try-buy-widget-edit-cta-checkout-params - Validate edit CTA checkout params for try-buy-widget card in mas studio
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
                await studio.getCard(data.cardid, 'ahtrybuywidget-triple'),
            ).toBeVisible();
            await (
                await studio.getCard(data.cardid, 'ahtrybuywidget-triple')
            ).dblclick();
            await expect(await studio.editorPanel).toBeVisible();
        });

        await test.step('step-3: Edit CTA checkout params', async () => {
            await expect(
                await studio.editorPanel
                    .locator(studio.editorFooter)
                    .locator(studio.linkEdit),
            ).toBeVisible();
            await expect(await studio.editorCTA.first()).toBeVisible();
            await studio.editorCTA.first().click();
            await studio.editorPanel
                .locator(studio.editorFooter)
                .locator(studio.linkEdit)
                .click();
            await expect(await studio.checkoutParameters).toBeVisible();
            await expect(await studio.linkSave).toBeVisible();
            await studio.checkoutParameters.fill(data.checkoutParams);
            await studio.linkSave.click();
        });

        await test.step('step-4: Validate edited CTA on the card', async () => {
            await expect(await trybuywidget.cardCTA.first()).toHaveAttribute(
                'data-wcs-osi',
                data.osi,
            );
            await expect(await trybuywidget.cardCTA.first()).toHaveAttribute(
                'is',
                'checkout-button',
            );
            const CTAhref = await trybuywidget.cardCTA
                .first()
                .getAttribute('data-href');
            expect(await CTAhref).toContain(data.checkoutParams);
        });
    });
});
