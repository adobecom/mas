import { LitElement, html, css, nothing } from 'lit';
import { store } from '../store/ost-store.js';

const DISABLE_OPTIONS = [
    { key: 'displayRecurrence', label: 'Term' },
    { key: 'displayPerUnit', label: 'Unit' },
    { key: 'displayTax', label: 'Tax Label' },
    { key: 'forceTaxExclusive', label: 'Include Tax' },
    { key: 'displayOldPrice', label: 'Old price' },
];

export class OstPlaceholderOptions extends LitElement {
    static properties = {
        open: { type: Boolean, state: true },
    };

    static styles = css`
        :host {
            font-family: inherit;
            display: block;
        }

        .options-toggle {
            appearance: none;
            background: none;
            border: none;
            padding: 4px 0;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 11px;
            font-weight: 700;
            color: var(--spectrum-gray-600);
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .options-toggle .chevron {
            transition: transform 0.15s ease;
        }

        .options-toggle[aria-expanded='true'] .chevron {
            transform: rotate(90deg);
        }

        .disable-group {
            display: flex;
            flex-wrap: wrap;
            gap: 8px 16px;
            margin-top: 8px;
        }
    `;

    constructor() {
        super();
        this.open = false;
        this.handleStoreChange = this.handleStoreChange.bind(this);
    }

    connectedCallback() {
        super.connectedCallback();
        store.subscribe(this.handleStoreChange);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        store.unsubscribe(this.handleStoreChange);
    }

    handleStoreChange() {
        this.requestUpdate();
    }

    // Legacy "Disable" semantics: a box is checked when its option is off
    // (value false). This holds uniformly, including "Include Tax"
    // (forceTaxExclusive) — checked when forceTaxExclusive is false.
    isChecked(key) {
        return !store.placeholderOptions[key];
    }

    toggle(key, checked) {
        store.toggleOption(key, !checked);
    }

    render() {
        return html`
            <button
                type="button"
                class="options-toggle"
                data-testid="ost-options-toggle"
                aria-expanded=${this.open ? 'true' : 'false'}
                @click=${() => (this.open = !this.open)}
            >
                <span class="chevron" aria-hidden="true">›</span>
                Options
            </button>
            ${this.open
                ? html`
                      <div class="disable-group" role="group" aria-label="Disable">
                          ${DISABLE_OPTIONS.map(
                              ({ key, label }) => html`
                                  <sp-checkbox
                                      data-testid="ost-disable-${key}"
                                      size="s"
                                      ?checked=${this.isChecked(key)}
                                      @change=${(e) => this.toggle(key, e.target.checked)}
                                      >${label}</sp-checkbox
                                  >
                              `,
                          )}
                      </div>
                  `
                : nothing}
        `;
    }
}

customElements.define('ost-placeholder-options', OstPlaceholderOptions);
