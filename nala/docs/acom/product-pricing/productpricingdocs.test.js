import { expect, test } from '../../../libs/docs-test.js';
import { features } from './productpricingdocs.spec.js';
import MasProductPricing from '../product-pricing.page.js';
import WebUtil from '../../../libs/webutil.js';
import { createWorkerPageSetup, DOCS_GALLERY_PATH } from '../../../utils/commerce.js';

let acomPage;
let webUtil;

test.skip(({ browserName }) => browserName !== 'chromium', 'Not supported to run on multiple browsers.');

const workerSetup = createWorkerPageSetup({
    pages: [{ name: 'US', url: DOCS_GALLERY_PATH.PRODUCT_PRICING }],
});

const SYNC_VALUE = /^\d+(\.\d+)?px$/;

test.describe('ACOM MAS product-pricing cards feature test suite', () => {
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

    const openGallery = async () => {
        const page = await workerSetup.getPage('US');
        acomPage = new MasProductPricing(page);
        webUtil = new WebUtil(page);
        await workerSetup.verifyPageURL('US', DOCS_GALLERY_PATH.PRODUCT_PRICING, expect);
        return page;
    };

    // @MAS-Product-Pricing
    test(`${features[0].name},${features[0].tags}`, async () => {
        const { data } = features[0];

        await test.step('step-1: Go to Product Pricing gallery', async () => {
            await openGallery();
        });

        await test.step('step-2: Verify Product Pricing card content', async () => {
            const card = acomPage.getCard(data.id).first();
            await expect(card).toBeVisible();
            await expect(card).toHaveAttribute('variant', 'product-pricing');
            await expect(acomPage.getCardIcon(data.id).first()).toHaveAttribute('src', new RegExp(data.iconUrl));
            await expect(acomPage.getCardTitle(data.id).first()).toHaveText(data.title);
            await expect(acomPage.getCardDescription(data.id).first()).toContainText(data.description);
            await expect(acomPage.getCardPrice(data.id).first()).toContainText(data.price);
            await expect(acomPage.getCardPlanType(data.id).first()).toHaveText(data.planTypeText);
            await expect(acomPage.getCardCTAs(data.id).first()).toBeVisible();
            await expect(acomPage.getCardCTAs(data.id).first()).toHaveText(data.ctas[0]);
            await expect(acomPage.getCardCTAs(data.id).nth(1)).toHaveText(data.ctas[1]);
        });
    });

    // @MAS-Product-Pricing-CSS
    test(`${features[1].name},${features[1].tags}`, async () => {
        const { data } = features[1];

        await test.step('step-1: Go to Product Pricing gallery', async () => {
            await openGallery();
        });

        await test.step('step-2: Verify Product Pricing card CSS', async () => {
            const { cssProp } = acomPage;
            await expect(acomPage.getCard(data.id).first()).toBeVisible();
            expect(await webUtil.verifyCSS(acomPage.getCard(data.id).first(), cssProp.card)).toBeTruthy();
            expect(await webUtil.verifyCSS(acomPage.getCardIcon(data.id).first(), cssProp.icon)).toBeTruthy();
            expect(await webUtil.verifyCSS(acomPage.getCardTitle(data.id).first(), cssProp.title)).toBeTruthy();
            expect(await webUtil.verifyCSS(acomPage.getCardPriceRow(data.id).first(), cssProp.price)).toBeTruthy();
            expect(await webUtil.verifyCSS(acomPage.getCardDescription(data.id).first(), cssProp.description)).toBeTruthy();
            expect(await webUtil.verifyCSS(acomPage.getCardCTAs(data.id).first(), cssProp.primaryCta)).toBeTruthy();
            expect(await webUtil.verifyCSS(acomPage.getCardCTAs(data.id).nth(1), cssProp.outlineCta)).toBeTruthy();
        });
    });

    // @MAS-Product-Pricing-Collection
    test(`${features[2].name},${features[2].tags}`, async () => {
        const { data } = features[2];

        await test.step('step-1: Go to Product Pricing gallery', async () => {
            await openGallery();
        });

        await test.step('step-2: Verify the collection renders all product-pricing cards', async () => {
            const cards = acomPage.getCollectionCards(data.id);
            await expect(acomPage.getCollection(data.id)).toBeVisible();
            await expect(cards).toHaveCount(data.cardCount);
            for (let i = 0; i < data.cardCount; i++) {
                await expect(cards.nth(i)).toHaveAttribute('variant', 'product-pricing');
            }
            await expect(cards.first().locator('[slot="heading-s"]')).toHaveText(data.firstCardTitle);
            await expect(cards.last().locator('[slot="heading-s"]')).toHaveText(data.lastCardTitle);
        });

        await test.step('step-3: Verify the collection lays cards out in a multi-column grid', async () => {
            const cards = acomPage.getCollectionCards(data.id);
            const top = (card) => card.evaluate((el) => Math.round(el.getBoundingClientRect().top));
            const firstTop = await top(cards.first());
            expect(await top(cards.nth(1))).toBe(firstTop);
            expect(await top(cards.last())).toBeGreaterThan(firstTop);
        });
    });

    // @MAS-Product-Pricing-Row-Height-Sync
    test(`${features[3].name},${features[3].tags}`, async () => {
        const { data } = features[3];
        const page = await openGallery();

        try {
            await page.setViewportSize({ width: 1280, height: 900 });
            await page.waitForTimeout(3000);

            const assertRowsSynced = async (cards) => {
                await expect(cards.first()).toBeVisible();
                const rows = await acomPage.getRowHeights(cards);
                expect(rows.length).toBeGreaterThan(1);
                for (const row of rows) {
                    expect(row.length).toBeGreaterThan(1);
                    for (let i = 0; i < row[0].length; i++) {
                        const values = new Set(row.map((vars) => vars[i]));
                        expect(values.size).toBe(1);
                        expect([...values][0]).toMatch(SYNC_VALUE);
                    }
                }
            };

            await test.step('step-1: Verify synced heights across cards in standalone rows', async () => {
                await assertRowsSynced(page.locator('.pp-rows merch-card'));
            });

            await test.step('step-2: Verify synced heights across cards in the collection rows', async () => {
                await assertRowsSynced(acomPage.getCollectionCards(data.collectionId));
            });
        } finally {
            // Restore the default viewport of the mas-docs-chromium project for any test added after this one.
            await page.setViewportSize({ width: 1280, height: 720 });
        }
    });

    // @MAS-Product-Pricing-Strikethrough
    test(`${features[4].name},${features[4].tags}`, async () => {
        const { data } = features[4];

        await test.step('step-1: Go to Product Pricing gallery', async () => {
            await openGallery();
        });

        await test.step('step-2: Verify the strikethrough price sits above the current price', async () => {
            const strikethrough = acomPage.getCardStrikethroughPrice(data.id).first();
            const alternative = acomPage.getCardAlternativePrice(data.id).first();
            await expect(strikethrough).toBeVisible();
            await expect(strikethrough).toContainText(data.price);
            await expect(alternative).toBeVisible();
            await expect(alternative).toContainText(data.price);
            const [struckBox, currentBox] = [await strikethrough.boundingBox(), await alternative.boundingBox()];
            expect(currentBox.y).toBeGreaterThan(struckBox.y);
        });

        await test.step('step-3: Verify the strikethrough price CSS', async () => {
            expect(
                await webUtil.verifyCSS(acomPage.getCardStrikethroughPrice(data.id).first(), acomPage.strikethroughCssProp),
            ).toBeTruthy();
        });
    });

    // @MAS-Product-Pricing-Free
    test(`${features[5].name},${features[5].tags}`, async () => {
        const { data } = features[5];

        await test.step('step-1: Go to Product Pricing gallery', async () => {
            await openGallery();
        });

        await test.step('step-2: Verify the free card shows the word Free instead of a price, and both CTAs', async () => {
            await expect(acomPage.getCard(data.id).first()).toBeVisible();
            await expect(acomPage.getCardPriceRow(data.id).first()).toHaveText(data.priceText);
            await expect(acomPage.getCardPrice(data.id)).toHaveCount(0);
            await expect(acomPage.getCardCTAs(data.id).first()).toHaveText(data.ctas[0]);
            await expect(acomPage.getCardCTAs(data.id).nth(1)).toHaveText(data.ctas[1]);
        });
    });

    // @MAS-Product-Pricing-3-Year-Term-License
    test(`${features[6].name},${features[6].tags}`, async () => {
        const { data } = features[6];

        await test.step('step-1: Go to Product Pricing gallery', async () => {
            await openGallery();
        });

        await test.step('step-2: Verify the term license shows a single price with no recurrence, and the authored term text', async () => {
            await expect(acomPage.getCard(data.id).first()).toBeVisible();
            await expect(acomPage.getCardTitle(data.id).first()).toHaveText(data.title);
            await expect(acomPage.getCardPrice(data.id).first()).toHaveText(data.price);
            await expect(acomPage.getCardShortDescription(data.id).first()).toHaveText(data.termText);
        });
    });

    // @MAS-Product-Pricing-Long-CTA-Stacking
    test(`${features[7].name},${features[7].tags}`, async () => {
        const { data } = features[7];
        const page = await openGallery();

        try {
            // One row of four cards: the stacked state is per row, not per card.
            await page.setViewportSize({ width: 1920, height: 1080 });
            await page.waitForTimeout(3000);

            await test.step('step-1: Verify the long CTA labels wrap onto two lines', async () => {
                const ctas = acomPage.getCardCTAs(data.longCtaId).first();
                await expect(ctas).toHaveText(data.longCtas[0]);
                await expect(acomPage.getCardCTAs(data.longCtaId).nth(1)).toHaveText(data.longCtas[1]);
                const [first, second] = [
                    await ctas.boundingBox(),
                    await acomPage.getCardCTAs(data.longCtaId).nth(1).boundingBox(),
                ];
                expect(second.y).toBeGreaterThanOrEqual(first.y + first.height);
            });

            await test.step('step-2: Verify every card in the long CTA row is stacked', async () => {
                const cards = page.locator('.pp-long-ctas merch-card');
                await expect(cards).toHaveCount(4);
                for (let i = 0; i < 4; i++) {
                    await expect(cards.nth(i)).toHaveAttribute('stacked', '');
                }
            });

            await test.step('step-3: Verify short CTA labels stay side by side and unstacked', async () => {
                const cards = page.locator('.pp-rows merch-card');
                await expect(cards.first()).not.toHaveAttribute('stacked', '');
                const ctas = acomPage.getCardCTAs(data.shortCtaId).first();
                const [first, second] = [
                    await ctas.boundingBox(),
                    await acomPage.getCardCTAs(data.shortCtaId).nth(1).boundingBox(),
                ];
                expect(second.y).toBeLessThan(first.y + first.height);
            });
        } finally {
            await page.setViewportSize({ width: 1280, height: 720 });
        }
    });
});
