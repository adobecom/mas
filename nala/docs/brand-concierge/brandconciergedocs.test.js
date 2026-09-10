import { expect, test } from '@playwright/test';
import { features } from './brandconciergedocs.spec.js';
import MasBrandConcierge from './brand-concierge.page.js';
import { createWorkerPageSetup, DOCS_GALLERY_PATH } from '../../utils/commerce.js';

let galleryPage;

test.skip(({ browserName }) => browserName !== 'chromium', 'Not supported to run on multiple browsers.');

const workerSetup = createWorkerPageSetup({
    pages: [{ name: 'US', url: DOCS_GALLERY_PATH.BRAND_CONCIERGE }],
});

test.describe('Brand Concierge gallery feature test suite', () => {
    test.beforeAll(async ({ browser, baseURL }) => {
        await workerSetup.setupWorkerPages({ browser, baseURL });
    });

    test.afterAll(async () => {
        await workerSetup.cleanupWorkerPages();
    });

    test.afterEach(async ({}, testInfo) => {
        workerSetup.attachWorkerErrorsToFailure(testInfo);
    });

    test(`${features[0].name},${features[0].tags}`, async () => {
        const { data } = features[0];

        await test.step('step-1: Go to Brand Concierge gallery page', async () => {
            const page = workerSetup.getPage('US');
            galleryPage = new MasBrandConcierge(page);
            await workerSetup.verifyPageURL('US', DOCS_GALLERY_PATH.BRAND_CONCIERGE, expect);
        });

        await test.step('step-2: Verify Brand Concierge card content', async () => {
            const card = galleryPage.getCard(data.id);
            await expect(card).toBeVisible();
            await expect(card).toHaveAttribute('variant', data.variant);
            await expect(card.locator('h3')).toContainText(data.title);
            const badge = card.locator('div[slot="badge"] merch-badge');
            await expect(badge).toBeVisible();
            await expect(card.locator('div[slot="body-xs"]')).toContainText(data.description);
            await expect(card.locator('div[slot="footer"] :is(a, button)').last()).toHaveText(data.cta);
        });
    });

    test(`[Test Id - ${features[1].tcid}] ${features[1].name},${features[1].tags}`, async () => {
        const { data } = features[1];

        await test.step('step-1: Go to Brand Concierge gallery page', async () => {
            const page = workerSetup.getPage('US');
            galleryPage = new MasBrandConcierge(page);
            await workerSetup.verifyPageURL('US', DOCS_GALLERY_PATH.BRAND_CONCIERGE, expect);
        });

        await test.step('step-2: Verify each card has an Open in Studio link below it', async () => {
            for (const id of data.ids) {
                const card = galleryPage.getCard(id);
                const studioLink = galleryPage.getStudioLink(id);
                await expect(card).toBeVisible();
                await expect(studioLink).toBeVisible();
                await expect(studioLink).toHaveText(/Open in Studio/);
                await expect(studioLink).toHaveAttribute('href', new RegExp(id));
                const cardBox = await card.boundingBox();
                const linkBox = await studioLink.boundingBox();
                expect(linkBox.y).toBeGreaterThanOrEqual(cardBox.y + cardBox.height - 2);
            }
        });
    });

    test(`${features[2].name},${features[2].tags}`, async () => {
        const { data } = features[2];

        await test.step('step-1: Go to Brand Concierge gallery page', async () => {
            const page = workerSetup.getPage('US');
            galleryPage = new MasBrandConcierge(page);
            await workerSetup.verifyPageURL('US', DOCS_GALLERY_PATH.BRAND_CONCIERGE, expect);
        });

        await test.step('step-2: Verify card without a badge renders correctly', async () => {
            const card = galleryPage.getCard(data.id);
            await expect(card).toBeVisible();
            await expect(card).toHaveAttribute('variant', data.variant);
            await expect(card.locator('h3')).toContainText(data.title);
            await expect(card.locator('div[slot="badge"] merch-badge')).toHaveCount(0);
            await expect(card.locator('div[slot="body-xs"]')).toContainText(data.description);
            await expect(card.locator('div[slot="footer"] :is(a, button)')).toHaveText(data.cta);
        });
    });
});
