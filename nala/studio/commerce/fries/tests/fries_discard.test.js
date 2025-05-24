import { expect, test } from '@playwright/test';
import StudioPage from '../../../studio.page.js';
import CCDFriesSpec from '../specs/fries_discard.spec.js';
import CCDFries from '../fries.page.js';
import WebUtil from '../../../../libs/webutil.js';
import EditorPage from '../../../editor.page.js';

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
    // @studio-fries-discard-edited-title - Validate discard edited title for fries card in mas studio
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
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit title field', async () => {
            await expect(await editor.title).toBeVisible();
            await editor.title.fill(data.newTitle);
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await editor.closeEditor.click();
            await expect(await studio.confirmationDialog).toBeVisible();
            await studio.discardDialog.click();
            await expect(await editor.panel).not.toBeVisible();
        });

        await test.step('step-5: Verify there is no changes of the card', async () => {
            await expect(await fries.cardTitle).toHaveText(data.title);
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await editor.title).toHaveValue(data.title);
        });
    });

    // @studio-fries-discard-edited-eyebrow - Validate discard edited eyebrow field for fries card in mas studio
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
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit eyebrow field', async () => {
            await expect(await editor.subtitle).toBeVisible();
            await editor.subtitle.fill(data.newSubtitle);
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await editor.closeEditor.click();
            await expect(await studio.confirmationDialog).toBeVisible();
            await studio.discardDialog.click();
            await expect(await editor.panel).not.toBeVisible();
        });

        await test.step('step-5: Verify there is no changes of the card', async () => {
            await expect(await fries.cardEyebrow).toHaveText(data.subtitle);
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await editor.subtitle).toHaveValue(data.subtitle);
        });
    });

    // @studio-fries-discard-edited-description - Validate discard edited description field for fries card in mas studio
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
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit description field', async () => {
            await expect(await editor.description).toBeVisible();
            await editor.description.fill(data.newDescription);
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await editor.closeEditor.click();
            await expect(await studio.confirmationDialog).toBeVisible();
            await studio.discardDialog.click();
            await expect(await editor.panel).not.toBeVisible();
        });

        await test.step('step-5: Verify there is no changes of the card', async () => {
            await expect(await fries.cardDescription).toContainText(
                data.description,
            );
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await editor.description).toContainText(
                data.description,
            );
        });
    });

    // @studio-fries-discard-edited-mnemonic - Validate discard edited mnemonic field for fries card in mas studio
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
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit mnemonic field', async () => {
            await expect(await editor.iconURL).toBeVisible();
            await editor.iconURL.fill(data.newIconURL);
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await editor.closeEditor.click();
            await expect(await studio.confirmationDialog).toBeVisible();
            await studio.discardDialog.click();
            await expect(await editor.panel).not.toBeVisible();
        });

        await test.step('step-5: Verify there is no changes of the card', async () => {
            await expect(await fries.cardIcon).toHaveAttribute(
                'src',
                data.iconURL,
            );
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await editor.iconURL).toHaveValue(data.iconURL);
        });
    });

    // @studio-fries-discard-edited-background - Validate discard edited background field for fries card in mas studio
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
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit background field', async () => {
            await expect(await editor.backgroundImage).toBeVisible();
            await editor.backgroundImage.fill(data.newBackgroundURL);
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await editor.closeEditor.click();
            await expect(await studio.confirmationDialog).toBeVisible();
            await studio.discardDialog.click();
            await expect(await editor.panel).not.toBeVisible();
        });

        await test.step('step-5: Verify there is no changes of the card', async () => {
            await expect(await studio.getCard(data.cardid)).not.toHaveAttribute(
                'background-image',
                data.newBackgroundURL,
            );
        });
    });

    // @studio-fries-discard-edited-price - Validate discard edited price field for fries card in mas studio
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
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit price field', async () => {
            await expect(await editor.prices).toBeVisible();
            await (await editor.prices.locator(editor.regularPrice)).dblclick();
            await expect(await ost.price).toBeVisible();
            await ost.unitCheckbox.click();
            await ost.priceUse.click();
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await editor.closeEditor.click();
            await expect(await studio.confirmationDialog).toBeVisible();
            await studio.discardDialog.click();
            await expect(await editor.panel).not.toBeVisible();
        });

        await test.step('step-5: Verify there is no changes of the card', async () => {
            await expect(await fries.cardPrice).toContainText(data.price);
            await expect(await fries.cardPrice).toContainText(
                data.strikethroughPrice,
            );
        });
    });

    // @studio-fries-discard-edited-cta-label - Validate discard edited CTA label for fries card in mas studio
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
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
        });

        await test.step('step-3: Edit CTA label', async () => {
            await expect(await editor.footer).toContainText(data.ctaText);
            await editor.CTA.click();
            await editor.footer.locator(editor.linkEdit).click();
            await editor.linkText.fill(data.newCtaText);
        });

        await test.step('step-4: Close the editor and verify discard is triggered', async () => {
            await editor.closeEditor.click();
            await expect(await studio.confirmationDialog).toBeVisible();
            await studio.discardDialog.click();
            await expect(await editor.panel).not.toBeVisible();
        });

        await test.step('step-5: Verify there is no changes of the card', async () => {
            await expect(await fries.cardCTA).toContainText(data.ctaText);
            await (await studio.getCard(data.cardid)).dblclick();
            await expect(await editor.panel).toBeVisible();
            await expect(await editor.footer).toContainText(data.ctaText);
        });
    });
});
