export default class SettingsPage {
    constructor(page) {
        this.page = page;
        this.freeTrialCta = page.locator('[data-analytics-id="free-trial"], [data-analytics-id="start-free-trial"]');
        this.buyNowCta = page.locator('[data-analytics-id="buy-now"]');
    }
}
