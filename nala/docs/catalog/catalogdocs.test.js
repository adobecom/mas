import { expect, test } from '@playwright/test';
import { CATALOG_FRAGMENT_IDS, features } from './catalogdocs.spec.js';
import MasCatalog from './catalog.page.js';
import { createWorkerPageSetup, DOCS_GALLERY_PATH } from '../../utils/commerce.js';

let galleryPage;

test.skip(({ browserName }) => browserName !== 'chromium', 'Not supported to run on multiple browsers.');

const workerSetup = createWorkerPageSetup({
    pages: [{ name: 'US', url: DOCS_GALLERY_PATH.CATALOG }],
});

test.describe('Catalog gallery feature test suite', () => {
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

    test(`[Test Id - ${features[0].tcid}] ${features[0].name},${features[0].tags}`, async () => {
        const { data } = features[0];

        await test.step('step-1: Go to Catalog gallery page', async () => {
            const page = workerSetup.getPage('US');
            galleryPage = new MasCatalog(page);
            await workerSetup.verifyPageURL('US', DOCS_GALLERY_PATH.CATALOG, expect);
        });

        await test.step('step-2: Verify gallery heading', async () => {
            await expect(galleryPage.getGalleryHeading()).toBeVisible();
            await expect(galleryPage.getGalleryHeading()).toHaveText('Catalog Gallery');
        });

        await test.step('step-3: Verify catalog cards and AEM fragment ids', async () => {
            const cards = galleryPage.getCatalogCards();
            await expect(cards).toHaveCount(CATALOG_FRAGMENT_IDS.length);
            for (const id of CATALOG_FRAGMENT_IDS) {
                const card = galleryPage.getCard(id);
                await expect(card).toBeVisible();
                await expect(card).toHaveAttribute('variant', data.variant);
                await expect(card.locator(`aem-fragment[fragment="${id}"]`)).toHaveCount(1);
            }
        });

        await test.step('step-4: Verify sample card hydrated content', async () => {
            const card = galleryPage.getCard(data.sampleFragmentId);
            await expect(card.locator('h3').first()).toBeVisible();
            await expect(card.locator('h3').first()).not.toHaveText('');
            await expect(card.locator('div[slot="body-xs"]')).toBeVisible();
            await expect(card.locator('div[slot="body-xs"]')).not.toHaveText('');
        });
    });

    test(`[Test Id - ${features[1].tcid}] ${features[1].name},${features[1].tags}`, async () => {
        await test.step('step-1: Go to Catalog gallery page', async () => {
            const page = workerSetup.getPage('US');
            galleryPage = new MasCatalog(page);
            await workerSetup.verifyPageURL('US', DOCS_GALLERY_PATH.CATALOG, expect);
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
});
