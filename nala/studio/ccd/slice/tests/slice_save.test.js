import { expect, test } from '@playwright/test';
import StudioPage from '../../../studio.page.js';
import CCDSliceSpec from '../specs/slice_save.spec.js';
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
    // @studio-slice-clone-edit-save-delete - Clone Field & Edit card, edit, save then delete slice card
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

        await test.step('step-3: Clone card and open editor', async () => {
            await studio.cloneCard.click();
            await expect(await studio.toastPositive).toHaveText(
                'Fragment successfully copied.',
            );
            let clonedCard = await studio.getCard(
                data.cardid,
                'slice-wide',
                'cloned',
            );
            let clonedCardID = await clonedCard
                .locator('aem-fragment')
                .getAttribute('fragment');
            data.clonedCardID = await clonedCardID;
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Edit fields and save card', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorDescription),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorDescription),
            ).toContainText(data.description);
            // edit price
            await (
                await studio.editorPanel
                    .locator(studio.editorDescription)
                    .locator(studio.regularPrice)
            ).dblclick();
            await expect(await ost.price).toBeVisible();
            await expect(await ost.priceUse).toBeVisible();
            await expect(await ost.oldPriceCheckbox).toBeVisible();
            await ost.oldPriceCheckbox.click();
            await ost.priceUse.click();
            // edit CTA
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
            // edit badge
            await studio.editorPanel
                .locator(studio.editorBadge)
                .fill(data.newBadge);
            // edit size
            await studio.editorPanel.locator(studio.editorSize).click();
            await page.getByRole('option', { name: 'default' }).click();
            await studio.editorPanel
                .locator(studio.editorIconURL)
                .fill(data.newIconURL);
            //save card
            await studio.saveCard.click();
            await expect(studio.toastPositive).toHaveText(
                'Fragment successfully saved.',
            );
        });

        await test.step('step-5: Validate edited fields in Editor panel', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorBadge),
            ).toHaveValue(data.newBadge);
            await expect(
                await studio.editorPanel.locator(studio.editorIconURL),
            ).toHaveValue(data.newIconURL);
            await expect(
                await studio.editorPanel.locator(studio.editorDescription),
            ).toContainText(data.price);
            await expect(
                await studio.editorPanel.locator(studio.editorDescription),
            ).not.toContainText(data.strikethroughPrice);
            await expect(
                await studio.editorPanel.locator(studio.editorFooter),
            ).toContainText(data.newCtaText);
        });

        await test.step('step-6: Search for the cloned card and verify changes then delete the card', async () => {
            const clonedCard = await studio.getCard(data.clonedCardID, 'slice');
            await expect(
                await studio.getCard(data.clonedCardID, 'slice'),
            ).toBeVisible();
            await expect(
                await studio.getCard(data.clonedCardID, 'slice-wide'),
            ).not.toBeVisible();
            await expect(await clonedCard.locator(slice.cardBadge)).toHaveText(
                data.newBadge,
            );
            await expect(
                await clonedCard.locator(slice.cardIcon),
            ).toHaveAttribute('src', data.newIconURL);
            await expect(
                await clonedCard.locator(slice.cardDescription),
            ).toContainText(data.price);
            await expect(
                await clonedCard.locator(slice.cardDescription),
            ).not.toContainText(data.strikethroughPrice);
            await expect(await clonedCard.locator(slice.cardCTA)).toContainText(
                data.newCtaText,
            );

            //delete the card
            await studio.deleteCard.click();
            await expect(await studio.confirmationDialog).toBeVisible();
            await studio.confirmationDialog
                .locator(studio.deleteDialog)
                .click();
            await expect(await studio.toastPositive).toHaveText(
                'Fragment successfully deleted.',
            );
            await expect(
                await studio.getCard(data.clonedCardID, 'slice'),
            ).not.toBeVisible();
        });
    });

    // @studio-slice-save-variant-change-to-suggested - Validate saving card after variant change to ccd suggested
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

        await test.step('step-3: Clone card and open editor', async () => {
            await studio.cloneCard.click();
            await expect(await studio.toastPositive).toHaveText(
                'Fragment successfully copied.',
            );
            let clonedCard = await studio.getCard(
                data.cardid,
                'slice-wide',
                'cloned',
            );
            let clonedCardID = await clonedCard
                .locator('aem-fragment')
                .getAttribute('fragment');
            data.clonedCardID = await clonedCardID;
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Change variant and save card', async () => {
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
            // save card
            await studio.saveCard.click();
            await expect(await studio.toastPositive).toHaveText(
                'Fragment successfully saved.',
            );
        });

        await test.step('step-5: Validate variant change', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorVariant),
            ).toHaveAttribute('default-value', 'ccd-suggested');
            await expect(
                await studio.getCard(data.clonedCardID, 'slice-wide'),
            ).not.toBeVisible();
            await expect(
                await studio.getCard(data.clonedCardID, 'suggested'),
            ).toBeVisible();
        });

        await test.step('step-6: Delete the card', async () => {
            await studio.deleteCard.click();
            await expect(await studio.confirmationDialog).toBeVisible();
            await studio.confirmationDialog
                .locator(studio.deleteDialog)
                .click();
            await expect(await studio.toastPositive).toHaveText(
                'Fragment successfully deleted.',
            );
            await expect(
                await studio.getCard(data.clonedCardID, 'suggested'),
            ).not.toBeVisible();
            await expect(
                await studio.getCard(data.clonedCardID, 'slice-wide'),
            ).not.toBeVisible();
        });
    });

    // @studio-slice-save-variant-change-to-trybuywidget - Validate saving card after variant change to AHome try-buy-widget
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

        await test.step('step-3: Clone card and open editor', async () => {
            await studio.cloneCard.click();
            await expect(await studio.toastPositive).toHaveText(
                'Fragment successfully copied.',
            );
            let clonedCard = await studio.getCard(
                data.cardid,
                'slice-wide',
                'cloned',
            );
            let clonedCardID = await clonedCard
                .locator('aem-fragment')
                .getAttribute('fragment');
            data.clonedCardID = await clonedCardID;
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await page.waitForTimeout(2000);
        });

        await test.step('step-4: Change variant and save card', async () => {
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
            // save card
            await studio.saveCard.click();
            await expect(await studio.toastPositive).toHaveText(
                'Fragment successfully saved.',
            );
        });

        await test.step('step-5: Validate variant change', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorVariant),
            ).toHaveAttribute('default-value', 'ah-try-buy-widget');
            await expect(
                await studio.getCard(data.clonedCardID, 'slice-wide'),
            ).not.toBeVisible();
            await expect(
                await studio.getCard(data.clonedCardID, 'ahtrybuywidget'),
            ).toBeVisible();
        });

        await test.step('step-6: Delete the card', async () => {
            await studio.deleteCard.click();
            await expect(await studio.confirmationDialog).toBeVisible();
            await studio.confirmationDialog
                .locator(studio.deleteDialog)
                .click();
            await expect(await studio.toastPositive).toHaveText(
                'Fragment successfully deleted.',
            );
            await expect(
                await studio.getCard(data.clonedCardID, 'slice-wide'),
            ).not.toBeVisible();
            await expect(
                await studio.getCard(data.clonedCardID, 'ahtrybuywidget'),
            ).not.toBeVisible();
        });
    });
});
