import { LitElement, html, css } from 'lit';
import { store } from '../store/ost-store.js';

const DISABLE_OPTIONS = [
    { key: 'displayFormatted', label: 'HTML Format' },
    { key: 'displayRecurrence', label: 'Term' },
    { key: 'displayPerUnit', label: 'Unit' },
    { key: 'displayTax', label: 'Tax Label' },
    { key: 'forceTaxExclusive', label: 'Include Tax' },
    { key: 'displayOldPrice', label: 'Old price' },
];

export class OstPlaceholderOptions extends LitElement {
    static styles = css`
        :host {
            font-family: inherit;
            display: block;
        }

        .disable-label {
            font-size: 12px;
            color: var(--spectrum-gray-700);
            margin-bottom: 4px;
        }

        .disable-group {
            display: flex;
            flex-wrap: wrap;
            gap: 8px 16px;
        }
    `;

    constructor() {
        super();
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
        store.setPlaceholderOptions({ ...store.placeholderOptions, [key]: !checked });
    }

    render() {
        return html`
            <div class="disable-label">Disable</div>
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
        `;
    }
}

customElements.define('ost-placeholder-options', OstPlaceholderOptions);
