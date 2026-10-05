import { LitElement, html, nothing } from 'lit';
import { styles } from './mas-grouped-selector.css.js';

class MasGroupedSelector extends LitElement {
    static styles = styles;

    static properties = {
        label: { type: String },
        heading: { type: String },
        addLabel: { type: String, attribute: 'add-label' },
        description: { type: String },
        required: { type: Boolean },
        readonly: { type: Boolean },
        selected: { type: Array },
        expanded: { type: Boolean, state: true },
        showEmptyState: { type: Boolean, state: true },
    };

    #dialogOpen = false;
    #confirmed = false;

    constructor() {
        super();
        this.label = '';
        this.heading = '';
        this.addLabel = '';
        this.description = '';
        this.required = false;
        this.readonly = false;
        this.selected = [];
        this.expanded = false;
        this.showEmptyState = true;
    }

    willUpdate(changed) {
        if (changed.has('selected') && !this.#dialogOpen) this.#syncEmptyState();
    }

    get selectedList() {
        return [...this.selected].sort().join(', ');
    }

    get requiredIcon() {
        return this.required ? html`<sp-icon-asterisk100></sp-icon-asterisk100>` : nothing;
    }

    #syncEmptyState() {
        this.showEmptyState = this.selected.length === 0;
    }

    #open = () => {
        this.#confirmed = false;
        this.#dialogOpen = true;
        this.dispatchEvent(new Event('open'));
    };

    #closeDialog(target) {
        target.dispatchEvent(new Event('close', { bubbles: true, composed: true }));
    }

    #confirm = ({ target }) => {
        this.#confirmed = true;
        this.dispatchEvent(new Event('confirm'));
        this.#closeDialog(target);
    };

    #cancel = ({ target }) => {
        this.#closeDialog(target);
    };

    #handleClose = () => {
        if (!this.#confirmed) {
            this.#confirmed = true;
            this.dispatchEvent(new Event('cancel'));
        }
        this.#dialogOpen = false;
        this.requestUpdate('selected');
    };

    #toggleExpanded = (event) => {
        if (event.composedPath().some((node) => node.localName === 'overlay-trigger')) return;
        this.expanded = !this.expanded;
    };

    renderOverlay(trigger) {
        return html`
            <overlay-trigger type="modal" triggered-by="click">
                <sp-dialog-wrapper
                    class="selector-dialog"
                    slot="click-content"
                    headline=${this.heading}
                    confirm-label="Confirm"
                    cancel-label="Cancel"
                    underlay
                    no-divider
                    @confirm=${this.#confirm}
                    @cancel=${this.#cancel}
                    @close=${this.#handleClose}
                >
                    <slot></slot>
                </sp-dialog-wrapper>
                ${trigger}
            </overlay-trigger>
        `;
    }

    get emptyStateTemplate() {
        return html`
            <h2>${this.heading} ${this.requiredIcon}</h2>
            <div class="empty-state">
                <div class="icon">
                    ${this.renderOverlay(html`
                        <sp-button
                            slot="trigger"
                            variant="secondary"
                            size="xl"
                            icon-only
                            class="ghost-button add-button"
                            @click=${this.#open}
                        >
                            <sp-icon-add size="xxl" slot="icon" label=${this.addLabel}></sp-icon-add>
                        </sp-button>
                    `)}
                </div>
                <div class="label">
                    <strong>${this.addLabel}</strong><br />
                    <span>${this.description}</span>
                </div>
            </div>
        `;
    }

    get selectedTemplate() {
        return html`
            <div class="selected-header" @click=${this.#toggleExpanded}>
                <h2>
                    ${this.label}
                    <span>(${this.selected.length})</span>
                    ${this.requiredIcon}
                </h2>
                <div>
                    ${this.readonly
                        ? nothing
                        : this.renderOverlay(html`
                              <sp-action-button slot="trigger" class="edit-button" quiet @click=${this.#open}>
                                  <sp-icon-edit slot="icon" label="Edit"></sp-icon-edit>
                                  Edit
                              </sp-action-button>
                          `)}
                    <sp-button icon-only class="toggle-btn ghost-button" aria-expanded=${this.expanded}>
                        <sp-icon-chevron-down slot="icon" label=${this.expanded ? 'Close' : 'Open'}></sp-icon-chevron-down>
                    </sp-button>
                </div>
            </div>
            ${this.expanded ? html`<div class="selected-list">${this.selectedList}</div>` : nothing}
        `;
    }

    render() {
        return this.showEmptyState ? this.emptyStateTemplate : this.selectedTemplate;
    }
}

customElements.define('mas-grouped-selector', MasGroupedSelector);
