import { LitElement, html, css } from 'lit';
import '@spectrum-web-components/picker/sp-picker.js';
import '@spectrum-web-components/menu/sp-menu-item.js';
import { store } from '../store/ost-store.js';
import { HELP_TOOLTIPS } from '../data/help-content.js';
import './mas-ost-help-icon.js';

const PLAN_TYPES = [
    { key: 'ALL', label: 'All plans' },
    { key: 'YEAR-MONTHLY', label: 'ABM' },
    { key: 'YEAR-ANNUAL', label: 'PUF' },
    { key: 'MONTH-MONTHLY', label: 'M2M' },
    { key: 'TERM_LICENSE-P3Y', label: 'P3Y' },
    { key: 'PERPETUAL', label: 'Perpetual' },
];

const CUSTOMER_SEGMENTS = [
    { key: 'ALL', label: 'All segments' },
    { key: 'INDIVIDUAL', label: 'Individual' },
    { key: 'TEAM', label: 'Team' },
];

const MARKET_SEGMENTS = [
    { key: 'ALL', label: 'All markets' },
    { key: 'COM', label: 'Commercial' },
    { key: 'EDU', label: 'Education' },
    { key: 'GOV', label: 'Government' },
];

const OFFER_TYPES = [
    { key: 'ALL', label: 'All offer types' },
    { key: 'BASE', label: 'Base' },
    { key: 'TRIAL', label: 'Trial' },
    { key: 'PROMOTION', label: 'Promotion' },
];

export class MasOstFilterBar extends LitElement {
    static properties = {};

    static styles = css`
        :host {
            font-family: inherit;
            display: block;
        }

        .filter-header {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-bottom: 6px;
        }

        .filter-title {
            font-size: 11px;
            font-weight: 700;
            color: var(--spectrum-gray-600);
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .filter-count {
            font-size: 10px;
            font-weight: 700;
            color: var(--spectrum-blue-900);
            background: var(--spectrum-blue-100);
            border-radius: 8px;
            padding: 1px 6px;
            min-width: 16px;
            text-align: center;
        }

        .filters-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px;
            margin-top: 8px;
        }

        .field-label {
            font-size: 10px;
            font-weight: 600;
            color: #6e6e6e;
            margin-bottom: 2px;
        }

        sp-picker {
            width: 100%;
        }

        .active-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            margin-top: 6px;
        }

        .tag {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-size: 10px;
            font-weight: 600;
            color: #1473e6;
            background: #e8f1fe;
            border: 1px solid #c5d9f8;
            border-radius: 10px;
            padding: 2px 8px;
            cursor: pointer;
            transition: background 0.15s;
        }

        .tag:hover {
            background: #c5d9f8;
        }

        .tag-x {
            font-size: 11px;
            line-height: 1;
            opacity: 0.7;
        }
    `;

