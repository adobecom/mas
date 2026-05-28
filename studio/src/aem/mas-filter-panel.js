import { html, css, LitElement, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import Store from '../store.js';
import { isPznCountryTagPath } from '../common/utils/personalization-utils.js';
import ReactiveController from '../reactivity/reactive-controller.js';
import router from '../router.js';

function pathToTagId(path) {
    return `mas:${path.replace('/content/cq:tags/mas/', '')}`;
}

function pathsToTagIds(paths) {
    return paths.map(({ path }) => pathToTagId(path)).join(',');
}

const EMPTY_TAGS = {
    offer_type: [],
    plan_type: [],
    market_segments: [],
    customer_segment: [],
    product_code: [],
    pzn: [], // personalization namespace from AEM
    status: [],
    'studio/content-type': [],
    custom: [],
    variant: [],
};

class MasFilterPanel extends LitElement {
    static properties = {
        tagsByType: { type: Object, state: true },
        tagsReady: { type: Boolean, state: true },
    };

    static styles = css`
        :host {
            display: flex;
            flex-direction: column;
            column-gap: 12px;
            row-gap: 10px;
            margin-bottom: 20px;
        }

        #filters-label {
            color: var(--spectrum-gray-600);
        }

        #filters {
            display: flex;
            min-height: 32px;
            align-items: center;
            flex-wrap: wrap;
            column-gap: 12px;
            row-gap: 8px;
        }

        #filters > aem-tag-picker-field,
        #filters > mas-user-picker,
        #filters > sp-action-button {
            min-height: 32px;
            height: 32px;
        }

        /* Figma "Picker (M)" styling — applied to every filter category
           except the trailing Reset Filters action button. */
        #filters > aem-tag-picker-field,
        #filters > mas-user-picker {
            /* Trigger shape */
            --aem-tag-picker-trigger-border-radius: 8px;
            --mod-actionbutton-border-radius: 8px;
            --mod-actionbutton-border-width: 2px;
            --mod-actionbutton-min-width: auto;
            --spectrum-actionbutton-height: 32px;
            --mod-actionbutton-edge-to-text: 12px;
            --mod-actionbutton-edge-to-visual-only: 11px;

            /* Default */
            --mod-actionbutton-background-color-default: var(--spectrum-gray-25, #ffffff);
            --mod-actionbutton-content-color-default: var(--spectrum-gray-800, #292929);
            --mod-actionbutton-border-color-default: var(--spectrum-gray-300, #dadada);

            /* Hover & Open hover */
            --mod-actionbutton-background-color-hover: var(--spectrum-gray-200, #e1e1e1);
            --mod-actionbutton-content-color-hover: var(--spectrum-gray-900, #131313);
            --mod-actionbutton-border-color-hover: var(--spectrum-gray-300, #dadada);

            /* Down (mouse-down) & Open not hover (popover open) */
            --mod-actionbutton-background-color-down: var(--spectrum-gray-200, #e1e1e1);
            --mod-actionbutton-content-color-down: var(--spectrum-gray-900, #131313);
            --mod-actionbutton-border-color-down: var(--spectrum-gray-300, #dadada);

            /* Keyboard focus */
            --mod-actionbutton-background-color-focus: var(--spectrum-gray-200, #e1e1e1);
            --mod-actionbutton-content-color-focus: var(--spectrum-gray-900, #131313);
            --mod-actionbutton-border-color-focus: var(--spectrum-gray-300, #dadada);

            /* Disabled */
            --mod-actionbutton-background-color-disabled: #e9e9e9;
            --mod-actionbutton-content-color-disabled: #c6c6c6;
            --mod-actionbutton-border-color-disabled: var(--spectrum-gray-300, #dadada);
        }

        /* Error state — opt-in via [error] attribute on the picker host.
           Border: alias/border/semantic/negative/focus #b72818
           Background: palette/gray/200 #e1e1e1 */
        #filters > aem-tag-picker-field[error],
        #filters > mas-user-picker[error] {
            --mod-actionbutton-background-color-default: var(--spectrum-gray-200, #e1e1e1);
            --mod-actionbutton-border-color-default: #b72818;
            --mod-actionbutton-border-color-hover: #b72818;
            --mod-actionbutton-border-color-down: #b72818;
            --mod-actionbutton-border-color-focus: #b72818;
        }

        /* Reset Filters — Figma "Action button (M)" style:
           text-only, medium weight, 8px radius, 32px height, 12px horizontal padding. */
        #filters > sp-action-button.reset-filters {
            --mod-actionbutton-border-radius: 8px;
            --mod-actionbutton-edge-to-text: 12px;
            --mod-actionbutton-edge-to-visual-only: 12px;
            --spectrum-actionbutton-height: 32px;
            --mod-actionbutton-content-color-default: var(--spectrum-gray-800, #292929);
            --mod-actionbutton-font-weight: 500;
            font-weight: 500;
        }

        /* Applied filter tags — Figma "Chips" spec.
           Default: indigo/200 bg, neutral/default text.
           Hover:   indigo/300 bg, neutral/hover text.
           Disabled: background/disabled bg, content/disabled text. */
        sp-tags {
            display: flex;
            flex-wrap: wrap;
            column-gap: 12px;
            row-gap: 12px;
        }

        sp-tags sp-tag {
            margin: 0;
            /* Background */
            --mod-tag-background-color: #ebeeff;
            --mod-tag-background-color-default: #ebeeff;
            /* Text — try every known token name + direct color */
            --mod-tag-color: #292929;
            --mod-tag-content-color: #292929;
            --mod-tag-content-color-default: #292929;
            --mod-tag-label-color: #292929;
            color: #292929;
            /* No border in any state */
            --mod-tag-border-color: transparent;
            --mod-tag-border-color-default: transparent;
            --mod-tag-border-color-hover: transparent;
            --mod-tag-border-color-focus: transparent;
            --mod-tag-border-color-key-focus: transparent;
            --mod-tag-border-color-down: transparent;
            /* Pill — set both the token and the host border-radius */
            --mod-tag-border-radius: 100px;
            --mod-tag-corner-radius: 100px;
            border-radius: 100px;
            /* Padding — Figma: 12px horizontal, 7px vertical (try every known token) */
            --mod-tag-padding-inline-start: 12px;
            --mod-tag-padding-inline-end: 12px;
            --mod-tag-padding-block-start: 7px;
            --mod-tag-padding-block-end: 7px;
            --mod-tag-edge-to-text: 12px;
            --mod-tag-edge-to-visual: 12px;
            --mod-tag-padding-x: 12px;
            --mod-tag-padding-y: 7px;
            --spectrum-tag-padding-x: 12px;
            --spectrum-tag-padding-y: 7px;
            /* Medium weight */
            --mod-tag-font-weight: 500;
            font-weight: 500;
        }

        sp-tags sp-tag:hover {
            --mod-tag-background-color: #d8deff;
            --mod-tag-background-color-hover: #d8deff;
            --mod-tag-color: #131313;
            --mod-tag-content-color: #131313;
            --mod-tag-content-color-hover: #131313;
            --mod-tag-label-color: #131313;
            color: #131313;
            --mod-tag-border-color: transparent;
            --mod-tag-border-color-hover: transparent;
        }

        sp-tags sp-tag[disabled] {
            --mod-tag-background-color: #e9e9e9;
            --mod-tag-background-color-disabled: #e9e9e9;
            --mod-tag-color: #c6c6c6;
            --mod-tag-content-color: #c6c6c6;
            --mod-tag-content-color-disabled: #c6c6c6;
            --mod-tag-label-color: #c6c6c6;
            color: #c6c6c6;
        }
    `;

    reactiveController = new ReactiveController(this, [Store.profile, Store.createdByUsers, Store.users, Store.filters]);

    /** @type {() => void} */
    #onRouterChange = () => this.#initializeTagFilters();

    constructor() {
        super();
        this.tagsByType = {
            ...EMPTY_TAGS,
        };
        this.tagsReady = false;
    }

    // Per-category casing rules (shared by initial parse and post-load resolution):
    //   plan_type, market_segments → words ≤4 chars uppercased (ABM, M2M, COM, EDU…),
    //                                longer words title-cased (Perpetual).
    //   everything else            → Title Case Each Word, but ONLY when the source
    //   is all-lowercase (slug-derived). Preserve AEM-supplied casing like
    //   "SMB", "iOS", "Adobe Express", "Logged In".
    #formatTitle(s, type) {
        if (!s) return '';
        const flat = s.replace(/[-_]+/g, ' ');
        const titleCase = (w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w);
        if (type === 'plan_type' || type === 'market_segments') {
            return flat
                .split(/\s+/)
                .map((w) => (w.length <= 4 ? w.toUpperCase() : titleCase(w)))
                .join(' ');
        }
        if (/^[a-z\s]+$/.test(flat)) return flat.replace(/\b\w/g, (c) => c.toUpperCase());
        return flat;
    }

    firstUpdated() {
        this.#initializeTagFilters();
    }

    connectedCallback() {
        super.connectedCallback();
        router.addEventListener('change', this.#onRouterChange);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        router.removeEventListener('change', this.#onRouterChange);
    }

    #initializeTagFilters() {
        this.tagsReady = false;
        this.tagsByType = {
            ...EMPTY_TAGS,
        };
        const filters = Store.filters.get();
        if (!filters.tags) {
            this.tagsReady = true;
            return;
        }
        this.tagsByType = filters.tags.split(',').reduce(
            (acc, tag) => {
                // Remove 'mas:' prefix
                const tagPath = tag.replace('mas:', '');
                const parts = tagPath.split('/');
                // Find the correct type by checking if it's in EMPTY_TAGS
                let type = parts[0];
                let typeIndex = 1;
                // Try to find the longest matching type in EMPTY_TAGS
                for (let i = 1; i < parts.length; i++) {
                    const potentialType = parts.slice(0, i + 1).join('/');
                    if (potentialType in EMPTY_TAGS) {
                        type = potentialType;
                        typeIndex = i + 1;
                    }
                }
                // Get values after the type
                const values = parts.slice(typeIndex);
                let fullPath = `/content/cq:tags/mas/${tagPath}`;
                let title = values.length > 0 ? this.#formatTitle(values[values.length - 1], type) : '';
                // For product_code, collapse child selections
                // back to the parent product for display in the tag picker
                if (type === 'product_code' && values.length > 1) {
                    const parentValue = values[0];
                    fullPath = `/content/cq:tags/mas/${type}/${parentValue}`;
                    title = this.#formatTitle(parentValue, type);
                }

                const picker = this.shadowRoot.querySelector(`aem-tag-picker-field[top="${type}"]`);
                let selectedTagTitle = '';
                picker?.selectedTags.forEach((selectedTag) => {
                    if (selectedTag.name.toLowerCase() === title.toLowerCase()) {
                        selectedTagTitle = this.#formatTitle(selectedTag.title, type);
                    }
                });

                const nextTag = {
                    path: fullPath,
                    title: selectedTagTitle || title,
                    top: type,
                };

                const existingTags = acc[type] || [];
                const alreadyExists = existingTags.some((tag) => tag.path === nextTag.path);

                return {
                    ...acc,
                    [type]: alreadyExists ? existingTags : [...existingTags, nextTag],
                };
            },
            { ...EMPTY_TAGS },
        );
        const hasNonCountryPzn = (this.tagsByType.pzn || []).some((t) => !isPznCountryTagPath(t.path));
        if (hasNonCountryPzn) {
            Store.filters.set((prev) => ({
                ...prev,
                personalizationFilterEnabled: true,
            }));
        }

        this.#resolveTagTitles();
    }

    // Wait for every relevant picker's AEM data, then swap slug-derived chip titles
    // for the canonical AEM labels and flip tagsReady so chips render once.
    // Handles both branches of picker.allTags: Promise (first load) and Map (cached).
    async #resolveTagTitles() {
        const pendingTypes = Object.keys(this.tagsByType).filter((t) => this.tagsByType[t].length > 0);
        if (pendingTypes.length === 0) {
            this.tagsReady = true;
            return;
        }

        await Promise.all(
            pendingTypes.map((type) => {
                const picker = this.shadowRoot.querySelector(`aem-tag-picker-field[top="${type}"]`);
                const tags = picker?.allTags;
                return tags && typeof tags.then === 'function' ? tags : Promise.resolve();
            }),
        );

        pendingTypes.forEach((type) => {
            const picker = this.shadowRoot.querySelector(`aem-tag-picker-field[top="${type}"]`);
            if (!picker) return;
            this.tagsByType[type].forEach((displayedTag) => {
                picker.selectedTags.forEach((selTag) => {
                    if (displayedTag.path === selTag.path) {
                        displayedTag.title = this.#formatTitle(selTag.title, type);
                    }
                });
            });
        });
        this.tagsByType = { ...this.tagsByType };
        this.tagsReady = true;
    }

    get #personalizationFilterEnabled() {
        return Store.filters.get().personalizationFilterEnabled === true;
    }

    #onPersonalizationToggleEnabled(e) {
        const enabled = e.detail.enabled;
        Store.filters.set((prev) => ({
            ...prev,
            personalizationFilterEnabled: enabled,
        }));
        if (!enabled) {
            const pznTags = this.tagsByType.pzn || [];
            this.tagsByType = {
                ...this.tagsByType,
                pzn: pznTags.filter((t) => isPznCountryTagPath(t.path)),
            };
            this.#updateFiltersParams();
        }
    }

    #expandProductCodeTags(tags) {
        const picker = this.shadowRoot.querySelector('aem-tag-picker-field[top="product_code"]');
        const allTags = picker?.allTags;

        if (!picker || !allTags || allTags instanceof Promise) {
            return tags;
        }

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
            .map((tag) => pathToTagId(tag.path))
            .filter(Boolean);

        Store.filters.set((prev) => ({
            ...prev,
            tags: tagValues.join(','),
        }));
    }

    #handleTagChange(e) {
        const picker = e.target;

        this.tagsByType = {
            ...this.tagsByType,
            [picker.top]: picker.selectedTags.map((tag) => ({
                ...tag,
                top: picker.top,
            })),
        };

        this.#updateFiltersParams();
    }

    #handleRefresh() {
        Store.search.set((prev) => ({
            ...prev,
            query: '',
        }));

        Store.filters.set((prev) => ({
            ...prev,
            tags: '',
            personalizationFilterEnabled: false,
        }));

        Store.createdByUsers.set([]);

        this.tagsByType = { ...EMPTY_TAGS };
        this.shadowRoot.querySelectorAll('aem-tag-picker-field').forEach((tagPicker) => {
            tagPicker.clear();
        });
    }

    async #handleTagDelete(e) {
        const value = e.target.value;
        this.tagsByType = {
            ...this.tagsByType,
            [value.top]: this.tagsByType[value.top].filter((tag) => tag.path !== value.path),
        };
        this.#updateFiltersParams();
    }

    #handleUserDelete(e) {
        const value = e.target.value;
        Store.createdByUsers.set(Store.createdByUsers.value.filter((user) => user.userPrincipalName !== value));
    }

    get createdByUsersTags() {
        return repeat(
            Store.createdByUsers.value,
            (user) => user.userPrincipalName,
            (user) => html`
                <sp-tag deletable @delete=${this.#handleUserDelete} .value=${user.userPrincipalName}>
                    ${user.displayName}
                    <sp-icon-user slot="icon" size="s"></sp-icon-user>
                </sp-tag>
            `,
        );
    }

    render() {
        return html`
            <div id="filters">
                <aem-tag-picker-field
                    bordered
                    namespace="/content/cq:tags/mas"
                    top="offer_type"
                    label="Offer Type"
                    multiple
                    selection="checkbox"
                    value=${pathsToTagIds(this.tagsByType.offer_type)}
                    @change=${this.#handleTagChange}
                ></aem-tag-picker-field>

                <aem-tag-picker-field
                    bordered
                    namespace="/content/cq:tags/mas"
                    top="plan_type"
                    label="Plan Type"
                    multiple
                    selection="checkbox"
                    value=${pathsToTagIds(this.tagsByType.plan_type)}
                    @change=${this.#handleTagChange}
                ></aem-tag-picker-field>

                <aem-tag-picker-field
                    bordered
                    namespace="/content/cq:tags/mas"
                    top="market_segments"
                    label="Market Segments"
                    multiple
                    selection="checkbox"
                    value=${pathsToTagIds(this.tagsByType.market_segments)}
                    @change=${this.#handleTagChange}
                ></aem-tag-picker-field>

                <aem-tag-picker-field
                    bordered
                    namespace="/content/cq:tags/mas"
                    top="customer_segment"
                    multiple
                    label="Customer Segment"
                    selection="checkbox"
                    value=${pathsToTagIds(this.tagsByType.customer_segment)}
                    @change=${this.#handleTagChange}
                ></aem-tag-picker-field>

                <aem-tag-picker-field
                    bordered
                    namespace="/content/cq:tags/mas"
                    top="product_code"
                    multiple
                    label="Product Code"
                    selection="checkbox"
                    value=${pathsToTagIds(this.tagsByType.product_code)}
                    @change=${this.#handleTagChange}
                ></aem-tag-picker-field>

                <aem-tag-picker-field
                    bordered
                    namespace="/content/cq:tags/mas"
                    top="variant"
                    label="Template"
                    multiple
                    selection="checkbox"
                    value=${pathsToTagIds(this.tagsByType.variant)}
                    @change=${this.#handleTagChange}
                ></aem-tag-picker-field>

                <aem-tag-picker-field
                    bordered
                    namespace="/content/cq:tags/mas"
                    top="status"
                    label="Status"
                    multiple
                    selection="checkbox"
                    value=${pathsToTagIds(this.tagsByType.status)}
                    @change=${this.#handleTagChange}
                ></aem-tag-picker-field>

                <aem-tag-picker-field
                    bordered
                    namespace="/content/cq:tags/mas"
                    top="studio/content-type"
                    label="Content Type"
                    multiple
                    selection="checkbox"
                    value=${pathsToTagIds(this.tagsByType['studio/content-type'])}
                    @change=${this.#handleTagChange}
                ></aem-tag-picker-field>

                <aem-tag-picker-field
                    bordered
                    namespace="/content/cq:tags/mas"
                    top="custom"
                    label="Tag"
                    multiple
                    selection="checkbox"
                    value=${pathsToTagIds(this.tagsByType.custom)}
                    @change=${this.#handleTagChange}
                ></aem-tag-picker-field>

                <aem-tag-picker-field
                    bordered
                    namespace="/content/cq:tags/mas"
                    top="pzn"
                    label="Personalization"
                    multiple
                    selection="checkbox"
                    personalization-toggle
                    .personalizationEnabled=${this.#personalizationFilterEnabled}
                    value=${pathsToTagIds(this.tagsByType.pzn)}
                    @change=${this.#handleTagChange}
                    @personalization-toggle-change=${this.#onPersonalizationToggleEnabled}
                ></aem-tag-picker-field>

                <mas-user-picker
                    bordered
                    label="Created by"
                    .currentUser=${Store.profile}
                    .selectedUsers=${Store.createdByUsers}
                    .users=${Store.users}
                ></mas-user-picker>

                <sp-action-button class="reset-filters" quiet @click=${this.#handleRefresh} title="Clear all filters"
                    >Clear all</sp-action-button
                >
            </div>
            ${this.tagsReady
                ? html`<sp-tags>
                      ${repeat(
                          Object.values(this.tagsByType)
                              .flat()
                              .filter((tag) => tag),
                          (tag) => tag.path,
                          (tag) => html`
                              <sp-tag key=${tag.path} deletable @delete=${this.#handleTagDelete} .value=${tag}
                                  >${tag.title}</sp-tag
                              >
                          `,
                      )}
                      ${this.createdByUsersTags}
                  </sp-tags>`
                : nothing}
        `;
    }
}

customElements.define('mas-filter-panel', MasFilterPanel);
