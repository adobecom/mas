import { expect, test } from '@playwright/test';
import { features } from './masks.spec.js';
import MasksPage from './masks.page.js';
import { constructTestUrl } from '../../utils/commerce.js';

test.skip(({ browserName }) => browserName !== 'chromium', 'Not supported to run on multiple browsers.');

test.describe('MAS Docs Masks feature test suite', () => {
    // @MAS-Docs-Masks
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const testPage = constructTestUrl(baseURL, features[0].path);
        const masksPage = new MasksPage(page);

        await test.step('step-1: Load masks doc page and wait for cards', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await page.waitForSelector('merch-card[variant^="plans"]', { timeout: 30000 });
            await page.waitForTimeout(3000);
        });

        await test.step('step-2: Click Mask button to apply nala-mask', async () => {
            await masksPage.btnMask.click();
            await page.waitForTimeout(3000);
            // wait for all three cards to show the masked title
            for (const id of data.fragmentIds) {
                await expect(masksPage.card(id).title).toContainText(data.mask.title, { timeout: 15000 });
            }
        });

        await test.step('step-3: Verify all cards have masked badge', async () => {
            for (const id of data.fragmentIds) {
                const { badge } = masksPage.card(id);
                await expect(badge).toContainText(data.mask.badge);
                const bgColor = await badge.getAttribute('background-color');
                expect(bgColor).toMatch(/yellow/i);
            }
        });

        await test.step('step-4: Verify all cards have masked title', async () => {
            for (const id of data.fragmentIds) {
                await expect(masksPage.card(id).title).toContainText(data.mask.title);
            }
        });

        await test.step('step-5: Verify third card has productName and firstLine placeholders replaced', async () => {
            const thirdCardId = data.fragmentIds[2];
            const { description, bodyM } = masksPage.card(thirdCardId);
            await expect(bodyM).toContainText(data.thirdCard.productName);
            await expect(description.locator('ul li').first()).toContainText(data.thirdCard.firstLine);
        });
    });
});
