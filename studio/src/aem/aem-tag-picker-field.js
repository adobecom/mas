import { LitElement, html, css, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { AEM } from './aem.js';

const AEM_TAG_PATTERN = /^[a-zA-Z][a-zA-Z0-9]*:/;
const namespaces = {};

/**
 * Converts from attribute (tag format) to property (path format)
 * @param {string} value Tag format string (e.g., "mas:product/photoshop")
 * @returns {string[]} Path format string (e.g., "/content/cq:tags/mas/product/photoshop")
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
 * Converts from property (path format) to attribute (tag format)
 * @param {string[]} value Path format string (e.g., "/content/cq:tags/mas/product/photoshop")
 * @returns {string} Tag format string (e.g., "mas:product/photoshop")
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
        open: { type: Boolean },
        value: {
            type: Array,
            converter: {
                fromAttribute,
                toAttribute,
            },
            reflect: true,
        },
        namespace: { type: String },
        top: { type: String },
        multiple: { type: Boolean },
        hierarchicalTags: { type: Object, state: true },
        selected: { type: String },
        ready: { type: Boolean, state: true },
        selection: { type: String },
        flatTags: { type: Array, state: true },
    };

    static styles = css`
        :host {
            display: flex;
            align-items: center;
            flex-direction: column;
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

        sp-picker {
            width: 100%;
            margin-top: 16px;
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
        this.#aem = null;
        this.ready = false;
        this.selection = '';
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

    get #data() {
        return namespaces[this.namespace];
    }

    async loadTags() {
        if (!this.#data) {
            let resolveNamespace;
            namespaces[this.namespace] = new Promise((resolve) => {
                resolveNamespace = resolve;
            });
            const rawTags = await this.#aem.tags.list(this.namespace);
            if (!rawTags) return;
            namespaces[this.namespace] = new Map(
                rawTags.hits.map((tag) => [tag.path, tag]),
            );
            resolveNamespace();
        } else if (this.#data instanceof Promise) {
            await this.#data;
        }

        const allTags = [...this.#data.values()].filter((tag) =>
            tag.path.startsWith(this.#tagsRoot),
        );

        if (this.selection === 'picker') {
            this.flatTags = allTags
                .filter((tag) => tag.title) // Ensure title exists
                .sort((a, b) =>
                    a.title.localeCompare(b.title, undefined, {
                        sensitivity: 'base',
                    }),
                )
                .map((tag) => tag.path);
        } else {
            this.hierarchicalTags = this.buildHierarchy(allTags);
        }
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

    async toggleTag(path) {
        await this.#data;
        const index = this.value.indexOf(path);

        if (!this.multiple) {
            this.value = [path];
            return;
        }

        const currentValue = [...(this.value || [])];

        if (index === -1) {
            currentValue.push(path);
        } else {
            currentValue.splice(index, 1);
        }

        this.value = currentValue;
    }

    async #handleChange(event) {
        const path = event.target.value;
        event.target.value = '';
        this.selected = path;
        this.toggleTag(path);
    }

    #deleteTag(event) {
        const pathToDelete = event.target.dataset.path;
        this.toggleTag(pathToDelete);
    }

    #resolveTagTitle(path) {
        const tag = this.#data.get(path);
        return tag ? tag.title : '';
    }

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

    get tagsInHierarchy() {
        return this.value.filter((path) => path.startsWith(this.#tagsRoot));
    }

    get tags() {
        if (this.ready === false) return nothing;
        if (this.selection === 'picker') {
            return html`
                <sp-picker @change=${this.#handleChange} value=${this.value}>
                    ${repeat(
                        this.flatTags,
                        (path) => path,
                        (path) =>
                            html`<sp-menu-item value="${path}">
                                ${this.#resolveTagTitle(path)}
                            </sp-menu-item>`,
                    )}
                </sp-picker>
            `;
        }
        if (this.tagsInHierarchy.length === 0) return nothing;
        return repeat(
            this.tagsInHierarchy,
            (path) => path,
            (path) =>
                html`<sp-tag
                    deletable
                    @delete=${this.#deleteTag}
                    data-path=${path}
                    >${this.#resolveTagTitle(path)}
                    <sp-icon-label slot="icon"></sp-icon-label>
                </sp-tag>`,
        );
    }

    updated(changedProperties) {
        if (changedProperties.has('value')) {
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
        if (this.multiple) return 'Select tags';
        return 'Select a tag';
    }

    render() {
        return html`
            ${this.selection !== 'picker'
                ? html`
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
                  `
                : nothing}
            ${this.selection === 'picker'
                ? html`
                      <sp-picker
                          @change=${this.#handleChange}
                          value=${this.value}
                      >
                          ${repeat(
                              this.flatTags,
                              (path) => path,
                              (path) =>
                                  html`<sp-menu-item value="${path}">
                                      ${this.#resolveTagTitle(path)}
                                  </sp-menu-item>`,
                          )}
                      </sp-picker>
                  `
                : nothing}
        `;
    }
}

customElements.define('aem-tag-picker-field', AemTagPickerField);
