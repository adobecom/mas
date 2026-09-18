import { expect, test } from '@playwright/test';
import { features } from './promotions.spec.js';
import MasPlans from '../plans.page.js';
import { addUrlQueryParams, createWorkerPageSetup, DOCS_GALLERY_PATH } from '../../../utils/commerce.js';

test.skip(({ browserName }) => browserName !== 'chromium', 'Not supported to run on multiple browsers.');

const pathToName = Object.fromEntries(Object.entries(DOCS_GALLERY_PATH.PLANS_COLLECTION).map(([name, path]) => [path, name]));

/**
 * feature.browserParams can be:
 * - a single param string, e.g. '?mas.preview=on'
 * - a flat array of param strings, e.g. ['?mas.preview=on', 'instant=2026-04-15']
 * - an object mapping a state name to either of the above, only needed when a feature requires
 *   multiple simultaneous states on the same locale (e.g. an "intro" instant AND a "regional" one), e.g.:
 *   { intro: ['?mas.preview=on', 'instant=2026-05-01'], regional: '?mas.preview=on' }
 *
 * Worker page names are derived from what's actually loaded, so the name alone tells you the state:
 * - a bare locale name (e.g. 'US', 'GR_co') always means no params at all
 * - a non-preview param like `instant=X` is embedded in the name (e.g. 'GR_co_2026-04-15')
 * - a named state uses its label instead of a derived suffix (e.g. 'GR_co_intro')
 * - `_preview` is appended whenever mas.preview=on is included (e.g. 'GR_co_2026-04-15_preview')
 * This makes every page's params unique-by-construction, so no two features can silently collide.
 */
function toParamStates(browserParams) {
    if (browserParams && typeof browserParams === 'object' && !Array.isArray(browserParams)) {
        return Object.entries(browserParams).map(([stateName, params]) => [
            stateName,
            Array.isArray(params) ? params : [params],
        ]);
    }
    return [['', Array.isArray(browserParams) ? browserParams : [browserParams]]];
}

function instantSuffix(params) {
    const instantParam = params.find((p) => p && p.includes('instant='));
    return instantParam ? `_${instantParam.split('=')[1]}` : '';
}

const workerPages = [];
const seenPages = new Set();

function pushPage(name, path, params) {
    if (seenPages.has(name)) return;
    seenPages.add(name);
    workerPages.push({ name, url: params.reduce((u, p) => addUrlQueryParams(u, p), path) });
}

