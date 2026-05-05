import { fromAttribute } from './tag-path-utils.js';

const namespaces = {};

/**
 * @param {string} namespace
 * @returns {Map<string, object>|Promise<void>|undefined}
 */
export function getNamespaceCache(namespace) {
    return namespaces[namespace];
}

/**
 * @param {string} namespace
 * @param {Map<string, object>|Promise<void>} value
 */
export function setNamespaceCache(namespace, value) {
    namespaces[namespace] = value;
}

/**
 * Resolves a display title from the in-memory tag taxonomy cache
 * @param {string} tagOrPath
 * @param {string} [namespace='/content/cq:tags/mas']
 * @returns {string|undefined}
 */
export function getCachedTagTitle(tagOrPath, namespace = '/content/cq:tags/mas') {
    const data = namespaces[namespace];
    if (!data || data instanceof Promise) return undefined;

    const path = tagOrPath?.startsWith('/content/cq:tags/') ? tagOrPath : fromAttribute(tagOrPath)?.[0];
    if (!path) return undefined;

    return data.get(path)?.title;
}
