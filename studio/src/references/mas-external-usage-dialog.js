import { html, nothing } from 'lit';
import { MasDialogShell } from './mas-dialog-shell.js';
import { dialogShellStyles } from './mas-dialog-shell.css.js';
import { styles } from './mas-external-usage-dialog.css.js';
/**
 * Modal listing the external pages that requested the open fragment, derived from Akamai CDN
 * referer logs (MWPW-185891).
 *
 * The counterpart to mas-related-artifacts-dialog: that one answers "what inside Studio points at
 * this fragment", this one answers "what out on the web actually serves it", how often, and from
 * which countries.
 *
 * Request counts cover the action's rolling 7-day retention window, not all time, and reflect the
 * pages that survived its per-hour cap — so they rank pages against each other rather than being a
 * guaranteed-complete traffic total.
 */
class MasExternalUsageDialog extends MasDialogShell {
    static styles = [dialogShellStyles, styles];

    static properties = {
        ...MasDialogShell.properties,
        usage: { type: Object },
        loading: { type: Boolean },
        sortColumn: { state: true },
        sortDirection: { state: true },
    };

    constructor() {
        super();
        this.usage = null;
        this.loading = false;
        this.sortColumn = 'requests';
        this.sortDirection = 'desc';
    }

    willUpdate(changedProperties) {
        if (changedProperties.has('open') && this.open) {
            this.sortColumn = 'requests';
            this.sortDirection = 'desc';
        }
    }

    get #pages() {
        return this.usage?.pages ?? [];
    }

    /**
     * The host every row shares, or null when they differ.
     *
     * Consuming pages are overwhelmingly on one host, and repeating it on every row spends the
     * column on the part that is identical while truncating the path, which is the only part that
     * tells the rows apart. When one host is shared it is shown once in the header instead; when it
     * is not (branch previews, other domains) the rows keep their full URLs so the difference
     * stays visible.
     */
    get #commonHost() {
        const hosts = new Set(this.#pages.map((page) => this.#hostOf(page.url)));
        return hosts.size === 1 ? [...hosts][0] : null;
    }

    #hostOf(url) {
        try {
            return new URL(url).host;
        } catch {
            return '';
        }
    }

    /** What a row shows: the path alone when the host is shared, otherwise the whole URL. */
    #label(url, commonHost) {
        if (!commonHost) return url;
        try {
            const { pathname, search } = new URL(url);
            return `${pathname}${search}`;
        } catch {
            return url;
        }
    }

    #sortedPages() {
        // Url then locale is the stable tie-break: two rows can share a url and differ only in
        // locale, so without it equally busy pages reorder between renders depending on whatever
        // order the action happened to return them in.
        const byPage = (a, b) => a.url.localeCompare(b.url) || a.locale.localeCompare(b.locale);
        const direction = this.sortDirection === 'desc' ? -1 : 1;
        const comparator =
            this.sortColumn === 'requests'
                ? (a, b) => (a.requests - b.requests) * direction || byPage(a, b)
                : (a, b) => byPage(a, b) * direction;
        return [...this.#pages].sort(comparator);
    }

    #toggleSort(column) {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
            return;
        }
        // A column starts in the direction it is normally read in: busiest first for counts,
        // A→Z for text.
        this.sortColumn = column;
        this.sortDirection = column === 'requests' ? 'desc' : 'asc';
    }

    /** Only the active column carries a direction, otherwise every header shows a sort arrow. */
    #sortDirectionFor(column) {
        if (this.sortColumn !== column) return nothing;
        return this.sortDirection === 'desc' ? 'descending' : 'ascending';
    }

    async #copyUrl(url) {
        await navigator.clipboard?.writeText(url);
    }

    #renderRow(page, commonHost) {
        // The url is the link rather than carrying a separate "Open" action, so the row keeps the
        // countries column without losing the ability to visit the page.
        return html`
            <sp-table-row>
                <sp-table-cell>
                    <a class="page-url" href=${page.url} title=${page.url} target="_blank" rel="noopener noreferrer">
                        ${this.#label(page.url, commonHost)}
                    </a>
                    ${page.locale ? html`<span class="page-locale">${page.locale}</span>` : nothing}
                    <sp-action-button
                        quiet
                        size="s"
                        label="Copy page URL"
                        class="page-copy"
                        @click=${() => this.#copyUrl(page.url)}
                    >
                        <sp-icon-copy slot="icon"></sp-icon-copy>
                    </sp-action-button>
                </sp-table-cell>
                <sp-table-cell class="requests-column">
                    <span class="page-requests">${(Number(page.requests) || 0).toLocaleString()}</span>
                </sp-table-cell>
                <sp-table-cell>
                    <span class="page-countries">${page.countries.join(', ')}</span>
                </sp-table-cell>
            </sp-table-row>
        `;
    }

    #renderBody() {
        if (this.loading) {
            return html`<div class="usage-placeholder">
                <sp-progress-circle indeterminate size="s" label="Loading page usage"></sp-progress-circle>
            </div>`;
        }

        if (!this.usage?.available) {
            return html`<div class="usage-placeholder">Usage data unavailable</div>`;
        }

        const pages = this.#sortedPages();
        if (!pages.length) {
            // Requests from apps that send no referer cannot be attributed to a page, so an empty
            // list is a real state rather than an error.
            return html`<div class="usage-placeholder">
                No referring pages recorded. Traffic may come from apps that send no referer.
            </div>`;
        }

        const commonHost = this.#commonHost;
        return html`
            <sp-table emphasized class="pages-table dialog-table">
                <sp-table-head>
                    <sp-table-head-cell
                        sortable
                        sort-direction=${this.#sortDirectionFor('page')}
                        @click=${() => this.#toggleSort('page')}
                    >
                        ${commonHost ? `Page on ${commonHost}` : 'Page'}
                    </sp-table-head-cell>
                    <sp-table-head-cell
                        sortable
                        class="requests-column"
                        sort-direction=${this.#sortDirectionFor('requests')}
                        @click=${() => this.#toggleSort('requests')}
                    >
                        Requests (7d)
                    </sp-table-head-cell>
                    <sp-table-head-cell>Countries</sp-table-head-cell>
                </sp-table-head>
                <sp-table-body class="dialog-table-body"
                    >${pages.map((page) => this.#renderRow(page, commonHost))}</sp-table-body
                >
            </sp-table>
        `;
    }

    render() {
        if (!this.open) return nothing;
        return this.renderShell(
            'Related pages',
            html`
                <div class="table-wrapper">${this.#renderBody()}</div>
                ${this.usage?.updatedAt
                    ? html`<div class="usage-freshness">Updated ${new Date(this.usage.updatedAt).toLocaleString()}</div>`
                    : nothing}
            `,
        );
    }
}

customElements.define('mas-external-usage-dialog', MasExternalUsageDialog);

export default MasExternalUsageDialog;
