import { expect, test } from '@playwright/test';
import { features } from './masadobehome.spec.js';
import WebUtil from '../../libs/webutil.js';
import AdobeHomePage from './masadobehome.page.js';
import { createWorkerPageSetup, DOCS_GALLERY_PATH } from '../../utils/commerce.js';

let ah;
let webUtil;

test.skip(({ browserName }) => browserName !== 'chromium', 'Not supported to run on multiple browsers.');

const workerSetup = createWorkerPageSetup({
    pages: [{ name: 'US', url: DOCS_GALLERY_PATH.ADOBE_HOME.US }],
});

test.describe('Merch AH Try Buy Widget test suite', () => {
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

    const verifyWidgetCSS = async (widget, testData) => {
        const { cssProps } = testData.data;

        if (cssProps?.theme) {
            expect(await webUtil.verifyCSS(widget, ah.widgetCssProp.base[cssProps.theme])).toBeTruthy();
        }

        if (cssProps?.size) {
            expect(await webUtil.verifyCSS(widget, ah.widgetCssProp.sizes[cssProps.size])).toBeTruthy();
        }

        if (cssProps?.typography) {
            const element = await ah.getWidgetField(testData.data.id, testData.data.size, cssProps.typography);
            expect(await webUtil.verifyCSS(element, ah.widgetCssProp.typography[cssProps.typography])).toBeTruthy();
        }
    };

    test(`Test: ${features[0].name},${features[0].tags}`, async () => {
        const testData = features[0];
        console.log(`Running test for ${testData.name} with ID ${testData.data.id}`);

        const page = await workerSetup.getPage('US');
        ah = new AdobeHomePage(page);
        webUtil = new WebUtil(page);

        await workerSetup.verifyPageURL('US', DOCS_GALLERY_PATH.ADOBE_HOME.US, expect);

        await test.step('Debug DOM structure', async () => {
            const domInfo = await page.evaluate(
                ({ id }) => {
                    const fragments = document.querySelectorAll('aem-fragment');
                    const merchCards = document.querySelectorAll('merch-card[variant="ah-try-buy-widget"]');

                    const specificFragment = document.querySelector(`aem-fragment[fragment="${id}"]`);

                    return {
                        fragmentCount: fragments.length,
                        merchCardCount: merchCards.length,
                        hasSpecificFragment: !!specificFragment,
                        fragmentIds: Array.from(fragments).map((f) => f.getAttribute('fragment')),
                        cardSizes: Array.from(merchCards).map((c) => c.getAttribute('size')),
                    };
                },
                { id: testData.data.id },
            );

            console.log(`Found ${domInfo.fragmentCount} aem-fragment elements on the page`);
            console.log(`Found ${domInfo.merchCardCount} merch-card elements on the page`);
            console.log(`Fragment with ID ${testData.data.id} found: ${domInfo.hasSpecificFragment}`);
            console.log('All fragment IDs:', domInfo.fragmentIds);
            console.log('All card sizes:', domInfo.cardSizes);
        });

        await test.step(`Validate widget content for ${testData.name}`, async () => {
            const widget = await ah.getWidget(testData.data.id, testData.data.size);
            await expect(widget).toBeVisible();
            await expect(widget).toHaveAttribute('variant', 'ah-try-buy-widget');
            await expect(widget).toHaveAttribute('size', testData.data.size);
            await expect(await ah.getWidgetField(testData.data.id, testData.data.size, 'title')).toHaveText(
                testData.data.title,
            );
            await expect(await ah.getWidgetField(testData.data.id, testData.data.size, 'description')).toContainText(
                'creative apps',
            );
            await expect(await ah.getWidgetField(testData.data.id, testData.data.size, 'price')).toContainText(
                /US\$\d+\.\d{2}\/mo/,
            );
            await verifyWidgetCSS(widget, testData);
        });
    });

    test(`Test: ${features[1].name},${features[1].tags}`, async () => {
        const testData = features[1];
        console.log(`Running test for ${testData.name} with ID ${testData.data.id}`);

        const page = await workerSetup.getPage('US');
        ah = new AdobeHomePage(page);
        webUtil = new WebUtil(page);

        await workerSetup.verifyPageURL('US', DOCS_GALLERY_PATH.ADOBE_HOME.US, expect);

        await test.step('Verify double size layout', async () => {
            const widget = await ah.getWidget(testData.data.id, testData.data.size);
            await expect(widget).toBeVisible();
            await expect(widget).toHaveAttribute('size', testData.data.size);
            await verifyWidgetCSS(widget, testData);
        });

        await test.step('Verify price styling', async () => {
            const price = await ah.getWidgetField(testData.data.id, testData.data.size, 'price');
            const fontSize = await price.evaluate((element) =>
                getComputedStyle(element).getPropertyValue('--consonant-merch-card-detail-s-font-size').trim(),
            );
            expect(fontSize, 'Price typography token must resolve for the active Spectrum scale').toMatch(/^\d+(\.\d+)?px$/);
            await expect(price).toHaveCSS('font-size', fontSize);
            await expect(price).toHaveCSS('line-height', '17px');
            await expect(price).toHaveCSS('font-style', 'italic');
            await expect(price).toHaveCSS('color', 'rgb(19, 19, 19)');
        });
    });

    test(`Test: ${features[2].name},${features[2].tags}`, async () => {
        const testData = features[2];
        console.log(`Running test for ${testData.name} with ID ${testData.data.id}`);

        const page = await workerSetup.getPage('US');
        ah = new AdobeHomePage(page);
        webUtil = new WebUtil(page);

        await workerSetup.verifyPageURL('US', DOCS_GALLERY_PATH.ADOBE_HOME.US, expect);

        await test.step('Verify single size layout', async () => {
            const widget = await ah.getWidget(testData.data.id, testData.data.size);
            await expect(widget).toBeVisible();
            await expect(widget).toHaveAttribute('size', testData.data.size);
            await verifyWidgetCSS(widget, testData);
        });
    });

    test(`Test: ${features[3].name},${features[3].tags}`, async () => {
        const testData = features[3];
        console.log(`Running API validation test with ID ${testData.data.id}`);

        const page = await workerSetup.getPage('US');
        ah = new AdobeHomePage(page);
        webUtil = new WebUtil(page);

        await workerSetup.verifyPageURL('US', DOCS_GALLERY_PATH.ADOBE_HOME.US, expect);
        const originalUrl = page.url();
        const originalPages = new Set(page.context().pages());

        try {
            const cta = (await ah.getWidgetField(testData.data.id, testData.data.size, 'cta')).filter({
                hasText: testData.data.cta,
            });
            const [initialResponse] = await Promise.all([
                page.context().waitForEvent('response', {
                    predicate: (response) =>
                        response.request().isNavigationRequest() && response.url().includes(testData.data.offerid),
                }),
                cta.click(),
            ]);
            let response = initialResponse;
            while ([301, 302, 303, 307, 308].includes(response.status())) {
                const request = response.request();
                await expect.poll(() => request.redirectedTo()).not.toBeNull();
                response = await request.redirectedTo().response();
                expect(response, 'Checkout redirect must receive a response').not.toBeNull();
            }
            expect(response.status(), 'Checkout redirect chain must finish successfully').toBe(200);
        } finally {
            for (const popup of page.context().pages()) {
                if (!originalPages.has(popup)) await popup.close();
            }
            if (page.url() !== originalUrl) await page.goto(originalUrl, { waitUntil: 'domcontentloaded' });
        }
    });

    test(`Test: ${features[4].name},${features[4].tags}`, async () => {
        const testData = features[4];
        console.log(`Running test for ${testData.name} with ID ${testData.data.id} - Badge validation`);

        const page = await workerSetup.getPage('US');
        ah = new AdobeHomePage(page);
        webUtil = new WebUtil(page);

        await workerSetup.verifyPageURL('US', DOCS_GALLERY_PATH.ADOBE_HOME.US, expect);

        await test.step('Validate widget content with badge', async () => {
            const widget = await ah.getWidget(testData.data.id, testData.data.size);

            // Verify widget exists
            await expect(widget).toBeVisible();

            // Verify badge exists
            const badge = await ah.getWidgetBadge(testData.data.id, testData.data.size);
            await expect(badge).toBeVisible();
        });

        await test.step('Verify badge text and styling', async () => {
            // Get badge text directly from page evaluate to handle shadow DOM
            const badgeInfo = await page.evaluate(
                ({ id, size, expectedText }) => {
                    const fragment = document.querySelector(`aem-fragment[fragment="${id}"]`);
                    if (!fragment) return { error: 'Fragment not found' };

                    let merchCard = null;
                    let parent = fragment.parentElement;
                    while (parent) {
                        if (
                            parent.tagName.toLowerCase() === 'merch-card' &&
                            parent.getAttribute('variant') === 'ah-try-buy-widget' &&
                            parent.getAttribute('size') === size
                        ) {
                            merchCard = parent;
                            break;
                        }
                        parent = parent.parentElement;
                    }

                    if (!merchCard) return { error: 'Card not found' };

                    // Find the badge element
                    const badgeEl = merchCard.querySelector('[slot="badge"] merch-badge');
                    if (!badgeEl) return { error: 'Badge element not found' };

                    // Badge text lives in light DOM; the shadow .badge only wraps a slot
                    const badgeText = badgeEl.textContent.trim();

                    return {
                        text: badgeText,
                        backgroundColor: badgeEl.getAttribute('background-color'),
                        hasText: badgeText === expectedText,
                    };
                },
                { id: testData.data.id, size: testData.data.size, expectedText: testData.data.badge.text },
            );

            console.log('Badge info:', badgeInfo);

            if (badgeInfo.error) {
                throw new Error(badgeInfo.error);
            }

            // Verify badge text
            expect(badgeInfo.text).toBe(testData.data.badge.text);

            // Verify badge CSS properties
            const badgeStyle = await page.evaluate(
                ({ id, size }) => {
                    const fragment = document.querySelector(`aem-fragment[fragment="${id}"]`);
                    if (!fragment) return null;

                    let merchCard = null;
                    let parent = fragment.parentElement;
                    while (parent) {
                        if (
                            parent.tagName.toLowerCase() === 'merch-card' &&
                            parent.getAttribute('variant') === 'ah-try-buy-widget' &&
                            parent.getAttribute('size') === size
                        ) {
                            merchCard = parent;
                            break;
                        }
                        parent = parent.parentElement;
                    }

                    if (!merchCard) return null;

                    const badgeEl = merchCard.querySelector('[slot="badge"] merch-badge');
                    if (!badgeEl) return null;

                    // Get computed style of the badge slot container
                    const slotEl = merchCard.querySelector('[slot="badge"]');
                    const slotStyle = window.getComputedStyle(slotEl);

                    // Get badge element attributes
                    return {
                        backgroundColor: badgeEl.getAttribute('background-color'),
                        position: slotStyle.position,
                        top: slotStyle.top,
                        right: slotStyle.right,
                    };
                },
                { id: testData.data.id, size: testData.data.size },
            );

            expect(badgeStyle, 'Badge styling must be present').not.toBeNull();
            expect(badgeStyle.backgroundColor).toBe(testData.data.badge.color);
            expect(badgeStyle.position).toBe('absolute');
            expect(badgeStyle.top).toBe('18px');
            expect(badgeStyle.right).toBe('12px');
        });

        await test.step('Verify widget CSS with badge', async () => {
            const widget = await ah.getWidget(testData.data.id, testData.data.size);
            await verifyWidgetCSS(widget, testData);
        });
    });
});
