export default class OSTPage {
    constructor(page) {
        this.page = page.locator('[data-testid="modal"]');

        // OST panel
        this.searchField = this.page.locator('//input[contains(@data-testid,"search")]');
        this.productList = this.page.locator('//span[contains(@class,"productName")]');
        this.planType = this.page.locator(
            '//button/span[contains(@class, "spectrum-Dropdown-label") and (.//ancestor::div/span[contains(text(),"plan type")])]',
        );
        this.offerType = this.page.locator(
            '//button/span[contains(@class, "spectrum-Dropdown-label") and (.//ancestor::div/span[contains(text(),"offer type")])]',
        );
        this.nextButton = this.page.locator('//button[contains(@data-testid, "nextButton")]/span');
        this.offerTab = this.page.locator('//div[@data-key="offer"]');
        this.entitlementsTab = this.page.locator('//div[@data-key="entitlements"]');
        this.backButton = this.page.locator('//button[contains(@aria-label, "previous-step")]');
        this.price = this.page.locator('span[is="inline-price"][data-template="price"]');
        this.priceOptical = this.page.locator('span[is="inline-price"][data-template="priceOptical"]');
        this.priceStrikethrough = this.page.locator('span[is="inline-price"][data-template="priceStrikethrough"]');
        this.legalText = this.page.locator('span[is="inline-price"][data-template="legal"]');
        this.termCheckbox = this.page.locator('//input[@value="displayRecurrence"]');
        this.unitCheckbox = this.page.locator('//input[@value="displayPerUnit"]');
        this.taxlabelCheckbox = this.page.locator('//input[@value="displayTax"]');
        this.taxInlcusivityCheckbox = this.page.locator('//input[@value="forceTaxExclusive"]');
        this.oldPriceCheckbox = this.page.locator('//input[@value="displayOldPrice"]');
        this.priceUse = this.page.locator('div[id*="tabpanel-price"] button').first();
        this.priceOpticalUse = this.page.locator('button:near(:text("Optical price"))').first();
        this.priceStrikethroughUse = this.page.locator('button:near(:text("Strikethrough price"))').first();
        this.checkoutTab = this.page.locator('//div[@data-key="checkout"]');
        this.checkoutLink = this.page.locator('//a[@data-type="checkoutUrl"]');
        this.workflowMenu = this.page.locator('button:near(label:text("Workflow"))').first();
        this.ctaTextMenu = this.page.locator('button:near(label:text("Cta text"))').first();
        this.promoField = this.page.locator('//input[contains(@class, "spectrum-Textfield-input")]');
        this.promoLabel = this.page.locator('//span[contains(@class, "spectrum-Badge-label")]');
        this.checkoutLinkUse = this.page.locator('button:near(h4:text("Checkout URL"))').first();
        this.cancelPromo = this.page.locator('button:right-of(span:text("Promotion:"))').first();
    }
}
