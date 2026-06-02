import { expect, test } from '@playwright/test';
import { features } from './promotions.spec.js';
import MasPlans from '../plans.page.js';
import { addUrlQueryParams, createWorkerPageSetup, DOCS_GALLERY_PATH } from '../../../utils/commerce.js';

test.skip(({ browserName }) => browserName !== 'chromium', 'Not supported to run on multiple browsers.');

const browserParams = features[0].browserParams;
const [previewParam, instantParam] = features[1].browserParams;

const grCoWithPreview = addUrlQueryParams(
    addUrlQueryParams(DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_co, instantParam),
    previewParam,
);
const grEnWithPreview = addUrlQueryParams(
    addUrlQueryParams(DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_EN, instantParam),
    previewParam,
);
const grCoBase = addUrlQueryParams(DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_co, instantParam);
const grEnBase = addUrlQueryParams(DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_EN, instantParam);

const workerSetup = createWorkerPageSetup({
    pages: [
        { name: 'US', url: addUrlQueryParams(DOCS_GALLERY_PATH.PLANS_COLLECTION.US, browserParams) },
        { name: 'US_base', url: DOCS_GALLERY_PATH.PLANS_COLLECTION.US },
        { name: 'GR_co', url: grCoWithPreview },
        { name: 'GR_EN', url: grEnWithPreview },
        { name: 'GR_co_base', url: grCoBase },
        { name: 'GR_EN_base', url: grEnBase },
    ],
});

