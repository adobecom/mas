import { expect, test } from '@playwright/test';
import StudioPage from '../../../studio.page.js';
import CCDSliceSpec from '../specs/slice_discard.spec.js';
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
    // @studio-slice-discard-size - Validate edit size for slice card in mas studio
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
            await expect(
                await studio.getCard(data.cardid, 'slice'),
            ).not.toHaveAttribute('size', 'wide');
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
                await studio.getCard(data.cardid, 'slice-wide'),
            ).toBeVisible();
        });
    });

    // @studio-slice-discard-badge - Validate edit badge field for slice card in mas studio
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

        await test.step('step-3: Enter new value in the badge field', async () => {
            await studio.editorPanel
                .locator(studio.editorBadge)
                .fill(data.newBadge);
            await expect(
                await studio.editorPanel.locator(studio.editorBadge),
            ).toHaveValue(data.newBadge);
            await expect(await slice.cardBadge).toHaveText(data.newBadge);
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
            await expect(await slice.cardBadge).toHaveText(data.badge);
        });
    });

    // @studio-slice-discard-description - Validate edit description field for slice card in mas studio
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
            await expect(await slice.cardDescription).toHaveText(
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
            await expect(await slice.cardDescription).toContainText(
                data.description,
            );
        });
    });

    // @studio-slice-discard-mnemonic - Validate edit mnemonic URL field for slice card in mas studio
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
            await expect(await slice.cardIcon).toHaveAttribute(
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
            await expect(await slice.cardIcon).toHaveAttribute(
                'src',
                data.iconURL,
            );
        });
    });

    // @studio-slice-discard-image - Validate edit background image field for slice card in mas studio
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

        await test.step('step-3: Enter new value in the background URL field', async () => {
            await studio.editorPanel
                .locator(studio.editorBackgroundImage)
                .fill(data.newBackgroundURL);
            await expect(
                await studio.editorPanel.locator(studio.editorBackgroundImage),
            ).toHaveValue(data.newBackgroundURL);
            await expect(await slice.cardImage).toHaveAttribute(
                'src',
                data.newBackgroundURL,
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
            await expect(await slice.cardImage).toBeVisible();
            await expect(await slice.cardImage).toHaveAttribute(
                'src',
                data.backgroundURL,
            );
        });
    });

    // @studio-slice-discard-price - Validate edit price field for slice card in mas studio
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

        await test.step('step-6: Close the editor and verify discard is triggered', async () => {
            await studio.editorPanel.locator(studio.closeEditor).click();
            await expect(
                await studio.editorPanel.locator(studio.confirmationDialog),
            ).toBeVisible();
            await studio.editorPanel.locator(studio.discardDialog).click();
            await expect(await studio.editorPanel).not.toBeVisible();
        });

        await test.step('step-7: Verify there is no changes of the card', async () => {
            await expect(
                await slice.cardDescription.locator(slice.cardPrice),
            ).toContainText(data.price);
            await expect(
                await slice.cardDescription.locator(
                    slice.cardPriceStrikethrough,
                ),
            ).toContainText(data.strikethroughPrice);
            await expect(
                await slice.cardDescription.locator(slice.cardPrice),
            ).not.toContainText(data.newPrice);
            await expect(
                await slice.cardDescription.locator(
                    slice.cardPriceStrikethrough,
                ),
            ).not.toContainText(data.newStrikethroughPrice);
        });
    });

    // @studio-slice-discard-cta-ost - Validate edit CTA for slice card in mas studio
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
            await expect(
                await studio.editorPanel.locator(studio.editorFooter),
            ).toContainText(data.newCtaText);
            await expect(await slice.cardCTA).toContainText(data.newCtaText);
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
            await expect(await slice.cardCTA).toContainText(data.ctaText);
        });
    });

    // @studio-slice-discard-cta-link - Validate edit CTA link for slice card in mas studio
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
            await expect(await slice.cardCTA).toContainText(data.newCtaText);
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
            await expect(await slice.cardCTA).toContainText(data.ctaText);
        });
    });

    // @studio-slice-discard-variant-change - Validate variant change for slice card in mas studio
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

        await test.step('step-3: Change variant', async () => {
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
            await expect(
                await studio.getCard(data.cardid, 'slice-wide'),
            ).not.toBeVisible();
            await expect(
                await studio.getCard(data.cardid, 'suggested'),
            ).toBeVisible();
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
                await studio.getCard(data.cardid, 'slice-wide'),
            ).toBeVisible();
            await expect(
                await studio.getCard(data.cardid, 'suggested'),
            ).not.toBeVisible();
        });
    });
});
