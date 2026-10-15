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

    for (const feature of features) {
        test(`${feature.name},${feature.tags}`, async () => {
            const { data } = feature;
            const page = await workerSetup.getPage('LU');
            const plansPage = new MasPlans(page);
            const card = plansPage.getCard(data.id);
            const price = plansPage.getCardPrice(data.id).locator(plansPage.price);

            await test.step('Verify the selected SMB content and Luxembourg price', async () => {
                await workerSetup.verifyPageURL('LU', feature.path, expect);
                await expect(card).toBeVisible();
                await expect(card).toHaveAttribute('variation-id', data.variationId);
                await expect(plansPage.getCardTitle(data.id)).toHaveText(data.title);
                await expect(price).toHaveText(data.price);
            });

            await test.step('Verify offer substitution and promotion context', async () => {
                await expect(card).toHaveAttribute('data-card-osi', data.osi);
                await expect(price).toHaveAttribute('data-wcs-osi', data.osi);

                for (const [attribute, expected] of [
                    ['data-promotion-project', data.promotionProject],
                    ['data-promotion-code', data.promoCode],
                    ['data-promotion-variation-project', data.promoVariationProject],
                ]) {
                    if (expected === null) {
                        await expect(card).not.toHaveAttribute(attribute);
                    } else {
                        await expect(card).toHaveAttribute(attribute, expected);
                    }
                }

                if (data.promotionProject === null) {
                    await expect(price).not.toHaveAttribute('data-replaced-osi');
                } else {
                    await expect(price).toHaveAttribute('data-replaced-osi', 'r_JXAnlFI7xD6FxWKl2ODvZriLYBoSL701Kd1hRyhe8');
                }
            });
        });
    }
});
