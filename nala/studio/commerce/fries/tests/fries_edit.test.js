import { expect, test } from '@playwright/test';
import StudioPage from '../../../studio.page.js';
import CCDFriesSpec from '../specs/fries_edit.spec.js';
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
    // @studio-fries-edit-title - Validate edit title for fries card in mas studio
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
                'ccd-fries',
            );
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit title field', async () => {
            await expect(await editor.title).toBeVisible();
            await expect(await editor.title).toHaveValue(data.title);
            await editor.title.fill(data.newTitle);
        });

        await test.step('step-4: Validate edited title field in Editor panel', async () => {
            await expect(await editor.title).toHaveValue(data.newTitle);
        });

        await test.step('step-5: Validate edited title field on the card', async () => {
            await expect(await fries.cardTitle).toHaveText(data.newTitle);
        });
    });

    // @studio-fries-edit-eyebrow - Validate edit eyebrow field for fries card in mas studio
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
                'ccd-fries',
            );
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit eyebrow field', async () => {
            await expect(await editor.subtitle).toBeVisible();
            await expect(await editor.subtitle).toHaveValue(data.subtitle);
            await editor.subtitle.fill(data.newSubtitle);
        });

        await test.step('step-4: Validate edited eyebrow/subtitle field in Editor panel', async () => {
            await expect(await editor.subtitle).toHaveValue(data.newSubtitle);
        });

        await test.step('step-5: Validate edited eyebrow field on the card', async () => {
            await expect(await fries.cardEyebrow).toHaveText(data.newSubtitle);
        });
    });

    // @studio-fries-edit-description - Validate edit description field for fries card in mas studio
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
                'ccd-fries',
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

        await test.step('step-4: Validate edited description in Editor panel', async () => {
            await expect(await editor.description).toContainText(
                data.newDescription,
            );
        });

        await test.step('step-5: Validate edited description on the card', async () => {
            await expect(await fries.cardDescription).toHaveText(
                data.newDescription,
            );
        });
    });

    // @studio-fries-edit-mnemonic - Validate edit mnemonic URL field for fries card in mas studio
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
                'ccd-fries',
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

        await test.step('step-5: Validate edited mnemonic URL on the card', async () => {
            await expect(await fries.cardIcon).toHaveAttribute(
                'src',
                data.newIconURL,
            );
        });
    });

    // @studio-fries-edit-background - Validate edit background field for fries card in mas studio
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
                'ccd-fries',
            );
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit background URL field', async () => {
            await expect(await editor.backgroundImage).toBeVisible();
            await expect(await editor.backgroundImage).toHaveValue('');
            await editor.backgroundImage.fill(data.newBackgroundURL);
        });

        await test.step('step-4: Validate edited background image URL field in Editor panel', async () => {
            await expect(await editor.backgroundImage).toHaveValue(
                data.newBackgroundURL,
            );
        });

        await test.step('step-5: Validate edited background image URL field on the card', async () => {
            await expect(await studio.getCard(data.cardid)).toHaveAttribute(
                'background-image',
                data.newBackgroundURL,
            );
        });
    });

    // @studio-fries-edit-price - Validate edit price field for fries card in mas studio
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
                'ccd-fries',
            );
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit price field', async () => {
            await expect(await editor.prices).toBeVisible();
            await expect(await editor.prices).toContainText(data.price);
            await expect(await editor.prices).not.toContainText(data.newPrice);
            await expect(await editor.prices).toContainText(
                data.strikethroughPrice,
            );
            await expect(await editor.prices).not.toContainText(
                data.newStrikethroughPrice,
            );

            await (await editor.prices.locator(editor.regularPrice)).dblclick();
            await expect(await ost.price).toBeVisible();
            await expect(await ost.priceUse).toBeVisible();
            await expect(await ost.unitCheckbox).toBeVisible();
            await ost.unitCheckbox.click();
            await ost.priceUse.click();
        });

        await test.step('step-4: Validate edited price in Editor panel', async () => {
            await expect(await editor.prices).toContainText(data.newPrice);
            await expect(await editor.prices).toContainText(
                data.newStrikethroughPrice,
            );
        });

        await test.step('step-5: Validate edited price field on the card', async () => {
            await expect(await fries.cardPrice).toContainText(data.newPrice);
            await expect(await fries.cardPrice).toContainText(
                data.newStrikethroughPrice,
            );
        });
    });

    // @studio-fries-edit-cta-label - Validate edit CTA label for fries card in mas studio
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
                'ccd-fries',
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
            await expect(await fries.cardCTA).toContainText(data.newCtaText);
            await expect(await fries.cardCTA).toHaveAttribute(
                'data-wcs-osi',
                data.osi,
            );
            await expect(await fries.cardCTA).toHaveAttribute(
                'is',
                'checkout-button',
            );
        });
    });
});
