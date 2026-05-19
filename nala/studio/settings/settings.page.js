export default class SettingsPage {
    constructor(page) {
        this.page = page;
        this.freeTrialCta = page.locator(
            '[data-analytics-id="free-trial"], [data-analytics-id="start-free-trial"], [data-analytics-id="seven-day-trial"], [data-analytics-id="fourteen-day-trial"], [data-analytics-id="thirty-day-trial"]',
        );
        this.buyNowCta = page.locator('[data-analytics-id="buy-now"]');
    }
}
