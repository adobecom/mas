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
    };

    static styles = css`
        :host {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        #filters-label {
            color: var(--spectrum-gray-600);
        }

        #filters {
            display: flex;
            min-height: 32px;
            align-items: center;
            flex-wrap: wrap;
        }

        .filter-icon {
            inline-size: 20px;
            block-size: 20px;
            color: var(--spectrum-white);
        }

        .filter-icon-path {
            stroke: var(--spectrum-neutral-content-color-default);
            stroke-width: 3px;
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
        this.tagsByType = {
            ...EMPTY_TAGS,
        };
        const filters = Store.filters.get();
        if (!filters.tags) return;
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
                let title = values.length > 0 ? values[values.length - 1].toUpperCase() : '';
                // For product_code, collapse child selections
                // back to the parent product for display in the filter chips
                if (type === 'product_code' && values.length > 1) {
                    const parentValue = values[0];
                    fullPath = `/content/cq:tags/mas/${type}/${parentValue}`;
                    title = parentValue.toUpperCase();
                }

                const picker = this.shadowRoot.querySelector(`aem-tag-picker-field[top="${type}"]`);
                picker?.allTags.then?.(() => {
                    // when tags are loaded
                    this.tagsByType[type].forEach((displayedTag) => {
                        picker.selectedTags.forEach((selTag) => {
                            if (displayedTag.path === selTag.path) {
                                displayedTag.title = selTag.title;
                            }
                        });
                    });
                    this.tagsByType = {
                        ...this.tagsByType,
                    };
                });

                let selectedTagTitle = '';
                picker?.selectedTags.forEach((selectedTag) => {
                    if (selectedTag.name.toLowerCase() === title.toLowerCase()) {
                        selectedTagTitle = selectedTag.title;
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
                <sp-tag size="s" deletable @delete=${this.#handleUserDelete} .value=${user.userPrincipalName}>
                    ${user.displayName}
                    <sp-icon-user slot="icon" size="s"></sp-icon-user>
                </sp-tag>
            `,
        );
    }

    render() {
        return html`
            <div id="filters">
                ${this.filterIcon}
                <aem-tag-picker-field
                    namespace="/content/cq:tags/mas"
                    top="offer_type"
                    label="Offer Type"
                    multiple
                    selection="checkbox"
                    value=${pathsToTagIds(this.tagsByType.offer_type)}
                    @change=${this.#handleTagChange}
                ></aem-tag-picker-field>

                <aem-tag-picker-field
                    namespace="/content/cq:tags/mas"
                    top="plan_type"
                    label="Plan Type"
                    multiple
                    selection="checkbox"
                    value=${pathsToTagIds(this.tagsByType.plan_type)}
                    @change=${this.#handleTagChange}
                ></aem-tag-picker-field>

                <aem-tag-picker-field
                    namespace="/content/cq:tags/mas"
                    top="market_segments"
                    label="Market Segments"
                    multiple
                    selection="checkbox"
                    value=${pathsToTagIds(this.tagsByType.market_segments)}
                    @change=${this.#handleTagChange}
                ></aem-tag-picker-field>

                <aem-tag-picker-field
                    namespace="/content/cq:tags/mas"
                    top="customer_segment"
                    multiple
                    label="Customer Segment"
                    selection="checkbox"
                    value=${pathsToTagIds(this.tagsByType.customer_segment)}
                    @change=${this.#handleTagChange}
                ></aem-tag-picker-field>

                <aem-tag-picker-field
                    namespace="/content/cq:tags/mas"
                    top="product_code"
                    multiple
                    label="Product Code"
                    selection="checkbox"
                    value=${pathsToTagIds(this.tagsByType.product_code)}
                    @change=${this.#handleTagChange}
                ></aem-tag-picker-field>

                <aem-tag-picker-field
                    namespace="/content/cq:tags/mas"
                    top="variant"
                    label="Template"
                    multiple
                    selection="checkbox"
                    value=${pathsToTagIds(this.tagsByType.variant)}
                    @change=${this.#handleTagChange}
                ></aem-tag-picker-field>

                <aem-tag-picker-field
                    namespace="/content/cq:tags/mas"
                    top="status"
                    label="Status"
                    multiple
                    selection="checkbox"
                    value=${pathsToTagIds(this.tagsByType.status)}
                    @change=${this.#handleTagChange}
                ></aem-tag-picker-field>

                <aem-tag-picker-field
                    namespace="/content/cq:tags/mas"
                    top="studio/content-type"
                    label="Content Type"
                    multiple
                    selection="checkbox"
                    value=${pathsToTagIds(this.tagsByType['studio/content-type'])}
                    @change=${this.#handleTagChange}
                ></aem-tag-picker-field>

                <aem-tag-picker-field
                    namespace="/content/cq:tags/mas"
                    top="custom"
                    label="Tag"
                    multiple
                    selection="checkbox"
                    value=${pathsToTagIds(this.tagsByType.custom)}
                    @change=${this.#handleTagChange}
                ></aem-tag-picker-field>

                <aem-tag-picker-field
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
                    label="Created by"
                    .currentUser=${Store.profile}
                    .selectedUsers=${Store.createdByUsers}
                    .users=${Store.users}
                ></mas-user-picker>

                <sp-action-button quiet @click=${this.#handleRefresh} title="Clear all filters"
                    >Reset Filters
                    <sp-icon-refresh slot="icon"></sp-icon-refresh>
                </sp-action-button>
            </div>
            <sp-tags>
                ${repeat(
                    Object.values(this.tagsByType)
                        .flat()
                        .filter((tag) => tag),
                    (tag) => tag.path,
                    (tag) => html`
                        <sp-tag key=${tag.path} size="s" deletable @delete=${this.#handleTagDelete} .value=${tag}
                            >${tag.title}</sp-tag
                        >
                    `,
                )}
                ${this.createdByUsersTags}
            </sp-tags>
        `;
    }

    get filterIcon() {
        return html`<sp-icon class="filter-icon">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 36 36"
                role="img"
                fill="currentColor"
                height="20"
                width="20"
                aria-hidden="true"
                aria-label=""
            >
                <path
                    class="filter-icon-path"
                    d="M30.946 2H3.054a1 1 0 0 0-.787 1.617L14 18.589V33.9a.992.992 0 0 0 1.68.824l3.981-4.153a1.219 1.219 0 0 0 .339-.843V18.589L31.733 3.617A1 1 0 0 0 30.946 2Z"
                ></path></svg
        ></sp-icon>`;
    }
}

customElements.define('mas-filter-panel', MasFilterPanel);
