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
        this.debounceTimer = setTimeout(() => {
            this.query = value;
            this.resultType = this.detectType(value);
            store.setSearch(value, this.resultType);
            this.requestUpdate();

            if (this.resultType === 'osi') {
                this.resolveOsi(value);
            } else if (this.resultType === 'offer') {
                this.resolveOfferId(value);
            }
        }, 250);
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
                this.selectProductByCode(code);
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
                store.setAosParams({
                    customerSegment: offer.customer_segment,
                    marketSegment: Array.isArray(offer.market_segments) ? offer.market_segments[0] : offer.market_segment,
                    offerType: offer.offer_type,
                    commitment: offer.commitment,
                    term: offer.term,
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
