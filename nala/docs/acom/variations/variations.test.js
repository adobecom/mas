import { expect, test } from '@playwright/test';
import { features } from './variations.spec.js';
import MasPlans from '../plans.page.js';
import { createWorkerPageSetup, DOCS_GALLERY_PATH } from '../../../utils/commerce.js';

test.skip(({ browserName }) => browserName !== 'chromium', 'Not supported to run on multiple browsers.');

const workerSetup = createWorkerPageSetup({
    pages: [
        { name: 'GR_co', url: DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_co },
        { name: 'GR_EN', url: DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_EN },
        { name: 'AR_co', url: DOCS_GALLERY_PATH.PLANS_COLLECTION.AR_co },
        { name: 'AR_ES', url: DOCS_GALLERY_PATH.PLANS_COLLECTION.AR_ES },
        { name: 'AR', url: DOCS_GALLERY_PATH.PLANS_COLLECTION.AR },
    ],
});

test.describe('ACOM MAS Variations feature test suite', () => {
    test.beforeAll(async ({ browser, baseURL }) => {
        await workerSetup.setupWorkerPages({ browser, baseURL });
    });

    test.afterAll(async () => {
        await workerSetup.cleanupWorkerPages();
    });

    test.afterEach(async ({}, testInfo) => {
        workerSetup.attachWorkerErrorsToFailure(testInfo);
    });

    // @MAS-Grouped-Variation-Card-in-Collection
    test(`${features[0].name},${features[0].tags}`, async () => {
        const { data } = features[0];

        await test.step('step-1: Verify grouped card variation on GR_co', async () => {
            const page = workerSetup.getPage('GR_co');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('GR_co', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_co, expect);
            await expect(acomPage.getCard(data.id)).toBeVisible();
            await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
            await expect(acomPage.getCardBadge(data.id)).toContainText(data.badgeText);
            await expect(acomPage.getCardBadge(data.id)).toHaveCSS('background-color', data.badgeColor);
            await expect(acomPage.getCardPrice(data.id)).toContainText(data.price.gr_en);
        });

        await test.step('step-2: Verify grouped card variation on GR_EN', async () => {
            const page = workerSetup.getPage('GR_EN');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('GR_EN', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_EN, expect);
            await expect(acomPage.getCard(data.id)).toBeVisible();
            await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
            await expect(acomPage.getCardBadge(data.id)).toContainText(data.badgeText);
            await expect(acomPage.getCardBadge(data.id)).toHaveCSS('background-color', data.badgeColor);
            await expect(acomPage.getCardPrice(data.id)).toContainText(data.price.gr_en);
        });

        await test.step('step-3: Verify grouped card variation on AR_co', async () => {
            const page = workerSetup.getPage('AR_co');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('AR_co', DOCS_GALLERY_PATH.PLANS_COLLECTION.AR_co, expect);
            await expect(acomPage.getCard(data.id)).toBeVisible();
            await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
            await expect(acomPage.getCardBadge(data.id)).toContainText(data.badgeText);
            await expect(acomPage.getCardBadge(data.id)).toHaveCSS('background-color', data.badgeColor);
            await expect(acomPage.getCardPrice(data.id)).toContainText(data.price.ar_en);
        });
    });

    // @MAS-Regional-Variation-Card-in-Collection
    test(`${features[1].name},${features[1].tags}`, async () => {
        const { data } = features[1];

        await test.step('step-1: Verify regional card variation on GR_co', async () => {
            const page = workerSetup.getPage('GR_co');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('GR_co', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_co, expect);
            await expect(acomPage.getCard(data.id)).toBeVisible();
            await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
            await expect(acomPage.getCardSubtitle(data.id)).toContainText(data.subtitle);
            await expect(acomPage.getCardPrice(data.id)).toContainText(data.price);
        });

        await test.step('step-2: Verify regional card variation on GR_EN', async () => {
            const page = workerSetup.getPage('GR_EN');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('GR_EN', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_EN, expect);
            await expect(acomPage.getCard(data.id)).toBeVisible();
            await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
            await expect(acomPage.getCardSubtitle(data.id)).toContainText(data.subtitle);
            await expect(acomPage.getCardPrice(data.id)).toContainText(data.price);
        });
    });

    // @MAS-Regional-Variation-of-Collection
    test(`${features[2].name},${features[2].tags}`, async () => {
        const { data } = features[2];

        await test.step('step-1: Verify regional collection variation on GR_co', async () => {
            const page = workerSetup.getPage('GR_co');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('GR_co', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_co, expect);
            await expect(acomPage.getCollection(data.id)).toBeVisible();
            await expect(acomPage.getCollection(data.id)).toHaveAttribute('variation-id', data.variation_id);
            await expect(acomPage.getCard(data.removed_id)).not.toBeVisible();
            for (let i = 0; i < data.reorder.length; i++) {
                await expect(acomPage.getCollectionCard(data.id, i).locator('aem-fragment')).toHaveAttribute(
                    'fragment',
                    data.reorder[i],
                );
            }
        });

        await test.step('step-2: Verify regional collection variation on GR_EN', async () => {
            const page = workerSetup.getPage('GR_EN');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('GR_EN', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_EN, expect);
            await expect(acomPage.getCollection(data.id)).toBeVisible();
            await expect(acomPage.getCollection(data.id)).toHaveAttribute('variation-id', data.variation_id);
            await expect(acomPage.getCard(data.removed_id)).not.toBeVisible();
            for (let i = 0; i < data.reorder.length; i++) {
                await expect(acomPage.getCollectionCard(data.id, i).locator('aem-fragment')).toHaveAttribute(
                    'fragment',
                    data.reorder[i],
                );
            }
        });
    });

    // @MAS-Grouped-Variation-of-Collection
    test(`${features[3].name},${features[3].tags}`, async () => {
        const { data } = features[3];

        await test.step('step-1: Verify grouped collection variation on AR_co', async () => {
            const page = workerSetup.getPage('AR_co');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('AR_co', DOCS_GALLERY_PATH.PLANS_COLLECTION.AR_co, expect);
            await expect(acomPage.getCollection(data.id)).toBeVisible();
            await expect(acomPage.getCollection(data.id)).toHaveAttribute('variation-id', data.variation_id);
            for (let i = 0; i < data.reorder.length; i++) {
                await expect(acomPage.getCollectionCard(data.id, i).locator('aem-fragment')).toHaveAttribute(
                    'fragment',
                    data.reorder[i],
                );
            }
        });
    });

    // @MAS-Card-Grouped-Variation-in-Collection-Regional-Variation
    test(`${features[4].name},${features[4].tags}`, async () => {
        const { data } = features[4];

        await test.step('step-1: Verify grouped card variation in regional collection on GR_co', async () => {
            const page = workerSetup.getPage('GR_co');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('GR_co', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_co, expect);
            await expect(acomPage.getCard(data.cardid)).toBeVisible();
            await expect(acomPage.getCard(data.cardid)).toHaveAttribute('variation-id', data.variation_card_id);
            await expect(acomPage.getCardSubtitle(data.cardid)).toContainText(data.subtitle);
            await expect(acomPage.getCollection(data.collection_id)).toBeVisible();
            await expect(acomPage.getCollection(data.collection_id)).toHaveAttribute(
                'variation-id',
                data.variation_collection_id,
            );
            await expect(acomPage.getCardPrice(data.cardid)).toContainText(data.price);
        });

        await test.step('step-2: Verify grouped card variation in regional collection on GR_EN', async () => {
            const page = workerSetup.getPage('GR_EN');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('GR_EN', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_EN, expect);
            await expect(acomPage.getCard(data.cardid)).toBeVisible();
            await expect(acomPage.getCard(data.cardid)).toHaveAttribute('variation-id', data.variation_card_id);
            await expect(acomPage.getCardSubtitle(data.cardid)).toContainText(data.subtitle);
            await expect(acomPage.getCollection(data.collection_id)).toBeVisible();
            await expect(acomPage.getCollection(data.collection_id)).toHaveAttribute(
                'variation-id',
                data.variation_collection_id,
            );
            await expect(acomPage.getCardPrice(data.cardid)).toContainText(data.price);
        });
    });

    // @MAS-Card-Regional-Variation-in-Collection-Regional-Variation
    test(`${features[5].name},${features[5].tags}`, async () => {
        const { data } = features[5];

        await test.step('step-1: Verify regional card variation in regional collection on GR_co', async () => {
            const page = workerSetup.getPage('GR_co');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('GR_co', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_co, expect);
            await expect(acomPage.getCard(data.cardid)).toBeVisible();
            await expect(acomPage.getCard(data.cardid)).toHaveAttribute('variation-id', data.variation_card_id);
            await expect(acomPage.getCardSubtitle(data.cardid)).toContainText(data.subtitle);
            await expect(acomPage.getCollection(data.collection_id)).toBeVisible();
            await expect(acomPage.getCollection(data.collection_id)).toHaveAttribute(
                'variation-id',
                data.variation_collection_id,
            );
            await expect(acomPage.getCardPrice(data.cardid)).toContainText(data.price);
        });

        await test.step('step-2: Verify regional card variation in regional collection on GR_EN', async () => {
            const page = workerSetup.getPage('GR_EN');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('GR_EN', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_EN, expect);
            await expect(acomPage.getCard(data.cardid)).toBeVisible();
            await expect(acomPage.getCard(data.cardid)).toHaveAttribute('variation-id', data.variation_card_id);
            await expect(acomPage.getCardSubtitle(data.cardid)).toContainText(data.subtitle);
            await expect(acomPage.getCollection(data.collection_id)).toBeVisible();
            await expect(acomPage.getCollection(data.collection_id)).toHaveAttribute(
                'variation-id',
                data.variation_collection_id,
            );
            await expect(acomPage.getCardPrice(data.cardid)).toContainText(data.price);
        });
    });

    // @MAS-Translated-Card-Grouped-Variation-in-Translated-Collection
    test(`${features[6].name},${features[6].tags}`, async () => {
        const { data } = features[6];

        await test.step('step-1: Verify translated grouped card variation on AR_ES', async () => {
            const page = workerSetup.getPage('AR_ES');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('AR_ES', DOCS_GALLERY_PATH.PLANS_COLLECTION.AR_ES, expect);
            await expect(acomPage.getCard(data.cardid)).toBeVisible();
            await expect(acomPage.getCard(data.cardid)).toHaveAttribute('variation-id', data.variation_card_id);
            await expect(acomPage.getCardSubtitle(data.cardid)).toContainText(data.subtitle);
            await expect(acomPage.getCardBadge(data.cardid)).toHaveCSS('background-color', data.badgeColor);
            await expect(acomPage.getCollection(data.collection_id)).toBeVisible();
            await expect(acomPage.getCardPrice(data.cardid)).toContainText(data.price.ar);
        });

        await test.step('step-2: Verify translated grouped card variation on AR', async () => {
            const page = workerSetup.getPage('AR');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('AR', DOCS_GALLERY_PATH.PLANS_COLLECTION.AR, expect);
            await expect(acomPage.getCard(data.cardid)).toBeVisible();
            await expect(acomPage.getCard(data.cardid)).toHaveAttribute('variation-id', data.variation_card_id);
            await expect(acomPage.getCardSubtitle(data.cardid)).toContainText(data.subtitle);
            await expect(acomPage.getCardBadge(data.cardid)).toHaveCSS('background-color', data.badgeColor);
            await expect(acomPage.getCollection(data.collection_id)).toBeVisible();
            await expect(acomPage.getCardPrice(data.cardid)).toContainText(data.price.ar_en);
        });
    });

    // @MAS-Translated-Card-Regional-Variation-in-Translated-Collection
    test(`${features[7].name},${features[7].tags}`, async () => {
        const { data } = features[7];

        await test.step('step-1: Verify translated regional card variation on AR_ES', async () => {
            const page = workerSetup.getPage('AR_ES');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('AR_ES', DOCS_GALLERY_PATH.PLANS_COLLECTION.AR_ES, expect);
            await expect(acomPage.getCard(data.cardid)).toBeVisible();
            await expect(acomPage.getCard(data.cardid)).toHaveAttribute('variation-id', data.variation_card_id);
            await expect(acomPage.getCardSubtitle(data.cardid)).toContainText(data.subtitle);
            await expect(acomPage.getCollection(data.collection_id)).toBeVisible();
            await expect(acomPage.getCardPrice(data.cardid)).toContainText(data.price.ar);
        });

        await test.step('step-2: Verify translated regional card variation on AR', async () => {
            const page = workerSetup.getPage('AR');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('AR', DOCS_GALLERY_PATH.PLANS_COLLECTION.AR, expect);
            await expect(acomPage.getCard(data.cardid)).toBeVisible();
            await expect(acomPage.getCard(data.cardid)).toHaveAttribute('variation-id', data.variation_card_id);
            await expect(acomPage.getCardSubtitle(data.cardid)).toContainText(data.subtitle);
            await expect(acomPage.getCollection(data.collection_id)).toBeVisible();
            await expect(acomPage.getCardPrice(data.cardid)).toContainText(data.price.ar_en);
        });
    });
});