test.describe('ACOM MAS Promotions feature test suite', () => {
    test.beforeAll(async ({ browser, baseURL }) => {
        await workerSetup.setupWorkerPages({ browser, baseURL });
    });

    test.afterAll(async () => {
        await workerSetup.cleanupWorkerPages();
    });

    test.afterEach(async ({}, testInfo) => {
        workerSetup.attachWorkerErrorsToFailure(testInfo);
    });

    // @MAS-Promotions-Card-in-Collection
    test(`${features[0].name},${features[0].tags}`, async () => {
        const { data } = features[0];

        await test.step('step-1: Verify promotion card on US with preview', async () => {
            const page = workerSetup.getPage('US');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('US', DOCS_GALLERY_PATH.PLANS_COLLECTION.US, expect);
            await expect(acomPage.getCard(data.id)).toBeVisible();
            await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
            await expect(acomPage.getCardBadge(data.id)).toContainText(data.badgeText);
            await expect(acomPage.getCardBadge(data.id)).toHaveCSS('background-color', data.badgeColor);
            await expect(acomPage.getCardPrice(data.id)).toContainText(data.promoPrice);
            await expect(acomPage.getCardStrikethroughPrice(data.id)).toContainText(data.price);
            await expect(acomPage.getCardStrikethroughPrice(data.id)).toHaveCSS('text-decoration-line', 'line-through');
        });

        await test.step('step-2: Verify promotion card on US without preview', async () => {
            const page = workerSetup.getPage('US_base');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('US_base', DOCS_GALLERY_PATH.PLANS_COLLECTION.US, expect);
            await expect(acomPage.getCard(data.id)).toBeVisible();
            await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
            await expect(acomPage.getCardBadge(data.id)).toContainText(data.badgeText);
            await expect(acomPage.getCardBadge(data.id)).toHaveCSS('background-color', data.badgeColor);
            await expect(acomPage.getCardPrice(data.id)).toContainText(data.promoPrice);
            await expect(acomPage.getCardStrikethroughPrice(data.id)).toContainText(data.price);
            await expect(acomPage.getCardStrikethroughPrice(data.id)).toHaveCSS('text-decoration-line', 'line-through');
        });
    });

    // @MAS-Promotions-Regional-Variation-Card-in-Collection
    test(`${features[1].name},${features[1].tags}`, async () => {
        const { data } = features[1];

        // uncomment below steps when MWPW-197336 is fixed

        // await test.step('step-1: Verify regional promotion card on GR_co with preview', async () => {
        //     const page = workerSetup.getPage('GR_co');
        //     const acomPage = new MasPlans(page);
        //     await workerSetup.verifyPageURL('GR_co', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_co, expect);
        //     await expect(acomPage.getCard(data.id)).toBeVisible();
        //     await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
        //     await expect(acomPage.getCardBadge(data.id)).toContainText(data.badgeText);
        //     await expect(acomPage.getCardBadge(data.id)).toHaveCSS('background-color', data.badgeColor);
        //     await expect(acomPage.getCardBadge(data.id)).toHaveCSS('border-color', data.badgeBorderColor);
        //     await expect(acomPage.getCard(data.id)).toHaveCSS('background-color', data.borderColor);
        //     await expect(acomPage.getCardPrice(data.id)).toContainText(data.promoPrice);
        //     await expect(acomPage.getCardStrikethroughPrice(data.id)).toContainText(data.price);
        //     await expect(acomPage.getCardStrikethroughPrice(data.id)).toHaveCSS('text-decoration-line', 'line-through');
        // });

        await test.step('step-2: Verify regional promotion card on GR_EN with preview', async () => {
            const page = workerSetup.getPage('GR_EN');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('GR_EN', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_EN, expect);
            await expect(acomPage.getCard(data.id)).toBeVisible();
            await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
            await expect(acomPage.getCardBadge(data.id)).toContainText(data.badgeText);
            await expect(acomPage.getCardBadge(data.id)).toHaveCSS('background-color', data.badgeColor);
            await expect(acomPage.getCardBadge(data.id)).toHaveCSS('border-color', data.badgeBorderColor);
            await expect(acomPage.getCard(data.id)).toHaveCSS('background-color', data.borderColor);
            await expect(acomPage.getCardPrice(data.id)).toContainText(data.promoPrice);
            await expect(acomPage.getCardStrikethroughPrice(data.id)).toContainText(data.price);
            await expect(acomPage.getCardStrikethroughPrice(data.id)).toHaveCSS('text-decoration-line', 'line-through');
        });

        await test.step('step-3: Verify regional promotion card on GR_co without preview - no strikethrough', async () => {
            const page = workerSetup.getPage('GR_co_base');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('GR_co_base', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_co, expect);
            await expect(acomPage.getCard(data.id)).toBeVisible();
            await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
            await expect(acomPage.getCardBadge(data.id)).toContainText(data.badgeText);
            await expect(acomPage.getCardBadge(data.id)).toHaveCSS('background-color', data.badgeColor);
            await expect(acomPage.getCardBadge(data.id)).toHaveCSS('border-color', data.badgeBorderColor);
            await expect(acomPage.getCard(data.id)).toHaveCSS('background-color', data.borderColor);
            await expect(acomPage.getCardPrice(data.id)).toContainText(data.price);
            await expect(acomPage.getCardStrikethroughPrice(data.id)).not.toBeVisible();
        });

        await test.step('step-4: Verify regional promotion card on GR_EN without preview - no strikethrough', async () => {
            const page = workerSetup.getPage('GR_EN_base');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('GR_EN_base', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_EN, expect);
            await expect(acomPage.getCard(data.id)).toBeVisible();
            await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
            await expect(acomPage.getCardBadge(data.id)).toContainText(data.badgeText);
            await expect(acomPage.getCardBadge(data.id)).toHaveCSS('background-color', data.badgeColor);
            await expect(acomPage.getCardBadge(data.id)).toHaveCSS('border-color', data.badgeBorderColor);
            await expect(acomPage.getCard(data.id)).toHaveCSS('background-color', data.borderColor);
            await expect(acomPage.getCardPrice(data.id)).toContainText(data.price);
            await expect(acomPage.getCardStrikethroughPrice(data.id)).not.toBeVisible();
        });
    });

    // @MAS-Promotions-Grouped-Variation-Card-in-Collection
    test(`${features[2].name},${features[2].tags}`, async () => {
        const { data } = features[2];
        // uncomment below steps when MWPW-197336 is fixed

        // await test.step('step-1: Verify grouped promotion card on GR_co with preview', async () => {
        //     const page = workerSetup.getPage('GR_co');
        //     const acomPage = new MasPlans(page);
        //     await workerSetup.verifyPageURL('GR_co', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_co, expect);
        //     await expect(acomPage.getCard(data.id)).toBeVisible();
        //     await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
        //     await expect(acomPage.getCardBadge(data.id)).toContainText(data.badgeText);
        //     await expect(acomPage.getCardBadge(data.id)).toHaveCSS('background-color', data.badgeColor);
        //     await expect(acomPage.getCardBadge(data.id)).toHaveCSS('border-color', data.badgeBorderColor);
        //     await expect(acomPage.getCardPrice(data.id)).toContainText(data.promoPrice);
        //     await expect(acomPage.getCardStrikethroughPrice(data.id)).toContainText(data.price);
        //     await expect(acomPage.getCardStrikethroughPrice(data.id)).toHaveCSS('text-decoration-line', 'line-through');
        // });

        await test.step('step-2: Verify grouped promotion card on GR_EN with preview', async () => {
            const page = workerSetup.getPage('GR_EN');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('GR_EN', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_EN, expect);
            await expect(acomPage.getCard(data.id)).toBeVisible();
            await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
            await expect(acomPage.getCardBadge(data.id)).toContainText(data.badgeText);
            await expect(acomPage.getCardBadge(data.id)).toHaveCSS('background-color', data.badgeColor);
            await expect(acomPage.getCardBadge(data.id)).toHaveCSS('border-color', data.badgeBorderColor);
            await expect(acomPage.getCardPrice(data.id)).toContainText(data.promoPrice);
            await expect(acomPage.getCardStrikethroughPrice(data.id)).toContainText(data.price);
            await expect(acomPage.getCardStrikethroughPrice(data.id)).toHaveCSS('text-decoration-line', 'line-through');
        });
        // uncomment below steps when MWPW-197336 is fixed

        // await test.step('step-3: Verify grouped promotion card on GR_co without preview - no strikethrough', async () => {
        //     const page = workerSetup.getPage('GR_co_base');
        //     const acomPage = new MasPlans(page);
        //     await workerSetup.verifyPageURL('GR_co_base', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_co, expect);
        //     await expect(acomPage.getCard(data.id)).toBeVisible();
        //     await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
        //     await expect(acomPage.getCardBadge(data.id)).toContainText(data.badgeText);
        //     await expect(acomPage.getCardBadge(data.id)).toHaveCSS('background-color', data.badgeColor);
        //     await expect(acomPage.getCardBadge(data.id)).toHaveCSS('border-color', data.badgeBorderColor);
        //     await expect(acomPage.getCardPrice(data.id)).toContainText(data.price);
        //     await expect(acomPage.getCardStrikethroughPrice(data.id)).not.toBeVisible();
        // });

        await test.step('step-4: Verify grouped promotion card on GR_EN without preview - no strikethrough', async () => {
            const page = workerSetup.getPage('GR_EN_base');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('GR_EN_base', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_EN, expect);
            await expect(acomPage.getCard(data.id)).toBeVisible();
            await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
            await expect(acomPage.getCardBadge(data.id)).toContainText(data.badgeText);
            await expect(acomPage.getCardBadge(data.id)).toHaveCSS('background-color', data.badgeColor);
            await expect(acomPage.getCardBadge(data.id)).toHaveCSS('border-color', data.badgeBorderColor);
            await expect(acomPage.getCardPrice(data.id)).toContainText(data.price);
            await expect(acomPage.getCardStrikethroughPrice(data.id)).not.toBeVisible();
        });
    });
});
