/**
 * MAS Studio OST authoring-mode E2E suite.
 *
 * Drives each authoring mode (single / try-buy / bundle / consult) through the
 * OST UI via the "Authoring mode" picker on the entitlements step, then asserts
 * the correct config panel renders on the offer step:
 *   - single  → placeholder type rows
 *   - tryBuy  → selection list (base + trial slots)
 *   - bundle  → selection list (bundle slots)
 *   - consult → focused offer detail once an offer is picked
 *
 * Requires the dedicated fr_FR OST fragment and a healthy NALA Studio env.
 * Run: npm run nala -- --grep @ost-authoring-modes
 */
import { test, expect, studio, editor, miloLibs, setTestPage } from '../../../libs/mas-test.js';
import OSTPage from '../../ost.page.js';
import OSTSpec, { OST_FR_FRAGMENT } from '../specs/ost_authoring_modes.spec.js';

const { features } = OSTSpec;

const editorUrl = (baseURL, feature, fragmentId) =>
    `${baseURL}${feature.path}${miloLibs}#locale=fr_FR&page=fragment-editor&path=nala&fragmentId=${fragmentId}`;

const openEditor = async (page, baseURL, feature, fragmentId) => {
    const testPage = editorUrl(baseURL, feature, fragmentId);
    setTestPage(testPage);
    await page.goto(testPage);
    await page.waitForLoadState('domcontentloaded');
    await expect(await editor.panel).toBeVisible();
    await expect(await studio.getCard(fragmentId)).toBeVisible();
};

const openOSTFromPrice = async (page) => {
    const ost = new OSTPage(page);
    await editor.prices.scrollIntoViewIfNeeded();
    await editor.prices.locator(editor.regularPrice).dblclick();
    await expect(await ost.popup).toBeVisible();
    return ost;
};

// Lands on the entitlements step (where the authoring-mode picker lives).
const openEditorAndOST = async (page, baseURL, feature, fragmentId = OST_FR_FRAGMENT) => {
    await openEditor(page, baseURL, feature, fragmentId);
    const ost = await openOSTFromPrice(page);
    if (await ost.backButton.isVisible()) {
        await ost.backButton.click();
        await expect(await ost.searchField).toBeVisible();
    }
    return ost;
};

const selectAuthoringMode = async (ost, modeOption) => {
    await expect(await ost.authoringMode).toBeVisible();
    await ost.authoringMode.click();
    await modeOption.click();
};

const advanceToOffer = async (ost, product) => {
    await ost.searchField.fill(product);
    await ost.productCard.filter({ hasText: product }).first().click();
    await expect(await ost.nextButton).toBeEnabled();
    await ost.nextButton.click();
    await expect(await ost.backButton).toBeVisible();
};

test.describe('M@S Studio OST authoring modes test suite', () => {
    // @studio-ost-mode-single - Single Offer mode renders placeholder type rows
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const ost = await openEditorAndOST(page, baseURL, features[0]);

        await test.step('step-1: Single Offer mode is selected and advances to offers', async () => {
            await selectAuthoringMode(ost, ost.authoringModeSingle);
            await advanceToOffer(ost, data.product);
        });

        await test.step('step-2: Selecting an offer reveals the placeholder type rows', async () => {
            await ost.offerCard.first().click();
            await expect(await ost.priceRow).toBeVisible();
            await expect(await ost.priceUse).toBeVisible();
            await expect(await ost.selectionList).toBeHidden();
        });
    });

    // @studio-ost-mode-trybuy - Try/Buy mode renders the base+trial selection list
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const { data } = features[1];
        const ost = await openEditorAndOST(page, baseURL, features[1]);

        await test.step('step-1: Try/Buy mode is selected and advances to offers', async () => {
            await selectAuthoringMode(ost, ost.authoringModeTryBuy);
            await advanceToOffer(ost, data.product);
        });

        await test.step('step-2: Offer step shows the selection list, not placeholder rows', async () => {
            await expect(await ost.selectionList).toBeVisible();
            await expect(await ost.priceRow).toBeHidden();
        });
    });

    // @studio-ost-mode-bundle - Soft Bundle mode renders the bundle selection list
    test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
        const { data } = features[2];
        const ost = await openEditorAndOST(page, baseURL, features[2]);

        await test.step('step-1: Soft Bundle mode is selected and advances to offers', async () => {
            await selectAuthoringMode(ost, ost.authoringModeBundle);
            await advanceToOffer(ost, data.product);
        });

        await test.step('step-2: Offer step shows the selection list, not placeholder rows', async () => {
            await expect(await ost.selectionList).toBeVisible();
            await expect(await ost.priceRow).toBeHidden();
        });
    });

    // @studio-ost-mode-consult - Consult mode renders the focused offer detail
    test(`${features[3].name},${features[3].tags}`, async ({ page, baseURL }) => {
        const { data } = features[3];
        const ost = await openEditorAndOST(page, baseURL, features[3]);

        await test.step('step-1: Consult mode is selected and advances to offers', async () => {
            await selectAuthoringMode(ost, ost.authoringModeConsult);
            await advanceToOffer(ost, data.product);
        });

        await test.step('step-2: The focused offer detail renders (auto-selected via deep-link OSI or manual pick)', async () => {
            // When the OST is opened from a price, the deep-linked OSI
            // auto-selects its offer once offers load (autoSelectByInitialOsi),
            // which immediately swaps consult to the focused single-column view
            // and hides the offer list. Only click a card when no offer was
            // auto-selected.
            await expect(ost.offerDetailFocused.or(ost.offerCard.first())).toBeVisible();
            if (await ost.offerCard.first().isVisible()) {
                await ost.offerCard.first().click();
            }
            await expect(await ost.offerDetailFocused).toBeVisible();
            await expect(await ost.priceRow).toBeHidden();
        });
    });
});
