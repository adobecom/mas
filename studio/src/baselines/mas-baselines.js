import { html, LitElement } from 'lit';
import styles from './mas-baselines.css.js';
import { canEditBaselines } from '../groups.js';

class MasBaselines extends LitElement {
    static styles = styles;

    static properties = {
        canEdit: { type: Boolean },
    };

    willUpdate() {
        this.canEdit = canEditBaselines();
    }

    render() {
        return html`<div class="editor-container">
            <div class="baselines-header">
                <h2>Baselines</h2>
                <sp-button ?disabled="${!this.canEdit}" variant="accent" class="create-button" }>
                    <sp-icon-add slot="icon"></sp-icon-add>
                    Create project
                </sp-button>
            </div>
            <div class="baselines-divider"></div>
        </div> `;
    }
}

customElements.define('mas-baselines', MasBaselines);
