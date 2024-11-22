import { LitElement, html, nothing } from 'lit';
import StoreController from './reactiveStore/storeController.js';
import Store from './store.js';

class MasSelectionPanel extends LitElement {
    constructor() {
        super();
        this.close = this.close.bind(this);
    }

    selecting = new StoreController(this, Store.selecting);
    selection = new StoreController(this, Store.selection);

    connectedCallback() {
        super.connectedCallback();
        window.addEventListener('keydown', this.close);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        window.removeEventListener('keydown', this.close);
    }

    close(event) {
        if (event instanceof KeyboardEvent && event.code !== 'Escape') return;
        Store.selecting.set(false);
        Store.selection.set([]);
    }

    render() {
        const count = this.selection.value.length;
        return html`<sp-action-bar
            emphasized
            ?open=${this.selecting.value}
            variant="fixed"
            @close=${this.close}
        >
            ${count} selected
            ${count === 1
                ? html`<sp-action-button
                      slot="buttons"
                      label="Duplicate"
                      disabled
                  >
                      <sp-icon-duplicate slot="icon"></sp-icon-duplicate>
                      <sp-tooltip self-managed placement="top"
                          >Duplicate</sp-tooltip
                      >
                  </sp-action-button>`
                : nothing}
            ${count > 0
                ? html`<sp-action-button slot="buttons" label="Delete" disabled>
                      <sp-icon-delete-outline
                          slot="icon"
                      ></sp-icon-delete-outline>
                      <sp-tooltip self-managed placement="top"
                          >Delete</sp-tooltip
                      >
                  </sp-action-button>`
                : nothing}
            ${count > 0
                ? html`<sp-action-button
                      slot="buttons"
                      label="Publish"
                      disabled
                  >
                      <sp-icon-publish-check
                          slot="icon"
                      ></sp-icon-publish-check>
                      <sp-tooltip self-managed placement="top"
                          >Publish</sp-tooltip
                      >
                  </sp-action-button>`
                : nothing}
            ${count > 0
                ? html`<sp-action-button
                      slot="buttons"
                      label="Unpublish"
                      disabled
                  >
                      <sp-icon-publish-remove
                          slot="icon"
                      ></sp-icon-publish-remove>
                      <sp-tooltip self-managed placement="top"
                          >Unpublish</sp-tooltip
                      >
                  </sp-action-button>`
                : nothing}
        </sp-action-bar>`;
    }
}

customElements.define('mas-selection-panel', MasSelectionPanel);
