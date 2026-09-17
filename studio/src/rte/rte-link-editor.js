import { LitElement, css, html, nothing } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { CHECKOUT_CTA_TEXTS, ANALYTICS_LINK_IDS } from '../constants.js';
import { summarizeCtaKeyIssues } from '../editors/variation-utils.js';
import { HEADLESS_LINK_VARIANTS, resolveHeadlessDisplayVariant } from './link-variant-utils.js';

export class RteLinkEditor extends LitElement {
    static properties = {
        open: { type: Boolean },
        dialog: { type: Boolean },
        href: { type: String },
        text: { type: String },
        title: { type: String },
        target: { type: String },
        variant: { type: String },
        ariaLabel: { type: String },
        checkoutParameters: {
            type: String,
            attribute: 'checkout-parameters',
            reflect: true,
        },
        linkType: { type: String, attribute: 'link-type', reflect: true },
        linkAttrs: { type: Object },
        analyticsId: {
            type: String,
            attribute: 'data-analytics-id',
            reflect: true,
        },
        ctaRef: { type: String, attribute: 'cta-ref' },
        parentCtas: { type: Array },
        isVariation: { type: Boolean, attribute: 'is-variation' },
        showCtaReference: { type: Boolean, attribute: 'show-cta-reference' },
        ctaKeyIssues: { type: Object },
        isHeadlessCta: { type: Boolean, attribute: 'is-headless-cta' },
    };

    static styles = css`
        :host {
            display: block;
        }

        sp-underlay:not([open]) + sp-dialog {
            display: none;
        }

        sp-underlay + sp-dialog {
            --spectrum-dialog-confirm-divider-block-spacing-start: 0;
            --spectrum-dialog-confirm-buttongroup-padding-top: 20px;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 2000;
            background: var(--spectrum-white);
            border-radius: 16px;
        }

        sp-dialog {
            width: 100%;
            max-width: 750px;
        }

        sp-dialog {
            width: 100%;
            max-width: 600px;
        }

        :host([checkout-parameters]) sp-dialog {
            max-width: 770px;
        }

        .tab-panel {
            display: flex;
            flex-direction: column;
            margin-top: 8px;
        }

        sp-textfield {
            width: 480px;
        }

        sp-link {
            display: inline-flex;
            align-items: center;
            border-radius: 16px;
            padding: 0 4px;
        }

        sp-button.selected,
        sp-link.selected {
            outline: 2px dashed var(--spectrum-blue-700);
            outline-offset: 2px;
        }

        .cta-reference {
            display: flex;
            align-items: end;
            gap: 8px;
            width: 480px;
            max-width: 100%;
        }

        .cta-reference sp-textfield {
            flex: 1 1 auto;
            width: auto;
            min-width: 0;
        }

        .cta-reference sp-picker {
            flex: 0 0 auto;
        }

        .cta-reference-error {
            margin-top: 6px;
            font-size: 12px;
            line-height: 16px;
            color: var(--spectrum-red-800, #d31510);
        }

        .cta-reference-error sp-link {
            color: inherit;
            font: inherit;
        }
    `;

    constructor() {
        super();
        this.dialog = false;
        this.href = '';
        this.text = '';
        this.title = '';
        this.ariaLabel = '';
        this.checkoutParameters = undefined;
        this.variant = 'accent';
        this.target = '_self';
        this.open = true;
        this.linkType = null;
        this.analyticsId = '';
        this.ctaRef = '';
        this.parentCtas = [];
        this.isVariation = false;
        this.showCtaReference = false;
        this.ctaKeyIssues = { missingCount: 0, duplicateKeys: [], hasIssues: false };
        this.isHeadlessCta = false;
    }

