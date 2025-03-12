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
    test(`${features[0].name},${features[0].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}`;
        const singleSliceCard = await studio.getCard(
            data.singleCardID,
            'slice',
        );
        const doubleSliceCard = await studio.getCard(
            data.doubleCardID,
            'slice-wide',
        );
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate cards are visible', async () => {
            await expect(singleSliceCard).toBeVisible();
            await expect(doubleSliceCard).toBeVisible();
        });

        await test.step('step-3: Validate slice card CSS', async () => {
            expect(
                await webUtil.verifyCSS(singleSliceCard, slice.cssProp.card),
            ).toBeTruthy();
            expect(
                await webUtil.verifyCSS(doubleSliceCard, slice.cssProp.card),
            ).toBeTruthy();
        });
    });

    // @studio-slice-css-badge - Validate badge CSS for slice cards
    test(`${features[1].name},${features[1].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}`;
        const singleSliceCard = await studio.getCard(
            data.singleCardID,
            'slice',
        );
        const doubleSliceCard = await studio.getCard(
            data.doubleCardID,
            'slice-wide',
        );

        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate cards are visible', async () => {
            await expect(singleSliceCard).toBeVisible();
            await expect(doubleSliceCard).toBeVisible();
        });

        await test.step('step-3: Validate slice card CSS', async () => {
            expect(
                await webUtil.verifyCSS(
                    singleSliceCard.locator(slice.cardBadge),
                    slice.cssProp.badge,
                ),
            ).toBeTruthy();
            expect(
                await webUtil.verifyCSS(
                    doubleSliceCard.locator(slice.cardBadge),
                    slice.cssProp.badge,
                ),
            ).toBeTruthy();
        });
    });

    // @studio-slice-css-description - Validate description CSS for slice cards
    test(`${features[2].name},${features[2].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[2];
        const testPage = `${baseURL}${features[2].path}${miloLibs}${features[2].browserParams}`;
        const singleSliceCard = await studio.getCard(
            data.singleCardID,
            'slice',
        );
        const doubleSliceCard = await studio.getCard(
            data.doubleCardID,
            'slice-wide',
        );
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate cards are visible', async () => {
            await expect(singleSliceCard).toBeVisible();
            await expect(doubleSliceCard).toBeVisible();
        });

        await test.step('step-3: Validate slice card CSS', async () => {
            expect(
                await webUtil.verifyCSS(
                    singleSliceCard
                        .locator(slice.cardDescription)
                        .locator('p > strong')
                        .first(),
                    slice.cssProp.description,
                ),
            ).toBeTruthy();
            expect(
                await webUtil.verifyCSS(
                    doubleSliceCard
                        .locator(slice.cardDescription)
                        .locator('p > strong')
                        .first(),
                    slice.cssProp.description,
                ),
            ).toBeTruthy();
        });
    });

    // @studio-slice-css-mnemonic - Validate mnemonic CSS for slice cards
    test(`${features[3].name},${features[3].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[3];
        const testPage = `${baseURL}${features[3].path}${miloLibs}${features[3].browserParams}`;
        const singleSliceCard = await studio.getCard(
            data.singleCardID,
            'slice',
        );
        const doubleSliceCard = await studio.getCard(
            data.doubleCardID,
            'slice-wide',
        );
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate cards are visible', async () => {
            await expect(singleSliceCard).toBeVisible();
            await expect(doubleSliceCard).toBeVisible();
        });

        await test.step('step-3: Validate slice card CSS', async () => {
            expect(
                await webUtil.verifyCSS(
                    singleSliceCard.locator(slice.cardIcon),
                    slice.cssProp.icon,
                ),
            ).toBeTruthy();
            expect(
                await webUtil.verifyCSS(
                    doubleSliceCard.locator(slice.cardIcon),
                    slice.cssProp.icon,
                ),
            ).toBeTruthy();
        });
    });

    // @studio-slice-css-size - Validate size CSS for slice cards
    test(`${features[4].name},${features[4].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[4];
        const testPage = `${baseURL}${features[4].path}${miloLibs}${features[4].browserParams}`;
        const singleSliceCard = await studio.getCard(
            data.singleCardID,
            'slice',
        );
        const doubleSliceCard = await studio.getCard(
            data.doubleCardID,
            'slice-wide',
        );
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate cards are visible', async () => {
            await expect(singleSliceCard).toBeVisible();
            await expect(doubleSliceCard).toBeVisible();
        });

        await test.step('step-3: Validate slice card CSS', async () => {
            expect(
                await webUtil.verifyCSS(
                    singleSliceCard,
                    slice.cssProp.singleSize,
                ),
            ).toBeTruthy();
            expect(
                await webUtil.verifyCSS(
                    doubleSliceCard,
                    slice.cssProp.doubleSize,
                ),
            ).toBeTruthy();
        });
    });

    // @studio-slice-css-price - Validate price CSS for slice cards
    test(`${features[5].name},${features[5].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[5];
        const testPage = `${baseURL}${features[5].path}${miloLibs}${features[5].browserParams}`;
        const singleSliceCard = await studio.getCard(
            data.singleCardID,
            'slice',
        );
        const doubleSliceCard = await studio.getCard(
            data.doubleCardID,
            'slice-wide',
        );
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate cards are visible', async () => {
            await expect(singleSliceCard).toBeVisible();
            await expect(doubleSliceCard).toBeVisible();
        });

        await test.step('step-3: Validate slice card CSS', async () => {
            expect(
                await webUtil.verifyCSS(
                    singleSliceCard.locator(slice.cardPrice),
                    slice.cssProp.price,
                ),
            ).toBeTruthy();
            expect(
                await webUtil.verifyCSS(
                    doubleSliceCard.locator(slice.cardPrice),
                    slice.cssProp.price,
                ),
            ).toBeTruthy();
        });
    });

    // @studio-slice-css-strikethrough - Validate strikethrough price CSS for slice cards
    test(`${features[6].name},${features[6].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[6];
        const testPage = `${baseURL}${features[6].path}${miloLibs}${features[6].browserParams}`;
        const singleSliceCard = await studio.getCard(
            data.singleCardID,
            'slice',
        );
        const doubleSliceCard = await studio.getCard(
            data.doubleCardID,
            'slice-wide',
        );
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate cards are visible', async () => {
            await expect(singleSliceCard).toBeVisible();
            await expect(doubleSliceCard).toBeVisible();
        });

        await test.step('step-3: Validate slice card CSS', async () => {
            expect(
                await webUtil.verifyCSS(
                    singleSliceCard.locator(slice.cardPriceStrikethrough),
                    slice.cssProp.strikethroughPrice,
                ),
            ).toBeTruthy();
            expect(
                await webUtil.verifyCSS(
                    doubleSliceCard.locator(slice.cardPriceStrikethrough),
                    slice.cssProp.strikethroughPrice,
                ),
            ).toBeTruthy();
        });
    });

    // @studio-slice-css-cta - Validate CTA CSS for slice cards
    test(`${features[7].name},${features[7].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[7];
        const testPage = `${baseURL}${features[7].path}${miloLibs}${features[7].browserParams}`;
        const singleSliceCard = await studio.getCard(
            data.singleCardID,
            'slice',
        );
        const doubleSliceCard = await studio.getCard(
            data.doubleCardID,
            'slice-wide',
        );
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate cards are visible', async () => {
            await expect(singleSliceCard).toBeVisible();
            await expect(doubleSliceCard).toBeVisible();
        });

        await test.step('step-3: Validate slice card CSS', async () => {
            expect(
                await webUtil.verifyCSS(
                    singleSliceCard.locator(slice.cardCTA),
                    slice.cssProp.cta,
                ),
            ).toBeTruthy();
            expect(
                await webUtil.verifyCSS(
                    doubleSliceCard.locator(slice.cardCTA),
                    slice.cssProp.cta,
                ),
            ).toBeTruthy();
        });
    });

    // @studio-slice-css-seeterms - Validate legal link CSS for slice cards
    test(`${features[8].name},${features[8].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[8];
        const testPage = `${baseURL}${features[8].path}${miloLibs}${features[8].browserParams}`;
        const singleSliceCard = await studio.getCard(
            data.singleCardID,
            'slice',
        );
        const doubleSliceCard = await studio.getCard(
            data.doubleCardID,
            'slice-wide',
        );
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate cards are visible', async () => {
            await expect(singleSliceCard).toBeVisible();
            await expect(doubleSliceCard).toBeVisible();
        });

        await test.step('step-3: Validate slice card CSS', async () => {
            expect(
                await webUtil.verifyCSS(
                    singleSliceCard.locator(slice.cardLegalLink),
                    slice.cssProp.legalLink,
                ),
            ).toBeTruthy();
            expect(
                await webUtil.verifyCSS(
                    doubleSliceCard.locator(slice.cardLegalLink),
                    slice.cssProp.legalLink,
                ),
            ).toBeTruthy();
        });
    });
});
