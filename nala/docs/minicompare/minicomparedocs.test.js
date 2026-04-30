import { expect, test } from '@playwright/test';
import { features } from './minicomparedocs.spec.js';
import MasMinicompare from './minicompare.page.js';
import { createWorkerPageSetup, DOCS_GALLERY_PATH } from '../../utils/commerce.js';

let galleryPage;

test.skip(({ browserName }) => browserName !== 'chromium', 'Not supported to run on multiple browsers.');

const workerSetup = createWorkerPageSetup({
    pages: [{ name: 'US', url: DOCS_GALLERY_PATH.MINICOMPARE }],
});

test.describe('Minicompare gallery feature test suite', () => {
    test.beforeAll(async ({ browser, baseURL }) => {
        await workerSetup.setupWorkerPages({ browser, baseURL });
    });

    test.afterAll(async () => {
        await workerSetup.cleanupWorkerPages();
    });

    test.afterEach(async ({}, testInfo) => {
        // eslint-disable-line no-empty-pattern
        workerSetup.attachWorkerErrorsToFailure(testInfo);
    });

    test(`${features[0].name},${features[0].tags}`, async () => {
        const { data } = features[0];

        await test.step('step-1: Go to Minicompare gallery page', async () => {
            const page = workerSetup.getPage('US');
            galleryPage = new MasMinicompare(page);
            await workerSetup.verifyPageURL('US', DOCS_GALLERY_PATH.MINICOMPARE, expect);
        });

        await test.step('step-2: Verify Minicompare card content', async () => {
            const card = galleryPage.getCard(data.id);
            await expect(card).toBeVisible();
            await expect(card).toHaveAttribute('variant', data.variant);
            await expect(card.locator('h3')).toContainText(data.title);
            await expect(card.locator('div.badge')).toContainText(data.badge);
            await expect(card.locator('div[slot="body-m"]')).toContainText(data.description);
            const footerCtas = card.locator('div[slot="footer"] :is(a, button)');
            await expect(footerCtas.first()).toHaveText(data.cta1);
            await expect(footerCtas.last()).toHaveText(data.cta2);
        });
    });

    test(`${features[1].name},${features[1].tags}`, async () => {
        await test.step('step-1: Go to Minicompare gallery page', async () => {
            const page = workerSetup.getPage('US');
            galleryPage = new MasMinicompare(page);
            await workerSetup.verifyPageURL('US', DOCS_GALLERY_PATH.MINICOMPARE, expect);
        });

        await test.step('step-2: Verify all CTA buttons have the same top (bounding box y)', async () => {
            const tolerancePx = 0;
            const buttons = galleryPage.getGalleryFooterCtas();
            const count = await buttons.count();
            expect(count).toBeGreaterThan(0);
            for (let i = 0; i < count; i += 1) {
                const btn = buttons.nth(i);
                await btn.scrollIntoViewIfNeeded();
                await expect(btn).toBeVisible();
            }
            const boxes = await Promise.all([...Array(count)].map((_, i) => buttons.nth(i).boundingBox()));
            const tops = boxes.map((b) => b?.y);
            expect(tops.every((y) => typeof y === 'number')).toBe(true);

            const sorted = [...tops].sort((a, b) => a - b);
            const sameTopGroups = [];
            let start = 0;
            for (let i = 1; i <= sorted.length; i += 1) {
                if (i === sorted.length || sorted[i] - sorted[i - 1] > tolerancePx) {
                    sameTopGroups.push(sorted.slice(start, i));
                    start = i;
                }
            }
            for (const group of sameTopGroups) {
                expect(Math.max(...group) - Math.min(...group)).toBeLessThanOrEqual(tolerancePx);
            }
        });
    });

    test(`${features[2].name},${features[2].tags}`, async () => {
        const { data } = features[2];
        const page = workerSetup.getPage('US');
        galleryPage = new MasMinicompare(page);

        await test.step('step-1: Go to Minicompare gallery page', async () => {
            await workerSetup.verifyPageURL('US', DOCS_GALLERY_PATH.MINICOMPARE, expect);
        });

        await test.step('step-2: Default divider color matches the variant fallback (no regression)', async () => {
            const card = galleryPage.getCard(data.id);
            await expect(card).toBeVisible();
            const row = galleryPage.getMnemonicRow(data.id, 0);
            await expect(row).toBeVisible();
            const defaultColor = await row.evaluate((el) => window.getComputedStyle(el).borderTopColor);
            expect(defaultColor).toBe(data.defaultDividerColor);
        });

        await test.step('step-3: Setting --merch-whats-included-divider-color on <merch-card> recolors the divider', async () => {
            const card = galleryPage.getCard(data.id);
            await card.evaluate(
                (el, color) => el.style.setProperty('--merch-whats-included-divider-color', color),
                data.overrideDividerColor,
            );
            const row = galleryPage.getMnemonicRow(data.id, 0);
            const overriddenColor = await row.evaluate((el) => window.getComputedStyle(el).borderTopColor);
            expect(overriddenColor).toBe(data.overrideDividerColor);
        });

        await test.step('step-4: Removing the override restores the default color', async () => {
            const card = galleryPage.getCard(data.id);
            await card.evaluate((el) => el.style.removeProperty('--merch-whats-included-divider-color'));
            const row = galleryPage.getMnemonicRow(data.id, 0);
            const restoredColor = await row.evaluate((el) => window.getComputedStyle(el).borderTopColor);
            expect(restoredColor).toBe(data.defaultDividerColor);
        });
    });
});
