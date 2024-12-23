import { expect, test } from '@playwright/test';
import StudioSpec from './studio.spec.js';
import StudioPage from './studio.page.js';
import ims from '../libs/imslogin.js';

const { features } = StudioSpec;
const miloLibs = process.env.MILO_LIBS || '';

let studio;

test.beforeEach(async ({ page, browserName, baseURL }) => {
    test.slow();
    if (browserName === 'chromium') {
        await page.setExtraHTTPHeaders({
            'sec-ch-ua': '"Chromium";v="123", "Not:A-Brand";v="8"',
        });
    }
    studio = new StudioPage(page);
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

test.describe('M@S Studio feature test suite', () => {
    // @studio-direct-search - Validate direct search feature in mas studio
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

        await test.step('step-2: Validate search results', async () => {
            await expect(await studio.renderView).toBeVisible();

            const cards = await studio.renderView.locator('merch-card');
            expect(await cards.count()).toBe(1);
        });
    });

    // // @studio-search-field - Validate search field in mas studio
    // test(`${features[1].name},${features[1].tags}`, async ({
    //     page,
    //     baseURL,
    // }) => {
    //     const { data } = features[1];
    //     const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}`;
    //     console.info('[Test Page]: ', testPage);

    //     await test.step('step-1: Go to MAS Studio test page', async () => {
    //         await page.goto(testPage);
    //         await page.waitForLoadState('domcontentloaded');
    //     });

    //     await test.step('step-2: Validate search field rendered', async () => {
    //         await expect(await studio.searchInput).toBeVisible();
    //         await expect(await studio.searchIcon).toBeVisible();
    //         await expect(await studio.renderView).toBeVisible();
    //         const cards = await studio.renderView.locator('merch-card');
    //         expect(await cards.count()).toBeGreaterThan(1);
    //     });

    //     await test.step('step-3: Validate search feature', async () => {
    //         await studio.searchInput.fill(data.cardid);
    //         await page.keyboard.press('Enter');
    //         await page.waitForTimeout(2000);
    //         expect(await studio.getCard(data.cardid, 'suggested')).toBeVisible;
    //         const searchResult = await studio.renderView.locator('merch-card');
    //         expect(await searchResult.count()).toBe(1);
    //     });
    // });

    // // @studio-edit-title - Validate edit title feature in mas studio
    // test(`${features[2].name},${features[2].tags}`, async ({
    //     page,
    //     baseURL,
    // }) => {
    //     const { data } = features[2];
    //     const testPage = `${baseURL}${features[2].path}${miloLibs}${features[2].browserParams}${data.cardid}`;
    //     console.info('[Test Page]: ', testPage);

    //     await test.step('step-1: Go to MAS Studio test page', async () => {
    //         await page.goto(testPage);
    //         await page.waitForLoadState('domcontentloaded');
    //     });

    //     await test.step('step-2: Open card editor', async () => {
    //         expect(await studio.getCard(data.cardid, 'suggested')).toBeVisible;
    //         await (await studio.getCard(data.cardid, 'suggested')).dblclick();
    //         expect(await studio.editorPanel).toBeVisible;
    //     });
    //     await test.step('step-3: Edit title field', async () => {
    //         expect(await studio.editorPanel.title).toBeVisible;
    //         await expect(
    //             await studio.editorPanel.locator(studio.editorTitle),
    //         ).toHaveAttribute('value', `${data.title}`);
    //         await studio.editorPanel
    //             .locator(studio.editorTitle)
    //             .locator('input')
    //             .fill(data.newTitle);
    //     });
    // });
});
