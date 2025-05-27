import { expect, test } from '@playwright/test';
import StudioPage from '../../../studio.page.js';
import CCDPromotedPlansSpec from '../specs/promoted-plans_css.spec.js';
import CCDPromotedPlans from '../promoted-plans.page.js';
import WebUtil from '../../../../libs/webutil.js';

const { features } = CCDPromotedPlansSpec;
const miloLibs = process.env.MILO_LIBS || '';

let studio;
let promotedplans;
let webUtil;

test.beforeEach(async ({ page, browserName }) => {
    test.slow();
    if (browserName === 'chromium') {
        await page.setExtraHTTPHeaders({
            'sec-ch-ua': '"Chromium";v="123", "Not:A-Brand";v="8"',
        });
    }
    studio = new StudioPage(page);
    promotedplans = new CCDPromotedPlans(page);
    webUtil = new WebUtil(page);
});

test.describe('M@S Studio CCD Promoted-plans card test suite', () => {

    // @studio-promoted-plans-css-card - Validate CSS for promoted-plans card size, background and border color
    test(`${features[0].name},${features[0].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.cardid}`;
        const promotedplansCard = await studio.getCard(data.cardid);
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate promoted-plans card CSS', async () => {
            await expect(promotedplansCard).toBeVisible();
            expect(
                await webUtil.verifyCSS(promotedplansCard, promotedplans.cssProp.card),
            ).toBeTruthy();
        });
    });

    // @studio-promoted-plans-css-title - Validate title CSS for promoted-plans cards
    test(`${features[1].name},${features[1].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}${data.cardid}`;
        const promotedplansCard = await studio.getCard(data.cardid);
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate promoted-plans card CSS', async () => {
            await expect(promotedplansCard).toBeVisible();
            expect(
                await webUtil.verifyCSS(promotedplansCard.locator(promotedplans.title), promotedplans.cssProp.title),
            ).toBeTruthy();
        });
    });

    // @studio-promoted-plans-css-eyebrow - Validate eyebrow CSS for promoted-plans cards
    test(`${features[2].name},${features[2].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[2];
        const testPage = `${baseURL}${features[2].path}${miloLibs}${features[2].browserParams}${data.cardid}`;
        const promotedplansCard = await studio.getCard(data.cardid);
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate promoted-plans card CSS', async () => {
            await expect(promotedplansCard).toBeVisible();
            expect(
                await webUtil.verifyCSS(promotedplansCard.locator(promotedplans.eyebrow), promotedplans.cssProp.eyebrow),
            ).toBeTruthy();
        });
    });

    // @studio-promoted-plans-css-description - Validate description CSS for promoted-plans cards
    test(`${features[3].name},${features[3].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[3];
        const testPage = `${baseURL}${features[3].path}${miloLibs}${features[3].browserParams}${data.cardid}`;
        const promotedplansCard = await studio.getCard(data.cardid);
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate promoted-plans card CSS', async () => {
            await expect(promotedplansCard).toBeVisible();
            expect(
                await webUtil.verifyCSS(promotedplansCard.locator(promotedplans.description), promotedplans.cssProp.description),
            ).toBeTruthy();
        });
    });

    // @studio-promoted-plans-css-price - Validate price CSS for promoted-plans cards
    test(`${features[4].name},${features[4].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[4];
        const testPage = `${baseURL}${features[4].path}${miloLibs}${features[4].browserParams}${data.cardid}`;
        const promotedplansCard = await studio.getCard(data.cardid);
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate promoted-plans card CSS', async () => {
            await expect(promotedplansCard).toBeVisible();
            expect(
                await webUtil.verifyCSS(promotedplansCard.locator(promotedplans.price), promotedplans.cssProp.price),
            ).toBeTruthy();
        });
    });

    // @studio-promoted-plans-css-cta - Validate cta CSS for promoted-plans cards
    test(`${features[5].name},${features[5].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[5];
        const testPage = `${baseURL}${features[5].path}${miloLibs}${features[5].browserParams}${data.cardid}`;
        const promotedplansCard = await studio.getCard(data.cardid);
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate promoted-plans card CSS', async () => {
            await expect(promotedplansCard).toBeVisible();
            expect(
                await webUtil.verifyCSS(promotedplansCard.locator(promotedplans.cta), promotedplans.cssProp.cta),
            ).toBeTruthy();
        });
    });

    // @studio-promoted-plans-css-icon - Validate icon CSS for promoted-plans cards
    test(`${features[6].name},${features[6].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[6];
        const testPage = `${baseURL}${features[6].path}${miloLibs}${features[6].browserParams}${data.cardid}`;
        const promotedplansCard = await studio.getCard(data.cardid);
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate promoted-plans card CSS', async () => {
            await expect(promotedplansCard).toBeVisible();
            expect(
                await webUtil.verifyCSS(promotedplansCard.locator(promotedplans.icon), promotedplans.cssProp.icon),
            ).toBeTruthy();
        });
    });

    // @studio-promoted-plans-css-backgroundImage - Validate backgroundImage CSS for promoted-plans cards
    test(`${features[7].name},${features[7].tags}`, async ({
        page,
        baseURL,
    }) => {
        const { data } = features[7];
        const testPage = `${baseURL}${features[7].path}${miloLibs}${features[7].browserParams}${data.cardid}`;
        const promotedplansCard = await studio.getCard(data.cardid);
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate promoted-plans card CSS', async () => {
            await expect(promotedplansCard).toBeVisible();
            expect(
                await webUtil.verifyCSS(promotedplansCard.locator(promotedplans.backgroundImage), promotedplans.cssProp.backgroundImage),
            ).toBeTruthy();
        });
    });

});
