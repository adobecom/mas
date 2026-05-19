import { LitElement, html, css } from 'lit';
import '@spectrum-web-components/switch/sp-switch.js';
import { store } from '../store/ost-store.js';

const OPTION_LABELS = {
    displayFormatted: 'Format as currency',
    displayRecurrence: 'Show billing period',
    displayPerUnit: 'Show per-license label',
    displayTax: 'Show tax label',
    forceTaxExclusive: 'Exclude tax from price',
    displayOldPrice: 'Show original price',
};

export class MasOstPlaceholderOptions extends LitElement {
    static styles = css`
        :host {
            font-family: inherit;
            display: flex;
            flex-direction: column;
        }

        .option-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            height: 40px;
            padding: 0 12px;
            border-bottom: 1px solid var(--spectrum-gray-100);
        }

        .option-row:last-child {
            border-bottom: none;
        }

        .option-label {
            font-size: 14px;
            color: var(--spectrum-gray-800);
        }
    `;

    get controller() {
        const root = this.getRootNode();
        const panel = root?.host?.tagName === 'MAS-OST-PLACEHOLDER-PANEL'
            ? root.host
            : null;
        return panel?.placeholderCtrl;
    }

    render() {
        const ctrl = this.controller;
        if (!ctrl) return html``;
        const opts = ctrl.options;
        return html`
            ${Object.entries(OPTION_LABELS).map(
                ([key, label]) => html`
                    <div class="option-row">
                        <span class="option-label">${label}</span>
                        <sp-switch
                            size="s"
                            ?checked=${key === 'forceTaxExclusive' ? !opts[key] : !!opts[key]}
                            @change=${(e) => {
                                if (key === 'forceTaxExclusive') {
                                    ctrl.options[key] = !e.target.checked;
                                } else {
                                    ctrl.options[key] = e.target.checked;
                                }
                                ctrl.host.requestUpdate();
                                store.notify();
                            }}
                        ></sp-switch>
                    </div>
                `,
            )}
        `;
    }
}

customElements.define('mas-ost-placeholder-options', MasOstPlaceholderOptions);
