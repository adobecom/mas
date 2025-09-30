import { expect, test } from '@playwright/test';
import StudioPage from '../../../studio.page.js';
import EditorPage from '../../../editor.page.js';
import CCDSuggestedSpec from '../specs/suggested_save.spec.js';
import CCDSuggestedPage from '../suggested.page.js';
import CCDSlicePage from '../../slice/slice.page.js';
import AHTryBuyWidgetPage from '../../../ahome/try-buy-widget/try-buy-widget.page.js';
import OSTPage from '../../../ost.page.js';
import WebUtil from '../../../../libs/webutil.js';

const { features } = CCDSuggestedSpec;
const miloLibs = process.env.MILO_LIBS || '';

let studio;
let editor;
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
    editor = new EditorPage(page);
    suggested = new CCDSuggestedPage(page);
    slice = new CCDSlicePage(page);
    trybuywidget = new AHTryBuyWidgetPage(page);
    ost = new OSTPage(page);
    clonedCardID = '';
    webUtil = new WebUtil(page);
});

test.afterEach(async ({ baseURL, page }) => {
    if (await editor.panel.isVisible()) {
        await editor.closeEditor.click();
        await expect(await editor.panel).not.toBeVisible();
    }

    const card = await studio.getCard(clonedCardID);
    const isCardVisible = await card.isVisible().catch(() => false);

    if (!isCardVisible && (await card.count()) > 0) {
        const clonedCardPath = `${baseURL}/studio.html${miloLibs}#page=content&path=nala&query=${clonedCardID}`;
        await page.goto(clonedCardPath);
        await page.waitForLoadState('domcontentloaded');
    }

    if (await card.isVisible()) {
        await studio.deleteCard(clonedCardID);
        await expect(await card).not.toBeVisible();
    }

    await page.close();
});

