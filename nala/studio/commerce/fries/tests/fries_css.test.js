import { test, expect, studio, fries, webUtil, miloLibs } from '../../../../libs/mas-test.js';
import CCDFriesSpec from '../specs/fries_css.spec.js';

const { features } = CCDFriesSpec;

test.describe('M@S Studio Commerce Fries card test suite', () => {
    // @studio-fries-css-card - Validate CSS for fries card size, background and border color
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.cardid}`;
        const friesCard = await studio.getCard(data.cardid);
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate fries card CSS', async () => {
            await expect(friesCard).toBeVisible();
            expect(await webUtil.verifyCSS(friesCard, fries.cssProp.card)).toBeTruthy();
        });
    });

    // @studio-fries-css-title - Validate title CSS for fries cards
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}${data.cardid}`;
        const friesCard = await studio.getCard(data.cardid);
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate fries card CSS', async () => {
            await expect(friesCard).toBeVisible();
            expect(await webUtil.verifyCSS(friesCard.locator(fries.title), fries.cssProp.title)).toBeTruthy();
        });
    });

    // @studio-fries-css-description - Validate description CSS for fries cards
    test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
        const { data } = features[2];
        const testPage = `${baseURL}${features[2].path}${miloLibs}${features[2].browserParams}${data.cardid}`;
        const friesCard = await studio.getCard(data.cardid);
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate fries card CSS', async () => {
            await expect(friesCard).toBeVisible();
            expect(await webUtil.verifyCSS(friesCard.locator(fries.description), fries.cssProp.description)).toBeTruthy();
        });
    });

    // @studio-fries-css-price - Validate price CSS for fries cards
    test(`${features[3].name},${features[3].tags}`, async ({ page, baseURL }) => {
        const { data } = features[3];
        const testPage = `${baseURL}${features[3].path}${miloLibs}${features[3].browserParams}${data.cardid}`;
        const friesCard = await studio.getCard(data.cardid);
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate fries card CSS', async () => {
            await expect(friesCard).toBeVisible();
            expect(await webUtil.verifyCSS(friesCard.locator(fries.price).first(), fries.cssProp.price)).toBeTruthy();
        });
    });

    // @studio-fries-css-cta - Validate cta CSS for fries cards
    test(`${features[4].name},${features[4].tags}`, async ({ page, baseURL }) => {
        const { data } = features[4];
        const testPage = `${baseURL}${features[4].path}${miloLibs}${features[4].browserParams}${data.cardid}`;
        const friesCard = await studio.getCard(data.cardid);
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate fries card CSS', async () => {
            await expect(friesCard).toBeVisible();
            expect(await webUtil.verifyCSS(friesCard.locator(fries.cta), fries.cssProp.cta)).toBeTruthy();
        });
    });

    // @studio-fries-css-icon - Validate icon CSS for fries cards
    test(`${features[5].name},${features[5].tags}`, async ({ page, baseURL }) => {
        const { data } = features[5];
        const testPage = `${baseURL}${features[5].path}${miloLibs}${features[5].browserParams}${data.cardid}`;
        const friesCard = await studio.getCard(data.cardid);
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate fries card CSS', async () => {
            await expect(friesCard).toBeVisible();
            const iconElement = friesCard.locator(fries.icon).first();
            await expect(iconElement).toBeVisible();
            expect(await webUtil.verifyCSS(iconElement, fries.cssProp.icon)).toBeTruthy();
        });
    });
});
