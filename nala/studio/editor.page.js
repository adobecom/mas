import { expect } from '@playwright/test';

export default class EditorPage {
    constructor(page) {
        this.page = page;
        this.panel = page.locator('mas-fragment-editor > #fragment-editor #editor-content');

        // Editor panel fields
        this.authorPath = page.locator('#author-path');
        this.variant = this.panel.locator('#card-variant sp-picker[label="Card Variant"]');
        this.size = this.panel.locator('#card-size');
        this.title = this.panel.locator('rte-field#card-title div[contenteditable="true"]');
        this.subtitle = this.panel.locator('#card-subtitle input');
        this.badge = this.panel.locator('#card-badge input');
        this.badgeColor = this.panel.locator('sp-picker#badgeColor');
        this.badgeBorderColor = this.panel.locator('sp-picker#badgeBorderColor');
        this.cardBorderColor = this.panel.locator('sp-picker#border-color');
        this.borderColor = this.panel.locator('sp-picker#border-color');
        this.backgroundColor = this.panel.locator('sp-picker#backgroundColor');
        this.mnemonicEditMenu = page.locator('mas-multifield sp-action-menu').first();
        this.mnemonicEditButton = page.locator('sp-menu sp-menu-item:has-text("Edit")');
        this.mnemonicDeleteButton = page.locator('sp-menu sp-menu-item:has-text("Delete")');
        this.mnemonicProductTab = page.locator('mas-mnemonic-modal[open] sp-tab[value="product-icon"]');
        this.mnemonicUrlTab = page.locator('mas-mnemonic-modal[open] sp-tab[value="url"]');
        this.mnemonicUrlIconInput = page.locator('mas-mnemonic-modal[open] #url-icon >> input');
        this.mnemonicUrlAltInput = page.locator('mas-mnemonic-modal[open] #url-alt >> input');
        this.mnemonicUrlLinkInput = page.locator('mas-mnemonic-modal[open] #url-link >> input');
        this.mnemonicModalSaveButton = page.locator('mas-mnemonic-modal[open] sp-button[variant="accent"]');
        this.mnemonicModalCancelButton = page.locator('mas-mnemonic-modal[open] sp-button[variant="secondary"]');
        this.promoText = this.panel.locator('#promo-text input');
        this.backgroundImage = this.panel.locator('#background-image input');
        this.prices = this.panel.locator('sp-field-group#prices');
        this.footer = this.panel.locator('sp-field-group#ctas');
        this.CTA = this.panel.locator('sp-field-group#ctas a');
        this.descriptionFieldGroup = this.panel.locator('sp-field-group#description');
        this.description = this.panel.locator('sp-field-group#description div[contenteditable="true"]');
        this.shortDescription = this.panel.locator('rte-field#shortDescription div[contenteditable="true"]');
        this.OSI = this.panel.locator('osi-field#osi');
        this.OSIButton = this.panel.locator('#offerSelectorToolButtonOSI');
        this.tags = this.panel.locator('aem-tag-picker-field[label="Tags"]');
        this.CTAClassSecondary = this.panel.locator('sp-field-group#ctas a.secondary');
        this.callout = this.panel.locator('sp-field-group#callout');
        this.calloutRTE = this.panel.locator('sp-field-group#callout div[contenteditable="true"]');
        this.calloutRTEIcon = this.panel.locator('sp-field-group#callout .icon-button');
        this.showAddOn = this.panel.locator('#addon-field #input');
        this.showQuantitySelector = this.panel.locator('#quantitySelect sp-checkbox input');
        this.quantitySelectorTitle = this.panel.locator('sp-field-group#quantitySelectorTitle #title-quantity input');
        this.quantitySelectorStart = this.panel.locator('sp-field-group#quantitySelectorStart #start-quantity input');
        this.quantitySelectorStep = this.panel.locator('sp-field-group#quantitySelectorStep #step-quantity input');
        this.whatsIncluded = this.panel.locator('sp-field-group#whatsIncluded');
        this.whatsIncludedLabel = this.panel.locator('#whatsIncludedLabel input');
        this.whatsIncludedAddIcon = this.panel.locator('#whatsIncluded sp-icon-add');
        this.whatsIncludedIconURL = this.panel.locator('#whatsIncluded #icon input');
        this.whatsIncludedIconLabel = this.panel.locator('#whatsIncluded #text input');
        this.whatsIncludedIconRemoveButton = this.panel.locator('#whatsIncluded sp-icon-close');
        // this.closeEditor = this.panel.locator('div[id="editor-toolbar"] >> sp-action-button[value="close"]');
        // this.discardButton = this.panel.locator('div[id="editor-toolbar"] >> sp-action-button[value="discard"]');
        this.discardConfirmDialog = page.locator('sp-dialog[variant="confirmation"]');
        this.discardConfirmButton = page.locator('sp-dialog[variant="confirmation"] sp-button:has-text("Discard")');
        this.cancelDiscardButton = page.locator('sp-dialog[variant="confirmation"] sp-button:has-text("Cancel")');

        // Missing variation panel (locale switching)
        this.missingVariationPanel = page.locator('#missing-variation-panel');
        this.viewSourceFragmentButton = page.locator('#view-source-fragment');
        this.createTranslationProjectButton = page.locator('#create-translation-project');

        // Price templates
        this.regularPrice = page.locator('span[is="inline-price"][data-template="price"]');
        this.strikethroughPrice = page.locator('span[is="inline-price"][data-template="strikethrough"]');
        this.promoStrikethroughPrice = page.locator('span[is="inline-price"][data-template="price"] > .price-strikethrough');
        this.legalDisclaimer = page.locator('span[is="inline-price"][data-template="legal"]');

        // RTE content
        this.phoneLink = page.locator('a[href^="tel:"]');

        // RTE panel toolbar
        this.linkEdit = page.locator('#linkEditorButton');
        this.addIcon = page.locator('#addIconButton');
        this.OSTButton = page.locator('#offerSelectorToolButton');

        // Edit Link Panel
        this.checkoutParameters = page.locator('#checkoutParameters input');
        this.linkText = page.locator('#linkText input');
        this.analyticsId = page.locator('sp-picker#analyticsId');
        this.phoneLinkTab = page.locator('#linkTypeNav sp-tab[value="phone"]');
        this.phoneLinkText = page.locator('#phoneNumber input');
        this.linkSave = page.locator('#saveButton');
        this.linkVariant = page.locator('#linkVariant');
        this.accentVariant = page.locator('sp-button[variant="accent"]');
        this.primaryVariant = page.locator('sp-button[variant="primary"]:not([treatment="outline"])');
        this.primaryOutlineVariant = page.locator('sp-button[variant="primary"][treatment="outline"]');
        this.secondaryVariant = page.locator('sp-button[variant="secondary"]:not([treatment="outline"])');
        this.secondaryOutlineVariant = page.locator('sp-button[variant="secondary"][treatment="outline"]');
        this.primaryLinkVariant = page.locator('sp-link:has-text("Primary link")');
        this.secondaryLinkVariant = page.locator('sp-link[variant="secondary"]');
    }

