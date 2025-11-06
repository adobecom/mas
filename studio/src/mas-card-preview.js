import { html, LitElement, nothing } from 'lit';
import ReactiveController from './reactivity/reactive-controller.js';
import Store from './store.js';

class MasCardPreview extends LitElement {
    constructor() {
        super();
        this.reactiveController = new ReactiveController(this, [Store.preview]);
    }

    get id() {
        return Store.preview.value.id;
    }

    get positionStyle() {
        let styleString = '';
        for (const [key, value] of Object.entries(Store.preview.value.position)) {
            if (value === undefined) continue;
            styleString += `${key}:${value};`;
        }
        return styleString;
    }

    createRenderRoot() {
        return this;
    }

    async updated() {
        if (!this.id) return;
        await this.querySelector('aem-fragment').updateComplete;
        await this.querySelector('merch-card').checkReady();
        this.querySelector('sp-progress-circle')?.remove();
    }

    render() {
        if (!this.id) return nothing;
        return html`<div class="preview-container">
            <div class="preview-backdrop"></div>
            <div class="preview-popover" style=${this.positionStyle}>
                <div class="preview-content">
                    <merch-card>
                        <aem-fragment author ims fragment="${this.id}"></aem-fragment>
                    </merch-card>
                    <sp-progress-circle class="preview" indeterminate size="l"></sp-progress-circle>
                </div>
            </div>
        </div>`;
    }
}

customElements.define('mas-card-preview', MasCardPreview);

function openPreview(id, position) {
    Store.preview.set({ id, position });
}

function closePreview() {
    Store.preview.set(null);
}

export { openPreview, closePreview };
