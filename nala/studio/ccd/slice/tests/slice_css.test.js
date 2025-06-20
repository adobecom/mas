import { expect, test } from '@playwright/test';
import StudioPage from '../../../studio.page.js';
import CCDSliceSpec from '../specs/slice_css.spec.js';
import CCDSlicePage from '../slice.page.js';
import WebUtil from '../../../../libs/webutil.js';

const { features } = CCDSliceSpec;
const miloLibs = process.env.MILO_LIBS || '';

let studio;
let slice;
let webUtil;

test.beforeEach(async ({ page, browserName }) => {
    test.slow();
    if (browserName === 'chromium') {
        await page.setExtraHTTPHeaders({
            'sec-ch-ua': '"Chromium";v="123", "Not:A-Brand";v="8"',
        });
    }
    studio = new StudioPage(page);
    slice = new CCDSlicePage(page);
    webUtil = new WebUtil(page);
});

test.describe('M@S Studio CCD Slice card test suite', () => {
    // @studio-slice-css-card-color - Validate CSS for slice card background and border color
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const singleCardPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.singleCardID}`;
        const doubleCardPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.doubleCardID}`;
        const singleSliceCard = await studio.getCard(data.singleCardID);
        const doubleSliceCard = await studio.getCard(data.doubleCardID);

        await test.step('step-1: Go to single card test page', async () => {
            console.info('[Test Page]: ', singleCardPage);
            await page.goto(singleCardPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate single slice card CSS', async () => {
            await expect(singleSliceCard).toBeVisible();
            expect(await webUtil.verifyCSS(singleSliceCard, slice.cssProp.card)).toBeTruthy();
        });

        await test.step('step-3: Go to double card test page', async () => {
            console.info('[Test Page]: ', doubleCardPage);
            await page.goto(doubleCardPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-4: Validate double slice card CSS', async () => {
            await expect(doubleSliceCard).toBeVisible();
            expect(await webUtil.verifyCSS(doubleSliceCard, slice.cssProp.card)).toBeTruthy();
        });
    });

    // @studio-slice-css-badge - Validate badge CSS for slice cards
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const { data } = features[1];
        const singleCardPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}${data.singleCardID}`;
        const doubleCardPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}${data.doubleCardID}`;
        const singleSliceCard = await studio.getCard(data.singleCardID);
        const doubleSliceCard = await studio.getCard(data.doubleCardID);

        await test.step('step-1: Go to single card test page', async () => {
            console.info('[Test Page]: ', singleCardPage);
            await page.goto(singleCardPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate single slice card CSS', async () => {
            await expect(singleSliceCard).toBeVisible();
            expect(await webUtil.verifyCSS(singleSliceCard.locator(slice.cardBadge), slice.cssProp.badge)).toBeTruthy();
        });

        await test.step('step-3: Go to double card test page', async () => {
            console.info('[Test Page]: ', doubleCardPage);
            await page.goto(doubleCardPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-4: Validate double slice card CSS', async () => {
            await expect(doubleSliceCard).toBeVisible();
            expect(await webUtil.verifyCSS(doubleSliceCard.locator(slice.cardBadge), slice.cssProp.badge)).toBeTruthy();
        });
    });

    // @studio-slice-css-description - Validate description CSS for slice cards
    test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
        const { data } = features[2];
        const singleCardPage = `${baseURL}${features[2].path}${miloLibs}${features[2].browserParams}${data.singleCardID}`;
        const doubleCardPage = `${baseURL}${features[2].path}${miloLibs}${features[2].browserParams}${data.doubleCardID}`;
        const singleSliceCard = await studio.getCard(data.singleCardID);
        const doubleSliceCard = await studio.getCard(data.doubleCardID);

        await test.step('step-1: Go to single card test page', async () => {
            console.info('[Test Page]: ', singleCardPage);
            await page.goto(singleCardPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate single slice card CSS', async () => {
            await expect(singleSliceCard).toBeVisible();
            expect(
                await webUtil.verifyCSS(
                    singleSliceCard.locator(slice.cardDescription).locator('p > strong').first(),
                    slice.cssProp.description,
                ),
            ).toBeTruthy();
        });

        await test.step('step-3: Go to double card test page', async () => {
            console.info('[Test Page]: ', doubleCardPage);
            await page.goto(doubleCardPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-4: Validate double slice card CSS', async () => {
            await expect(doubleSliceCard).toBeVisible();
            expect(
                await webUtil.verifyCSS(
                    doubleSliceCard.locator(slice.cardDescription).locator('p > strong').first(),
                    slice.cssProp.description,
                ),
            ).toBeTruthy();
        });
    });

    // @studio-slice-css-mnemonic - Validate mnemonic CSS for slice cards
    test(`${features[3].name},${features[3].tags}`, async ({ page, baseURL }) => {
        const { data } = features[3];
        const singleCardPage = `${baseURL}${features[3].path}${miloLibs}${features[3].browserParams}${data.singleCardID}`;
        const doubleCardPage = `${baseURL}${features[3].path}${miloLibs}${features[3].browserParams}${data.doubleCardID}`;
        const singleSliceCard = await studio.getCard(data.singleCardID);
        const doubleSliceCard = await studio.getCard(data.doubleCardID);

        await test.step('step-1: Go to single card test page', async () => {
            console.info('[Test Page]: ', singleCardPage);
            await page.goto(singleCardPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate single slice card CSS', async () => {
            await expect(singleSliceCard).toBeVisible();
            expect(await webUtil.verifyCSS(singleSliceCard.locator(slice.cardIcon), slice.cssProp.icon)).toBeTruthy();
        });

        await test.step('step-3: Go to double card test page', async () => {
            console.info('[Test Page]: ', doubleCardPage);
            await page.goto(doubleCardPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-4: Validate double slice card CSS', async () => {
            await expect(doubleSliceCard).toBeVisible();
            expect(await webUtil.verifyCSS(doubleSliceCard.locator(slice.cardIcon), slice.cssProp.icon)).toBeTruthy();
        });
    });

    // @studio-slice-css-size - Validate size CSS for slice cards
    test(`${features[4].name},${features[4].tags}`, async ({ page, baseURL }) => {
        const { data } = features[4];
        const singleCardPage = `${baseURL}${features[4].path}${miloLibs}${features[4].browserParams}${data.singleCardID}`;
        const doubleCardPage = `${baseURL}${features[4].path}${miloLibs}${features[4].browserParams}${data.doubleCardID}`;
        const singleSliceCard = await studio.getCard(data.singleCardID);
        const doubleSliceCard = await studio.getCard(data.doubleCardID);

        await test.step('step-1: Go to single card test page', async () => {
            console.info('[Test Page]: ', singleCardPage);
            await page.goto(singleCardPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate single slice card CSS', async () => {
            await expect(singleSliceCard).toBeVisible();
            expect(await webUtil.verifyCSS(singleSliceCard, slice.cssProp.singleSize)).toBeTruthy();
        });

        await test.step('step-3: Go to double card test page', async () => {
            console.info('[Test Page]: ', doubleCardPage);
            await page.goto(doubleCardPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-4: Validate double slice card CSS', async () => {
            await expect(doubleSliceCard).toBeVisible();
            expect(await webUtil.verifyCSS(doubleSliceCard, slice.cssProp.doubleSize)).toBeTruthy();
        });
    });

    // @studio-slice-css-price - Validate price CSS for slice cards
    test(`${features[5].name},${features[5].tags}`, async ({ page, baseURL }) => {
        const { data } = features[5];
        const singleCardPage = `${baseURL}${features[5].path}${miloLibs}${features[5].browserParams}${data.singleCardID}`;
        const doubleCardPage = `${baseURL}${features[5].path}${miloLibs}${features[5].browserParams}${data.doubleCardID}`;
        const singleSliceCard = await studio.getCard(data.singleCardID);
        const doubleSliceCard = await studio.getCard(data.doubleCardID);

        await test.step('step-1: Go to single card test page', async () => {
            console.info('[Test Page]: ', singleCardPage);
            await page.goto(singleCardPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate single slice card CSS', async () => {
            await expect(singleSliceCard).toBeVisible();
            expect(await webUtil.verifyCSS(singleSliceCard.locator(slice.cardPrice), slice.cssProp.price)).toBeTruthy();
        });

        await test.step('step-3: Go to double card test page', async () => {
            console.info('[Test Page]: ', doubleCardPage);
            await page.goto(doubleCardPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-4: Validate double slice card CSS', async () => {
            await expect(doubleSliceCard).toBeVisible();
            expect(await webUtil.verifyCSS(doubleSliceCard.locator(slice.cardPrice), slice.cssProp.price)).toBeTruthy();
        });
    });

    // @studio-slice-css-strikethrough - Validate strikethrough price CSS for slice cards
    test(`${features[6].name},${features[6].tags}`, async ({ page, baseURL }) => {
        const { data } = features[6];
        const singleCardPage = `${baseURL}${features[6].path}${miloLibs}${features[6].browserParams}${data.singleCardID}`;
        const doubleCardPage = `${baseURL}${features[6].path}${miloLibs}${features[6].browserParams}${data.doubleCardID}`;
        const singleSliceCard = await studio.getCard(data.singleCardID);
        const doubleSliceCard = await studio.getCard(data.doubleCardID);

        await test.step('step-1: Go to single card test page', async () => {
            console.info('[Test Page]: ', singleCardPage);
            await page.goto(singleCardPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate single slice card CSS', async () => {
            await expect(singleSliceCard).toBeVisible();
            expect(
                await webUtil.verifyCSS(
                    singleSliceCard.locator(slice.cardPriceStrikethrough),
                    slice.cssProp.strikethroughPrice,
                ),
            ).toBeTruthy();
        });

        await test.step('step-3: Go to double card test page', async () => {
            console.info('[Test Page]: ', doubleCardPage);
            await page.goto(doubleCardPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-4: Validate double slice card CSS', async () => {
            await expect(doubleSliceCard).toBeVisible();
            expect(
                await webUtil.verifyCSS(
                    doubleSliceCard.locator(slice.cardPriceStrikethrough),
                    slice.cssProp.strikethroughPrice,
                ),
            ).toBeTruthy();
        });
    });

    // @studio-slice-css-cta - Validate CTA CSS for slice cards
    test(`${features[7].name},${features[7].tags}`, async ({ page, baseURL }) => {
        const { data } = features[7];
        const singleCardPage = `${baseURL}${features[7].path}${miloLibs}${features[7].browserParams}${data.singleCardID}`;
        const doubleCardPage = `${baseURL}${features[7].path}${miloLibs}${features[7].browserParams}${data.doubleCardID}`;
        const singleSliceCard = await studio.getCard(data.singleCardID);
        const doubleSliceCard = await studio.getCard(data.doubleCardID);

        await test.step('step-1: Go to single card test page', async () => {
            console.info('[Test Page]: ', singleCardPage);
            await page.goto(singleCardPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate single slice card CSS', async () => {
            await expect(singleSliceCard).toBeVisible();
            expect(await webUtil.verifyCSS(singleSliceCard.locator(slice.cardCTA), slice.cssProp.cta)).toBeTruthy();
        });

        await test.step('step-3: Go to double card test page', async () => {
            console.info('[Test Page]: ', doubleCardPage);
            await page.goto(doubleCardPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-4: Validate double slice card CSS', async () => {
            await expect(doubleSliceCard).toBeVisible();
            expect(await webUtil.verifyCSS(doubleSliceCard.locator(slice.cardCTA), slice.cssProp.cta)).toBeTruthy();
        });
    });

    // @studio-slice-css-seeterms - Validate legal link CSS for slice cards
    test(`${features[8].name},${features[8].tags}`, async ({ page, baseURL }) => {
        const { data } = features[8];
        const singleCardPage = `${baseURL}${features[8].path}${miloLibs}${features[8].browserParams}${data.singleCardID}`;
        const doubleCardPage = `${baseURL}${features[8].path}${miloLibs}${features[8].browserParams}${data.doubleCardID}`;
        const singleSliceCard = await studio.getCard(data.singleCardID);
        const doubleSliceCard = await studio.getCard(data.doubleCardID);

        await test.step('step-1: Go to single card test page', async () => {
            console.info('[Test Page]: ', singleCardPage);
            await page.goto(singleCardPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate single slice card CSS', async () => {
            await expect(singleSliceCard).toBeVisible();
            expect(await webUtil.verifyCSS(singleSliceCard.locator(slice.cardLegalLink), slice.cssProp.legalLink)).toBeTruthy();
        });

        await test.step('step-3: Go to double card test page', async () => {
            console.info('[Test Page]: ', doubleCardPage);
            await page.goto(doubleCardPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-4: Validate double slice card CSS', async () => {
            await expect(doubleSliceCard).toBeVisible();
            expect(await webUtil.verifyCSS(doubleSliceCard.locator(slice.cardLegalLink), slice.cssProp.legalLink)).toBeTruthy();
        });
    });
});
