import { test as base, expect } from '@playwright/test';
import GlobalRequestCounter from './global-request-counter.js';
import StudioPage from '../studio/studio.page.js';
import EditorPage from '../studio/editor.page.js';
import CCDSlicePage from '../studio/ccd/slice/slice.page.js';
import CCDSuggestedPage from '../studio/ccd/suggested/suggested.page.js';
import CCDFries from '../studio/commerce/fries/fries.page.js';
import AHTryBuyWidgetPage from '../studio/ahome/try-buy-widget/try-buy-widget.page.js';
import AHPromotedPlansPage from '../studio/ahome/promoted-plans/promoted-plans.page.js';
import ACOMPlansIndividualsPage from '../studio/acom/plans/individuals/individuals.page.js';
import OSTPage from '../studio/ost.page.js';
import WebUtil from './webutil.js';

// Global variables that all tests can access - recreated per test
let studio;
let editor;
let slice;
let suggested;
let fries;
let trybuywidget;
let promotedplans;
let individuals;
let ost;
let webUtil;
let clonedCardID = '';

/**
 * Extended Playwright test that automatically handles common MAS test operations
 * - Automatically creates fresh page objects for each test
 * - Automatically initializes request counter
 * - Automatically saves request data in afterEach
 * - Automatically extends timeout for all tests
 */
const masTest = base.extend({
    page: async ({ page }, use, testInfo) => {
        // Multiply default timeout by 3 (same as test.slow())
        const currentTimeout = testInfo.timeout;
        testInfo.setTimeout(currentTimeout * 3);
        await use(page);
    },
});

// Custom test function that automatically creates fresh page objects
const masTestWrapper = (name, testFn) => {
    return masTest(name, async ({ page, baseURL, browserName, context, request }) => {
        // Set HTTP headers for chromium
        if (browserName === 'chromium') {
            await page.setExtraHTTPHeaders({
                'sec-ch-ua': '"Chromium";v="123", "Not:A-Brand";v="8"',
            });
        }

        // Reset clonedCardID for each test
        clonedCardID = '';

        // Create fresh page objects for every test
        studio = new StudioPage(page);
        editor = new EditorPage(page);
        slice = new CCDSlicePage(page);
        suggested = new CCDSuggestedPage(page);
        fries = new CCDFries(page);
        trybuywidget = new AHTryBuyWidgetPage(page);
        promotedplans = new AHPromotedPlansPage(page);
        individuals = new ACOMPlansIndividualsPage(page);
        ost = new OSTPage(page);
        webUtil = new WebUtil(page);

        // Initialize request counter
        await GlobalRequestCounter.init(page);

        // Call the actual test function
        return await testFn({ page, baseURL, browserName, context, request });
    });
};

// Add all the standard test methods to our wrapper
masTestWrapper.describe = masTest.describe;
masTestWrapper.beforeEach = masTest.beforeEach;
masTestWrapper.afterEach = masTest.afterEach;
masTestWrapper.beforeAll = masTest.beforeAll;
masTestWrapper.afterAll = masTest.afterAll;
masTestWrapper.step = masTest.step;
masTestWrapper.skip = masTest.skip;
masTestWrapper.fixme = masTest.fixme;
masTestWrapper.fail = masTest.fail;
masTestWrapper.slow = masTest.slow;

const miloLibs = process.env.MILO_LIBS || '';

masTest.afterEach(async ({ page }) => {
    // Cleanup only runs for save tests (when clonedCardID is set)
    if (clonedCardID) {
        // Close editor if it's open
        if (editor && (await editor.panel.isVisible())) {
            await editor.closeEditor.click();
            await expect(editor.panel).not.toBeVisible();
        }

        // Delete the cloned card
        if (studio) {
            const cardElement = await studio.getCard(clonedCardID);
            if (await cardElement.isVisible()) {
                await studio.deleteCard(clonedCardID);
                await expect(cardElement).not.toBeVisible();
            }
        }
    }

    // Always save request count last
    GlobalRequestCounter.saveCountToFileSync();
});

// Export the global page objects so test files can access them
export {
    studio,
    editor,
    slice,
    suggested,
    fries,
    trybuywidget,
    promotedplans,
    individuals,
    ost,
    webUtil,
    clonedCardID,
    miloLibs,
};

export { masTestWrapper as test };
export { expect } from '@playwright/test';
