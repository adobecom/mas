import { LitElement, html, nothing } from 'lit';
import { styles } from './mas-related-artifacts.css.js';
import { ARTIFACT_TYPE_KEYS, getReferencingFragments } from './references-repository.js';
import { getPromotionTagFromFragment } from '../promotions/promotion-model.js';
import * as promotionsRepository from '../promotions/promotions-repository.js';
import './mas-related-artifacts-dialog.js';

// "Related studio artifacts" box for the open card or collection: one count line per internal
// artifact type, a View artifacts button that opens the per-type list, and the loading lifecycle.
// A load starts when the fragment id differs from the last requested one, so an A -> B -> A
// switch always reloads A; a stale or detached load is invalidated and never writes state.
// A save (saveCount) reloads only when it changed the promotion tag, the one input of the result
// the open fragment owns.
export default class MasRelatedArtifacts extends LitElement {
    static styles = styles;

    static properties = {
        fragment: { type: Object },
        repository: { type: Object },
        saveCount: { type: Number },
        buckets: { state: true },
        loading: { state: true },
        error: { state: true },
        promotionLookupFailed: { state: true },
        dialogOpen: { state: true },
    };

    #loadToken = 0;
    #requestedId = null;
    #requestedPromotionTag = null;
    #abortController = null;

    constructor() {
        super();
        this.saveCount = 0;
        this.buckets = [];
        this.loading = false;
        this.error = false;
        this.promotionLookupFailed = false;
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

    willUpdate(changedProperties) {
        if (!this.fragment?.id) return;
        const savedPromotionTagChanged =
            changedProperties.has('saveCount') && getPromotionTagFromFragment(this.fragment) !== this.#requestedPromotionTag;
        if (this.fragment.id !== this.#requestedId || savedPromotionTagChanged) this.#load();
    }

    #invalidateLoad() {
        this.#loadToken += 1;
        this.#abortController?.abort();
        this.#requestedId = null;
    }

    async #load() {
        this.#invalidateLoad();
        const token = this.#loadToken;
        const fragment = this.fragment;
        const abortController = new AbortController();
        this.#abortController = abortController;
        this.#requestedId = fragment.id;
        this.#requestedPromotionTag = getPromotionTagFromFragment(fragment);
        this.buckets = [];
        this.error = false;
        this.promotionLookupFailed = false;
        this.loading = true;
        try {
            const result = await getReferencingFragments(this.repository.aem, fragment, {
                abortController,
                loadPromotionProjects: () =>
                    promotionsRepository.getPromotionProjectsForProbe(() => this.repository.loadPromotions({ rethrow: true })),
            });
            if (token !== this.#loadToken) return;
            this.buckets = result.buckets;
            this.promotionLookupFailed = result.promotionLookupFailed;
        } catch (error) {
            if (token !== this.#loadToken) return;
            console.error('Failed to load related studio artifacts:', error);
            this.error = true;
        } finally {
            if (token === this.#loadToken) this.loading = false;
        }
    }

    get #title() {
        return html`<div class="references-title">Related studio artifacts:</div>`;
    }

    get #displayBuckets() {
        const bucketsByKey = new Map(this.buckets.map((bucket) => [bucket.key, bucket]));
        return ARTIFACT_TYPE_KEYS.map((key) => bucketsByKey.get(key)).filter(Boolean);
    }

    #renderViewButton() {
        return html`<sp-action-button class="artifacts-view-link" quiet size="s" @click=${() => (this.dialogOpen = true)}>
            View artifacts
            <sp-icon-open-in size="s"></sp-icon-open-in>
        </sp-action-button>`;
    }

    render() {
        if (this.loading) {
            return html`<div class="references-container">
                ${this.#title}
                <div class="referencing-message">Loading…</div>
            </div>`;
        }
        if (this.error) {
            return html`<div class="references-container">
                ${this.#title}
                <div class="referencing-message">Related studio artifacts unavailable</div>
                <sp-action-button class="retry" quiet size="s" @click=${() => this.#load()}>Retry</sp-action-button>
            </div>`;
        }
        const displayBuckets = this.#displayBuckets;
        if (!displayBuckets.length && !this.promotionLookupFailed) return nothing;
        return html`
            <div class="references-container">
                <div class="artifacts-header">${this.#title} ${displayBuckets.length ? this.#renderViewButton() : nothing}</div>
                <div class="artifacts-counts">
                    ${displayBuckets.map(
                        (bucket) => html`<div class="artifacts-count-line">${bucket.rows.length} ${bucket.label}</div>`,
                    )}
                </div>
                ${this.promotionLookupFailed
                    ? html`<div class="referencing-message">Promo project lookup unavailable</div>`
                    : nothing}
            </div>
            <mas-related-artifacts-dialog
                .open=${this.dialogOpen}
                .buckets=${displayBuckets}
                @close=${() => (this.dialogOpen = false)}
            ></mas-related-artifacts-dialog>
        `;
    }
}

customElements.define('mas-related-artifacts', MasRelatedArtifacts);
