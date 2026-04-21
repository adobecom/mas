import { LitElement, html, css, nothing } from 'lit';
import { offerFilter } from '../utils/offer-filter.js';
import { store } from '../store/ost-store.js';

export class MasOstProductList extends LitElement {
    static properties = {
        searchQuery: { type: String, attribute: 'search-query' },
    };

    static styles = css`
        :host {
            font-family: inherit;
            display: block;
        }

        .product-scroll {
            display: flex;
            flex-direction: column;
            gap: var(--spectrum-spacing-75, 4px);
        }

        .product-card {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 12px 16px;
            border: 1px solid transparent;
            border-left: 3px solid transparent;
            border-radius: 6px;
            background: transparent;
            cursor: pointer;
            transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
            flex-shrink: 0;
            min-height: 56px;
        }

        .product-card:hover {
            background: var(--spectrum-gray-100);
            border-left-color: var(--spectrum-gray-300);
        }

        .product-card:focus-visible {
            outline: 2px solid var(--spectrum-blue-900);
            outline-offset: 1px;
        }

        .product-card[selected] {
            border-left-color: var(--spectrum-blue-900);
            background: var(--spectrum-blue-100);
        }

        .product-icon {
            width: 32px;
            height: 32px;
            flex-shrink: 0;
            border-radius: 4px;
            object-fit: contain;
        }

        .product-info {
            flex: 1;
            min-width: 0;
            overflow: hidden;
        }

        .product-name {
            font-size: 14px;
            font-weight: 600;
            color: var(--spectrum-gray-900);
            line-height: 1.4;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }

        .product-code {
            font-size: 12px;
            color: var(--spectrum-gray-600);
            font-family: inherit;
            line-height: 1.4;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .draft-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: var(--spectrum-orange-visual-color, #da7b11);
            flex-shrink: 0;
        }

        .empty-state {
            padding: 24px;
            text-align: center;
            color: var(--spectrum-gray-600);
            font-size: 14px;
        }

        @keyframes shimmer {
            0% {
                background-position: -200px 0;
            }
            100% {
                background-position: 200px 0;
            }
        }

        .skeleton-card {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 12px 16px;
            border-radius: 6px;
            min-height: 56px;
        }

        .skeleton-bar {
            border-radius: 3px;
            background: linear-gradient(
                90deg,
                var(--spectrum-gray-200) 25%,
                var(--spectrum-gray-100) 50%,
                var(--spectrum-gray-200) 75%
            );
            background-size: 400px 100%;
            animation: shimmer 1.5s infinite linear;
        }

        .skeleton-icon {
            width: 32px;
            height: 32px;
            border-radius: 4px;
            flex-shrink: 0;
        }

        .skeleton-info {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 6px;
            min-width: 0;
        }

        .skeleton-name {
            height: 14px;
            width: 70%;
        }

        .skeleton-code {
            height: 12px;
            width: 45%;
        }
    `;

    constructor() {
        super();
        this.searchQuery = '';
        this.handleStoreChange = this.handleStoreChange.bind(this);
    }

    connectedCallback() {
        super.connectedCallback();
        store.subscribe(this.handleStoreChange);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        store.unsubscribe(this.handleStoreChange);
    }

    handleStoreChange() {
        this.requestUpdate();
    }

    get filteredProducts() {
        const products = store.allProducts;
        if (!products || !Array.isArray(products)) return [];

        const query = store.searchQuery || '';
        let criteria = null;
        if (query && store.searchType === 'product') {
            try {
                criteria = new RegExp(query, 'i');
            } catch {
                /* invalid regex, skip text filter */
            }
        }

        return products.map((entry) => {
            // Handle both [code, product] tuples and flat product objects
            const product = Array.isArray(entry) ? entry[1] : entry;
            return product;
        }).filter((product) => {
            const code = product.arrangement_code || product.code || '';
            const name = product.name || '';
            const customerSegments = product.customerSegments || {};
            const marketSegments = product.marketSegments || {};
            const draft = product.draft || false;

            return offerFilter(criteria, store.landscape, store.aosParams, {
                customerSegments,
                marketSegments,
                arrangement_code: code,
                name,
                draft,
            });
        });
    }

    handleProductClick(product) {
        const code = product.arrangement_code || product.code || '';
        store.setProduct(product);
        store.setAosParams({ arrangementCode: code });
    }

    renderSkeletons() {
        return html`
            <div class="product-scroll">
                ${Array.from({ length: 8 }, () => html`
                    <div class="skeleton-card" aria-hidden="true">
                        <div class="skeleton-bar skeleton-icon"></div>
                        <div class="skeleton-info">
                            <div class="skeleton-bar skeleton-name"></div>
                            <div class="skeleton-bar skeleton-code"></div>
                        </div>
                    </div>
                `)}
            </div>
        `;
    }

    render() {
        if (store.productsLoading) {
            return this.renderSkeletons();
        }

        const products = this.filteredProducts;

        if (products.length === 0) {
            return html`<div class="empty-state">No products found</div>`;
        }

        const selectedCode = store.aosParams.arrangementCode;

        return html`
            <div class="product-scroll">
                ${products.map((product) => {
                    const code =
                        product.arrangement_code || product.code || '';
                    const isSelected = code === selectedCode;
                    return html`
                        <div
                            class="product-card"
                            tabindex="0"
                            ?selected=${isSelected}
                            @click=${() => this.handleProductClick(product)}
                        >
                            ${product.icon
                                ? html`<img
                                      class="product-icon"
                                      src=${product.icon}
                                      alt=""
                                  />`
                                : nothing}
                            <div class="product-info">
                                <div class="product-name">${product.name}</div>
                                <div class="product-code">${code}</div>
                            </div>
                            ${product.draft
                                ? html`<span class="draft-dot" title="Draft"></span>`
                                : nothing}
                        </div>
                    `;
                })}
            </div>
        `;
    }
}

customElements.define('mas-ost-product-list', MasOstProductList);
