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
        disabled: { type: Boolean },
        selected: { type: Array },
        expanded: { type: Boolean, state: true },
        applying: { type: Boolean, state: true },
    };

    #dialogOpen = false;
    #confirmed = false;
    #emptyOnOpen = true;

    constructor() {
        super();
        this.label = '';
        this.heading = '';
        this.addLabel = '';
        this.description = '';
        this.required = false;
        this.readonly = false;
        this.disabled = false;
        this.selected = [];
        this.expanded = true;
        this.applying = false;
    }

    get showEmptyState() {
        return this.#dialogOpen ? this.#emptyOnOpen : this.selected.length === 0;
    }

    get selectedList() {
        return [...this.selected].sort().join(', ');
    }

    get requiredIcon() {
        return this.required ? html`<sp-icon-asterisk100></sp-icon-asterisk100>` : nothing;
    }

    #open = () => {
        this.#emptyOnOpen = this.showEmptyState;
        this.#confirmed = false;
        this.#dialogOpen = true;
        this.dispatchEvent(new Event('open'));
    };

    #isOwnDialogEvent({ target, currentTarget }) {
        return target === currentTarget;
    }

    #closeDialog(dialog) {
        dialog.dispatchEvent(new Event('close', { bubbles: true, composed: true }));
    }

    async #settle(pending) {
        this.applying = true;
        try {
            return await pending;
        } catch {
            return false;
        } finally {
            this.applying = false;
        }
    }

    #confirm = async (event) => {
        if (!this.#isOwnDialogEvent(event) || this.applying) return;
        const dialog = event.currentTarget;
        const confirmEvent = new CustomEvent('confirm', { detail: {} });
        this.dispatchEvent(confirmEvent);
        const { pending } = confirmEvent.detail;
        if (pending && !(await this.#settle(pending))) return;
        this.#confirmed = true;
        this.#closeDialog(dialog);
    };

    #cancel = (event) => {
        if (!this.#isOwnDialogEvent(event) || this.applying) return;
        this.#closeDialog(event.currentTarget);
    };

    #blockEscapeWhileApplying = (event) => {
        if (event.key !== 'Escape') return;
        if (this.applying) {
            event.preventDefault();
            return;
        }
        this.#closeDialog(event.currentTarget);
    };

    #handleClose = async (event) => {
        if (!this.#isOwnDialogEvent(event) || !this.#dialogOpen) return;
        if (!this.#confirmed) this.dispatchEvent(new Event('cancel'));
        const wasEmpty = this.showEmptyState;
        this.#dialogOpen = false;
        this.requestUpdate();
        await this.updateComplete;
        if (this.showEmptyState !== wasEmpty) this.shadowRoot.querySelector('.edit-button, .add-button')?.focus();
    };

    #toggleExpanded = () => {
        this.expanded = !this.expanded;
    };

    renderOverlay(trigger) {
        return html`
            <overlay-trigger type="modal" triggered-by="click">
                <sp-dialog-wrapper
                    class="selector-dialog"
                    slot="click-content"
                    headline=${this.heading}
                    confirm-label=${this.applying ? 'Confirming…' : 'Confirm'}
                    aria-busy=${this.applying}
                    cancel-label="Cancel"
                    underlay
                    no-divider
                    @confirm=${this.#confirm}
                    @cancel=${this.#cancel}
                    @keydown=${this.#blockEscapeWhileApplying}
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
                            label=${this.addLabel}
                            class="ghost-button add-button"
                            ?disabled=${this.disabled || this.readonly}
                            @click=${this.#open}
                        >
                            <sp-icon-add size="xxl" slot="icon"></sp-icon-add>
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
            <div class="selected-header">
                <h2>
                    ${this.label}
                    <span>(${this.selected.length})</span>
                    ${this.requiredIcon}
                </h2>
                <div>
                    ${this.readonly
                        ? nothing
                        : this.renderOverlay(html`
                              <sp-action-button
                                  slot="trigger"
                                  class="edit-button"
                                  quiet
                                  ?disabled=${this.disabled}
                                  @click=${this.#open}
                              >
                                  <sp-icon-edit slot="icon" label="Edit"></sp-icon-edit>
                                  Edit
                              </sp-action-button>
                          `)}
                    <sp-button
                        icon-only
                        label=${this.label}
                        class="toggle-btn ghost-button"
                        aria-expanded=${this.expanded}
                        @click=${this.#toggleExpanded}
                    >
                        <sp-icon-chevron-down slot="icon"></sp-icon-chevron-down>
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
