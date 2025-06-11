import { LitElement, html, nothing } from 'lit';
import { STATUS_PUBLISHED, TAG_STATUS_DRAFT } from '../constants.js';
import Store from '../store.js';
import ReactiveController from '../reactivity/reactive-controller.js';
import { MasRepository } from '../mas-repository.js';
import { confirmation } from '../mas-confirm-dialog.js';
import { showToast } from '../utils.js';
import { FragmentStore } from '../reactivity/fragment-store.js';
import { Placeholder } from '../aem/placeholder.js';

class MasPlaceholdersItem extends LitElement {
    static properties = {
        placeholderStore: { type: Object, reflect: false },
        editing: { type: Boolean, attribute: true },
        disabled: { type: Boolean, attribute: true },
        activeDropdown: { type: Boolean, attribute: 'active-dropdown' },
        toggleEditing: { type: Function, reflect: false },
        toggleDropdown: { type: Function, reflect: false },
        updatePending: { type: Function, reflect: false },
    };

    createRenderRoot() {
        return this;
    }

    constructor() {
        super();
        /** @type {FragmentStore} */
        this.placeholderStore = null;
        this.editing = false;
        this.disabled = false;
        this.activeDropdown = false;
        this.toggleEditing = null;
        this.toggleDropdown = null;
        this.updatePending = null;

        this.handleRteValueChange = this.handleRteValueChange.bind(this);
    }

    connectedCallback() {
        super.connectedCallback();
        this.reactiveController = new ReactiveController(this, [
            this.placeholderStore,
        ]);
    }

    updated(changedProps) {
        super.updated(changedProps);
        // Needed to avoid using "unsafeHtml" in the rte-field
        if (this.editing && this.placeholder.isRichText)
            this.initializeRteField();
    }

    initializeRteField() {
        const rteField = this.querySelector('rte-field');
        if (!rteField) return;
        if (!rteField.initialized) {
            rteField.innerHTML =
                this.placeholder.getFieldValue('richTextValue');
            rteField.initialized = true;
        }
    }

    /** @type {MasRepository} */
    get repository() {
        return document.querySelector('mas-repository');
    }

    /** @type {Placeholder} */
    get placeholder() {
        return this.placeholderStore.get();
    }

    get locale() {
        return Store.filters.get().locale;
    }

    // #region Handlers

    handleKeyChange(event) {
        this.placeholderStore.updateField('key', [event.target.value || '']);
    }

    handleValueChange(event) {
        this.placeholderStore.updateField('value', [event.target.value || '']);
    }

    handleRteValueChange(event) {
        this.placeholderStore.updateField('richTextValue', [
            event.target.value || '',
        ]);
    }

    async onSave(event) {
        event.stopPropagation();
        this.updatePending(true);
        this.placeholderStore.updateField('tags', [TAG_STATUS_DRAFT]);
        await this.repository.saveFragment(this.placeholderStore);
        this.toggleEditing(this.placeholder.key);
        this.updatePending(false);
    }

    onCancel(event) {
        this.placeholderStore.discardChanges();
        this.toggleEditing(this.placeholder.key, event);
    }

    async onDelete(event) {
        this.updatePending(true);
        this.toggleDropdown(this.placeholder.key, event);
        const confirmed = await confirmation({
            title: 'Delete placeholder',
            content: `Are you sure you want to delete the placeholder "${this.placeholder.key}"? This action cannot be undone.`,
            confirmLabel: 'Delete',
        });
        if (!confirmed) return;
        showToast('Deleting placeholder...');
        if (
            !(await this.repository.removeFromIndexFragment(
                this.placeholder,
                true,
            ))
        )
            return;
        this.repository.deleteFragment(this.placeholder, {
            startToast: false,
            endToast: false,
        });
    }

    async onPublish(event) {
        if (this.placeholder.status === STATUS_PUBLISHED) return;
        this.toggleDropdown(this.placeholder.key, event);
        showToast('Publishing placeholder...');
        await this.repository.publishFragment(this.placeholder);
        const updatedPlaceholder = {
            ...this.placeholder,
            status: STATUS_PUBLISHED,
        };
        this.placeholderStore.refreshFrom(updatedPlaceholder);
    }

    preventSelection(event) {
        event.stopPropagation();
    }

    // #endregion

    render() {
        return html`
            <sp-table-row value=${this.placeholder.key}>
                ${this.renderKeyCell()} ${this.renderValueCell()}
                ${this.renderStatusCell()}
                ${this.renderTableCell(this.locale, 'right')}
                ${this.renderTableCell(
                    this.placeholder.updatedBy,
                    'right',
                    'updated-by',
                    true,
                )}
                ${this.renderTableCell(this.placeholder.updatedAt, 'right')}
                ${this.renderActionCell()}
            </sp-table-row>
        `;
    }

