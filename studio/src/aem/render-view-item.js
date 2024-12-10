import { html, LitElement } from 'lit';

class RenderViewItem extends LitElement {
    static properties = {
        fragment: {
            type: Object,
        },
    };

    createRenderRoot() {
        return this;
    }

    render() {
        return html` <div class="render-card">
            <div class="render-card-header">
                <div class="render-card-actions"></div>
                <mas-fragment-status
                    variant=${this.fragment.statusVariant}
                ></mas-fragment-status>
            </div>
            <overlay-trigger placement="top"
                ><merch-card
                    class="${this.fragment.selected ? 'selected' : ''}"
                    slot="trigger"
                >
                    <aem-fragment
                        fragment="${this.fragment.id}"
                        ims
                        author
                    ></aem-fragment>
                    <sp-status-light
                        size="l"
                        variant="${this.fragment.statusVariant}"
                    ></sp-status-light>
                    <div
                        class="overlay"
                        @click=${() => this.fragment.toggleSelection()}
                    >
                        <sp-icon-remove size="l"></sp-icon-remove>
                        <sp-icon-add size="l"></sp-icon-add>
                    </div>
                </merch-card>
                <sp-tooltip slot="hover-content" placement="top"
                    >Double click the card to start editing.</sp-tooltip
                >
            </overlay-trigger>
        </div>`;
    }
}

customElements.define('render-view-item', RenderViewItem);
