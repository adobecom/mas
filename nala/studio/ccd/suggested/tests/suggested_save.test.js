import { expect, test } from '@playwright/test';
import StudioPage from '../../../studio.page.js';
import CCDSuggestedSpec from '../specs/suggested_save.spec.js';
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
    // @studio-suggested-clone-edit-save-delete - Clone Field & Edit card, edit, save then delete suggested card
    test(`${features[0].name},${features[0].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.cardid}`;
        const contentPage = `${baseURL}${features[0].contentPath}`;
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

        await test.step('step-3: Clone card and open editor', async () => {
            await studio.cloneCard.click();
            await expect(await studio.toastPositive).toHaveText(
                'Fragment successfully copied.',
            );
            let clonedCard = await studio.getCard(
                data.cardid,
                'suggested',
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
                await studio.editorPanel.locator(studio.editorTitle),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorTitle),
            ).toHaveValue(data.title);
            // edit price
            await (
                await studio.editorPanel.locator(studio.regularPrice)
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
            // edit title
            await studio.editorPanel
                .locator(studio.editorTitle)
                .fill(data.newTitle);
            // edit eyebrow
            await studio.editorPanel
                .locator(studio.editorSubtitle)
                .fill(data.newSubtitle);
            // edit mnemonic URL
            await studio.editorPanel
                .locator(studio.editorIconURL)
                .fill(data.newIconURL);
            // edit descritpion
            await studio.editorPanel
                .locator(studio.editorDescription)
                .fill(data.newDescription);
            // save card
            await studio.saveCard.click();
            await expect(await studio.toastPositive).toHaveText(
                'Fragment successfully saved.',
            );
        });

        await test.step('step-5: Validate edited fields in Editor panel', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorTitle),
            ).toHaveValue(data.newTitle);
            await expect(
                await studio.editorPanel.locator(studio.editorSubtitle),
            ).toHaveValue(data.newSubtitle);
            await expect(
                await studio.editorPanel.locator(studio.editorIconURL),
            ).toHaveValue(data.newIconURL);
            expect(
                await studio.editorPanel
                    .locator(studio.editorDescription)
                    .innerText(),
            ).toBe(data.newDescription);
            await expect(
                await studio.editorPanel.locator(studio.editorPrices),
            ).toContainText(data.price);
            await expect(
                await studio.editorPanel.locator(studio.editorPrices),
            ).not.toContainText(data.strikethroughPrice);
            await expect(
                await studio.editorPanel.locator(studio.editorFooter),
            ).toContainText(data.newCtaText);
        });

        await test.step('step-6: Go to cloned card and clone it again', async () => {
            const clonedCardPath = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.clonedCardID}`;
            await page.goto(clonedCardPath);
            await page.waitForLoadState('domcontentloaded');

            const clonedCard = await studio.getCard(
                data.clonedCardID,
                'suggested',
            );

            await clonedCard.dblclick();
            await expect(
                await studio.editorPanel.locator(studio.editorTitle),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorTitle),
            ).toHaveValue(data.newTitle);

            await studio.cloneCard.click();
            await expect(await studio.toastPositive).toHaveText(
                'Fragment successfully copied.',
            );

            await studio.closeEditor.click();
            let clonedCardTwo = await studio.getCard(
                data.clonedCardID,
                'suggested',
                'cloned',
            );
            let clonedCardTwoID = await clonedCardTwo
                .locator('aem-fragment')
                .getAttribute('fragment');
            data.clonedCardTwoID = await clonedCardTwoID;
            await expect(await clonedCardTwo).toBeVisible();
        });

        await test.step('step-7: Go to content page and delete both cloned fragments', async () => {
            await page.goto(contentPage);
            await page.waitForLoadState('domcontentloaded');

            const clonedCard = await studio.getCard(
                data.clonedCardID,
                'suggested',
            );

            const clonedCardTwo = await studio.getCard(
                data.clonedCardTwoID,
                'suggested',
            );

            await expect(
                await clonedCard.locator(suggested.cardTitle),
            ).toHaveText(data.newTitle);
            await expect(
                await clonedCard.locator(suggested.cardEyebrow),
            ).toHaveText(data.newSubtitle);
            await expect(
                await clonedCard.locator(suggested.cardDescription),
            ).toHaveText(data.newDescription);
            await expect(
                await clonedCard.locator(suggested.cardIcon),
            ).toHaveAttribute('src', data.newIconURL);
            await expect(
                await clonedCard.locator(suggested.cardPrice),
            ).toContainText(data.price);
            await expect(
                await clonedCard.locator(suggested.cardPrice),
            ).not.toContainText(data.strikethroughPrice);
            await expect(
                await clonedCard.locator(suggested.cardCTA),
            ).toContainText(data.newCtaText);

            await expect(
                await clonedCardTwo.locator(suggested.cardTitle),
            ).toHaveText(data.newTitle);
            await expect(
                await clonedCardTwo.locator(suggested.cardEyebrow),
            ).toHaveText(data.newSubtitle);
            await expect(
                await clonedCardTwo.locator(suggested.cardDescription),
            ).toHaveText(data.newDescription);
            await expect(
                await clonedCardTwo.locator(suggested.cardIcon),
            ).toHaveAttribute('src', data.newIconURL);
            await expect(
                await clonedCardTwo.locator(suggested.cardPrice),
            ).toContainText(data.price);
            await expect(
                await clonedCardTwo.locator(suggested.cardPrice),
            ).not.toContainText(data.strikethroughPrice);
            await expect(
                await clonedCardTwo.locator(suggested.cardCTA),
            ).toContainText(data.newCtaText);

            await clonedCard.dblclick();
            await page.waitForTimeout(2000);

            await expect(
                await studio.editorPanel.locator(studio.editorTitle),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorTitle),
            ).toHaveValue(data.newTitle);

            // delete card
            await studio.deleteCard.click();
            await expect(await studio.confirmationDialog).toBeVisible();
            await studio.confirmationDialog
                .locator(studio.deleteDialog)
                .click();
            await expect(await studio.toastPositive).toHaveText(
                'Fragment successfully deleted.',
            );
            await expect(await clonedCard).not.toBeVisible();

            await clonedCardTwo.dblclick();
            await expect(
                await studio.editorPanel.locator(studio.editorTitle),
            ).toBeVisible();
            await expect(
                await studio.editorPanel.locator(studio.editorTitle),
            ).toHaveValue(data.newTitle);

            await studio.deleteCard.click();
            await expect(await studio.confirmationDialog).toBeVisible();
            await studio.confirmationDialog
                .locator(studio.deleteDialog)
                .click();
            await expect(await studio.toastPositive).toHaveText(
                'Fragment successfully deleted.',
            );
            await expect(await clonedCardTwo).not.toBeVisible();
        });
    });
});
