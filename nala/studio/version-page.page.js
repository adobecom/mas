export default class VersionPage {
    constructor(page) {
        this.page = page;

        // Version page main container
        this.versionPage = page.locator('version-page');
        this.versionPageWrapper = page.locator('version-page .version-page-wrapper');

        // Breadcrumbs (version page breadcrumbs are in main layout .breadcrumbs-container, not inside version-page)
        this.breadcrumbs = page.locator('version-page sp-breadcrumbs');
        this.breadcrumbItems = page.locator('version-page sp-breadcrumb-item');
        this.breadcrumbHome = page.locator('version-page sp-breadcrumb-item').first();
        this.breadcrumbCurrent = page.locator('version-page sp-breadcrumb-item').last();
        this.layoutBreadcrumbs = page.locator('.breadcrumbs-container sp-breadcrumbs');
        this.layoutBreadcrumbItems = page.locator('.breadcrumbs-container sp-breadcrumb-item');

        // Version list panel
        this.versionListPanel = page.locator('version-page .version-list-panel');
        this.versionListHeader = page.locator('version-page .version-list-header');
        this.versionListContent = page.locator('version-page .version-list-content');

        // Search functionality
        this.searchInput = page.locator('version-page sp-search');
        this.searchInputField = page.locator('version-page sp-search input');

        // Version status and items
        this.versionStatus = page.locator('version-page .version-status');
        this.currentDot = page.locator('version-page .current-dot');
        this.versionItems = page.locator('version-page .version-item');
        this.currentVersionItem = page.locator('version-page .version-item.current');
        this.selectedVersionItem = page.locator('version-page .version-item.selected');

        // Version item details
        this.versionDateTime = page.locator('version-page .version-date-time');
        this.versionAuthor = page.locator('version-page .version-author');
        this.versionDescription = page.locator('version-page .version-description');
        this.versionMenu = page.locator('version-page .version-menu');

        // Preview panel
        this.previewPanel = page.locator('version-page .preview-panel');
        this.previewContent = page.locator('version-page .preview-content');
        this.previewSplit = page.locator('version-page .preview-split');
        this.previewColumns = page.locator('version-page .preview-column');
        this.previewColumn = page.locator('version-page .preview-column').first();

        // Preview details
        this.previewColumnHeader = page.locator('version-page .preview-column-header');
        this.previewColumnDate = page.locator('version-page .preview-column-date');
        this.diffBadge = page.locator('version-page .diff-badge');
        this.fragmentPreview = page.locator('version-page .fragment-preview-wrapper');
        this.merchCard = page.locator('version-page merch-card');

        // Changed fields section
        this.fragmentInfo = page.locator('version-page .fragment-info');
        this.changedFieldsLabel = page.locator('version-page .changed-fields-label');
        this.changedFieldsList = page.locator('version-page .changed-fields-list');
        this.changedFieldItems = page.locator('version-page .changed-fields-list li');
        this.changedFieldDetail = page.locator('version-page .changed-field-detail');

        // Loading states
        this.loadingSpinner = page.locator('version-page sp-progress-circle');
        this.loadingMessage = page.locator('version-page .loading-message');

        // Empty states
        this.noFragmentMessage = page.locator('version-page .no-fragment-message');
        this.noDataMessage = page.locator('version-page .no-data-message');
    }

    /**
     * Navigate to version page for a specific fragment
     */
    async navigateToVersionPage(fragmentId, basePath = 'nala') {
        // Use page.evaluate to set the store and trigger router navigation
        await this.page.evaluate(
            ({ fId, path }) => {
                if (window.Store && window.Store.version && window.Store.version.fragmentId) {
                    window.Store.version.fragmentId.set(fId);
                    window.Store.page.set('version');
                    window.Store.path.set(path);
                    // Also update the hash
                    window.location.hash = `#page=version&path=${path}&fragment=${fId}`;
                }
            },
            { fId: fragmentId, path: basePath },
        );
        await this.page.waitForTimeout(2000);
    }

    /**
     * Get version by index (0-based, where 0 is the current version)
     */
    getVersionByIndex(index) {
        return this.versionItems.nth(index);
    }

    /**
     * Select a version by clicking on it
     */
    async selectVersionByIndex(index) {
        const versionItem = this.getVersionByIndex(index);
        await versionItem.click();
        await this.page.waitForTimeout(1000);
    }

    /**
     * Search for versions
     */
    async searchVersions(query) {
        await this.searchInputField.fill(query);
        await this.page.waitForTimeout(500);
    }

    /**
     * Clear search
     */
    async clearSearch() {
        await this.searchInputField.clear();
        await this.page.waitForTimeout(500);
    }

    /**
     * Open version action menu for a specific version
     */
    async openVersionMenu(index) {
        const versionItem = this.getVersionByIndex(index);
        const menu = versionItem.locator('sp-action-menu');
        await menu.click();
        await this.page.waitForTimeout(300);
    }

    /**
     * Click "Restore this version" menu item (menu must be open, e.g. via openVersionMenu)
     */
    async clickRestoreThisVersion() {
        await this.page.locator('version-page sp-menu-item:has-text("Restore this version")').first().click();
        await this.page.waitForTimeout(500);
    }

    /**
     * Wait for version page to be fully loaded
     */
    async waitForVersionPageLoaded() {
        // Wait for router to process hash params and load the page
        await this.page.waitForTimeout(3000);

        // Wait for the version page element with longer timeout
        await this.versionPage.waitFor({ state: 'visible', timeout: 30000 });

        // Wait for version list to load
        await this.page.waitForSelector('version-page .version-item', { timeout: 30000 });

        // Wait for any loading spinner to disappear
        await this.page
            .waitForFunction(
                () => {
                    const spinners = document.querySelectorAll('version-page sp-progress-circle');
                    return (
                        spinners.length === 0 || Array.from(spinners).every((s) => s.style.display === 'none' || !s.isConnected)
                    );
                },
                { timeout: 20000 },
            )
            .catch(() => {});

        // Additional wait for rendering
        await this.page.waitForTimeout(2000);
    }

    /**
     * Wait for preview to update
     */
    async waitForPreviewUpdate() {
        // Wait for preview content to be visible
        await this.previewContent.waitFor({ state: 'visible', timeout: 10000 });

        // Wait for any loading spinner in preview to disappear
        await this.page.waitForTimeout(1500);
    }

    /**
     * Navigate back to content (Fragments table) using layout breadcrumb - first item
     */
    async clickBreadcrumbFragmentsTable() {
        await this.layoutBreadcrumbItems.first().click();
        await this.page.waitForTimeout(1500);
    }

    /**
     * Navigate to fragment editor using layout breadcrumb - second item
     */
    async clickBreadcrumbEditor() {
        await this.layoutBreadcrumbItems.nth(1).click();
        await this.page.waitForTimeout(1500);
    }

    /**
     * Navigate back to content using breadcrumbs (alias for clickBreadcrumbFragmentsTable)
     */
    async navigateBackToContent() {
        await this.clickBreadcrumbFragmentsTable();
    }

    /**
     * Find version item index by version title (e.g. '1.0', '1.3')
     */
    async getVersionIndexByTitle(title) {
        const count = await this.versionItems.count();
        for (let i = 0; i < count; i++) {
            const item = this.versionItems.nth(i);
            const text = await item.textContent();
            if (text && text.includes(title)) return i;
        }
        return -1;
    }

    /**
     * Select a version by its title (e.g. '1.0', '1.3')
     */
    async selectVersionByTitle(title) {
        const index = await this.getVersionIndexByTitle(title);
        if (index >= 0) {
            await this.selectVersionByIndex(index);
        }
    }

    /**
     * Get version count
     */
    async getVersionCount() {
        return await this.versionItems.count();
    }

    /**
     * Get changed fields count
     */
    async getChangedFieldsCount() {
        return await this.changedFieldItems.count();
    }

    /**
     * Get changed field text by index
     */
    async getChangedFieldText(index) {
        const item = this.changedFieldItems.nth(index);
        const detail = item.locator('sp-detail');
        return await detail.textContent();
    }

    /**
     * Check if changed fields section is visible
     */
    async hasChangedFields() {
        return await this.changedFieldsLabel.isVisible().catch(() => false);
    }

    /**
     * Get all changed field texts
     */
    async getAllChangedFields() {
        const count = await this.getChangedFieldsCount();
        const fields = [];
        for (let i = 0; i < count; i++) {
            const text = await this.getChangedFieldText(i);
            fields.push(text.trim());
        }
        return fields;
    }
}
