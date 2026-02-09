import { test as base } from '@playwright/test';
import GlobalRequestCounter from './global-request-counter.js';
import StudioPage from '../studio/studio.page.js';
import EditorPage from '../studio/editor.page.js';
import CCDSlicePage from '../studio/ccd/slice/slice.page.js';
import CCDSuggestedPage from '../studio/ccd/suggested/suggested.page.js';
import COMFries from '../studio/commerce/fries/fries.page.js';
import AHTryBuyWidgetPage from '../studio/ahome/try-buy-widget/try-buy-widget.page.js';
import AHPromotedPlansPage from '../studio/ahome/promoted-plans/promoted-plans.page.js';
import ACOMPlansIndividualsPage from '../studio/acom/plans/individuals/individuals.page.js';
import EXPRESSFullPricingPage from '../studio/express/full-pricing/full-pricing.page.js';
import VersionPage from '../studio/versions/versions.page.js';
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
let fullPricingExpress;
let ost;
let webUtil;
let versionPage;
let clonedCardID = '';
let currentTestPage = '';

const miloLibs = process.env.MILO_LIBS || '';

/**
 * Extended Playwright test that automatically handles common MAS test operations
 */
const masTest = base.extend({
    page: async ({ page, browserName }, use, testInfo) => {
        // Multiply default timeout by 3 (same as test.slow())
        const currentTimeout = testInfo.timeout;
        testInfo.setTimeout(currentTimeout * 3);

        // Set HTTP headers for chromium
        if (browserName === 'chromium') {
            await page.setExtraHTTPHeaders({
                'sec-ch-ua': '"Chromium";v="123", "Not:A-Brand";v="8"',
            });
        }

        // Reset clonedCardID for each test
        clonedCardID = '';
        currentTestPage = '';

        // Create fresh page objects for every test
        studio = new StudioPage(page);
        editor = new EditorPage(page);
        slice = new CCDSlicePage(page);
        suggested = new CCDSuggestedPage(page);
        fries = new COMFries(page);
        trybuywidget = new AHTryBuyWidgetPage(page);
        promotedplans = new AHPromotedPlansPage(page);
        individuals = new ACOMPlansIndividualsPage(page);
        fullPricingExpress = new EXPRESSFullPricingPage(page);
        ost = new OSTPage(page);
        webUtil = new WebUtil(page);
        versionPage = new VersionPage(page);
        // Initialize counter
        await GlobalRequestCounter.init(page);

        try {
            await use(page);
        } finally {
            // Store test page in testInfo for base reporter if test failed
            if (testInfo.status === 'failed' && currentTestPage) {
                testInfo.annotations.push({
                    type: 'test-page-url',
                    description: currentTestPage,
                });
            }

            // Always save request count
            GlobalRequestCounter.saveCountToFileSync();
        }
    },
});

// Function to set clonedCardID from tests
function setClonedCardID(id) {
    clonedCardID = id;
}

// Function to get clonedCardID from tests
function getClonedCardID() {
    return clonedCardID;
}

// Function to set current test page URL
function setTestPage(url) {
    currentTestPage = url;
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
    fullPricingExpress,
    ost,
    webUtil,
    versionPage,
    setClonedCardID,
    getClonedCardID,
    setTestPage,
    miloLibs,
};

export { masTest as test };
export { expect } from '@playwright/test';
