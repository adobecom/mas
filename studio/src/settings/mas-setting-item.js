import { LitElement, html, nothing } from 'lit';
import ReactiveController from '../reactivity/reactive-controller.js';
import { DELETE_BLOCKED_STATUSES } from './settings-store.js';

/**
 * Single top-level row renderer for settings table items.
 */
export class MasSettingItem extends LitElement {
    static properties = {
        store: { type: Object, attribute: false },
        expanded: { type: Boolean, attribute: false },
    };

    constructor() {
        super();
        this.expanded = false;
    }

    createRenderRoot() {
        return this;
    }

    willUpdate(changedProperties) {
        if (changedProperties.has('store') && this.store) {
            if (this.storeController) {
                this.storeController.updateStores([this.store]);
            } else {
                this.storeController = new ReactiveController(this, [this.store]);
            }
        }
    }

    get row() {
        return this.store.get();
    }

    #dispatchRowEvent(type, detail = {}) {
        this.#dispatchEvent(type, { id: this.row.id, ...detail });
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
        this.#dispatchRowEvent('setting-toggle-expand');
    };

    #handleToggleValue = (event) => {
        this.#dispatchRowEvent('setting-toggle-value', { checked: event.target.checked });
    };

    #handleAction = (event) => {
        this.#dispatchRowEvent(event.currentTarget.dataset.action);
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

    get canDelete() {
        return !DELETE_BLOCKED_STATUSES.includes(this.row.status);
    }

    get tagsTemplate() {
        const tags = this.row.tags || [];
        if (!tags.length) return html`<span>-</span>`;
        return tags.map((tag) => html`<sp-tag size="s">${tag}</sp-tag>`);
    }

    get valueCellTemplate() {
        const showToggle = this.row.valueType !== 'text';
        return html`
            <sp-table-cell class="value-cell">
                ${showToggle
                    ? html`<sp-switch
                          size="m"
                          .checked=${Boolean(this.row.booleanValue)}
                          @change=${this.#handleToggleValue}
                      ></sp-switch>`
                    : nothing}
                <span>${this.#normalizeDisplayValue(this.row.value)}</span>
            </sp-table-cell>
        `;
    }

    get actionsTemplate() {
        return html`
            <sp-action-menu class="row-actions-menu" quiet size="m" placement="bottom-end">
                <sp-icon-more slot="icon"></sp-icon-more>
                <sp-menu-item data-action="setting-edit" @click=${this.#handleAction}>
                    <sp-icon-edit slot="icon"></sp-icon-edit>
                    Edit setting
                </sp-menu-item>
                ${this.canDelete
                    ? html`
                          <sp-menu-item data-action="setting-delete" @click=${this.#handleAction}>
                              <sp-icon-delete slot="icon"></sp-icon-delete>
                              Delete
                          </sp-menu-item>
                      `
                    : nothing}
            </sp-action-menu>
        `;
    }

    render() {
        return html`
            <sp-table-row value=${this.row.id} class="mas-setting-row">
                <sp-table-cell class="expand-column">
                    <sp-action-button
                        quiet
                        class="expand-button"
                        aria-label=${this.expanded ? 'Collapse row' : 'Expand row'}
                        @click=${this.#handleExpand}
                    >
                        ${this.expanded
                            ? html`<sp-icon-chevron-down slot="icon"></sp-icon-chevron-down>`
                            : html`<sp-icon-chevron-right slot="icon"></sp-icon-chevron-right>`}
                    </sp-action-button>
                </sp-table-cell>
                <sp-table-cell class="name-cell setting-label" title=${this.row.description || ''}
                    >${this.row.label}</sp-table-cell
                >
                <sp-table-cell>${this.row.locales?.join(', ') || 'All'}</sp-table-cell>
                <sp-table-cell class="template-cell">${this.row.templateSummary}</sp-table-cell>
                ${this.valueCellTemplate}
                <sp-table-cell class="tags-cell">${this.tagsTemplate}</sp-table-cell>
                <sp-table-cell>${this.row.modifiedBy || '-'}</sp-table-cell>
                <sp-table-cell class="date-cell">${this.#formatDate(this.row.modifiedAt || '')}</sp-table-cell>
                <sp-table-cell class="status-cell"><span class="status-dot"></span>${this.row.status || '-'}</sp-table-cell>
                <sp-table-cell class="actions-cell">${this.actionsTemplate}</sp-table-cell>
            </sp-table-row>
        `;
    }
}

customElements.define('mas-setting-item', MasSettingItem);
