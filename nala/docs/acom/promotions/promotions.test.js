import { expect, test } from '@playwright/test';
import { features } from './promotions.spec.js';
import MasPlans from '../plans.page.js';
import { addUrlQueryParams, createWorkerPageSetup, DOCS_GALLERY_PATH } from '../../../utils/commerce.js';

test.skip(({ browserName }) => browserName !== 'chromium', 'Not supported to run on multiple browsers.');

const pathToName = Object.fromEntries(Object.entries(DOCS_GALLERY_PATH.PLANS_COLLECTION).map(([name, path]) => [path, name]));

const workerPages = [];
const seenPages = new Set();

for (const feature of features) {
    const paths = Array.isArray(feature.path) ? feature.path : [feature.path];
    const params = Array.isArray(feature.browserParams) ? feature.browserParams : [feature.browserParams];
    const nonPreviewParams = params.filter((p) => !p.includes('mas.preview'));

    for (const path of paths) {
        const name = pathToName[path];
        if (!seenPages.has(name)) {
            seenPages.add(name);
            workerPages.push({ name, url: params.reduce((u, p) => addUrlQueryParams(u, p), path) });
        }
        const baseName = `${name}_base`;
        if (!seenPages.has(baseName)) {
            seenPages.add(baseName);
            workerPages.push({ name: baseName, url: nonPreviewParams.reduce((u, p) => addUrlQueryParams(u, p), path) });
        }
    }
}

// tcid7 (Regional-Over-Intro-Precedence) needs an "intro" state that has no `instant` param at all,
// distinct from the shared GR_co/GR_EN pages above which are locked to tcid1's instant=2026-04-15.
// The generic loop dedupes worker pages by path, so this state needs its own dedicated page names.
workerPages.push(
    { name: 'GR_co_intro', url: addUrlQueryParams(DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_co, '?mas.preview=on') },
    { name: 'GR_co_intro_base', url: DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_co },
    { name: 'GR_EN_intro', url: addUrlQueryParams(DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_EN, '?mas.preview=on') },
    { name: 'GR_EN_intro_base', url: DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_EN },
);

