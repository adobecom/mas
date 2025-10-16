import { LitElement, html, css, ifDefined } from 'lit';

import { getFieldMetadata, validateField, validateAllFields } from './services/product-feed-fields.js';
import { PRODUCT_FEED_MODES } from './constants.js';

let dialogResolver;

export function showProductFeedDialog(productData, mode) {
    return new Promise((resolve) => {
        const dialog = document.querySelector('mas-product-feed-dialog');
        if (dialog) {
            dialog.productData = productData;
            dialog.mode = mode;
            dialog.open = true;
            dialogResolver = resolve;
        } else {
            console.error('[Product Feed Dialog] Dialog element not found in DOM');
            resolve({ confirmed: false });
        }
    });
}

class MasProductFeedDialog extends LitElement {
    static properties = {
        open: { type: Boolean, reflect: true },
        productData: { type: Object, state: true },
        editedData: { type: Object, state: true },
        validationErrors: { type: Object, state: true },
        mode: { type: String, state: true },
        expandedTooltips: { type: Object, state: true },
    };

    static styles = css`
        mas-product-feed-dialog {
            --dialog-width: 800px;
        }

        .product-feed-dialog-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: transparent;
            display: flex;
            align-items: center;
            justify-content: flex-start;
            padding-left: 5%;
            z-index: 99999;
            pointer-events: none;
        }

        .product-feed-dialog-overlay sp-dialog-wrapper {
            pointer-events: auto;
            max-width: 800px;
        }

        .dialog-content {
            max-height: 600px;
            overflow-y: scroll;
            padding: var(--spectrum-global-dimension-size-200) var(--spectrum-global-dimension-size-300);
            background: white;
        }

        .dialog-content::-webkit-scrollbar {
            -webkit-appearance: none;
            width: 12px;
        }

        .dialog-content::-webkit-scrollbar-track {
            background: var(--spectrum-global-color-gray-100);
            border-radius: 8px;
        }

        .dialog-content::-webkit-scrollbar-thumb {
            background: var(--spectrum-global-color-gray-400);
            border-radius: 8px;
            border: 2px solid var(--spectrum-global-color-gray-100);
        }

        .dialog-content::-webkit-scrollbar-thumb:hover {
            background: var(--spectrum-global-color-gray-500);
        }

        .mode-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 13px;
            font-weight: 600;
            margin-bottom: 16px;
        }

        .mode-badge.bypass {
            background: #e3f2fd;
            color: #1976d2;
        }

        .mode-badge.stage {
            background: #f3e5f5;
            color: #7b1fa2;
        }

        .mode-badge.prod {
            background: #fff3e0;
            color: #f57c00;
        }

        .warning-box {
            padding: 12px 16px;
            border-radius: 4px;
            margin-bottom: 20px;
            display: flex;
            align-items: start;
            gap: 8px;
        }

        .warning-box.bypass,
        .warning-box.stage {
            background: #f5f5f5;
            border-left: 4px solid #2196f3;
        }

        .warning-box.prod {
            background: #fff4e6;
            border-left: 4px solid #ff9800;
        }

        .warning-icon {
            font-size: 18px;
            margin-top: 2px;
        }

        .field-group {
            margin-bottom: var(--spectrum-global-dimension-size-250);
        }

        .field-header {
            display: flex;
            align-items: center;
            gap: var(--spectrum-global-dimension-size-100);
            margin-bottom: var(--spectrum-global-dimension-size-100);
        }

        sp-field-label {
            margin: 0;
        }

        .required-indicator {
            color: #d32f2f;
            font-weight: bold;
        }

        .info-button {
            position: relative;
        }

        sp-textfield,
        sp-picker {
            width: 100%;
        }

        .field-error {
            color: var(--spectrum-semantic-negative-color-default);
            font-size: var(--spectrum-global-dimension-font-size-75);
            margin-top: var(--spectrum-global-dimension-size-50);
        }

        .field-description {
            color: var(--spectrum-global-color-gray-700);
            font-size: var(--spectrum-global-dimension-font-size-75);
            margin-top: var(--spectrum-global-dimension-size-50);
            line-height: 1.4;
        }

        .validation-summary {
            background: #fff4f4;
            border: 1px solid var(--spectrum-semantic-negative-color-default);
            border-left: 4px solid var(--spectrum-semantic-negative-color-default);
            padding: var(--spectrum-global-dimension-size-150) var(--spectrum-global-dimension-size-200);
            margin-bottom: var(--spectrum-global-dimension-size-250);
            border-radius: 4px;
        }

        .validation-summary-title {
            font-weight: 600;
            color: var(--spectrum-semantic-negative-color-default);
            margin-bottom: var(--spectrum-global-dimension-size-100);
        }

        .validation-summary-list {
            margin: 0;
            padding-left: var(--spectrum-global-dimension-size-250);
            color: var(--spectrum-semantic-negative-color-default);
            font-size: var(--spectrum-global-dimension-font-size-75);
        }

        .read-only-field {
            background: #fafafa;
            opacity: 0.7;
        }

        .dialog-actions {
            display: flex;
            justify-content: flex-end;
            gap: var(--spectrum-global-dimension-size-150);
            padding: var(--spectrum-global-dimension-size-200) var(--spectrum-global-dimension-size-300);
            border-top: 1px solid var(--spectrum-global-color-gray-300);
        }

        .fields-container {
            display: grid;
            grid-template-columns: 1fr;
            gap: var(--spectrum-global-dimension-size-250);
        }
    `;

