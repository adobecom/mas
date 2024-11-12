/**
 * Converts from attribute (tag format) to property (path format)
 * @param {string} value Tag format string (e.g., "mas:product/photoshop")
 * @returns {string} Path format string (e.g., "/content/cq:tags/mas/product/photoshop")
 */
function fromAttribute(value) {
    if (!value) return '';
    const tags = value.split(',');
    return tags
            .map(tag => tag.trim())
            .filter(Boolean)
        .map(tag => {
            const [namespace, path] = tag.split(':');
            return path ? `/content/cq:tags/${namespace}/${path}` : '';
        })
        .filter(Boolean)
        .join(',');
    }

/**
 * Converts from property (path format) to attribute (tag format)
 * @param {string} value Path format string (e.g., "/content/cq:tags/mas/product/photoshop")
 * @returns {string} Tag format string (e.g., "mas:product/photoshop")
 */
function toAttribute(value) {
    if (!value) return '';
    const paths = value.split(',');
    return paths
        .map(path => {
            const match = path.match(/\/content\/cq:tags\/([^/]+)\/(.+)$/);
            return match ? `${match[1]}:${match[2]}` : '';
        })
        .filter(Boolean)
        .join(',');
}

class AemTagPicker extends LitElement {
    static styles = css`
        :host {
            display: flex;
        }

        sp-tags {
            align-self: baseline;
        }
    `;

    static properties = {
        baseUrl: { type: String, attribute: 'base-url' },
        bucket: { type: String },
        open: { type: Boolean },
        value: { 
            type: String,
            converter: {
                fromAttribute,
                toAttribute
            }
        },
        namespace: { type: String },
        top: { type: String },
        multiple: { type: Boolean },
        hierarchicalTags: { type: Object, state: true },
    };

    /**
     * @type {AEM}
     */
    #aem;

    constructor() { ... }

    connectedCallback() { ... }

    async loadTags() { ... }

    get #tagsRoot() { ... }

    get #data() { ... }

    buildHierarchy(tags) { ... }

    handleClick(event) {
        const path = event.detail.path;
    // ... rest of existing code ...
}