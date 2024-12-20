import { expect, test } from '@playwright/test';
import studiopkg from './studio.spec.js';
import StudioPage from './studio.page.js';
import ims from '../libs/imslogin.js';

const miloLibs = process.env.MILO_LIBS || '';

let studio;
const { features } = studiopkg;

test.beforeEach(async ({ page, browserName }) => {
    test.skip(
        browserName !== 'chromium',
        'Not supported to run on multiple browsers.',
    );
    studio = new StudioPage(page);
});

test.describe('M@S Studio feature test suite', () => {
    // @studio-direct-search - Validate direct search feature in mas studio
    test(`${features[0].name},${features[0].tags}`, async ({
        page,
        baseURL,
    }) => {
        test.slow();
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.cardid}`;
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Log in to MAS studio', async () => {
            await page.goto(testPage);
            await page.waitForURL(
                '**/auth.services.adobe.com/en_US/index.html**/',
            );
            features[0].url =
                'https://main--mas--adobecom.aem.live/studio.html';
            await ims.fillOutSignInForm(features[0], page);
            await expect(async () => {
                const response = await page.request.get(features[0].url);
                expect(response.status()).toBe(200);
            }).toPass();
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Go to MAS Studio test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-3: Validate search results', async () => {
            await expect(await studio.renderView).toBeVisible();

            const cards = await studio.renderView.locator('merch-card');
            expect(await cards.count()).toBe(2);
        });
    });
});
