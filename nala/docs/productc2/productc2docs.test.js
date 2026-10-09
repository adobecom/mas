import { expect, test } from '@playwright/test';
import { features } from './productc2docs.spec.js';
import MasProductC2 from './productc2.page.js';
import { createWorkerPageSetup, DOCS_GALLERY_PATH } from '../../utils/commerce.js';
import WebUtil from '../../libs/webutil.js';

let galleryPage;
let webUtil;

test.skip(({ browserName }) => browserName !== 'chromium', 'Not supported to run on multiple browsers.');

const workerSetup = createWorkerPageSetup({
    pages: [{ name: 'US', url: DOCS_GALLERY_PATH.PRODUCT_C2 }],
});

test.describe('Product-C2 gallery feature test suite', () => {
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

        await test.step('step-1: Go to ProductC2 gallery page', async () => {
            const page = workerSetup.getPage('US');
            galleryPage = new MasProductC2(page);
            webUtil = new WebUtil(page);
            await workerSetup.verifyPageURL('US', DOCS_GALLERY_PATH.PRODUCT_C2, expect);
        });

        await test.step('step-2: Verify ProductC2 card content', async () => {
            const card = galleryPage.getCard(data.id);
            const badge = galleryPage.getCardBadge(data.id);
            await expect(card).toBeVisible();
            await expect(card).toHaveAttribute('variant', data.variant);
            await expect(card.locator('p[slot="subtitle"]')).toContainText(data.subtitle);
            await expect(card.locator('merch-badge')).toContainText(data.badge);
            await expect(card.locator('div[slot="body-xs"]')).toContainText(data.description);
            await expect(card.locator('div[slot="footer"] :is(a, button)')).toHaveText(data.cta);
            await expect(card).toHaveAttribute('background-color', data.bgcolor);
            await expect(galleryPage.getCard(data.id).locator('[slot="heading-m"] [data-template="price"]')).toContainText(
                data.mainPriceText,
            );
            expect(await webUtil.verifyCSS(await card, galleryPage.cssPropBlack.card)).toBeTruthy();
            expect(await webUtil.verifyCSS(await badge, galleryPage.cssPropBlack.badge)).toBeTruthy();
        });
    });

    test(`${features[1].name},${features[1].tags}`, async () => {
        const { data } = features[1];

        await test.step('step-1: Go to ProductC2 gallery page', async () => {
            const page = workerSetup.getPage('US');
            galleryPage = new MasProductC2(page);
            webUtil = new WebUtil(page);
            await workerSetup.verifyPageURL('US', DOCS_GALLERY_PATH.PRODUCT_C2, expect);
        });

        await test.step('step-2: Verify ProductC2 card content', async () => {
            const card = galleryPage.getCard(data.id);
            const badge = galleryPage.getCardBadge(data.id);
            await expect(card).toBeVisible();
            await expect(card).toHaveAttribute('variant', data.variant);
            await expect(card.locator('p[slot="subtitle"]')).toContainText(data.subtitle);
            await expect(card.locator('div[slot="body-xs"]')).toContainText(data.description);
            await expect(card).toHaveAttribute('background-color', data.bgcolor);
            const footerCtas = galleryPage.getCard(data.id).locator('div[slot="footer"] :is(a, button)');
            await expect(footerCtas.first()).toHaveText(data.cta1);
            await expect(footerCtas.last()).toHaveText(data.cta2);
            await expect(galleryPage.getCard(data.id).locator('[slot="heading-m"] [data-template="price"]')).toContainText(
                data.mainPriceText,
            );
            expect(await webUtil.verifyCSS(await card, galleryPage.cssPropGray.card)).toBeTruthy();
            expect(await webUtil.verifyCSS(await badge, galleryPage.cssPropGray.badge)).toBeTruthy();
        });
    });
});
