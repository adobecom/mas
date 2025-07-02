import { LitElement, html, css, nothing } from 'lit';
import { EVENT_KEYDOWN } from './constants.js';
import ReactiveController from './reactivity/reactive-controller.js';

class MasSelectionPanel extends LitElement {
    static styles = css`
        sp-action-bar {
            bottom: 10px;
            left: 50%;
            transform: translateX(-50%);
        }
    `;

    static properties = {
        open: { type: Boolean, attribute: true },
        selectionStore: { type: Object, attribute: false },
        onDuplicate: { type: Function, attribute: false },
        onDelete: { type: Function, attribute: false },
        onPublish: { type: Function, attribute: false },
        onUnpublish: { type: Function, attribute: false },
    };

    constructor() {
        super();

        this.open = false;
        this.selectionStore = null;
        this.onDuplicate = null;
        this.onDelete = null;
        this.onPublish = null;
        this.onUnpublish = null;

        this.close = this.close.bind(this);
    }

    connectedCallback() {
        super.connectedCallback();
        window.addEventListener(EVENT_KEYDOWN, this.close);
        this.reactiveController = new ReactiveController(this, [this.selectionStore]);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        window.removeEventListener(EVENT_KEYDOWN, this.close);
    }

    close(event) {
        if (!this.open) return;
        if (event instanceof KeyboardEvent && event.code !== 'Escape') return;
        this.dispatchEvent(new CustomEvent('close'));
        this.selectionStore.set([]);
    }

    get selection() {
        return this.selectionStore.get();
    }

    // #region Handlers

    handleDuplicate(event) {
        this.onDuplicate(this.selection, event);
    }

    handleDelete(event) {
        this.onDelete(this.selection, event);
    }

    handlePublish(event) {
        this.onPublish(this.selection, event);
    }

    handleUnpublish(event) {
        this.onUnpublish(this.selection, event);
    }

    // #endregion

    render() {
        const count = this.selection.length;
        return html`<sp-action-bar emphasized ?open=${this.open} variant="fixed" @close=${this.close}>
            ${count} selected
            ${count === 1
                ? html`<sp-action-button
                      slot="buttons"
                      label="Duplicate"
                      ?disabled=${!this.onDuplicate}
                      @click=${this.handleDuplicate}
                  >
                      <sp-icon-duplicate slot="icon"></sp-icon-duplicate>
                      <sp-tooltip self-managed placement="top">Duplicate</sp-tooltip>
                  </sp-action-button>`
                : nothing}
            ${count > 0
                ? html`<sp-action-button slot="buttons" label="Delete" ?disabled=${!this.onDelete} @click=${this.handleDelete}>
                      <sp-icon-delete-outline slot="icon"></sp-icon-delete-outline>
                      <sp-tooltip self-managed placement="top">Delete</sp-tooltip>
                  </sp-action-button>`
                : nothing}
            ${count > 0
                ? html`<sp-action-button
                      slot="buttons"
                      label="Publish"
                      ?disabled=${!this.onPublish}
                      @click=${this.handlePublish}
                  >
                      <sp-icon-publish-check slot="icon"></sp-icon-publish-check>
                      <sp-tooltip self-managed placement="top">Publish</sp-tooltip>
                  </sp-action-button>`
                : nothing}
            ${count > 0
                ? html`<sp-action-button
                      slot="buttons"
                      label="Unpublish"
                      ?disabled=${!this.onUnpublish}
                      @click=${this.handleUnpublish}
                  >
                      <sp-icon-publish-remove slot="icon"></sp-icon-publish-remove>
                      <sp-tooltip self-managed placement="top">Unpublish</sp-tooltip>
                  </sp-action-button>`
                : nothing}
        </sp-action-bar>`;
    }
}

customElements.define('mas-selection-panel', MasSelectionPanel);
