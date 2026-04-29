import { expect } from '@playwright/test';

export default class EditorPage {
    constructor(page) {
        this.page = page;
        this.panel = page.locator('mas-fragment-editor > #fragment-editor #editor-content');

        // Editor panel fields
        this.authorPath = page.locator('#author-path');
        this.addOnToggle = this.panel.locator('#addon-field #input');

        this.backgroundColor = this.panel.locator('sp-picker#backgroundColor');
        this.backgroundImage = this.panel.locator('#background-image input');

        this.badge = this.panel.locator('sp-field-group#badge rte-field#card-badge div.ProseMirror');
        this.badgeFieldGroup = this.panel.locator('sp-field-group#badge');
        this.badgeBorderColor = this.panel.locator('sp-picker#badgeBorderColor');
        this.badgeBorderColorFieldGroup = this.panel.locator('sp-field-group#badgeBorderColor');
        this.badgeColor = this.panel.locator('sp-picker#badgeColor');
        this.badgeColorFieldGroup = this.panel.locator('sp-field-group#badgeColor');

        this.borderColor = this.panel.locator('sp-picker#border-color');
        this.borderColorFieldGroup = this.panel.locator('sp-field-group#border-color');

        this.callout = this.panel.locator('sp-field-group#callout');
        this.calloutRTE = this.panel.locator('sp-field-group#callout div[contenteditable="true"]');
        this.calloutRTEIcon = this.panel.locator('sp-field-group#callout .icon-button');

        this.descriptionFieldGroup = this.panel.locator('sp-field-group#description');
        this.description = this.panel.locator('sp-field-group#description div[contenteditable="true"]');

        this.footer = this.panel.locator('sp-field-group#ctas');
        this.CTA = this.panel.locator('sp-field-group#ctas a');

        this.mnemonicFieldGroup = this.panel.locator('sp-field-group#mnemonics');
        this.mnemonicAddVisual = this.panel.locator('#mnemonics sp-icon-add');
        this.mnemonicEditMenu = page.locator('mas-multifield#mnemonics sp-action-menu').first();
        this.mnemonicEditButton = page.locator('sp-menu sp-menu-item:has-text("Edit")');
        this.mnemonicDeleteButton = page.locator('sp-menu sp-menu-item:has-text("Delete")');
        this.mnemonicModal = page.locator('mas-mnemonic-modal[open]');
        this.mnemonicProductTab = this.mnemonicModal.locator('sp-tab[value="product-icon"]');
        this.mnemonicUrlTab = this.mnemonicModal.locator('sp-tab[value="url"]');
        this.mnemonicUrlIconInput = this.mnemonicModal.locator('#url-icon >> input');
        this.mnemonicUrlAltInput = this.mnemonicModal.locator('#url-alt >> input');
        this.mnemonicUrlLinkInput = this.mnemonicModal.locator('#url-link >> input');
        this.mnemonicModalSaveButton = this.mnemonicModal.locator('sp-button[variant="accent"]');
        this.mnemonicModalCancelButton = this.mnemonicModal.locator('sp-button[variant="secondary"]');

        this.OSI = this.panel.locator('osi-field#osi');
        this.OSIButton = this.panel.locator('#offerSelectorToolButtonOSI');
        this.OSIFieldGroup = this.panel.locator('sp-field-group:has(osi-field#osi)');

        this.prices = this.panel.locator('sp-field-group#prices');

        this.promoText = this.panel.locator('sp-field-group#promoText rte-field#promo-text div.ProseMirror');
        this.promoTextFieldGroup = this.panel.locator('sp-field-group#promoText');
        this.promoCode = this.panel.locator('#promo-code input');
        this.promoCodeFieldGroup = this.panel.locator('sp-field-group#promoCode');

        this.quantitySelectorCheckbox = this.panel.locator('#quantity-select-settings-field-toggle input');
        this.quantitySelectorFields = this.panel.locator('#quantitySelect quantity-select-settings-field');
        this.quantitySelectorTitle = this.quantitySelectorFields.locator('#quantity-selector-title input');
        this.quantitySelectorStart = this.quantitySelectorFields.locator('#quantity-selector-start input');
        this.quantitySelectorStep = this.quantitySelectorFields.locator('#quantity-selector-step input');

        this.shortDescription = this.panel.locator('rte-field#shortDescription div[contenteditable="true"]');
        this.size = this.panel.locator('#card-size');
        this.style = this.panel.locator('#card-style');
        this.subtitle = this.panel.locator('#card-subtitle input');

        this.tags = this.panel.locator('aem-tag-picker-field[label="Tags"]');
        this.tagsFieldGroup = this.panel.locator('sp-field-group#tags');

        this.title = this.panel.locator('rte-field#card-title div[contenteditable="true"]');
        this.titleFieldGroup = this.panel.locator('sp-field-group#title');

        this.trialBadge = this.panel.locator('sp-field-group#trialBadge rte-field#card-trial-badge div.ProseMirror');
        this.trialBadgeFieldGroup = this.panel.locator('sp-field-group#trialBadge');
        this.trialBadgeBorderColor = this.panel.locator('sp-picker#trialBadgeBorderColor');
        this.trialBadgeBorderColorFieldGroup = this.panel.locator('sp-field-group#trialBadgeBorderColor');
        this.trialBadgeColor = this.panel.locator('sp-picker#trialBadgeColor');
        this.trialBadgeColorFieldGroup = this.panel.locator('sp-field-group#trialBadgeColor');

        this.variant = this.panel.locator('#card-variant sp-picker[label="Card Template"]');

        this.whatsIncluded = this.panel.locator('sp-field-group#whatsIncluded');
        this.whatsIncludedAddIcon = this.panel.locator('#whatsIncluded sp-action-button:has-text("Add application")');
        this.whatsIncludedEditButton = page.locator('sp-menu sp-menu-item:has-text("Edit")');
        this.whatsIncludedEditMenu = page.locator('mas-included-field sp-action-menu').first();
        this.whatsIncludedDeleteButton = page.locator('sp-menu sp-menu-item:has-text("Delete")');
        this.whatsIncludedLabel = this.panel.locator('#whatsIncludedLabel input');
        this.whatsIncludedAddedIcon = this.panel.locator('#whatsIncluded mas-included-field');

        // Discard dialog
        // this.closeEditor = this.panel.locator('div[id="editor-toolbar"] >> sp-action-button[value="close"]');
        // this.discardButton = this.panel.locator('div[id="editor-toolbar"] >> sp-action-button[value="discard"]');
        this.cancelDiscardButton = page.locator('sp-dialog[variant="confirmation"] sp-button:has-text("Cancel")');
        this.discardConfirmDialog = page.locator('sp-dialog[variant="confirmation"]');
        this.discardConfirmButton = page.locator('sp-dialog[variant="confirmation"] sp-button:has-text("Discard")');

        // Price templates
        this.legalDisclaimer = page.locator('span[is="inline-price"][data-template="legal"]');
        this.promoStrikethroughPrice = page.locator('span[is="inline-price"][data-template="price"] > .price-strikethrough');
        this.regularPrice = page.locator('span[is="inline-price"][data-template="price"]');
        this.strikethroughPrice = page.locator('span[is="inline-price"][data-template="strikethrough"]');

        // RTE content
        this.phoneLink = page.locator('a[href^="tel:"]');
        this.uptLink = page.locator('a.upt-link');

        // RTE panel toolbar
        this.addIcon = page.locator('#addIconButton');
        this.linkEdit = page.locator('#linkEditorButton');
        this.OSTButton = page.locator('#offerSelectorToolButton');
        this.UPTButton = page.locator('#uptLinkButton');

        // Edit Link Panel
        this.analyticsId = page.locator('sp-picker#analyticsId');
        this.accentVariant = page.locator('sp-button[variant="accent"]');
        this.checkoutParameters = page.locator('#checkoutParameters input');
        this.linkText = page.locator('#linkText input');
        this.linkSave = page.locator('#saveButton');
        this.linkVariant = page.locator('#linkVariant');
        this.phoneLinkTab = page.locator('#linkTypeNav sp-tab[value="phone"]');
        this.phoneLinkText = page.locator('#phoneNumber input');
        this.primaryLinkVariant = page.locator('sp-link:has-text("Primary link")');
        this.primaryVariant = page.locator('sp-button[variant="primary"]:not([treatment="outline"])');
        this.primaryOutlineVariant = page.locator('sp-button[variant="primary"][treatment="outline"]');
        this.secondaryVariant = page.locator('sp-button[variant="secondary"]:not([treatment="outline"])');
        this.secondaryOutlineVariant = page.locator('sp-button[variant="secondary"][treatment="outline"]');
        this.secondaryLinkVariant = page.locator('sp-link[variant="secondary"]');

        // Regional variation
        this.localeVariationHeader = page.locator('.locale-variation-header');
        this.derivedFromContainer = page.locator('mas-fragment-editor .derived-from-container');
        this.fragmentTitle = page.locator('sp-textfield#fragment-title input');
        // Missing variation panel (locale switching)
        this.missingVariationPanel = page.locator('#missing-variation-panel');
        this.viewSourceFragmentButton = page.locator('#view-source-fragment');
        this.createTranslationProjectButton = page.locator('#create-translation-project');

        this.overrideRestoreLink = 'a:has-text("Overridden. Click to restore.")';
    }

    overrideRestoreIn(fieldGroupLocator) {
        return fieldGroupLocator.locator(this.overrideRestoreLink);
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
