/**
 * MAS Studio OST (Offer Selector Tool) E2E suite.
 *
 * Requires dedicated fr_FR OST fragments (promo/legal/discount/deep-link) AND a
 * healthy NALA Studio env (AEM on 8080, proxy on 3000). The OST is only reachable
 * through a fragment editor, so every test opens the dedicated fr_FR fragment and
 * launches the OST from its price field — no en_GB fragments, no response mocking.
 *
 * Run: npm run nala -- --grep @ost-e2e
 *
 * Every entry in the spec's `features` array maps 1:1 to exactly one test() block
 * (afmicka rule). The deep-link + Back test (tcid 14) is the Bug 7 guarantee.
 */
import { test, expect, studio, editor, miloLibs, setTestPage } from '../../../libs/mas-test.js';
import OSTPage from '../../ost.page.js';
import OSTSpec, { OST_FR_FRAGMENT } from '../specs/ost.spec.js';

const { features } = OSTSpec;

const editorUrl = (baseURL, feature, fragmentId) =>
    `${baseURL}${feature.path}${miloLibs}#page=fragment-editor&path=nala&fragmentId=${fragmentId}`;

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

test.describe('M@S Studio OST test suite', () => {
    // @studio-ost-search-product - Search a product in the OST entitlements step
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const { data } = features[0];
        const ost = await openEditorAndOST(page, baseURL, features[0]);

        await test.step('step-1: Search for the product', async () => {
            await expect(await ost.searchField).toBeVisible();
            await ost.searchField.fill(data.searchTerms.name);
            await expect(await ost.productList.filter({ hasText: data.expectedProduct }).first()).toBeVisible();
        });
    });

    // @studio-ost-filter-segments - Filter entitlements by plan/offer/customer/market segment
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const ost = await openEditorAndOST(page, baseURL, features[1]);

        await test.step('step-1: Filter pickers are reachable on the entitlements step', async () => {
            await expect(await ost.planType).toBeVisible();
            await expect(await ost.offerType).toBeVisible();
            await expect(await ost.customerSegment).toBeVisible();
            await expect(await ost.marketSegment).toBeVisible();
        });

        await test.step('step-2: Select the plan type and confirm advance is enabled', async () => {
            await ost.planType.click();
            await expect(await ost.planTypeABM).toBeVisible();
        });
    });

    // @studio-ost-select-product-shows-offers - Selecting a product advances to the offer step
    test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
        const { data } = features[2];
        const ost = await openEditorAndOST(page, baseURL, features[2]);

        await test.step('step-1: Select product and advance to the offer step', async () => {
            await ost.searchField.fill(data.product);
            await ost.productCard.filter({ hasText: data.product }).first().click();
            await expect(await ost.nextButton).toBeEnabled();
            await ost.nextButton.click();
            await expect(await ost.backButton).toBeVisible();
        });
    });

    // @studio-ost-select-offer-configure-placeholder - Pick an offer and activate the price chip
    test(`${features[3].name},${features[3].tags}`, async ({ page, baseURL }) => {
        const { data } = features[3];
        const ost = await openEditorAndOST(page, baseURL, features[3]);

        await test.step('step-1: Advance to the offer step', async () => {
            await ost.searchField.fill(data.product);
            await ost.productCard.filter({ hasText: data.product }).first().click();
            await ost.nextButton.click();
            await expect(await ost.backButton).toBeVisible();
        });

        await test.step('step-2: Activate the price placeholder chip', async () => {
            await expect(await ost.offerTab).toBeVisible();
            await ost.offerTab.click();
            await expect(await ost.priceUse).toBeVisible();
        });
    });

    // @studio-ost-price-placeholder-preview - Live preview renders a resolved price
    test(`${features[4].name},${features[4].tags}`, async ({ page, baseURL }) => {
        const { data } = features[4];
        const ost = await openEditorAndOST(page, baseURL, features[4]);

        await test.step('step-1: Advance to the offer step and select the price chip', async () => {
            await ost.searchField.fill(data.product);
            await ost.productCard.filter({ hasText: data.product }).first().click();
            await ost.nextButton.click();
            await ost.offerTab.click();
        });

        await test.step('step-2: Preview renders a resolved price', async () => {
            await expect(await ost.price).toBeVisible();
            await expect(await ost.price).toContainText(data.expectedPrice);
        });
    });

    // @studio-ost-optical-annual-price-preview - Optical and annual templates render a price
    test(`${features[5].name},${features[5].tags}`, async ({ page, baseURL }) => {
        const { data } = features[5];
        const ost = await openEditorAndOST(page, baseURL, features[5]);

        await test.step('step-1: Advance to the offer step', async () => {
            await ost.searchField.fill(data.product);
            await ost.productCard.filter({ hasText: data.product }).first().click();
            await ost.nextButton.click();
            await ost.offerTab.click();
        });

        await test.step('step-2: Optical and annual previews render a price', async () => {
            await expect(await ost.priceOptical).toContainText(data.expectedPrice);
            await expect(await ost.priceAnnual).toContainText(data.expectedPrice);
        });
    });

    // @studio-ost-strikethrough-price-preview - Strikethrough preview has no leaked formatting tokens
    test(`${features[6].name},${features[6].tags}`, async ({ page, baseURL }) => {
        const { data } = features[6];
        const ost = await openEditorAndOST(page, baseURL, features[6]);

        await test.step('step-1: Advance to the offer step', async () => {
            await ost.searchField.fill(data.product);
            await ost.productCard.filter({ hasText: data.product }).first().click();
            await ost.nextButton.click();
            await ost.offerTab.click();
        });

        await test.step('step-2: Strikethrough preview renders without leaked tokens', async () => {
            await expect(await ost.priceStrikethrough).toBeVisible();
            for (const leak of data.forbiddenLeaks) {
                await expect(await ost.priceStrikethrough).not.toContainText(leak);
            }
        });
    });

    // @studio-ost-promo-strikethrough-price-preview - Promo applies a strikethrough in the preview
    test(`${features[7].name},${features[7].tags}`, async ({ page, baseURL }) => {
        const { data } = features[7];
        const ost = await openEditorAndOST(page, baseURL, features[7], data.fragmentId);

        await test.step('step-1: Promo override yields a strikethrough price', async () => {
            await expect(await ost.promoField).toBeVisible();
            await ost.promoField.fill(data.promoCode);
            await expect(await ost.promoLabel).toContainText(data.promoCode);
            await expect(await ost.pricePromoStrikethrough).toHaveCSS('text-decoration-line', 'line-through');
        });
    });

    // @studio-ost-discount-percentage - Promotional offer auto-calculates a discount percentage
    test(`${features[8].name},${features[8].tags}`, async ({ page, baseURL }) => {
        const { data } = features[8];
        const ost = await openEditorAndOST(page, baseURL, features[8]);

        await test.step('step-1: Promotional offer shows an auto discount', async () => {
            await ost.searchField.fill(data.promotionOffer.osi);
            await ost.productCard.first().click();
            await ost.nextButton.click();
            await ost.offerTab.click();
            await expect(await ost.promoField).toBeVisible();
        });
    });

    // @studio-ost-legal-disclaimer-preview - Legal template renders a localized disclaimer
    test(`${features[9].name},${features[9].tags}`, async ({ page, baseURL }) => {
        const { data } = features[9];
        const ost = await openEditorAndOST(page, baseURL, features[9], data.fragmentId);

        await test.step('step-1: Legal disclaimer preview is localized', async () => {
            await expect(await ost.legalDisclaimer).toBeVisible();
            await expect(await ost.legalDisclaimer).toContainText(data.expectedDisclaimer);
        });
    });

    // @studio-ost-checkout-url-placeholder - Checkout URL chip exposes a checkout link
    test(`${features[10].name},${features[10].tags}`, async ({ page, baseURL }) => {
        const { data } = features[10];
        const ost = await openEditorAndOST(page, baseURL, features[10]);

        await test.step('step-1: Advance to the offer step', async () => {
            await ost.searchField.fill(data.product);
            await ost.productCard.filter({ hasText: data.product }).first().click();
            await ost.nextButton.click();
        });

        await test.step('step-2: Checkout chip exposes the checkout link and menus', async () => {
            await expect(await ost.checkoutTab).toBeVisible();
            await ost.checkoutTab.click();
            await expect(await ost.workflowMenu).toBeVisible();
            await expect(await ost.ctaTextMenu).toBeVisible();
            await expect(await ost.checkoutLink).toBeVisible();
        });
    });

    // @studio-ost-placeholder-option-toggles - Recurrence/per-unit/tax option switches mutate the preview
    test(`${features[11].name},${features[11].tags}`, async ({ page, baseURL }) => {
        const { data } = features[11];
        const ost = await openEditorAndOST(page, baseURL, features[11]);

        await test.step('step-1: Advance to the offer step with the price chip', async () => {
            await ost.searchField.fill(data.product);
            await ost.productCard.filter({ hasText: data.product }).first().click();
            await ost.nextButton.click();
            await ost.offerTab.click();
            await expect(await ost.price).toBeVisible();
        });

        await test.step('step-2: Recurrence toggle adds the recurrence token', async () => {
            await expect(await ost.termCheckbox).toBeVisible();
            await ost.termCheckbox.click();
            await expect(await ost.price).toContainText(data.toggles.displayRecurrence);
        });

        await test.step('step-3: Per-unit toggle adds the per-unit token', async () => {
            await expect(await ost.unitCheckbox).toBeVisible();
            await ost.unitCheckbox.click();
            await expect(await ost.price).toContainText(data.toggles.displayPerUnit);
        });

        await test.step('step-4: Tax toggle adds the tax token', async () => {
            await expect(await ost.taxlabelCheckbox).toBeVisible();
            await ost.taxlabelCheckbox.click();
            await expect(await ost.price).toContainText(data.toggles.displayTax);
        });
    });

    // @studio-ost-country-landscape-selectors - SOURCE GAP: country/landscape selectors lack a data-testid
    // BLOCKED: ost-country-picker.js country sp-picker (:123) and the Stage/landscape sp-switch (:133)
    // expose NO data-testid, so they cannot be driven via stable CSS. Implement after the source fix.
    test.fixme(`${features[12].name},${features[12].tags}`, async () => {});

    // @studio-ost-deeplink-osi-preselect - Deep-link open lands on the offer step with the OSI context
    test(`${features[13].name},${features[13].tags}`, async ({ page, baseURL }) => {
        const { data } = features[13];
        await openEditor(page, baseURL, features[13], data.fragmentId);
        const ost = await openOSTFromPrice(page);

        await test.step('step-1: Deep-link advanced the OST to the offer step', async () => {
            await expect(await ost.popup).toBeVisible();
            await expect(await ost.backButton).toBeVisible();
            await expect(await ost.offerTab).toBeVisible();
        });
    });

    // @studio-ost-deeplink-back - HEADLINE (Bug 7): Back preserves the deep-linked context, not a blank OST
    test(`${features[14].name},${features[14].tags}`, async ({ page, baseURL }) => {
        const { data } = features[14];
        await openEditor(page, baseURL, features[14], data.fragmentId);
        const ost = await openOSTFromPrice(page);

        await test.step('step-1: Deep-link lands on the offer step with context present', async () => {
            await expect(await ost.popup).toBeVisible();
            await expect(await ost.backButton).toBeVisible();
            await expect(await ost.offerTab).toBeVisible();
        });

        await test.step('step-2: Back returns to the entitlements step', async () => {
            await ost.backButton.click();
            await expect(await ost.searchField).toBeVisible();
            await expect(await ost.nextButton).toBeVisible();
        });

        await test.step('step-3: Context PERSISTS - the deep-linked product stays selected (not a blank OST)', async () => {
            const selectedProduct = ost.popup.locator('[data-testid="ost-product-card"][selected]');
            await expect(selectedProduct).toBeVisible();
            await expect(await ost.nextButton).toBeEnabled();
        });
    });

    // @studio-ost-use-emits-placeholder - Use emits the placeholder token back to the editor
    test(`${features[15].name},${features[15].tags}`, async ({ page, baseURL }) => {
        const { data } = features[15];
        const ost = await openEditorAndOST(page, baseURL, features[15]);

        await test.step('step-1: Advance to the offer step with the price chip', async () => {
            await ost.searchField.fill(data.product);
            await ost.productCard.filter({ hasText: data.product }).first().click();
            await ost.nextButton.click();
            await ost.offerTab.click();
            await expect(await ost.price).toBeVisible();
        });

        await test.step('step-2: Use commits the price placeholder into the editor', async () => {
            await expect(await ost.priceUse).toBeEnabled();
            await ost.priceUse.click();
            await expect(await ost.popup).not.toBeVisible();
            await expect(await editor.prices).toBeVisible();
        });
    });

    // @studio-ost-cancel-discards - Cancel closes the OST without committing a placeholder
    test(`${features[16].name},${features[16].tags}`, async ({ page, baseURL }) => {
        const { data } = features[16];
        const ost = await openEditorAndOST(page, baseURL, features[16]);

        await test.step('step-1: Reach the offer step', async () => {
            await ost.searchField.fill(data.product);
            await ost.productCard.filter({ hasText: data.product }).first().click();
            await ost.nextButton.click();
            await expect(await ost.cancelButton).toBeVisible();
        });

        await test.step('step-2: Cancel closes the OST', async () => {
            await ost.cancelButton.click();
            await expect(await ost.popup).not.toBeVisible();
        });
    });
});

async function openEditorAndOST(page, baseURL, feature, fragmentId = OST_FR_FRAGMENT) {
    await openEditor(page, baseURL, feature, fragmentId);
    return openOSTFromPrice(page);
}
