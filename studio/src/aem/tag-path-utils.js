export const AEM_TAG_PATTERN = /^[a-zA-Z][a-zA-Z0-9]*:/;

/**
 * Converts from attribute (tag format) to path (path format)
 * @param {string} value
 * @returns {string[]}
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
 * Converts from path (path format) to attribute (tag format)
 * @param {string[]|string} value
 * @returns {string}
 */
export function toAttribute(value) {
    const tags = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
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
