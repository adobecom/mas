import { html, LitElement } from 'lit';
import styles from './mas-baselines.css.js';

class MasBaselines extends LitElement {
    static styles = styles;

    render() {
        return html`<div class="editor-container">
            <div class="baselines-header">
                <h2>Baselines</h2>
                <sp-button variant="accent">
                    <sp-icon-add slot="icon"></sp-icon-add>
                    Create Baseline
                </sp-button>
            </div>
            <sp-divider size="s"></sp-divider>
        </div> `;
    }
}

customElements.define('mas-baselines', MasBaselines);
