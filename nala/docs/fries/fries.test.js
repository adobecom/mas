import { expect, test } from '@playwright/test';
import { features } from './fries.spec.js';
import FriesGalleryPage from './fries.page.js';
import {
    createWorkerPageSetup,
    DOCS_GALLERY_PATH,
} from '../../utils/commerce.js';

let friesPage;

test.skip(
    ({ browserName }) => browserName !== 'chromium',
    'Not supported to run on multiple browsers.',
);

const workerSetup = createWorkerPageSetup({
    pages: [{ name: 'US', url: DOCS_GALLERY_PATH.FRIES }],
});

test.describe('Fries Cards Feature', () => {
    test.beforeAll(async ({ browser, baseURL }) => {
        await workerSetup.setupWorkerPages({ browser, baseURL });
    });

    test.afterAll(async () => {
        await workerSetup.cleanupWorkerPages();
    });

    test.afterEach(async ({}, testInfo) => {
        workerSetup.attachWorkerErrorsToFailure(testInfo);
    });

    features.forEach((feature) => {
        test(`${feature.name},${feature.tags}`, async () => {
            const { data } = feature;
            const page = workerSetup.getPage('US');

            await test.step('1. Verify Fries gallery page is loaded', async () => {
                friesPage = new FriesGalleryPage(page);
                await workerSetup.verifyPageURL('US', feature.path, expect);
            });

            await test.step('2. Verify fries card hydrates and renders slotted content', async () => {
                const card = friesPage.getCard(data.fragment);
                await expect(card).toBeVisible();

                // checkReady throws if hydration failed (e.g. unknown variant). Pre-fix on
                // a leaf-bundle surface this would reject; on the docs gallery (mas.js
                // path) it has always worked, but we lock it in here as a fries-specific
                // smoke check that didn't exist before.
                await card.evaluate((el) => el.checkReady());

                await expect(card).toHaveAttribute('variant', data.variant);

                // The fries variant maps fields into named slots. If the variant layout
                // didn't resolve, none of these would exist.
                await expect(
                    card.locator('h3[slot="heading-xxs"]'),
                ).toBeVisible();
                await expect(card.locator('p[slot="price"]')).toBeVisible();
                await expect(card.locator('[slot="cta"]').first()).toBeVisible();
            });
        });
    });
});
