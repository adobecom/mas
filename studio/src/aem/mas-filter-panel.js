import { html, css, LitElement } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import Store from '../store.js';

// Helper function to get tags from picker value
function getTagsFromPicker(picker) {
    return picker
        .getAttribute('value')
        .split(',')
        .filter((tag) => tag);
}

// Helper function to filter out tags of a specific type
function filterOutTagType(tags, tagType) {
    return tags.filter((tag) => !tag.startsWith(`mas:${tagType}`));
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

    constructor() {
        super();
        this.tagsByType = { ...EMPTY_TAGS };
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
        // Update the store with all tags except this type, then add new ones
        const tags = getTagsFromPicker(picker);
        Store.search.set((prev) => {
            const existingTags = filterOutTagType(prev.tags ?? [], picker.top);
            return { ...prev, tags: [...existingTags, ...tags] };
        });
    }

    #handleRefresh() {
        Store.search.set((prev) => ({ ...prev, tags: [] }));
        this.tagsByType = { ...EMPTY_TAGS };
        this.shadowRoot
            .querySelectorAll('aem-tag-picker-field')
            .forEach((tagPicker) => {
                tagPicker.clear();
            });
    }

    #handleTagDelete(e) {
        const value = e.target.value;
        const picker = this.shadowRoot.querySelector(
            `aem-tag-picker-field[top="${value.top}"]`,
        );
        // Update tagsByType to remove only the specific tag
        this.tagsByType = {
            ...this.tagsByType,
            [value.top]: this.tagsByType[value.top].filter(
                (tag) => tag.path !== value.path,
            ),
        };
        // Update picker value to match
        picker.value = picker.value.filter((p) => p !== value.path);
        // Update store
        Store.search.set((prev) => {
            const tagId = `mas:${value.top}/${value.path.split('/').pop()}`;
            const existingTags = prev.tags.filter((tag) => tag !== tagId);
            return { ...prev, tags: existingTags };
        });
    }

    #updateFilterHandler(property) {
        return function (event) {
            if (!event.detail) return;
            Store.filters.set((prev) => ({
                ...prev,
                [property]: event.detail.value,
            }));
        };
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
                    @change=${this.#handleTagChange}
                ></aem-tag-picker-field>

                <aem-tag-picker-field
                    namespace="/content/cq:tags/mas"
                    top="plan_type"
                    label="Plan Type"
                    multiple
                    selection="checkbox"
                    @change=${this.#handleTagChange}
                ></aem-tag-picker-field>

                <mas-locale-picker
                    value=${Store.filters.value.locale}
                    @change=${this.#updateFilterHandler('locale')}
                ></mas-locale-picker>

                <aem-tag-picker-field
                    namespace="/content/cq:tags/mas"
                    top="market_segments"
                    label="Market Segments"
                    multiple
                    selection="checkbox"
                    @change=${this.#handleTagChange}
                ></aem-tag-picker-field>

                <aem-tag-picker-field
                    namespace="/content/cq:tags/mas"
                    top="customer_segment"
                    multiple
                    label="Customer Segment"
                    selection="checkbox"
                    @change=${this.#handleTagChange}
                ></aem-tag-picker-field>

                <aem-tag-picker-field
                    namespace="/content/cq:tags/mas"
                    top="status"
                    label="Status"
                    multiple
                    selection="checkbox"
                    @change=${this.#handleTagChange}
                ></aem-tag-picker-field>

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
