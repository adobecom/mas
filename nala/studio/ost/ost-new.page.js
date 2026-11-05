// Lit OST (?ost=new) has different locators from the legacy OST.
import { expect } from '@playwright/test';

export default class OSTNewPage {
    constructor(page) {
        this.rootPage = page;
        this.page = page.locator('[data-testid="ost-modal"]');
        this.popup = this.page;

        // Inputs are inside Spectrum components' shadow roots.
        this.searchField = this.page.locator('[data-testid="ost-search-input"] input');
        this.productList = this.page.locator('[data-testid="ost-product-name"]');
        this.productCard = this.page.locator('[data-testid="ost-product-card"]');

        // Filter pickers
        this.planType = this.page.locator('[data-testid="ost-filter-plan-type"]');
        this.planTypeABM = this.page.locator('[data-testid="ost-filter-plan-type"] sp-menu-item[value="YEAR-MONTHLY"]');
        this.offerType = this.page.locator('[data-testid="ost-filter-offer-type"]');
        this.customerSegment = this.page.locator('[data-testid="ost-filter-customer-segment"]');
        this.marketSegment = this.page.locator('[data-testid="ost-filter-market-segment"]');

        // Navigation buttons (two-tab wizard: entitlements → offer).
        this.nextButton = this.page.locator('[data-testid="ost-footer-next-button"]');
        this.backButton = this.page.locator('[data-testid="ost-back-button"]');
        this.cancelButton = this.page.locator('[data-testid="ost-cancel-button"]');
        this.closeButton = this.page.locator('[data-testid="ost-close-button"]');
        this.footerUseButton = this.page.locator('[data-testid="ost-footer-use-button"]');

        // Authoring mode picker (entitlements step) — drives single/tryBuy/bundle/consult.
        this.authoringMode = this.page.locator('[data-testid="ost-authoring-mode"]');
        this.authoringModeSingle = this.page.locator('[data-testid="ost-authoring-mode-single"]');
        this.authoringModeTryBuy = this.page.locator('[data-testid="ost-authoring-mode-tryBuy"]');
        this.authoringModeBundle = this.page.locator('[data-testid="ost-authoring-mode-bundle"]');
        this.authoringModeConsult = this.page.locator('[data-testid="ost-authoring-mode-consult"]');

        // Flow-specific config panels on the offer step (targeted by component tag —
        // Playwright CSS pierces shadow DOM). tryBuy/bundle render the selection
        // list; consult renders the focused offer detail.
        this.selectionList = this.page.locator('ost-selection-list');
        this.bundleSlot = this.selectionList.locator('.selection-slot.filled');
        this.offerDetailFocused = this.page.locator('ost-offer-detail-focused');
        // Offer cards in the offer-step left column (bordered `card` layout).
        this.offerCard = this.page.locator('ost-offer-card[card]');

        // Placeholder type rows. The new (legacy-style) model lists every type
        // as its own always-visible row — there are no chips/tabs to activate.
        // Each row owns its own live preview and "Use" button. The *Tab/*Chip
        // aliases below resolve to the row element so existing specs that assert
        // visibility or click the type still work (clicking a row is harmless).
        const row = (type) => this.page.locator(`[data-testid="ost-placeholder-row-${type}"]`);
        this.priceRow = row('price');
        // Try/Buy renders one labeled row per offer role.
        this.trialPriceRow = row('price-trial');
        this.buyPriceRow = row('price-buy');
        this.trialCheckoutRow = row('checkoutUrl-trial');
        this.buyCheckoutRow = row('checkoutUrl-buy');
        this.opticalRow = row('optical');
        this.annualRow = row('annual');
        this.strikethroughRow = row('strikethrough');
        this.promoStrikethroughRow = row('promo-strikethrough');
        this.discountRow = row('discount');
        this.legalRow = row('legal');
        this.checkoutRow = row('checkoutUrl');

        // Placeholder-panel category tabs (Price / Checkout / Offer Details).
        // The Checkout tab auto-activates when the OST is reopened from a CTA
        // (deep-link type=checkoutUrl); price rows live under the default tab.
        this.priceTab = this.page.locator('[data-testid="ost-tab-price"]');
        this.offerDetailsTab = this.page.locator('[data-testid="ost-tab-details"]');

        // Back-compat aliases. offerTab maps to the price row (clicking a row
        // is harmless); the checkout aliases map to the Checkout tab so legacy
        // "click the checkout tab/chip" flows activate the right tab.
        this.offerTab = this.priceRow;
        this.entitlementsTab = this.page.locator('[data-testid="ost-tab-checkout"]');
        this.checkoutTab = this.entitlementsTab;
        this.priceChip = this.priceRow;
        this.opticalChip = this.opticalRow;
        this.annualChip = this.annualRow;
        this.strikethroughChip = this.strikethroughRow;
        this.legalChip = this.legalRow;
        this.discountChip = this.discountRow;

        // Inline-price spans rendered by mas-commerce-service inside each row's
        // live preview. Playwright's CSS pierces the shadow root automatically.
        // Note: ost-live-preview only stamps data-template for non-price types,
        // so the price preview span carries no data-template.
        const preview = (type) => row(type).locator('[data-testid="ost-preview-container"]');
        this.price = preview('price').locator('span[is="inline-price"]');
        this.priceOptical = preview('optical').locator('span[is="inline-price"][data-template="optical"]');
        this.priceStrikethrough = preview('strikethrough').locator('span[is="inline-price"][data-template="strikethrough"]');
        this.pricePromoStrikethrough = preview('promo-strikethrough').locator(
            'span[is="inline-price"][data-template="promo-strikethrough"]',
        );
        this.priceAnnual = preview('annual').locator('span[is="inline-price"][data-template="annual"]');
        this.legalDisclaimer = preview('legal').locator('span[is="inline-price"][data-template="legal"]');

        // Placeholder option checkboxes (legacy "Disable" group). A box is
        // checked when its option is OFF (disabled); see ost-placeholder-options.
        // The group is collapsed by default — call expandOptions() before
        // asserting/clicking any of these.
        this.optionsToggle = this.page.locator('[data-testid="ost-options-toggle"]');
        this.termCheckbox = this.page.locator('[data-testid="ost-disable-displayRecurrence"]');
        this.unitCheckbox = this.page.locator('[data-testid="ost-disable-displayPerUnit"]');
        this.taxlabelCheckbox = this.page.locator('[data-testid="ost-disable-displayTax"]');
        this.taxInlcusivityCheckbox = this.page.locator('[data-testid="ost-disable-forceTaxExclusive"]');
        this.oldPriceCheckbox = this.page.locator('[data-testid="ost-disable-displayOldPrice"]');

        // Each type row has its own "Use" button (data-testid="ost-use-button").
        const useFor = (type) => row(type).locator('[data-testid="ost-use-button"]');
        this.priceUse = useFor('price');
        this.priceOpticalUse = useFor('optical');
        this.priceStrikethroughUse = useFor('strikethrough');
        this.priceAnnualUse = useFor('annual');
        this.legalDisclaimerUse = useFor('legal');
        this.checkoutLinkUse = useFor('checkoutUrl');

        // Checkout placeholder bits live inside the checkoutUrl row.
        this.checkoutLink = preview('checkoutUrl').locator('a[is="checkout-link"]');
        this.workflowMenu = this.page.locator('[data-testid="ost-workflow-menu"]');
        this.ctaTextMenu = this.page.locator('[data-testid="ost-cta-text-menu"]');

        // Promo override
        // sp-textfield wrapper — target the inner <input> so fill()/toHaveValue work.
        this.promoField = this.page.locator('[data-testid="ost-promo-override-input"] input');
        this.promoLabel = this.page.locator('[data-testid="ost-promo-label"]');
        this.cancelPromo = this.page.locator('[data-testid="ost-promo-clear"]');
    }

