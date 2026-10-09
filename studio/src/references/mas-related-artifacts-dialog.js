import { html, nothing } from 'lit';
import { MasDialogShell } from './mas-dialog-shell.js';
import { dialogShellStyles } from './mas-dialog-shell.css.js';
import { styles } from './mas-related-artifacts-dialog.css.js';
import { ARTIFACT_TYPE_KEYS, REFERENCE_TYPES } from './references-repository.js';

const LABEL_BY_KEY = new Map(REFERENCE_TYPES.map((type) => [type.key, type.label]));

// Modal listing the internal Studio artifacts (collections + projects) that reference the open
// fragment, one tab per type, each a sortable table of deep links. Data comes from
// getReferencingFragments; visibility is controlled by the `open` property from the parent editor.
class MasRelatedArtifactsDialog extends MasDialogShell {
    static styles = [dialogShellStyles, styles];

    static properties = {
        ...MasDialogShell.properties,
        buckets: { type: Array },
        selectedTab: { state: true },
        sortDirection: { state: true },
    };

    constructor() {
        super();
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
        return (this.buckets ?? []).find((bucket) => bucket.key === key)?.rows ?? [];
    }

    #rowTitle(row) {
        return row.title ?? row.representative?.path?.split('/').pop() ?? '';
    }

    #sortedRows(key) {
        const rows = [...this.#rowsFor(key)];
        const direction = this.sortDirection === 'desc' ? -1 : 1;
        return rows.sort((a, b) => this.#rowTitle(a).localeCompare(this.#rowTitle(b)) * direction);
    }

    #handleTabChange(event) {
        this.selectedTab = event.target.selected;
    }

    #toggleSort() {
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    }

    #renderRow(row) {
        const title = this.#rowTitle(row);
        const link = row.representative?.link;
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
            <sp-table emphasized class="dialog-table">
                <sp-table-head>
                    <sp-table-head-cell
                        sortable
                        sort-direction=${this.sortDirection === 'desc' ? 'descending' : 'ascending'}
                        @click=${() => this.#toggleSort()}
                    >
                        Page
                    </sp-table-head-cell>
                </sp-table-head>
                <sp-table-body class="dialog-table-body">${rows.map((row) => this.#renderRow(row))}</sp-table-body>
            </sp-table>
        `;
    }

    render() {
        if (!this.open) return nothing;
        return this.renderShell(
            'Related studio artifacts',
            html`
                <sp-tabs class="tabs-row" quiet .selected=${this.selectedTab} @change=${this.#handleTabChange}>
                    ${ARTIFACT_TYPE_KEYS.map(
                        (key) => html`<sp-tab value=${key} label=${LABEL_BY_KEY.get(key)}>${LABEL_BY_KEY.get(key)}</sp-tab>`,
                    )}
                </sp-tabs>
                <sp-divider size="s"></sp-divider>
                <div class="table-wrapper">${this.#renderTable()}</div>
            `,
        );
    }
}

customElements.define('mas-related-artifacts-dialog', MasRelatedArtifactsDialog);

export default MasRelatedArtifactsDialog;
