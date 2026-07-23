import { LitElement, html, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import {
    parseCountriesFromGeos,
    getEffectivePromoCode,
    getEffectiveSubstituteOffer,
    promotionOfferRecordHasDisplayName,
    resolvePromotionOfferRecord,
} from './promotion-editor-utils.js';
import { shouldIgnoreRowClickForSelection } from '../common/utils/render-utils.js';
import { managerStyles } from './mas-promo-codes-manager.css.js';

export const MANAGE_PROMO_CODES_AND_OFFERS_LABEL = 'Manage promo codes and offers';
const CUSTOM_OSI_RESOLVE_DEBOUNCE_MS = 400;

class MasPromoCodesManager extends LitElement {
    #substituteResolveTimers = new Map();

    #substituteResolveGeneration = 0;

    static styles = managerStyles;

    static properties = {
        open: { type: Boolean, reflect: true },
        offers: { type: Array },
        geos: { type: Array },
        defaultPromoCode: { type: String },
        exceptions: { type: Object },
        offerSubstitutions: { type: Object },
        selectedCountries: { type: Object, state: true },
        expandedCountry: { type: String, state: true },
        bulkPromoCode: { type: String, state: true },
        bulkApplyVisible: { type: Boolean, state: true },
        workingExceptions: { type: Object, state: true },
        workingOfferSubstitutions: { type: Object, state: true },
        substituteOfferCache: { type: Object, state: true },
        substituteResolvePending: { type: Object, state: true },
        successMessage: { type: String, state: true },
    };

    constructor() {
        super();
        this.open = false;
        this.offers = [];
        this.geos = [];
        this.defaultPromoCode = '';
        this.exceptions = new Map();
        this.offerSubstitutions = new Map();
        this.selectedCountries = new Set();
        this.expandedCountry = '';
        this.bulkPromoCode = '';
        this.bulkApplyVisible = false;
        this.workingExceptions = new Map();
        this.workingOfferSubstitutions = new Map();
        this.substituteOfferCache = new Map();
        this.substituteResolvePending = new Set();
        this.successMessage = '';
    }

    willUpdate(changed) {
        if (changed.has('open') && this.open) {
            this.#substituteResolveGeneration += 1;
            this.#clearSubstituteResolveTimers();
            this.workingExceptions = new Map(this.exceptions);
            this.workingOfferSubstitutions = new Map(this.offerSubstitutions);
            this.substituteOfferCache = new Map();
            this.substituteResolvePending = new Set();
            this.selectedCountries = new Set();
            this.expandedCountry = '';
            this.bulkPromoCode = '';
            this.bulkApplyVisible = false;
            this.successMessage = '';
            this.#hydrateSubstituteOffersFromWorking();
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.#clearSubstituteResolveTimers();
    }

    get countries() {
        return parseCountriesFromGeos(this.geos);
    }

    get selectAllChecked() {
        return this.countries.length > 0 && this.selectedCountries.size === this.countries.length;
    }

    get selectAllIndeterminate() {
        return this.selectedCountries.size > 0 && this.selectedCountries.size < this.countries.length;
    }

    #handleSelectAll() {
        this.selectedCountries = this.selectAllChecked ? new Set() : new Set(this.countries);
        this.bulkApplyVisible = this.selectedCountries.size > 0;
    }

    #handleCountryCheckbox(country) {
        const next = new Set(this.selectedCountries);
        if (next.has(country)) {
            next.delete(country);
        } else {
            next.add(country);
        }
        this.selectedCountries = next;
        this.bulkApplyVisible = next.size > 0;
    }

    #toggleExpand(country) {
        this.expandedCountry = this.expandedCountry === country ? '' : country;
    }

    #onCountryHeaderClick(country, e) {
        if (shouldIgnoreRowClickForSelection(e)) return;
        this.#toggleExpand(country);
    }

    #setWorkingException(offerId, country, value) {
        const next = new Map(this.workingExceptions);
        const key = `${offerId}|${country}`;
        if (!value || value === this.defaultPromoCode) {
            next.delete(key);
        } else {
            next.set(key, value);
        }
        this.workingExceptions = next;
    }

    #setWorkingOfferSubstitution(baseOfferId, country, substituteSelectorId) {
        const next = new Map(this.workingOfferSubstitutions);
        const key = `${baseOfferId}|${country}`;
        if (!substituteSelectorId) {
            next.delete(key);
        } else {
            next.set(key, substituteSelectorId);
        }
        this.workingOfferSubstitutions = next;
    }

    #handlePromoCodeInput(offerId, country, input) {
        if (input.value.includes(':')) {
            input.setCustomValidity('Promo codes cannot contain ":".');
            input.reportValidity();
            return;
        }
        input.setCustomValidity('');
        this.#setWorkingException(offerId, country, input.value);
    }

    #handleBulkPromoInput(input) {
        if (input.value.includes(':')) {
            input.setCustomValidity('Promo codes cannot contain ":".');
            input.reportValidity();
            return;
        }
        input.setCustomValidity('');
        this.bulkPromoCode = input.value;
    }

    #handleManualOsiInput(baseOfferId, country, value) {
        const trimmed = value.trim();
        this.#setWorkingOfferSubstitution(baseOfferId, country, trimmed);
        this.#scheduleSubstituteResolve(trimmed, country);
    }

    #clearSubstituteResolveTimers() {
        for (const timer of this.#substituteResolveTimers.values()) {
            clearTimeout(timer);
        }
        this.#substituteResolveTimers.clear();
    }

    #collectCustomSubstituteIds() {
        const map = new Map();
        for (const [key, substituteId] of this.workingOfferSubstitutions) {
            if (!substituteId) continue;
            const [baseSelectorId, country] = key.split('|');
            if (this.#isDifferentProjectOfferSubstitution(substituteId, baseSelectorId)) continue;
            if (!map.has(substituteId)) map.set(substituteId, country);
        }
        return map;
    }

    async #hydrateSubstituteOffersFromWorking() {
        const generation = this.#substituteResolveGeneration;
        const idsWithCountry = this.#collectCustomSubstituteIds();
        await Promise.all(
            [...idsWithCountry.entries()].map(([id, country]) => this.#resolveSubstituteOffer(id, country, generation)),
        );
    }

    #scheduleSubstituteResolve(osi, country) {
        if (this.#substituteResolveTimers.has(osi)) {
            clearTimeout(this.#substituteResolveTimers.get(osi));
        }
        if (!osi) return;
        const cached = this.substituteOfferCache?.get(osi);
        if (cached && promotionOfferRecordHasDisplayName(cached)) return;
        const timer = setTimeout(() => {
            this.#substituteResolveTimers.delete(osi);
            this.#resolveSubstituteOffer(osi, country, this.#substituteResolveGeneration);
        }, CUSTOM_OSI_RESOLVE_DEBOUNCE_MS);
        this.#substituteResolveTimers.set(osi, timer);
    }

    async #resolveSubstituteOffer(osi, country, generation = this.#substituteResolveGeneration) {
        if (!osi || !this.open || generation !== this.#substituteResolveGeneration) return;
        const cached = this.substituteOfferCache?.get(osi);
        if (cached && promotionOfferRecordHasDisplayName(cached)) return;

        const pending = new Set(this.substituteResolvePending);
        pending.add(osi);
        this.substituteResolvePending = pending;

        const entry = await this.#getSubstituteResolver()(osi, country);

        const pendingAfter = new Set(this.substituteResolvePending);
        pendingAfter.delete(osi);
        this.substituteResolvePending = pendingAfter;

        if (!this.open || generation !== this.#substituteResolveGeneration) return;
        if (!promotionOfferRecordHasDisplayName(entry)) return;
        const next = new Map(this.substituteOfferCache);
        next.set(osi, entry);
        this.substituteOfferCache = next;
    }

    #getResolvedSubstituteEntry(substituteSelectorId) {
        const entry = this.substituteOfferCache?.get(substituteSelectorId);
        return promotionOfferRecordHasDisplayName(entry) ? entry : null;
    }

    #getSubstituteResolver() {
        return this.resolveSubstituteOfferEntry ?? resolvePromotionOfferRecord;
    }

    #getManualOsiLabel(osi) {
        if (!osi) return 'Custom OSI';
        const truncated = osi.length > 28 ? `${osi.slice(0, 28)}...` : osi;
        return `Custom OSI: ${truncated}`;
    }

    #isDifferentProjectOfferSubstitution(substituteSelectorId, baseSelectorId) {
        const substituteOffer = this.#findOfferBySelectorId(substituteSelectorId);
        if (!substituteOffer) return false;
        return this.#getOfferSelectorId(substituteOffer) !== baseSelectorId;
    }

    #handleRestorePromo(offerId, country) {
        const nextExceptions = new Map(this.workingExceptions);
        nextExceptions.delete(`${offerId}|${country}`);
        this.workingExceptions = nextExceptions;
    }

    #handleRestoreOffer(offerId, country) {
        const nextSubstitutions = new Map(this.workingOfferSubstitutions);
        nextSubstitutions.delete(`${offerId}|${country}`);
        this.workingOfferSubstitutions = nextSubstitutions;
    }

    #handleBulkApply() {
        if (!this.bulkPromoCode) return;
        const next = new Map(this.workingExceptions);
        for (const country of this.selectedCountries) {
            for (const offer of this.offers) {
                const selectorId = this.#getOfferSelectorId(offer);
                if (!selectorId) continue;
                const key = `${selectorId}|${country}`;
                if (this.bulkPromoCode === this.defaultPromoCode) {
                    next.delete(key);
                } else {
                    next.set(key, this.bulkPromoCode);
                }
            }
        }
        this.workingExceptions = next;
        this.successMessage = 'Promo code overridden successfully.';
    }

    async #copyOfferId(offerId) {
        if (!offerId) return;
        try {
            await navigator.clipboard.writeText(offerId);
        } catch {
            // clipboard unavailable in test env
        }
    }

    #cleanExceptions(map) {
        const cleaned = new Map();
        for (const [key, code] of map.entries()) {
            if (code && code !== this.defaultPromoCode) cleaned.set(key, code);
        }
        return cleaned;
    }

    #cleanOfferSubstitutions(map) {
        const cleaned = new Map();
        for (const [key, substituteSelectorId] of map.entries()) {
            if (substituteSelectorId) cleaned.set(key, substituteSelectorId);
        }
        return cleaned;
    }

    #handleConfirm() {
        this.dispatchEvent(
            new CustomEvent('promo-codes-save', {
                detail: {
                    exceptions: this.#cleanExceptions(this.workingExceptions),
                    offerSubstitutions: this.#cleanOfferSubstitutions(this.workingOfferSubstitutions),
                },
                bubbles: true,
                composed: true,
            }),
        );
    }

    #handleCancel() {
        this.dispatchEvent(new CustomEvent('promo-codes-cancel', { bubbles: true, composed: true }));
    }

    #getOfferId(offer) {
        return offer?.offerData?.offerId ?? offer?.offerData?.offer_id ?? null;
    }

    #getOfferSelectorId(offer) {
        return offer?.path ?? offer?.id ?? null;
    }

    #getOfferName(offer) {
        return (
            offer?.tags?.find(({ id }) => id.startsWith('mas:product_code/'))?.title ||
            offer?.title ||
            offer?.getFieldValue?.('cardTitle') ||
            'Unknown'
        );
    }

    #findOfferBySelectorId(selectorId) {
        if (!selectorId) return null;
        return this.offers.find((offer) => this.#getOfferSelectorId(offer) === selectorId) ?? null;
    }

    #getMnemonicIcon(offer) {
        return offer?.getFieldValue?.('mnemonicIcon') ?? offer?.fields?.find?.((f) => f.name === 'mnemonicIcon')?.values?.[0];
    }

    #getOffersWithIds() {
        return (this.offers ?? []).filter((offer) => this.#getOfferSelectorId(offer));
    }

    #renderOfferRow(offer, country) {
        const baseSelectorId = this.#getOfferSelectorId(offer);
        const rowKey = baseSelectorId ?? this.#getOfferName(offer);
        const substituteSelectorId = getEffectiveSubstituteOffer(this.workingOfferSubstitutions, baseSelectorId, country);
        const isDifferentProjectOffer = this.#isDifferentProjectOfferSubstitution(substituteSelectorId, baseSelectorId);
        const isCustomOsi = Boolean(substituteSelectorId) && !isDifferentProjectOffer;
        const substituteOffer = isDifferentProjectOffer ? this.#findOfferBySelectorId(substituteSelectorId) : null;
        const resolvedSubstituteEntry = isCustomOsi ? this.#getResolvedSubstituteEntry(substituteSelectorId) : null;
        const isResolvingSubstitute = isCustomOsi && this.substituteResolvePending?.has(substituteSelectorId);
        const displayOffer = resolvedSubstituteEntry ?? substituteOffer ?? offer;
        const displayOfferId = isCustomOsi
            ? (this.#getOfferId(resolvedSubstituteEntry) ?? substituteSelectorId)
            : this.#getOfferId(displayOffer);
        const displayOfferName = isCustomOsi
            ? resolvedSubstituteEntry
                ? this.#getOfferName(resolvedSubstituteEntry)
                : isResolvingSubstitute
                  ? 'Resolving offer...'
                  : this.#getManualOsiLabel(substituteSelectorId)
            : this.#getOfferName(displayOffer);
        const displayIconSrc = isCustomOsi && !resolvedSubstituteEntry ? null : this.#getMnemonicIcon(displayOffer);
        const effectiveCode = getEffectivePromoCode(this.workingExceptions, baseSelectorId, country, '');
        const isPromoOverridden = this.workingExceptions.has(`${baseSelectorId}|${country}`);
        const isOfferOverridden = Boolean(substituteSelectorId);
        const copyLabel = isCustomOsi ? 'Copy OSI' : 'Copy Offer ID';

        return html`<div class="offer-grid-row" data-offer-key=${rowKey}>
            <div class="offer-name-cell">
                ${displayIconSrc ? html`<img class="offer-mnemonic" src=${displayIconSrc} alt="" />` : nothing}
                <span>${displayOfferName}</span>
            </div>
            <div class="offer-id-cell">
                <div class="offer-id-display">
                    <span class="offer-id-text" title=${displayOfferId}>${displayOfferId}</span>
                    <sp-action-button
                        icon-only
                        quiet
                        size="s"
                        aria-label=${copyLabel}
                        @click=${(e) => {
                            e.stopPropagation();
                            this.#copyOfferId(displayOfferId);
                        }}
                    >
                        <sp-icon-copy slot="icon"></sp-icon-copy>
                    </sp-action-button>
                </div>
                <div class="alternate-offer-controls">
                    <label class="alternate-offer-label">
                        <span>Custom OSI</span>
                        <input
                            class="custom-osi-input"
                            type="text"
                            aria-label="Custom OSI"
                            placeholder="Insert OSI"
                            .value=${isCustomOsi ? substituteSelectorId : ''}
                            @input=${(e) => this.#handleManualOsiInput(baseSelectorId, country, e.target.value)}
                        />
                    </label>
                    ${isOfferOverridden
                        ? html`<button
                              type="button"
                              class="restore-link restore-offer-link"
                              @click=${() => this.#handleRestoreOffer(baseSelectorId, country)}
                          >
                              <sp-icon-undo size="s"></sp-icon-undo>
                              Overridden offer. Click to restore.
                          </button>`
                        : nothing}
                </div>
            </div>
            <div class="promo-code-field">
                <input
                    class="promo-code-input"
                    type="text"
                    maxlength="200"
                    .value=${effectiveCode}
                    @input=${(e) => this.#handlePromoCodeInput(baseSelectorId, country, e.target)}
                />
                ${isPromoOverridden
                    ? html`<button
                          type="button"
                          class="restore-link restore-promo-link"
                          @click=${() => this.#handleRestorePromo(baseSelectorId, country)}
                      >
                          <sp-icon-undo size="s"></sp-icon-undo>
                          Overridden code. Click to restore.
                      </button>`
                    : nothing}
            </div>
        </div>`;
    }

    #renderCountryOffers(country) {
        const offersWithIds = this.#getOffersWithIds();
        if (!offersWithIds.length) {
            return html`<div class="country-empty">No offers selected for this promotion.</div>`;
        }

        return html`<div class="offer-grid">
            <div class="offer-grid-header">
                <span>Offer</span>
                <span>Offer ID</span>
                <span>Promo code</span>
            </div>
            ${repeat(
                offersWithIds,
                (o) => o?.path ?? this.#getOfferId(o) ?? this.#getOfferName(o),
                (o) => this.#renderOfferRow(o, country),
            )}
        </div>`;
    }

    #renderCountrySection(country) {
        const isChecked = this.selectedCountries.has(country);
        const isExpanded = this.expandedCountry === country;

        return html`<div class="country-section ${isExpanded ? 'is-expanded' : ''}" data-country=${country}>
            <div
                class="country-header ${isChecked ? 'is-selected' : ''}"
                @click=${(e) => this.#onCountryHeaderClick(country, e)}
            >
                <sp-checkbox
                    class="country-checkbox"
                    ?checked=${isChecked}
                    @change=${() => this.#handleCountryCheckbox(country)}
                ></sp-checkbox>
                <span class="country-label">${country}</span>
                <sp-action-button
                    class="expand-toggle ${isExpanded ? 'is-expanded' : ''}"
                    quiet
                    size="s"
                    aria-label=${isExpanded ? 'Collapse country' : 'Expand country'}
                    @click=${(e) => {
                        e.stopPropagation();
                        this.#toggleExpand(country);
                    }}
                >
                    <sp-icon-chevron-down slot="icon"></sp-icon-chevron-down>
                </sp-action-button>
            </div>
            ${isExpanded ? html`<div class="country-body">${this.#renderCountryOffers(country)}</div>` : nothing}
        </div>`;
    }

    #renderBulkApply() {
        if (!this.bulkApplyVisible || this.selectedCountries.size === 0) return nothing;
        const count = this.selectedCountries.size;
        return html`<div class="bulk-apply-section">
            <div class="bulk-apply-header">
                <div class="bulk-apply-label">
                    <sp-icon-info size="s"></sp-icon-info>
                    Apply a unique promo code (${count} ${count === 1 ? 'country' : 'countries'} selected).
                </div>
                <sp-action-button
                    icon-only
                    quiet
                    size="s"
                    aria-label="Close bulk apply"
                    @click=${() => {
                        this.bulkApplyVisible = false;
                    }}
                >
                    <sp-icon-close slot="icon"></sp-icon-close>
                </sp-action-button>
            </div>
            <div class="bulk-apply-row">
                <div class="promo-code-field">
                    <label class="bulk-promo-label">Promo code</label>
                    <input
                        class="bulk-promo-input"
                        type="text"
                        maxlength="200"
                        placeholder="Promo code"
                        .value=${this.bulkPromoCode}
                        @input=${(e) => this.#handleBulkPromoInput(e.target)}
                    />
                </div>
                <sp-button class="bulk-apply-button" variant="secondary" @click=${this.#handleBulkApply}> Apply </sp-button>
            </div>
        </div>`;
    }

    #renderSuccessBanner() {
        if (!this.successMessage) return nothing;
        return html`<div class="success-banner">
            <span class="success-message">${this.successMessage}</span>
            <sp-action-button
                class="dismiss-success"
                icon-only
                quiet
                size="s"
                aria-label="Dismiss"
                @click=${() => {
                    this.successMessage = '';
                }}
            >
                <sp-icon-close slot="icon"></sp-icon-close>
            </sp-action-button>
        </div>`;
    }

    render() {
        if (!this.open) return nothing;
        const countryCount = this.countries.length;

        return html`
            <div class="dialog-backdrop" @click=${this.#handleCancel}>
                <div class="dialog-container" @click=${(e) => e.stopPropagation()}>
                    <div class="dialog-header">${MANAGE_PROMO_CODES_AND_OFFERS_LABEL}</div>
                    <div class="dialog-body">
                        <div class="select-all-row">
                            <sp-checkbox
                                class="select-all-checkbox"
                                ?checked=${this.selectAllChecked}
                                ?indeterminate=${this.selectAllIndeterminate}
                                @change=${this.#handleSelectAll}
                            >
                                Select all
                            </sp-checkbox>
                            <span class="country-count">${countryCount} ${countryCount === 1 ? 'country' : 'countries'}</span>
                        </div>
                        <div class="country-list">
                            ${repeat(
                                this.countries,
                                (c) => c,
                                (c) => this.#renderCountrySection(c),
                            )}
                        </div>
                        ${this.#renderBulkApply()} ${this.#renderSuccessBanner()}
                    </div>
                    <div class="dialog-footer">
                        <sp-button class="cancel-button" variant="secondary" @click=${this.#handleCancel}> Cancel </sp-button>
                        <sp-button class="confirm-button" variant="accent" @click=${this.#handleConfirm}> Confirm </sp-button>
                    </div>
                </div>
            </div>
        `;
    }
}

export default MasPromoCodesManager;
export { MasPromoCodesManager };
customElements.define('mas-promo-codes-manager', MasPromoCodesManager);
