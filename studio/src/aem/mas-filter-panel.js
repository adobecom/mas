import { html, css, LitElement, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import Store from '../store.js';
import ReactiveController from '../reactivity/reactive-controller.js';

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
    status: [],
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
    `;

    storeController = new ReactiveController(this, [Store.user]);

    constructor() {
        super();
        this.tagsByType = {
            ...EMPTY_TAGS,
        };
    }

    firstUpdated() {
        this.#initializeTagFilters();
    }

    #initializeTagFilters() {
        const filters = Store.filters.get();
        if (!filters.tags?.length) return;
        this.tagsByType = filters.tags.reduce(
            (acc, tag) => {
                // Handle 'mas:type/value' format
                const [type, value] = tag.replace('mas:', '').split('/', 2);
                const fullPath = `/content/cq:tags/mas/${type}/${value}`;
                return {
                    ...acc,
                    [type]: [
                        ...(acc[type] || []),
                        {
                            path: fullPath,
                            title: value.toUpperCase(),
                            top: type,
                        },
                    ],
                };
            },
            { ...EMPTY_TAGS },
        );
    }

    #updateFiltersParams() {
        Store.filters.set((prev) => ({
            ...prev,
            tags: Object.values(this.tagsByType ?? EMPTY_TAGS)
                .flat()
                .map((tag) => pathToTagId(tag.path)),
        }));
    }

    #handleTagChange(e) {
        const picker = e.target;

        // Update the tags for this specific type, adding top value to each tag
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
        Store.search.set((prev) => ({ ...prev, tags: [] }));
        Store.user.set(null);
        this.tagsByType = { ...EMPTY_TAGS };
        this.shadowRoot
            .querySelectorAll('aem-tag-picker-field')
            .forEach((tagPicker) => {
                tagPicker.clear();
            });
    }

    async #handleTagDelete(e) {
        const value = e.target.value;
        // Update tagsByType to remove only the specific tag
        this.tagsByType = {
            ...this.tagsByType,
            [value.top]: this.tagsByType[value.top].filter(
                (tag) => tag.path !== value.path,
            ),
        };
        this.#updateFiltersParams();
    }

    #handleUserDelete() {
        Store.user.set(null);
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

                <mas-locale-picker></mas-locale-picker>

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
                    top="status"
                    label="Status"
                    multiple
                    selection="checkbox"
                    value=${pathsToTagIds(this.tagsByType.status)}
                    @change=${this.#handleTagChange}
                ></aem-tag-picker-field>

                <mas-user-picker label="Created by"></mas-user-picker>

                <sp-action-button
                    quiet
                    @click=${this.#handleRefresh}
                    title="Clear all filters"
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
                        <sp-tag
                            key=${tag.path}
                            size="s"
                            deletable
                            @delete=${this.#handleTagDelete}
                            .value=${tag}
                            >${tag.title}</sp-tag
                        >
                    `,
                )}
                ${Store.user.get()
                    ? html`
                          <sp-tag
                              size="s"
                              deletable
                              @delete=${this.#handleUserDelete}
                              >${Store.user.get().firstName}
                              ${Store.user.get().lastName}
                              <sp-icon-user slot="icon" size="s"></sp-icon-user>
                          </sp-tag>
                      `
                    : nothing}
            </sp-tags>
        `;
    }

    get filterIcon() {
        // this is a copy of sp-icon-filter with outline style manually added
        return html`<sp-icon
            style="inline-size: 20px; block-size: 20px;  color: var(--spectrum-white);"
        >
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
                    d="M30.946 2H3.054a1 1 0 0 0-.787 1.617L14 18.589V33.9a.992.992 0 0 0 1.68.824l3.981-4.153a1.219 1.219 0 0 0 .339-.843V18.589L31.733 3.617A1 1 0 0 0 30.946 2Z"
                    style="
    stroke: var(--spectrum-neutral-content-color-default);
    stroke-width: 3px;
"
                ></path></svg
        ></sp-icon>`;
    }
}

customElements.define('mas-filter-panel', MasFilterPanel);
