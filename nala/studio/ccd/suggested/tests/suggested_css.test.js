import { expect, test } from '@playwright/test';
import StudioPage from '../../../studio.page.js';
import CCDSuggestedSpec from '../specs/suggested_css.spec.js';
import CCDSuggestedPage from '../suggested.page.js';
import WebUtil from '../../../../libs/webutil.js';

const { features } = CCDSuggestedSpec;
const miloLibs = process.env.MILO_LIBS || '';

let studio;
let suggested;
let webUtil;

test.beforeEach(async ({ page, browserName }) => {
    test.slow();
    if (browserName === 'chromium') {
        await page.setExtraHTTPHeaders({
            'sec-ch-ua': '"Chromium";v="123", "Not:A-Brand";v="8"',
        });
    }
    studio = new StudioPage(page);
    suggested = new CCDSuggestedPage(page);
    webUtil = new WebUtil(page);
});

test.describe('M@S Studio CCD Suggested card test suite', () => {
    // @studio-suggested-css-card - Validate CSS for suggested card size, background and border color
    test(`${features[0].name},${features[0].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.cardid}`;
        const suggestedCard = await studio.getCard(data.cardid);
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate suggested card CSS', async () => {
            await expect(suggestedCard).toBeVisible();
            expect(
                await webUtil.verifyCSS(suggestedCard, suggested.cssProp.card),
            ).toBeTruthy();
        });
    });

    // @studio-suggested-css-eyebrow - Validate eyebrow CSS for suggested cards
    test(`${features[1].name},${features[1].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}${data.cardid}`;
        const suggestedCard = await studio.getCard(data.cardid);
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate suggested card CSS', async () => {
            await expect(suggestedCard).toBeVisible();
            expect(
                await webUtil.verifyCSS(
                    suggestedCard.locator(suggested.cardEyebrow),
                    suggested.cssProp.eyebrow,
                ),
            ).toBeTruthy();
        });
    });

    // @studio-suggested-css-description - Validate description CSS for suggested cards
    test(`${features[2].name},${features[2].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[2];
        const testPage = `${baseURL}${features[2].path}${miloLibs}${features[2].browserParams}${data.cardid}`;
        const suggestedCard = await studio.getCard(data.cardid);
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate suggested card CSS', async () => {
            await expect(suggestedCard).toBeVisible();
            expect(
                await webUtil.verifyCSS(
                    suggestedCard.locator(suggested.cardDescription),
                    suggested.cssProp.description,
                ),
            ).toBeTruthy();
        });
    });

    // @studio-suggested-css-mnemonic - Validate mnemonic CSS for suggested cards
    test(`${features[3].name},${features[3].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[3];
        const testPage = `${baseURL}${features[3].path}${miloLibs}${features[3].browserParams}${data.cardid}`;
        const suggestedCard = await studio.getCard(data.cardid);
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate suggested card CSS', async () => {
            await expect(suggestedCard).toBeVisible();
            expect(
                await webUtil.verifyCSS(
                    suggestedCard.locator(suggested.cardIcon),
                    suggested.cssProp.icon,
                ),
            ).toBeTruthy();
        });
    });
});