const workerSetup = createWorkerPageSetup({ pages: workerPages });

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

        await test.step('step-1: Verify promotion card on US with preview parameter on', async () => {
            const page = workerSetup.getPage('US');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('US', DOCS_GALLERY_PATH.PLANS_COLLECTION.US, expect);
            await expect(acomPage.getCard(data.id)).toBeVisible();
            await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
            await expect(acomPage.getCard(data.id)).toHaveAttribute('data-promotion-project', data.promotionProject);
            await expect(acomPage.getCardBadge(data.id)).toContainText(data.badgeText);
            await expect(acomPage.getCardBadge(data.id)).toHaveCSS('background-color', data.badgeColor);
            await expect(acomPage.getCardPrice(data.id)).toContainText(data.promoPrice);
            await expect(acomPage.getCardStrikethroughPrice(data.id)).toContainText(data.price);
            await expect(acomPage.getCardStrikethroughPrice(data.id)).toHaveCSS('text-decoration-line', 'line-through');
        });

        await test.step('step-2: Verify promotion card on US without preview parameter', async () => {
            const page = workerSetup.getPage('US_base');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('US_base', DOCS_GALLERY_PATH.PLANS_COLLECTION.US, expect);
            await expect(acomPage.getCard(data.id)).toBeVisible();
            await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
            await expect(acomPage.getCard(data.id)).toHaveAttribute('data-promotion-project', data.promotionProject);
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

        // await test.step('step-1: Verify regional promotion card on GR_co with preview parameter on', async () => {
        //     const page = workerSetup.getPage('GR_co');
        //     const acomPage = new MasPlans(page);
        //     await workerSetup.verifyPageURL('GR_co', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_co, expect);
        //     await expect(acomPage.getCard(data.id)).toBeVisible();
        //     await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
        //     await expect(acomPage.getCard(data.id)).toHaveAttribute('data-promotion-project', data.promotionProject);
        //     await expect(acomPage.getCardBadge(data.id)).toContainText(data.badgeText);
        //     await expect(acomPage.getCardBadge(data.id)).toHaveCSS('background-color', data.badgeColor);
        //     await expect(acomPage.getCardBadge(data.id)).toHaveCSS('border-color', data.badgeBorderColor);
        //     await expect(acomPage.getCard(data.id)).toHaveCSS('background-color', data.borderColor);
        //     await expect(acomPage.getCardPrice(data.id)).toContainText(data.promoPrice);
        //     await expect(acomPage.getCardStrikethroughPrice(data.id)).toContainText(data.price);
        //     await expect(acomPage.getCardStrikethroughPrice(data.id)).toHaveCSS('text-decoration-line', 'line-through');
        // });

        await test.step('step-2: Verify regional promotion card on GR_EN with preview parameter on', async () => {
            const page = workerSetup.getPage('GR_EN');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('GR_EN', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_EN, expect);
            await expect(acomPage.getCard(data.id)).toBeVisible();
            await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
            await expect(acomPage.getCard(data.id)).toHaveAttribute('data-promotion-project', data.promotionProject);
            await expect(acomPage.getCardBadge(data.id)).toContainText(data.badgeText);
            await expect(acomPage.getCardBadge(data.id)).toHaveCSS('background-color', data.badgeColor);
            await expect(acomPage.getCardBadge(data.id)).toHaveCSS('border-color', data.badgeBorderColor);
            await expect(acomPage.getCard(data.id)).toHaveCSS('background-color', data.borderColor);
            await expect(acomPage.getCardPrice(data.id)).toContainText(data.promoPrice);
            await expect(acomPage.getCardStrikethroughPrice(data.id)).toContainText(data.price);
            await expect(acomPage.getCardStrikethroughPrice(data.id)).toHaveCSS('text-decoration-line', 'line-through');
        });

        await test.step('step-3: Verify regional promotion card on GR_co without preview parameter - no strikethrough', async () => {
            const page = workerSetup.getPage('GR_co_base');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('GR_co_base', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_co, expect);
            await expect(acomPage.getCard(data.id)).toBeVisible();
            await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
            await expect(acomPage.getCard(data.id)).toHaveAttribute('data-promotion-project', data.promotionProject);
            await expect(acomPage.getCardBadge(data.id)).toContainText(data.badgeText);
            await expect(acomPage.getCardBadge(data.id)).toHaveCSS('background-color', data.badgeColor);
            await expect(acomPage.getCardBadge(data.id)).toHaveCSS('border-color', data.badgeBorderColor);
            await expect(acomPage.getCard(data.id)).toHaveCSS('background-color', data.borderColor);
            await expect(acomPage.getCardPrice(data.id)).toContainText(data.price);
            await expect(acomPage.getCardStrikethroughPrice(data.id)).not.toBeVisible();
        });

        await test.step('step-4: Verify regional promotion card on GR_EN without preview parameter - no strikethrough', async () => {
            const page = workerSetup.getPage('GR_EN_base');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('GR_EN_base', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_EN, expect);
            await expect(acomPage.getCard(data.id)).toBeVisible();
            await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
            await expect(acomPage.getCard(data.id)).toHaveAttribute('data-promotion-project', data.promotionProject);
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

        // await test.step('step-1: Verify grouped promotion card on GR_co with preview parameter on', async () => {
        //     const page = workerSetup.getPage('GR_co');
        //     const acomPage = new MasPlans(page);
        //     await workerSetup.verifyPageURL('GR_co', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_co, expect);
        //     await expect(acomPage.getCard(data.id)).toBeVisible();
        //     await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
        //     await expect(acomPage.getCard(data.id)).toHaveAttribute('data-promotion-project', data.promotionProject);
        //     await expect(acomPage.getCardBadge(data.id)).toContainText(data.badgeText);
        //     await expect(acomPage.getCardBadge(data.id)).toHaveCSS('background-color', data.badgeColor);
        //     await expect(acomPage.getCardBadge(data.id)).toHaveCSS('border-color', data.badgeBorderColor);
        //     await expect(acomPage.getCardPrice(data.id)).toContainText(data.promoPrice);
        //     await expect(acomPage.getCardStrikethroughPrice(data.id)).toContainText(data.price);
        //     await expect(acomPage.getCardStrikethroughPrice(data.id)).toHaveCSS('text-decoration-line', 'line-through');
        // });

        await test.step('step-2: Verify grouped promotion card on GR_EN with preview parameter on', async () => {
            const page = workerSetup.getPage('GR_EN');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('GR_EN', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_EN, expect);
            await expect(acomPage.getCard(data.id)).toBeVisible();
            await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
            await expect(acomPage.getCard(data.id)).toHaveAttribute('data-promotion-project', data.promotionProject);
            await expect(acomPage.getCardBadge(data.id)).toContainText(data.badgeText);
            await expect(acomPage.getCardBadge(data.id)).toHaveCSS('background-color', data.badgeColor);
            await expect(acomPage.getCardBadge(data.id)).toHaveCSS('border-color', data.badgeBorderColor);
            await expect(acomPage.getCardPrice(data.id)).toContainText(data.promoPrice);
            await expect(acomPage.getCardStrikethroughPrice(data.id)).toContainText(data.price);
            await expect(acomPage.getCardStrikethroughPrice(data.id)).toHaveCSS('text-decoration-line', 'line-through');
        });
        // uncomment below steps when MWPW-197336 is fixed

        // await test.step('step-3: Verify grouped promotion card on GR_co without preview parameter - no strikethrough', async () => {
        //     const page = workerSetup.getPage('GR_co_base');
        //     const acomPage = new MasPlans(page);
        //     await workerSetup.verifyPageURL('GR_co_base', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_co, expect);
        //     await expect(acomPage.getCard(data.id)).toBeVisible();
        //     await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
        //     await expect(acomPage.getCard(data.id)).toHaveAttribute('data-promotion-project', data.promotionProject);
        //     await expect(acomPage.getCardBadge(data.id)).toContainText(data.badgeText);
        //     await expect(acomPage.getCardBadge(data.id)).toHaveCSS('background-color', data.badgeColor);
        //     await expect(acomPage.getCardBadge(data.id)).toHaveCSS('border-color', data.badgeBorderColor);
        //     await expect(acomPage.getCardPrice(data.id)).toContainText(data.price);
        //     await expect(acomPage.getCardStrikethroughPrice(data.id)).not.toBeVisible();
        // });

        await test.step('step-4: Verify grouped promotion card on GR_EN without preview parameter - no strikethrough', async () => {
            const page = workerSetup.getPage('GR_EN_base');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('GR_EN_base', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_EN, expect);
            await expect(acomPage.getCard(data.id)).toBeVisible();
            await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
            await expect(acomPage.getCard(data.id)).toHaveAttribute('data-promotion-project', data.promotionProject);
            await expect(acomPage.getCardBadge(data.id)).toContainText(data.badgeText);
            await expect(acomPage.getCardBadge(data.id)).toHaveCSS('background-color', data.badgeColor);
            await expect(acomPage.getCardBadge(data.id)).toHaveCSS('border-color', data.badgeBorderColor);
            await expect(acomPage.getCardPrice(data.id)).toContainText(data.price);
            await expect(acomPage.getCardStrikethroughPrice(data.id)).not.toBeVisible();
        });
    });

    // @MAS-Promotions-Regional-Variation-Card-in-Regional-Variation-Collection
    test(`${features[3].name},${features[3].tags}`, async () => {
        const { data } = features[3];

        // uncomment below steps when MWPW-197336 is fixed

        // await test.step('step-1: Verify regional variation card in regional variation collection on GR_co with preview parameter on', async () => {
        //     const page = workerSetup.getPage('GR_co');
        //     const acomPage = new MasPlans(page);
        //     await workerSetup.verifyPageURL('GR_co', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_co, expect);
        //     await expect(acomPage.getCard(data.id)).toBeVisible();
        //     await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
        //     await expect(acomPage.getCard(data.id)).toHaveAttribute('data-promotion-project', data.promotionProject);
        //     await expect(acomPage.getCollection(data.collection_id)).toHaveAttribute('variation-id', data.variation_collection_id);
        //     await expect(acomPage.getCardPrice(data.id)).toContainText(data.promoPrice);
        //     await expect(acomPage.getCardStrikethroughPrice(data.id)).toContainText(data.price);
        //     await expect(acomPage.getCardStrikethroughPrice(data.id)).toHaveCSS('text-decoration-line', 'line-through');
        // });

        await test.step('step-2: Verify regional variation card in regional variation collection on GR_EN with preview parameter on', async () => {
            const page = workerSetup.getPage('GR_EN');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('GR_EN', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_EN, expect);
            await expect(acomPage.getCard(data.id)).toBeVisible();
            await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
            await expect(acomPage.getCard(data.id)).toHaveAttribute('data-promotion-project', data.promotionProject);
            await expect(acomPage.getCollection(data.collection_id)).toHaveAttribute(
                'variation-id',
                data.variation_collection_id,
            );
            await expect(acomPage.getCardPrice(data.id)).toContainText(data.promoPrice);
            await expect(acomPage.getCardStrikethroughPrice(data.id)).toContainText(data.price);
            await expect(acomPage.getCardStrikethroughPrice(data.id)).toHaveCSS('text-decoration-line', 'line-through');
        });

        // uncomment below steps when MWPW-197336 is fixed

        // await test.step('step-3: Verify regional variation card in regional variation collection on GR_co without preview parameter - no strikethrough', async () => {
        //     const page = workerSetup.getPage('GR_co_base');
        //     const acomPage = new MasPlans(page);
        //     await workerSetup.verifyPageURL('GR_co_base', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_co, expect);
        //     await expect(acomPage.getCard(data.id)).toBeVisible();
        //     await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
        //     await expect(acomPage.getCard(data.id)).toHaveAttribute('data-promotion-project', data.promotionProject);
        //     await expect(acomPage.getCollection(data.collection_id)).toHaveAttribute('variation-id', data.variation_collection_id);
        //     await expect(acomPage.getCardPrice(data.id)).toContainText(data.price);
        //     await expect(acomPage.getCardStrikethroughPrice(data.id)).not.toBeVisible();
        // });

        await test.step('step-4: Verify regional variation card in regional variation collection on GR_EN without preview parameter - no strikethrough', async () => {
            const page = workerSetup.getPage('GR_EN_base');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('GR_EN_base', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_EN, expect);
            await expect(acomPage.getCard(data.id)).toBeVisible();
            await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
            await expect(acomPage.getCard(data.id)).toHaveAttribute('data-promotion-project', data.promotionProject);
            await expect(acomPage.getCollection(data.collection_id)).toHaveAttribute(
                'variation-id',
                data.variation_collection_id,
            );
            await expect(acomPage.getCardPrice(data.id)).toContainText(data.price);
            await expect(acomPage.getCardStrikethroughPrice(data.id)).not.toBeVisible();
        });
    });

    // @MAS-Promotions-Grouped-Variation-Card-in-Regional-Variation-Collection
    test(`${features[4].name},${features[4].tags}`, async () => {
        const { data } = features[4];

        // uncomment below steps when MWPW-197336 is fixed

        // await test.step('step-1: Verify grouped variation card in regional variation collection on GR_co with preview parameter on', async () => {
        //     const page = workerSetup.getPage('GR_co');
        //     const acomPage = new MasPlans(page);
        //     await workerSetup.verifyPageURL('GR_co', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_co, expect);
        //     await expect(acomPage.getCard(data.id)).toBeVisible();
        //     await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
        //     await expect(acomPage.getCard(data.id)).toHaveAttribute('data-promotion-project', data.promotionProject);
        //     await expect(acomPage.getCollection(data.collection_id)).toHaveAttribute('variation-id', data.variation_collection_id);
        //     await expect(acomPage.getCardPrice(data.id)).toContainText(data.promoPrice);
        //     await expect(acomPage.getCardStrikethroughPrice(data.id)).toContainText(data.price);
        //     await expect(acomPage.getCardStrikethroughPrice(data.id)).toHaveCSS('text-decoration-line', 'line-through');
        // });

        await test.step('step-2: Verify grouped variation card in regional variation collection on GR_EN with preview parameter on', async () => {
            const page = workerSetup.getPage('GR_EN');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('GR_EN', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_EN, expect);
            await expect(acomPage.getCard(data.id)).toBeVisible();
            await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
            await expect(acomPage.getCard(data.id)).toHaveAttribute('data-promotion-project', data.promotionProject);
            await expect(acomPage.getCollection(data.collection_id)).toHaveAttribute(
                'variation-id',
                data.variation_collection_id,
            );
            await expect(acomPage.getCardPrice(data.id)).toContainText(data.promoPrice);
            await expect(acomPage.getCardStrikethroughPrice(data.id)).toContainText(data.price);
            await expect(acomPage.getCardStrikethroughPrice(data.id)).toHaveCSS('text-decoration-line', 'line-through');
        });

        // uncomment below steps when MWPW-197336 is fixed

        // await test.step('step-3: Verify grouped variation card in regional variation collection on GR_co without preview parameter - no strikethrough', async () => {
        //     const page = workerSetup.getPage('GR_co_base');
        //     const acomPage = new MasPlans(page);
        //     await workerSetup.verifyPageURL('GR_co_base', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_co, expect);
        //     await expect(acomPage.getCard(data.id)).toBeVisible();
        //     await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
        //     await expect(acomPage.getCard(data.id)).toHaveAttribute('data-promotion-project', data.promotionProject);
        //     await expect(acomPage.getCollection(data.collection_id)).toHaveAttribute('variation-id', data.variation_collection_id);
        //     await expect(acomPage.getCardPrice(data.id)).toContainText(data.price);
        //     await expect(acomPage.getCardStrikethroughPrice(data.id)).not.toBeVisible();
        // });

        await test.step('step-4: Verify grouped variation card in regional variation collection on GR_EN without preview parameter - no strikethrough', async () => {
            const page = workerSetup.getPage('GR_EN_base');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('GR_EN_base', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_EN, expect);
            await expect(acomPage.getCard(data.id)).toBeVisible();
            await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
            await expect(acomPage.getCard(data.id)).toHaveAttribute('data-promotion-project', data.promotionProject);
            await expect(acomPage.getCollection(data.collection_id)).toHaveAttribute(
                'variation-id',
                data.variation_collection_id,
            );
            await expect(acomPage.getCardPrice(data.id)).toContainText(data.price);
            await expect(acomPage.getCardStrikethroughPrice(data.id)).not.toBeVisible();
        });
    });

    // @MAS-Promotions-Translated-Regional-Variation-Card-in-Grouped-Variation-Collection
    test(`${features[5].name},${features[5].tags}`, async () => {
        const { data } = features[5];

        // uncomment below steps when MWPW-197336 is fixed

        // await test.step('step-1: Verify translated regional variation card in grouped variation collection on AR_co with preview parameter on', async () => {
        //     const page = workerSetup.getPage('AR_co');
        //     const acomPage = new MasPlans(page);
        //     await workerSetup.verifyPageURL('AR_co', DOCS_GALLERY_PATH.PLANS_COLLECTION.AR_co, expect);
        //     await expect(acomPage.getCard(data.id)).toBeVisible();
        //     await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
        //     await expect(acomPage.getCard(data.id)).toHaveAttribute('data-promotion-project', data.promotionProject);
        //     await expect(acomPage.getCollection(data.collection_id)).toHaveAttribute('variation-id', data.variation_collection_id);
        //     await expect(acomPage.getCardPrice(data.id)).toContainText(data.promoPrice);
        //     await expect(acomPage.getCardStrikethroughPrice(data.id)).toContainText(data.price);
        //     await expect(acomPage.getCardStrikethroughPrice(data.id)).toHaveCSS('text-decoration-line', 'line-through');
        // });

        await test.step('step-2: Verify translated regional variation card in grouped variation collection on AR_ES with preview parameter on', async () => {
            const page = workerSetup.getPage('AR_ES');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('AR_ES', DOCS_GALLERY_PATH.PLANS_COLLECTION.AR_ES, expect);
            await expect(acomPage.getCard(data.id)).toBeVisible();
            await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
            await expect(acomPage.getCard(data.id)).toHaveAttribute('data-promotion-project', data.promotionProject);
            await expect(acomPage.getCollection(data.collection_id)).toHaveAttribute(
                'variation-id',
                data.variation_collection_id,
            );
            await expect(acomPage.getCardPrice(data.id)).toContainText(data.promoPrice);
            await expect(acomPage.getCardStrikethroughPrice(data.id)).toContainText(data.price);
            await expect(acomPage.getCardStrikethroughPrice(data.id)).toHaveCSS('text-decoration-line', 'line-through');
        });

        // uncomment below steps when MWPW-197336 is fixed

        // await test.step('step-3: Verify translated regional variation card in grouped variation collection on AR_co without preview parameter', async () => {
        //     const page = workerSetup.getPage('AR_co_base');
        //     const acomPage = new MasPlans(page);
        //     await workerSetup.verifyPageURL('AR_co_base', DOCS_GALLERY_PATH.PLANS_COLLECTION.AR_co, expect);
        //     await expect(acomPage.getCard(data.id)).toBeVisible();
        //     await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
        //     await expect(acomPage.getCard(data.id)).toHaveAttribute('data-promotion-project', data.promotionProject);
        //     await expect(acomPage.getCollection(data.collection_id)).toHaveAttribute('variation-id', data.variation_collection_id);
        //     await expect(acomPage.getCardPrice(data.id)).toContainText(data.promoPrice);
        //     await expect(acomPage.getCardStrikethroughPrice(data.id)).toContainText(data.price);
        //     await expect(acomPage.getCardStrikethroughPrice(data.id)).toHaveCSS('text-decoration-line', 'line-through');
        // });

        await test.step('step-4: Verify translated regional variation card in grouped variation collection on AR_ES without preview parameter', async () => {
            const page = workerSetup.getPage('AR_ES_base');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('AR_ES_base', DOCS_GALLERY_PATH.PLANS_COLLECTION.AR_ES, expect);
            await expect(acomPage.getCard(data.id)).toBeVisible();
            await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
            await expect(acomPage.getCard(data.id)).toHaveAttribute('data-promotion-project', data.promotionProject);
            await expect(acomPage.getCollection(data.collection_id)).toHaveAttribute(
                'variation-id',
                data.variation_collection_id,
            );
            await expect(acomPage.getCardPrice(data.id)).toContainText(data.promoPrice);
            await expect(acomPage.getCardStrikethroughPrice(data.id)).toContainText(data.price);
            await expect(acomPage.getCardStrikethroughPrice(data.id)).toHaveCSS('text-decoration-line', 'line-through');
        });
    });

    // @MAS-Promotions-Variation-Evergreen
    test(`${features[6].name},${features[6].tags}`, async () => {
        const { data } = features[6];

        await test.step('step-1: Verify evergreen promo variation card on US with preview parameter on', async () => {
            const page = workerSetup.getPage('US');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('US', DOCS_GALLERY_PATH.PLANS_COLLECTION.US, expect);
            await expect(acomPage.getCard(data.id)).toBeVisible();
            await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
            await expect(acomPage.getCard(data.id)).toHaveAttribute('data-promotion-project', data.promotionProject);
        });

        await test.step('step-2: Verify evergreen promo variation card on US without preview parameter', async () => {
            const page = workerSetup.getPage('US_base');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('US_base', DOCS_GALLERY_PATH.PLANS_COLLECTION.US, expect);
            await expect(acomPage.getCard(data.id)).toBeVisible();
            await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
            await expect(acomPage.getCard(data.id)).toHaveAttribute('data-promotion-project', data.promotionProject);
            await expect(acomPage.getCardBadge(data.id)).toContainText(data.badgeText);
        });
    });

    // @MAS-Promotions-Regional-Over-Intro-Precedence
    test(`${features[7].name},${features[7].tags}`, async () => {
        const { data } = features[7];

        await test.step('step-1: Verify intro promo on GR_co without preview parameter', async () => {
            const page = workerSetup.getPage('GR_co_intro_base');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('GR_co_intro_base', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_co, expect);
            await expect(acomPage.getCard(data.id)).toBeVisible();
            await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
            await expect(acomPage.getCard(data.id)).toHaveAttribute('data-promotion-project', data.introPromoProject);
            await expect(acomPage.getCardPrice(data.id).locator(acomPage.price)).toHaveAttribute('data-wcs-osi', data.introOsi);
            await expect(acomPage.getCardBadge(data.id)).toContainText(data.badgeText);
        });

        await test.step('step-2: Verify intro promo on GR_co with preview parameter on', async () => {
            const page = workerSetup.getPage('GR_co_intro');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('GR_co_intro', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_co, expect);
            await expect(acomPage.getCard(data.id)).toBeVisible();
            await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
            await expect(acomPage.getCard(data.id)).toHaveAttribute('data-promotion-project', data.introPromoProject);
            await expect(acomPage.getCardPrice(data.id).locator(acomPage.price)).toHaveAttribute('data-wcs-osi', data.introOsi);
            await expect(acomPage.getCardBadge(data.id)).toContainText(data.badgeText);
        });

        await test.step('step-3: Verify intro promo on GR_EN without preview parameter', async () => {
            const page = workerSetup.getPage('GR_EN_intro_base');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('GR_EN_intro_base', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_EN, expect);
            await expect(acomPage.getCard(data.id)).toBeVisible();
            await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
            await expect(acomPage.getCard(data.id)).toHaveAttribute('data-promotion-project', data.introPromoProject);
            await expect(acomPage.getCardPrice(data.id).locator(acomPage.price)).toHaveAttribute('data-wcs-osi', data.introOsi);
            await expect(acomPage.getCardBadge(data.id)).toContainText(data.badgeText);
        });

        await test.step('step-4: Verify intro promo on GR_EN with preview parameter on', async () => {
            const page = workerSetup.getPage('GR_EN_intro');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('GR_EN_intro', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_EN, expect);
            await expect(acomPage.getCard(data.id)).toBeVisible();
            await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
            await expect(acomPage.getCard(data.id)).toHaveAttribute('data-promotion-project', data.introPromoProject);
            await expect(acomPage.getCardPrice(data.id).locator(acomPage.price)).toHaveAttribute('data-wcs-osi', data.introOsi);
            await expect(acomPage.getCardBadge(data.id)).toContainText(data.badgeText);
        });

        await test.step('step-5: Verify regional evergreen promo overtakes intro on GR_co without preview parameter', async () => {
            const page = workerSetup.getPage('GR_co_base');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('GR_co_base', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_co, expect);
            await expect(acomPage.getCard(data.id)).toBeVisible();
            await expect(acomPage.getCard(data.id)).not.toHaveAttribute('variation-id', /.+/);
            await expect(acomPage.getCard(data.id)).toHaveAttribute('data-promotion-project', data.regionalPromoProject);
            await expect(acomPage.getCardBadge(data.id)).not.toBeVisible();
            await expect(acomPage.getCardPrice(data.id).locator(acomPage.price)).toHaveAttribute(
                'data-wcs-osi',
                data.regionalOsi,
            );
            await expect(acomPage.getCard(data.id)).toHaveAttribute('data-promotion-code', data.regionalCode);
            await expect(acomPage.getCardPrice(data.id)).toContainText(data.regionalPrice);
        });

        await test.step('step-6: Verify regional evergreen promo overtakes intro on GR_co with preview parameter on', async () => {
            const page = workerSetup.getPage('GR_co');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('GR_co', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_co, expect);
            await expect(acomPage.getCard(data.id)).toBeVisible();
            await expect(acomPage.getCard(data.id)).not.toHaveAttribute('variation-id', /.+/);
            await expect(acomPage.getCard(data.id)).toHaveAttribute('data-promotion-project', data.regionalPromoProject);
            await expect(acomPage.getCardBadge(data.id)).not.toBeVisible();
            await expect(acomPage.getCardPrice(data.id).locator(acomPage.price)).toHaveAttribute(
                'data-wcs-osi',
                data.regionalOsi,
            );
            await expect(acomPage.getCard(data.id)).toHaveAttribute('data-promotion-code', data.regionalCode);
            await expect(acomPage.getCardPrice(data.id)).toContainText(data.regionalPrice);
        });

        await test.step('step-7: Verify regional evergreen promo overtakes intro on GR_EN without preview parameter', async () => {
            const page = workerSetup.getPage('GR_EN_base');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('GR_EN_base', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_EN, expect);
            await expect(acomPage.getCard(data.id)).toBeVisible();
            await expect(acomPage.getCard(data.id)).not.toHaveAttribute('variation-id', /.+/);
            await expect(acomPage.getCard(data.id)).toHaveAttribute('data-promotion-project', data.regionalPromoProject);
            await expect(acomPage.getCardBadge(data.id)).not.toBeVisible();
            await expect(acomPage.getCardPrice(data.id).locator(acomPage.price)).toHaveAttribute(
                'data-wcs-osi',
                data.regionalOsi,
            );
            await expect(acomPage.getCard(data.id)).toHaveAttribute('data-promotion-code', data.regionalCode);
            await expect(acomPage.getCardPrice(data.id)).toContainText(data.regionalPrice);
        });

        await test.step('step-8: Verify regional evergreen promo overtakes intro on GR_EN with preview parameter on', async () => {
            const page = workerSetup.getPage('GR_EN');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('GR_EN', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_EN, expect);
            await expect(acomPage.getCard(data.id)).toBeVisible();
            await expect(acomPage.getCard(data.id)).not.toHaveAttribute('variation-id', /.+/);
            await expect(acomPage.getCard(data.id)).toHaveAttribute('data-promotion-project', data.regionalPromoProject);
            await expect(acomPage.getCardBadge(data.id)).not.toBeVisible();
            await expect(acomPage.getCardPrice(data.id).locator(acomPage.price)).toHaveAttribute(
                'data-wcs-osi',
                data.regionalOsi,
            );
            await expect(acomPage.getCard(data.id)).toHaveAttribute('data-promotion-code', data.regionalCode);
            await expect(acomPage.getCardPrice(data.id)).toContainText(data.regionalPrice);
        });
    });

    // @MAS-Promotions-Seasonal-Over-Evergreen-Precedence
    test(`${features[8].name},${features[8].tags}`, async () => {
        const { data } = features[8];

        await test.step('step-1: Verify seasonal promo overtakes evergreen on GR_co with preview parameter on', async () => {
            const page = workerSetup.getPage('GR_co');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('GR_co', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_co, expect);
            await expect(acomPage.getCard(data.id)).toBeVisible();
            await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
            await expect(acomPage.getCard(data.id)).toHaveAttribute('data-promotion-project', data.promotionProject);
            await expect(acomPage.getCardBadge(data.id)).toContainText(data.badgeText);
        });

        await test.step('step-2: Verify seasonal promo overtakes evergreen on GR_EN with preview parameter on', async () => {
            const page = workerSetup.getPage('GR_EN');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('GR_EN', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_EN, expect);
            await expect(acomPage.getCard(data.id)).toBeVisible();
            await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
            await expect(acomPage.getCard(data.id)).toHaveAttribute('data-promotion-project', data.promotionProject);
            await expect(acomPage.getCardBadge(data.id)).toContainText(data.badgeText);
        });

        // no "without preview param" coverage here: this seasonal promo only resolves with mas.preview=on because it is expored
    });
});
