import { fromAttribute } from './tag-path-utils.js';

/** @type {Map<string, Map<string, object>>} */
const data = new Map();

/** @type {Map<string, Promise<Map<string, object>>>} */
const inflight = new Map();

/**
 * @param {object|undefined|null} rawTags
 * @returns {Map<string, object>}
 */
const tagsToMap = (rawTags) => (rawTags?.hits ? new Map(rawTags.hits.map((tag) => [tag.path, tag])) : new Map());

/**
 * @param {string} namespace
 * @returns {Map<string, object>|undefined}
 */
export function getNamespaceCache(namespace) {
    return data.get(namespace);
}

/**
 * @param {string} namespace
 * @returns {Promise<Map<string, object>>|undefined}
 */
export function getNamespaceInflight(namespace) {
    return inflight.get(namespace);
}

/**
 * Loads AEM tags for a namespace once, deduplicating concurrent requests.
 * @param {string} namespace
 * @param {(namespace: string) => Promise<object|undefined|null>} loader
 * @returns {Promise<Map<string, object>>}
 */
export async function ensureNamespaceTags(namespace, loader) {
    const cached = data.get(namespace);
    if (cached) return cached;

    const pending = inflight.get(namespace);
    if (pending) return pending;

    const promise = Promise.resolve(loader(namespace))
        .then(tagsToMap)
        .catch(() => new Map())
        .then((map) => {
            data.set(namespace, map);
            return map;
        })
        .finally(() => {
            inflight.delete(namespace);
        });

    inflight.set(namespace, promise);
    return promise;
}

/**
 * Resolves a display title from the in-memory tag taxonomy cache
 * @param {string} tagOrPath
 * @param {string} [namespace='/content/cq:tags/mas']
 * @returns {string|undefined}
 */
export function getCachedTagTitle(tagOrPath, namespace = '/content/cq:tags/mas') {
    const cached = data.get(namespace);
    if (!cached) return undefined;

    const path = tagOrPath?.startsWith('/content/cq:tags/') ? tagOrPath : fromAttribute(tagOrPath)?.[0];
    if (!path) return undefined;

    return cached.get(path)?.title;
}

/** Test seam: direct access to the cache stores for setup/teardown in tests. */
export const __tagCacheStores = { data, inflight };
