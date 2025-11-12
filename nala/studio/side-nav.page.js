import { expect } from '@playwright/test';

export default class SideNavPage {
    constructor(page) {
        this.page = page;
        this.sideNav = page.locator('mas-side-nav');

        // Default navigation items
        this.homeNavItem = this.sideNav.locator('mas-side-nav-item[label="Home"]');
        this.offersNavItem = this.sideNav.locator('mas-side-nav-item[label="Offers"]');
        this.fragmentsNavItem = this.sideNav.locator('mas-side-nav-item[label="Fragments"]');
        this.promotionsNavItem = this.sideNav.locator('mas-side-nav-item[label="Promotions"]');
        this.collectionsNavItem = this.sideNav.locator('mas-side-nav-item[label="Collections"]');
        this.placeholdersNavItem = this.sideNav.locator('mas-side-nav-item[label="Placeholders"]');
        this.supportNavItem = this.sideNav.locator('mas-side-nav-item[label="Support"]');

        // Editing operation items
        this.saveButton = this.sideNav.locator('mas-side-nav-item[label="Save"]');
        this.createVariationButton = this.sideNav.locator('mas-side-nav-item[label="Create Variation"]');
        this.duplicateButton = this.sideNav.locator('mas-side-nav-item[label="Duplicate"]');
        this.publishButton = this.sideNav.locator('mas-side-nav-item[label="Publish"]');
        this.unpublishButton = this.sideNav.locator('mas-side-nav-item[label="Unpublish"]');
        this.copyCodeButton = this.sideNav.locator('mas-side-nav-item[label="Copy Code"]');
        this.historyButton = this.sideNav.locator('mas-side-nav-item[label="History"]');
        this.unlockButton = this.sideNav.locator('mas-side-nav-item[label="Unlock"]');
        this.deleteButton = this.sideNav.locator('mas-side-nav-item[label="Delete"]');
    }

    async navigateToHome() {
        await this.homeNavItem.click();
        await this.page.waitForLoadState('domcontentloaded');
    }

    async navigateToFragments() {
        await this.fragmentsNavItem.click();
        await this.page.waitForLoadState('domcontentloaded');
    }

    async navigateToPlaceholders() {
        await this.placeholdersNavItem.click();
        await this.page.waitForLoadState('domcontentloaded');
    }

    async navigateToSupport() {
        await this.supportNavItem.click();
    }

    async saveFragment() {
        await expect(this.saveButton).toBeVisible();
        await this.saveButton.click();
    }

    async duplicateFragment() {
        await expect(this.duplicateButton).toBeVisible();
        await this.duplicateButton.click();
    }

    async deleteFragment() {
        await expect(this.deleteButton).toBeVisible();
        await this.deleteButton.click();
    }

    async createVariation() {
        await expect(this.createVariationButton).toBeVisible();
        await this.createVariationButton.click();
    }

    async publishFragment() {
        await expect(this.publishButton).toBeVisible();
        await this.publishButton.click();
    }

    async unpublishFragment() {
        await expect(this.unpublishButton).toBeVisible();
        await this.unpublishButton.click();
    }

    async copyCode() {
        await expect(this.copyCodeButton).toBeVisible();
        await this.copyCodeButton.click();
    }

    async isSaveEnabled() {
        const isDisabled = await this.saveButton.getAttribute('disabled');
        return isDisabled === null;
    }

    async isSaveVisible() {
        return await this.saveButton.isVisible().catch(() => false);
    }

    async isCreateVariationVisible() {
        return await this.createVariationButton.isVisible().catch(() => false);
    }

    async isPublishEnabled() {
        const isDisabled = await this.publishButton.getAttribute('disabled');
        return isDisabled === null;
    }

    async isDeleteEnabled() {
        const isDisabled = await this.deleteButton.getAttribute('disabled');
        return isDisabled === null;
    }

    async waitForEditingMode() {
        await expect(this.saveButton).toBeVisible({ timeout: 10000 });
    }

    async waitForDefaultMode() {
        await expect(this.fragmentsNavItem).toBeVisible({ timeout: 10000 });
    }
}
