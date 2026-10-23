import { html, LitElement, nothing } from 'lit';
import styles from './mas-baselines.css.js';
import { BASELINE_CREATE_TYPE } from '../constants.js';
import '../mas-create-dialog.js';

class MasBaselines extends LitElement {
    static styles = styles;

    static properties = {
        createDialogOpen: { state: true },
    };

    constructor() {
        super();
        this.createDialogOpen = false;
    }

    render() {
        return html`<div class="page-container list-page">
            <div class="baselines-header">
                <h1>Baselines</h1>
                <sp-button variant="accent" @click=${() => (this.createDialogOpen = true)}>
                    <sp-icon-add slot="icon"></sp-icon-add>
                    Create Baseline
                </sp-button>
            </div>
            <sp-divider size="s"></sp-divider>
            ${this.createDialogOpen
                ? html`<mas-create-dialog
                      type=${BASELINE_CREATE_TYPE}
                      @close=${() => (this.createDialogOpen = false)}
                  ></mas-create-dialog>`
                : nothing}
        </div> `;
    }
}

customElements.define('mas-baselines', MasBaselines);
