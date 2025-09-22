import { expect } from '@playwright/test';

export default class MnemonicModalPage {
    constructor(page) {
        this.page = page;

        // Mnemonic field selectors - using >> for shadow DOM piercing
        this.mnemonicField = page.locator('mas-mnemonic-field');
        this.mnemonicEditButton = page.locator('mas-mnemonic-field >> .edit-button');
        this.mnemonicPreview = page.locator('mas-mnemonic-field >> .mnemonic-preview');
        this.mnemonicIconPreview = page.locator('mas-mnemonic-field >> .icon-preview img');
        this.mnemonicIconPlaceholder = page.locator('mas-mnemonic-field >> .icon-placeholder');
        this.mnemonicIconName = page.locator('mas-mnemonic-field >> .mnemonic-info .value').first();
        this.mnemonicAltText = page.locator('mas-mnemonic-field >> .mnemonic-info .value').nth(1);
        this.mnemonicLink = page.locator('mas-mnemonic-field >> .mnemonic-info .value').nth(2);

        // Modal selectors - using >> for shadow DOM piercing
        this.modal = page.locator('mas-mnemonic-modal');
        this.modalDialog = page.locator('mas-mnemonic-modal >> sp-dialog');
        this.modalUnderlay = page.locator('mas-mnemonic-modal >> sp-underlay[open]');
        this.modalHeading = page.locator('mas-mnemonic-modal >> h2[slot="heading"]');

        // Tab selectors
        this.tabs = page.locator('mas-mnemonic-modal >> sp-tabs');
        this.productIconTab = page.locator('mas-mnemonic-modal >> sp-tab[value="product-icon"]');
        this.urlTab = page.locator('mas-mnemonic-modal >> sp-tab[value="url"]');
        this.productIconPanel = page.locator('mas-mnemonic-modal >> sp-tab-panel[value="product-icon"]');
        this.urlPanel = page.locator('mas-mnemonic-modal >> sp-tab-panel[value="url"]');

        // Product Icon tab elements
        this.iconGrid = page.locator('mas-mnemonic-modal >> sp-tab-panel[value="product-icon"] >> .icon-grid');
        this.iconItems = page.locator('mas-mnemonic-modal >> sp-tab-panel[value="product-icon"] >> .icon-item');
        this.selectedIcon = page.locator('mas-mnemonic-modal >> sp-tab-panel[value="product-icon"] >> .icon-item.selected');
        this.productAltInput = page.locator(
            'mas-mnemonic-modal >> sp-tab-panel[value="product-icon"] >> sp-textfield#product-alt >> input',
        );
        this.productLinkInput = page.locator(
            'mas-mnemonic-modal >> sp-tab-panel[value="product-icon"] >> sp-textfield#product-link >> input',
        );

        // URL tab elements
        this.urlIconInput = page.locator('mas-mnemonic-modal >> sp-tab-panel[value="url"] >> sp-textfield#url-icon >> input');
        this.urlAltInput = page.locator('mas-mnemonic-modal >> sp-tab-panel[value="url"] >> sp-textfield#url-alt >> input');
        this.urlLinkInput = page.locator('mas-mnemonic-modal >> sp-tab-panel[value="url"] >> sp-textfield#url-link >> input');

        // Modal buttons
        this.cancelButton = page.locator('mas-mnemonic-modal >> sp-button[variant="secondary"]');
        this.saveButton = page.locator('mas-mnemonic-modal >> sp-button[variant="accent"]');
    }

    // Helper methods
    async openModal() {
        // First check if the mnemonic field exists
        const hasMnemonicField = await this.mnemonicField.isVisible({ timeout: 2000 }).catch(() => false);

        if (!hasMnemonicField) {
            console.log('Mnemonic field not found - card may use old icon field');
            throw new Error('Mnemonic field not available for this card');
        }

        // Wait for the edit button to be visible and clickable
        await this.mnemonicEditButton.waitFor({ state: 'visible', timeout: 10000 });

        // Ensure the button is in viewport and clickable
        await this.mnemonicEditButton.scrollIntoViewIfNeeded();
        await this.page.waitForTimeout(500); // Small delay for scroll

        // Click with force option to bypass any overlays
        await this.mnemonicEditButton.click({ force: true });

        // Wait for modal to appear with longer timeout
        await this.page.waitForTimeout(1000); // Wait for animation

        // Check if modal opened
        const isModalVisible = await this.modalDialog.isVisible({ timeout: 5000 }).catch(() => false);

        if (!isModalVisible) {
            console.log('Modal did not open, trying alternative selectors');
            // Try clicking the field itself
            await this.mnemonicField.click();
            await this.page.waitForTimeout(1000);
        }

        await expect(this.modalDialog).toBeVisible({ timeout: 10000 });
    }

    async closeModal() {
        await this.cancelButton.click();
        await this.page.waitForTimeout(300); // Wait for close animation
        await expect(this.modalDialog).not.toBeVisible();
    }

