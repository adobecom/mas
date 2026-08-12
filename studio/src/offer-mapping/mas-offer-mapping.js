import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { styles } from './mas-offer-mapping.css.js';
import Store from '../store.js';
import { ReactiveStore } from '../reactivity/reactive-store.js';
import ReactiveController from '../reactivity/reactive-controller.js';
import './mas-offer-mapping-item.js';

const emptyRecord = () => ({ id: null, sourceOffer: '', targetOffer: '', geos: [], status: undefined, fragment: null });

class MasOfferMapping extends LitElement {
    static styles = styles;

    static properties = {
        bucket: { type: String, attribute: true },
        baseUrl: { type: String, attribute: 'base-url' },
        editingKey: { type: String, state: true },
        activeDropdown: { type: String, state: true },
        draft: { type: Object, state: true },
    };

    constructor() {
        super();
        this.bucket = '';
        this.baseUrl = '';
        this.editingKey = null;
        this.activeDropdown = null;
        this.draft = null;
        this.loadedSurface = '';

        this.toggleEditing = this.toggleEditing.bind(this);
        this.toggleDropdown = this.toggleDropdown.bind(this);
        this.handleClickOutside = this.handleClickOutside.bind(this);
        this.closeDraft = this.closeDraft.bind(this);
    }

    // Follows the global surface (the top toolbar's surface picker) — no dedicated selector here.
    reactiveController = new ReactiveController(this, [
        Store.search,
        Store.offerMapping.rows,
        Store.offerMapping.loading,
        Store.offerMapping.error,
    ]);

    get surface() {
        return Store.surface() || '';
    }

    connectedCallback() {
        super.connectedCallback();
        document.addEventListener('click', this.handleClickOutside);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener('click', this.handleClickOutside);
    }

    update(changedProperties) {
        this.#load();
        super.update(changedProperties);
    }

    #load() {
        if (this.surface === this.loadedSurface) return;
        if (!Store.offerMapping.aem) {
            Store.offerMapping.initAem(this.bucket, this.baseUrl);
        }
        this.loadedSurface = this.surface;
        this.editingKey = null;
        this.draft = null;
        Store.offerMapping.ensureSurfaceLoaded(this.surface);
    }

    get rows() {
        return Store.offerMapping.rows.get();
    }

    get loading() {
        return Store.offerMapping.loading.get();
    }

    get error() {
        return Store.offerMapping.error.get();
    }

    // #region Handlers

    startCreate() {
        if (this.draft) return;
        this.draft = new ReactiveStore(emptyRecord());
        this.editingKey = 'new';
    }

    closeDraft() {
        this.draft = null;
        if (this.editingKey === 'new') this.editingKey = null;
    }

    toggleEditing(key, event) {
        event?.stopPropagation();
        this.editingKey = this.editingKey === key ? null : key;
    }

    toggleDropdown(key, event) {
        event?.stopPropagation();
        this.activeDropdown = this.activeDropdown === key ? null : key;
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

    // #endregion

    get errorMessage() {
        if (!this.error) return nothing;
        return html`<div class="error-message"><sp-icon-alert size="m"></sp-icon-alert><span>${this.error}</span></div>`;
    }

    renderRow(rowStore, isNew) {
        const key = isNew ? 'new' : rowStore.get().id;
        return html`<mas-offer-mapping-item
            base-url=${this.baseUrl}
            .rowStore=${rowStore}
            .store=${Store.offerMapping}
            ?is-new=${isNew}
            .editing=${this.editingKey === key}
            .disabled=${this.loading}
            ?active-dropdown=${this.activeDropdown === key}
            .toggleEditing=${this.toggleEditing}
            .toggleDropdown=${this.toggleDropdown}
            .onClose=${this.closeDraft}
        ></mas-offer-mapping-item>`;
    }

    renderTable() {
        const columns = [
            { label: 'Source OSI', key: 'source' },
            { label: 'Target OSI', key: 'target' },
            { label: 'Geos', key: 'geos' },
            { label: 'Status', key: 'status' },
            { label: 'Action', key: 'action', align: 'right' },
        ];
        return html`
            <sp-table emphasized scroller class="offer-mapping-table">
                <sp-table-head>
                    ${columns.map(
                        ({ label, key, align }) =>
                            html`<sp-table-head-cell class="${key} ${align === 'right' ? 'align-right' : ''}"
                                >${label}</sp-table-head-cell
                            >`,
                    )}
                </sp-table-head>
                <sp-table-body>
                    ${this.draft ? this.renderRow(this.draft, true) : nothing}
                    ${repeat(
                        this.rows,
                        (rowStore) => rowStore.get().id,
                        (rowStore) => this.renderRow(rowStore, false),
                    )}
                    ${!this.loading && this.rows.length === 0 && !this.draft
                        ? html`<p class="no-mappings-label">No offer mappings found for this surface.</p>`
                        : nothing}
                </sp-table-body>
            </sp-table>
        `;
    }

    render() {
        return html`
            <div class="offer-mapping-header">
                <div class="header-left"><h2>Offer mapping</h2></div>
                <sp-button variant="primary" @click=${this.startCreate} ?disabled=${Boolean(this.draft)}>
                    <sp-icon-add slot="icon"></sp-icon-add>
                    Create mapping
                </sp-button>
            </div>
            ${this.errorMessage}
            <div class="toolbar">
                <span class="total">${this.loading ? '' : `${this.rows.length} mapping(s)`}</span>
            </div>
            ${this.renderTable()}
        `;
    }
}

customElements.define('mas-offer-mapping', MasOfferMapping);
