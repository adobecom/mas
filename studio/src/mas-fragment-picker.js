import { html, LitElement, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { CARD_MODEL_PATH, MAS_PRODUCT_CODE_PREFIX, TAG_MODEL_ID_MAPPING } from './constants.js';
import Store from './store.js';
import { getDamPath } from './mas-repository.js';
import { Fragment } from './aem/fragment.js';
import {
    effectiveIsVariation,
    getGroupedVariationTagsValue,
    getPromotionCode,
    getVariationTabItems,
    hasAnyVariationTabItems,
    isGroupedVariationFragment,
    pznTagsValue,
    VARIATION_TABS,
} from './editors/variation-utils.js';
import { masFragmentPickerStyles } from './mas-fragment-picker.css.js';
import ReactiveController from './reactivity/reactive-controller.js';
import { filterByTags } from './aem/aem.js';
import { fragmentHasPersonalizationTag } from './common/utils/personalization-utils.js';
import { generateCodeToUse, getService, isUUID } from './utils.js';
import './aem/aem-tag-picker-field.js';

const MODEL_PATH_TO_TAG = {
    [CARD_MODEL_PATH]: 'mas:studio/content-type/merch-card',
};

const TAG_VARIANT_PREFIX = 'mas:variant/';
const TAG_NAMESPACE = '/content/cq:tags/mas';
const PICKER_FILTERS = [
    { top: 'variant', label: 'Template' },
    { top: 'market_segments', label: 'Market segment' },
    { top: 'customer_segment', label: 'Customer segment' },
    { top: 'product_code', label: 'Product' },
];

function pathToTagId(path) {
    return `mas:${path.replace(`${TAG_NAMESPACE}/`, '')}`;
}

function pathsToTagIds(paths = []) {
    return paths.map(({ path }) => pathToTagId(path)).join(',');
}

function emptyTagsByType() {
    return PICKER_FILTERS.reduce((acc, { top }) => ({ ...acc, [top]: [] }), {});
}

export class MasFragmentPicker extends LitElement {
    static styles = masFragmentPickerStyles;

    static properties = {
        open: { type: Boolean, reflect: true },
        model: { type: String },
        excludePaths: { type: Array, attribute: false },
        multi: { type: Boolean },
        multiple: { type: Boolean },
        title: { type: String },
        query: { type: String, state: true },
        searchValue: { type: String, state: true },
        loading: { type: Boolean, state: true },
        loadingMore: { type: Boolean, state: true },
        hasMore: { type: Boolean, state: true },
        results: { type: Array, state: true },
        selection: { type: Array, state: true },
        tagsByType: { type: Object, state: true },
        expandedRows: { type: Object, state: true },
        offerDataByOsi: { type: Object, state: true },
    };

    /** Re-runs search when locale or the picker-owned tag filters change. */
    #filterStoresReactive = new ReactiveController(this, [Store.filters], () => {
        if (!this.open) return;
        this.#initializeTagFilters();
        this.search();
    });

    constructor() {
        super();
        this.open = false;
        this.model = CARD_MODEL_PATH;
        this.excludePaths = [];
        this.multi = false;
        this.multiple = false;
        this.title = 'Add fragment';
        this.query = '';
        this.searchValue = '';
        this.loading = false;
        this.loadingMore = false;
        this.hasMore = false;
        this.results = [];
        this.selection = [];
        this.tagsByType = emptyTagsByType();
        this.expandedRows = new Set();
        this.offerDataByOsi = new Map();
        this.abortController = null;
        this.searchCursor = null;
    }

    #pendingOfferDataByOsi = new Map();

    updated(changed) {
        if (changed.has('open') && this.open) {
            this.selection = [];
            this.expandedRows = new Set();
            this.#initializeTagFilters();
            this.search();
        }
        if (changed.has('query')) {
            this.search();
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.abortController?.abort();
    }

    #initializeTagFilters() {
        const nextTagsByType = emptyTagsByType();
        const rawTags = Store.filters.get().tags;
        const tagIds = Array.isArray(rawTags) ? rawTags : String(rawTags || '').split(',');
        tagIds.filter(Boolean).forEach((tagId) => {
            const tagPath = tagId.replace('mas:', '');
            const filter = PICKER_FILTERS.find(({ top }) => tagPath.startsWith(`${top}/`));
            if (!filter) return;
            const parts = tagPath.split('/');
            let fullPath = `${TAG_NAMESPACE}/${tagPath}`;
            let title = parts.at(-1)?.toUpperCase() || '';
            if (filter.top === 'product_code' && parts.length > 2) {
                const parentValue = parts[1];
                fullPath = `${TAG_NAMESPACE}/${filter.top}/${parentValue}`;
                title = parentValue.toUpperCase();
            }
            const tag = { path: fullPath, title, top: filter.top };
            if (!nextTagsByType[filter.top].some(({ path }) => path === tag.path)) {
                nextTagsByType[filter.top].push(tag);
            }
        });
        this.tagsByType = nextTagsByType;
    }

    #expandProductCodeTags(tags) {
        const picker = this.shadowRoot.querySelector('aem-tag-picker-field[top="product_code"]');
        const allTags = picker?.allTags;
        if (!picker || !allTags || allTags instanceof Promise) return tags;

        const rootPath = `${picker.namespace}/${picker.top}/`;
        const availableTags = [...allTags.values()].filter((tag) => tag.path.startsWith(rootPath));
        return tags.flatMap((tag) => {
            const descendants = availableTags.filter((candidate) => candidate.path.startsWith(`${tag.path}/`));
            const leafDescendants = descendants.filter(
                (candidate) =>
                    !availableTags.some(
                        (other) => other.path !== candidate.path && other.path.startsWith(`${candidate.path}/`),
                    ),
            );
            return leafDescendants.length ? leafDescendants : [tag];
        });
    }

    #updateFiltersParams() {
        const expandedTagsByType = {
            ...this.tagsByType,
            product_code: this.#expandProductCodeTags(this.tagsByType.product_code || []),
        };
        const tagValues = Object.values(expandedTagsByType)
            .flat()
            .map(({ path }) => pathToTagId(path));
        Store.filters.set((prev) => ({
            ...prev,
            tags: tagValues.join(','),
        }));
    }

    #handleTagChange(event) {
        const picker = event.target;
        this.tagsByType = {
            ...this.tagsByType,
            [picker.top]: picker.selectedTags.filter(Boolean).map((tag) => ({
                ...tag,
                top: picker.top,
            })),
        };
        this.#updateFiltersParams();
    }

    /** Mirrors the picker-owned tag handling in MasRepository.searchFragments for AEM list search. */
    #searchOptionsFromStores() {
        const filters = Store.filters.value;
        let tags = [];
        if (filters.tags) {
            if (typeof filters.tags === 'string') {
                tags = filters.tags.split(',').filter(Boolean);
            } else if (Array.isArray(filters.tags)) {
                tags = filters.tags.filter(Boolean);
            }
        }
        const allowedPrefixes = PICKER_FILTERS.map(({ top }) => `mas:${top}/`);
        tags = tags.filter((tag) => allowedPrefixes.some((prefix) => tag.startsWith(prefix)));

        const variants = tags
            .filter((tag) => tag.startsWith(TAG_VARIANT_PREFIX))
            .map((tag) => tag.replace(TAG_VARIANT_PREFIX, ''));
        tags = tags.filter((tag) => !tag.startsWith(TAG_VARIANT_PREFIX));

        return { tags, variants };
    }

    #applyClientFilters(fragments, { tags, variants }) {
        const personalizationOn = Store.filters.value.personalizationFilterEnabled === true;
        const tagPredicate = filterByTags(tags);
        let out = fragments;
        if (variants.length) {
            out = out.filter((item) => {
                const variant = item.fields?.find((field) => field.name === 'variant')?.values?.[0];
                return variants.includes(variant);
            });
        }
        if (tags.length) {
            out = out.filter((item) => tagPredicate(item));
        }
        if (!personalizationOn) {
            out = out.filter((item) => !fragmentHasPersonalizationTag(item));
        }
        return out;
    }

    async search() {
        if (!this.open) return;
        const repo = document.querySelector('mas-repository');
        if (!repo) return;
        this.abortController?.abort();
        this.abortController = new AbortController();
        this.searchCursor = null;
        this.hasMore = false;
        this.loading = true;
        this.loadingMore = false;
        this.results = [];
        try {
            const query = this.query?.trim() || '';
            const tag = MODEL_PATH_TO_TAG[this.model];
            const modelId = tag ? TAG_MODEL_ID_MAPPING[tag] : null;
            const path = Store.search.value.path
                ? `${getDamPath(Store.search.value.path)}/${Store.filters.value.locale}`
                : undefined;

            const { tags, variants } = this.#searchOptionsFromStores();

            if (isUUID(query)) {
                const fragment = await repo.aem.sites.cf.fragments.getById(query, this.abortController);
                this.results = fragment ? this.#filterPage([fragment], { tags, variants }) : [];
                return;
            }

            const options = {
                ...(path ? { path } : {}),
                ...(modelId ? { modelIds: [modelId] } : {}),
                ...(query ? { fullText: { text: query, queryMode: 'CONTAINS' } } : {}),
                sort: [{ on: 'modifiedOrCreated', order: 'DESC' }],
            };
            if (tags.length) options.tags = tags;

            this.searchCursor = await repo.aem.sites.cf.fragments.search(options, 50, this.abortController);
            await this.#loadNextPage({ tags, variants, append: false });
        } catch (error) {
            if (error?.name !== 'AbortError') console.error('Fragment picker search failed', error);
            this.results = [];
            this.searchCursor = null;
            this.hasMore = false;
        } finally {
            this.loading = false;
        }
    }

    #normalizeFragment(item) {
        return item instanceof Fragment ? item : new Fragment(item);
    }

    #filterPage(fragments, { tags, variants }) {
        const exclude = new Set(this.excludePaths || []);
        return this.#applyClientFilters(
            fragments.map((item) => this.#normalizeFragment(item)),
            { tags, variants },
        )
            .filter((fragment) => !exclude.has(fragment.path))
            .filter((fragment) => !this.model || fragment.model?.path === this.model);
    }

    async #loadNextPage({ tags, variants, append = true }) {
        if (!this.searchCursor) return;
        const page = await this.searchCursor.next();
        if (page.done) {
            this.searchCursor = null;
            this.hasMore = false;
            return;
        }
        const nextResults = this.#filterPage(page.value || [], { tags, variants });
        this.results = append ? [...this.results, ...nextResults] : nextResults;
        this.hasMore = true;
    }

    async #handleResultsScroll(event) {
        if (!this.hasMore || this.loading || this.loadingMore) return;
        const { scrollTop, clientHeight, scrollHeight } = event.target;
        if (scrollTop + clientHeight < scrollHeight - 24) return;
        this.loadingMore = true;
        try {
            const { tags, variants } = this.#searchOptionsFromStores();
            await this.#loadNextPage({ tags, variants });
        } catch (error) {
            if (error?.name !== 'AbortError') console.error('Fragment picker pagination failed', error);
            this.searchCursor = null;
            this.hasMore = false;
        } finally {
            this.loadingMore = false;
        }
    }

    #handleQuery(event) {
        const value = event.target.value || '';
        const merchCardQuery = this.#queryFromMerchCardStudioUrl(value);
        if (merchCardQuery) {
            event.target.value = '';
            this.searchValue = '';
            this.query = merchCardQuery;
            return;
        }
        this.searchValue = value;
        this.query = value;
    }

    #queryFromMerchCardStudioUrl(value) {
        const trimmed = String(value || '').trim();
        if (!trimmed) return '';
        let url;
        try {
            url = new URL(trimmed, window.location.origin);
        } catch {
            return '';
        }
        const hash = url.hash?.replace(/^#/, '');
        if (!hash) return '';
        const params = new URLSearchParams(hash);
        if (params.get('content-type') !== 'merch-card') return '';
        return params.get('query')?.trim() || '';
    }

    get #isMultiSelect() {
        return this.multi || this.multiple;
    }

    #toggleSelection(path) {
        if (this.#isMultiSelect) {
            this.selection = this.selection.includes(path)
                ? this.selection.filter((p) => p !== path)
                : [...this.selection, path];
            return;
        }
        this.selection = [path];
    }

    #handleRowClick(fragment) {
        this.#toggleSelection(fragment.path);
        if (!this.#isMultiSelect) this.#confirm();
    }

    #handleCheckboxClick(event, fragment) {
        event.stopPropagation();
        this.#toggleSelection(fragment.path);
    }

    async #toggleExpanded(event, fragment) {
        event.stopPropagation();
        const expandedRows = new Set(this.expandedRows);
        if (expandedRows.has(fragment.path)) {
            expandedRows.delete(fragment.path);
            this.expandedRows = expandedRows;
            return;
        }

        expandedRows.add(fragment.path);
        this.expandedRows = expandedRows;

        if (!fragment.id || fragment.references?.length) return;
        const repo = document.querySelector('mas-repository');
        const latest = await repo?.aem?.sites?.cf?.fragments?.getById?.(fragment.id).catch(() => null);
        if (!latest) return;
        const hydrated = new Fragment({ ...fragment, ...latest });
        this.results = this.results.map((item) => (item.path === fragment.path ? hydrated : item));
    }

    #confirm() {
        const picked = this.results.filter((fragment) => this.selection.includes(fragment.path));
        if (picked.length === 0) return;
        if (this.#isMultiSelect) {
            const [fragment] = picked;
            this.dispatchEvent(
                new CustomEvent('pick', {
                    detail: {
                        fragment,
                        path: fragment?.path,
                        fragments: picked,
                        paths: picked.map((f) => f.path),
                    },
                    bubbles: true,
                    composed: true,
                }),
            );
        } else {
            const [fragment] = picked;
            this.dispatchEvent(
                new CustomEvent('pick', {
                    detail: { fragment, path: fragment.path },
                    bubbles: true,
                    composed: true,
                }),
            );
        }
        this.#close();
    }

    #close() {
        this.open = false;
        this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
    }

    #fragmentTitle(fragment) {
        const title = fragment.fields?.find((f) => f.name === 'cardTitle')?.values?.[0] || fragment.title || fragment.path;
        return title;
    }

    #renderFragmentTitle(title) {
        return title ? unsafeHTML(title) : nothing;
    }

    #offerName(fragment) {
        const hasTags = Array.isArray(fragment.tags);
        return (
            fragment.getCurrentTagTitle?.(MAS_PRODUCT_CODE_PREFIX) ||
            (hasTags ? fragment.getTagTitle?.('mas:product/') : '') ||
            fragment.fragmentName ||
            fragment.path?.split('/').pop() ||
            this.#fragmentTitle(fragment)
        );
    }

    #offerSelectorId(fragment) {
        return fragment.getFieldValue?.('osi') || fragment.getFieldValue?.('stockOfferOsis') || '';
    }

    #offerData(osi) {
        if (!osi) return null;
        if (this.offerDataByOsi.has(osi)) return this.offerDataByOsi.get(osi);
        this.#resolveOfferData(osi);
        return undefined;
    }

    #offerId(fragment) {
        const osi = this.#offerSelectorId(fragment);
        return this.#offerData(osi)?.offerId || '';
    }

    async #resolveOfferData(osi) {
        if (!osi || this.offerDataByOsi.has(osi) || this.#pendingOfferDataByOsi.has(osi)) return;
        const cache = Store.translationProjects.offerDataCache;
        if (cache.has(osi)) {
            this.offerDataByOsi = new Map(this.offerDataByOsi).set(osi, cache.get(osi));
            return;
        }
        const service = getService();
        if (!service?.collectPriceOptions || !service?.resolveOfferSelectors) {
            this.offerDataByOsi = new Map(this.offerDataByOsi).set(osi, null);
            return;
        }
        const promise = (async () => {
            try {
                const priceOptions = service.collectPriceOptions({ wcsOsi: osi });
                const [offersPromise] = service.resolveOfferSelectors(priceOptions);
                const [offer] = offersPromise ? await offersPromise : [];
                if (offer) cache.set(osi, offer);
                this.offerDataByOsi = new Map(this.offerDataByOsi).set(osi, offer || null);
            } catch {
                this.offerDataByOsi = new Map(this.offerDataByOsi).set(osi, null);
            } finally {
                this.#pendingOfferDataByOsi.delete(osi);
            }
        })();
        this.#pendingOfferDataByOsi.set(osi, promise);
    }

    #authorPath(fragment) {
        if (!Array.isArray(fragment.tags)) return fragment.path;
        return generateCodeToUse(fragment, Store.search.get().path, Store.page.get())?.authorPath || fragment.path;
    }

    async #copyOfferId(event, fragment) {
        event.stopPropagation();
        const offerId = this.#offerId(fragment);
        if (!offerId) return;
        await navigator.clipboard?.writeText?.(offerId);
    }

    #renderVariationBadge(fragment) {
        const variationBadge = isGroupedVariationFragment(fragment)
            ? html`<span class="picker-variation-badge" title=${pznTagsValue(fragment) || 'Grouped variation'}>Grouped</span>`
            : effectiveIsVariation(fragment, fragment.localeDefault, true)
              ? html`<span class="picker-variation-badge">Variation</span>`
              : nothing;
        return variationBadge;
    }

    #renderOffer(fragment) {
        const icon = fragment.getFieldValue?.('mnemonicIcon');
        return html`
            <div class="picker-offer">
                ${icon
                    ? html`<img class="picker-offer-icon" src=${icon} alt="" />`
                    : html`<span class="picker-offer-icon"></span>`}
                <span class="picker-offer-name">${this.#offerName(fragment)}</span>
            </div>
        `;
    }

    #renderOfferId(fragment) {
        const osi = this.#offerSelectorId(fragment);
        const offerData = this.#offerData(osi);
        const offerId = offerData?.offerId;
        if (offerData === undefined) return html`<span class="picker-muted">Resolving...</span>`;
        if (!offerId) return html`<span class="picker-muted">–</span>`;
        return html`
            <span class="picker-truncate" title=${offerId}>${offerId}</span>
            <sp-action-button quiet size="s" label="Copy Offer ID" @click=${(event) => this.#copyOfferId(event, fragment)}>
                <sp-icon-copy slot="icon"></sp-icon-copy>
            </sp-action-button>
        `;
    }

    #renderStatus(fragment) {
        const status = fragment.status || '';
        return html`
            <span class="picker-status ${status.toLowerCase()}">
                <span class="picker-status-dot"></span>
                <span>${status ? status[0] + status.slice(1).toLowerCase() : 'Unknown'}</span>
            </span>
        `;
    }

    #renderVariationRow(fragment) {
        return html`
            <div class="picker-variation-row">
                <div class="picker-cell picker-cell-title">${this.#offerName(fragment)}</div>
                <div class="picker-cell picker-cell-title picker-truncate">
                    ${this.#renderFragmentTitle(this.#fragmentTitle(fragment))}
                </div>
                <div class="picker-cell picker-cell-offer-id">${this.#renderOfferId(fragment)}</div>
                <div class="picker-cell picker-row-path">${this.#authorPath(fragment)}</div>
                <div class="picker-cell picker-cell-status">${this.#renderStatus(fragment)}</div>
            </div>
        `;
    }

    #renderVariationPanel(fragment) {
        if (!hasAnyVariationTabItems(fragment)) return html`<div class="picker-variation-empty">No variations found.</div>`;
        return html`
            <div class="picker-variation-panel" @click=${(event) => event.stopPropagation()}>
                <sp-tabs selected="locale" quiet>
                    ${VARIATION_TABS.map((tab) => html`<sp-tab value=${tab.id} label=${tab.label}>${tab.label}</sp-tab>`)}
                    ${VARIATION_TABS.map((tab) => {
                        const items = getVariationTabItems(fragment, tab.id);
                        return html`
                            <sp-tab-panel value=${tab.id}>
                                ${items.length
                                    ? html`<div class="picker-variation-list">
                                          ${items.map((item) => {
                                              if (tab.id === 'grouped') {
                                                  item.displayTags = getGroupedVariationTagsValue(item);
                                              }
                                              if (tab.id === 'promotion') {
                                                  item.displayPromoCode = getPromotionCode(item);
                                              }
                                              return this.#renderVariationRow(this.#normalizeFragment(item));
                                          })}
                                      </div>`
                                    : html`<div class="picker-variation-empty">
                                          No ${tab.label.toLowerCase()} variations found.
                                      </div>`}
                            </sp-tab-panel>
                        `;
                    })}
                </sp-tabs>
            </div>
        `;
    }

    #renderRow(fragment) {
        const title = this.#fragmentTitle(fragment);
        const selected = this.selection.includes(fragment.path);
        const expanded = this.expandedRows.has(fragment.path);
        return html`
            <div class="picker-row-group">
                <div
                    class="picker-row ${selected ? 'is-selected' : ''}"
                    role="option"
                    aria-selected=${selected}
                    @click=${() => this.#handleRowClick(fragment)}
                >
                    <div class="picker-cell picker-cell-expand">
                        <sp-action-button
                            quiet
                            size="s"
                            label=${expanded ? 'Collapse row' : 'Expand row'}
                            @click=${(event) => this.#toggleExpanded(event, fragment)}
                        >
                            ${expanded
                                ? html`<sp-icon-chevron-down slot="icon"></sp-icon-chevron-down>`
                                : html`<sp-icon-chevron-right slot="icon"></sp-icon-chevron-right>`}
                        </sp-action-button>
                    </div>
                    <div class="picker-cell picker-cell-checkbox">
                        <sp-checkbox
                            ?checked=${selected}
                            @click=${(event) => this.#handleCheckboxClick(event, fragment)}
                            aria-label="Select ${title}"
                        ></sp-checkbox>
                    </div>
                    <div class="picker-cell picker-cell-offer">${this.#renderOffer(fragment)}</div>
                    <div class="picker-cell picker-cell-title">
                        ${this.#renderFragmentTitle(title)} ${this.#renderVariationBadge(fragment)}
                    </div>
                    <div class="picker-cell picker-cell-offer-id">${this.#renderOfferId(fragment)}</div>
                    <div class="picker-cell picker-row-path">${this.#authorPath(fragment)}</div>
                    <div class="picker-cell picker-cell-status">${this.#renderStatus(fragment)}</div>
                </div>
                ${expanded ? this.#renderVariationPanel(fragment) : nothing}
            </div>
        `;
    }

    #resultCount() {
        if (this.loading) return html`<span class="picker-result-count">…</span>`;
        const n = this.results.length;
        return html`<span class="picker-result-count"
            ><span class="picker-result-count-num">${n}</span><span class="picker-result-count-label"> result(s)</span></span
        >`;
    }

    #addButtonLabel() {
        if (this.#isMultiSelect) return 'Add selected items';
        return 'Add item';
    }

    #renderFilters() {
        return html`
            ${PICKER_FILTERS.map(
                ({ top, label }) => html`
                    <aem-tag-picker-field
                        namespace=${TAG_NAMESPACE}
                        top=${top}
                        label=${label}
                        multiple
                        selection="checkbox"
                        value=${pathsToTagIds(this.tagsByType[top])}
                        @change=${this.#handleTagChange}
                    ></aem-tag-picker-field>
                `,
            )}
        `;
    }

    #renderResults() {
        if (this.loading) return html`<sp-progress-circle indeterminate size="m"></sp-progress-circle>`;
        if (!this.results.length) return html`<div class="picker-empty">No fragments found.</div>`;
        return html`
            ${repeat(
                this.results,
                (fragment) => fragment.path,
                (fragment) => this.#renderRow(fragment),
            )}
            ${this.loadingMore
                ? html`<div class="picker-loading-more"><sp-progress-circle indeterminate size="s"></sp-progress-circle></div>`
                : nothing}
        `;
    }

    render() {
        if (!this.open) return nothing;
        return html`
            <sp-underlay open></sp-underlay>
            <sp-dialog size="l" class="mas-fragment-picker-dialog" no-divider>
                <h2 slot="heading">${this.title}</h2>
                <div class="picker-shell">
                    <sp-tabs quiet selected="fragments" class="picker-tabs">
                        <sp-tab label="Fragments" value="fragments"></sp-tab>
                        <sp-tab label="Collections" value="collections" disabled></sp-tab>
                        <sp-tab label="Placeholders" value="placeholders" disabled></sp-tab>
                        <sp-tab-panel value="fragments">
                            <div class="picker-tab-panel-inner">
                                <sp-divider class="picker-tabs-divider" size="s"></sp-divider>
                                <div class="picker-toolbar">
                                    <sp-search
                                        class="picker-search"
                                        .value=${this.searchValue}
                                        @input=${this.#handleQuery}
                                        @change=${this.#handleQuery}
                                        placeholder="Search"
                                    ></sp-search>
                                    ${this.#resultCount()}
                                </div>
                                <div class="picker-filters">${this.#renderFilters()}</div>
                                <div class="picker-table-wrap">
                                    <div class="picker-table-scroll" @scroll=${this.#handleResultsScroll}>
                                        <div class="picker-table-head" aria-hidden="true">
                                            <span></span>
                                            <span></span>
                                            <span>Offer</span>
                                            <span>Fragment title</span>
                                            <span>Offer ID</span>
                                            <span>Path</span>
                                            <span>Status</span>
                                        </div>
                                        <div class="picker-results" role="listbox">${this.#renderResults()}</div>
                                    </div>
                                </div>
                            </div>
                        </sp-tab-panel>
                        <sp-tab-panel value="collections"></sp-tab-panel>
                        <sp-tab-panel value="placeholders"></sp-tab-panel>
                    </sp-tabs>
                </div>
                <div slot="footer" class="picker-footer-summary">
                    <span class="picker-footer-summary-num">Selected items (${this.selection.length})</span>
                </div>
                <sp-button slot="button" variant="secondary" @click=${this.#close}>Cancel</sp-button>
                <sp-button slot="button" variant="accent" ?disabled=${this.selection.length === 0} @click=${this.#confirm}>
                    ${this.#addButtonLabel()}
                </sp-button>
            </sp-dialog>
        `;
    }
}

customElements.define('mas-fragment-picker', MasFragmentPicker);
