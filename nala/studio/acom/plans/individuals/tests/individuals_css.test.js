import { expect, test } from '@playwright/test';
import StudioPage from '../../../../studio.page.js';
import ACOMPlansIndividualsSpec from '../specs/individuals_css.spec.js';
import ACOMPlansIndividualsPage from '../individuals.page.js';
import WebUtil from '../../../../../libs/webutil.js';
import GlobalAEMCounter from '../../../../../libs/global-aem-counter.js';

const { features } = ACOMPlansIndividualsSpec;
const miloLibs = process.env.MILO_LIBS || '';

let studio;
let individuals;
let webUtil;

test.beforeEach(async ({ page, browserName }) => {
    test.slow();
    if (browserName === 'chromium') {
        await page.setExtraHTTPHeaders({
            'sec-ch-ua': '"Chromium";v="123", "Not:A-Brand";v="8"',
        });
    }
    studio = new StudioPage(page);
    individuals = new ACOMPlansIndividualsPage(page);
    webUtil = new WebUtil(page);
    await GlobalAEMCounter.init(page);
});

test.afterEach(async () => {
    GlobalAEMCounter.saveCountToFileSync();
});

test.describe('M@S Studio ACOM Plans Individuals card CSS test suite', () => {
    // @studio-plans-individuals-css-card - Validate card container styles for plans individuals card
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.cardid}`;
        const individualsCard = await studio.getCard(data.cardid);
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate individuals card CSS', async () => {
            await expect(individualsCard).toBeVisible();
            await expect(individualsCard).toHaveAttribute('variant', 'plans');
            expect(await webUtil.verifyCSS(individualsCard, individuals.cssProp.card)).toBeTruthy();
        });
    });

    // @studio-plans-individuals-css-icon - Validate card icon dimensions
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}${data.cardid}`;
        const individualsCard = await studio.getCard(data.cardid);
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate individuals card CSS', async () => {
            await expect(individualsCard).toBeVisible();
            await expect(individualsCard).toHaveAttribute('variant', 'plans');
            expect(
                await webUtil.verifyCSS(individualsCard.locator(individuals.cardIcon), individuals.cssProp.icon),
            ).toBeTruthy();
        });
    });

    // @studio-plans-individuals-css-title - Validate card title CSS
    test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
        const { data } = features[2];
        const testPage = `${baseURL}${features[2].path}${miloLibs}${features[2].browserParams}${data.cardid}`;
        const individualsCard = await studio.getCard(data.cardid);
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate individuals card CSS', async () => {
            await expect(individualsCard).toBeVisible();
            await expect(individualsCard).toHaveAttribute('variant', 'plans');
            expect(
                await webUtil.verifyCSS(individualsCard.locator(individuals.cardTitle), individuals.cssProp.title),
            ).toBeTruthy();
        });
    });

    // @studio-plans-individuals-css-badge - Validate card badge CSS
    test(`${features[3].name},${features[3].tags}`, async ({ page, baseURL }) => {
        const { data } = features[3];
        const testPage = `${baseURL}${features[3].path}${miloLibs}${features[3].browserParams}${data.cardid}`;
        const individualsCard = await studio.getCard(data.cardid);
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate individuals card CSS', async () => {
            await expect(individualsCard).toBeVisible();
            await expect(individualsCard).toHaveAttribute('variant', 'plans');
            expect(
                await webUtil.verifyCSS(individualsCard.locator(individuals.cardBadge), individuals.cssProp.badge),
            ).toBeTruthy();
        });
    });

    // @studio-plans-individuals-css-description - Validate card description CSS
    test(`${features[4].name},${features[4].tags}`, async ({ page, baseURL }) => {
        const { data } = features[4];
        const testPage = `${baseURL}${features[4].path}${miloLibs}${features[4].browserParams}${data.cardid}`;
        const individualsCard = await studio.getCard(data.cardid);
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate individuals card CSS', async () => {
            await expect(individualsCard).toBeVisible();
            await expect(individualsCard).toHaveAttribute('variant', 'plans');
            expect(
                await webUtil.verifyCSS(
                    individualsCard.locator(individuals.cardDescription).first(),
                    individuals.cssProp.description,
                ),
            ).toBeTruthy();
        });
    });

    // @studio-plans-individuals-css-legal-link - Validate card legal link CSS
    test(`${features[5].name},${features[5].tags}`, async ({ page, baseURL }) => {
        const { data } = features[5];
        const testPage = `${baseURL}${features[5].path}${miloLibs}${features[5].browserParams}${data.cardid}`;
        const individualsCard = await studio.getCard(data.cardid);
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate individuals card CSS', async () => {
            await expect(individualsCard).toBeVisible();
            await expect(individualsCard).toHaveAttribute('variant', 'plans');
            expect(
                await webUtil.verifyCSS(
                    individualsCard.locator(individuals.cardDescription).locator(individuals.cardLegalLink),
                    individuals.cssProp.legalLink,
                ),
            ).toBeTruthy();
        });
    });

    // @studio-plans-individuals-css-price - Validate card price CSS
    test(`${features[6].name},${features[6].tags}`, async ({ page, baseURL }) => {
        const { data } = features[6];
        const testPage = `${baseURL}${features[6].path}${miloLibs}${features[6].browserParams}${data.cardid}`;
        const individualsCard = await studio.getCard(data.cardid);
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate individuals card CSS', async () => {
            await expect(individualsCard).toBeVisible();
            await expect(individualsCard).toHaveAttribute('variant', 'plans');
            expect(
                await webUtil.verifyCSS(individualsCard.locator(individuals.cardPrice), individuals.cssProp.price),
            ).toBeTruthy();
        });
    });

    // @studio-plans-individuals-css-strikethrough-price - Validate card strikethrough price CSS
    test(`${features[7].name},${features[7].tags}`, async ({ page, baseURL }) => {
        const { data } = features[7];
        const testPage = `${baseURL}${features[7].path}${miloLibs}${features[7].browserParams}${data.cardid}`;
        const individualsCard = await studio.getCard(data.cardid);
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate individuals card CSS', async () => {
            await expect(individualsCard).toBeVisible();
            await expect(individualsCard).toHaveAttribute('variant', 'plans');
            expect(
                await webUtil.verifyCSS(
                    individualsCard.locator(individuals.cardPriceStrikethrough),
                    individuals.cssProp.strikethroughPrice,
                ),
            ).toBeTruthy();
        });
    });

    // @studio-plans-individuals-css-promotext - Validate card promo text CSS
    test(`${features[8].name},${features[8].tags}`, async ({ page, baseURL }) => {
        const { data } = features[8];
        const testPage = `${baseURL}${features[8].path}${miloLibs}${features[8].browserParams}${data.cardid}`;
        const individualsCard = await studio.getCard(data.cardid);
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate individuals card CSS', async () => {
            await expect(individualsCard).toBeVisible();
            await expect(individualsCard).toHaveAttribute('variant', 'plans');
            expect(
                await webUtil.verifyCSS(individualsCard.locator(individuals.cardPromoText), individuals.cssProp.promoText),
            ).toBeTruthy();
        });
    });

    // @studio-plans-individuals-css-callout - Validate card callout CSS
    test(`${features[9].name},${features[9].tags}`, async ({ page, baseURL }) => {
        const { data } = features[9];
        const testPage = `${baseURL}${features[9].path}${miloLibs}${features[9].browserParams}${data.cardid}`;
        const individualsCard = await studio.getCard(data.cardid);
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate individuals card CSS', async () => {
            await expect(individualsCard).toBeVisible();
            await expect(individualsCard).toHaveAttribute('variant', 'plans');
            expect(
                await webUtil.verifyCSS(individualsCard.locator(individuals.cardCallout), individuals.cssProp.callout),
            ).toBeTruthy();
        });
    });

    // @studio-plans-individuals-css-stock-checkbox - Validate card stock checkbox CSS
    test.skip(`${features[10].name},${features[10].tags}`, async ({ page, baseURL }) => {
        const { data } = features[10];
        const testPage = `${baseURL}${features[10].path}${miloLibs}${features[10].browserParams}${data.cardid}`;
        const individualsCard = await studio.getCard(data.cardid);
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate individuals card CSS', async () => {
            await expect(individualsCard).toBeVisible();
            await expect(individualsCard).toHaveAttribute('variant', 'plans');
            expect(
                await webUtil.verifyCSS(
                    individualsCard.locator(individuals.cardStockCheckbox),
                    individuals.cssProp.stockCheckbox.text,
                ),
            ).toBeTruthy();
            expect(
                await webUtil.verifyCSS(
                    individualsCard.locator(individuals.cardStockCheckboxIcon),
                    individuals.cssProp.stockCheckbox.checkbox,
                ),
            ).toBeTruthy();
        });
    });

    // @studio-plans-individuals-css-secure-transaction - Validate card secure transaction CSS
    test.skip(`${features[11].name},${features[11].tags}`, async ({ page, baseURL }) => {
        const { data } = features[11];
        const testPage = `${baseURL}${features[11].path}${miloLibs}${features[11].browserParams}${data.cardid}`;
        const individualsCard = await studio.getCard(data.cardid);
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate individuals card CSS', async () => {
            await expect(individualsCard).toBeVisible();
            await expect(individualsCard).toHaveAttribute('variant', 'plans');
            expect(
                await webUtil.verifyCSS(
                    individualsCard.locator(individuals.cardSecureTransaction),
                    individuals.cssProp.secureTransaction,
                ),
            ).toBeTruthy();
        });
    });
});
