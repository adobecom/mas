export default class BootPage {
    constructor(page) {
        this.page = page;
        this.spinner = page.locator('.studio-boot');
        this.error = page.locator('.studio-boot-error');
        this.reloadButton = page.locator('.studio-boot-error button');
        this.injectedMarkup = page.locator('#nala-cb-injected');
    }
}
