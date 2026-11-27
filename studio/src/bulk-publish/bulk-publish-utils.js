import { BULK_PUBLISH_PROJECT_MODEL_ID, COLLECTION_MODEL_PATH, DICTIONARY_MODEL_PATH } from '../constants.js';
import { normalizeKey } from '../utils.js';

export function buildProjectPayload({ parentPath, title, status, urls, fragments, locales, items }) {
    return {
        title,
        name: normalizeKey(title),
        modelId: BULK_PUBLISH_PROJECT_MODEL_ID,
        parentPath,
        fields: [
            { name: 'title', type: 'text', values: [title] },
            { name: 'status', type: 'text', values: [status] },
            { name: 'urls', type: 'text', values: [urls] },
            { name: 'fragments', type: 'content-fragment', multiple: true, values: fragments },
            { name: 'locales', type: 'text', multiple: true, values: locales },
            { name: 'items', type: 'text', values: [items] },
        ],
    };
}

export function itemTypeFromPath(path) {
    return path?.includes('/dictionary/') ? 'placeholder' : 'fragment';
}

export function itemTypeFromFragment(fragment) {
    if (fragment?.model?.path === COLLECTION_MODEL_PATH) return 'collection';
    if (fragment?.model?.path?.includes(DICTIONARY_MODEL_PATH)) return 'placeholder';
    return itemTypeFromPath(fragment?.path);
}

export function isResolvedItem(item) {
    return item.status === 'resolved' || item.status === 'valid';
}

export function buildItemsMetadata(items) {
    const meta = items
        .filter((item) => isResolvedItem(item) && item.path)
        .map((item) => ({ path: item.path, type: item.type ?? itemTypeFromPath(item.path), status: 'resolved' }));
    return JSON.stringify(meta);
}
