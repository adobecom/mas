import { LitElement, html, nothing } from 'lit';
import { STATUS_PUBLISHED, TAG_STATUS_DRAFT } from '../constants.js';
import Store from '../store.js';
import ReactiveController from '../reactivity/reactive-controller.js';
import { MasRepository } from '../mas-repository.js';
import { removeFromIndexFragment, publishPlaceholder } from './mas-placeholders-repository.js';
import { confirmation } from '../mas-confirm-dialog.js';
import { showToast } from '../utils.js';
import { FragmentStore } from '../reactivity/fragment-store.js';
import { Placeholder } from '../aem/placeholder.js';
import { getDefaultLocaleCode } from '../../../io/www/src/fragment/locales.js';
import '@spectrum-web-components/help-text/sp-help-text.js';
import '../rte/rte-field.js';

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
        // Also react to previewByLocale so the "duplicates baseline" hint appears once the baseline
        // dictionary finishes loading.
        this.reactiveController = new ReactiveController(this, [this.placeholderStore, Store.placeholders.previewByLocale]);
    }

    updated(changedProps) {
        super.updated(changedProps);
        // Needed to avoid using "unsafeHtml" in the rte-field
        if (this.editing && this.placeholder.isRichText) this.initializeRteField();
    }

    initializeRteField() {
        const rteField = this.querySelector('rte-field');
        if (!rteField) return;
        if (!rteField.initialized) {
            rteField.innerHTML = this.placeholder.getFieldValue('richTextValue');
            rteField.initialized = true;
        }
    }

    /** @type {MasRepository} */
    get repository() {
        return document.querySelector('mas-repository');
    }

    /** @type {Placeholder} */
    get placeholder() {
        // Return null if placeholderStore is not initialized
        if (!this.placeholderStore) {
            return null;
        }
        return this.placeholderStore.get();
    }

    // #region Handlers

    handleKeyChange(event) {
        this.placeholderStore.updateField('key', [event.target.value || '']);
    }

    handleValueChange(event) {
        this.placeholderStore.updateField('value', [event.target.value || '']);
    }

    handleRteValueChange(event) {
        this.placeholderStore.updateField('richTextValue', [event.target.value || '']);
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
        if (!(await removeFromIndexFragment(this.placeholder))) return;
        this.repository.deleteFragment(this.placeholder, {
            startToast: false,
            endToast: false,
        });
    }

    async onPublish(event) {
        if (this.placeholder.status === STATUS_PUBLISHED) return;
        this.toggleDropdown(this.placeholder.key, event);
        showToast('Publishing placeholder...');
        const success = await publishPlaceholder(this.placeholder);
        if (success) {
            const updatedPlaceholder = {
                ...this.placeholder,
                status: STATUS_PUBLISHED,
            };
            this.placeholderStore.refreshFrom(updatedPlaceholder);
        }
    }

    preventSelection(event) {
        event.stopPropagation();
    }

    // #endregion

    /** Placeholder base locale for the edited locale (region flag applied), e.g. en_US for en_AU. */
    get baseLocale() {
        return getDefaultLocaleCode(Store.surface(), Store.localeOrRegion());
    }

    /** True when this placeholder's value is identical to the value inherited from the base language. */
    get duplicatesBaseline() {
        const locale = Store.localeOrRegion();
        const { baseLocale } = this;
        // When editing the base language itself there is nothing to inherit from.
        if (!baseLocale || baseLocale === locale) return false;
        const baseline = Store.placeholders.previewByLocale.get()?.[baseLocale];
        const { key, value } = this.placeholder;
        return Boolean(baseline) && key in baseline && baseline[key] === value;
    }

    get duplicateWarning() {
        if (this.editing || !this.duplicatesBaseline) return nothing;
        return html`<sp-help-text size="s" variant="negative" class="duplicate-warning">
            exactly same value exists in default language '${this.baseLocale}', you can safely delete that placeholder
        </sp-help-text>`;
    }

    render() {
        // Guard clause: Don't render if placeholderStore is not initialized
        if (!this.placeholderStore) {
            return html``;
        }

        return html`
            <sp-table-row value=${this.placeholder.key}>
                ${this.keyCell} ${this.valueCell} ${this.statusCell} ${this.renderTableCell(Store.localeOrRegion(), 'right')}
                ${this.renderTableCell(this.placeholder.updatedBy, 'right', 'updated-by', true)}
                ${this.renderTableCell(this.placeholder.updatedAt, 'right')} ${this.actionCell}
            </sp-table-row>
        `;
    }

    /**
     * Renders a table cell with optional tooltip
     * @param {string} content - Cell content
     * @returns {TemplateResult} - HTML template
     */
    renderTableCell(content = '', align = '', className = '', forceTooltip = false) {
        const needsTooltip = forceTooltip || content.length > 50;
        const value = content.length > 50 ? `${content.substring(0, 47)}...` : content;
        return html`
            <sp-table-cell class="${className} ${align === 'right' ? 'align-right' : ''}"
                >${html`<overlay-trigger placement="top"
                    ><div class="cell-content" slot="trigger">${value}</div>
                    ${needsTooltip
                        ? html`<sp-tooltip slot="hover-content" placement="top">${content}</sp-tooltip>`
                        : nothing}</overlay-trigger
                >`}
            </sp-table-cell>
        `;
    }

    get keyCell() {
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

    get valueCell() {
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
                    <div class="rich-text-cell" .innerHTML=${this.placeholder.value}></div>
                    ${this.duplicateWarning}
                </sp-table-cell>
            `;
        }

        const content = this.placeholder.value ?? '';
        const needsTooltip = content.length > 50;
        const value = content.length > 50 ? `${content.substring(0, 47)}...` : content;
        return html`
            <sp-table-cell class="value">
                <overlay-trigger placement="top">
                    <div class="cell-content" slot="trigger">${value}</div>
                    ${needsTooltip ? html`<sp-tooltip slot="hover-content" placement="top">${content}</sp-tooltip>` : nothing}
                </overlay-trigger>
                ${this.duplicateWarning}
            </sp-table-cell>
        `;
    }

    get statusCell() {
        return html`
            <sp-table-cell>
                <div class="status-cell">
                    <mas-fragment-status variant="${this.placeholder.statusVariant}"></mas-fragment-status>
                </div>
            </sp-table-cell>
        `;
    }

    get actionCell() {
        if (this.editing) {
            return html`
                <sp-table-cell class="action-cell">
                    <div class="action-buttons">
                        <button
                            class="action-button approve-button"
                            @click=${this.onSave}
                            aria-label="Save changes"
                            ?disabled=${!this.placeholder.hasChanges || this.disabled}
                        >
                            <sp-icon-checkmark size="m"></sp-icon-checkmark>
                        </button>
                        <button
                            class="action-button reject-button"
                            @click=${this.onCancel}
                            aria-label="Cancel editing"
                            ?disabled=${this.disabled}
                        >
                            <sp-icon-close size="m"></sp-icon-close>
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
                        @click=${(event) => this.toggleEditing(this.placeholder.key, event)}
                        aria-label="Edit placeholder"
                        ?disabled=${this.disabled}
                    >
                        <sp-icon-edit size="m"></sp-icon-edit>
                    </button>
                    <div class="dropdown-menu-container">
                        <button
                            class="action-button action-menu-button"
                            @click=${(event) => this.toggleDropdown(this.placeholder.key, event)}
                            @mousedown=${this.preventSelection}
                            aria-label="More options"
                            ?disabled=${this.disabled}
                        >
                            <sp-icon-more size="m"></sp-icon-more>
                        </button>
                        ${this.activeDropdown
                            ? html`
                                  <div class="dropdown-menu">
                                      <div
                                          class="dropdown-item ${this.placeholder.status === STATUS_PUBLISHED
                                              ? 'disabled'
                                              : ''}"
                                          @click=${this.onPublish}
                                      >
                                          <sp-icon-publish size="m"></sp-icon-publish>
                                          <span>Publish</span>
                                      </div>
                                      <div class="dropdown-item" @click="${this.onDelete}">
                                          <sp-icon-delete size="m"></sp-icon-delete>
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