    createRenderRoot() {
        return this;
    }

    constructor() {
        super();
        this.open = false;
        this.productData = {};
        this.editedData = {};
        this.validationErrors = {};
        this.mode = PRODUCT_FEED_MODES.BYPASS;
        this.expandedTooltips = {};
    }

    updated(changedProperties) {
        if (changedProperties.has('productData') && this.productData) {
            this.editedData = { ...this.productData };
            this.validationErrors = {};
        }
    }

    handleFieldChange(fieldName, value) {
        this.editedData = {
            ...this.editedData,
            [fieldName]: value,
        };

        const fieldErrors = validateField(fieldName, value);
        if (fieldErrors.length > 0) {
            this.validationErrors = {
                ...this.validationErrors,
                [fieldName]: fieldErrors,
            };
        } else {
            const { [fieldName]: removed, ...rest } = this.validationErrors;
            this.validationErrors = rest;
        }
    }

    handleCancel() {
        this.open = false;
        if (dialogResolver) {
            dialogResolver({ confirmed: false });
            dialogResolver = null;
        }
    }

    handleConfirm() {
        const errors = validateAllFields(this.editedData);
        this.validationErrors = errors;

        if (Object.keys(errors).length > 0) {
            console.log('[Product Feed Dialog] Validation errors:', errors);
            return;
        }

        this.open = false;
        if (dialogResolver) {
            dialogResolver({
                confirmed: true,
                data: this.editedData,
            });
            dialogResolver = null;
        }
    }

    getModeConfig() {
        const configs = {
            [PRODUCT_FEED_MODES.BYPASS]: {
                label: 'Bypass (Local Only)',
                warning: '⚠️ Data will be validated locally only. No API call will be made.',
                class: 'bypass',
            },
            [PRODUCT_FEED_MODES.STAGE]: {
                label: 'Stage (Mock Preview)',
                warning: 'ℹ️ Data will be sent to staging for validation. Not visible in ChatGPT.',
                class: 'stage',
            },
            [PRODUCT_FEED_MODES.PROD]: {
                label: 'Production (OpenAI)',
                warning: '⚠️ Data will be published to ChatGPT and become searchable.',
                class: 'prod',
            },
        };

        return configs[this.mode] || configs[PRODUCT_FEED_MODES.BYPASS];
    }

    renderFieldInput(fieldName, meta) {
        const value = this.editedData[fieldName] || '';
        const errors = this.validationErrors[fieldName];
        const hasError = errors?.length > 0;

        if (!meta.editable) {
            return html`
                <sp-textfield
                    value=${value}
                    readonly
                    class="read-only-field"
                    placeholder=${ifDefined(meta.placeholder)}
                ></sp-textfield>
                <div class="field-description">${meta.description}</div>
            `;
        }

        if (meta.type === 'textarea') {
            const helpText = meta.description
                ? `${meta.description}${meta.maxLength ? ` (${value.length}/${meta.maxLength} characters)` : ''}`
                : '';
            return html`
                <sp-textfield
                    multiline
                    grows
                    value=${value}
                    placeholder=${ifDefined(meta.placeholder)}
                    maxlength=${ifDefined(meta.maxLength)}
                    ?invalid=${hasError}
                    @input=${(e) => this.handleFieldChange(fieldName, e.target.value)}
                >
                    ${helpText ? html`<sp-help-text slot="help-text">${helpText}</sp-help-text>` : ''}
                    ${errors && errors.length > 0
                        ? html`<sp-help-text slot="negative-help-text">${errors.join(', ')}</sp-help-text>`
                        : ''}
                </sp-textfield>
            `;
        }

        if (meta.type === 'select' && meta.options) {
            return html`
                <sp-picker value=${value} @change=${(e) => this.handleFieldChange(fieldName, e.target.value)}>
                    <sp-menu>
                        ${meta.options.map((option) => html` <sp-menu-item value=${option}> ${option} </sp-menu-item> `)}
                    </sp-menu>
                    ${meta.description ? html`<sp-help-text slot="help-text">${meta.description}</sp-help-text>` : ''}
                </sp-picker>
            `;
        }

        if (meta.type === 'boolean') {
            return html`
                <sp-picker
                    value=${value === true || value === 'true' ? 'true' : 'false'}
                    @change=${(e) => this.handleFieldChange(fieldName, e.target.value === 'true')}
                >
                    <sp-menu>
                        <sp-menu-item value="true">Yes</sp-menu-item>
                        <sp-menu-item value="false">No</sp-menu-item>
                    </sp-menu>
                    ${meta.description ? html`<sp-help-text slot="help-text">${meta.description}</sp-help-text>` : ''}
                </sp-picker>
            `;
        }

        if (meta.type === 'integer') {
            return html`
                <sp-textfield
                    type="number"
                    value=${value}
                    placeholder=${ifDefined(meta.placeholder)}
                    min=${ifDefined(meta.min)}
                    ?invalid=${hasError}
                    @input=${(e) => this.handleFieldChange(fieldName, parseInt(e.target.value, 10))}
                ></sp-textfield>
                <div class="field-description">${meta.description}</div>
            `;
        }

        return html`
            <sp-textfield
                value=${value}
                placeholder=${ifDefined(meta.placeholder)}
                maxlength=${ifDefined(meta.maxLength)}
                pattern=${ifDefined(meta.pattern?.source)}
                ?invalid=${hasError}
                @input=${(e) => this.handleFieldChange(fieldName, e.target.value)}
            ></sp-textfield>
            <div class="field-description">${meta.description}</div>
        `;
    }