for (const feature of features) {
    const paths = Array.isArray(feature.path) ? feature.path : [feature.path];
    const states = toParamStates(feature.browserParams);

    for (const path of paths) {
        const localeName = pathToName[path];

        for (const [stateName, params] of states) {
            const nonPreviewParams = params.filter((p) => !p.includes('mas.preview'));
            const baseName = stateName ? `${localeName}_${stateName}` : `${localeName}${instantSuffix(nonPreviewParams)}`;
            pushPage(baseName, path, nonPreviewParams);
            pushPage(`${baseName}_preview`, path, params);
        }
    }
}

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
            const page = workerSetup.getPage('US_preview');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('US_preview', DOCS_GALLERY_PATH.PLANS_COLLECTION.US, expect);
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
    });

    // @MAS-Promotions-Regional-Variation-Card-in-Collection
    test(`${features[1].name},${features[1].tags}`, async () => {
        const { data } = features[1];

        // uncomment below steps when MWPW-197336 is fixed

        // await test.step('step-1: Verify regional promotion card on GR_co with preview parameter on', async () => {
        //     const page = workerSetup.getPage('GR_co_2026-04-15_preview');
        //     const acomPage = new MasPlans(page);
        //     await workerSetup.verifyPageURL('GR_co_2026-04-15_preview', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_co, expect);
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
            const page = workerSetup.getPage('GR_EN_2026-04-15_preview');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('GR_EN_2026-04-15_preview', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_EN, expect);
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
            const page = workerSetup.getPage('GR_co_2026-04-15');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('GR_co_2026-04-15', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_co, expect);
            await expect(acomPage.getCard(data.id)).toBeVisible();
            await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
            await expect(acomPage.getCard(data.id)).not.toHaveAttribute('data-promotion-project', data.promotionProject);
            await expect(acomPage.getCardBadge(data.id)).toContainText(data.badgeText);
            await expect(acomPage.getCardBadge(data.id)).toHaveCSS('background-color', data.badgeColor);
            await expect(acomPage.getCardBadge(data.id)).toHaveCSS('border-color', data.badgeBorderColor);
            await expect(acomPage.getCard(data.id)).toHaveCSS('background-color', data.borderColor);
            await expect(acomPage.getCardPrice(data.id)).toContainText(data.price);
            await expect(acomPage.getCardStrikethroughPrice(data.id)).not.toBeVisible();
        });

        await test.step('step-4: Verify regional promotion card on GR_EN without preview parameter - no strikethrough', async () => {
            const page = workerSetup.getPage('GR_EN_2026-04-15');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('GR_EN_2026-04-15', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_EN, expect);
            await expect(acomPage.getCard(data.id)).toBeVisible();
            await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
            await expect(acomPage.getCard(data.id)).not.toHaveAttribute('data-promotion-project', data.promotionProject);
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
        //     const page = workerSetup.getPage('GR_co_2026-04-15_preview');
        //     const acomPage = new MasPlans(page);
        //     await workerSetup.verifyPageURL('GR_co_2026-04-15_preview', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_co, expect);
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
            const page = workerSetup.getPage('GR_EN_2026-04-15_preview');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('GR_EN_2026-04-15_preview', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_EN, expect);
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
        //     const page = workerSetup.getPage('GR_co_2026-04-15');
        //     const acomPage = new MasPlans(page);
        //     await workerSetup.verifyPageURL('GR_co_2026-04-15', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_co, expect);
        //     await expect(acomPage.getCard(data.id)).toBeVisible();
        //     await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
        //     await expect(acomPage.getCard(data.id)).not.toHaveAttribute('data-promotion-project', data.promotionProject);
        //     await expect(acomPage.getCardBadge(data.id)).toContainText(data.badgeText);
        //     await expect(acomPage.getCardBadge(data.id)).toHaveCSS('background-color', data.badgeColor);
        //     await expect(acomPage.getCardBadge(data.id)).toHaveCSS('border-color', data.badgeBorderColor);
        //     await expect(acomPage.getCardPrice(data.id)).toContainText(data.price);
        //     await expect(acomPage.getCardStrikethroughPrice(data.id)).not.toBeVisible();
        // });

        await test.step('step-4: Verify grouped promotion card on GR_EN without preview parameter - no strikethrough', async () => {
            const page = workerSetup.getPage('GR_EN_2026-04-15');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('GR_EN_2026-04-15', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_EN, expect);
            await expect(acomPage.getCard(data.id)).toBeVisible();
            await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
            await expect(acomPage.getCard(data.id)).not.toHaveAttribute('data-promotion-project', data.promotionProject);
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
        //     const page = workerSetup.getPage('GR_co_2026-04-15_preview');
        //     const acomPage = new MasPlans(page);
        //     await workerSetup.verifyPageURL('GR_co_2026-04-15_preview', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_co, expect);
        //     await expect(acomPage.getCard(data.id)).toBeVisible();
        //     await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
        //     await expect(acomPage.getCard(data.id)).toHaveAttribute('data-promotion-project', data.promotionProject);
        //     await expect(acomPage.getCollection(data.collection_id)).toHaveAttribute('variation-id', data.variation_collection_id);
        //     await expect(acomPage.getCardPrice(data.id)).toContainText(data.promoPrice);
        //     await expect(acomPage.getCardStrikethroughPrice(data.id)).toContainText(data.price);
        //     await expect(acomPage.getCardStrikethroughPrice(data.id)).toHaveCSS('text-decoration-line', 'line-through');
        // });

        await test.step('step-2: Verify regional variation card in regional variation collection on GR_EN with preview parameter on', async () => {
            const page = workerSetup.getPage('GR_EN_2026-04-15_preview');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('GR_EN_2026-04-15_preview', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_EN, expect);
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
        //     const page = workerSetup.getPage('GR_co_2026-04-15');
        //     const acomPage = new MasPlans(page);
        //     await workerSetup.verifyPageURL('GR_co_2026-04-15', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_co, expect);
        //     await expect(acomPage.getCard(data.id)).toBeVisible();
        //     await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
        //     await expect(acomPage.getCard(data.id)).not.toHaveAttribute('data-promotion-project', data.promotionProject);
        //     await expect(acomPage.getCollection(data.collection_id)).toHaveAttribute('variation-id', data.variation_collection_id);
        //     await expect(acomPage.getCardPrice(data.id)).toContainText(data.price);
        //     await expect(acomPage.getCardStrikethroughPrice(data.id)).not.toBeVisible();
        // });

        await test.step('step-4: Verify regional variation card in regional variation collection on GR_EN without preview parameter - no strikethrough', async () => {
            const page = workerSetup.getPage('GR_EN_2026-04-15');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('GR_EN_2026-04-15', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_EN, expect);
            await expect(acomPage.getCard(data.id)).toBeVisible();
            await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
            await expect(acomPage.getCard(data.id)).not.toHaveAttribute('data-promotion-project', data.promotionProject);
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
        //     const page = workerSetup.getPage('GR_co_2026-04-15_preview');
        //     const acomPage = new MasPlans(page);
        //     await workerSetup.verifyPageURL('GR_co_2026-04-15_preview', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_co, expect);
        //     await expect(acomPage.getCard(data.id)).toBeVisible();
        //     await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
        //     await expect(acomPage.getCard(data.id)).toHaveAttribute('data-promotion-project', data.promotionProject);
        //     await expect(acomPage.getCollection(data.collection_id)).toHaveAttribute('variation-id', data.variation_collection_id);
        //     await expect(acomPage.getCardPrice(data.id)).toContainText(data.promoPrice);
        //     await expect(acomPage.getCardStrikethroughPrice(data.id)).toContainText(data.price);
        //     await expect(acomPage.getCardStrikethroughPrice(data.id)).toHaveCSS('text-decoration-line', 'line-through');
        // });

        await test.step('step-2: Verify grouped variation card in regional variation collection on GR_EN with preview parameter on', async () => {
            const page = workerSetup.getPage('GR_EN_2026-04-15_preview');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('GR_EN_2026-04-15_preview', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_EN, expect);
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
        //     const page = workerSetup.getPage('GR_co_2026-04-15');
        //     const acomPage = new MasPlans(page);
        //     await workerSetup.verifyPageURL('GR_co_2026-04-15', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_co, expect);
        //     await expect(acomPage.getCard(data.id)).toBeVisible();
        //     await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
        //     await expect(acomPage.getCard(data.id)).not.toHaveAttribute('data-promotion-project', data.promotionProject);
        //     await expect(acomPage.getCollection(data.collection_id)).toHaveAttribute('variation-id', data.variation_collection_id);
        //     await expect(acomPage.getCardPrice(data.id)).toContainText(data.price);
        //     await expect(acomPage.getCardStrikethroughPrice(data.id)).not.toBeVisible();
        // });

        await test.step('step-4: Verify grouped variation card in regional variation collection on GR_EN without preview parameter - no strikethrough', async () => {
            const page = workerSetup.getPage('GR_EN_2026-04-15');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('GR_EN_2026-04-15', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_EN, expect);
            await expect(acomPage.getCard(data.id)).toBeVisible();
            await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
            await expect(acomPage.getCard(data.id)).not.toHaveAttribute('data-promotion-project', data.promotionProject);
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
        //     const page = workerSetup.getPage('AR_co_preview');
        //     const acomPage = new MasPlans(page);
        //     await workerSetup.verifyPageURL('AR_co_preview', DOCS_GALLERY_PATH.PLANS_COLLECTION.AR_co, expect);
        //     await expect(acomPage.getCard(data.id)).toBeVisible();
        //     await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
        //     await expect(acomPage.getCard(data.id)).toHaveAttribute('data-promotion-project', data.promotionProject);
        //     await expect(acomPage.getCollection(data.collection_id)).toHaveAttribute('variation-id', data.variation_collection_id);
        //     await expect(acomPage.getCardPrice(data.id)).toContainText(data.promoPrice);
        //     await expect(acomPage.getCardStrikethroughPrice(data.id)).toContainText(data.price);
        //     await expect(acomPage.getCardStrikethroughPrice(data.id)).toHaveCSS('text-decoration-line', 'line-through');
        // });

        await test.step('step-2: Verify translated regional variation card in grouped variation collection on AR_ES with preview parameter on', async () => {
            const page = workerSetup.getPage('AR_ES_preview');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('AR_ES_preview', DOCS_GALLERY_PATH.PLANS_COLLECTION.AR_ES, expect);
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

        await test.step('step-4: Verify translated regional variation card in grouped variation collection on AR_ES without preview parameter', async () => {
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
    });

    // @MAS-Promotions-Variation-Evergreen
    test(`${features[6].name},${features[6].tags}`, async () => {
        const { data } = features[6];

        await test.step('step-1: Verify evergreen promo variation card on US with preview parameter on', async () => {
            const page = workerSetup.getPage('US_preview');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('US_preview', DOCS_GALLERY_PATH.PLANS_COLLECTION.US, expect);
            await expect(acomPage.getCard(data.id)).toBeVisible();
            await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
            await expect(acomPage.getCard(data.id)).toHaveAttribute('data-promotion-project', data.promotionProject);
        });

        await test.step('step-2: Verify evergreen promo variation card on US without preview parameter', async () => {
            const page = workerSetup.getPage('US');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('US', DOCS_GALLERY_PATH.PLANS_COLLECTION.US, expect);
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
            const page = workerSetup.getPage('GR_co_intro');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('GR_co_intro', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_co, expect);
            await expect(acomPage.getCard(data.id)).toBeVisible();
            await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
            await expect(acomPage.getCard(data.id)).toHaveAttribute('data-promotion-project', data.introPromoProject);
            await expect(acomPage.getCardPrice(data.id).locator(acomPage.price)).toHaveAttribute('data-wcs-osi', data.introOsi);
            await expect(acomPage.getCardBadge(data.id)).toContainText(data.badgeText);
        });

        await test.step('step-2: Verify intro promo on GR_co with preview parameter on', async () => {
            const page = workerSetup.getPage('GR_co_intro_preview');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('GR_co_intro_preview', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_co, expect);
            await expect(acomPage.getCard(data.id)).toBeVisible();
            await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
            await expect(acomPage.getCard(data.id)).toHaveAttribute('data-promotion-project', data.introPromoProject);
            await expect(acomPage.getCardPrice(data.id).locator(acomPage.price)).toHaveAttribute('data-wcs-osi', data.introOsi);
            await expect(acomPage.getCardBadge(data.id)).toContainText(data.badgeText);
        });

        await test.step('step-3: Verify intro promo on GR_EN without preview parameter', async () => {
            const page = workerSetup.getPage('GR_EN_intro');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('GR_EN_intro', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_EN, expect);
            await expect(acomPage.getCard(data.id)).toBeVisible();
            await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
            await expect(acomPage.getCard(data.id)).toHaveAttribute('data-promotion-project', data.introPromoProject);
            await expect(acomPage.getCardPrice(data.id).locator(acomPage.price)).toHaveAttribute('data-wcs-osi', data.introOsi);
            await expect(acomPage.getCardBadge(data.id)).toContainText(data.badgeText);
        });

        await test.step('step-4: Verify intro promo on GR_EN with preview parameter on', async () => {
            const page = workerSetup.getPage('GR_EN_intro_preview');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('GR_EN_intro_preview', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_EN, expect);
            await expect(acomPage.getCard(data.id)).toBeVisible();
            await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
            await expect(acomPage.getCard(data.id)).toHaveAttribute('data-promotion-project', data.introPromoProject);
            await expect(acomPage.getCardPrice(data.id).locator(acomPage.price)).toHaveAttribute('data-wcs-osi', data.introOsi);
            await expect(acomPage.getCardBadge(data.id)).toContainText(data.badgeText);
        });

        await test.step('step-5: Verify regional evergreen promo overtakes intro on GR_co without preview parameter', async () => {
            const page = workerSetup.getPage('GR_co_regional');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('GR_co_regional', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_co, expect);
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
            const page = workerSetup.getPage('GR_co_regional_preview');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('GR_co_regional_preview', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_co, expect);
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
            const page = workerSetup.getPage('GR_EN_regional');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('GR_EN_regional', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_EN, expect);
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
            const page = workerSetup.getPage('GR_EN_regional_preview');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('GR_EN_regional_preview', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_EN, expect);
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

        await test.step('step-1: Verify seasonal promo on GR_co with preview parameter on', async () => {
            const page = workerSetup.getPage('GR_co_2026-09-10_preview');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('GR_co_2026-09-10_preview', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_co, expect);
            await expect(acomPage.getCard(data.id)).toBeVisible();
            await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
            await expect(acomPage.getCard(data.id)).toHaveAttribute('data-promotion-project', data.promotionProject);
            await expect(acomPage.getCardBadge(data.id)).toContainText(data.badgeText);
        });

        await test.step('step-2: Verify seasonal promo on GR_EN with preview parameter on', async () => {
            const page = workerSetup.getPage('GR_EN_2026-09-10_preview');
            const acomPage = new MasPlans(page);
            await workerSetup.verifyPageURL('GR_EN_2026-09-10_preview', DOCS_GALLERY_PATH.PLANS_COLLECTION.GR_EN, expect);
            await expect(acomPage.getCard(data.id)).toBeVisible();
            await expect(acomPage.getCard(data.id)).toHaveAttribute('variation-id', data.variation_id);
            await expect(acomPage.getCard(data.id)).toHaveAttribute('data-promotion-project', data.promotionProject);
            await expect(acomPage.getCardBadge(data.id)).toContainText(data.badgeText);
        });
    });
});
