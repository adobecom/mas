import { expect } from '@playwright/test';

export default class VersionPage {
    constructor(page) {
        this.page = page;

        // Version page main container
        this.versionPage = page.locator('version-page');
        this.breadcrumbs = page.locator('version-page sp-breadcrumbs');
        this.breadcrumbHome = page.locator('version-page sp-breadcrumb-item').first();
        this.breadcrumbCurrent = page.locator('version-page sp-breadcrumb-item').last();

        // Header section
        this.header = page.locator('version-page .version-page-header');
        this.fragmentTitle = page.locator('version-page .fragment-title');
        this.fragmentPath = page.locator('version-page .fragment-path');

        // Search and filter
        this.searchInput = page.locator('version-page sp-search input');
        this.searchButton = page.locator('version-page sp-search sp-icon-search');

        // Version list
        this.versionList = page.locator('version-page .version-list-panel');
        this.versionItems = page.locator('version-page .version-item');
        this.currentVersionItem = page.locator('version-page .version-item.current');
        this.currentVersionStatus = page.locator('version-page .version-status');
        this.currentDot = page.locator('version-page .current-dot');

        // Version item details
        this.versionDateTime = page.locator('version-page .version-date-time');
        this.versionAuthor = page.locator('version-page .version-author');
        this.versionDescription = page.locator('version-page .version-description');

        // Version actions
        this.versionActionButton = page.locator('version-page sp-action-button[value="version-actions"]');
        this.restoreMenuItem = page.locator('sp-menu-item:has-text("Restore Version")');

        // Preview section
        this.previewColumn = page.locator('version-page .preview-column');
        this.previewCard = page.locator('version-page .fragment-preview merch-card');
        this.previewLabel = page.locator('version-page .preview-label');
        this.diffBadge = page.locator('version-page sp-badge.diff-badge');

        // Empty states
        this.emptyState = page.locator('version-page .empty-state');
        this.noVersionsMessage = page.locator('version-page :text("No versions found")');

        // Loading states
        this.loadingSpinner = page.locator('version-page sp-progress-circle');
    }

    /**
     * Navigate to version page for a specific fragment
     */
    async navigateToVersionPage(fragmentId, basePath = 'nala') {
        const currentUrl = this.page.url();
        const url = new URL(currentUrl);
        // The router uses 'fragment' as the hash parameter for fragmentId
        url.hash = `#page=version&path=${basePath}&fragment=${fragmentId}`;
        await this.page.goto(url.toString());
        await this.page.waitForTimeout(1000);
    }

    /**
     * Get current version item (the one with green border)
     */
    getCurrentVersionItem() {
        return this.page.locator('version-page .version-item.current');
    }

    /**
     * Get version by index (0-based)
     */
    getVersionByIndex(index) {
        return this.versionItems.nth(index);
    }

    /**
     * Select a version by index
     */
    async selectVersionByIndex(index) {
        const versionItem = this.getVersionByIndex(index);
        await versionItem.click();
        await this.page.waitForTimeout(500);
    }

    /**
     * Search for versions
     */
    async searchVersions(query) {
        await this.searchInput.fill(query);
        await this.page.keyboard.press('Enter');
        await this.page.waitForTimeout(500);
    }

    /**
     * Restore a version by index
     */
    async restoreVersionByIndex(index) {
        const versionItem = this.getVersionByIndex(index);
        await versionItem.locator('sp-action-menu').click();
        await this.page.waitForTimeout(300);
        await this.restoreMenuItem.click();
    }

    /**
     * Wait for versions to load
     */
    async waitForVersionsLoaded() {
        // Wait for at least one version item to appear
        await this.page.waitForSelector('version-page .version-item', { timeout: 15000 });
        // Wait for loading spinner to disappear if present
        await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
        // Additional wait for rendering
        await this.page.waitForTimeout(1000);
    }

    /**
     * Navigate back to content using breadcrumbs
     */
    async navigateBackToContent() {
        await this.breadcrumbHome.click();
    }
}
