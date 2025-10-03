import { test as base, expect } from '@playwright/test';
import GlobalRequestCounter from './global-request-counter.js';
import StudioPage from '../studio/studio.page.js';
import EditorPage from '../studio/editor.page.js';
import CCDSlicePage from '../studio/ccd/slice/slice.page.js';
import CCDSuggestedPage from '../studio/ccd/suggested/suggested.page.js';
import COMFries from '../studio/commerce/fries/fries.page.js';
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

const miloLibs = process.env.MILO_LIBS || '';

/**
 * Extended Playwright test that automatically handles common MAS test operations
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
        fries = new COMFries(page);
        trybuywidget = new AHTryBuyWidgetPage(page);
        promotedplans = new AHPromotedPlansPage(page);
        individuals = new ACOMPlansIndividualsPage(page);
        ost = new OSTPage(page);
        webUtil = new WebUtil(page);

        // Initialize counter
        await GlobalRequestCounter.init(page);

        try {
            // Call the actual test function
            return await testFn({ page, baseURL, browserName, context, request });
        } finally {
            // Cleanup only runs for save tests (when clonedCardID is set)
            if (clonedCardID) {
                await studio.cleanupAfterTest(editor, clonedCardID, baseURL, miloLibs);
            }

            // Always save request count last
            GlobalRequestCounter.saveCountToFileSync();
        }
    });
};

// Add all the standard test methods to the wrapper
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

// Function to set clonedCardID from tests
function setClonedCardID(id) {
    clonedCardID = id;
}

// Function to get clonedCardID from tests
function getClonedCardID() {
    return clonedCardID;
}

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
    setClonedCardID,
    getClonedCardID,
    miloLibs,
};

export { masTestWrapper as test };
export { expect } from '@playwright/test';