    /**
     * Renders a table cell with optional tooltip
     * @param {string} content - Cell content
     * @returns {TemplateResult} - HTML template
     */
    renderTableCell(
        content = '',
        align = '',
        className = '',
        forceTooltip = false,
    ) {
        const needsTooltip = forceTooltip || content.length > 50;
        const value =
            content.length > 50 ? `${content.substring(0, 47)}...` : content;
        return html`
            <sp-table-cell
                class=${className}
                style="${align === 'right' ? 'text-align: right;' : ''}"
                >${html`<overlay-trigger placement="top"
                    ><div class="cell-content" slot="trigger">${value}</div>
                    ${needsTooltip
                        ? html`<sp-tooltip slot="hover-content" placement="top"
                              >${content}</sp-tooltip
                          >`
                        : nothing}</overlay-trigger
                >`}
            </sp-table-cell>
        `;
    }

    renderKeyCell() {
        if (this.editing) {
            return html`
                <sp-table-cell class="editing-cell key">
                    <div class="edit-field-container">
                        <sp-textfield
                            placeholder="Key"
                            .value=${this.placeholder.key}
                            @input=${this.handleKeyChange}
                            @click=${this.preventSelection}
                            ?disabled=${this.disabled}
                        ></sp-textfield>
                    </div>
                </sp-table-cell>
            `;
        }
        return this.renderTableCell(this.placeholder.key, '', 'key');
    }

    renderValueCell() {
        if (this.editing) {
            return html`
                <sp-table-cell class="editing-cell value">
                    <div class="edit-field-container">
                        ${this.placeholder.isRichText
                            ? html`
                                  <div class="rte-container">
                                      <rte-field
                                          link
                                          .maxLength=${500}
                                          @change=${this.handleRteValueChange}
                                          @click=${this.preventSelection}
                                      ></rte-field>
                                  </div>
                              `
                            : html`<sp-textfield
                                  placeholder="Value"
                                  .value=${this.placeholder.value}
                                  @input=${this.handleValueChange}
                                  @click=${this.preventSelection}
                                  ?disabled=${this.disabled}
                              ></sp-textfield>`}
                    </div>
                </sp-table-cell>
            `;
        }

        if (this.placeholder.isRichText) {
            return html`
                <sp-table-cell class="value">
                    <div
                        class="rich-text-cell"
                        .innerHTML=${this.placeholder.value}
                    ></div>
                </sp-table-cell>
            `;
        }

        return this.renderTableCell(this.placeholder.value, '', 'value');
    }

    renderStatusCell() {
        return html`
            <sp-table-cell>
                <div class="status-cell">
                    <mas-fragment-status
                        variant="${this.placeholder.statusVariant}"
                    ></mas-fragment-status>
                </div>
            </sp-table-cell>
        `;
    }

    renderActionCell() {
        if (this.editing) {
            return html`
                <sp-table-cell class="action-cell">
                    <div class="action-buttons">
                        <button
                            class="action-button approve-button"
                            @click=${this.onSave}
                            aria-label="Save changes"
                            ?disabled=${!this.placeholder.hasChanges ||
                            this.disabled}
                        >
                            <sp-icon-checkmark></sp-icon-checkmark>
                        </button>
                        <button
                            class="action-button reject-button"
                            @click=${this.onCancel}
                            aria-label="Cancel editing"
                            ?disabled=${this.disabled}
                        >
                            <sp-icon-close></sp-icon-close>
                        </button>
                    </div>
                </sp-table-cell>
            `;
        }

        return html`
            <sp-table-cell class="action-cell">
                <div class="action-buttons">
                    <button
                        class="action-button approve-button"
                        @click=${(event) =>
                            this.toggleEditing(this.placeholder.key, event)}
                        aria-label="Edit placeholder"
                        ?disabled=${this.disabled}
                    >
                        <sp-icon-edit></sp-icon-edit>
                    </button>
                    <div class="dropdown-menu-container">
                        <button
                            class="action-button action-menu-button"
                            @click=${(event) =>
                                this.toggleDropdown(
                                    this.placeholder.key,
                                    event,
                                )}
                            @mousedown=${this.preventSelection}
                            aria-label="More options"
                            ?disabled=${this.disabled}
                        >
                            <sp-icon-more></sp-icon-more>
                        </button>
                        ${this.activeDropdown
                            ? html`
                                  <div class="dropdown-menu">
                                      <div
                                          class="dropdown-item ${this
                                              .placeholder.status ===
                                          STATUS_PUBLISHED
                                              ? 'disabled'
                                              : ''}"
                                          @click=${this.onPublish}
                                      >
                                          <sp-icon-publish-check></sp-icon-publish-check>
                                          <span>Publish</span>
                                      </div>
                                      <div
                                          class="dropdown-item"
                                          @click="${this.onDelete}"
                                      >
                                          <sp-icon-delete></sp-icon-delete>
                                          <span>Delete</span>
                                      </div>
                                  </div>
                              `
                            : nothing}
                    </div>
                </div>
            </sp-table-cell>
        `;
    }
}

customElements.define('mas-placeholders-item', MasPlaceholdersItem);
