/**
 * MAS Studio OST authoring-mode E2E suite.
 *
 * Drives each authoring mode (single / try-buy / bundle) through the OST UI
 * via the "Authoring mode" picker on the entitlements step, then asserts the
 * correct config panel renders on the offer step:
 *   - single → placeholder type rows
 *   - tryBuy → selection slots + per-offer (Trial/Buy) placeholder rows
 *   - bundle → selection slots + joined-OSI placeholder rows
 * Consult is chat-only (deep-link) and must not appear in the picker.
 *
 * Requires the dedicated fr_FR OST fragment and a healthy NALA Studio env.
 * Run: npm run nala -- --grep @ost-authoring-modes
 */
import { test, expect, studio, editor, miloLibs, setTestPage } from '../../../libs/mas-test.js';
import OSTNewPage from '../ost-new.page.js';
import OSTSpec, { OST_FR_FRAGMENT } from '../specs/ost_authoring_modes.spec.js';

const { features } = OSTSpec;

const editorUrl = (baseURL, feature, fragmentId) => {
    const libs = miloLibs ? `&${miloLibs.replace(/^[?&]/, '')}` : '';
    return `${baseURL}${feature.path}?ost=new${libs}#locale=fr_FR&page=fragment-editor&path=nala&fragmentId=${fragmentId}`;
};

const openEditor = async (page, baseURL, feature, fragmentId) => {
    const testPage = editorUrl(baseURL, feature, fragmentId);
    setTestPage(testPage);
    await page.goto(testPage);
    await page.waitForLoadState('domcontentloaded');
    await expect(await editor.panel).toBeVisible();
    await expect(await studio.getCard(fragmentId)).toBeVisible();
};

const openOSTFromPrice = async (page) => {
    const ost = new OSTNewPage(page);
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

// Use the deep-linked product (Creative Cloud Pro) that openEditorAndOST leaves
// selected — searching a different product fights the persisted deep-link
// selection and can land on a product with no offers.
const advanceToOffer = async (ost) => {
    await expect(await ost.nextButton).toBeEnabled();
    await ost.nextButton.click();
    await expect(await ost.backButton).toBeVisible();
};

test.describe('M@S Studio OST authoring modes test suite', () => {
    // @studio-ost-mode-single - Single Offer mode renders placeholder type rows
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const ost = await openEditorAndOST(page, baseURL, features[0]);

        await test.step('step-1: Single Offer mode is selected and advances to offers', async () => {
            await selectAuthoringMode(ost, ost.authoringModeSingle);
            await advanceToOffer(ost);
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
        const ost = await openEditorAndOST(page, baseURL, features[1]);

        await test.step('step-1: Try/Buy mode is selected and advances to offers', async () => {
            await selectAuthoringMode(ost, ost.authoringModeTryBuy);
            await advanceToOffer(ost);
        });

        await test.step('step-2: Offer step shows the selection slots above the panel', async () => {
            await expect(await ost.selectionList).toBeVisible();
        });

        await test.step('step-3: Filling a slot reveals the per-offer placeholder rows', async () => {
            await ost.offerCard.first().click();
            await expect(await ost.buyPriceRow).toBeVisible();
            await expect(await ost.buyPriceRow.locator('[data-testid="ost-use-button"]')).toBeVisible();
        });
    });

    // @studio-ost-mode-bundle - Soft Bundle mode renders the bundle selection list
    test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
        const ost = await openEditorAndOST(page, baseURL, features[2]);

        await test.step('step-1: Soft Bundle mode is selected and advances to offers', async () => {
            await selectAuthoringMode(ost, ost.authoringModeBundle);
            await advanceToOffer(ost);
        });

        await test.step('step-2: Offer step shows the selection slots above the panel', async () => {
            await expect(await ost.selectionList).toBeVisible();
        });

        await test.step('step-3: Adding an offer reveals the joined-OSI placeholder rows', async () => {
            await ost.offerCard.first().click();
            await expect(await ost.priceRow).toBeVisible();
        });
    });

    // @studio-ost-mode-bundle-use - Soft Bundle "Use" inserts a joined-OSI price without crashing
    test(`${features[4].name},${features[4].tags}`, async ({ page, baseURL }) => {
        const pageErrors = [];
        page.on('pageerror', (err) => pageErrors.push(err.message));

        const ost = await openEditorAndOST(page, baseURL, features[4]);

        await test.step('step-1: Soft Bundle mode advances to offers', async () => {
            await selectAuthoringMode(ost, ost.authoringModeBundle);
            await advanceToOffer(ost);
        });

        await test.step('step-2: Select two offers to form a bundle', async () => {
            await ost.offerCard.nth(0).click();
            await ost.offerCard.nth(1).click();
            await expect(await ost.footerUseButton).toBeEnabled();
        });

        await test.step('step-3: Use inserts a comma-joined-OSI price into the field', async () => {
            await ost.footerUseButton.click();
            await expect(await ost.popup).not.toBeVisible();
            const bundlePrice = editor.prices.locator('span[is="inline-price"]').first();
            await expect(bundlePrice).toBeVisible();
            await expect(bundlePrice).toHaveAttribute('data-wcs-osi', /,/);
        });

        await test.step('step-4: No uncaught page error was thrown during Use', async () => {
            const marketSegmentCrash = pageErrors.find((m) => /reading '0'|market_segments/.test(m));
            expect(marketSegmentCrash, `Unexpected page error: ${marketSegmentCrash}`).toBeUndefined();
        });
    });

    // @studio-ost-mode-no-consult - Consult must not be offered in the authoring-mode picker
    test(`${features[3].name},${features[3].tags}`, async ({ page, baseURL }) => {
        const ost = await openEditorAndOST(page, baseURL, features[3]);

        await test.step('step-1: The authoring-mode picker offers no Consult option', async () => {
            await expect(await ost.authoringMode).toBeVisible();
            await ost.authoringMode.click();
            await expect(await ost.authoringModeSingle).toBeVisible();
            await expect(await ost.authoringModeConsult).toBeHidden();
        });
    });
});
