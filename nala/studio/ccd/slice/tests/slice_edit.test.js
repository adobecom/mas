import { expect, test } from '@playwright/test';
import StudioPage from '../../../studio.page.js';
import EditorPage from '../../../editor.page.js';
import CCDSliceSpec from '../specs/slice_edit.spec.js';
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
let ost;
let trybuywidget;
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

test.describe('M@S Studio CCD Slice card test suite', () => {
    // @studio-slice-variant-change-to-suggested - Validate card variant change from slice to suggested
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
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute(
                'variant',
                'ccd-slice',
            );
            await expect(await studio.getCard(data.cardid)).toHaveAttribute(
                'size',
                'wide',
            );
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit card variant', async () => {
            await expect(await editor.variant).toBeVisible();
            await expect(await editor.variant).toHaveAttribute(
                'default-value',
                'ccd-slice',
            );
            await editor.variant.locator('sp-picker').first().click();
            await page.getByRole('option', { name: 'suggested' }).click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Validate editor fields rendering after variant change', async () => {
            await expect(await editor.variant).toHaveAttribute(
                'default-value',
                'ccd-suggested',
            );
            await expect(await editor.size).not.toBeVisible();
            await expect(await editor.title).toBeVisible();
            await expect(await editor.subtitle).toBeVisible();
            await expect(await editor.badge).toBeVisible();
            await expect(await editor.description).toBeVisible();
            await expect(await editor.iconURL).toBeVisible();
            await expect(await editor.backgroundImage).toBeVisible();
            await expect(await editor.prices).toBeVisible();
            await expect(await editor.footer).toBeVisible();
        });

        await test.step('step-5: Validate card variant change', async () => {
            await expect(await studio.getCard(data.cardid)).not.toHaveAttribute(
                'variant',
                'ccd-slice',
            );
            await expect(await studio.getCard(data.cardid)).toHaveAttribute(
                'variant',
                'ccd-suggested',
            );
            await expect(
                await (
                    await studio.getCard(data.cardid)
                ).locator(suggested.cardCTA),
            ).toHaveAttribute('data-wcs-osi', data.osi);
            await expect(
                await (
                    await studio.getCard(data.cardid)
                ).locator(suggested.cardCTA),
            ).toHaveAttribute('is', 'checkout-button');
        });
    });

    // @studio-slice-edit-size - Validate edit size for slice card in mas studio
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
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute(
                'variant',
                'ccd-slice',
            );
            await expect(await studio.getCard(data.cardid)).toHaveAttribute(
                'size',
                'wide',
            );
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit size field', async () => {
            await expect(await editor.size).toBeVisible();
            await expect(await editor.size).toHaveAttribute('value', 'wide');
            await editor.size.click();
            await page.getByRole('option', { name: 'default' }).click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Validate new size of the card', async () => {
            await expect(await studio.getCard(data.cardid)).not.toHaveAttribute(
                'size',
                'wide',
            );
        });

        await test.step('step-5: Edit size field back', async () => {
            await editor.size.click();
            await page.getByRole('option', { name: 'wide' }).click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-6: Validate new size of the card', async () => {
            await expect(await studio.getCard(data.cardid)).toHaveAttribute(
                'size',
                'wide',
            );
        });
    });

    // @studio-slice-edit-badge - Validate edit badge field for slice card in mas studio
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
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute(
                'variant',
                'ccd-slice',
            );
            await expect(await studio.getCard(data.cardid)).toHaveAttribute(
                'size',
                'wide',
            );
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Remove badge field', async () => {
            await expect(await editor.badge).toBeVisible();
            await expect(await editor.badge).toHaveValue(data.badge);
            await editor.badge.fill('');
        });

        await test.step('step-4: Validate edited badge field in Editor panel', async () => {
            await expect(await editor.badge).toHaveValue('');
        });

        await test.step('step-5: Validate badge is removed from the card', async () => {
            await expect(await slice.cardBadge).not.toBeVisible();
        });

        await test.step('step-6: Enter new value in the badge field', async () => {
            await editor.badge.fill(data.newBadge);
        });

        await test.step('step-7: Validate edited badge field in Editor panel', async () => {
            await expect(await editor.badge).toHaveValue(data.newBadge);
        });

        await test.step('step-8: Validate new badge on the card', async () => {
            await expect(await slice.cardBadge).toBeVisible();
            await expect(await slice.cardBadge).toHaveText(data.newBadge);
        });
    });

    // @studio-slice-edit-description - Validate edit description field for slice card in mas studio
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
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute(
                'variant',
                'ccd-slice',
            );
            await expect(await studio.getCard(data.cardid)).toHaveAttribute(
                'size',
                'wide',
            );
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit description field', async () => {
            await expect(await editor.description).toBeVisible();
            await expect(await editor.description).toContainText(
                data.description,
            );
            await editor.description.fill(data.newDescription);
        });

        await test.step('step-4: Validate edited description field in Editor panel', async () => {
            await expect(await editor.description).toContainText(
                data.newDescription,
            );
        });

        await test.step('step-5: Validate edited description on the card', async () => {
            await expect(await slice.cardDescription).toHaveText(
                data.newDescription,
            );
        });
    });

    // @studio-slice-edit-mnemonic - Validate edit mnemonic URL field for slice card in mas studio
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
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute(
                'variant',
                'ccd-slice',
            );
            await expect(await studio.getCard(data.cardid)).toHaveAttribute(
                'size',
                'wide',
            );
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit mnemonic URL field', async () => {
            await expect(await editor.iconURL).toBeVisible();
            await expect(await editor.iconURL).toHaveValue(data.iconURL);
            await editor.iconURL.fill(data.newIconURL);
        });

        await test.step('step-4: Validate edited mnemonic URL field in Editor panel', async () => {
            await expect(await editor.iconURL).toHaveValue(data.newIconURL);
        });

        await test.step('step-5: Validate edited mnemonic src on the card', async () => {
            await expect(await slice.cardIcon).toHaveAttribute(
                'src',
                data.newIconURL,
            );
        });
    });

    // @studio-slice-edit-image - Validate edit background image field for slice card in mas studio
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
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute(
                'variant',
                'ccd-slice',
            );
            await expect(await studio.getCard(data.cardid)).toHaveAttribute(
                'size',
                'wide',
            );
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Remove background URL field', async () => {
            await expect(await editor.backgroundImage).toBeVisible();
            await expect(await editor.backgroundImage).toHaveValue(
                data.backgroundURL,
            );
            await editor.backgroundImage.fill('');
        });

        await test.step('step-4: Validate edited background image url field in Editor panel', async () => {
            await expect(await editor.backgroundImage).toHaveValue('');
        });

        await test.step('step-5: Validate image is removed from the card', async () => {
            await expect(await slice.cardImage).not.toBeVisible();
        });

        await test.step('step-6: Enter new value in the background URL field', async () => {
            await editor.backgroundImage.fill(data.newBackgroundURL);
        });

        await test.step('step-7: Validate edited background image url field in Editor panel', async () => {
            await expect(await editor.backgroundImage).toHaveValue(
                data.newBackgroundURL,
            );
        });

        await test.step('step-8: Validate new image on the card', async () => {
            await expect(await slice.cardImage).toBeVisible();
            await expect(await slice.cardImage).toHaveAttribute(
                'src',
                data.newBackgroundURL,
            );
        });
    });

    // @studio-slice-edit-price - Validate edit price field for slice card in mas studio
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
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute(
                'variant',
                'ccd-slice',
            );
            await expect(await studio.getCard(data.cardid)).toHaveAttribute(
                'size',
                'wide',
            );
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit price field', async () => {
            await expect(await editor.description).toBeVisible();
            await expect(await editor.description).toContainText(data.price);
            await expect(await editor.description).not.toContainText(
                data.newPrice,
            );
            await expect(await editor.description).toContainText(
                data.strikethroughPrice,
            );
            await expect(await editor.description).not.toContainText(
                data.newStrikethroughPrice,
            );

            await editor.description.locator(editor.regularPrice).dblclick();
            await expect(await ost.price).toBeVisible();
            await expect(await ost.priceUse).toBeVisible();
            await expect(await ost.unitCheckbox).toBeVisible();
            await ost.unitCheckbox.click();
            await ost.priceUse.click();
        });

        await test.step('step-4: Validate edited price field in Editor panel', async () => {
            await expect(await editor.description).toContainText(data.newPrice);
            await expect(await editor.description).toContainText(
                data.newStrikethroughPrice,
            );
        });

        await test.step('step-5: Validate edited price field on the card', async () => {
            await expect(
                await slice.cardDescription.locator(slice.cardPrice),
            ).toContainText(data.newPrice);
            await expect(
                await slice.cardDescription.locator(
                    slice.cardPriceStrikethrough,
                ),
            ).toContainText(data.newStrikethroughPrice);
        });
    });

    // @studio-slice-edit-cta-ost - Validate edit CTA for slice card in mas studio
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
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute(
                'variant',
                'ccd-slice',
            );
            await expect(await studio.getCard(data.cardid)).toHaveAttribute(
                'size',
                'wide',
            );
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit CTA field', async () => {
            await expect(await editor.footer).toBeVisible();
            await expect(await editor.footer).toContainText(data.ctaText);

            await editor.CTA.dblclick();
            await expect(await ost.checkoutTab).toBeVisible();
            await expect(await ost.workflowMenu).toBeVisible();
            await expect(await ost.ctaTextMenu).toBeEnabled();
            await expect(await ost.checkoutLinkUse).toBeVisible();
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
            await expect(await editor.footer).toContainText(data.newCtaText);
        });

        await test.step('step-5: Validate edited CTA on the card', async () => {
            await expect(await slice.cardCTA).toContainText(data.newCtaText);
            await expect(await slice.cardCTA).toHaveAttribute(
                'data-wcs-osi',
                data.osi,
            );
            await expect(await slice.cardCTA).toHaveAttribute(
                'is',
                'checkout-button',
            );

            const CTAhref = await slice.cardCTA.getAttribute('data-href');
            let workflowStep = decodeURI(CTAhref).split('?')[0];
            let searchParams = new URLSearchParams(
                decodeURI(CTAhref).split('?')[1],
            );

            expect(workflowStep).toContain(data.ucv3);
            expect(searchParams.get('co')).toBe(data.country);
            expect(searchParams.get('ctx')).toBe(data.ctx);
            expect(searchParams.get('lang')).toBe(data.lang);
            expect(searchParams.get('cli')).toBe(data.client);
            expect(searchParams.get('apc')).toBe(data.promo);
        });
    });

    // @studio-slice-edit-cta-label - Validate edit CTA label for slice card in mas studio
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
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute(
                'variant',
                'ccd-slice',
            );
            await expect(await studio.getCard(data.cardid)).toHaveAttribute(
                'size',
                'wide',
            );
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit CTA label', async () => {
            await expect(
                await editor.footer.locator(editor.linkEdit),
            ).toBeVisible();
            await expect(await editor.CTA).toBeVisible();
            await expect(await editor.footer).toContainText(data.ctaText);
            await editor.CTA.click();
            await editor.footer.locator(editor.linkEdit).click();
            await expect(await editor.linkText).toBeVisible();
            await expect(await editor.linkSave).toBeVisible();
            await expect(await editor.linkText).toHaveValue(data.ctaText);
            await editor.linkText.fill(data.newCtaText);
            await editor.linkSave.click();
        });

        await test.step('step-4: Validate edited CTA label in Editor panel', async () => {
            await expect(await editor.footer).toContainText(data.newCtaText);
        });

        await test.step('step-5: Validate edited CTA on the card', async () => {
            await expect(await slice.cardCTA).toContainText(data.newCtaText);
            await expect(await slice.cardCTA).toHaveAttribute(
                'data-wcs-osi',
                data.osi,
            );
            await expect(await slice.cardCTA).toHaveAttribute(
                'is',
                'checkout-button',
            );
        });
    });

    // @studio-slice-edit-price-promo - Validate edit price promo for slice card in mas studio
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
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute(
                'variant',
                'ccd-slice',
            );
            await expect(await studio.getCard(data.cardid)).toHaveAttribute(
                'size',
                'wide',
            );
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit promo field', async () => {
            await expect(
                await editor.description.locator(editor.regularPrice),
            ).toHaveAttribute('data-promotion-code', data.promo);
            await expect(
                await slice.cardDescription.locator(slice.cardPriceSlot),
            ).toHaveAttribute('data-promotion-code', data.promo);
            await editor.description.locator(editor.regularPrice).dblclick();
            await expect(await ost.promoField).toBeVisible();
            await expect(await ost.promoLabel).toBeVisible();
            await expect(await ost.promoLabel).toContainText(data.promo);
            await expect(await ost.promoField).toHaveValue(data.promo);

            await ost.promoField.fill(data.newPromo);
            await expect(await ost.promoLabel).toContainText(data.newPromo);
            await expect(await ost.promoField).toHaveValue(data.newPromo);
            await ost.priceUse.click();
        });

        await test.step('step-4: Validate promo change in Editor panel', async () => {
            await expect(
                await editor.description.locator(editor.regularPrice),
            ).toHaveAttribute('data-promotion-code', data.newPromo);
        });

        await test.step('step-5: Validate edited price promo on the card', async () => {
            await expect(
                await slice.cardDescription.locator(slice.cardPriceSlot),
            ).toHaveAttribute('data-promotion-code', data.newPromo);
        });

        await test.step('step-6: Remove promo', async () => {
            await editor.description.locator(editor.regularPrice).dblclick();
            await expect(await ost.promoField).toBeVisible();
            await expect(await ost.promoLabel).toBeVisible();

            await ost.promoField.fill('');
            await expect(await ost.promoLabel).toContainText('no promo');
            await expect(await ost.promoField).toHaveValue('');
            await ost.priceUse.click();
        });

        await test.step('step-7: Validate promo removal in Editor panel', async () => {
            await expect(
                await editor.description.locator(editor.regularPrice),
            ).not.toHaveAttribute('data-promotion-code', data.newPromo);
        });

        await test.step('step-8: Validate removed price promo on the card', async () => {
            await expect(
                await slice.cardDescription.locator(slice.cardPriceSlot),
            ).not.toHaveAttribute('data-promotion-code', data.newPromo);
        });
    });

    // @studio-slice-edit-cta-promo - Validate edit cta promo for slice card in mas studio
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
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute(
                'variant',
                'ccd-slice',
            );
            await expect(await studio.getCard(data.cardid)).toHaveAttribute(
                'size',
                'wide',
            );
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit CTA promo field', async () => {
            await expect(await editor.CTA).toHaveAttribute(
                'data-promotion-code',
                data.promo,
            );
            await expect(await slice.cardCTA).toHaveAttribute(
                'data-promotion-code',
                data.promo,
            );

            const CTAhref = await slice.cardCTA.getAttribute('data-href');
            let workflowStep = decodeURI(CTAhref).split('?')[0];
            let searchParams = new URLSearchParams(
                decodeURI(CTAhref).split('?')[1],
            );

            expect(workflowStep).toContain(data.ucv3);
            expect(searchParams.get('co')).toBe(data.country);
            expect(searchParams.get('ctx')).toBe(data.ctx);
            expect(searchParams.get('lang')).toBe(data.lang);
            expect(searchParams.get('cli')).toBe(data.client);
            expect(searchParams.get('apc')).toBe(data.promo);

            await editor.CTA.dblclick();
            await expect(await ost.checkoutTab).toBeVisible();
            await expect(await ost.promoField).toBeVisible();
            await expect(await ost.promoLabel).toBeVisible();
            await expect(await ost.promoLabel).toContainText(data.promo);
            await expect(await ost.promoField).toHaveValue(data.promo);

            await ost.promoField.fill(data.newPromo);
            expect(await ost.promoLabel).toContainText(data.newPromo);
            await expect(await ost.promoField).toHaveValue(data.newPromo);
            await ost.checkoutLinkUse.click();
        });

        await test.step('step-4: Validate edited CTA promo in Editor panel', async () => {
            await expect(await editor.CTA).toHaveAttribute(
                'data-promotion-code',
                data.newPromo,
            );
        });

        await test.step('step-5: Validate edited CTA promo on the card', async () => {
            const newCTA = await slice.cardCTA;
            await expect(newCTA).toHaveAttribute(
                'data-promotion-code',
                data.newPromo,
            );
            await expect(newCTA).toHaveAttribute(
                'data-href',
                new RegExp(`${data.ucv3}`),
            );
            await expect(newCTA).toHaveAttribute(
                'data-href',
                new RegExp(`co=${data.country}`),
            );
            await expect(newCTA).toHaveAttribute(
                'data-href',
                new RegExp(`ctx=${data.ctx}`),
            );
            await expect(newCTA).toHaveAttribute(
                'data-href',
                new RegExp(`lang=${data.lang}`),
            );
            await expect(newCTA).toHaveAttribute(
                'data-href',
                new RegExp(`cli=${data.client}`),
            );
            await expect(newCTA).toHaveAttribute(
                'data-href',
                new RegExp(`apc=${data.newPromo}`),
            );
        });

        await test.step('step-6: Remove promo', async () => {
            await editor.CTA.dblclick();
            await expect(await ost.checkoutTab).toBeVisible();
            await expect(await ost.promoField).toBeVisible();
            await expect(await ost.promoLabel).toBeVisible();

            await ost.promoField.fill('');
            expect(await ost.promoLabel).toContainText('no promo');
            await expect(await ost.promoField).toHaveValue('');
            await ost.checkoutLinkUse.click();
        });

        await test.step('step-7: Validate promo removed in Editor panel', async () => {
            await expect(await editor.CTA).not.toHaveAttribute(
                'data-promotion-code',
            );
        });

        await test.step('step-8: Validate CTA promo removed from the card', async () => {
            await expect(await slice.cardCTA).not.toHaveAttribute(
                'data-promotion-code',
            );
            await expect(await slice.cardCTA).not.toHaveAttribute(
                'data-href',
                /apc=/,
            );
        });
    });

    // @studio-slice-variant-change-to-trybuywidget - Validate card variant change from slice to AHome try-buy-widget
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
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute(
                'variant',
                'ccd-slice',
            );
            await expect(await studio.getCard(data.cardid)).toHaveAttribute(
                'size',
                'wide',
            );
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit card variant', async () => {
            await expect(await editor.variant).toBeVisible();
            await expect(await editor.variant).toHaveAttribute(
                'default-value',
                'ccd-slice',
            );
            await editor.variant.locator('sp-picker').first().click();
            await page.getByRole('option', { name: 'try buy widget' }).click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Validate editor fields rendering after variant change', async () => {
            await expect(await editor.variant).toHaveAttribute(
                'default-value',
                'ah-try-buy-widget',
            );
            await expect(await editor.size).toBeVisible();
            await expect(await editor.title).toBeVisible();
            await expect(await editor.subtitle).not.toBeVisible();
            await expect(await editor.badge).not.toBeVisible();
            await expect(await editor.description).toBeVisible();
            await expect(await editor.iconURL).toBeVisible();
            await expect(await editor.borderColor).toBeVisible();
            await expect(await editor.backgroundColor).toBeVisible();
            await expect(await editor.backgroundImage).toBeVisible();
            await expect(await editor.prices).toBeVisible();
            await expect(await editor.footer).toBeVisible();
        });

        await test.step('step-5: Validate card variant change', async () => {
            await expect(await studio.getCard(data.cardid)).toHaveAttribute(
                'variant',
                'ah-try-buy-widget',
            );
            await expect(await studio.getCard(data.cardid)).not.toHaveAttribute(
                'variant',
                'ccd-slice',
            );
            await expect(await trybuywidget.cardTitle).toBeVisible();
            await expect(await trybuywidget.cardDescription).toBeVisible();
            await expect(await trybuywidget.cardPrice).toBeVisible();
            await expect(await trybuywidget.cardIcon).toBeVisible();
            await expect(await trybuywidget.cardCTA).toBeVisible();
            await expect(await trybuywidget.cardCTA).toHaveAttribute(
                'data-wcs-osi',
                data.osi,
            );
            await expect(await trybuywidget.cardCTA).toHaveAttribute(
                'is',
                'checkout-button',
            );
        });
    });

    // @studio-slice-add-osi - Validate adding OSI for slice card in mas studio
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
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute(
                'variant',
                'ccd-slice',
            );
            await expect(await studio.getCard(data.cardid)).toHaveAttribute(
                'size',
                'wide',
            );
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Choose OSI in OST', async () => {
            await expect(await editor.OSI).toBeVisible();
            await expect(await editor.tags).toBeVisible();
            await expect(await editor.tags).toHaveAttribute(
                'value',
                new RegExp(`${data.productCodeTag}`),
            );
            await expect(await editor.OSI).not.toContainText(data.osi);
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
            await expect(await editor.tags).toHaveAttribute(
                'value',
                new RegExp(`${data.productCodeTag}`),
            );
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
        });
    });

    // @studio-slice-edit-osi - Validate changing OSI for slice card in mas studio
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
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute(
                'variant',
                'ccd-slice',
            );
            await expect(await studio.getCard(data.cardid)).not.toHaveAttribute(
                'size',
                'wide',
            );
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Change OSI in OST', async () => {
            await expect(await editor.OSI).toBeVisible();
            await expect(await editor.OSI).toContainText(data.osi);
            await expect(await editor.tags).toBeVisible();
            await expect(await editor.tags).toHaveAttribute(
                'value',
                new RegExp(`${data.productCodeTag}`),
            );
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
            await (await editor.OSIButton).click();
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

    // @studio-slice-edit-cta-variant - Validate edit CTA variant for slice card in mas studio
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
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute(
                'variant',
                'ccd-slice',
            );
            await expect(await studio.getCard(data.cardid)).toHaveAttribute(
                'size',
                'wide',
            );
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit CTA variant', async () => {
            await expect(
                await editor.footer.locator(editor.linkEdit),
            ).toBeVisible();
            await expect(await editor.CTA).toBeVisible();
            await expect(await editor.CTA).toHaveClass(data.variant);
            expect(
                await webUtil.verifyCSS(await slice.cardCTA, data.ctaCSS),
            ).toBeTruthy();
            await editor.CTA.click();
            await editor.footer.locator(editor.linkEdit).click();
            await expect(await editor.linkVariant).toBeVisible();
            await expect(await editor.linkSave).toBeVisible();
            await expect(
                await editor.getLinkVariant(data.newVariant),
            ).toBeVisible();
            await (await editor.getLinkVariant(data.newVariant)).click();
            await editor.linkSave.click();
        });

        await test.step('step-4: Validate edited CTA variant in Editor panel', async () => {
            await expect(await editor.CTA).toHaveClass(data.newVariant);
            await expect(await editor.CTA).not.toHaveClass(data.variant);
        });

        await test.step('step-5: Validate edited CTA on the card', async () => {
            expect(
                await webUtil.verifyCSS(await slice.cardCTA, data.newCtaCSS),
            ).toBeTruthy();
            await expect(await slice.cardCTA).toHaveAttribute(
                'data-wcs-osi',
                data.osi,
            );
            await expect(await slice.cardCTA).toHaveAttribute(
                'is',
                'checkout-button',
            );
        });
    });

    // @studio-slice-edit-cta-checkout-params - Validate edit CTA checkout params for slice card in mas studio
    test(`${features[15].name},${features[15].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[15];
        const testPage = `${baseURL}${features[15].path}${miloLibs}${features[15].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Open card editor', async () => {
            await expect(await studio.getCard(data.cardid)).toBeVisible();
            await expect(await studio.getCard(data.cardid)).toHaveAttribute(
                'variant',
                'ccd-slice',
            );
            await expect(await studio.getCard(data.cardid)).toHaveAttribute(
                'size',
                'wide',
            );
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit CTA checkout parameters', async () => {
            await expect(
                await editor.footer.locator(editor.linkEdit),
            ).toBeVisible();
            await expect(await editor.CTA).toBeVisible();
            await editor.CTA.click();
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
        });

        await test.step('step-4: Validate edited CTA on the card', async () => {
            await expect(await slice.cardCTA).toHaveAttribute(
                'data-wcs-osi',
                data.osi,
            );
            await expect(await slice.cardCTA).toHaveAttribute(
                'is',
                'checkout-button',
            );
            const CTAhref = await slice.cardCTA.getAttribute('data-href');
            let searchParams = new URLSearchParams(
                decodeURI(CTAhref).split('?')[1],
            );
            expect(searchParams.get('mv')).toBe(data.checkoutParams.mv);
            expect(searchParams.get('cs')).toBe(data.checkoutParams.cs);
            expect(searchParams.get('promoid')).toBe(
                data.checkoutParams.promoid,
            );
            expect(searchParams.get('mv2')).toBe(data.checkoutParams.mv2);
        });
    });
});