    get #checkoutParametersField() {
        if (this.checkoutParameters === undefined) return nothing;
        return html` <sp-field-label for="checkoutParameters">Checkout Parameters</sp-field-label>
            <sp-textfield
                id="checkoutParameters"
                placeholder="Extra checkout parameters: e.g: promoid=12345&mv=1"
                .value=${this.checkoutParameters}
                @input=${(e) => (this.checkoutParameters = e.target.value)}
            ></sp-textfield>`;
    }

    get checkoutParametersElement() {
        return this.shadowRoot.querySelector('#checkoutParameters');
    }

    get #linkHrefField() {
        if (this.checkoutParameters !== undefined) return nothing;
        return html`
            <sp-field-label for="linkHref">Link URL</sp-field-label>
            <sp-textfield
                id="linkHref"
                placeholder="https://"
                .value=${this.href}
                @input=${(e) => (this.href = e.target.value)}
                @change=${() => (this.text = this.text || this.href)}
            ></sp-textfield>
        `;
    }

    get linkHrefElement() {
        return this.shadowRoot.querySelector('#linkHref');
    }

    get #isCheckoutLink() {
        return this.checkoutParameters !== undefined;
    }

    get #analyticsIdField() {
        const options = this.#isCheckoutLink ? Object.keys(CHECKOUT_CTA_TEXTS) : [...ANALYTICS_LINK_IDS];
        options.push('');
        return html` <sp-field-label for="analyticsId">Analytics Id</sp-field-label>
            <sp-picker id="analyticsId" .value=${this.analyticsId} @change=${(e) => (this.analyticsId = e.target.value)}>
                <sp-menu> ${options.map((option) => html`<sp-menu-item value="${option}">${option}</sp-menu-item>`)} </sp-menu>
            </sp-picker>`;
    }

    get linkAnalyticsIdElement() {
        return this.shadowRoot.querySelector('#analyticsId');
    }

    get #ctaKeyIssuesNotice() {
        if (!this.ctaKeyIssues?.hasIssues) return nothing;
        const summary = summarizeCtaKeyIssues(this.ctaKeyIssues);
        // On a variation the broken CTAs live in the base fragment and can only be fixed there;
        // on a baseline the author can normalize this field's own keys in place.
        if (this.isVariation) {
            return html`<div class="cta-reference-error" role="alert">
                Base fragment CTAs need fixing (${summary}). References may not resolve until the base fragment is corrected.
            </div>`;
        }
        return html`<div class="cta-reference-error" role="alert">
            This CTA field has reference issues (${summary}).
            <sp-link href="#" @click=${this.#handleFixCtaKeys}>Fix references</sp-link>
        </div>`;
    }

    get #ctaReferenceField() {
        if (!this.showCtaReference) return nothing;
        // The reference key is generated on creation; it is always read-only.
        // On a variation, a picker lets the author align it to a parent baseline CTA.
        if (!this.isVariation) {
            return html` <sp-field-label for="ctaRef">CTA reference</sp-field-label>
                <sp-textfield id="ctaRef" readonly .value=${this.ctaRef}></sp-textfield>
                ${this.#ctaKeyIssuesNotice}`;
        }
        const options = this.parentCtas.filter((cta) => cta.key);
        return html` <sp-field-label for="ctaRef">CTA reference</sp-field-label>
            <div class="cta-reference">
                <sp-textfield id="ctaRef" readonly .value=${this.ctaRef}></sp-textfield>
                <sp-picker
                    id="ctaRefPicker"
                    label="Pick parent CTA"
                    .value=${this.ctaRef}
                    @change=${(e) => (this.ctaRef = e.target.value)}
                >
                    <sp-menu>
                        ${options.map((cta) => html`<sp-menu-item value="${cta.key}">${cta.text || cta.key}</sp-menu-item>`)}
                    </sp-menu>
                </sp-picker>
            </div>
            ${this.#ctaKeyIssuesNotice}`;
    }

    #handleFixCtaKeys(e) {
        e?.preventDefault();
        this.dispatchEvent(new CustomEvent('fix-cta-keys', { bubbles: true, composed: true }));
    }

    get ctaRefElement() {
        return this.shadowRoot.querySelector('#ctaRef');
    }

    get ctaKeyIssuesElement() {
        return this.shadowRoot.querySelector('.cta-reference-error');
    }

    get #headlessLinkVariants() {
        const displayVariant = resolveHeadlessDisplayVariant(this.variant);
        return html`
            <sp-field-label for="linkVariant">Variant</sp-field-label>
            <sp-button-group id="linkVariant">
                ${HEADLESS_LINK_VARIANTS.map(({ value, label }) => {
                    const emphasisStyle =
                        value === 'primary' ? 'font-weight:700' : value === 'secondary' ? 'font-style:italic' : '';
                    return value === 'secondary-link'
                        ? html`<sp-link
                              class=${classMap({ selected: displayVariant === value })}
                              @click=${(e) => {
                                  e.preventDefault();
                                  this.variant = value;
                              }}
                              href="#"
                              >${label}</sp-link
                          >`
                        : html`<sp-button
                              class=${classMap({ selected: displayVariant === value })}
                              style=${emphasisStyle}
                              @click=${() => (this.variant = value)}
                              variant=${value}
                              >${label}</sp-button
                          >`;
                })}
            </sp-button-group>
        `;
    }

    get #linkVariants() {
        if (this.isHeadlessCta) return this.#headlessLinkVariants;
        return html`
            <sp-field-label for="linkVariant">Variant</sp-field-label>
            <sp-button-group id="linkVariant">
                ${this.linkType === 'web'
                    ? html`<sp-button
                              class=${classMap({
                                  selected: this.variant === 'accent',
                              })}
                              @click=${() => (this.variant = 'accent')}
                              variant="accent"
                              >Accent</sp-button
                          >
                          <sp-button
                              @click=${() => (this.variant = 'primary')}
                              class=${classMap({
                                  selected: this.variant === 'primary',
                              })}
                              variant="primary"
                              >Primary</sp-button
                          >
                          <sp-button
                              @click=${() => (this.variant = 'primary-outline')}
                              class=${classMap({
                                  selected: this.variant === 'primary-outline',
                              })}
                              treatment="outline"
                              variant="primary"
                              >Primary outline</sp-button
                          >
                          <sp-button
                              class=${classMap({
                                  selected: this.variant === 'secondary',
                              })}
                              @click=${() => (this.variant = 'secondary')}
                              variant="secondary"
                              >Secondary</sp-button
                          >
                          <sp-button
                              @click=${() => (this.variant = 'secondary-outline')}
                              class=${classMap({
                                  selected: this.variant === 'secondary-outline',
                              })}
                              treatment="outline"
                              variant="secondary"
                              >Secondary outline</sp-button
                          >`
                    : ''}
                <sp-link
                    class=${classMap({
                        selected: this.variant === 'primary-link',
                    })}
                    @click=${(e) => {
                        e.preventDefault();
                        this.variant = 'primary-link';
                    }}
                    href="#"
                    >Primary link</sp-link
                >
                <sp-link
                    class=${classMap({
                        selected: this.variant === 'secondary-link',
                    })}
                    @click=${(e) => {
                        e.preventDefault();
                        this.variant = 'secondary-link';
                    }}
                    href="#"
                    variant="secondary"
                    >Secondary link</sp-link
                >
            </sp-button-group>
        `;
    }

    get linkTitleElement() {
        return this.shadowRoot.querySelector('#linkTitle');
    }

    get linkTextElement() {
        return this.shadowRoot.querySelector('#linkText');
    }

    get linkTargetElement() {
        return this.shadowRoot.querySelector('#linkTarget');
    }

    get isPhone() {
        return this.linkType === 'phone';
    }

    get headingLinkLabel() {
        return this.isPhone ? 'Phone Link' : this.#isCheckoutLink ? 'Checkout Link' : 'Link';
    }

    get #editor() {
        return html`<sp-dialog>
            <h2 slot="heading">Insert/Edit ${this.headingLinkLabel}</h2>
            <sp-tabs id="linkTypeNav" selected="${this.linkType}" @change=${this.#handleTypeChange}>
                <sp-tab label="Web" value="web"></sp-tab>
                <sp-tab label="Phone" value="phone"></sp-tab>
                <sp-tab-panel value="web">
                    <div class="tab-panel">
                        ${this.#linkHrefField} ${this.#checkoutParametersField}
                        <sp-field-label for="linkText">Link Text</sp-field-label>
                        <sp-textfield
                            id="linkText"
                            placeholder="Display text"
                            .value=${this.text}
                            @input=${(e) => (this.text = e.target.value)}
                        ></sp-textfield>

                        <sp-field-label for="linkTitle">Title</sp-field-label>
                        <sp-textfield
                            id="linkTitle"
                            placeholder="Link title"
                            .value=${this.title}
                            @input=${(e) => (this.title = e.target.value)}
                        ></sp-textfield>

                        <sp-field-label for="linkAriaLabel">Aria Label</sp-field-label>
                        <sp-textfield
                            id="linkAriaLabel"
                            placeholder="Accessible label for screen readers"
                            .value=${this.ariaLabel}
                            @input=${(e) => (this.ariaLabel = e.target.value)}
                        ></sp-textfield>

                        <sp-field-label for="linkTarget">Target</sp-field-label>
                        <sp-picker id="linkTarget" .value=${this.target} @change=${(e) => (this.target = e.target.value)}>
                            <sp-menu>
                                <sp-menu-item value="_self">Same Window</sp-menu-item>
                                <sp-menu-item value="_blank">New Window</sp-menu-item>
                                <sp-menu-item value="_parent">Parent Frame</sp-menu-item>
                                <sp-menu-item value="_top">Top Frame</sp-menu-item>
                            </sp-menu>
                        </sp-picker>
                        ${this.#analyticsIdField} ${this.#ctaReferenceField}
                    </div>
                </sp-tab-panel>
                <sp-tab-panel value="phone">
                    <div class="tab-panel">
                        <sp-field-label for="phoneNumber">Phone Number</sp-field-label>
                        <sp-textfield
                            id="phoneNumber"
                            type="tel"
                            placeholder="Display text"
                            .value=${this.text}
                            @input=${(e) => (this.text = e.target.value)}
                        ></sp-textfield>

                        <sp-field-label for="linkTitle">Title</sp-field-label>
                        <sp-textfield
                            id="linkTitle"
                            placeholder="Link title"
                            .value=${this.title}
                            @input=${(e) => (this.title = e.target.value)}
                        ></sp-textfield>

                        <sp-field-label for="phoneAriaLabel">Aria Label</sp-field-label>
                        <sp-textfield
                            id="phoneAriaLabel"
                            placeholder="Accessible label for screen readers"
                            .value=${this.ariaLabel}
                            @input=${(e) => (this.ariaLabel = e.target.value)}
                        ></sp-textfield>
                    </div>
                </sp-tab-panel>
            </sp-tabs>
            ${this.#linkVariants}
            <sp-button
                id="cancelButton"
                slot="button"
                variant="secondary"
                treatment="outline"
                @click=${this.#handleClose}
                type="button"
                >Cancel</sp-button
            >
            <sp-button id="saveButton" slot="button" variant="accent" @click=${this.#handleSave}>Save</sp-button>
        </sp-dialog>`;
    }

    get #asDialog() {
        return html`
            <sp-underlay ?open=${this.open}></sp-underlay>
            ${this.#editor}
        `;
    }

    render() {
        if (this.dialog) return this.#asDialog;
        return this.#editor;
    }

    #handleTypeChange(e) {
        if (e.target.nodeName !== 'SP-TABS') return;
        this.linkType = e.target.selected;
    }

    #handleSave(e) {
        e.preventDefault();

        const href = this.isPhone ? `tel:${this.text.replace(/ /g, '')}` : this.href;

        const data = {
            href,
            text: this.text,
            title: this.title,
            target: this.target,
            variant: this.variant,
            analyticsId: this.analyticsId,
        };

        // Only include ariaLabel if it has a value
        if (this.ariaLabel) {
            data.ariaLabel = this.ariaLabel;
        }

        if (this.showCtaReference) {
            data.ctaRef = this.ctaRef;
        }

        if (this.checkoutParameters !== undefined) {
            delete data.href;
            Object.assign(data, {
                checkoutParameters: this.checkoutParameters,
            });
        }
        this.dispatchEvent(
            new CustomEvent('save', {
                bubbles: true,
                composed: true,
                detail: data,
            }),
        );
        this.#handleClose();
    }

    #handleClose() {
        this.open = false;
        this.dispatchEvent(new CustomEvent('close', { bubbles: false, composed: true }));
    }
}

customElements.define('rte-link-editor', RteLinkEditor);
