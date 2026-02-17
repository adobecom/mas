import { LitElement, html, css, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { AEM } from './aem.js';
import { EVENT_OST_OFFER_SELECT } from '../constants.js';
import { VARIANTS } from '../editors/variant-picker.js';
import { getItemFieldState } from '../utils/field-state.js';

const AEM_TAG_PATTERN = /^[a-zA-Z][a-zA-Z0-9]*:/;
const namespaces = {};
const SELECTION_CHECKBOX = 'checkbox';
const SELECTION_CHECKBOX_TAGS = 'checkbox-tags';

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
            if (tag.startsWith('/content/cq:tags/')) return tag;
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
    const tags = Array.isArray(value)
        ? value
        : typeof value === 'string'
          ? value.split(',')
          : [];
    if (tags.length === 0) return '';
    return tags
        .map((path) => {
            if (AEM_TAG_PATTERN.test(path)) return path;
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
        // Controls whether popover is open in checkbox-like modes
        open: { type: Boolean, state: true },
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
        selection: { type: String }, // 'checkbox' | 'checkbox-tags' | default-hierarchy
        flatTags: { type: Array, state: true },
        // When true, display tag value/name instead of tag label/title
        displayValue: { type: Boolean, attribute: 'display-value' },

        // Temporary selections in 'checkbox' mode (before Apply)
        tempValue: { type: Array, state: true },

        searchQuery: { type: String, state: true },
        parentTags: { type: Array, attribute: false },
        /**
         * Optional function to provide custom icons for tags.
         * Receives the tag path and should return an icon (e.g., country flag emoji) or nothing.
         * @type {(path: string) => string | typeof nothing}
         */
        iconProvider: { type: Function, attribute: false },
        /** When true, renders tags in readonly mode without picker controls */
        readonly: { type: Boolean },
    };

    static styles = css`
        :host {
            display: flex;
            align-items: center;
            flex-direction: column;
        }

        :host([selection='checkbox']) {
            max-width: 248px;
            max-height: 326px;
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

        sp-checkbox {
            align-items: center;
        }

        #content {
            padding: 8px;
        }

        #footer {
            padding: 8px;
            height: 40px;
            align-items: center;
            display: flex;
            gap: 8px;
            justify-content: end;
        }

        #footer span {
            flex: 1;
        }

        sp-action-button {
            display: flex;
            flex-direction: row-reverse;
        }

        sp-action-button[slot='trigger'] {
            --mod-actionbutton-border-radius: 16px;
        }

        sp-popover.checkbox-popover {
            min-width: 248px;
            border-radius: 10px;
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

        sp-tag:not([data-field-state='overridden']) {
            --mod-tag-border-color: transparent;
            --mod-tag-background-color: var(--spectrum-gray-100);
        }

        sp-tag[data-field-state='overridden'] {
            --mod-tag-border-color: var(--spectrum-blue-400);
            --mod-tag-background-color: var(--spectrum-blue-100);
            border-width: 2px;
        }

        .no-tags {
            color: var(--spectrum-gray-600);
            font-style: italic;
        }
    `;

    #aem;

    constructor() {
        super();
        this.baseUrl = document.querySelector('meta[name="aem-base-url"]')?.content;
        this.bucket = null;
        this.top = null;
        this.multiple = false;
        this.hierarchicalTags = new Map();
        this.flatTags = [];
        this.value = [];
        this.tempValue = [];
        this.#aem = null;
        this.ready = false;
        this.selection = ''; // e.g., 'checkbox' | 'checkbox-tags' | ''
        this.searchQuery = '';
        this.parentTags = [];
        this.iconProvider = null;
        this.readonly = false;
        this.displayValue = false;
    }

    #onOstSelect = ({ detail: { offer } }) => {
        if (!offer) return;
        const extractedOffer = {
            offer_type: offer.offer_type,
            planType: offer.planType,
            customer_segment: offer.customer_segment,
            product_code: offer.product_code,
            market_segments:
                Array.isArray(offer.market_segments) && offer.market_segments.length > 0
                    ? offer.market_segments[0]
                    : offer.market_segments,
        };

        const convertCamelToSnake = (str) => {
            if (typeof str !== 'string') return '';
            return str.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
        };

        const categoriesToUpdate = new Set(['offer_type', 'plan_type', 'customer_segment', 'market_segments', 'product_code']);

        const existingTags = this.#asValueArray().filter((tagPath) => {
            for (const category of categoriesToUpdate) {
                if (tagPath.includes(`/content/cq:tags/mas/${category}/`)) {
                    return false; // Exclude this tagPath if it contains any of the categories
                }
            }
            return true;
        });

        const newTagPaths = Object.entries(extractedOffer)
            .filter(([_, value]) => value != null) // Filter out null/undefined values
            .map(([key, value]) => {
                const formattedKey = convertCamelToSnake(key);
                const formattedValue = String(value).toLowerCase();
                return `/content/cq:tags/mas/${formattedKey}/${formattedValue}`;
            });

        this.value = [...existingTags, ...newTagPaths].filter(Boolean);
        this.#notifyChange();
    };

    connectedCallback() {
        super.connectedCallback();
        this.multiple = this.multiple || [SELECTION_CHECKBOX, SELECTION_CHECKBOX_TAGS].includes(this.selection);
        this.#aem = new AEM(this.bucket, this.baseUrl);
        this.loadTags();
        if (!this.top) {
            document.addEventListener(EVENT_OST_OFFER_SELECT, this.#onOstSelect);
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener(EVENT_OST_OFFER_SELECT, this.#onOstSelect);
    }

    get #tagsRoot() {
        if (this.top) return `${this.namespace}/${this.top}/`;
        return `${this.namespace}/`;
    }

    // Returns the cached data for this namespace (if loaded)
    get #data() {
        return namespaces[this.namespace];
    }

    get allTags() {
        return namespaces[this.namespace];
    }

    get selectedTags() {
        return this.#asValueArray().map((path) => this.#data.get(path));
    }

    clear() {
        this.value = [];
        this.tempValue = [];
    }

    addVariantTags() {
        if (this.top !== 'variant' || this.flatTags.length) return;
        VARIANTS.forEach((variant) => {
            if (variant.value === 'all') return;
            const tagPath = `/content/cq:tags/mas/variant/${variant.value}`;
            this.flatTags.push(tagPath);
            this.#data.set(tagPath, {
                name: variant.value,
                title: variant.label,
                path: tagPath,
            });
        });
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
            namespaces[this.namespace] = new Map(rawTags.hits.map((tag) => [tag.path, tag]));
            resolveNamespace();
        } else if (this.#data instanceof Promise) {
            // If still loading, wait
            await this.#data;
        }

        const allTags = [...this.#data.values()].filter((tag) => tag.path.startsWith(this.#tagsRoot));

        if ([SELECTION_CHECKBOX, SELECTION_CHECKBOX_TAGS].includes(this.selection)) {
            let tagsForCheckboxList = allTags.filter((tag) => this.#getTagTextByMode(tag));

            if (this.isCheckboxTagsMode) {
                tagsForCheckboxList = this.#filterOutParentsWithChildren(tagsForCheckboxList);
            }

            this.flatTags = tagsForCheckboxList
                .sort((a, b) =>
                    this.#getTagTextByMode(a).localeCompare(this.#getTagTextByMode(b), undefined, {
                        sensitivity: 'base',
                    }),
                )
                .map((tag) => tag.path);
            this.addVariantTags();
        } else {
            // Otherwise build a hierarchical structure
            this.hierarchicalTags = this.buildHierarchy(allTags);
        }

        this.ready = true;
    }

    #filterOutParentsWithChildren(tags) {
        const paths = new Set(tags.map((tag) => tag.path));
        const parentPaths = new Set();

        for (const path of paths) {
            let slashIndex = path.lastIndexOf('/');
            while (slashIndex > 0) {
                const parentPath = path.slice(0, slashIndex);
                if (!parentPath.startsWith(this.#tagsRoot)) break;
                if (paths.has(parentPath)) parentPaths.add(parentPath);
                slashIndex = parentPath.lastIndexOf('/');
            }
        }

        return tags.filter((tag) => !parentPaths.has(tag.path));
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
        let currentValue = [...this.#asValueArray()];
        const storedPath = this.#toStoredValue(path);
        const equivalentPath = this.#toPath(path);
        const equivalentValues = new Set([storedPath, equivalentPath].filter(Boolean));
        const isMultiSelection = this.multiple || this.isCheckboxTagsMode;

        if (!isMultiSelection) {
            // single select
            this.value = [storedPath];
            await this.#notifyChange();
            return;
        }
        // multi select
        const hasEquivalent = currentValue.some((value) => equivalentValues.has(value));
        if (!hasEquivalent) {
            currentValue.push(storedPath);
        } else {
            currentValue = currentValue.filter((value) => !equivalentValues.has(value));
        }
        this.value = currentValue;
        await this.#notifyChange();
    }

    // sp-sidenav "change" event handler
    async #handleChange(event) {
        const path = event.target.value;
        this.selected = path;
        this.toggleTag(path);
    }

    // sp-tag "delete" event
    #deleteTag(event) {
        const pathToDelete = event.target.dataset.path;
        this.toggleTag(pathToDelete);
    }

    #toPath(tagOrPath) {
        if (!tagOrPath) return '';
        if (tagOrPath.startsWith('/content/cq:tags/')) return tagOrPath;
        return fromAttribute(tagOrPath)?.[0] || '';
    }

    #toTagId(pathOrTag) {
        if (!pathOrTag) return '';
        if (AEM_TAG_PATTERN.test(pathOrTag)) return pathOrTag;
        return toAttribute([pathOrTag]);
    }

    #toStoredValue(path) {
        return this.isCheckboxTagsMode ? this.#toTagId(path) : path;
    }

    #asValueArray(values = this.value) {
        if (Array.isArray(values)) return values;
        if (typeof values === 'string') {
            return values
                .split(',')
                .map((entry) => entry.trim())
                .filter(Boolean);
        }
        return [];
    }

    #selectedPaths(values = this.value) {
        return this.#asValueArray(values)
            .map((entry) => this.#toPath(entry))
            .filter(Boolean);
    }

    #getTagTextByMode(tag) {
        if (!tag) return '';
        if (this.displayValue) return tag.name || tag.title || '';
        return tag.title || tag.name || '';
    }

    // Convert a path to a tag's display text based on mode
    #resolveTagText(path, fallback = '') {
        const tag = this.#data.get(path);
        if (tag) return this.#getTagTextByMode(tag);
        if (fallback) return fallback;
        return path?.split('/').pop() || '';
    }

    /**
     * Returns the icon for a sidenav item.
     * Uses iconProvider if available for leaf nodes, otherwise returns default icons.
     * @param {string} path - The tag path
     * @param {boolean} hasChildren - Whether the item has children
     * @returns {TemplateResult}
     */
    #getSidenavIcon(path, hasChildren) {
        if (hasChildren) {
            return html`<sp-icon-add slot="icon"></sp-icon-add>`;
        }
        if (this.iconProvider) {
            const icon = this.iconProvider(path);
            if (icon) {
                return html`<span slot="icon">${icon}</span>`;
            }
        }
        return html`<sp-icon-label slot="icon"></sp-icon-label>`;
    }

    // Recursively render <sp-sidenav-item> for hierarchical tags
    renderSidenavItems(node, parentPath = '') {
        return [...node.entries()].map(([key, item]) => {
            const hasChildren = item.__children__.size > 0;
            const info = item.__info__;
            const label = info ? this.#resolveTagText(info.path, key) : key;
            const value = info ? info.path : `${parentPath}/${key}`;
            return html`
                <sp-sidenav-item label="${label}" value="${value}">
                    ${hasChildren ? this.renderSidenavItems(item.__children__, value) : nothing}
                    ${this.#getSidenavIcon(value, hasChildren)}
                </sp-sidenav-item>
            `;
        });
    }

    // In hierarchical mode, only keep tags that start under #tagsRoot
    get tagsInHierarchy() {
        return this.#selectedPaths().filter((path) => path.startsWith(this.#tagsRoot));
    }

    /**
     * Returns the icon for a tag path.
     * Uses iconProvider if available, otherwise returns the default icon.
     * @param {string} path - The tag path
     * @returns {TemplateResult}
     */
    #getTagIcon(path) {
        if (this.iconProvider) {
            const icon = this.iconProvider(path);
            if (icon) {
                return html`<span slot="icon">${icon}</span>`;
            }
        }
        return html`<sp-icon-label slot="icon"></sp-icon-label>`;
    }

    // Renders the chosen tags for hierarchical or checkbox mode
    get tags() {
        if (!this.ready) return nothing;

        // hierarchical: display sp-tags with sp-tag for each selection
        if (this.tagsInHierarchy.length === 0) return nothing;

        // Convert parentTags from attribute format to path format for comparison
        const parentTagPaths = fromAttribute(this.parentTags?.join(',') || '');

        return repeat(
            this.tagsInHierarchy,
            (path) => path,
            (path) => {
                const fieldState = getItemFieldState(path, parentTagPaths);
                const title = this.#resolveTagText(path);
                return html`
                    <sp-tag deletable @delete=${this.#deleteTag} data-path=${path} data-field-state="${fieldState}">
                        ${title} ${this.#getTagIcon(path)}
                    </sp-tag>
                `;
            },
        );
    }

    // Keep the internal state & notify on changes
    updated(changedProperties) {
        if (changedProperties.has('value')) {
            const currentValue = this.#asValueArray();
            this.tempValue = this.isCheckboxTagsMode ? this.#selectedPaths(currentValue) : [...currentValue];
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

    get overlayTrigger() {
        return this.shadowRoot.querySelector('overlay-trigger');
    }

    get popoverElement() {
        return this.shadowRoot.querySelector('sp-popover');
    }

    get selectedText() {
        const count = this.tempValue.length;
        if (count < 2) return `${count} tag selected`;
        return `${count} tags selected`;
    }

    async #updateMargin() {
        await this.updateComplete;
        if (!this.popoverElement || !/bottom/.test(this.popoverElement.placement)) return;
        const margin = this.shadowRoot.querySelector('sp-tag:last-child')?.offsetTop ?? 0;
        this.style.setProperty('--margin-picker-top', `${margin}px`);
    }

    get triggerLabel() {
        if (this.label) return this.label;
        return this.multiple ? 'Select tags' : 'Select a tag';
    }

    get isCheckboxTagsMode() {
        return this.selection === SELECTION_CHECKBOX_TAGS;
    }

    async #handleCheckboxToggle(event) {
        event.stopPropagation();
        const checkbox = event.composedPath?.()[0] || event.target;
        const path = checkbox?.value || checkbox?.getAttribute?.('value');
        if (!path) return;

        const currentValue = [...(this.tempValue || [])];
        const index = currentValue.indexOf(path);
        if (checkbox.checked && index === -1) {
            currentValue.push(path);
        } else if (!checkbox.checked && index !== -1) {
            currentValue.splice(index, 1);
        }
        this.tempValue = currentValue;
    }

    resetSelection() {
        this.tempValue = [];
        this.shadowRoot.querySelectorAll('sp-checkbox').forEach((checkbox) => {
            checkbox.checked = this.tempValue.includes(checkbox.value);
        });
    }

    async applySelection() {
        this.value = [...this.tempValue];
        this.tempValue = [];
        this.overlayTrigger.open = false;
        this.#notifyChange();
    }

    #hasSameSelections(a, b) {
        if (a.length !== b.length) return false;
        const bSet = new Set(b);
        return a.every((value) => bSet.has(value));
    }

    #handleCheckoxMenuClose() {
        if (this.isCheckboxTagsMode) {
            const nextValue = this.tempValue.map((path) => this.#toStoredValue(path)).filter(Boolean);
            const currentValue = [...this.#asValueArray()];
            const changed = !this.#hasSameSelections(nextValue, currentValue);
            this.value = nextValue;
            if (changed) this.#notifyChange();
            return;
        }
        this.tempValue = [...this.#asValueArray()];
    }

    #handleSearchInput(event) {
        const eventTarget = event.composedPath?.()[0] || event.target;
        this.searchQuery = eventTarget?.value || '';
    }

    get checkboxMenu() {
        if (!this.ready) return nothing;

        let filteredTags = this.flatTags;
        if (this.flatTags.length > 7) {
            filteredTags = this.flatTags.filter((path) =>
                this.#resolveTagText(path).toLowerCase().includes(this.searchQuery.toLowerCase()),
            );
        }

        return html`
            <div id="content">
                ${this.flatTags.length > 7
                    ? html` <sp-search @input=${this.#handleSearchInput} placeholder="Search"></sp-search> `
                    : nothing}
                <div class="checkbox-list">
                    ${repeat(
                        filteredTags,
                        (path) => path, // Unique key for each item
                        (path) => {
                            const checked = this.tempValue.includes(path);
                            const icon = this.iconProvider ? this.iconProvider(path) : null;
                            return html`
                                <sp-checkbox value="${path}" ?checked=${checked} @change=${this.#handleCheckboxToggle}>
                                    ${icon ? html`${icon} ` : nothing}${this.#resolveTagText(path)}
                                </sp-checkbox>
                            `;
                        },
                    )}
                </div>
                ${this.isCheckboxTagsMode
                    ? nothing
                    : html`<div id="footer">
                          <span> ${this.selectedText} </span>
                          <sp-button size="s" @click=${this.resetSelection} variant="secondary" treatment="outline">
                              Reset
                          </sp-button>
                          <sp-button size="s" @click=${this.applySelection}> Apply </sp-button>
                      </div>`}
            </div>
        `;
    }

    /**
     * - Clicking the action button toggles the popover.
     * - The list of sp-checkbox is scrollable if too large.
     * - In 'checkbox' mode, the footer shows # selected, plus Reset/Apply.
     * - In 'checkbox-tags' mode, selections apply when the popover closes and footer is hidden.
     */
    get checkboxMode() {
        const currentValues = this.#asValueArray();
        const selectCount = !this.isCheckboxTagsMode && currentValues.length > 0 ? html`(${currentValues.length})` : '';
        const trigger = html`
            <overlay-trigger placement="bottom" @sp-closed=${this.#handleCheckoxMenuClose}>
                <sp-action-button slot="trigger" ?quiet=${!this.isCheckboxTagsMode} aria-label=${this.triggerLabel}>
                    ${this.isCheckboxTagsMode ? nothing : html`${this.triggerLabel} ${selectCount}`}
                    ${this.isCheckboxTagsMode
                        ? html`<sp-icon-add size="m" slot="icon"></sp-icon-add>`
                        : html`<sp-icon-chevron-down size="m" slot="icon"></sp-icon-chevron-down>`}
                </sp-action-button>

                <sp-popover slot="click-content" class="checkbox-popover"> ${this.checkboxMenu} </sp-popover>
            </overlay-trigger>
        `;

        if (this.isCheckboxTagsMode) {
            return html` <sp-tags> ${this.tags} ${trigger} </sp-tags> `;
        }

        return html` ${trigger} `;
    }

    get readonlyTags() {
        if (!this.ready) return nothing;
        if (this.tagsInHierarchy.length === 0) {
            return html`<span class="no-tags">No tags</span>`;
        }
        return html`
            <sp-tags>
                ${repeat(
                    this.tagsInHierarchy,
                    (path) => path,
                    (path) => {
                        const icon = this.iconProvider ? this.iconProvider(path) : nothing;
                        const title = this.#resolveTagText(path);
                        return html`<sp-tag readonly>${icon} ${title}</sp-tag>`;
                    },
                )}
            </sp-tags>
        `;
    }

    render() {
        if (this.readonly) {
            return this.readonlyTags;
        }
        if ([SELECTION_CHECKBOX, SELECTION_CHECKBOX_TAGS].includes(this.selection)) {
            return this.checkboxMode;
        }
        if (!this.ready) return nothing;
        return html`
            <sp-tags>
                ${this.tags}
                <overlay-trigger placement="bottom">
                    <sp-action-button slot="trigger" aria-label=${this.triggerLabel}>
                        <sp-icon-add size="m" slot="icon"></sp-icon-add>
                    </sp-action-button>
                    <sp-popover slot="click-content">
                        <sp-dialog size="s" no-divider>
                            <sp-sidenav @change=${this.#handleChange}>
                                ${this.renderSidenavItems(this.hierarchicalTags)}
                            </sp-sidenav>
                        </sp-dialog>
                    </sp-popover>
                </overlay-trigger>
            </sp-tags>
        `;
    }
}

customElements.define('aem-tag-picker-field', AemTagPickerField);
