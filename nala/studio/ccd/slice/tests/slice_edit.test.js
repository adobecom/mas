import { expect, test } from '@playwright/test';
import StudioPage from '../../../studio.page.js';
import CCDSliceSpec from '../specs/slice_edit.spec.js';
import CCDSlicePage from '../slice.page.js';
import OSTPage from '../../../ost.page.js';

const { features } = CCDSliceSpec;
const miloLibs = process.env.MILO_LIBS || '';

let studio;
let slice;
let ost;

test.beforeEach(async ({ page, browserName }) => {
    test.slow();
    if (browserName === 'chromium') {
        await page.setExtraHTTPHeaders({
            'sec-ch-ua': '"Chromium";v="123", "Not:A-Brand";v="8"',
        });
    }
    studio = new StudioPage(page);
    slice = new CCDSlicePage(page);
    ost = new OSTPage(page);
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
            await expect(
                await studio.getCard(data.cardid, 'slice-wide'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'slice-wide')).dblclick();
            await expect(await studio.editorPanel).toBeVisible();
        });

        await test.step('step-3: Edit card variant', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorVariant),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorVariant),
            ).toHaveAttribute('default-value', 'ccd-slice');
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
                await studio.getCard(data.cardid, 'slice-wide'),
            ).not.toBeVisible();
            await expect(
                await studio.getCard(data.cardid, 'suggested'),
            ).toBeVisible();
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
            await expect(
                await studio.getCard(data.cardid, 'slice-wide'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'slice-wide')).dblclick();
            await expect(await studio.editorPanel).toBeVisible();
        });

        await test.step('step-3: Edit size field', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorSize),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorSize),
            ).toHaveAttribute('value', 'wide');
            await studio.editorPanel.locator(studio.editorSize).click();
            await page.getByRole('option', { name: 'default' }).click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Validate new size of the card', async () => {
            await expect(
                await studio.getCard(data.cardid, 'slice'),
            ).not.toHaveAttribute('size', 'wide');
        });

        await test.step('step-5: Edit size field back', async () => {
            await studio.editorPanel.locator(studio.editorSize).click();
            await page.getByRole('option', { name: 'wide' }).click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-6: Validate new size of the card', async () => {
            await expect(
                await studio.getCard(data.cardid, 'slice-wide'),
            ).toBeVisible();
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
            await expect(
                await studio.getCard(data.cardid, 'slice-wide'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'slice-wide')).dblclick();
            await expect(await studio.editorPanel).toBeVisible();
        });

        await test.step('step-3: Remove badge field', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorBadge),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorBadge),
            ).toHaveValue(data.badge);
            await studio.editorPanel.locator(studio.editorBadge).fill('');
        });

        await test.step('step-4: Validate edited badge field in Editor panel', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorBadge),
            ).toHaveValue('');
        });

        await test.step('step-5: Validate badge is removed from the card', async () => {
            await expect(await slice.cardBadge).not.toBeVisible();
        });

        await test.step('step-6: Enter new value in the badge field', async () => {
            await studio.editorPanel
                .locator(studio.editorBadge)
                .fill(data.newBadge);
        });

        await test.step('step-4: Validate edited badge field in Editor panel', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorBadge),
            ).toHaveValue(data.newBadge);
        });

        await test.step('step-5: Validate badge new badge on the card', async () => {
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
            await expect(
                await studio.getCard(data.cardid, 'slice-wide'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'slice-wide')).dblclick();
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
                .fill(data.newDescription);
        });

        await test.step('step-4: Validate edited background URL field in Editor panel', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorDescription),
            ).toContainText(data.newDescription);
        });

        await test.step('step-5: Validate edited background src on the card', async () => {
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
            await expect(
                await studio.getCard(data.cardid, 'slice-wide'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'slice-wide')).dblclick();
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

        await test.step('step-4: Validate edited mnemonic URL field in Editor panel', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorIconURL),
            ).toHaveValue(data.newIconURL);
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
            await expect(
                await studio.getCard(data.cardid, 'slice-wide'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'slice-wide')).dblclick();
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
            await expect(await slice.cardImage).not.toBeVisible();
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
            await expect(
                await studio.getCard(data.cardid, 'slice-wide'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'slice-wide')).dblclick();
            await expect(await studio.editorPanel).toBeVisible();
        });

        await test.step('step-3: Edit price field', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorDescription),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorDescription),
            ).toContainText(data.price);
            await expect(
                await studio.editorPanel.locator(studio.editorDescription),
            ).not.toContainText(data.newPrice);
            await expect(
                await studio.editorPanel.locator(studio.editorDescription),
            ).toContainText(data.strikethroughPrice);
            await expect(
                await studio.editorPanel.locator(studio.editorDescription),
            ).not.toContainText(data.newStrikethroughPrice);

            await (
                await studio.editorPanel
                    .locator(studio.editorDescription)
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
                await studio.editorPanel.locator(studio.editorDescription),
            ).toContainText(data.newPrice);
            await expect(
                await studio.editorPanel.locator(studio.editorDescription),
            ).toContainText(data.newStrikethroughPrice);
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
            await expect(
                await studio.getCard(data.cardid, 'slice-wide'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'slice-wide')).dblclick();
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
                await studio.editorPanel.locator(studio.editorCTA)
            ).dblclick();
            await expect(await ost.checkoutTab).toBeVisible();
            await expect(await ost.workflowMenu).toBeVisible();
            await expect(await ost.ctaTextMenu).toBeVisible();
            await expect(await ost.checkoutLinkUse).toBeVisible();
            await expect(await ost.checkoutLink).toBeEnabled();
            await ost.ctaTextMenu.click();

            await expect(
                page.locator('div[role="option"]', {
                    hasText: `${data.newCtaText}`,
                }),
            ).toBeVisible();
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

    // @studio-slice-edit-cta-link - Validate edit CTA link for slice card in mas studio
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
                await studio.getCard(data.cardid, 'slice-wide'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'slice-wide')).dblclick();
            await expect(await studio.editorPanel).toBeVisible();
        });

        await test.step('step-3: Edit CTA link', async () => {
            await expect(
                await studio.editorPanel
                    .locator(studio.editorFooter)
                    .locator(studio.linkEdit),
            ).toBeVisible();
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
        });

        await test.step('step-4: Validate edited CTA Link in Editor panel', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorFooter),
            ).toContainText(data.newCtaText);
        });

        await test.step('step-5: Validate edited CTA on the card', async () => {
            await expect(await slice.cardCTA).toContainText(data.newCtaText);
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
            await expect(
                await studio.getCard(data.cardid, 'slice-wide'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'slice-wide')).dblclick();
            await expect(await studio.editorPanel).toBeVisible();
        });

        await test.step('step-3: Edit promo field', async () => {
            await expect(
                await studio.editorPanel
                    .locator(studio.editorDescription)
                    .locator(studio.regularPrice),
            ).toHaveAttribute('data-promotion-code', data.promo);
            await expect(
                await slice.cardDescription.locator(slice.cardPriceSlot),
            ).toHaveAttribute('data-promotion-code', data.promo);
            await (
                await studio.editorPanel
                    .locator(studio.editorDescription)
                    .locator(studio.regularPrice)
            ).dblclick();
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
                await studio.editorPanel
                    .locator(studio.editorDescription)
                    .locator(studio.regularPrice),
            ).toHaveAttribute('data-promotion-code', data.newPromo);
        });

        await test.step('step-5: Validate edited price promo on the card', async () => {
            await expect(
                await slice.cardDescription.locator(slice.cardPriceSlot),
            ).toHaveAttribute('data-promotion-code', data.newPromo);
        });

        await test.step('step-6: Remove promo', async () => {
            await (
                await studio.editorPanel
                    .locator(studio.editorDescription)
                    .locator(studio.regularPrice)
            ).dblclick();
            await expect(await ost.promoField).toBeVisible();
            await expect(await ost.promoLabel).toBeVisible();

            await ost.promoField.fill('');
            await expect(await ost.promoLabel).toContainText('no promo');
            await expect(await ost.promoField).toHaveValue('');
            await ost.priceUse.click();
        });

        await test.step('step-7: Validate promo removed in Editor panel', async () => {
            await expect(
                await studio.editorPanel
                    .locator(studio.editorDescription)
                    .locator(studio.regularPrice),
            ).not.toHaveAttribute('data-promotion-code');
        });

        await test.step('step-8: Validate price promo removed from the card', async () => {
            await expect(
                await slice.cardDescription.locator(slice.cardPriceSlot),
            ).not.toHaveAttribute('data-promotion-code');
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
            await expect(
                await studio.getCard(data.cardid, 'slice-wide'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'slice-wide')).dblclick();
            await expect(await studio.editorPanel).toBeVisible();
        });

        await test.step('step-3: Edit CTA promo field', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorCTA),
            ).toHaveAttribute('data-promotion-code', data.promo);
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

            await (
                await studio.editorPanel.locator(studio.editorCTA)
            ).dblclick();
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
            await expect(
                await studio.editorPanel.locator(studio.editorCTA),
            ).toHaveAttribute('data-promotion-code', data.newPromo);
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
            await (
                await studio.editorPanel.locator(studio.editorCTA)
            ).dblclick();
            await expect(await ost.checkoutTab).toBeVisible();
            await expect(await ost.promoField).toBeVisible();
            await expect(await ost.promoLabel).toBeVisible();

            await ost.promoField.fill('');
            expect(await ost.promoLabel).toContainText('no promo');
            await expect(await ost.promoField).toHaveValue('');
            await ost.checkoutLinkUse.click();
        });

        // uncomment once MWPW-169011 is fixed
        // await test.step('step-7: Validate promo removed in Editor panel', async () => {
        //     await expect(
        //         await studio.editorPanel.locator(studio.editorCTA),
        //     ).not.toHaveAttribute('data-promotion-code');
        // });

        await test.step('step-8: Validate CTA promo removed from the card', async () => {
            await expect(await slice.cardCTA).not.toHaveAttribute(
                'data-promotion-code',
            );
            await expect(slice.cardCTA).not.toHaveAttribute(
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
            await expect(
                await studio.getCard(data.cardid, 'slice-wide'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'slice-wide')).dblclick();
            await expect(await studio.editorPanel).toBeVisible();
        });

        await test.step('step-3: Edit card variant', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorVariant),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorVariant),
            ).toHaveAttribute('default-value', 'ccd-slice');
            await studio.editorPanel
                .locator(studio.editorVariant)
                .locator('sp-picker')
                .first()
                .click();
            await page.getByRole('option', { name: 'try buy widget' }).click();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Validate editor fields rendering after variant change', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorVariant),
            ).toHaveAttribute('default-value', 'ah-try-buy-widget');

            // *** uncomment once MWPW-164093 (AHome PR) is merged to main ***

            // await expect(
            //     await studio.editorPanel.locator(studio.editorSize),
            // ).toBeVisible();
            // await expect(
            //     await studio.editorPanel.locator(studio.editorTitle),
            // ).toBeVisible();
            // await expect(
            //     await studio.editorPanel.locator(studio.editorSubtitle),
            // ).not.toBeVisible();
            // await expect(
            //     await studio.editorPanel.locator(studio.editorBadge),
            // ).not.toBeVisible();
            // await expect(
            //     await studio.editorPanel.locator(studio.editorDescription),
            // ).toBeVisible();
            // await expect(
            //     await studio.editorPanel.locator(studio.editorIconURL),
            // ).toBeVisible();
            // await expect(
            //     await studio.editorPanel.locator(studio.editorBorderColor),
            // ).toBeVisible();
            // await expect(
            //     await studio.editorPanel.locator(studio.editorBackgroundColor),
            // ).toBeVisible();
            // await expect(
            //     await studio.editorPanel.locator(studio.editorBackgroundImage),
            // ).toBeVisible();
            // await expect(
            //     await studio.editorPanel.locator(studio.editorPrices),
            // ).toBeVisible();
            // await expect(
            //     await studio.editorPanel.locator(studio.editorFooter),
            // ).toBeVisible();
        });

        await test.step('step-5: Validate card variant change', async () => {
            await expect(
                await studio.getCard(data.cardid, 'ahtrybuywidget'),
            ).toBeVisible();
            await expect(
                await studio.getCard(data.cardid, 'slice-wide'),
            ).not.toBeVisible();

            // *** uncomment once MWPW-164093 (AHome PR) is merged to main ***

            // await expect(await trybuywidget.cardTitle).toBeVisible();
            // await expect(await trybuywidget.cardDescription).toBeVisible();
            // await expect(await trybuywidget.cardPrice).toBeVisible();
            // await expect(await trybuywidget.cardCTA).toBeVisible();
            // await expect(await trybuywidget.cardIcon).toBeVisible();
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
            await expect(
                await studio.getCard(data.cardid, 'slice-wide'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'slice-wide')).dblclick();
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

    // @studio-slice-change-osi - Validate changing OSI for slice card in mas studio
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
                await studio.getCard(data.cardid, 'slice'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'slice')).dblclick();
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
                new RegExp(`${data.offerTypeTag}`),
            );
            await expect(await studio.editorTags).toHaveAttribute(
                'value',
                new RegExp(`${data.marketSegmentsTag}`),
            );
            await expect(await studio.editorTags).toHaveAttribute(
                'value',
                new RegExp(`${data.newPlanTypeTag}`),
            );
            await expect(await studio.editorTags).not.toHaveAttribute(
                'value',
                new RegExp(`${data.planTypeTag}`),
            );
        });
    });
});
