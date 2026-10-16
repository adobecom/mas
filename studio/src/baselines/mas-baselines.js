import { html, LitElement } from 'lit';
import styles from './mas-baselines.css.js';
import { canEditBaselines } from '../groups.js';
import Store from '../store.js';
import ReactiveController from '../reactivity/reactive-controller.js';

class MasBaselines extends LitElement {
    static styles = styles;

    reactivity = new ReactiveController(this, [Store.profile, Store.users]);

    get canEdit() {
        return canEditBaselines();
    }

    render() {
        return html`<div class="editor-container">
            <div class="baselines-header">
                <h2>Baselines</h2>
                <sp-button ?disabled=${!this.canEdit} variant="accent">
                    <sp-icon-add slot="icon"></sp-icon-add>
                    Create project
                </sp-button>
            </div>
            <sp-divider size="s"></sp-divider>
        </div> `;
    }
}

customElements.define('mas-baselines', MasBaselines);
