import { LitElement, css, html, nothing } from 'lit';
import ReactiveController from '../reactivity/reactive-controller.js';
import { SettingsStore } from './settings-store.js';

/**
 * Single row renderer for settings table items.
 */
export class MasSettingItem extends LitElement {
    static properties = {
        store: { type: Object, attribute: false },
        expanded: { type: Boolean, attribute: false },
        activeTab: { type: String, attribute: false },
    };

    styles = css`
        :host {
            display: contents;
        }
    `;

    constructor() {
        super();
        this.expanded = false;
        this.activeTab = 'locale';
    }

    createRenderRoot() {
        return this;
    }

    #reactiveController = new ReactiveController(this);

    update(changedProperties) {
        if (changedProperties.has('store')) {
            this.#reactiveController.updateStores([this.store]);
        }
        super.update(changedProperties);
    }

    get row() {
        return this.store.get();
    }

    #dispatchEvent(type, detail) {
        this.dispatchEvent(
            new CustomEvent(type, {
                detail,
                bubbles: true,
                composed: true,
            }),
        );
    }

    #handleExpand = () => {
        this.#dispatchEvent('setting-toggle-expand', { id: this.row.id });
    };

    #handleToggleValue = (event) => {
        this.#dispatchEvent('setting-toggle-value', { id: this.row.id, checked: event.target.checked });
    };

    #handleAddOverride = () => {
        this.#dispatchEvent('setting-add-override', { id: this.row.id });
    };

    #handleEdit = () => {
        this.#dispatchEvent('setting-edit', { id: this.row.id });
    };

    #handleDelete = (detail = { id: this.row.id }) => {
        this.#dispatchEvent('setting-delete', detail);
    };

    #handlePublish = () => {
        this.#dispatchEvent('setting-publish', { id: this.row.id });
    };

    #handleUnpublish = () => {
        this.#dispatchEvent('setting-unpublish', { id: this.row.id });
    };

    #handleDuplicate = (detail = { id: this.row.id }) => {
        if (detail.isOverride) {
            SettingsStore.duplicateOverride(detail.parentId, detail.id);
            return;
        }
        SettingsStore.duplicateSetting(detail.id);
    };

    #formatDate(dateString = '') {
        if (!dateString) return '';
        const parsedDate = new Date(dateString);
        if (Number.isNaN(parsedDate.getTime())) return dateString;
        const date = parsedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const time = parsedDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        return `${date},\n${time}`;
    }

    #normalizeDisplayValue(value) {
        if (value === true) return 'On';
        if (value === false) return 'Off';
        if (`${value}` === '') return '-';
        if (`${value}` === 'undefined') return '-';
        return `${value}`;
    }

    get isPublished() {
        return `${this.row.status || ''}`.toUpperCase() === 'PUBLISHED';
    }

    get canDelete() {
        return this.row.locales.length > 0;
    }

    get expandedContent() {
        if (!this.expanded) return nothing;

        return html`
            <div class="mas-setting-expanded">
                <div class="settings-expanded-header">
                    <sp-button size="s" variant="secondary" @click=${this.#handleAddOverride}>
                        <sp-icon-add slot="icon"></sp-icon-add>
                        Add override
                    </sp-button>
                </div>
                <div class="override-list">
                    ${this.row.overrides.length
                        ? this.row.overrides.map(
                              (override) => html`
                                  <div class="override-item">
                                      <div class="override-row">
                                          <div class="override-cell override-label">${override.label || this.row.label}</div>
                                          <div class="override-cell">${override.locale || this.row.locale || 'All'}</div>
                                          <div class="override-cell">${override.template || 'All'}</div>
                                          <div class="override-cell">${this.#normalizeDisplayValue(override.value)}</div>
                                          <div class="override-cell">${(override.tags || this.row.tags).join(', ') || '-'}</div>
                                          <div class="override-cell">${override.modifiedBy || this.row.modifiedBy || '-'}</div>
                                          <div class="override-cell date-cell">
                                              ${this.#formatDate(override.modifiedAt || this.row.modifiedAt || '')}
                                          </div>
                                          <div class="override-cell status-cell">
                                              <span class="status-dot"></span>${override.status || this.row.status || 'DRAFT'}
                                          </div>
                                          <div class="override-cell">
                                              <sp-action-menu quiet placement="bottom-end">
                                                  <sp-icon-more slot="icon"></sp-icon-more>
                                                  <sp-menu-item @click=${this.#handleEdit}>
                                                      <sp-icon-edit slot="icon"></sp-icon-edit>
                                                      Edit setting
                                                  </sp-menu-item>
                                                  <sp-menu-item
                                                      @click=${() =>
                                                          this.#handleDuplicate({
                                                              id: override.id,
                                                              parentId: this.row.id,
                                                              isOverride: true,
                                                          })}
                                                  >
                                                      <sp-icon-duplicate slot="icon"></sp-icon-duplicate>
                                                      Duplicate
                                                  </sp-menu-item>
                                                  <sp-menu-item ?disabled=${this.isPublished} @click=${this.#handlePublish}>
                                                      <sp-icon-publish slot="icon"></sp-icon-publish>
                                                      Publish
                                                  </sp-menu-item>
                                                  <sp-menu-item ?disabled=${!this.isPublished} @click=${this.#handleUnpublish}>
                                                      <sp-icon-publish-remove slot="icon"></sp-icon-publish-remove>
                                                      Unpublish
                                                  </sp-menu-item>
                                                  <sp-menu-item
                                                      @click=${() =>
                                                          this.#handleDelete({
                                                              id: override.id,
                                                              parentId: this.row.id,
                                                              isOverride: true,
                                                          })}
                                                  >
                                                      <sp-icon-delete slot="icon"></sp-icon-delete>
                                                      Delete
                                                  </sp-menu-item>
                                              </sp-action-menu>
                                          </div>
                                      </div>
                                  </div>
                              `,
                          )
                        : html`<div class="mas-setting-empty">No overrides yet.</div>`}
                </div>
            </div>
        `;
    }

    render() {
        return html`
            <sp-table-row value=${this.row.id} class="mas-setting-row ${this.expanded ? 'expanded' : ''}">
                <sp-table-cell class="expand-column">
                    <button
                        class="expand-button"
                        aria-label=${this.expanded ? 'Collapse row' : 'Expand row'}
                        @click=${this.#handleExpand}
                    >
                        ${this.expanded
                            ? html`<sp-icon-chevron-down></sp-icon-chevron-down>`
                            : html`<sp-icon-chevron-right></sp-icon-chevron-right>`}
                    </button>
                </sp-table-cell>
                <sp-table-cell class="name-cell">
                    <span class="setting-label">${this.row.label}</span>
                </sp-table-cell>
                <sp-table-cell>${this.row.locale || 'All'}</sp-table-cell>
                <sp-table-cell class="template-cell">${this.row.templateSummary || 'All templates selected'}</sp-table-cell>
                <sp-table-cell class="value-cell">
                    <sp-switch size="m" .checked=${Boolean(this.row.value)} @change=${this.#handleToggleValue}></sp-switch>
                    <span>${this.#normalizeDisplayValue(this.row.value)}</span>
                </sp-table-cell>
                <sp-table-cell class="tags-cell">
                    ${this.row.tags.length
                        ? this.row.tags.map((tag) => html`<sp-tag size="s">${tag}</sp-tag>`)
                        : html`<span>-</span>`}
                </sp-table-cell>
                <sp-table-cell>${this.row.modifiedBy || '-'}</sp-table-cell>
                <sp-table-cell class="date-cell">${this.#formatDate(this.row.modifiedAt || '')}</sp-table-cell>
                <sp-table-cell class="status-cell"><span class="status-dot"></span>${this.row.status || '-'}</sp-table-cell>
                <sp-table-cell class="actions-cell">
                    <sp-action-menu quiet placement="bottom-end">
                        <sp-icon-more slot="icon"></sp-icon-more>
                        <sp-menu-item @click=${this.#handleEdit}>
                            <sp-icon-edit slot="icon"></sp-icon-edit>
                            Edit setting
                        </sp-menu-item>
                        <sp-menu-item @click=${() => this.#handleDuplicate({ id: this.row.id })}>
                            <sp-icon-duplicate slot="icon"></sp-icon-duplicate>
                            Duplicate
                        </sp-menu-item>
                        <sp-menu-item ?disabled=${this.isPublished} @click=${this.#handlePublish}>
                            <sp-icon-publish slot="icon"></sp-icon-publish>
                            Publish
                        </sp-menu-item>
                        <sp-menu-item ?disabled=${!this.isPublished} @click=${this.#handleUnpublish}>
                            <sp-icon-publish-remove slot="icon"></sp-icon-publish-remove>
                            Unpublish
                        </sp-menu-item>
                        ${this.canDelete
                            ? html`
                                  <sp-menu-item @click=${() => this.#handleDelete({ id: this.row.id })}>
                                      <sp-icon-delete slot="icon"></sp-icon-delete>
                                      Delete
                                  </sp-menu-item>
                              `
                            : nothing}
                    </sp-action-menu>
                </sp-table-cell>
            </sp-table-row>
            ${this.expandedContent}
        `;
    }
}

customElements.define('mas-setting-item', MasSettingItem);
