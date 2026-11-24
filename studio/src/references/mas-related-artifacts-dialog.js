import { LitElement, html, nothing } from 'lit';
import { dialogTableStyles } from './dialog-table.css.js';
import { styles } from './mas-related-artifacts-dialog.css.js';
import { ARTIFACT_TYPE_KEYS, REFERENCE_TYPES } from './references-repository.js';

const LABEL_BY_KEY = new Map(REFERENCE_TYPES.map((type) => [type.key, type.label]));

// Modal listing the internal Studio artifacts (collections + projects) that reference the open
// fragment, one tab per type, each a sortable table of deep links. Data comes from
// getReferencingFragments; visibility is controlled by the `open` property from the parent editor.
// The modal sp-overlay owns focus entry, Tab containment, Escape and focus restoration; the dialog
// wrapper owns the frame, headline, close button and underlay.
class MasRelatedArtifactsDialog extends LitElement {
    static styles = [dialogTableStyles, styles];

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
                        ? html`<a class="artifact-link" href=${link} title=${title} target="_blank" rel="noopener">
                              <span class="artifact-label">${title}</span>
                              <sp-icon-open-in size="s"></sp-icon-open-in>
                          </a>`
                        : html`<span class="artifact-label" title=${title}>${title}</span>`}
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
                    <sp-table-head-cell sortable sort-direction=${this.sortDirection}
                        ><svg class="sort-icon" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
                            <!-- S2_Icon_SortDown, Figma node 24013:131438 -->
                            <path
                                fill="currentColor"
                                d="M29.2487 21.1514C28.7799 20.6826 28.0205 20.6826 27.5518 21.1514L25.6002 23.1029V5.9998C25.6002 5.33731 25.0627 4.7998 24.4002 4.7998C23.7377 4.7998 23.2002 5.33731 23.2002 5.9998V23.1029L21.2486 21.1514C20.7799 20.6826 20.0205 20.6826 19.5518 21.1514C19.083 21.6201 19.083 22.3795 19.5518 22.8482L23.5518 26.8482C23.6623 26.9588 23.7947 27.0459 23.9412 27.1068C24.0877 27.1678 24.2436 27.1998 24.4002 27.1998C24.5569 27.1998 24.7127 27.1678 24.8592 27.1068C25.0057 27.0459 25.1381 26.9588 25.2487 26.8482L29.2487 22.8482C29.7174 22.3795 29.7174 21.6201 29.2487 21.1514Z"
                            />
                            <path
                                fill="currentColor"
                                d="M11.6002 23.1998H4.4002C3.7377 23.1998 3.2002 22.6623 3.2002 21.9998C3.2002 21.3373 3.7377 20.7998 4.4002 20.7998H11.6002C12.2627 20.7998 12.8002 21.3373 12.8002 21.9998C12.8002 22.6623 12.2627 23.1998 11.6002 23.1998Z"
                            />
                            <path
                                fill="currentColor"
                                d="M14.8002 16.8004H4.4002C3.7377 16.8004 3.2002 16.2629 3.2002 15.6004C3.2002 14.9379 3.7377 14.4004 4.4002 14.4004H14.8002C15.4627 14.4004 16.0002 14.9379 16.0002 15.6004C16.0002 16.2629 15.4627 16.8004 14.8002 16.8004Z"
                            />
                            <path
                                fill="currentColor"
                                d="M18.0002 10.4H4.4002C3.7377 10.4 3.2002 9.8625 3.2002 9.2C3.2002 8.5375 3.7377 8 4.4002 8H18.0002C18.6627 8 19.2002 8.5375 19.2002 9.2C19.2002 9.8625 18.6627 10.4 18.0002 10.4Z"
                            /></svg
                        >Page</sp-table-head-cell
                    >
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
                        <sp-tabs class="tabs-row" quiet compact .selected=${this.selectedTab} @change=${this.#handleTabChange}>
                            ${ARTIFACT_TYPE_KEYS.map(
                                (key) =>
                                    html`<sp-tab value=${key} label=${LABEL_BY_KEY.get(key)}>${LABEL_BY_KEY.get(key)}</sp-tab>`,
                            )}
                        </sp-tabs>
                        <div class="table-wrapper">${this.#renderTable()}</div>
                    </div>
                </sp-dialog-wrapper>
            </sp-overlay>
        `;
    }
}

customElements.define('mas-related-artifacts-dialog', MasRelatedArtifactsDialog);

export default MasRelatedArtifactsDialog;
