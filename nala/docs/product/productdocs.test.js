import { expect, test } from '@playwright/test';
import { features } from './productdocs.spec.js';
import MasProduct from './product.page.js';
import WebUtil from '../../libs/webutil.js';
import { createWorkerPageSetup, DOCS_GALLERY_PATH } from '../../utils/commerce.js';

let galleryPage;

test.skip(({ browserName }) => browserName !== 'chromium', 'Not supported to run on multiple browsers.');

const workerSetup = createWorkerPageSetup({
    pages: [{ name: 'US', url: DOCS_GALLERY_PATH.PRODUCT }],
});

test.describe('Product gallery feature test suite', () => {
    test.describe.configure({ mode: 'default' });
    test.beforeAll(async ({ browser, baseURL }) => {
        await workerSetup.setupWorkerPages({ browser, baseURL });
    });

    test.afterAll(async () => {
        await workerSetup.cleanupWorkerPages();
    });

    test.beforeEach(async () => {
        await workerSetup.beginTest();
    });

    test.afterEach(async ({}, testInfo) => {
        await workerSetup.finishTest(testInfo);
    });

    test(`${features[0].name},${features[0].tags}`, async () => {
        const { data } = features[0];

        await test.step('step-1: Go to Product gallery page', async () => {
            const page = await workerSetup.getPage('US');
            galleryPage = new MasProduct(page);
            await workerSetup.verifyPageURL('US', DOCS_GALLERY_PATH.PRODUCT, expect);
        });

        await test.step('step-2: Verify Product card content', async () => {
            const card = galleryPage.getCard(data.id);
            await expect(card).toBeVisible();
            await expect(card).toHaveAttribute('variant', data.variant);
            await expect(card.locator('h3')).toContainText(data.title);
            await expect(card.locator('merch-badge')).toContainText(data.badge);
            await expect(card.locator('div[slot="body-xs"]')).toContainText(data.description);
            await expect(card.locator('div[slot="footer"] :is(a, button)')).toHaveText(data.cta);
        });
    });

    test(`[Test Id - ${features[1].tcid}] ${features[1].name},${features[1].tags}`, async () => {
        await test.step('step-1: Go to Product gallery page', async () => {
            const page = await workerSetup.getPage('US');
            galleryPage = new MasProduct(page);
            await workerSetup.verifyPageURL('US', DOCS_GALLERY_PATH.PRODUCT, expect);
        });

        await test.step('step-2: Verify all CTA buttons have the same top (bounding box y)', async () => {
            await WebUtil.expectGalleryFooterAlignment(
                galleryPage.page.locator('.three-merch-cards merch-card'),
                galleryPage.getGalleryFooterCtas(),
            );
        });
    });

    test(`${features[2].name},${features[2].tags}`, async () => {
        const { data } = features[2];

        await test.step('step-1: Go to Product gallery page', async () => {
            const page = await workerSetup.getPage('US');
            galleryPage = new MasProduct(page);
            await workerSetup.verifyPageURL('US', DOCS_GALLERY_PATH.PRODUCT, expect);
        });

        await test.step('step-2: Verify that Product card title and icon act as modal triggers', async () => {
            const card = galleryPage.getCard(data.id);
            await expect(card).toBeVisible();
            await expect(card).toHaveAttribute('variant', data.variant);
            const titleEl = card.locator('h3');
            const cardIcon = card.locator('merch-icon[slot="icons"]');
            await expect(titleEl).toHaveAttribute('class', 'modal-trigger');
            await expect(titleEl).toHaveAttribute('role', 'link');
            await expect(cardIcon).toHaveAttribute('class', 'modal-trigger');
            await expect(cardIcon).toHaveAttribute('role', 'link');
        });
    });
});
