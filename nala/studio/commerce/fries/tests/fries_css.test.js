import { expect, test } from '@playwright/test';
import StudioPage from '../../../studio.page.js';
import CCDFriesSpec from '../specs/fries_css.spec.js';
import CCDFries from '../fries.page.js';
import WebUtil from '../../../../libs/webutil.js';

const { features } = CCDFriesSpec;
const miloLibs = process.env.MILO_LIBS || '';

let studio;
let fries;
let webUtil;

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
});

test.describe('M@S Studio Commerce Fries card test suite', () => {
    // @studio-fries-css - Validate all CSS properties for fries card in parallel
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.cardid}`;
        const friesCard = await studio.getCard(data.cardid);
        console.info('[Test Page]: ', testPage);

        const validationLabels = ['card', 'title', 'description', 'price', 'cta', 'icon'];

        await test.step('step-1: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Validate fries card is visible', async () => {
            await expect(friesCard).toBeVisible();
        });

        await test.step('step-3: Validate all CSS properties in parallel', async () => {
            const results = await Promise.allSettled([
                // Card container CSS
                test.step('Validation-1: Validate card container CSS', async () => {
                    expect(await webUtil.verifyCSS(friesCard, fries.cssProp.card)).toBeTruthy();
                }),

                // Card title CSS
                test.step('Validation-2: Validate card title CSS', async () => {
                    expect(await webUtil.verifyCSS(friesCard.locator(fries.title), fries.cssProp.title)).toBeTruthy();
                }),

                // Card description CSS
                test.step('Validation-3: Validate card description CSS', async () => {
                    expect(
                        await webUtil.verifyCSS(friesCard.locator(fries.description), fries.cssProp.description),
                    ).toBeTruthy();
                }),

                // Card price CSS
                test.step('Validation-4: Validate card price CSS', async () => {
                    expect(await webUtil.verifyCSS(friesCard.locator(fries.price).first(), fries.cssProp.price)).toBeTruthy();
                }),

                // Card CTA CSS
                test.step('Validation-5: Validate card CTA CSS', async () => {
                    expect(await webUtil.verifyCSS(friesCard.locator(fries.cta), fries.cssProp.cta)).toBeTruthy();
                }),

                // Card icon CSS
                test.step('Validation-6: Validate card icon CSS', async () => {
                    expect(await webUtil.verifyCSS(friesCard.locator(fries.icon).first(), fries.cssProp.icon)).toBeTruthy();
                }),
            ]);

            // Check results and report any failures
            const failures = results
                .map((result, index) => ({ result, index }))
                .filter(({ result }) => result.status === 'rejected')
                .map(({ result, index }) => `🔍 Validation-${index + 1} (${validationLabels[index]}) failed: ${result.reason}`);

            if (failures.length > 0) {
                throw new Error(`❌ Fries card CSS validation failures:\n${failures.join('\n')}`);
            }
        });
    });
});
