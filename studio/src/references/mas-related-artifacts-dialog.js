import { LitElement, html, nothing } from 'lit';
import { styles } from './mas-related-artifacts-dialog.css.js';
import { ARTIFACT_TYPE_KEYS, REFERENCE_TYPES } from './references-repository.js';

const LABEL_BY_KEY = new Map(REFERENCE_TYPES.map((type) => [type.key, type.label]));

// Modal listing the internal Studio artifacts (collections + projects) that reference the open
// fragment, one tab per type, each a sortable table of deep links. Data comes from
// getReferencingFragments; visibility is controlled by the `open` property from the parent editor.
// The modal sp-overlay owns focus entry, Tab containment, Escape and focus restoration; the dialog
// wrapper owns the frame, headline, close button and underlay.
class MasRelatedArtifactsDialog extends LitElement {
    static styles = styles;

    static properties = {
        open: { type: Boolean },
        buckets: { type: Array },
        selectedTab: { state: true },
        sortDirection: { state: true },
    };

    constructor() {
        super();
        this.open = false;
        this.buckets = [];
        this.selectedTab = ARTIFACT_TYPE_KEYS[0];
        this.sortDirection = 'asc';
    }

    willUpdate(changedProperties) {
        // Re-anchor to the first type that actually has rows each time the dialog opens.
        if (changedProperties.has('open') && this.open) {
            this.selectedTab = ARTIFACT_TYPE_KEYS.find((key) => this.#rowsFor(key).length) ?? ARTIFACT_TYPE_KEYS[0];
            this.sortDirection = 'asc';
        }
    }

    #rowsFor(key) {
        return this.buckets.find((bucket) => bucket.key === key)?.rows ?? [];
    }

    #rowTitle(row) {
        return row.title ?? row.path.split('/').pop();
    }

    #sortedRows(key) {
        const rows = [...this.#rowsFor(key)];
        const direction = this.sortDirection === 'desc' ? -1 : 1;
        return rows.sort((a, b) => this.#rowTitle(a).localeCompare(this.#rowTitle(b)) * direction);
    }

    #handleTabChange(event) {
        this.selectedTab = event.target.selected;
    }

    #handleSorted(event) {
        this.sortDirection = event.detail.sortDirection;
    }

    #handleOverlayClosed(event) {
        if (event.target !== event.currentTarget) return;
        this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
    }

    #renderRow(row) {
        const title = this.#rowTitle(row);
        const { link } = row;
        return html`
            <sp-table-row>
                <sp-table-cell>
                    ${link
                        ? html`<a class="artifact-link" href=${link} target="_blank" rel="noopener">
                              <span>${title}</span>
                              <sp-icon-open-in size="s"></sp-icon-open-in>
                          </a>`
                        : html`<span>${title}</span>`}
                </sp-table-cell>
            </sp-table-row>
        `;
    }

    #renderTable() {
        const rows = this.#sortedRows(this.selectedTab);
        if (!rows.length) {
            return html`<div class="empty-tab-message">No ${LABEL_BY_KEY.get(this.selectedTab)} references</div>`;
        }
        return html`
            <sp-table emphasized class="dialog-table" @sorted=${this.#handleSorted}>
                <sp-table-head>
                    <sp-table-head-cell sortable sort-direction=${this.sortDirection}>Page</sp-table-head-cell>
                </sp-table-head>
                <sp-table-body class="dialog-table-body">${rows.map((row) => this.#renderRow(row))}</sp-table-body>
            </sp-table>
        `;
    }

    render() {
        if (!this.open) return nothing;
        return html`
            <sp-overlay type="modal" open @sp-closed=${this.#handleOverlayClosed}>
                <sp-dialog-wrapper headline="Related studio artifacts" dismissable underlay no-divider size="l">
                    <div class="dialog-content">
                        <sp-tabs class="tabs-row" quiet .selected=${this.selectedTab} @change=${this.#handleTabChange}>
                            ${ARTIFACT_TYPE_KEYS.map(
                                (key) =>
                                    html`<sp-tab value=${key} label=${LABEL_BY_KEY.get(key)}>${LABEL_BY_KEY.get(key)}</sp-tab>`,
                            )}
                        </sp-tabs>
                        <sp-divider size="s"></sp-divider>
                        <div class="table-wrapper">${this.#renderTable()}</div>
                    </div>
                </sp-dialog-wrapper>
            </sp-overlay>
        `;
    }
}

customElements.define('mas-related-artifacts-dialog', MasRelatedArtifactsDialog);

export default MasRelatedArtifactsDialog;
