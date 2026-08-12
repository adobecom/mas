import { LitElement, html, nothing } from 'lit';
import { STATUS_PUBLISHED } from '../constants.js';
import ReactiveController from '../reactivity/reactive-controller.js';
import { confirmation } from '../mas-confirm-dialog.js';
import { getService } from '../utils.js';
import { DELETE_BLOCKED_STATUSES } from './offer-mapping-store.js';
import '../rte/osi-field.js';
import '../aem/aem-tag-picker-field.js';
import '../mas-fragment-status.js';

/**
 * Derives a WCS country code from a geo tag (path or id). Country tags end in the country code
 * (`.../country/US`, `mas:pzn/country/KW`); locale tags end in a locale whose country half is used
 * (`.../locale/en_AU` → `AU`). Returns '' when neither shape matches.
 * @param {string} geo
 * @returns {string}
 */
export function geoTagToCountry(geo) {
    if (!geo) return '';
    const last = `${geo}`.split(/[/:]/).filter(Boolean).pop() || '';
    if (last.includes('_')) return last.split('_')[1] || '';
    return /^[A-Za-z]{2}$/.test(last) ? last.toUpperCase() : '';
}

/**
 * Resolves AOS offer data for an OSI at a given country via the commerce service — the same
 * `collectPriceOptions` + `resolveOfferSelectors` path used by `loadOfferData`, but with the country
 * overridden so the price reflects the requested geo.
 * @param {string} osi
 * @param {string} country
 * @returns {Promise<{ offerId: string, product: string, pricePoint: string, customerSegment: string, marketSegments: string[], planType: string }|null>}
 */
export async function resolveAosOffer(osi, country) {
    if (!osi) return null;
    const service = getService();
    if (!service) return null;
    try {
        const priceOptions = service.collectPriceOptions({ wcsOsi: osi, ...(country ? { country } : {}) });
        const [offersPromise] = service.resolveOfferSelectors(priceOptions);
        if (!offersPromise) return null;
        const [offer] = await offersPromise;
        if (!offer) return null;
        return {
            offerId: offer.offerId || '',
            product: offer.productArrangementCode || '',
            pricePoint: offer.pricePoint || '',
            customerSegment: offer.customerSegment || '',
            marketSegments: offer.marketSegments || [],
            planType: offer.planType || '',
        };
    } catch (error) {
        console.warn(`Failed to resolve AOS offer for ${osi} (${country}):`, error.message);
        return null;
    }
}

class MasOfferMappingItem extends LitElement {
    static properties = {
        rowStore: { type: Object },
        store: { type: Object },
        baseUrl: { type: String, attribute: 'base-url' },
        isNew: { type: Boolean, attribute: 'is-new' },
        editing: { type: Boolean },
        disabled: { type: Boolean },
        activeDropdown: { type: Boolean, attribute: 'active-dropdown' },
        toggleEditing: { type: Function },
        toggleDropdown: { type: Function },
        onClose: { type: Function },
        draftSource: { type: String, state: true },
        draftTarget: { type: String, state: true },
        draftGeos: { type: Array, state: true },
        aos: { type: Object, state: true },
    };

    createRenderRoot() {
        return this;
    }

    constructor() {
        super();
        this.rowStore = null;
        this.store = null;
        this.baseUrl = '';
        this.isNew = false;
        this.editing = false;
        this.disabled = false;
        this.activeDropdown = false;
        this.toggleEditing = null;
        this.toggleDropdown = null;
        this.onClose = null;
        this.draftSource = '';
        this.draftTarget = '';
        this.draftGeos = [];
        this.aos = { source: null, target: null };
        this.#aosKey = '';
    }

    #aosKey;

    connectedCallback() {
        super.connectedCallback();
        this.reactiveController = new ReactiveController(this, [this.rowStore]);
    }

    get record() {
        return this.rowStore?.get() || null;
    }

    get rowKey() {
        return this.record?.id ?? 'new';
    }

    willUpdate(changed) {
        if (changed.has('editing') && this.editing) {
            const record = this.record;
            this.draftSource = record?.sourceOffer || '';
            this.draftTarget = record?.targetOffer || '';
            this.draftGeos = [...(record?.geos || [])];
        }
    }

