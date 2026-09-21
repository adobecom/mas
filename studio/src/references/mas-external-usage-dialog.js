import { LitElement, html, nothing } from 'lit';
import { styles } from './mas-external-usage-dialog.css.js';
/**
 * Modal listing the external pages that requested the open fragment, derived from Akamai CDN
 * referer logs (MWPW-185891).
 *
 * The counterpart to mas-related-artifacts-dialog: that one answers "what inside Studio points at
 * this fragment", this one answers "what out on the web actually serves it", and from which
 * countries.
 */
class MasExternalUsageDialog extends LitElement {
    static styles = styles;

    static properties = {
        open: { type: Boolean },
        usage: { type: Object },
        loading: { type: Boolean },
        sortDirection: { state: true },
    };

    constructor() {
        super();
        this.open = false;
        this.usage = null;
        this.loading = false;
        this.sortDirection = 'asc';
    }

    willUpdate(changedProperties) {
        if (changedProperties.has('open') && this.open) {
            this.sortDirection = 'asc';
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
        // Locale breaks the tie so the rows of one URL keep a stable order between renders, rather
        // than depending on whatever order the action happened to return them in.
        const direction = this.sortDirection === 'desc' ? -1 : 1;
        return [...this.#pages].sort((a, b) => (a.url.localeCompare(b.url) || a.locale.localeCompare(b.locale)) * direction);
    }

    #toggleSort() {
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    }

    #handleClose() {
        this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
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
            <sp-table emphasized scroller class="pages-table">
                <sp-table-head>
                    <sp-table-head-cell
                        sortable
                        sort-direction=${this.sortDirection === 'desc' ? 'descending' : 'ascending'}
                        @click=${() => this.#toggleSort()}
                    >
                        ${commonHost ? `Page on ${commonHost}` : 'Page'}
                    </sp-table-head-cell>
                    <sp-table-head-cell>Countries</sp-table-head-cell>
                </sp-table-head>
                <sp-table-body>${pages.map((page) => this.#renderRow(page, commonHost))}</sp-table-body>
            </sp-table>
        `;
    }

    render() {
        if (!this.open) return nothing;
        // sp-underlay + sp-dialog rather than sp-dialog-wrapper, so the overlay is not trapped below
        // the sticky #preview-column stacking context -- same reason as the related artifacts dialog.
        return html`
            <sp-underlay open @click=${() => this.#handleClose()}></sp-underlay>
            <sp-dialog no-divider size="l" class="usage-dialog">
                <div class="dialog-content">
                    <div class="dialog-header">
                        <h2 class="dialog-title">Related pages</h2>
                        <sp-action-button quiet label="Close" class="dialog-close" @click=${() => this.#handleClose()}>
                            <sp-icon-close slot="icon"></sp-icon-close>
                        </sp-action-button>
                    </div>
                    <div class="table-wrapper">${this.#renderBody()}</div>
                    ${this.usage?.updatedAt
                        ? html`<div class="usage-freshness">Updated ${new Date(this.usage.updatedAt).toLocaleString()}</div>`
                        : nothing}
                </div>
            </sp-dialog>
        `;
    }
}

customElements.define('mas-external-usage-dialog', MasExternalUsageDialog);

export default MasExternalUsageDialog;
