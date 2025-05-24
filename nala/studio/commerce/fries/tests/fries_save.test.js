import { expect, test } from '@playwright/test';
import StudioPage from '../../../studio.page.js';
import CCDFriesSpec from '../specs/fries_save.spec.js';
import CCDFries from '../fries.page.js';
import WebUtil from '../../../../libs/webutil.js';
import EditorPage from '../../../editor.page.js';
import OSTPage from '../../../ost.page.js';

const { features } = CCDFriesSpec;
const miloLibs = process.env.MILO_LIBS || '';

let studio;
let fries;
let webUtil;
let editor;
let ost;
let clonedCardID;

test.beforeEach(async ({ page, browserName }) => {
    test.slow();
    if (browserName === 'chromium') {
        await page.setExtraHTTPHeaders({
            'sec-ch-ua': '"Chromium";v="123", "Not:A-Brand";v="8"',
        });
    }
    studio = new StudioPage(page);
    fries = new CCDFries(page);
    webUtil = new WebUtil(page);
    editor = new EditorPage(page);
    ost = new OSTPage(page);
});

test.describe('M@S Studio CCD Fries card test suite', () => {
    // @studio-fries-save-edited-title - Validate saving card after editing card title
    test(`${features[0].name},${features[0].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);
        let clonedCard;

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Clone card and open editor', async () => {
            await studio.cloneCard(data.cardid);
            clonedCard = await studio.getCard(data.cardid, 'cloned');
            clonedCardID = await clonedCard
                .locator('aem-fragment')
                .getAttribute('fragment');
            data.clonedCardID = await clonedCardID;
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await page.waitForTimeout(2000);
        });

        await test.step('step-3: Edit title and save card', async () => {
            await expect(await editor.title).toBeVisible();
            await expect(await editor.title).toHaveValue(data.title);
            await editor.title.fill(data.newTitle);
            await studio.saveCard();
        });

        await test.step('step-4: Validate edited card title', async () => {
            await expect(await editor.title).toHaveValue(data.newTitle);
            await expect(await clonedCard.locator(fries.cardTitle)).toHaveText(
                data.newTitle,
            );
        });
    });

    // @studio-fries-save-edited-eyebrow - Validate saving card after editing card eyebrow
    test(`${features[1].name},${features[1].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);
        let clonedCard;

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Clone card and open editor', async () => {
            await studio.cloneCard(data.cardid);
            clonedCard = await studio.getCard(data.cardid, 'cloned');
            clonedCardID = await clonedCard
                .locator('aem-fragment')
                .getAttribute('fragment');
            data.clonedCardID = await clonedCardID;
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await page.waitForTimeout(2000);
        });

        await test.step('step-3: Edit eyebrow and save card', async () => {
            await expect(await editor.subtitle).toBeVisible();
            await expect(await editor.subtitle).toHaveValue(data.subtitle);
            await editor.subtitle.fill(data.newSubtitle);
            await studio.saveCard();
        });

        await test.step('step-4: Validate edited card eyebrow', async () => {
            await expect(await editor.subtitle).toHaveValue(data.newSubtitle);
            await expect(
                await clonedCard.locator(fries.cardEyebrow),
            ).toHaveText(data.newSubtitle);
        });
    });

    // @studio-fries-save-edited-description - Validate saving card after editing card description
    test(`${features[2].name},${features[2].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[2];
        const testPage = `${baseURL}${features[2].path}${miloLibs}${features[2].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);
        let clonedCard;

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Clone card and open editor', async () => {
            await studio.cloneCard(data.cardid);
            clonedCard = await studio.getCard(data.cardid, 'cloned');
            clonedCardID = await clonedCard
                .locator('aem-fragment')
                .getAttribute('fragment');
            data.clonedCardID = await clonedCardID;
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await page.waitForTimeout(2000);
        });

        await test.step('step-3: Edit description and save card', async () => {
            await expect(await editor.description).toBeVisible();
            await expect(await editor.description).toContainText(
                data.description,
            );
            await editor.description.fill(data.newDescription);
            await studio.saveCard();
        });

        await test.step('step-4: Validate edited card description', async () => {
            await expect(await editor.description).toContainText(
                data.newDescription,
            );
            await expect(
                await clonedCard.locator(fries.cardDescription),
            ).toHaveText(data.newDescription);
        });
    });

    // @studio-fries-save-edited-mnemonic - Validate saving card after editing card mnemonic
    test(`${features[3].name},${features[3].tags}`, async ({
        page,
        baseURL,
    }) => {
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
            clonedCardID = await clonedCard
                .locator('aem-fragment')
                .getAttribute('fragment');
            data.clonedCardID = await clonedCardID;
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await page.waitForTimeout(2000);
        });

        await test.step('step-3: Edit mnemonic and save card', async () => {
            await expect(await editor.iconURL).toBeVisible();
            await expect(await editor.iconURL).toHaveValue(data.iconURL);
            await editor.iconURL.fill(data.newIconURL);
            await studio.saveCard();
        });

        await test.step('step-4: Validate edited card mnemonic', async () => {
            await expect(await editor.iconURL).toHaveValue(data.newIconURL);
            await expect(
                await clonedCard.locator(fries.cardIcon),
            ).toHaveAttribute('src', data.newIconURL);
        });
    });

    // @studio-fries-save-edited-image - Validate saving card after editing card background image
    test(`${features[4].name},${features[4].tags}`, async ({
        page,
        baseURL,
    }) => {
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
            clonedCardID = await clonedCard
                .locator('aem-fragment')
                .getAttribute('fragment');
            data.clonedCardID = await clonedCardID;
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await page.waitForTimeout(2000);
        });

        await test.step('step-3: Edit fields and save card', async () => {
            await expect(await editor.backgroundImage).toBeVisible();
            await expect(await editor.backgroundImage).toHaveValue('');
            await editor.backgroundImage.fill(data.newBackgroundURL);
            await studio.saveCard();
        });

        await test.step('step-4: Validate edited card image', async () => {
            await expect(await editor.backgroundImage).toHaveValue(
                data.newBackgroundURL,
            );
            await expect(await clonedCard).toHaveAttribute(
                'background-image',
                data.newBackgroundURL,
            );
        });
    });

    // @studio-fries-save-edited-price - Validate saving card after editing card price
    test(`${features[5].name},${features[5].tags}`, async ({
        page,
        baseURL,
    }) => {
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
            clonedCardID = await clonedCard
                .locator('aem-fragment')
                .getAttribute('fragment');
            data.clonedCardID = await clonedCardID;
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await page.waitForTimeout(2000);
        });

        await test.step('step-3: Edit price and save card', async () => {
            await expect(await editor.prices).toBeVisible();
            await expect(await editor.prices).toContainText(data.price);
            await expect(await editor.prices).toContainText(
                data.strikethroughPrice,
            );
            await studio.saveCard();
        });

        await test.step('step-4: Validate edited card price', async () => {
            await expect(await editor.prices).toContainText(data.price);
            await expect(await editor.prices).toContainText(
                data.strikethroughPrice,
            );
            await expect(
                await clonedCard.locator(fries.cardPrice),
            ).toContainText(data.price);
        });
    });

    // @studio-fries-save-edited-cta-label - Validate saving card after editing CTA label
    test(`${features[6].name},${features[6].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[6];
        const testPage = `${baseURL}${features[6].path}${miloLibs}${features[6].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);
        let clonedCard;

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Clone card and open editor', async () => {
            await studio.cloneCard(data.cardid);
            clonedCard = await studio.getCard(data.cardid, 'cloned');
            clonedCardID = await clonedCard
                .locator('aem-fragment')
                .getAttribute('fragment');
            data.clonedCardID = await clonedCardID;
            await expect(await clonedCard).toBeVisible();
            await clonedCard.dblclick();
            await page.waitForTimeout(2000);
        });

        await test.step('step-3: Edit CTA and save card', async () => {
            await expect(await editor.footer).toContainText(data.ctaText);
            await editor.CTA.click();
            await editor.footer.locator(editor.linkEdit).click();
            await editor.linkText.fill(data.newCtaText);
            await editor.linkSave.click();
            await studio.saveCard();
        });

        await test.step('step-4: Validate edited card CTA', async () => {
            await expect(await editor.footer).toContainText(data.newCtaText);
            await expect(await clonedCard.locator(fries.cardCTA)).toContainText(
                data.newCtaText,
            );
        });
    });
});
