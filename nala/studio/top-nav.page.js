import { expect } from '@playwright/test';

export default class TopNavPage {
    constructor(page) {
        this.page = page;
        this.topNav = page.locator('mas-top-nav');

        // Navigation elements
        this.brand = this.topNav.locator('.brand');
        this.logo = this.topNav.locator('.logo');
        this.appTitle = this.topNav.locator('.app-title');

        // Pickers
        this.folderPicker = this.topNav.locator('mas-nav-folder-picker sp-action-menu');
        this.localePicker = this.topNav.locator('mas-nav-locale-picker sp-action-menu');

        // Action buttons
        this.helpButton = this.topNav.locator('.icon-button[title="Help"]');
        this.notificationsButton = this.topNav.locator('.icon-button[title="Notifications"]');
        this.profileButton = this.topNav.locator('.profile-button');
    }

    async selectFolder(folderValue) {
        await expect(this.folderPicker).toBeVisible();
        await this.folderPicker.click();
        await this.page.waitForTimeout(500);

        const menuItem = this.page.locator(`mas-nav-folder-picker sp-menu-item[value="${folderValue}"]`);
        await expect(menuItem).toBeVisible({ timeout: 5000 });
        await menuItem.click();

        await this.page.waitForTimeout(1000);
    }

    async selectLocale(localeValue) {
        await expect(this.localePicker).toBeVisible();
        await this.localePicker.click();
        await this.page.waitForTimeout(500);

        const menuItem = this.page.locator(`mas-nav-locale-picker sp-menu-item[value="${localeValue}"]`);
        await expect(menuItem).toBeVisible({ timeout: 5000 });
        await menuItem.click();

        await this.page.waitForTimeout(1000);
    }

    async getSelectedFolder() {
        const selectedItem = await this.folderPicker.locator('sp-menu-item[selected]');
        return await selectedItem.getAttribute('value');
    }

    async getSelectedLocale() {
        const selectedItem = await this.localePicker.locator('sp-menu-item[selected]');
        return await selectedItem.getAttribute('value');
    }

    async clickHelp() {
        await this.helpButton.click();
    }

    async clickNotifications() {
        await this.notificationsButton.click();
    }

    async clickProfile() {
        await this.profileButton.click();
    }

    async isFolderPickerVisible() {
        return await this.folderPicker.isVisible().catch(() => false);
    }

    async isLocalePickerVisible() {
        return await this.localePicker.isVisible().catch(() => false);
    }

    async waitForTopNav() {
        await expect(this.topNav).toBeVisible({ timeout: 10000 });
    }

    async verifyBranding() {
        await expect(this.logo).toBeVisible();
        await expect(this.appTitle).toContainText('Merch At Scale Studio');
    }
}
