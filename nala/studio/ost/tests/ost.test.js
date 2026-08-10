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
import OSTNewPage from '../ost-new.page.js';
import OSTSpec, { OST_FR_FRAGMENT } from '../specs/ost.spec.js';

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

    // @studio-ost-select-product-shows-offers - A selected product advances to the offer step
    test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
        const ost = await openEditorAndOST(page, baseURL, features[2]);

        await test.step('step-1: The selected (deep-linked) product enables Next and advances', async () => {
            await expect(await ost.nextButton).toBeEnabled();
            await ost.nextButton.click();
            await expect(await ost.backButton).toBeVisible();
            await expect(await ost.offerCard.first()).toBeVisible();
        });
    });

    // @studio-ost-select-offer-configure-placeholder - Pick an offer and activate the price chip
    test(`${features[3].name},${features[3].tags}`, async ({ page, baseURL }) => {
        const { data } = features[3];
        const ost = await openEditorAndOST(page, baseURL, features[3]);

        await test.step('step-1: Advance to the offer step', async () => {
            await ost.nextButton.click();
            await expect(await ost.backButton).toBeVisible();
        });

        await test.step('step-2: Select an offer and confirm the price row appears', async () => {
            await expect(await ost.offerCard.first()).toBeVisible();
            await ost.selectFirstOffer();
            await expect(await ost.priceUse).toBeVisible();
        });
    });

    // @studio-ost-price-placeholder-preview - Live preview renders a resolved price
    test(`${features[4].name},${features[4].tags}`, async ({ page, baseURL }) => {
        const { data } = features[4];
        const ost = await openEditorAndOST(page, baseURL, features[4]);

        await test.step('step-1: Advance to the offer step with the deep-linked product', async () => {
            await ost.advanceToOfferStep();
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
            await ost.advanceToOfferStep();
        });

        await test.step('step-2: Optical template preview renders a price', async () => {
            await expect(await ost.priceOptical).toContainText(data.expectedPrice);
        });

        await test.step('step-3: Annual template preview renders a price', async () => {
            await expect(await ost.priceAnnual).toContainText(data.expectedPrice);
        });
    });

    // @studio-ost-strikethrough-price-preview - Strikethrough preview has no leaked formatting tokens
    test(`${features[6].name},${features[6].tags}`, async ({ page, baseURL }) => {
        const { data } = features[6];
        const ost = await openEditorAndOST(page, baseURL, features[6]);

        await test.step('step-1: Advance to the offer step', async () => {
            await ost.advanceToOfferStep();
        });

        await test.step('step-2: Strikethrough preview renders without leaked tokens', async () => {
            await expect(await ost.priceStrikethrough).toBeVisible();
            for (const leak of data.forbiddenLeaks) {
                await expect(await ost.priceStrikethrough).not.toContainText(leak);
            }
        });
    });

    // @studio-ost-promo-strikethrough-price-preview - Promo override propagates into the resolved price
    test(`${features[7].name},${features[7].tags}`, async ({ page, baseURL }) => {
        const { data } = features[7];
        await openEditor(page, baseURL, features[7], data.fragmentId);
        const ost = await openOSTFromPrice(page);

        await test.step('step-1: Promo override applies the promotion code to the preview', async () => {
            await expect(await ost.promoField).toBeVisible();
            await ost.promoField.fill(data.promoCode);
            await expect(await ost.promoLabel).toContainText(data.promoCode);
            await expect(await ost.price).toHaveAttribute('data-promotion-code', data.promoCode);
            await expect(await ost.price).toHaveAttribute('data-display-old-price', 'true');
        });
    });

    // @studio-ost-discount-percentage - Promotional offer auto-calculates a discount percentage
    test(`${features[8].name},${features[8].tags}`, async ({ page, baseURL }) => {
        const { data } = features[8];
        const ost = await openEditorAndOST(page, baseURL, features[8]);

        await test.step('step-1: Promotional offer shows an auto discount', async () => {
            await ost.advanceToOfferStep();
            await expect(await ost.promoField).toBeVisible();
        });
    });

    // @studio-ost-legal-disclaimer-preview - Legal template renders a localized disclaimer
    test(`${features[9].name},${features[9].tags}`, async ({ page, baseURL }) => {
        const { data } = features[9];
        await openEditor(page, baseURL, features[9], data.fragmentId);
        const ost = await openOSTFromPrice(page);

        await test.step('step-1: Legal template resolves in the preview', async () => {
            await ost.legalChip.click();
            await expect(await ost.legalDisclaimer).toHaveClass(/placeholder-resolved/);
        });
    });

    // @studio-ost-checkout-url-placeholder - Checkout URL chip exposes a checkout link
    test(`${features[10].name},${features[10].tags}`, async ({ page, baseURL }) => {
        const { data } = features[10];
        const ost = await openEditorAndOST(page, baseURL, features[10]);

        await test.step('step-1: Advance to the offer step', async () => {
            await ost.advanceToOfferStep();
        });

        await test.step('step-2: Checkout tab exposes the checkout link and menus', async () => {
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
            await ost.advanceToOfferStep();
            await expect(await ost.price).toBeVisible();
        });

        // The fixture's price shows recurrence + per-unit + tax by default, so
        // each "Disable" toggle REMOVES its token. Assert present → toggle →
        // gone, which exercises the same mutation without assuming a start state.
        // Recurrence renders as /mois or /an depending on which offer (ABM vs
        // PUF) lands first — match either so offer ordering doesn't flake CI.
        await test.step('step-2: Recurrence toggle controls the recurrence token', async () => {
            await ost.expandOptions();
            await expect(await ost.termCheckbox).toBeVisible();
            await expect(await ost.price).toContainText(/\/(mois|an)/);
            await ost.termCheckbox.click();
            await expect(await ost.price).not.toContainText(/\/(mois|an)/);
        });

        await test.step('step-3: Per-unit toggle controls the per-unit token', async () => {
            await expect(await ost.unitCheckbox).toBeVisible();
            await expect(await ost.price).toContainText(data.toggles.displayPerUnit);
            await ost.unitCheckbox.click();
            await expect(await ost.price).not.toContainText(data.toggles.displayPerUnit);
        });

        await test.step('step-4: Tax toggle controls the tax token', async () => {
            await expect(await ost.taxlabelCheckbox).toBeVisible();
            await expect(await ost.price).toContainText(data.toggles.displayTax);
            await ost.taxlabelCheckbox.click();
            await expect(await ost.price).not.toContainText(data.toggles.displayTax);
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
            await ost.advanceToOfferStep();
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
    const ost = await openOSTFromPrice(page);
    if (await ost.backButton.isVisible()) {
        await ost.backButton.click();
        await expect(await ost.searchField).toBeVisible();
    }
    return ost;
}
