import { expect } from '@playwright/test';

export default class EditorPage {
    constructor(page) {
        this.page = page;
        this.panel = page.locator('editor-panel > #editor');

        // Editor panel fields
        this.variant = this.panel.locator('#card-variant');
        this.size = this.panel.locator('#card-size');
        this.title = this.panel.locator('#card-title input');
        this.subtitle = this.panel.locator('#card-subtitle input');
        this.badge = this.panel.locator('#card-badge input');
        this.iconURL = this.panel.locator('#icon input');
        this.promoText = this.panel.locator('#promo-text input');
        this.backgroundImage = this.panel.locator('#background-image input');
        this.prices = this.panel.locator('sp-field-group#prices');
        this.footer = this.panel.locator('sp-field-group#ctas');
        this.CTA = this.panel.locator('sp-field-group#ctas a');
        this.description = this.panel.locator(
            'sp-field-group#description div[contenteditable="true"]',
        );
        this.borderColor = this.panel.locator('sp-picker#border-color');
        this.backgroundColor = this.panel.locator('sp-picker#backgroundColor');
        this.OSI = this.panel.locator('osi-field#osi');
        this.OSIButton = this.panel.locator('#offerSelectorToolButtonOSI');
        this.tags = this.panel.locator('aem-tag-picker-field[label="Tags"]');
        this.CTAClassSecondary = this.panel.locator(
            'sp-field-group#ctas a.secondary',
        );
        this.callout = this.panel.locator('sp-field-group#callout');
        this.calloutRTE = this.panel.locator(
            'sp-field-group#callout div[contenteditable="true"]',
        );
        this.calloutRTEIcon = this.panel.locator(
            'sp-field-group#callout .icon-button',
        );
        this.showStockCheckbox = this.panel.locator('#stockOffer #input');
        this.showQuantitySelector = this.panel.locator(
            '#quantitySelect sp-checkbox input',
        );
        this.quantitySelectorTitle = this.panel.locator(
            'sp-field-group#quantitySelector #title-quantity input',
        );
        this.quantityselectorStart = this.panel.locator(
            'sp-field-group#quantitySelector #start-quantity input',
        );
        this.quantityselectorStep = this.panel.locator(
            'sp-field-group#quantitySelector #step-quantity input',
        );
        this.whatsIncluded = this.panel.locator('#whatsIncluded input');

        this.closeEditor = this.panel.locator(
            'div[id="editor-toolbar"] >> sp-action-button[value="close"]',
        );

        // Price templates
        this.regularPrice = page.locator(
            'span[is="inline-price"][data-template="price"]',
        );
        this.strikethroughPrice = page.locator(
            'span[is="inline-price"][data-template="strikethrough"]',
        );

        // RTE panel toolbar
        this.linkEdit = page.locator('#linkEditorButton');
        this.addIcon = page.locator('#addIconButton');

        // Edit Link Panel
        this.checkoutParameters = page.locator('#checkoutParameters input');
        this.linkText = page.locator('#linkText input');
        this.linkSave = page.locator('#saveButton');
        this.linkVariant = page.locator('#linkVariant');
        this.accentVariant = page.locator('sp-button[variant="accent"]');
        this.primaryVariant = page.locator(
            'sp-button[variant="primary]:not([treatment="outline"]])',
        );
        this.primaryOutlineVariant = page.locator(
            'sp-button[variant="primary"][treatment="outline"]',
        );
        this.secondaryVariant = page.locator(
            'sp-button[variant="secondary]:not([treatment="outline"]])',
        );
        this.secondaryOutlineVariant = page.locator(
            'sp-button[variant="secondary"][treatment="outline"]',
        );
        this.primaryLinkVariant = page.locator(
            'sp-link:has-text("Primary link")',
        );
        this.secondaryLinkVariant = page.locator(
            'sp-link[variant="secondary"]',
        );
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
}
