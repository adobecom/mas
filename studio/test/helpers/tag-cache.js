import { __tagCacheStores } from '../../src/aem/tag-cache.js';

const { data, inflight } = __tagCacheStores;

/** Clears cached and in-flight tag loads for a namespace. */
export const resetTagCache = (namespace) => {
    data.delete(namespace);
    inflight.delete(namespace);
};

/** Preloads a namespace with tag data (skips the AEM fetch for that namespace). */
export const seedTagCache = (namespace, tags) => {
    data.set(namespace, tags instanceof Map ? tags : new Map(tags));
    inflight.delete(namespace);
};

/** Simulates a namespace whose tags are still loading from AEM. */
export const blockTagCacheLoading = (namespace) => {
    data.delete(namespace);
    inflight.set(namespace, new Promise(() => {}));
};
