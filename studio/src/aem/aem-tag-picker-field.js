import { LitElement, html, css, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { AEM } from './aem.js';

const AEM_TAG_PATTERN = /^[a-zA-Z][a-zA-Z0-9]*:/;
const namespaces = {};

/**
 * Converts from attribute (tag format) to property (path format).
 * e.g. "mas:product/photoshop" --> "/content/cq:tags/mas/product/photoshop"
 */
export function fromAttribute(value) {
    if (!value) return [];
    const tags = value.split(',');
    return tags
        .map((tag) => tag.trim())
        .map((tag) => {
            if (AEM_TAG_PATTERN.test(tag) === false) return false;
            const [namespace, path] = tag.split(':');
            if (!namespace || !path) return '';
            return path ? `/content/cq:tags/${namespace}/${path}` : '';
        })
        .filter(Boolean);
}

/**
 * Converts from property (path format) to attribute (tag format).
 * e.g. "/content/cq:tags/mas/product/photoshop" --> "mas:product/photoshop"
 */
export function toAttribute(value) {
    if (!value || value.length === 0) return '';
    return value
        .map((path) => {
            const match = path.match(/\/content\/cq:tags\/([^/]+)\/(.+)$/);
            return match ? `${match[1]}:${match[2]}` : '';
        })
        .filter(Boolean)
        .join(',');
}

class AemTagPickerField extends LitElement {
    static properties = {
        baseUrl: { type: String, attribute: 'base-url' },
        label: { type: String },
        bucket: { type: String },
        // Controls whether popover is open in 'checkbox' mode
        open: { type: Boolean },
        // The actual selected tag paths (e.g., ["/content/cq:tags/namespace/top/foo"])
        value: {
            type: Array,
            converter: { fromAttribute, toAttribute },
            reflect: true,
        },
        namespace: { type: String },
        top: { type: String },
        multiple: { type: Boolean }, // Whether multiple selection is allowed
        hierarchicalTags: { type: Object, state: true },
        selected: { type: String },
        ready: { type: Boolean, state: true },
        selection: { type: String }, // 'checkbox' | default-hierarchy
        flatTags: { type: Array, state: true },

        // Temporary selections in 'checkbox' mode (before Apply)
        tempValue: { type: Array, state: true },

        searchQuery: { type: String, state: true },
    };

    static styles = css`
        :host {
            display: flex;
            align-items: center;
            flex-direction: column;
        }

        :host([selection='checkbox']) {
            width: 248px;
            max-height: 326px;
        }

        :host([selection='checkbox']) sp-dialog {
            width: 100%;
            height: 100%;
        }

        sp-tags {
            width: 100%;
            position: relative;
        }
        sp-dialog {
            min-height: 340px;
            max-height: 50vh;
            overflow-y: auto;
        }
        sp-popover {
            margin-top: var(--margin-picker-top, 0px);
        }

        #content {
            padding: 8px;
        }

        #footer {
            width: 100%;
            height: 40px;
            align-items: center;
            display: flex;
            gap: 8px;
            justify-content: end;
        }

        #footer span {
            flex: 1;
        }

        .checkbox-list {
            display: flex;
            flex-direction: column;
            gap: 2px;
            max-height: 246px;
            overflow-y: auto;
            padding-inline-start: 4px;
        }

        sp-checkbox {
            height: 40px;
        }
    `;

    #aem;

    constructor() {
        super();
        this.baseUrl = document.querySelector(
            'meta[name="aem-base-url"]',
        )?.content;
        this.bucket = null;
        this.top = null;
        this.multiple = false;
        this.hierarchicalTags = new Map();
        this.flatTags = [];
        this.value = [];
        this.tempValue = [];
        this.#aem = null;
        this.ready = false;
        this.selection = ''; // e.g., 'picker' | 'checkbox' | ...
        this.searchQuery = '';
        this.open = false;
    }

    connectedCallback() {
        super.connectedCallback();
        this.#aem = new AEM(this.bucket, this.baseUrl);
        this.loadTags();
    }

    get #tagsRoot() {
        if (this.top) return `${this.namespace}/${this.top}/`;
        return `${this.namespace}/`;
    }

    // Returns the cached data for this namespace (if loaded)
    get #data() {
        return namespaces[this.namespace];
    }

    async loadTags() {
        if (!this.#data) {
            // Not loaded yet, create a placeholder Promise
            let resolveNamespace;
            namespaces[this.namespace] = new Promise((resolve) => {
                resolveNamespace = resolve;
            });
            // Fetch from AEM
            const rawTags = await this.#aem.tags.list(this.namespace);
            if (!rawTags) return;
            // Store as a Map keyed by tag path
            namespaces[this.namespace] = new Map(
                rawTags.hits.map((tag) => [tag.path, tag]),
            );
            resolveNamespace();
        } else if (this.#data instanceof Promise) {
            // If still loading, wait
            await this.#data;
        }

        // Filter to only the relevant top-level (this.namespace + this.top)
        const allTags = [...this.#data.values()].filter((tag) =>
            tag.path.startsWith(this.#tagsRoot),
        );

        // "picker" or "checkbox" => flat list
        if (this.selection === 'picker' || this.selection === 'checkbox') {
            this.flatTags = allTags
                .filter((tag) => tag.title)
                .sort((a, b) =>
                    a.title.localeCompare(b.title, undefined, {
                        sensitivity: 'base',
                    }),
                )
                .map((tag) => tag.path);
        } else {
            // Otherwise build a hierarchical structure
            this.hierarchicalTags = this.buildHierarchy(allTags);
        }

        // In checkbox mode, tempValue = current value
        this.tempValue = [...this.value];
        this.ready = true;
    }

    buildHierarchy(tags) {
        const root = new Map();
        tags.forEach((tag) => {
            const path = tag.path.replace(this.#tagsRoot, '');
            const parts = path.split('/');
            let currentLevel = root;

            parts.forEach((part, index) => {
                if (!currentLevel.has(part)) {
                    currentLevel.set(part, {
                        __info__: index === parts.length - 1 ? tag : null,
                        __children__: new Map(),
                    });
                }
                currentLevel = currentLevel.get(part).__children__;
            });
        });
        return root;
    }

    // For hierarchical or single-click modes
    async toggleTag(path) {
        await this.#data; // ensure data is loaded first
        const currentValue = [...(this.value || [])];
        const index = currentValue.indexOf(path);

        if (!this.multiple) {
            // single select
            this.value = [path];
            return;
        }
        // multi select
        if (index === -1) {
            currentValue.push(path);
        } else {
            currentValue.splice(index, 1);
        }
        this.value = currentValue;
    }

    // sp-picker or sp-sidenav "change" event handler
    async #handleChange(event) {
        const path = event.target.value;
        // Clear out picker's value for single-select
        if (event.target.tagName.toLowerCase() === 'sp-picker') {
            event.target.value = '';
        }
        this.selected = path;
        this.toggleTag(path);
    }

    // sp-tag "delete" event
    #deleteTag(event) {
        const pathToDelete = event.target.dataset.path;
        this.toggleTag(pathToDelete);
    }

    // Convert a path to a tag's friendly title
    #resolveTagTitle(path) {
        const tag = this.#data.get(path);
        return tag ? tag.title : '';
    }

    // Recursively render <sp-sidenav-item> for hierarchical tags
    renderSidenavItems(node, parentPath = '') {
        return [...node.entries()].map(([key, item]) => {
            const hasChildren = item.__children__.size > 0;
            const info = item.__info__;
            const label = info ? this.#resolveTagTitle(info.path) : key;
            const value = info ? info.path : `${parentPath}/${key}`;
            return html`
                <sp-sidenav-item label="${label}" value="${value}">
                    ${hasChildren
                        ? this.renderSidenavItems(item.__children__, value)
                        : nothing}
                    ${hasChildren
                        ? html`<sp-icon-labels slot="icon"></sp-icon-labels>`
                        : html`<sp-icon-label slot="icon"></sp-icon-label>`}
                </sp-sidenav-item>
            `;
        });
    }

    // In hierarchical mode, only keep tags that start under #tagsRoot
    get tagsInHierarchy() {
        return this.value.filter((path) => path.startsWith(this.#tagsRoot));
    }

    // Renders the chosen tags for hierarchical or picker
    get tags() {
        if (!this.ready) return nothing;

        if (this.selection === 'picker') {
            return html`
                <sp-picker @change=${this.#handleChange} value=${this.value}>
                    ${repeat(
                        this.flatTags,
                        (path) => path,
                        (path) => html`
                            <sp-menu-item value="${path}">
                                ${this.#resolveTagTitle(path)}
                            </sp-menu-item>
                        `,
                    )}
                </sp-picker>
            `;
        }

        // hierarchical: display sp-tags with sp-tag for each selection
        if (this.tagsInHierarchy.length === 0) return nothing;
        return repeat(
            this.tagsInHierarchy,
            (path) => path,
            (path) => html`
                <sp-tag deletable @delete=${this.#deleteTag} data-path=${path}>
                    ${this.#resolveTagTitle(path)}
                    <sp-icon-label slot="icon"></sp-icon-label>
                </sp-tag>
            `,
        );
    }

    // Keep the internal state & notify on changes
    updated(changedProperties) {
        if (changedProperties.has('value')) {
            // Keep tempValue in sync if outside changes the main value
            this.tempValue = [...this.value];
            this.#notifyChange();
        }
        this.#updateMargin();
    }

    async #notifyChange() {
        await this.updateComplete;
        this.dispatchEvent(
            new CustomEvent('change', {
                bubbles: true,
                composed: true,
            }),
        );
    }

    // Helps shift the popover downward if many sp-tags are displayed
    get popoverElement() {
        return this.shadowRoot.querySelector('sp-popover');
    }

    async #updateMargin() {
        await this.updateComplete;
        if (
            !this.popoverElement ||
            !/bottom/.test(this.popoverElement.placement)
        )
            return;
        const margin =
            this.shadowRoot.querySelector('sp-tag:last-child')?.offsetTop ?? 0;
        this.style.setProperty('--margin-picker-top', `${margin}px`);
    }

    get triggerLabel() {
        if (this.label) return this.label;
        return this.multiple ? 'Select tags' : 'Select a tag';
    }

    // -------------- Checkbox Mode Methods --------------

    #handleCheckboxToggle(event) {
        const path = event.target.value;
        if (!this.multiple) {
            this.tempValue = [path];
            return;
        }
        const current = [...this.tempValue];
        const idx = current.indexOf(path);
        if (idx > -1) {
            current.splice(idx, 1);
        } else {
            current.push(path);
        }
        this.tempValue = current;
    }

    resetSelection() {
        this.tempValue = [...this.value];
    }

    applySelection() {
        this.value = [...this.tempValue];
        this.open = false;
    }

    /**
     * - Clicking the action button toggles the popover.
     * - The list of sp-checkbox is scrollable if too large.
     * - The footer shows # selected, plus Reset/Apply.
     */
    renderCheckboxMode() {
        let filteredTags = this.flatTags;
        if (this.flatTags.length > 7) {
            filteredTags = this.flatTags.filter((path) =>
                this.#resolveTagTitle(path)
                    .toLowerCase()
                    .includes(this.searchQuery.toLowerCase()),
            );
        }

        return html`
            <overlay-trigger placement="bottom" .open=${this.open}>
                <sp-action-button
                    slot="trigger"
                    @click=${() => (this.open = !this.open)}
                >
                    ${this.triggerLabel}
                </sp-action-button>

                <sp-popover
                    slot="click-content"
                    direction="bottom"
                    class="checkbox-popover"
                    @close=${() => (this.open = false)}
                >
                    <div id="content">
                        ${this.flatTags.length > 7
                            ? html`
                                  <sp-search
                                      @input=${(e) =>
                                          (this.searchQuery = e.target.value)}
                                      placeholder="Search"
                                  ></sp-search>
                              `
                            : nothing}
                        <div class="checkbox-list">
                            ${filteredTags.map((path) => {
                                const checked = this.tempValue.includes(path);
                                return html`
                                    <sp-checkbox
                                        value="${path}"
                                        ?checked=${checked}
                                        @change=${this.#handleCheckboxToggle}
                                    >
                                        ${this.#resolveTagTitle(path)}
                                    </sp-checkbox>
                                `;
                            })}
                        </div>
                        <div id="footer">
                            <span> ${this.tempValue.length} Selected </span>
                            <sp-button
                                size="s"
                                @click=${this.resetSelection}
                                variant="secondary"
                                treatment="outline"
                            >
                                Reset
                            </sp-button>
                            <sp-button size="s" @click=${this.applySelection}>
                                Apply
                            </sp-button>
                        </div>
                    </div>
                </sp-popover>
            </overlay-trigger>
        `;
        return html`
            <overlay-trigger placement="bottom" .open=${this.open}>
                <sp-action-button
                    slot="trigger"
                    @click=${() => (this.open = !this.open)}
                >
                    ${this.triggerLabel}
                </sp-action-button>

                <sp-popover
                    slot="click-content"
                    direction="bottom"
                    class="checkbox-popover"
                    @close=${() => (this.open = false)}
                >
                    <div id="content">
                        <div class="checkbox-list">
                            ${this.flatTags.map((path) => {
                                const checked = this.tempValue.includes(path);
                                return html`
                                    <sp-checkbox
                                        value="${path}"
                                        ?checked=${checked}
                                        @change=${this.#handleCheckboxToggle}
                                    >
                                        ${this.#resolveTagTitle(path)}
                                    </sp-checkbox>
                                `;
                            })}
                        </div>
                        <div id="footer">
                            <span> ${this.tempValue.length} Selected </span>
                            <sp-button
                                size="s"
                                @click=${this.resetSelection}
                                variant="secondary"
                                treatment="outline"
                            >
                                Reset
                            </sp-button>
                            <sp-button size="s" @click=${this.applySelection}>
                                Apply
                            </sp-button>
                        </div>
                    </div>
                </sp-popover>
            </overlay-trigger>
        `;
    }

    render() {
        if (!this.ready) return nothing;
        if (this.selection === 'checkbox') {
            return this.renderCheckboxMode();
        }

        return html`
            <sp-tags>
                <overlay-trigger placement="bottom">
                    <sp-action-button slot="trigger">
                        ${this.triggerLabel}
                        <sp-icon-labels slot="icon"></sp-icon-labels>
                    </sp-action-button>
                    <sp-popover slot="click-content">
                        <sp-dialog size="s" no-divider>
                            <sp-sidenav @change=${this.#handleChange}>
                                ${this.renderSidenavItems(
                                    this.hierarchicalTags,
                                )}
                            </sp-sidenav>
                        </sp-dialog>
                    </sp-popover>
                </overlay-trigger>
                ${this.tags}
            </sp-tags>
        `;
    }
}

customElements.define('aem-tag-picker-field', AemTagPickerField);
