import { expect, test } from '../../../libs/docs-test.js';
import { features } from './prodocs.spec.js';
import MasPro from '../pro.page.js';
import WebUtil from '../../../libs/webutil.js';
import { createWorkerPageSetup, DOCS_GALLERY_PATH } from '../../../utils/commerce.js';

let acomPage;
let webUtil;

test.skip(({ browserName }) => browserName !== 'chromium', 'Not supported to run on multiple browsers.');

const workerSetup = createWorkerPageSetup({
    pages: [{ name: 'US', url: DOCS_GALLERY_PATH.PRO }],
});

const top = (card) => card.evaluate((el) => Math.round(el.getBoundingClientRect().top));

test.describe('ACOM MAS pro cards feature test suite', () => {
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
        acomPage = new MasPro(page);
        webUtil = new WebUtil(page);
        await workerSetup.verifyPageURL('US', DOCS_GALLERY_PATH.PRO, expect);
        return page;
    };

    // @MAS-Pro
    test(`${features[0].name},${features[0].tags}`, async () => {
        const { data } = features[0];

        await test.step('step-1: Go to Pro gallery', async () => {
            await openGallery();
        });

        await test.step('step-2: Verify Pro card content', async () => {
            const card = acomPage.getCard(data.id).first();
            await expect(card).toBeVisible();
            await expect(card).toHaveAttribute('variant', 'pro');
            await expect(acomPage.getCardIcon(data.id).first()).toHaveAttribute('src', new RegExp(data.iconUrl));
            await expect(acomPage.getCardTitle(data.id).first()).toHaveText(data.title);
            await expect(acomPage.getCardSubtitle(data.id).first()).toHaveText(data.subtitle);
            await expect(acomPage.getCardDescription(data.id).first()).toContainText(data.description);
            await expect(acomPage.getCardPrice(data.id).first()).toContainText(data.price);
            await expect(acomPage.getCardPlanType(data.id).first()).toHaveText(data.planTypeText);
            await expect(acomPage.getCardCTAs(data.id).first()).toHaveText(data.ctas[0]);
            await expect(acomPage.getCardCTAs(data.id).nth(1)).toHaveText(data.ctas[1]);
        });

        await test.step('step-3: Verify Pro card What is included sections', async () => {
            const sections = acomPage.getCard(data.id).first().locator('div[slot="whats-included"] .section');
            await expect(sections).toHaveCount(data.whatsIncludedSections.length);
            for (const [i, name] of data.whatsIncludedSections.entries()) {
                await expect(sections.nth(i)).toContainText(name);
            }
        });
    });

    // @MAS-Pro-CSS
    test(`${features[1].name},${features[1].tags}`, async () => {
        const { data } = features[1];

        await test.step('step-1: Go to Pro gallery', async () => {
            await openGallery();
        });

        await test.step('step-2: Verify Pro card CSS', async () => {
            const { cssProp } = acomPage;
            await expect(acomPage.getCard(data.id).first()).toBeVisible();
            expect(await webUtil.verifyCSS(acomPage.getCard(data.id).first(), cssProp.card)).toBeTruthy();
            expect(await webUtil.verifyCSS(acomPage.getCardIcon(data.id).first(), cssProp.icon)).toBeTruthy();
            expect(await webUtil.verifyCSS(acomPage.getCardTitle(data.id).first(), cssProp.title)).toBeTruthy();
            expect(await webUtil.verifyCSS(acomPage.getCardSubtitle(data.id).first(), cssProp.subtitle)).toBeTruthy();
            expect(await webUtil.verifyCSS(acomPage.getCardPriceRow(data.id).first(), cssProp.price)).toBeTruthy();
            expect(await webUtil.verifyCSS(acomPage.getCardDescription(data.id).first(), cssProp.description)).toBeTruthy();
            expect(await webUtil.verifyCSS(acomPage.getCardCTAs(data.id).first(), cssProp.primaryCta)).toBeTruthy();
            expect(await webUtil.verifyCSS(acomPage.getCardCTAs(data.id).nth(1), cssProp.outlineCta)).toBeTruthy();
        });
    });

    // @MAS-Pro-Edu
    test(`${features[2].name},${features[2].tags}`, async () => {
        const { data } = features[2];

        await test.step('step-1: Go to Pro gallery', async () => {
            await openGallery();
        });

        await test.step('step-2: Verify Pro EDU card content', async () => {
            const card = acomPage.getCard(data.id);
            await expect(card).toBeVisible();
            await expect(card).toHaveAttribute('variant', 'pro');
            await expect(card).toHaveAttribute('size', 'edu');
            await expect(acomPage.getCardTitle(data.id)).toHaveText(data.title);
            await expect(acomPage.getCardSubtitle(data.id)).toHaveText(data.subtitle);
            await expect(acomPage.getCardPrice(data.id)).toContainText(data.price);
            await expect(acomPage.getEduAddon(data.id)).toBeVisible();
            await expect(acomPage.getCardCTAs(data.id).first()).toHaveText(data.ctas[0]);
            await expect(acomPage.getCardCTAs(data.id).nth(1)).toHaveText(data.ctas[1]);
        });

        await test.step('step-3: Verify the What is included panel is the EDU headline', async () => {
            await expect(acomPage.getEduTitle(data.id)).toContainText(data.savingsTitle);
            await expect(acomPage.getEduLabel(data.id)).toHaveText(data.label);
            await expect(acomPage.getEduDisclaimer(data.id)).toContainText(data.disclaimer);
        });
    });

    // @MAS-Pro-Edu-CSS
    test(`${features[3].name},${features[3].tags}`, async () => {
        const { data } = features[3];

        await test.step('step-1: Go to Pro gallery', async () => {
            await openGallery();
        });

        await test.step('step-2: Verify Pro EDU card CSS', async () => {
            const { eduCssProp } = acomPage;
            await expect(acomPage.getCard(data.id)).toBeVisible();
            expect(await webUtil.verifyCSS(acomPage.getCard(data.id), eduCssProp.card)).toBeTruthy();
            expect(await webUtil.verifyCSS(acomPage.getCardTitle(data.id), eduCssProp.title)).toBeTruthy();
            expect(await webUtil.verifyCSS(acomPage.getEduTitle(data.id), eduCssProp.whatsIncludedTitle)).toBeTruthy();
        });

        await test.step('step-3: Verify the EDU card is wider than a grid card', async () => {
            const eduWidth = (await acomPage.getCard(data.id).boundingBox()).width;
            const gridCard = acomPage.getCard('f6f140b3-b233-412a-8b93-d3e589da7fa5').first();
            expect(eduWidth).toBeGreaterThan((await gridCard.boundingBox()).width);
        });
    });

    // @MAS-Pro-Grid
    test(`${features[4].name},${features[4].tags}`, async () => {
        const { data } = features[4];
        const page = await openGallery();

        try {
            await page.setViewportSize({ width: 1920, height: 1080 });
            await page.waitForTimeout(3000);

            for (const { selector, cards } of data.grids) {
                await test.step(`step: Verify ${selector} lays ${cards} card(s) in one row with synced heights`, async () => {
                    const gridCards = page.locator(`${selector} merch-card`);
                    await expect(gridCards).toHaveCount(cards);
                    await expect(gridCards.first()).toHaveAttribute('variant', 'pro');
                    const rows = await acomPage.getRows(gridCards);
                    expect(rows).toHaveLength(1);
                    expect(rows[0]).toHaveLength(cards);
                    for (const name of Object.keys(rows[0][0])) {
                        const values = new Set(rows[0].map((vars) => vars[name]));
                        expect(values.size).toBe(1);
                        expect([...values][0]).toMatch(/^\d+(\.\d+)?px$/);
                    }
                });
            }
        } finally {
            // Restore the default viewport of the mas-docs-chromium project for any test added after this one.
            await page.setViewportSize({ width: 1280, height: 720 });
        }
    });

    // @MAS-Pro-Collection
    test(`${features[5].name},${features[5].tags}`, async () => {
        const { data } = features[5];

        await test.step('step-1: Go to Pro gallery', async () => {
            await openGallery();
        });

        await test.step('step-2: Verify the collection renders all pro cards', async () => {
            const cards = acomPage.getCollectionCards(data.id);
            await expect(acomPage.getCollection(data.id)).toBeVisible();
            await expect(cards).toHaveCount(data.cardCount);
            for (let i = 0; i < data.cardCount; i++) {
                await expect(cards.nth(i)).toHaveAttribute('variant', 'pro');
            }
            await expect(cards.first().locator('h3[slot="heading-xs"]')).toHaveText(data.firstCardTitle);
            await expect(cards.last().locator('h3[slot="heading-xs"]')).toHaveText(data.lastCardTitle);
        });

        await test.step('step-3: Verify the collection lays cards out in a multi-column grid', async () => {
            const cards = acomPage.getCollectionCards(data.id);
            const firstTop = await top(cards.first());
            expect(await top(cards.nth(1))).toBe(firstTop);
        });
    });

    // @MAS-Pro-Legal-Text
    test(`${features[6].name},${features[6].tags}`, async () => {
        const { data } = features[6];
        const page = await openGallery();

        await test.step('step-1: Author a Short Description on the fragment and reload', async () => {
            await page.route(`**/fragment?id=${data.id}*`, async (route) => {
                const json = await (await route.fetch()).json();
                json.fields.shortDescription = data.shortDescription;
                await route.fulfill({ json });
            });
            await page.reload();
        });

        await test.step('step-2: Verify the Short Description renders as the legal plan type text', async () => {
            await expect(acomPage.getCardLegalPlanType(data.id).first()).toHaveText(data.shortDescription);
        });
    });
});