    // Preserve carried selections; clicking a filled bundle offer toggles it off.
    async selectFirstOffer() {
        const offer = this.offerCard.first();
        await expect(offer).toBeVisible();
        const offerId = await offer.evaluate((card) => card.offer.offer_id);
        // Switching modes carries the deep-linked offer into a filled slot.
        // Clicking it again would asynchronously remove it from the bundle.
        if (await this.bundleSlot.locator('.slot-osi').filter({ hasText: offerId }).count()) return;
        await offer.click();
        await expect.poll(() => offer.evaluate((card) => card.resolving)).toBe(false);
    }

    // Advance using the currently selected product.
    async advanceToOfferStep() {
        await this.nextButton.click();
        await this.selectFirstOffer();
    }

    // Add a second product without clearing the first bundle slot.
    async addBundleOfferFromSearch(productName) {
        await this.backButton.click();
        await this.searchField.fill(productName);
        const product = this.productCard.filter({ hasText: productName }).first();
        await product.click();
        await expect(product).toHaveAttribute('selected', '');
        await this.nextButton.click();
        // The previous product's offer remains visible while new offers load.
        const offer = this.offerCard.filter({ hasText: productName }).first();
        await offer.click();
        await expect.poll(() => offer.evaluate((card) => card.resolving)).toBe(false);
    }

    // The "Options" (Disable) group is collapsed by default; expand it once so
    // the term/unit/tax/old-price checkboxes are visible and clickable.
    async expandOptions() {
        if (await this.termCheckbox.isVisible().catch(() => false)) return;
        await this.optionsToggle.click();
        await this.termCheckbox.first().waitFor({ state: 'visible', timeout: 5000 });
    }

    // Placeholder resolution must finish before reading the legal text.
    async waitForLegalResolved() {
        const legal = this.legalDisclaimer.first();
        await legal.waitFor({ state: 'visible', timeout: 30000 });
        await legal.and(this.page.locator('.placeholder-resolved')).first().waitFor({ state: 'visible', timeout: 30000 });
    }
}