    constructor() {
        super();
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

    updated() {
        this.syncPickerValues();
    }

    syncPickerValues() {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const pickers =
                    this.renderRoot.querySelectorAll('sp-picker');
                const values = [
                    this.currentPlanKey,
                    store.aosParams.customerSegment || 'ALL',
                    store.aosParams.marketSegment || 'ALL',
                    store.aosParams.offerType || 'ALL',
                ];
                pickers.forEach((picker, i) => {
                    if (picker.value !== values[i]) {
                        picker.value = values[i];
                    }
                });
            });
        });
    }

    get activeFilters() {
        const filters = [];
        const { aosParams } = store;
        if (aosParams.customerSegment) {
            const match = CUSTOMER_SEGMENTS.find(
                (s) => s.key === aosParams.customerSegment,
            );
            filters.push({
                label: match?.label || aosParams.customerSegment,
                clear: () => store.setAosParams({ customerSegment: '' }),
            });
        }
        if (aosParams.marketSegment) {
            const match = MARKET_SEGMENTS.find(
                (s) => s.key === aosParams.marketSegment,
            );
            filters.push({
                label: match?.label || aosParams.marketSegment,
                clear: () => store.setAosParams({ marketSegment: '' }),
            });
        }
        if (aosParams.offerType) {
            const match = OFFER_TYPES.find(
                (s) => s.key === aosParams.offerType,
            );
            filters.push({
                label: match?.label || aosParams.offerType,
                clear: () => store.setAosParams({ offerType: '' }),
            });
        }
        if (aosParams.commitment || aosParams.term) {
            const planKey = [aosParams.commitment, aosParams.term]
                .filter(Boolean)
                .join('-');
            const match = PLAN_TYPES.find((p) => p.key === planKey);
            if (match && match.key !== 'ALL') {
                filters.push({
                    label: match.label,
                    clear: () =>
                        store.setAosParams({ commitment: '', term: '' }),
                });
            }
        }
        return filters;
    }

    handlePlanChange(event) {
        const value = event.target.value;
        if (value === 'ALL') {
            store.setAosParams({ commitment: '', term: '' });
            return;
        }
        const parts = value.split('-');
        store.setAosParams({
            commitment: parts[0] || '',
            term: parts[1] || '',
        });
    }

    handleCustomerSegmentChange(event) {
        const value = event.target.value === 'ALL' ? '' : event.target.value;
        store.setAosParams({ customerSegment: value });
    }

    handleMarketSegmentChange(event) {
        const value = event.target.value === 'ALL' ? '' : event.target.value;
        store.setAosParams({ marketSegment: value });
    }

    handleOfferTypeChange(event) {
        const value = event.target.value === 'ALL' ? '' : event.target.value;
        store.setAosParams({ offerType: value });
    }

    get currentPlanKey() {
        const { commitment, term } = store.aosParams;
        const key = [commitment, term].filter(Boolean).join('-');
        return key || 'ALL';
    }

    render() {
        const tags = this.activeFilters;
        return html`
            <div class="filter-header">
                <span class="filter-title">Filters</span>
                ${tags.length > 0
                    ? html`<span class="filter-count">${tags.length}</span>`
                    : ''}
            </div>
            <div class="filters-grid">
                <div>
                    <div class="field-label">Plan <mas-ost-help-icon text="${HELP_TOOLTIPS.planType}"></mas-ost-help-icon></div>
                    <sp-picker
                        size="s"
                        .value=${this.currentPlanKey}
                        @change=${this.handlePlanChange}
                    >
                        ${PLAN_TYPES.map(
                            (pt) =>
                                html`<sp-menu-item value=${pt.key}
                                    >${pt.label}</sp-menu-item
                                >`,
                        )}
                    </sp-picker>
                </div>
                <div>
                    <div class="field-label">Segment <mas-ost-help-icon text="${HELP_TOOLTIPS.segment}"></mas-ost-help-icon></div>
                    <sp-picker
                        size="s"
                        .value=${store.aosParams.customerSegment || 'ALL'}
                        @change=${this.handleCustomerSegmentChange}
                    >
                        ${CUSTOMER_SEGMENTS.map(
                            (seg) =>
                                html`<sp-menu-item value=${seg.key}
                                    >${seg.label}</sp-menu-item
                                >`,
                        )}
                    </sp-picker>
                </div>
                <div>
                    <div class="field-label">Market <mas-ost-help-icon text="${HELP_TOOLTIPS.market}"></mas-ost-help-icon></div>
                    <sp-picker
                        size="s"
                        .value=${store.aosParams.marketSegment || 'ALL'}
                        @change=${this.handleMarketSegmentChange}
                    >
                        ${MARKET_SEGMENTS.map(
                            (seg) =>
                                html`<sp-menu-item value=${seg.key}
                                    >${seg.label}</sp-menu-item
                                >`,
                        )}
                    </sp-picker>
                </div>
                <div>
                    <div class="field-label">Offer type <mas-ost-help-icon text="${HELP_TOOLTIPS.offerType}"></mas-ost-help-icon></div>
                    <sp-picker
                        size="s"
                        .value=${store.aosParams.offerType || 'ALL'}
                        @change=${this.handleOfferTypeChange}
                    >
                        ${OFFER_TYPES.map(
                            (t) =>
                                html`<sp-menu-item value=${t.key}
                                    >${t.label}</sp-menu-item
                                >`,
                        )}
                    </sp-picker>
                </div>
            </div>
            ${tags.length > 0
                ? html`
                      <div class="active-tags">
                          ${tags.map(
                              (tag) => html`
                                  <span class="tag" @click=${tag.clear}>
                                      ${tag.label}
                                      <span class="tag-x">&times;</span>
                                  </span>
                              `,
                          )}
                      </div>
                  `
                : ''}
        `;
    }
}

customElements.define('mas-ost-filter-bar', MasOstFilterBar);
