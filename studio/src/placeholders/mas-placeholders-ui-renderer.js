import { html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import Store from '../store.js';
import { MasPlaceholders } from './mas-placeholders.js';

export class MasPlaceholdersUIRenderer extends MasPlaceholders {
    constructor() {
        // Don't actually call the parent constructor since we're just using this class for its methods
        // We'll instantiate it from the parent and then bind its methods
        if (new.target === MasPlaceholdersUIRenderer) {
            throw new Error('This class should not be instantiated directly');
        }
        // Don't call super() here since we don't want a full LitElement instance

        this.activeDropdown = null;
        this.isDialogOpen = false;
        this.confirmDialogConfig = null;
        this.isBulkDeleteInProgress = false;

        this.handleClickOutside = this.handleClickOutside.bind(this);
        this.handleCreateModalClickOutside = this.handleCreateModalClickOutside.bind(this);
    }

    handleClickOutside(event) {
        if (
            this.activeDropdown &&
            !event.target.closest('.dropdown-menu') &&
            !event.target.closest('.action-menu-button') &&
            !event.target.closest('.dropdown-item')
        ) {
            this.activeDropdown = null;
        }
    }

    handleCreateModalClickOutside(event) {
        if (
            this.showCreateModal &&
            !event.target.closest('.create-modal-content') &&
            !event.target.closest('.create-button')
        ) {
            if (event.target.closest('.create-modal-overlay')) {
                return;
            }
            this.closeCreateModal();
        }
    }

    toggleDropdown(key, event) {
        if (event) {
            event.stopPropagation();
            event.preventDefault();
        }

        if (this.activeDropdown === key) {
            this.activeDropdown = null;
        } else {
            this.activeDropdown = key;
        }

        this.requestUpdate();
    }

    /**
     * Display a dialog for confirmation
     * @param {string} title - Dialog title
     * @param {string} message - Dialog message
     * @param {Object} options - Additional options
     * @returns {Promise<boolean>} - True if confirmed, false if canceled
     */
    async showDialog(title, message, options = {}) {
        if (this.isDialogOpen) {
            return false;
        }

        this.isDialogOpen = true;
        const {
            confirmText = 'OK',
            cancelText = 'Cancel',
            variant = 'primary',
        } = options;

        return new Promise((resolve) => {
            this.confirmDialogConfig = {
                title,
                message,
                confirmText,
                cancelText,
                variant,
                onConfirm: () => {
                    resolve(true);
                },
                onCancel: () => {
                    resolve(false);
                },
            };
        });
    }

    renderError() {
        if (!this.error) return nothing;

        return html`
            <div class="error-message">
                <sp-icon-alert></sp-icon-alert>
                <span>${this.error}</span>
            </div>
        `;
    }

    get loadingIndicator() {
        if (!this.loading) return nothing;
        return html`<sp-progress-circle
            indeterminate
            size="l"
        ></sp-progress-circle>`;
    }

    /**
     * Renders a confirmation dialog
     * @returns {TemplateResult} - HTML template
     */
    renderConfirmDialog() {
        if (!this.confirmDialogConfig) return nothing;

        const {
            title,
            message,
            onConfirm,
            onCancel,
            confirmText,
            cancelText,
            variant,
        } = this.confirmDialogConfig;

        return html`
            <div class="confirm-dialog-overlay">
                <sp-dialog-wrapper
                    open
                    underlay
                    id="bulk-delete-confirm-dialog"
                    .heading=${title}
                    .variant=${variant || 'negative'}
                    .confirmLabel=${confirmText}
                    .cancelLabel=${cancelText}
                    @confirm=${() => {
                        this.confirmDialogConfig = null;
                        this.isDialogOpen = false;
                        onConfirm && onConfirm();
                    }}
                    @cancel=${() => {
                        this.confirmDialogConfig = null;
                        this.isDialogOpen = false;
                        onCancel && onCancel();
                    }}
                >
                    <div>${message}</div>
                </sp-dialog-wrapper>
            </div>
        `;
    }

    /**
     * Renders a table cell with optional tooltip
     * @param {string} content - Cell content
     * @returns {TemplateResult} - HTML template
     */
    renderTableCell(content) {
        const value = content || '';
        const needsTooltip = value.length > 50;

        if (needsTooltip) {
            return html`
                <sp-table-cell>
                    <sp-tooltip placement="right">
                        ${value}
                        <div slot="trigger" class="cell-content">
                            ${value.substring(0, 50)}...
                        </div>
                    </sp-tooltip>
                </sp-table-cell>
            `;
        }

        return html`
            <sp-table-cell>
                <div class="cell-content">${value}</div>
            </sp-table-cell>
        `;
    }

    renderKeyCell(placeholder) {
        if (this.editingPlaceholder === placeholder.key) {
            return html`
                <sp-table-cell class="editing-cell">
                    <div class="edit-field-container">
                        <sp-textfield
                            placeholder="Key"
                            .value=${this.editedKey}
                            @input=${this.handleKeyChange}
                        ></sp-textfield>
                    </div>
                </sp-table-cell>
            `;
        }
        return this.renderTableCell(placeholder.key);
    }

    renderValueCell(placeholder) {
        if (this.editingPlaceholder === placeholder.key) {
            return html`
                <sp-table-cell class="editing-cell">
                    <div class="edit-field-container">
                        ${this.editedRichText
                            ? html`
                                  <div class="rte-container">
                                      <rte-field
                                          inline
                                          link
                                          hide-offer-selector
                                          .maxLength=${500}
                                          @change=${this.handleRteValueChange}
                                      ></rte-field>
                                  </div>
                              `
                            : html`<sp-textfield
                                  placeholder="Value"
                                  .value=${this.editedValue}
                                  @input=${this.handleValueChange}
                              ></sp-textfield>`}
                    </div>
                </sp-table-cell>
            `;
        }

        if (placeholder.isRichText) {
            return html`
                <sp-table-cell>
                    <div
                        class="rich-text-cell"
                        .innerHTML=${placeholder.value}
                    ></div>
                </sp-table-cell>
            `;
        }

        return this.renderTableCell(placeholder.displayValue);
    }

    renderStatusCell(placeholder) {
        const status = placeholder.status || 'draft';
        return html`
            <sp-table-cell>
                <div class="status-cell">
                    <mas-fragment-status
                        variant="${status.toLowerCase()}"
                    ></mas-fragment-status>
                </div>
            </sp-table-cell>
        `;
    }

    renderActionCell(placeholder) {
        if (this.editingPlaceholder === placeholder.key) {
            return html`
                <sp-table-cell class="action-cell">
                    <div class="action-buttons">
                        <button
                            class="action-button approve-button"
                            @click=${this.saveEdit}
                            aria-label="Save changes"
                        >
                            <sp-icon-checkmark></sp-icon-checkmark>
                        </button>
                        <button
                            class="action-button reject-button"
                            @click=${this.cancelEdit}
                            aria-label="Cancel editing"
                        >
                            <sp-icon-close></sp-icon-close>
                        </button>
                    </div>
                </sp-table-cell>
            `;
        }

        const dropdownMenu =
            this.activeDropdown === placeholder.key
                ? html`
                      <div class="dropdown-menu">
                          <div
                              class="dropdown-item ${placeholder.published &&
                              !placeholder.modifiedAfterPublished
                                  ? 'disabled'
                                  : ''}"
                              @click=${(e) => {
                                  if (
                                      !placeholder.published ||
                                      placeholder.modifiedAfterPublished
                                  ) {
                                      e.stopPropagation();
                                      this.handlePublish(placeholder.key);
                                  }
                              }}
                          >
                              <sp-icon-publish-check></sp-icon-publish-check>
                              <span>Publish</span>
                          </div>
                          <div
                              class="dropdown-item"
                              @click=${(e) => {
                                  e.stopPropagation();
                                  this.handleDelete(placeholder.key);
                              }}
                          >
                              <sp-icon-delete></sp-icon-delete>
                              <span>Delete</span>
                          </div>
                      </div>
                  `
                : nothing;

        return html`
            <sp-table-cell class="action-cell">
                <div class="action-buttons">
                    <button
                        class="action-button approve-button"
                        @click=${(e) => {
                            e.stopPropagation();
                            this.startEdit(placeholder);
                        }}
                        aria-label="Edit placeholder"
                    >
                        <sp-icon-edit></sp-icon-edit>
                    </button>
                    <div class="dropdown-menu-container">
                        <button
                            class="action-button action-menu-button"
                            @click=${(e) =>
                                this.toggleDropdown(placeholder.key, e)}
                            @mousedown=${(e) => e.stopPropagation()}
                            aria-label="More options"
                        >
                            <sp-icon-more></sp-icon-more>
                        </button>
                        ${dropdownMenu}
                    </div>
                </div>
            </sp-table-cell>
        `;
    }

    renderTableHeader(columns) {
        return html`
            <sp-table-head>
                ${columns.map(
                    ({ key, label, sortable, align }) => html`
                        <sp-table-head-cell
                            ?sortable=${sortable}
                            @click=${sortable
                                ? () => this.handleSort(key)
                                : undefined}
                            style="${align === 'right'
                                ? 'text-align: right;'
                                : ''}"
                        >
                            ${label}
                        </sp-table-head-cell>
                    `,
                )}
            </sp-table-head>
        `;
    }

    getFilteredPlaceholders() {
        let filtered = this.placeholdersData || [];

        if (this.searchQuery) {
            filtered = filtered.filter(
                (placeholder) =>
                    placeholder.key
                        .toLowerCase()
                        .includes(this.searchQuery.toLowerCase()) ||
                    placeholder.displayValue
                        .toLowerCase()
                        .includes(this.searchQuery.toLowerCase()),
            );
        }

        return this.getSortedPlaceholders(filtered);
    }

    getSortedPlaceholders(placeholders) {
        return [...placeholders].sort((a, b) => {
            const aValue = a[this.sortField];
            const bValue = b[this.sortField];

            const comparison = aValue.localeCompare(bValue);
            return this.sortDirection === 'asc' ? comparison : -comparison;
        });
    }

    handleSort(field) {
        if (this.sortField === field) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortDirection = 'asc';
        }
    }

    renderFormGroup(id, label, isRequired, component) {
        return html`
            <div class="form-group">
                <label for=${id}>
                    ${label}
                    ${isRequired
                        ? html`<span class="required">*</span>`
                        : nothing}
                </label>
                ${component}
            </div>
        `;
    }

    renderCreateModal() {
        if (!this.showCreateModal) return nothing;

        const keyField = html`
            <sp-textfield
                id="placeholder-key"
                placeholder="Key"
                .value=${this.newPlaceholder.key}
                @input=${this.handleNewPlaceholderKeyChange}
            ></sp-textfield>
        `;

        const localeField = html`
            <mas-locale-picker
                id="placeholder-locale"
                @locale-changed=${this.handleNewPlaceholderLocaleChange}
            ></mas-locale-picker>
        `;

        const richTextToggle = html`
            <div class="rich-text-toggle">
                <sp-switch
                    id="rich-text-toggle"
                    @change=${this.handleRichTextToggle}
                    .checked=${this.newPlaceholder.isRichText}
                >
                    Rich Text
                </sp-switch>
            </div>
        `;

        const valueField = this.newPlaceholder.isRichText
            ? html`
                  <div class="rte-container">
                      <rte-field
                          id="placeholder-rich-value"
                          inline
                          link
                          hide-offer-selector
                          .maxLength=${500}
                          @change=${this.handleNewPlaceholderRteChange}
                      ></rte-field>
                  </div>
              `
            : html`
                  <sp-textfield
                      id="placeholder-value"
                      placeholder="Value"
                      .value=${this.newPlaceholder.value}
                      @input=${this.handleNewPlaceholderValueChange}
                  ></sp-textfield>
              `;

        setTimeout(() => {
            if (this.newPlaceholder.isRichText) {
                const rteField = this.shadowRoot.querySelector(
                    '#placeholder-rich-value',
                );
                if (rteField) {
                    rteField.innerHTML = this.newPlaceholder.value || '';
                }
            }
        }, 0);

        return html`
            <div
                class="create-modal-overlay"
                @click=${(e) => e.stopPropagation()}
            >
                <div class="create-modal" @click=${(e) => e.stopPropagation()}>
                    <div class="create-modal-content">
                        <h2 class="create-modal-title">Create Placeholder</h2>

                        <div class="create-modal-form">
                            ${this.renderFormGroup(
                                'placeholder-key',
                                'Enter Key',
                                true,
                                keyField,
                            )}
                            ${this.renderFormGroup(
                                'placeholder-locale',
                                'Choose Locale',
                                true,
                                localeField,
                            )}
                            ${richTextToggle}
                            ${this.renderFormGroup(
                                'placeholder-value',
                                'Enter Value',
                                true,
                                valueField,
                            )}
                        </div>

                        <div class="create-modal-actions">
                            <sp-button
                                variant="secondary"
                                @click=${this.closeCreateModal}
                            >
                                Cancel
                            </sp-button>
                            <sp-button
                                variant="accent"
                                @click=${this.createPlaceholder}
                            >
                                Create
                            </sp-button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderPlaceholdersTable() {
        const filteredPlaceholders = this.getFilteredPlaceholders();

        const columns = [
            { key: 'key', label: 'Key', sortable: true },
            { key: 'value', label: 'Value', sortable: true },
            { key: 'status', label: 'Status', sortable: true, priority: true },
            { key: 'locale', label: 'Locale', sortable: true, align: 'right' },
            {
                key: 'updatedBy',
                label: 'Updated by',
                sortable: true,
                align: 'right',
            },
            {
                key: 'updatedAt',
                label: 'Date & Time',
                sortable: true,
                align: 'right',
            },
            { key: 'action', label: 'Action', align: 'right' },
        ];

        if (!filteredPlaceholders || filteredPlaceholders.length === 0) {
            return html`
                <div class="no-placeholders-message">
                    <p>No placeholders found.</p>
                </div>
            `;
        }

        this.ensureTableCheckboxes();

        return html`
            <sp-table
                emphasized
                scroller
                selects="multiple"
                selectable-with="cell"
                .selected=${this.selectedPlaceholders}
                @change=${this.updateTableSelection}
                class="placeholders-table"
            >
                ${this.renderTableHeader(columns)}
                <sp-table-body>
                    ${repeat(
                        filteredPlaceholders,
                        (placeholder) => placeholder.key,
                        (placeholder) => html`
                            <sp-table-row value=${placeholder.key}>
                                ${this.renderKeyCell(placeholder)}
                                ${this.renderValueCell(placeholder)}
                                ${this.renderStatusCell(placeholder)}
                                ${this.renderTableCell(
                                    placeholder.locale,
                                    'right',
                                )}
                                ${this.renderTableCell(
                                    placeholder.updatedBy,
                                    'right',
                                )}
                                ${this.renderTableCell(
                                    placeholder.updatedAt,
                                    'right',
                                )}
                                ${this.renderActionCell(placeholder)}
                            </sp-table-row>
                        `,
                    )}
                </sp-table-body>
            </sp-table>
        `;
    }

    renderPlaceholdersContent() {
        if (!(this.foldersLoaded ?? false)) {
            return html`<div class="loading-container">
                ${this.loadingIndicator}
            </div>`;
        }

        if (this.placeholdersLoading) {
            return html`<div class="loading-container">
                ${this.loadingIndicator}
            </div>`;
        }

        return this.renderPlaceholdersTable();
    }

    /**
     * Check if the bulk action button should be visible
     * @returns {boolean} - True if the button should be visible
     */
    shouldShowBulkAction() {
        return (
            this.selectedPlaceholders.length > 0 &&
            !this.isDialogOpen &&
            !this.loading
        );
    }

    updateTableSelection(event) {
        if (event && event.target) {
            this.selectedPlaceholders = Array.from(event.target.selectedSet);
        }
    }

    /**
     * Ensures that all table rows have checkbox cells
     * This is needed after filtering or when the table is re-rendered
     */
    ensureTableCheckboxes() {
        const table = this.shadowRoot?.querySelector('sp-table');
        if (!table) return;

        const currentSelection = this.selectedPlaceholders;
        this.selectedPlaceholders = [...currentSelection];
        table.selected = this.selectedPlaceholders;

        setTimeout(() => {
            const rows = table.querySelectorAll('sp-table-row');
            rows.forEach((row) => {
                const hasCheckbox = row.querySelector('sp-table-checkbox-cell');
                if (!hasCheckbox) {
                    const checkboxCell = document.createElement(
                        'sp-table-checkbox-cell',
                    );
                    checkboxCell.emphasized = true;
                    checkboxCell.checked = this.selectedPlaceholders.includes(
                        row.value,
                    );

                    row.insertAdjacentElement('afterbegin', checkboxCell);
                }
            });

            const tableHead = table.querySelector('sp-table-head');
            if (tableHead) {
                const headHasCheckbox = tableHead.querySelector(
                    'sp-table-checkbox-cell',
                );
                if (!headHasCheckbox) {
                    const headCheckbox = document.createElement(
                        'sp-table-checkbox-cell',
                    );
                    headCheckbox.headCell = true;
                    headCheckbox.emphasized = true;

                    const allRowValues = Array.from(rows).map(
                        (row) => row.value,
                    );
                    const allSelected =
                        allRowValues.length > 0 &&
                        allRowValues.every((value) =>
                            this.selectedPlaceholders.includes(value),
                        );
                    headCheckbox.checked = allSelected;

                    tableHead.insertAdjacentElement('afterbegin', headCheckbox);
                }
            }
        }, 0);
    }

    /**
     * Handle bulk delete of selected placeholders
     */
    async handleBulkDelete() {
        if (this.isBulkDeleteInProgress || this.isDialogOpen) {
            return;
        }

        const placeholdersToDelete = [...this.selectedPlaceholders];
        this.selectedPlaceholders = [];

        if (!placeholdersToDelete.length) return;

        const confirmed = await this.showDialog(
            'Delete Placeholders',
            `Are you sure you want to delete ${placeholdersToDelete.length} placeholders? This action cannot be undone.`,
            {
                confirmText: 'Delete',
                cancelText: 'Cancel',
                variant: 'negative',
            },
        );

        if (!confirmed) return;

        this.isBulkDeleteInProgress = true;
        Store.placeholders.list.loading.set(true);
        this.placeholdersLoading = true;
        this.showToast(
            `Deleting ${placeholdersToDelete.length} placeholders...`,
            'info',
        );

        const successfulDeletes = [];
        const failedDeletes = [];

        try {
            const placeholderObjects = this.placeholdersData.filter((p) =>
                placeholdersToDelete.includes(p.key),
            );

            for (const placeholder of placeholderObjects) {
                try {
                    if (placeholder.fragment) {
                        const fragmentData = placeholder.fragment;
                        const fragmentPath = fragmentData.path;

                        if (!fragmentPath.endsWith('/index')) {
                            const dictionaryPath = fragmentPath.substring(
                                0,
                                fragmentPath.lastIndexOf('/'),
                            );
                            try {
                                await this.removeFromIndexFragment(
                                    dictionaryPath,
                                    fragmentData,
                                );
                            } catch (error) {}
                        }

                        const repository = this.repository;
                        if (!repository) {
                            throw new Error('Repository component not found');
                        }

                        await repository.deleteFragment(fragmentData, {
                            isInEditStore: false,
                            refreshPlaceholders: false,
                        });

                        successfulDeletes.push(placeholder.key);
                    } else {
                        failedDeletes.push(placeholder.key);
                    }
                } catch (error) {
                    failedDeletes.push(placeholder.key);
                }
            }

            const updatedPlaceholders = this.placeholdersData.filter(
                (p) => !successfulDeletes.includes(p.key),
            );

            Store.placeholders.list.data.set(updatedPlaceholders);
            this.placeholdersData = updatedPlaceholders;

            if (successfulDeletes.length > 0) {
                if (failedDeletes.length > 0) {
                    this.showToast(
                        `Deleted ${successfulDeletes.length} placeholders, but ${failedDeletes.length} failed`,
                        'warning',
                    );
                } else {
                    this.showToast(
                        `Successfully deleted ${successfulDeletes.length} placeholders`,
                        'positive',
                    );
                }
            } else if (failedDeletes.length > 0) {
                this.showToast(`Failed to delete any placeholders`, 'negative');
            }
        } catch (error) {
            this.showToast(
                `Failed to delete placeholders: ${error.message}`,
                'negative',
            );
        } finally {
            this.isBulkDeleteInProgress = false;
            Store.placeholders.list.loading.set(false);
            this.placeholdersLoading = false;
        }
    }

    render() {
        const modalContent = this.showCreateModal
            ? this.renderCreateModal()
            : nothing;
        const confirmDialog = this.renderConfirmDialog();
        const showBulkAction = this.shouldShowBulkAction();

        return html`
            <div class="placeholders-container">
                <div class="placeholders-header">
                    <div class="header-left">
                        <mas-locale-picker
                            @locale-changed=${this.handleLocaleChange}
                            .value=${this.selectedLocale}
                        ></mas-locale-picker>
                    </div>
                    <sp-button
                        variant="primary"
                        @click=${() => this.handleAddPlaceholder()}
                        class="create-button"
                    >
                        <sp-icon-add slot="icon"></sp-icon-add>
                        Create New Placeholder
                    </sp-button>
                </div>

                ${this.renderError()}

                <div class="search-filters-container">
                    <div class="placeholders-title">
                        <h2>
                            Total Placeholders:
                            ${(this.placeholdersData || []).length}
                        </h2>
                    </div>
                    <div class="filters-container">
                        <sp-search
                            size="m"
                            placeholder="Search by key or value"
                            @input=${this.handleSearch}
                            value=${this.searchQuery}
                        ></sp-search>
                    </div>
                </div>

                <div class="placeholders-content">
                    ${this.renderPlaceholdersContent()}
                </div>

                ${modalContent} ${confirmDialog}

                <div
                    class="bulk-action-container ${showBulkAction
                        ? 'visible'
                        : ''}"
                >
                    <sp-action-button
                        variant="negative"
                        @click=${this.handleBulkDelete}
                        ?disabled=${this.isBulkDeleteInProgress}
                        size="l"
                    >
                        <sp-icon-delete slot="icon"></sp-icon-delete>
                        Delete (${this.selectedPlaceholders.length})
                    </sp-action-button>
                </div>
            </div>
        `;
    }

    handleSearch(e) {
        this.searchQuery = e.target.value;
        this.searchPlaceholders();
    }
}
