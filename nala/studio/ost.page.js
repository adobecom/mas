export default class OSTPage {
    constructor(page) {
        // The OST is a Lit web component (ost-app) with shadow DOM.
        // Playwright pierces shadow DOM with CSS selectors but NOT with XPath,
        // so every selector below is CSS-based and targets a stable data-testid.
        this.rootPage = page;
        this.page = page.locator('[data-testid="ost-modal"]');
        this.popup = this.page;

        // Search + product list
        this.searchField = this.page.locator('[data-testid="ost-search-input"]');
        this.productList = this.page.locator('[data-testid="ost-product-name"]');

        // Filter pickers
        this.planType = this.page.locator('[data-testid="ost-filter-plan-type"]');
        this.planTypeABM = this.page.locator('[data-testid="ost-filter-plan-type"] sp-menu-item[value="YEAR-MONTHLY"]');
        this.offerType = this.page.locator('[data-testid="ost-filter-offer-type"]');
        this.customerSegment = this.page.locator('[data-testid="ost-filter-customer-segment"]');
        this.marketSegment = this.page.locator('[data-testid="ost-filter-market-segment"]');

        // Navigation buttons (two-tab wizard: entitlements → offer).
        this.nextButton = this.page.locator('[data-testid="ost-footer-next-button"]');
        this.backButton = this.page.locator('[data-testid="ost-back-button"]');

        // Placeholder type chips (new model: chips replace the old offer/entitlements tabs).
        this.offerTab = this.page.locator('[data-testid="ost-placeholder-chip-price"]');
        this.entitlementsTab = this.page.locator('[data-testid="ost-placeholder-chip-checkoutUrl"]');
        this.checkoutTab = this.page.locator('[data-testid="ost-placeholder-chip-checkoutUrl"]');

        // Inline-price spans rendered by mas-commerce-service inside the live preview.
        // Playwright's CSS pierces the live-preview's shadow root automatically.
        const preview = this.page.locator('[data-testid="ost-preview-container"]');
        this.price = preview.locator('span[is="inline-price"][data-template="price"]');
        this.priceOptical = preview.locator('span[is="inline-price"][data-template="optical"]');
        this.priceStrikethrough = preview.locator('span[is="inline-price"][data-template="strikethrough"]');
        this.pricePromoStrikethrough = preview.locator('span[is="inline-price"][data-template="price"] > .price-strikethrough');
        this.priceAnnual = preview.locator('span[is="inline-price"][data-template="annual"]');
        this.legalDisclaimer = preview.locator('span[is="inline-price"][data-template="legal"]');

        // Placeholder option switches (the new equivalent of the old checkboxes).
        this.termCheckbox = this.page.locator('[data-testid="ost-option-displayRecurrence"]');
        this.unitCheckbox = this.page.locator('[data-testid="ost-option-displayPerUnit"]');
        this.taxlabelCheckbox = this.page.locator('[data-testid="ost-option-displayTax"]');
        this.taxInlcusivityCheckbox = this.page.locator('[data-testid="ost-option-forceTaxExclusive"]');
        this.oldPriceCheckbox = this.page.locator('[data-testid="ost-option-displayOldPrice"]');

        // The wizard's single footer "Use" button is shared across placeholder types.
        // To "use" a different template the user clicks the chip first; the per-type
        // aliases below all resolve to the same footer button.
        const useButton = this.page.locator('[data-testid="ost-footer-use-button"]');
        this.priceUse = useButton;
        this.priceOpticalUse = useButton;
        this.priceStrikethroughUse = useButton;
        this.priceAnnualUse = useButton;
        this.legalDisclaimerUse = useButton;
        this.checkoutLinkUse = useButton;

        // Checkout placeholder bits (only visible when the checkoutUrl chip is active).
        this.checkoutLink = preview.locator('a[is="checkout-link"]');
        this.workflowMenu = this.page.locator('[data-testid="ost-workflow-menu"]');
        this.ctaTextMenu = this.page.locator('[data-testid="ost-cta-text-menu"]');

        // Promo override
        this.promoField = this.page.locator('[data-testid="ost-promo-override-input"]');
        this.promoLabel = this.page.locator('[data-testid="ost-promo-label"]');
        this.cancelPromo = this.page.locator('[data-testid="ost-promo-clear"]');
    }
}
