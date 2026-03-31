import { test, expect, studio, miloLibs, setTestPage } from '../../libs/mas-test.js';
import { features } from './settings.spec.js';
import SettingsPage from './settings.page.js';

test.skip(({ browserName }) => browserName !== 'chromium', 'Not supported to run on multiple browsers.');

const enabledFeatures = features.filter((f) => !f.data.trialCta);
const disabledFeature = features.find((f) => f.data.trialCta);

test.describe('Settings - hideTrialCTAs enabled', () => {
    enabledFeatures.forEach((feature) => {
        test(`${feature.name},${feature.tags}`, async ({ page, baseURL }) => {
            const { data } = feature;
            const testPage = `${baseURL}${feature.path}${miloLibs}${feature.browserParams}${data.cardid}`;
            setTestPage(testPage);
            const settingsPage = new SettingsPage(page);

            await test.step('1. Navigate to Studio card', async () => {
                await page.goto(testPage);
                await page.waitForLoadState('domcontentloaded');
            });

            await test.step('2. Verify card is visible', async () => {
                const card = await studio.getCard(data.cardid);
                await expect(card).toBeVisible();
            });

            await test.step('3. Verify trial CTA is stripped', async () => {
                await expect(settingsPage.freeTrialCta).toHaveCount(0);
            });

            await test.step('4. Verify buy CTA is present', async () => {
                await expect(settingsPage.buyNowCta).toBeVisible();
            });
        });
    });
});

test.describe('Settings - hideTrialCTAs disabled (route interception)', () => {
    test(`${disabledFeature.name},${disabledFeature.tags}`, async ({ page, baseURL }) => {
        const { data } = disabledFeature;
        const testPage = `${baseURL}${disabledFeature.path}${miloLibs}${disabledFeature.browserParams}${data.cardid}`;
        setTestPage(testPage);
        const settingsPage = new SettingsPage(page);

        await test.step('1. Set up route interception to disable hideTrialCTAs setting', async () => {
            await page.route('**/mas/io/fragment**', async (route) => {
                const response = await route.fetch();
                const json = await response.json();
                if (json.settings) {
                    json.settings.hideTrialCTAs = false;
                }
                await route.fulfill({ response, json });
            });
        });

        await test.step('2. Navigate to Studio card', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('3. Verify card is visible', async () => {
            const card = await studio.getCard(data.cardid);
            await expect(card).toBeVisible();
        });

        await test.step('4. Verify trial CTA is rendered', async () => {
            await expect(settingsPage.freeTrialCta).toBeVisible();
        });

        await test.step('5. Verify buy CTA is also rendered', async () => {
            await expect(settingsPage.buyNowCta).toBeVisible();
        });
    });
});
