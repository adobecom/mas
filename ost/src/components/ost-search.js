import { LitElement, html, css } from 'lit';
import { isOfferId, isOfferSelectorId } from '../utils/offer-utils.js';
import { getOfferSelector, getOfferById } from '../utils/aos-client.js';
import { store } from '../store/ost-store.js';

const TYPE_LABELS = {
    product: 'Product',
    offer: 'Offer ID',
    osi: 'OSI',
};

export class OstSearch extends LitElement {
    static properties = {};

    static styles = css`
        :host {
            font-family: inherit;
            display: block;
        }

        .search-wrapper {
            display: flex;
            flex-direction: column;
            gap: var(--spectrum-spacing-100, 8px);
            padding: 4px 0;
        }

        sp-search {
            width: 100%;
            --mod-textfield-border-radius: 999px;
            --mod-textfield-focus-indicator-border-radius: 999px;
            --mod-textfield-background-color: var(--spectrum-gray-100);
            --mod-textfield-border-color: var(--spectrum-gray-300);
            --mod-textfield-height: 40px;
            --mod-textfield-font-size: 14px;
        }

        .type-badge {
            align-self: flex-start;
        }
    `;

    constructor() {
        super();
        this.query = '';
        this.resultType = '';
        this.debounceTimer = null;
    }

    get search() {
        return this;
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        clearTimeout(this.debounceTimer);
    }

    detectType(value) {
        if (isOfferId(value)) return 'offer';
        if (isOfferSelectorId(value)) return 'osi';
        return 'product';
    }

    handleSearchInput(value) {
        clearTimeout(this.debounceTimer);
        this.pendingQuery = value;
        this.debounceTimer = setTimeout(() => this.#runSearch(value), 250);
    }

    hasPendingSearch() {
        return this.debounceTimer != null;
    }

    // True only when the pending query is an OSI/offer id (which auto-resolves a
    // product+offer). A pending product-name query is NOT included: the user
    // picks a product card for those, so the selection must not be cleared.
    hasPendingOsiSearch() {
        if (this.debounceTimer == null || this.pendingQuery == null) return false;
        const type = this.detectType(this.pendingQuery);
        return type === 'osi' || type === 'offer';
    }

    // Resolve the pending (debounced) query immediately — called when the user
    // clicks Next before the 250ms debounce fires, so a typed OSI/offer always
    // resolves its product before the wizard advances (no race on fast input).
    flushPendingSearch() {
        if (this.debounceTimer == null) return;
        clearTimeout(this.debounceTimer);
        this.debounceTimer = null;
        if (this.pendingQuery != null) this.#runSearch(this.pendingQuery);
    }

    #runSearch(value) {
        this.debounceTimer = null;
        this.pendingQuery = null;
        this.query = value;
        this.resultType = this.detectType(value);
        store.setSearch(value, this.resultType);
        this.requestUpdate();

        if (this.resultType === 'osi') {
            this.resolveOsi(value);
        } else if (this.resultType === 'offer') {
            this.resolveOfferId(value);
        }
    }

    async resolveOsi(osi) {
        try {
            const config = {
                accessToken: store.accessToken,
                apiKey: store.apiKey,
                baseUrl: store.baseUrl,
                env: store.env,
            };
            const result = await getOfferSelector(osi, config);
            const code = result?.product_arrangement_code || result?.arrangement_code;
            if (code) {
                // This searched OSI now owns the selection. Set initialOsi BEFORE
                // loading offers (so autoSelectByInitialOsi picks its offer) and
                // drop any prior selection so a stale deep-link can't linger and
                // "Use" stays disabled until the new offer resolves.
                store.initialOsi = osi;
                store.clearSelectedOffer();
                // Keep every filter at its "All" default: the resolved offer's
                // attributes are stashed for autoSelectByInitialOsi instead of
                // narrowing the visible filter pickers.
                store.initialOsiAttributes = {
                    customer_segment: result.customer_segment,
                    market_segment: Array.isArray(result.market_segments) ? result.market_segments[0] : result.market_segment,
                    offer_type: result.offer_type,
                    commitment: result.commitment,
                    term: result.term,
                };
                store.setAosParams({
                    customerSegment: '',
                    marketSegment: '',
                    offerType: '',
                    commitment: '',
                    term: '',
                });
                this.selectProductByCode(code);
                // setOsi LAST: selectProductByCode → setProduct clears selectedOsi
                // when the product changes, so set it after the product is chosen.
                store.setOsi(osi);
            }
        } catch {
            /* OSI resolution failed */
        }
    }

    async resolveOfferId(offerId) {
        try {
            const config = {
                accessToken: store.accessToken,
                apiKey: store.apiKey,
                baseUrl: store.baseUrl,
                env: store.env,
                environment: store.environment,
                landscape: store.landscape,
            };
            const offers = await getOfferById(offerId, store.country, config);
            const offer = Array.isArray(offers) ? offers[0] : null;
            const code = offer?.product_arrangement_code;
            if (code) {
                store.setSearch(code, 'product');
                store.clearSelectedOffer();
                // Keep every filter at its "All" default: the resolved offer's
                // attributes are stashed for autoSelectByInitialOsi instead of
                // narrowing the visible filter pickers to stale values.
                store.initialOfferId = offer.offer_id;
                store.initialOsiAttributes = {
                    customer_segment: offer.customer_segment,
                    market_segment: Array.isArray(offer.market_segments) ? offer.market_segments[0] : offer.market_segment,
                    offer_type: offer.offer_type,
                    commitment: offer.commitment,
                    term: offer.term,
                };
                store.setAosParams({
                    customerSegment: '',
                    marketSegment: '',
                    offerType: '',
                    commitment: '',
                    term: '',
                });
                this.selectProductByCode(code);
            }
        } catch {
            /* offer ID resolution failed */
        }
    }

    selectProductByCode(code) {
        const products = store.allProducts;
        for (const entry of products) {
            const product = Array.isArray(entry) ? entry[1] : entry;
            const productCode = product.arrangement_code || product.code || '';
            if (productCode === code) {
                store.setProduct(product);
                store.setAosParams({ arrangementCode: code });
                return;
            }
        }
    }

    handleInput(event) {
        this.handleSearchInput(event.target.value);
    }

    handleSubmit(event) {
        event.preventDefault();
    }

    render() {
        const label = this.query ? TYPE_LABELS[this.resultType] : '';
        return html`
            <div class="search-wrapper">
                <sp-search
                    data-testid="ost-search-input"
                    placeholder="Search by name, code, offer ID, or OSI"
                    size="s"
                    @input=${this.handleInput}
                    @submit=${this.handleSubmit}
                ></sp-search>
                ${label ? html`<sp-badge class="type-badge" size="s" variant="informative">${label}</sp-badge>` : ''}
            </div>
        `;
    }
}

customElements.define('ost-search', OstSearch);
