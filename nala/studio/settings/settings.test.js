import { test, expect, studio, miloLibs, setTestPage } from '../../libs/mas-test.js';
import { features } from './settings.spec.js';
import SettingsPage from './settings.page.js';

test.skip(({ browserName }) => browserName !== 'chromium', 'Not supported to run on multiple browsers.');

test.describe('Settings - hideTrialCTAs', () => {
    // @MAS-Settings-hideTrialCTAs-enabled — Trial CTA stripped; buy CTA visible (fr_FR nala fragment)
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = `${baseURL}${features[0].path}${miloLibs}${features[0].browserParams}${data.cardid}`;
        setTestPage(testPage);
        const settingsPage = new SettingsPage(page);

        await test.step('step-1: Navigate to Studio card', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Verify card is visible', async () => {
            const card = await studio.getCard(data.cardid);
            await expect(card).toBeVisible();
        });

        await test.step('step-3: Verify trial CTA is stripped', async () => {
            await expect(settingsPage.freeTrialCta).toHaveCount(0);
            await expect(settingsPage.freeTrialCta).not.toBeVisible();
        });

        await test.step('step-4: Verify buy CTA is present', async () => {
            await expect(settingsPage.buyNowCta).toBeVisible();
        });
    });

    // @MAS-Settings-hideTrialCTAs-enabled-promo — Promo card: trial CTA stripped; buy CTA visible
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const { data } = features[1];
        const testPage = `${baseURL}${features[1].path}${miloLibs}${features[1].browserParams}${data.cardid}`;
        setTestPage(testPage);
        const settingsPage = new SettingsPage(page);

        await test.step('step-1: Navigate to Studio card', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Verify card is visible', async () => {
            const card = await studio.getCard(data.cardid);
            await expect(card).toBeVisible();
        });

        await test.step('step-3: Verify trial CTA is stripped', async () => {
            await expect(settingsPage.freeTrialCta).toHaveCount(0);
            await expect(settingsPage.freeTrialCta).not.toBeVisible();
        });

        await test.step('step-4: Verify buy CTA is present', async () => {
            await expect(settingsPage.buyNowCta).toBeVisible();
        });
    });

    // @MAS-Settings-hideTrialCTAs-disabled — Fragment shows buy now and free trial; trial CTA not hidden (en_GB nala)
    test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
        const { data } = features[2];
        const testPage = `${baseURL}${features[2].path}${miloLibs}${features[2].browserParams}${data.cardid}`;
        setTestPage(testPage);
        const settingsPage = new SettingsPage(page);

        await test.step('step-1: Navigate to Studio card', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
        });

        await test.step('step-2: Verify card is visible', async () => {
            const card = await studio.getCard(data.cardid);
            await expect(card).toBeVisible();
        });

        await test.step('step-3: Verify buy now and free trial CTAs are shown', async () => {
            await expect(settingsPage.buyNowCta).toBeVisible();
            await expect(settingsPage.buyNowCta).toContainText(data.buyCta, { ignoreCase: true });
            await expect(settingsPage.freeTrialCta).toHaveCount(1);
            await expect(settingsPage.freeTrialCta).toBeVisible();
            await expect(settingsPage.freeTrialCta).toContainText(data.trialCta, { ignoreCase: true });
        });

        await test.step('step-4: Verify free trial CTA is not hidden', async () => {
            await expect(settingsPage.freeTrialCta).not.toBeHidden();
        });
    });
});
