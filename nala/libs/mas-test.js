import { test as base } from '@playwright/test';
import GlobalRequestCounter from './global-request-counter.js';
import { setCurrentTestName } from '../utils/fragment-tracker.js';
import StudioPage from '../studio/studio.page.js';
import EditorPage from '../studio/editor.page.js';
import CCDSlicePage from '../studio/ccd/slice/slice.page.js';
import CCDSuggestedPage from '../studio/ccd/suggested/suggested.page.js';
import COMFries from '../studio/commerce/fries/fries.page.js';
import AHTryBuyWidgetPage from '../studio/ahome/try-buy-widget/try-buy-widget.page.js';
import AHPromotedPlansPage from '../studio/ahome/promoted-plans/promoted-plans.page.js';
import ACOMPlansCardPage from '../studio/acom/plans/plans.page.js';
import EXPRESSFullPricingPage from '../studio/express/full-pricing/full-pricing.page.js';
import VersionPage from '../studio/versions/versions.page.js';
import PlaceholdersPage from '../studio/placeholders/placeholders.page.js';
import TranslationsPage from '../studio/translations/translations.page.js';
import TranslationEditorPage from '../studio/translations/translation-editor.page.js';
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
let plans;
let fullPricingExpress;
let placeholders;
let versions;
let translations;
let translationEditor;
let ost;
let webUtil;
let clonedCardID = '';
let currentTestPage = '';

const miloLibs = process.env.MILO_LIBS || '';
const masIOUrl = process.env.MAS_IO_URL || '';

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

        // Set current test name only (no tags) so fragment title can include it (createFragment / cloneCard)
        const nameOnly = testInfo.title.includes(',') ? testInfo.title.split(',')[0].trim() : testInfo.title;
        setCurrentTestName(nameOnly);

        // Create fresh page objects for every test
        studio = new StudioPage(page);
        editor = new EditorPage(page);
        slice = new CCDSlicePage(page);
        suggested = new CCDSuggestedPage(page);
        fries = new COMFries(page);
        trybuywidget = new AHTryBuyWidgetPage(page);
        promotedplans = new AHPromotedPlansPage(page);
        plans = new ACOMPlansCardPage(page);
        fullPricingExpress = new EXPRESSFullPricingPage(page);
        ost = new OSTPage(page);
        translationEditor = new TranslationEditorPage(page);
        translations = new TranslationsPage(page);
        webUtil = new WebUtil(page);
        versions = new VersionPage(page);
        placeholders = new PlaceholdersPage(page);

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
    plans,
    fullPricingExpress,
    ost,
    translations,
    translationEditor,
    placeholders,
    webUtil,
    versions,
    setClonedCardID,
    getClonedCardID,
    setTestPage,
    miloLibs,
    masIOUrl,
};

export { masTest as test };
export { expect } from '@playwright/test';
