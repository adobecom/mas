import { css, html, LitElement } from 'lit';
import { EVENT_CHANGE } from '../constants.js';
import '../mas-backgrounds-modal.js';

class BackgroundsField extends LitElement {
    static get properties() {
        return {
            desktop: { type: String, reflect: true },
            tablet: { type: String, reflect: true },
            mobile: { type: String, reflect: true },
            modalOpen: { type: Boolean, state: true },
        };
    }

    static styles = css`
        :host {
            display: block;
        }

        .summary {
            display: flex;
            flex-direction: column;
            gap: 4px;
            margin-bottom: 8px;
            font-size: 14px;
            color: var(--spectrum-gray-900);
        }

        .summary .row {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            border: 1px solid var(--spectrum-gray-300);
            border-radius: 4px;
            padding: 8px 12px;
            background: var(--spectrum-gray-75, #fff);
        }

        :host([data-field-state='overridden']) .summary {
            border: 2px solid var(--spectrum-blue-400);
            background-color: var(--spectrum-blue-100);
            border-radius: 8px;
            padding: 8px;
        }
    `;

    constructor() {
        super();
        this.desktop = '';
        this.tablet = '';
        this.mobile = '';
        this.modalOpen = false;
    }

    get value() {
        return {
            desktop: this.desktop ?? '',
            tablet: this.tablet ?? '',
            mobile: this.mobile ?? '',
        };
    }

    get #hasAnyValue() {
        return Boolean(this.desktop || this.tablet || this.mobile);
    }

    #handleButtonClick() {
        this.modalOpen = true;
    }

    #handleModalClose() {
        this.modalOpen = false;
    }

    #handleModalSave(event) {
        const { desktop, tablet, mobile } = event.detail;
        this.desktop = desktop;
        this.tablet = tablet;
        this.mobile = mobile;
        this.modalOpen = false;

        this.dispatchEvent(
            new CustomEvent(EVENT_CHANGE, {
                bubbles: true,
                composed: true,
                detail: this,
            }),
        );
    }

    #renderSummaryRow(label, value) {
        return value ? html`<div class="row">${label}: ${value}</div>` : '';
    }

    render() {
        return html`
            ${this.#hasAnyValue
                ? html`
                      <div class="summary">
                          ${this.#renderSummaryRow('Desktop', this.desktop)} ${this.#renderSummaryRow('Tablet', this.tablet)}
                          ${this.#renderSummaryRow('Mobile', this.mobile)}
                      </div>
                  `
                : ''}
            <sp-button variant="secondary" treatment="outline" @click=${this.#handleButtonClick}>
                ${this.#hasAnyValue ? 'Edit backgrounds' : 'Add backgrounds'}
            </sp-button>

            <mas-backgrounds-modal
                ?open=${this.modalOpen}
                .desktop=${this.desktop}
                .tablet=${this.tablet}
                .mobile=${this.mobile}
                @modal-close=${this.#handleModalClose}
                @save=${this.#handleModalSave}
            ></mas-backgrounds-modal>
        `;
    }
}

customElements.define('mas-backgrounds-field', BackgroundsField);