    renderField(fieldName) {
        const meta = getFieldMetadata(fieldName);
        const errors = this.validationErrors[fieldName];

        return html`
            <div class="field-group">
                <div class="field-header">
                    <sp-field-label for=${fieldName} size="s">
                        ${meta.label} ${meta.required ? html`<span class="required-indicator">*</span>` : ''}
                    </sp-field-label>
                    <sp-action-button class="info-button" quiet size="xs">
                        <sp-icon-info slot="icon"></sp-icon-info>
                        <sp-tooltip self-managed placement="right">${meta.tooltip}</sp-tooltip>
                    </sp-action-button>
                </div>

                ${this.renderFieldInput(fieldName, meta)}
                ${errors && errors.length > 0 ? html` <div class="field-error">${errors.join(', ')}</div> ` : ''}
            </div>
        `;
    }

    renderValidationSummary() {
        const errorCount = Object.keys(this.validationErrors).length;
        if (errorCount === 0) return '';

        const errorMessages = Object.entries(this.validationErrors).flatMap(([field, errors]) =>
            errors.map((error) => {
                const meta = getFieldMetadata(field);
                return `${meta.label}: ${error}`;
            }),
        );

        return html`
            <div class="validation-summary">
                <div class="validation-summary-title">
                    ${errorCount} validation ${errorCount === 1 ? 'error' : 'errors'} found
                </div>
                <ul class="validation-summary-list">
                    ${errorMessages.map((msg) => html`<li>${msg}</li>`)}
                </ul>
            </div>
        `;
    }

    render() {
        if (!this.open) return html``;

        const modeConfig = this.getModeConfig();
        const fieldNames = Object.keys(this.editedData).filter((fieldName) => {
            const meta = getFieldMetadata(fieldName);
            return meta.showInModal !== false;
        });

        return html`
            <style>
                ${MasProductFeedDialog.styles.cssText}
            </style>
            <div class="product-feed-dialog-overlay">
                <sp-dialog-wrapper
                    ?open=${this.open}
                    headline="Review & Edit Product Feed Data"
                    size="l"
                    underlay
                    @close=${this.handleCancel}
                    no-divider
                >
                    <sp-dialog size="l">
                        <div class="dialog-content">
                            <div class="mode-badge ${modeConfig.class}">${modeConfig.label}</div>

                            <div class="warning-box ${modeConfig.class}">
                                <span class="warning-icon"> ${modeConfig.class === 'prod' ? '⚠️' : 'ℹ️'} </span>
                                <span>${modeConfig.warning}</span>
                            </div>

                            ${this.renderValidationSummary()}

                            <div class="fields-container">${fieldNames.map((fieldName) => this.renderField(fieldName))}</div>
                        </div>

                        <div class="dialog-actions">
                            <sp-button variant="secondary" @click=${this.handleCancel}> Cancel </sp-button>
                            <sp-button
                                variant="accent"
                                @click=${this.handleConfirm}
                                ?disabled=${Object.keys(this.validationErrors).length > 0}
                            >
                                Confirm & Send
                            </sp-button>
                        </div>
                    </sp-dialog>
                </sp-dialog-wrapper>
            </div>
        `;
    }
}

customElements.define('mas-product-feed-dialog', MasProductFeedDialog);
