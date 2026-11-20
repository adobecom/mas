import { LitElement, html, nothing } from 'lit';
import { referencesBoxStyles } from './references-box.css.js';
import { canFetchFragmentUsage, fetchFragmentUsage, groupPagesByRegion } from './usage-repository.js';
import './mas-external-usage-dialog.js';

// "Related pages" box for the open fragment: one count line per region it is served in, with
// "Global" covering pages whose traffic is spread across regions, and a View pages button that
// opens the full list. Data is CDN referer traffic from the fragment-usage IO action, so it
// reflects what is actually served rather than what links to the fragment inside Studio.
// Loads follow the same rules as mas-related-artifacts: a new fragment id starts a load, and a
// stale or detached load is invalidated and never writes state. A save cannot change traffic, so
// it does not reload.
export default class MasRelatedPages extends LitElement {
    static styles = referencesBoxStyles;

    static properties = {
        fragment: { type: Object },
        usage: { state: true },
        loading: { state: true },
        dialogOpen: { state: true },
    };

    #loadToken = 0;
    #requestedId = null;
    #abortController = null;

    constructor() {
        super();
        this.usage = null;
        this.loading = false;
        this.dialogOpen = false;
    }

    connectedCallback() {
        super.connectedCallback();
        if (this.hasUpdated) this.requestUpdate();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.#invalidateLoad();
    }

    willUpdate() {
        // Without an IO backend the lookup cannot return anything, so skip it before touching state.
        if (!this.fragment?.id || !canFetchFragmentUsage()) return;
        if (this.fragment.id !== this.#requestedId) this.#load();
    }

    #invalidateLoad() {
        this.#loadToken += 1;
        this.#abortController?.abort();
        this.#requestedId = null;
    }

    async #load() {
        this.#invalidateLoad();
        const token = this.#loadToken;
        const abortController = new AbortController();
        this.#abortController = abortController;
        this.#requestedId = this.fragment.id;
        this.usage = null;
        this.dialogOpen = false;
        this.loading = true;
        const usage = await fetchFragmentUsage(this.fragment.id, { signal: abortController.signal });
        if (token !== this.#loadToken) return;
        this.usage = usage;
        this.loading = false;
    }

    get #title() {
        return html`<div class="references-title">Related pages:</div>`;
    }

    render() {
        if (this.loading) {
            return html`<div class="references-container">
                ${this.#title}
                <div class="referencing-message">Loading…</div>
            </div>`;
        }
        if (!this.usage) return nothing;
        if (!this.usage.available) {
            return html`<div class="references-container">
                ${this.#title}
                <div class="referencing-message">Usage data unavailable</div>
            </div>`;
        }
        const regions = groupPagesByRegion(this.usage.pages);
        // Usage is recorded per requested id. Pages mostly request a parent, and the server swaps in
        // its translation or variation, so an empty list here does not mean the fragment goes unseen.
        if (!regions.length) {
            return html`<div class="references-container">
                ${this.#title}
                <div class="referencing-message">No pages request this fragment directly</div>
            </div>`;
        }
        return html`
            <div class="references-container">
                <div class="artifacts-header">
                    ${this.#title}
                    <sp-action-button class="artifacts-view-link" quiet size="s" @click=${() => (this.dialogOpen = true)}>
                        View pages
                        <sp-icon-open-in size="s"></sp-icon-open-in>
                    </sp-action-button>
                </div>
                <div class="artifacts-counts">
                    ${regions.map(
                        ({ region, pages }) => html`<div class="artifacts-count-line">${pages.length} ${region}</div>`,
                    )}
                </div>
            </div>
            <mas-external-usage-dialog
                .open=${this.dialogOpen}
                .usage=${this.usage}
                @close=${() => (this.dialogOpen = false)}
            ></mas-external-usage-dialog>
        `;
    }
}

customElements.define('mas-related-pages', MasRelatedPages);