    async getLinkVariant(variant) {
        const linkVariant = {
            accent: this.accentVariant,
            primary: this.primaryVariant,
            'primary-outline': this.primaryOutlineVariant,
            secondary: this.secondaryVariant,
            'secondary-outline': this.secondaryOutlineVariant,
            'primary-link': this.primaryLinkVariant,
            'secondary-link': this.secondaryLinkVariant,
        };

        const link = linkVariant[variant];
        if (!link) {
            throw new Error(`Invalid link variant type: ${variant}`);
        }

        return this.linkVariant.locator(link);
    }

    async openMnemonicModal(elementLocator = null) {
        // If an element locator is provided, scope the search to that element
        // Otherwise, use the default mnemonicEditMenu
        const mnemonicEditMenu = elementLocator
            ? elementLocator.locator('mas-multifield sp-action-menu').first()
            : this.mnemonicEditMenu;

        await mnemonicEditMenu.scrollIntoViewIfNeeded();
        await expect(mnemonicEditMenu).toBeVisible();
        await mnemonicEditMenu.click();

        const editButton = mnemonicEditMenu.locator('sp-menu sp-menu-item:has-text("Edit")');
        await expect(editButton).toBeVisible();
        await expect(editButton).toBeEnabled();
        await editButton.click({ force: true });
        await expect(this.page.locator('mas-mnemonic-modal[open] sp-dialog')).toBeVisible();
    }

    async selectProductIcon(productName) {
        await this.mnemonicProductTab.click();
        const iconItem = this.page.locator(`mas-mnemonic-modal[open] .icon-item:has-text("${productName}")`);
        await expect(iconItem).toBeVisible();
        await iconItem.click();
    }

    async setMnemonicURL(url, alt = '', link = '') {
        await this.mnemonicUrlTab.click();
        const iconField = this.page.locator('mas-mnemonic-modal[open] #url-icon');
        await expect(iconField).toBeVisible();
        await iconField.evaluate((el, value) => {
            el.value = value;
            el.dispatchEvent(new Event('input', { bubbles: true }));
        }, url);
        if (alt) {
            const altField = this.page.locator('mas-mnemonic-modal[open] #url-alt');
            await expect(altField).toBeVisible();
            await altField.evaluate((el, value) => {
                el.value = value;
                el.dispatchEvent(new Event('input', { bubbles: true }));
            }, alt);
        }
        if (link) {
            const linkField = this.page.locator('mas-mnemonic-modal[open] #url-link');
            await expect(linkField).toBeVisible();
            await linkField.evaluate((el, value) => {
                el.value = value;
                el.dispatchEvent(new Event('input', { bubbles: true }));
            }, link);
        }
    }

    async saveMnemonicModal() {
        await this.mnemonicModalSaveButton.click();
        await this.page.locator('mas-mnemonic-modal[open] sp-dialog').waitFor({ state: 'detached' });
    }

    async cancelMnemonicModal() {
        await this.mnemonicModalCancelButton.click();
        await this.page.locator('mas-mnemonic-modal[open] sp-dialog').waitFor({ state: 'detached' });
    }

    get iconURL() {
        return this.mnemonicUrlIconInput;
    }
}
