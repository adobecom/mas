import { expect, test } from '@playwright/test';
import StudioPage from '../../studio.page.js';
import CCDSuggestedSpec from './suggested.spec.js';
import CCDSuggestedPage from './suggested.page.js';
import OSTPage from '../../ost.page.js';
import ims from '../../../libs/imslogin.js';

const { features } = CCDSuggestedSpec;
const miloLibs = process.env.MILO_LIBS || '';

let studio;
let suggested;
let ost;

test.beforeEach(async ({ page, browserName, baseURL }) => {
    test.slow();
    if (browserName === 'chromium') {
        await page.setExtraHTTPHeaders({
            'sec-ch-ua': '"Chromium";v="123", "Not:A-Brand";v="8"',
        });
    }
    studio = new StudioPage(page);
    suggested = new CCDSuggestedPage(page);
    ost = new OSTPage(page);
    features[0].url = `${baseURL}/studio.html`;
    await page.goto(features[0].url);
    await page.waitForURL('**/auth.services.adobe.com/en_US/index.html**/');
    await ims.fillOutSignInForm(features[0], page);
    await expect(async () => {
        const response = await page.request.get(features[0].url);
        expect(response.status()).toBe(200);
    }).toPass();
    await page.waitForLoadState('domcontentloaded');
});

test.describe('M@S Studio CCD Suggested card test suite', () => {
    // @studio-suggested-editor - Validate editor fields for suggested card in mas studio
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

        await test.step('step-3: Validate fields rendering', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorVariant),
            ).toBeVisible();
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
    });

    // @studio-suggested-edit-title - Validate edit title for suggested card in mas studio
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
        });

        await test.step('step-4: Validate edited title field in Editor panel', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorTitle),
            ).toHaveValue(data.newTitle);
        });

        await test.step('step-5: Validate edited title field on the card', async () => {
            await expect(await suggested.cardTitle).toHaveText(data.newTitle);
        });
    });

    // @studio-suggested-edit-eyebrow - Validate edit eyebrow field for suggested card in mas studio
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
        });

        await test.step('step-4: Validate edited eyebrow/subtitle field in Editor panel', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorSubtitle),
            ).toHaveValue(data.newSubtitle);
        });

        await test.step('step-5: Validate edited eyebrow field on the card', async () => {
            await expect(await suggested.cardEyebrow).toHaveText(
                data.newSubtitle,
            );
        });
    });

    // @studio-suggested-edit-description - Validate edit description field for suggested card in mas studio
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
            await expect(await suggested.cardDescription).toHaveText(
                data.newDescription,
            );
        });
    });

    // @studio-suggested-edit-mnemonic - Validate edit mnemonic URL field for suggested card in mas studio
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
            await expect(await suggested.cardIcon).toHaveAttribute(
                'src',
                data.newIconURL,
            );
        });
    });

    // @studio-suggested-edit-background - Validate edit eyebrow field for suggested card in mas studio
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
        });

        await test.step('step-4: Validate edited background image url field in Editor panel', async () => {
            await expect(
                await studio.editorPanel.locator(studio.editorBackgroundImage),
            ).toHaveValue(data.newBackgroundURL);
        });

        await test.step('step-5: Validate edited background image url on the card', async () => {
            await expect(
                await studio.getCard(data.cardid, 'suggested'),
            ).toHaveAttribute('background-image', data.newBackgroundURL);
        });
    });

    // @studio-suggested-clone-edit-save-delete - Clone Field & Edit card, edit, save then delete suggested card
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

        await test.step('step-6: Search for the cloned card and verify changes then delete the card', async () => {
            const clonedCard = await studio.getCard(
                data.clonedCardID,
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

            // delete card
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
        });
    });

    // @studio-suggested-edit-price - Validate edit price field for suggested card in mas studio
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
    });

    // @studio-suggested-edit-cta-ost - Validate edit CTA for suggested card in mas studio
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

        await test.step('step-5: Validate edited price field on the card', async () => {
            await expect(await suggested.cardCTA).toContainText(
                data.newCtaText,
            );
        });
    });

    // @studio-suggested-edit-cta-link - Validate edit CTA link for suggested card in mas studio
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

        await test.step('step-5: Validate edited price field on the card', async () => {
            await expect(await suggested.cardCTA).toContainText(
                data.newCtaText,
            );
        });
    });
});
