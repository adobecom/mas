import { LitElement, html, nothing } from 'lit';
import { dialogTableStyles } from './dialog-table.css.js';
import { styles } from './mas-external-usage-dialog.css.js';
import { showToast } from '../utils.js';
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
 *
 * The modal sp-overlay owns focus entry, Tab containment, Escape and focus restoration; the dialog
 * wrapper owns the frame, headline, close button and underlay.
 */
class MasExternalUsageDialog extends LitElement {
    static styles = [dialogTableStyles, styles];

    static properties = {
        open: { type: Boolean },
        usage: { type: Object },
        sortColumn: { state: true },
        sortDirection: { state: true },
    };

    constructor() {
        super();
        this.open = false;
        this.usage = null;
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

    #handleSorted(event) {
        const { sortKey, sortDirection } = event.detail;
        if (sortKey === this.sortColumn) {
            this.sortDirection = sortDirection;
            return;
        }
        // A column starts in the direction it is normally read in: busiest first for counts,
        // A→Z for text.
        this.sortColumn = sortKey;
        this.sortDirection = sortKey === 'requests' ? 'desc' : 'asc';
    }

    /** Only the active column carries a direction, otherwise every header shows a sort arrow. */
    #sortDirectionFor(column) {
        return this.sortColumn === column ? this.sortDirection : nothing;
    }

    #handleOverlayClosed(event) {
        if (event.target !== event.currentTarget) return;
        this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
    }

    async #copyUrl(url) {
        try {
            await navigator.clipboard.writeText(url);
            showToast('Page URL copied to clipboard', 'positive');
        } catch {
            showToast('Failed to copy page URL to clipboard', 'negative');
        }
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
            <sp-table emphasized class="pages-table dialog-table" @sorted=${this.#handleSorted}>
                <sp-table-head>
                    <sp-table-head-cell sortable sort-key="page" sort-direction=${this.#sortDirectionFor('page')}>
                        ${commonHost ? `Page on ${commonHost}` : 'Page'}
                    </sp-table-head-cell>
                    <sp-table-head-cell
                        sortable
                        sort-key="requests"
                        class="requests-column"
                        sort-direction=${this.#sortDirectionFor('requests')}
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
        return html`
            <sp-overlay type="modal" open @sp-closed=${this.#handleOverlayClosed}>
                <sp-dialog-wrapper headline="Related pages" dismissable underlay no-divider size="l">
                    <div class="dialog-content">
                        <div class="table-wrapper">${this.#renderBody()}</div>
                        ${this.usage?.available
                            ? html`<div class="usage-note">
                                  Counts and page coverage are a bounded sample — the busiest pages over the last 7 days, up to
                                  100 rows — not a complete request total.
                              </div>`
                            : nothing}
                        ${this.usage?.updatedAt
                            ? html`<div class="usage-freshness">
                                  Updated ${new Date(this.usage.updatedAt).toLocaleString()}
                              </div>`
                            : nothing}
                    </div>
                </sp-dialog-wrapper>
            </sp-overlay>
        `;
    }
}

customElements.define('mas-external-usage-dialog', MasExternalUsageDialog);

export default MasExternalUsageDialog;