test.describe('M@S Studio CCD Suggested card test suite', () => {
    // @studio-suggested-remove-correct-fragment - Clone card then delete, verify the correct card is removed from screen
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
            await studio.cloneCard(clonedCardID);

            let clonedCardTwo = await studio.getCard(data.cardid, 'cloned', data.clonedCardID);

            await expect(await clonedCardTwo).toBeVisible();

            let clonedCardTwoID = await clonedCardTwo.locator('aem-fragment').getAttribute('fragment');
            data.clonedCardTwoID = clonedCardTwoID;
        });

        await test.step('step-3: Delete cloned cards', async () => {
            const clonedCard = await studio.getCard(data.clonedCardID);
            const clonedCardTwo = await studio.getCard(data.clonedCardTwoID);

            await clonedCard.dblclick();
            await studio.deleteCard(data.clonedCardID);
            await expect(await clonedCard).not.toBeVisible();

            await clonedCardTwo.dblclick();
            await studio.deleteCard(data.clonedCardTwoID);
            await expect(await clonedCardTwo).not.toBeVisible();
        });
    });

    // @studio-suggested-save-variant-change-to-slice - Validate saving card after variant change to ccd slice
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
            await expect(await editor.variant).toHaveAttribute('default-value', 'ccd-suggested');
            await editor.variant.locator('sp-picker').first().click();
            await page.getByRole('option', { name: 'slice' }).click();
            await page.waitForTimeout(2000);
            await studio.saveCard();
        });

        await test.step('step-4: Validate variant change', async () => {
            await expect(await editor.variant).toHaveAttribute('default-value', 'ccd-slice');
            await expect(await studio.getCard(data.clonedCardID)).not.toHaveAttribute('variant', 'ccd-suggested');
            await expect(await studio.getCard(data.clonedCardID)).toHaveAttribute('variant', 'ccd-slice');
            await expect(await (await studio.getCard(data.clonedCardID)).locator(slice.cardCTA)).toHaveAttribute(
                'data-wcs-osi',
                data.osi,
            );
            await expect(await (await studio.getCard(data.clonedCardID)).locator(slice.cardCTA)).toHaveAttribute(
                'is',
                'checkout-button',
            );
        });
    });

    // @studio-suggested-save-variant-change-to-trybuywidget - Validate saving card after variant change to AHome try-buy-widget
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

        await test.step('step-3: Change variant and save card', async () => {
            await expect(await editor.variant).toBeVisible();
            await expect(await editor.variant).toHaveAttribute('default-value', 'ccd-suggested');
            await editor.variant.locator('sp-picker').first().click();
            await page.getByRole('option', { name: 'try buy widget' }).click();
            await page.waitForTimeout(2000);
            await studio.saveCard();
        });

        await test.step('step-4: Validate variant change', async () => {
            await expect(await editor.variant).toHaveAttribute('default-value', 'ah-try-buy-widget');
            await expect(await studio.getCard(data.clonedCardID)).not.toHaveAttribute('variant', 'ccd-suggested');
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

    // @studio-suggested-save-edited-fields - Validate field edits and save for suggested card in mas studio
    // Combines: title, eyebrow, mnemonic, description, and background image
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

        await test.step('step-3: Edit title field', async () => {
            await expect(await editor.title).toBeVisible();
            await editor.title.fill(data.title);
        });

        await test.step('step-4: Edit eyebrow field', async () => {
            await expect(await editor.subtitle).toBeVisible();
            await editor.subtitle.fill(data.subtitle);
        });

        await test.step('step-5: Edit mnemonic field', async () => {
            await expect(await editor.iconURL).toBeVisible();
            await editor.iconURL.fill(data.iconURL);
        });

        await test.step('step-6: Edit description field', async () => {
            await expect(await editor.description).toBeVisible();
            await editor.description.fill(data.description);
        });

        await test.step('step-7: Edit background image field', async () => {
            await expect(await editor.backgroundImage).toBeVisible();
            await editor.backgroundImage.fill(data.backgroundURL);
        });

        await test.step('step-8: Save card with all changes', async () => {
            await studio.saveCard();
        });

        await test.step('step-9: Validate all field changes in parallel', async () => {
            const validationLabels = ['title', 'eyebrow', 'mnemonic', 'description', 'background image'];

            const results = await Promise.allSettled([
                test.step('Validation-1: Verify title saved', async () => {
                    await expect(await editor.title).toHaveValue(data.title);
                    await expect(await clonedCard.locator(suggested.cardTitle)).toHaveText(data.title);
                }),

                test.step('Validation-2: Verify eyebrow saved', async () => {
                    await expect(await editor.subtitle).toHaveValue(data.subtitle);
                    await expect(await clonedCard.locator(suggested.cardEyebrow)).toHaveText(data.subtitle);
                }),

                test.step('Validation-3: Verify mnemonic saved', async () => {
                    await expect(await editor.iconURL).toHaveValue(data.iconURL);
                    await expect(await clonedCard.locator(suggested.cardIcon)).toHaveAttribute('src', data.iconURL);
                }),

                test.step('Validation-4: Verify description saved', async () => {
                    await expect(await editor.description).toContainText(data.description);
                    await expect(await clonedCard.locator(suggested.cardDescription)).toHaveText(data.description);
                }),

                test.step('Validation-5: Verify background image saved', async () => {
                    await expect(await editor.backgroundImage).toHaveValue(data.backgroundURL);
                    await expect(await clonedCard).toHaveAttribute('background-image', data.backgroundURL);
                }),
            ]);

            // Check results and report any failures
            const failures = results
                .map((result, index) => ({ result, index }))
                .filter(({ result }) => result.status === 'rejected')
                .map(({ result, index }) => `🔍 Validation-${index + 1} (${validationLabels[index]}) failed: ${result.reason}`);

            if (failures.length > 0) {
                throw new Error(`❌ Suggested card field save validation failures:\n${failures.join('\n')}`);
            }
        });
    });

    // @studio-suggested-save-edited-price - Validate saving card after editing card price
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

        await test.step('step-3: Edit price and save card', async () => {
            await expect(await editor.prices).toBeVisible();
            await expect(await editor.prices).toContainText(data.price);
            await expect(await editor.prices).toContainText(data.strikethroughPrice);
            await editor.prices.locator(editor.regularPrice).dblclick();
            await expect(await ost.price).toBeVisible();
            await expect(await ost.priceUse).toBeVisible();
            await expect(await ost.oldPriceCheckbox).toBeVisible();
            await ost.oldPriceCheckbox.click();
            await ost.priceUse.click();
            await studio.saveCard();
        });

        await test.step('step-4: Validate edited card price', async () => {
            await expect(await editor.prices).toContainText(data.price);
            await expect(await editor.prices).not.toContainText(data.strikethroughPrice);
            await expect(await clonedCard.locator(suggested.cardPrice)).toContainText(data.price);
            await expect(await clonedCard.locator(suggested.cardPrice)).not.toContainText(data.strikethroughPrice);
        });
    });

    // @studio-suggested-save-edited-cta-link - Validate saving card after editing CTA link via edit form
    // Combines: CTA label, variant, checkout params, and analytics IDs
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

        await test.step('step-3: Open CTA link editor', async () => {
            await expect(await editor.CTA).toBeVisible();
            await editor.CTA.click();
            await editor.footer.locator(editor.linkEdit).click();
            await page.waitForTimeout(1000);
        });

        await test.step('step-4: Edit CTA label', async () => {
            await expect(await editor.linkText).toBeVisible();
            await editor.linkText.fill(data.cta.text);
        });

        await test.step('step-5: Edit CTA variant', async () => {
            await expect(await editor.linkVariant).toBeVisible();
            await (await editor.getLinkVariant(data.cta.variant)).click();
        });

        await test.step('step-6: Edit checkout parameters', async () => {
            await expect(await editor.checkoutParameters).toBeVisible();
            const checkoutParamsString = Object.keys(data.checkoutParams)
                .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(data.checkoutParams[key])}`)
                .join('&');
            await editor.checkoutParameters.fill(checkoutParamsString);
        });

        await test.step('step-7: Edit analytics IDs', async () => {
            await expect(await editor.analyticsId).toBeVisible();
            await editor.analyticsId.click();
            await page.getByRole('option', { name: data.analyticsID }).click();
        });

        await test.step('step-8: Save link changes and save card', async () => {
            await expect(await editor.linkSave).toBeVisible();
            await editor.linkSave.click();
            await studio.saveCard();
        });

        await test.step('step-9: Validate all CTA changes in parallel', async () => {
            const validationLabels = ['CTA label', 'CTA variant', 'checkout parameters', 'analytics IDs'];

            const results = await Promise.allSettled([
                test.step('Validation-1: Verify CTA label saved', async () => {
                    await expect(await editor.footer).toContainText(data.cta.text);
                    await expect(await clonedCard.locator(suggested.cardCTA)).toContainText(data.cta.text);
                }),

                test.step('Validation-2: Verify CTA variant saved', async () => {
                    await expect(await editor.CTA).toHaveClass(data.cta.variant);
                    expect(await webUtil.verifyCSS(await clonedCard.locator(suggested.cardCTA), data.cta.css)).toBeTruthy();
                }),

                test.step('Validation-3: Verify checkout parameters saved', async () => {
                    const CTAhref = await clonedCard.locator(suggested.cardCTA).getAttribute('data-href');
                    let searchParams = new URLSearchParams(decodeURI(CTAhref).split('?')[1]);
                    expect(searchParams.get('mv')).toBe(data.checkoutParams.mv);
                    expect(searchParams.get('promoid')).toBe(data.checkoutParams.promoid);
                    expect(searchParams.get('mv2')).toBe(data.checkoutParams.mv2);
                }),

                test.step('Validation-4: Verify analytics IDs saved', async () => {
                    await expect(await clonedCard.locator(suggested.cardCTA)).toHaveAttribute(
                        'data-analytics-id',
                        data.analyticsID,
                    );
                    await expect(await clonedCard.locator(suggested.cardCTA)).toHaveAttribute('daa-ll', data.daaLL);
                }),
            ]);

            // Check results and report any failures
            const failures = results
                .map((result, index) => ({ result, index }))
                .filter(({ result }) => result.status === 'rejected')
                .map(({ result, index }) => `🔍 Validation-${index + 1} (${validationLabels[index]}) failed: ${result.reason}`);

            if (failures.length > 0) {
                throw new Error(`❌ Suggested card CTA link save validation failures:\n${failures.join('\n')}`);
            }
        });
    });

    // @studio-suggested-save-edited-osi - Validate saving change osi
    test(`${features[6].name},${features[6].tags}`, async ({ page, baseURL }) => {
        const { data } = features[6];
        const testPage = `${baseURL}${features[6].path}${miloLibs}${features[6].browserParams}${data.cardid}`;
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
            await expect(await editor.OSI).toContainText(data.osi.old);
            await editor.OSIButton.click();
            await ost.backButton.click();
            await page.waitForTimeout(2000);
            await expect(await ost.searchField).toBeVisible();
            await ost.searchField.fill(data.osi.new);
            await ost.nextButton.click();
            await expect(await ost.priceUse).toBeVisible();
            await ost.priceUse.click();
            await studio.saveCard();
        });

        await test.step('step-4: Validate osi change', async () => {
            await expect(await editor.OSI).toContainText(data.osi.new);
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.osiTags.new.productCodeTag}`));
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.osiTags.new.newOfferTypeTag}`));
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.osiTags.new.newMarketSegmentsTag}`));
            await expect(await editor.tags).toHaveAttribute('value', new RegExp(`${data.osiTags.new.newPlanTypeTag}`));
            await expect(await editor.tags).not.toHaveAttribute('value', new RegExp(`${data.osiTags.old.productCodeTag}`));
            await expect(await editor.tags).not.toHaveAttribute('value', new RegExp(`${data.osiTags.old.planTypeTag}`));
            await expect(await editor.tags).not.toHaveAttribute('value', new RegExp(`${data.osiTags.old.offerTypeTag}`));
            await expect(await editor.tags).not.toHaveAttribute('value', new RegExp(`${data.osiTags.old.marketSegmentsTag}`));
        });
    });
});
