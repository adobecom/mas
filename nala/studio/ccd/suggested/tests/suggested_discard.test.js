import { expect, test } from '@playwright/test';
import StudioPage from '../../../studio.page.js';
import CCDSuggestedSpec from '../specs/suggested_discard.spec.js';
import CCDSuggestedPage from '../suggested.page.js';
import OSTPage from '../../../ost.page.js';

const { features } = CCDSuggestedSpec;
const miloLibs = process.env.MILO_LIBS || '';

let studio;
let suggested;
let ost;

test.beforeEach(async ({ page, browserName }) => {
    test.slow();
    if (browserName === 'chromium') {
        await page.setExtraHTTPHeaders({
            'sec-ch-ua': '"Chromium";v="123", "Not:A-Brand";v="8"',
        });
    }
    studio = new StudioPage(page);
    suggested = new CCDSuggestedPage(page);
    ost = new OSTPage(page);
});

test.describe('M@S Studio CCD Suggested card test suite', () => {
    // @studio-suggested-discard-title - Validate discard edit title for suggested card in mas studio
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

        await test.step('step-3: Edit title field', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorTitle),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorTitle),
            ).toHaveValue(data.title);
            await studio.editorPanel
                .locator(studio.editorTitle)
                .fill(data.newTitle);
            await expect(
                await studio.editorPanel.locator(studio.editorTitle),
            ).toHaveValue(data.newTitle);
            await expect(await suggested.cardTitle).toHaveText(data.newTitle);
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await studio.editorPanel.locator(studio.closeEditor).click();
            await expect(
                await studio.editorPanel.locator(studio.confirmationDialog),
            ).toBeVisible();
            await studio.editorPanel.locator(studio.discardDialog).click();
            await expect(await studio.editorPanel).not.toBeVisible();
        });

        await test.step('step-5: Verify there is no changes of the card', async () => {
            await expect(await suggested.cardTitle).toHaveText(data.title);
        });
    });

    // @studio-suggested-discard-eyebrow - Validate discard edit eyebrow field for suggested card in mas studio
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

        await test.step('step-3: Edit eyebrow field', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorSubtitle),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorSubtitle),
            ).toHaveValue(data.subtitle);
            await studio.editorPanel
                .locator(studio.editorSubtitle)
                .fill(data.newSubtitle);
            await expect(
                await studio.editorPanel.locator(studio.editorSubtitle),
            ).toHaveValue(data.newSubtitle);
            await expect(await suggested.cardEyebrow).toHaveText(
                data.newSubtitle,
            );
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await studio.editorPanel.locator(studio.closeEditor).click();
            await expect(
                await studio.editorPanel.locator(studio.confirmationDialog),
            ).toBeVisible();
            await studio.editorPanel.locator(studio.discardDialog).click();
            await expect(await studio.editorPanel).not.toBeVisible();
        });

        await test.step('step-5: Verify there is no changes of the card', async () => {
            await expect(await suggested.cardEyebrow).toHaveText(data.subtitle);
        });
    });

    // @studio-suggested-discard-description - Validate discard edit description field for suggested card in mas studio
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
            await expect(
                await studio.editorPanel.locator(studio.editorDescription),
            ).toContainText(data.newDescription);
            await expect(await suggested.cardDescription).toHaveText(
                data.newDescription,
            );
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await studio.editorPanel.locator(studio.closeEditor).click();
            await expect(
                await studio.editorPanel.locator(studio.confirmationDialog),
            ).toBeVisible();
            await studio.editorPanel.locator(studio.discardDialog).click();
            await expect(await studio.editorPanel).not.toBeVisible();
        });

        await test.step('step-5: Verify there is no changes of the card', async () => {
            await expect(await suggested.cardDescription).toContainText(
                data.description,
            );
        });
    });

    // @studio-suggested-discard-mnemonic - Validate discard edit mnemonic URL field for suggested card in mas studio
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
                await studio.getCard(data.cardid, 'suggested'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'suggested')).dblclick();
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
            await expect(
                await studio.editorPanel.locator(studio.editorIconURL),
            ).toHaveValue(data.newIconURL);
            await expect(await suggested.cardIcon).toHaveAttribute(
                'src',
                data.newIconURL,
            );
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await studio.editorPanel.locator(studio.closeEditor).click();
            await expect(
                await studio.editorPanel.locator(studio.confirmationDialog),
            ).toBeVisible();
            await studio.editorPanel.locator(studio.discardDialog).click();
            await expect(await studio.editorPanel).not.toBeVisible();
        });

        await test.step('step-5: Verify there is no changes of the card', async () => {
            await expect(await suggested.cardIcon).toHaveAttribute(
                'src',
                data.iconURL,
            );
        });
    });

    // @studio-suggested-discard-background - Validate discard edit eyebrow field for suggested card in mas studio
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
                await studio.getCard(data.cardid, 'suggested'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'suggested')).dblclick();
            await expect(await studio.editorPanel).toBeVisible();
        });

        await test.step('step-3: Edit background URL field', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorBackgroundImage),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorBackgroundImage),
            ).toHaveValue('');
            await studio.editorPanel
                .locator(studio.editorBackgroundImage)
                .fill(data.newBackgroundURL);
            await expect(
                await studio.editorPanel.locator(studio.editorBackgroundImage),
            ).toHaveValue(data.newBackgroundURL);
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await studio.editorPanel.locator(studio.closeEditor).click();
            await expect(
                await studio.editorPanel.locator(studio.confirmationDialog),
            ).toBeVisible();
            await studio.editorPanel.locator(studio.discardDialog).click();
            await expect(await studio.editorPanel).not.toBeVisible();
        });

        await test.step('step-5: Verify there is no changes of the card', async () => {
            await expect(
                await studio.getCard(data.cardid, 'suggested'),
            ).not.toHaveAttribute('background-image', data.newBackgroundURL);
        });
    });

    // @studio-suggested-discard-price - Validate discard edit price field for suggested card in mas studio
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
                await studio.getCard(data.cardid, 'suggested'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'suggested')).dblclick();
            await expect(await studio.editorPanel).toBeVisible();
        });

        await test.step('step-3: Edit price field', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorPrices),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorPrices),
            ).toContainText(data.price);
            await expect(
                await studio.editorPanel.locator(studio.editorPrices),
            ).not.toContainText(data.newPrice);
            await expect(
                await studio.editorPanel.locator(studio.editorPrices),
            ).toContainText(data.strikethroughPrice);
            await expect(
                await studio.editorPanel.locator(studio.editorPrices),
            ).not.toContainText(data.newStrikethroughPrice);

            await (
                await studio.editorPanel.locator(studio.regularPrice)
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
            ).toContainText(data.newStrikethroughPrice);
        });

        await test.step('step-5: Validate edited price field on the card', async () => {
            await expect(await suggested.cardPrice).toContainText(
                data.newPrice,
            );
            await expect(await suggested.cardPrice).toContainText(
                data.newStrikethroughPrice,
            );
        });

        await test.step('step-6: Close the editor and verify discard is triggered', async () => {
            await studio.editorPanel.locator(studio.closeEditor).click();
            await expect(
                await studio.editorPanel.locator(studio.confirmationDialog),
            ).toBeVisible();
            await studio.editorPanel.locator(studio.discardDialog).click();
            await expect(await studio.editorPanel).not.toBeVisible();
        });

        await test.step('step-7: Verify there is no changes of the card', async () => {
            await expect(await suggested.cardPrice).toContainText(data.price);
            await expect(await suggested.cardPrice).toContainText(
                data.strikethroughPrice,
            );
            await expect(await suggested.cardPrice).not.toContainText(
                data.newPrice,
            );
            await expect(await suggested.cardPrice).not.toContainText(
                data.newStrikethroughPrice,
            );
        });
    });

    // @studio-suggested-discard-cta-ost - Validate discard edit CTA for suggested card in mas studio
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
                await studio.getCard(data.cardid, 'suggested'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'suggested')).dblclick();
            await expect(await studio.editorPanel).toBeVisible();
        });

        await test.step('step-3: Edit price field', async () => {
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
            await expect(
                await studio.editorPanel.locator(studio.editorFooter),
            ).toContainText(data.newCtaText);
            await expect(await suggested.cardCTA).toContainText(
                data.newCtaText,
            );
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await studio.editorPanel.locator(studio.closeEditor).click();
            await expect(
                await studio.editorPanel.locator(studio.confirmationDialog),
            ).toBeVisible();
            await studio.editorPanel.locator(studio.discardDialog).click();
            await expect(await studio.editorPanel).not.toBeVisible();
        });

        await test.step('step-5: Verify there is no changes of the card', async () => {
            await expect(await suggested.cardCTA).toContainText(data.ctaText);
        });
    });

    // @studio-suggested-discard-cta-link - Validate discard edit CTA link for suggested card in mas studio
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
                await studio.getCard(data.cardid, 'suggested'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'suggested')).dblclick();
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
            await expect(
                await studio.editorPanel.locator(studio.editorFooter),
            ).toContainText(data.newCtaText);
            await expect(await suggested.cardCTA).toContainText(
                data.newCtaText,
            );
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await studio.editorPanel.locator(studio.closeEditor).click();
            await expect(
                await studio.editorPanel.locator(studio.confirmationDialog),
            ).toBeVisible();
            await studio.editorPanel.locator(studio.discardDialog).click();
            await expect(await studio.editorPanel).not.toBeVisible();
        });

        await test.step('step-5: Verify there is no changes of the card', async () => {
            await expect(await suggested.cardCTA).toContainText(data.ctaText);
        });
    });

    // @studio-suggested-discard-variant-change - Validate variant change for suggested card in mas studio
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
                await studio.getCard(data.cardid, 'suggested'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'suggested')).dblclick();
            await expect(await studio.editorPanel).toBeVisible();
        });

        await test.step('step-3: Change variant', async () => {
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
            await expect(
                await studio.getCard(data.cardid, 'slice'),
            ).toBeVisible();
            await expect(
                await studio.getCard(data.cardid, 'suggested'),
            ).not.toBeVisible();
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await studio.editorPanel.locator(studio.closeEditor).click();
            await expect(
                await studio.editorPanel.locator(studio.confirmationDialog),
            ).toBeVisible();
            await studio.editorPanel.locator(studio.discardDialog).click();
            await expect(await studio.editorPanel).not.toBeVisible();
        });

        await test.step('step-5: Verify there is no changes of the card', async () => {
            await expect(
                await studio.getCard(data.cardid, 'slice'),
            ).not.toBeVisible();
            await expect(
                await studio.getCard(data.cardid, 'suggested'),
            ).toBeVisible();
        });
    });

    // @studio-suggested-discard-change-osi - Validate changing OSI for suggested card in mas studio
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
                await studio.getCard(data.cardid, 'suggested'),
            ).toBeVisible();
            await (await studio.getCard(data.cardid, 'suggested')).dblclick();
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
            await expect(await studio.editorOSI).toContainText(data.newosi);
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await studio.editorPanel.locator(studio.closeEditor).click();
            await expect(
                await studio.editorPanel.locator(studio.confirmationDialog),
            ).toBeVisible();
            await studio.editorPanel.locator(studio.discardDialog).click();
            await expect(await studio.editorPanel).not.toBeVisible();
        });

        await test.step('step-4: Open the editor and validate there are no changes', async () => {
            await (await studio.getCard(data.cardid, 'suggested')).dblclick();
            await expect(await studio.editorPanel).toBeVisible();
            await expect(await studio.editorOSI).toContainText(data.osi);
            await expect(await studio.editorOSI).not.toContainText(data.newosi);
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
            await expect(await studio.editorTags).not.toHaveAttribute(
                'value',
                new RegExp(`${data.newPlanTypeTag}`),
            );
            await expect(await studio.editorTags).not.toHaveAttribute(
                'value',
                new RegExp(`${data.newOfferTypeTag}`),
            );
            await expect(await studio.editorTags).not.toHaveAttribute(
                'value',
                new RegExp(`${data.newMarketSegmentsTag}`),
            );
        });
    });
});
