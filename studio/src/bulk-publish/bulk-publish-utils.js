import { COLLECTION_MODEL_PATH, DICTIONARY_MODEL_PATH } from '../constants.js';

export function getProjectField(project, name, fallback) {
    const data = project.value ?? project;
    return data.getFieldValue?.(name) ?? data[name] ?? fallback;
}

export function getProjectFieldList(project, name) {
    const data = project.value ?? project;
    return data.getFieldValues?.(name) ?? data[name] ?? [];
}

export function itemTypeFromPath(path) {
    return path?.includes('/dictionary/') ? 'placeholder' : 'fragment';
}

export function itemTypeFromFragment(fragment) {
    if (fragment?.model?.path === COLLECTION_MODEL_PATH) return 'collection';
    if (fragment?.model?.path?.includes(DICTIONARY_MODEL_PATH)) return 'placeholder';
    return itemTypeFromPath(fragment?.path);
}

export function buildItemsMetadata(items) {
    const meta = items
        .filter((item) => item.status === 'valid' && item.path)
        .map((item) => ({ path: item.path, type: item.type ?? itemTypeFromPath(item.path), status: 'valid' }));
    return JSON.stringify(meta);
}