    async selectProductIcon(productId) {
        const iconSelector = this.page.locator(
            `mas-mnemonic-modal >> sp-tab-panel[value="product-icon"] >> .icon-item:has(img[alt*="${productId}"])`,
        );
        await iconSelector.click();
        await expect(iconSelector).toHaveClass(/selected/);
    }

    async selectProductIconByName(productName) {
        // First ensure we're on the Product Icon tab
        const isPanelVisible = await this.productIconPanel.isVisible({ timeout: 1000 }).catch(() => false);

        if (!isPanelVisible) {
            await this.switchToProductIconTab();
        }

        // Wait for the product icon panel to be visible
        await expect(this.productIconPanel).toBeVisible({ timeout: 5000 });

        // Wait for icon grid to be visible
        await expect(this.iconGrid).toBeVisible({ timeout: 5000 });

        const iconSelector = this.page.locator(
            `mas-mnemonic-modal >> sp-tab-panel[value="product-icon"] >> .icon-item:has-text("${productName}")`,
        );

        // Wait for the icon to be visible
        await expect(iconSelector).toBeVisible({ timeout: 5000 });

        // Scroll into view if needed
        await iconSelector.scrollIntoViewIfNeeded();
        await this.page.waitForTimeout(300);

        // Click the icon
        await iconSelector.click();

        // Wait for selection to be applied
        await this.page.waitForTimeout(500);
        await expect(iconSelector).toHaveClass(/selected/, { timeout: 5000 });
    }

    async switchToUrlTab() {
        await this.urlTab.click();
        await expect(this.urlPanel).toBeVisible();
    }

    async switchToProductIconTab() {
        await this.productIconTab.click();
        await expect(this.productIconPanel).toBeVisible();
    }

    async fillProductIconForm(altText, linkUrl) {
        if (altText) {
            await this.productAltInput.clear();
            await this.productAltInput.fill(altText);
        }
        if (linkUrl) {
            await this.productLinkInput.clear();
            await this.productLinkInput.fill(linkUrl);
        }
    }

    async fillUrlForm(iconUrl, altText, linkUrl) {
        if (iconUrl) {
            await this.urlIconInput.clear();
            await this.urlIconInput.fill(iconUrl);
        }
        if (altText) {
            await this.urlAltInput.clear();
            await this.urlAltInput.fill(altText);
        }
        if (linkUrl) {
            await this.urlLinkInput.clear();
            await this.urlLinkInput.fill(linkUrl);
        }
    }

    async saveModal() {
        await this.saveButton.click();
        await this.page.waitForTimeout(1000); // Wait for save and close animation
        await expect(this.modalDialog).not.toBeVisible({ timeout: 5000 });
    }

    async getSelectedProductId() {
        const selectedIcon = await this.selectedIcon.first();
        const imgSrc = await selectedIcon.locator('img').getAttribute('src');
        const match = imgSrc.match(/\/([^/]+)\.svg$/);
        return match ? match[1] : null;
    }

    async verifyIconUrl(expectedUrl) {
        // Try mnemonic field first, then fall back to regular icon
        const mnemonicIconVisible = await this.mnemonicIconPreview.isVisible().catch(() => false);
        if (mnemonicIconVisible) {
            await expect(this.mnemonicIconPreview).toHaveAttribute('src', expectedUrl);
        } else {
            // Check the card icon directly
            const cardIcon = this.page.locator('merch-card merch-icon');
            await expect(cardIcon.first()).toHaveAttribute('src', expectedUrl);
        }
    }

    async verifyModalTitle(expectedTitle) {
        await expect(this.modalHeading).toHaveText(expectedTitle);
    }

    async isModalOpen() {
        return await this.modalDialog.isVisible();
    }

    async getIconGridCount() {
        return await this.iconItems.count();
    }

    async restoreOriginalIcon(originalProductId = 'acrobat-pro') {
        // Helper method to restore the card to its original icon
        try {
            // Check if mnemonic field exists first
            const hasMnemonicField = await this.mnemonicField.isVisible({ timeout: 1000 }).catch(() => false);

            if (!hasMnemonicField) {
                console.log('Cannot restore - no mnemonic field available');
                return;
            }

            await this.openModal();
            await this.selectProductIconByName(this.getProductNameFromId(originalProductId));
            await this.saveModal();
        } catch (error) {
            console.log('Could not restore original icon:', error.message);
        }
    }

    getProductNameFromId(productId) {
        const productMap = {
            'acrobat-pro': 'Acrobat Pro',
            photoshop: 'Photoshop',
            illustrator: 'Illustrator',
            'creative-cloud': 'Creative Cloud',
            lightroom: 'Lightroom',
            indesign: 'InDesign',
            'premiere-pro': 'Premiere Pro',
            'after-effects': 'After Effects',
        };
        return productMap[productId] || productId;
    }
}
