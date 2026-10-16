import { expect, test } from '../../../libs/docs-test.js';
import { features } from './promo-use-cases.spec.js';
import MasPlans from '../plans.page.js';
import { createWorkerPageSetup } from '../../../utils/commerce.js';

const workerSetup = createWorkerPageSetup({
    pages: [{ name: 'LU', url: features[0].path }],
});

test.describe('ACOM MAS promotion and PZN use cases', () => {
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

    // @MAS-DOCS-Promo-PZN-SMB-Excluded
    // Verify the excluded SMB keeps its content and offer without applying a promotion.
    test(`${features[0].name},${features[0].tags}`, async () => {
        const { data } = features[0];
        const page = await workerSetup.getPage('LU');
        const plansPage = new MasPlans(page);
        const card = plansPage.getCard(data.id);
        const price = plansPage.getCardPrice(data.id).locator(plansPage.price);

        await test.step('Verify the excluded SMB content and Luxembourg price format', async () => {
            await workerSetup.verifyPageURL('LU', features[0].path, expect);
            await expect(card).toBeVisible();
            await expect(card).toHaveAttribute('variation-id', data.variationId);
            await expect(plansPage.getCardTitle(data.id)).toHaveText(data.title);
            await expect(price).toHaveText(data.price);
        });

        await test.step('Verify the excluded SMB has no promotion or offer substitution', async () => {
            await expect(card).toHaveAttribute('data-card-osi', data.osi);
            await expect(price).toHaveAttribute('data-wcs-osi', data.osi);
            await expect(card).not.toHaveAttribute('data-promotion-project');
            await expect(card).not.toHaveAttribute('data-promotion-code');
            await expect(card).not.toHaveAttribute('data-promotion-variation-project');
            await expect(price).not.toHaveAttribute('data-replaced-osi');
        });
    });

    // @MAS-DOCS-Promo-PZN-SMB-Included
    // Verify the included SMB keeps its content and applies the promotional offer without a promo variation.
    test(`${features[1].name},${features[1].tags}`, async () => {
        const { data } = features[1];
        const page = await workerSetup.getPage('LU');
        const plansPage = new MasPlans(page);
        const card = plansPage.getCard(data.id);
        const price = plansPage.getCardPrice(data.id).locator(plansPage.price);

        await test.step('Verify the included SMB content is preserved and the Luxembourg price format', async () => {
            await workerSetup.verifyPageURL('LU', features[1].path, expect);
            await expect(card).toBeVisible();
            await expect(card).toHaveAttribute('variation-id', data.variationId);
            await expect(plansPage.getCardTitle(data.id)).toHaveText(data.title);
            await expect(price).toHaveText(data.price);
        });

        await test.step('Verify promotion mapping without a promo variation', async () => {
            await expect(card).toHaveAttribute('data-card-osi', data.osi);
            await expect(price).toHaveAttribute('data-wcs-osi', data.osi);
            await expect(card).toHaveAttribute('data-promotion-project', data.promotionProject);
            await expect(card).toHaveAttribute('data-promotion-code', data.promoCode);
            await expect(card).not.toHaveAttribute('data-promotion-variation-project');
            await expect(price).toHaveAttribute('data-replaced-osi', data.replacedOsi);
        });
    });

    // @MAS-DOCS-Promo-PZN-SMB-Promo-Variation
    // Verify the SMB uses its dedicated promo variation and applies the promotional offer.
    test(`${features[2].name},${features[2].tags}`, async () => {
        const { data } = features[2];
        const page = await workerSetup.getPage('LU');
        const plansPage = new MasPlans(page);
        const card = plansPage.getCard(data.id);
        const price = plansPage.getCardPrice(data.id).locator(plansPage.price);

        await test.step('Verify the dedicated SMB promo variation and Luxembourg price format', async () => {
            await workerSetup.verifyPageURL('LU', features[2].path, expect);
            await expect(card).toBeVisible();
            await expect(card).toHaveAttribute('variation-id', data.variationId);
            await expect(plansPage.getCardTitle(data.id)).toHaveText(data.title);
            await expect(price).toHaveText(data.price);
        });

        await test.step('Verify promotion mapping on the SMB promo variation', async () => {
            await expect(card).toHaveAttribute('data-card-osi', data.osi);
            await expect(price).toHaveAttribute('data-wcs-osi', data.osi);
            await expect(card).toHaveAttribute('data-promotion-project', data.promotionProject);
            await expect(card).toHaveAttribute('data-promotion-code', data.promoCode);
            await expect(card).toHaveAttribute('data-promotion-variation-project', data.promoVariationProject);
            await expect(price).toHaveAttribute('data-replaced-osi', data.replacedOsi);
        });
    });
});
