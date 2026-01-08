import { LitElement, html, nothing, repeat } from 'lit';
import { styles } from './mas-fragment-picker-row.css.js';
import { getService } from './utils.js';

class MasFragmentPickerRow extends LitElement {
    static styles = styles;

    static properties = {
        fragment: { type: Object },
        selected: { type: Boolean },
        expanded: { type: Boolean },
        offerData: { type: Object, state: true, attribute: false },
        selectedLocaleFragments: { type: Array, state: true },
    };

    constructor() {
        super();
        this.fragment = null;
        this.expanded = false;
        this.selected = false;
        this.offerData = null;
        this.selectedLocaleFragments = [];
    }

    connectedCallback() {
        super.connectedCallback();
        this.loadOfferData();
    }

    updated(changedProperties) {
        super.updated(changedProperties);
        if (changedProperties.has('selected')) {
            const checkbox = this.shadowRoot.querySelector('sp-checkbox');
            if (checkbox && checkbox.checked !== this.selected) {
                checkbox.checked = this.selected;
            }
        }
    }

    get offerId() {
        return this.fragment.fields?.find(({ name }) => name === 'osi')?.values?.[0];
    }

    async copyOfferIdToClipboard(e) {
        e.stopPropagation();
        const offerId = this.offerData?.offerId;
        if (!offerId) return;

        try {
            await navigator.clipboard.writeText(offerId);
            showToast('Offer ID copied to clipboard', 'positive');
        } catch (err) {
            console.error('Failed to copy offer ID:', err);
            showToast('Failed to copy Offer ID', 'negative');
        }
    }

    renderStatus(status) {
        if (!status) return nothing;
        let statusClass = '';
        if (status === 'PUBLISHED') {
            statusClass = 'green';
        } else if (status === 'MODIFIED') {
            statusClass = 'blue';
        }
        return html`<sp-table-cell class="status-cell">
            <div class="status-dot ${statusClass}"></div>
            ${status.charAt(0).toUpperCase()}${status.slice(1).toLowerCase()}
        </sp-table-cell>`;
    }

    handleCheckboxChange(e) {
        this.dispatchEvent(
            new CustomEvent('checkbox-change', { detail: { fragment: this.fragment, selected: e.target.checked } }),
        );
    }

    async loadOfferData() {
        const wcsOsi = this.fragment.fields?.find(({ name }) => name === 'osi')?.values?.[0];
        if (!wcsOsi) return;
        const service = getService();
        const priceOptions = service.collectPriceOptions({ wcsOsi });
        const [offersPromise] = service.resolveOfferSelectors(priceOptions);
        if (!offersPromise) return;
        const [offer] = await offersPromise;
        console.log('offer', offer);
        this.offerData = offer;
    }

    updateSelectedFragments({ target: { selected } }) {
        const previousSelection = new Set(this.selectedLocaleFragments);
        const newSelection = new Set(selected);
        const added = [...newSelection].filter((id) => !previousSelection.has(id));
        const removed = [...previousSelection].filter((id) => !newSelection.has(id));
        this.selectedLocaleFragments = selected;
        added.forEach((fragmentId) => {
            const fragment = this.fragment.references?.find((ref) => ref.id === fragmentId);
            if (fragment) {
                this.dispatchEvent(
                    new CustomEvent('selected-locale-fragments-change', {
                        detail: { fragment, selected: true },
                        bubbles: true,
                        composed: true,
                    }),
                );
            }
        });
        removed.forEach((fragmentId) => {
            const fragment = this.fragment.references?.find((ref) => ref.id === fragmentId);
            if (fragment) {
                this.dispatchEvent(
                    new CustomEvent('selected-locale-fragments-change', {
                        detail: { fragment, selected: false },
                        bubbles: true,
                        composed: true,
                    }),
                );
            }
        });
    }

    render() {
        return html`
            <sp-table-row class="fragment-picker-row" value=${this.fragment.id} ?selected=${this.selected}>
                <sp-table-cell class="fixed-size-cell">
                    <button class="expand-button" aria-label="${this.expanded ? 'Collapse' : 'Expand'} row">
                        ${this.expanded
                            ? html`<sp-icon-chevron-down></sp-icon-chevron-down>`
                            : html`<sp-icon-chevron-right></sp-icon-chevron-right>`}
                    </button>
                </sp-table-cell>
                <sp-table-cell class="fixed-size-cell">
                    <sp-checkbox .checked=${this.selected} @change=${this.handleCheckboxChange}></sp-checkbox>
                </sp-table-cell>
                <sp-table-cell>${this.offerData?.productArrangement?.productFamily}</sp-table-cell>
                <sp-table-cell>${this.fragment.title}</sp-table-cell>
                <sp-table-cell class="offer-id" title=${this.offerData?.offerId}>
                    <div>${this.offerData?.offerId}</div>
                    ${this.offerId
                        ? html`<sp-button
                              icon-only
                              aria-label="Copy Offer ID to clipboard"
                              @click=${this.copyOfferIdToClipboard}
                          >
                              <sp-icon-copy slot="icon"></sp-icon-copy>
                          </sp-button>`
                        : ''}
                </sp-table-cell>
                <sp-table-cell>${this.fragment.path}</sp-table-cell>
                ${this.renderStatus(this.fragment.status)}
            </sp-table-row>
            <div class="locale-fragments">
                <div class="locale-fragments-header"><h3>Locale fragments</h3></div>
                <sp-table selects="multiple" .selected=${this.selectedLocaleFragments} @change=${this.updateSelectedFragments}>
                    <sp-table-body class="locale-fragments-table">
                        ${repeat(
                            this.fragment.references || [],
                            (reference) => reference.id,
                            (reference) =>
                                html` <sp-table-row value=${reference.id}>
                                    <sp-table-cell>
                                        ${this.offerData?.productArrangement?.productFamily} ${reference.locale}
                                    </sp-table-cell>
                                    <sp-table-cell>${reference.title}</sp-table-cell>
                                    <sp-table-cell class="offer-id" title=${this.offerData?.offerId}>
                                        <div>${this.offerData?.offerId}</div>
                                        ${this.offerId
                                            ? html`<sp-button
                                                  icon-only
                                                  aria-label="Copy Offer ID to clipboard"
                                                  @click=${this.copyOfferIdToClipboard}
                                              >
                                                  <sp-icon-copy slot="icon"></sp-icon-copy>
                                              </sp-button>`
                                            : ''}
                                    </sp-table-cell>
                                    <sp-table-cell>${reference.path}</sp-table-cell>
                                    ${this.renderStatus(this.fragment.status)}
                                </sp-table-row>`
                        )}
                    </sp-table-body>
                </sp-table>
            </div>
        `;
    }
}

customElements.define('mas-fragment-picker-row', MasFragmentPickerRow);