    updated() {
        if (this.editing) return;
        const record = this.record;
        if (!record) return;
        const country = geoTagToCountry(record.geos?.[0]);
        const key = `${record.sourceOffer}|${record.targetOffer}|${country}`;
        if (key === this.#aosKey) return;
        this.#aosKey = key;
        this.#resolveAos(record, country);
    }

    async #resolveAos(record, country) {
        const [source, target] = await Promise.all([
            resolveAosOffer(record.sourceOffer, country),
            resolveAosOffer(record.targetOffer, country),
        ]);
        // Ignore a stale resolution if the row changed while awaiting.
        if (`${record.sourceOffer}|${record.targetOffer}|${country}` !== this.#aosKey) return;
        this.aos = { source, target };
    }

    // #region Handlers

    #handleSourceChange(event) {
        this.draftSource = event.target.value || '';
    }

    #handleTargetChange(event) {
        this.draftTarget = event.target.value || '';
    }

    #handleGeosChange(event) {
        const value = event.target.getAttribute('value');
        this.draftGeos = value ? value.split(',') : [];
    }

    async #onSave(event) {
        event.stopPropagation();
        const payload = { sourceOffer: this.draftSource, targetOffer: this.draftTarget, geos: this.draftGeos };
        if (this.isNew) {
            const created = await this.store.createMapping(payload);
            if (created) this.onClose?.();
            return;
        }
        const updated = await this.store.updateMapping(this.record.id, payload);
        if (updated) this.toggleEditing(this.rowKey);
    }

    #onCancel(event) {
        event.stopPropagation();
        if (this.isNew) {
            this.onClose?.();
            return;
        }
        this.toggleEditing(this.rowKey);
    }

    get #deleteBlocked() {
        return DELETE_BLOCKED_STATUSES.includes(this.record.status);
    }

    async #onDelete(event) {
        this.toggleDropdown(this.rowKey, event);
        if (this.#deleteBlocked) return;
        const confirmed = await confirmation({
            title: 'Delete offer mapping',
            content: `Are you sure you want to delete the mapping "${this.record.sourceOffer} → ${this.record.targetOffer}"? This action cannot be undone.`,
            confirmLabel: 'Delete',
        });
        if (!confirmed) return;
        await this.store.removeMapping(this.record.id);
    }

    async #onPublish(event) {
        if (this.record.status === STATUS_PUBLISHED) return;
        this.toggleDropdown(this.rowKey, event);
        await this.store.publishMapping(this.record.id);
    }

    // Unpublish is available exactly when the mapping has something published to retract (PUBLISHED or
    // MODIFIED) — the same states that block deletion, so unpublishing is the path to a deletable row.
    get #canUnpublish() {
        return DELETE_BLOCKED_STATUSES.includes(this.record.status);
    }

    async #onUnpublish(event) {
        this.toggleDropdown(this.rowKey, event);
        if (!this.#canUnpublish) return;
        await this.store.unpublishMapping(this.record.id);
    }

    #preventSelection(event) {
        event.stopPropagation();
    }

    // #endregion

    get #canSave() {
        return Boolean(this.draftSource && this.draftTarget && this.draftGeos.length);
    }

    #aosLine(aos) {
        if (!aos) return nothing;
        const segments = [aos.customerSegment, ...(aos.marketSegments || [])].filter(Boolean).join(' / ');
        const parts = [segments, aos.planType, aos.pricePoint, aos.product, aos.offerId].filter(Boolean);
        if (!parts.length) return nothing;
        return html`<div class="aos-line">
            ${segments ? html`<span class="aos-chip" title="Segments">${segments}</span>` : nothing}
            ${aos.planType ? html`<span class="aos-chip" title="Plan type">${aos.planType}</span>` : nothing}
            ${aos.pricePoint ? html`<span class="aos-chip" title="Price point">${aos.pricePoint}</span>` : nothing}
            ${aos.product ? html`<span class="aos-chip" title="Product">${aos.product}</span>` : nothing}
            ${aos.offerId ? html`<span class="aos-chip aos-offer-id" title="Offer ID">${aos.offerId}</span>` : nothing}
        </div>`;
    }

    #osiCell(kind) {
        const isSource = kind === 'source';
        const value = isSource ? this.draftSource : this.draftTarget;
        const recordValue = isSource ? this.record.sourceOffer : this.record.targetOffer;
        if (this.editing) {
            return html`<sp-table-cell class="editing-cell ${kind}">
                <osi-field
                    .value=${value}
                    @change=${isSource ? this.#handleSourceChange : this.#handleTargetChange}
                    @click=${this.#preventSelection}
                ></osi-field>
            </sp-table-cell>`;
        }
        return html`<sp-table-cell class="${kind}">
            <div class="osi-value">${recordValue || html`<span class="empty">—</span>`}</div>
            ${this.#aosLine(this.aos[kind])}
        </sp-table-cell>`;
    }

    get #geosCell() {
        if (this.editing) {
            return html`<sp-table-cell class="editing-cell geos">
                <aem-tag-picker-field
                    base-url=${this.baseUrl}
                    selection="checkbox-tags"
                    display-value
                    label="Geos"
                    namespace="/content/cq:tags/mas"
                    top="locale,pzn"
                    multiple
                    value=${this.draftGeos.join(',')}
                    @change=${this.#handleGeosChange}
                    @click=${this.#preventSelection}
                ></aem-tag-picker-field>
            </sp-table-cell>`;
        }
        const geos = this.record.geos || [];
        return html`<sp-table-cell class="geos">
            ${geos.length
                ? html`<div class="geo-tags">
                      ${geos.map((geo) => html`<span class="geo-tag">${geoTagToCountry(geo) || geo}</span>`)}
                  </div>`
                : html`<span class="empty">—</span>`}
        </sp-table-cell>`;
    }

    get #statusCell() {
        const variant = this.record.fragment?.statusVariant;
        return html`<sp-table-cell class="status">
            ${variant
                ? html`<mas-fragment-status variant=${variant}></mas-fragment-status>`
                : html`<span class="empty">Draft</span>`}
        </sp-table-cell>`;
    }

    get #actionCell() {
        if (this.editing) {
            return html`<sp-table-cell class="action-cell">
                <div class="action-buttons">
                    <button
                        class="action-button approve-button"
                        @click=${this.#onSave}
                        aria-label="Save"
                        ?disabled=${!this.#canSave}
                    >
                        <sp-icon-checkmark size="m"></sp-icon-checkmark>
                    </button>
                    <button class="action-button reject-button" @click=${this.#onCancel} aria-label="Cancel">
                        <sp-icon-close size="m"></sp-icon-close>
                    </button>
                </div>
            </sp-table-cell>`;
        }
        return html`<sp-table-cell class="action-cell">
            <div class="action-buttons">
                <button
                    class="action-button approve-button"
                    @click=${(event) => this.toggleEditing(this.rowKey, event)}
                    aria-label="Edit offer mapping"
                    ?disabled=${this.disabled}
                >
                    <sp-icon-edit size="m"></sp-icon-edit>
                </button>
                <div class="dropdown-menu-container">
                    <button
                        class="action-button action-menu-button"
                        @click=${(event) => this.toggleDropdown(this.rowKey, event)}
                        @mousedown=${this.#preventSelection}
                        aria-label="More options"
                        ?disabled=${this.disabled}
                    >
                        <sp-icon-more size="m"></sp-icon-more>
                    </button>
                    ${this.activeDropdown
                        ? html`<div class="dropdown-menu">
                              <div
                                  class="dropdown-item ${this.record.status === STATUS_PUBLISHED ? 'disabled' : ''}"
                                  @click=${this.#onPublish}
                              >
                                  <sp-icon-publish size="m"></sp-icon-publish><span>Publish</span>
                              </div>
                              <div class="dropdown-item ${this.#canUnpublish ? '' : 'disabled'}" @click=${this.#onUnpublish}>
                                  <sp-icon-publish-remove size="m"></sp-icon-publish-remove><span>Unpublish</span>
                              </div>
                              <div class="dropdown-item ${this.#deleteBlocked ? 'disabled' : ''}" @click=${this.#onDelete}>
                                  <sp-icon-delete size="m"></sp-icon-delete><span>Delete</span>
                              </div>
                          </div>`
                        : nothing}
                </div>
            </div>
        </sp-table-cell>`;
    }

    render() {
        if (!this.rowStore) return html``;
        return html`<sp-table-row value=${this.rowKey}>
            ${this.#osiCell('source')} ${this.#osiCell('target')} ${this.#geosCell} ${this.#statusCell} ${this.#actionCell}
        </sp-table-row>`;
    }
}

customElements.define('mas-offer-mapping-item', MasOfferMappingItem);
