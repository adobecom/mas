import { expect, test } from '@playwright/test';
import { features } from './specialofferdocs.spec.js';
import MasSpecialoffer from './specialoffer.page.js';
import { createWorkerPageSetup, DOCS_GALLERY_PATH } from '../../utils/commerce.js';

let galleryPage;

test.skip(({ browserName }) => browserName !== 'chromium', 'Not supported to run on multiple browsers.');

const workerSetup = createWorkerPageSetup({
    pages: [{ name: 'US', url: DOCS_GALLERY_PATH.SPECIALOFFER }],
});

test.describe('Special Offer gallery feature test suite', () => {
    test.beforeAll(async ({ browser, baseURL }) => {
        await workerSetup.setupWorkerPages({ browser, baseURL });
    });

    test.afterAll(async () => {
        await workerSetup.cleanupWorkerPages();
    });

    test.afterEach(async ({}, testInfo) => {
        workerSetup.attachWorkerErrorsToFailure(testInfo);
    });

    test(`[Test Id - ${features[0].tcid}] ${features[0].name},${features[0].tags}`, async () => {
        const { data } = features[0];

        await test.step('step-1: Go to Special Offer gallery page', async () => {
            const page = workerSetup.getPage('US');
            galleryPage = new MasSpecialoffer(page);
            await workerSetup.verifyPageURL('US', DOCS_GALLERY_PATH.SPECIALOFFER, expect);
        });

        await test.step('step-2: Verify Special Offer card content', async () => {
            const card = galleryPage.getCard(data.id);
            await expect(card).toBeVisible();
            await expect(card).toHaveAttribute('variant', data.variant);
            await expect(card.locator('[slot="heading-xs"]').first()).toContainText(data.title);
            await expect(card.locator('div.badge')).toContainText(data.badge);
            await expect(card.locator('[slot="detail-m"]')).toContainText(data.detailM);
            await expect(card.locator('div[slot="body-xs"]')).toContainText(data.description);
            const footerCtas = card.locator('div[slot="footer"] :is(a, button)');
            await expect(footerCtas.first()).toHaveText(data.cta1);
            await expect(footerCtas.last()).toHaveText(data.cta2);
        });
    });

    test(`[Test Id - ${features[1].tcid}] ${features[1].name},${features[1].tags}`, async () => {
        await test.step('step-1: Go to Special Offer gallery page', async () => {
            const page = workerSetup.getPage('US');
            galleryPage = new MasSpecialoffer(page);
            await workerSetup.verifyPageURL('US', DOCS_GALLERY_PATH.SPECIALOFFER, expect);
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
