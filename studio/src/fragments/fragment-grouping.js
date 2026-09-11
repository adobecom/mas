import { MAS_PRODUCT_CODE_PREFIX } from '../constants.js';

export const GROUP_BY_NONE = 'none';
export const GROUP_BY_TEMPLATE = 'template';
export const GROUP_BY_OFFER = 'offer';

export const GROUP_BY_OPTIONS = [
    { value: GROUP_BY_TEMPLATE, label: 'Template' },
    { value: GROUP_BY_OFFER, label: 'Offer' },
    { value: GROUP_BY_NONE, label: 'None' },
];

export const UNCATEGORIZED_GROUP = 'Uncategorized';

/**
 * Template groups use the fragment's content model title (studio/src/version-page.js
 * shows this same value as the fragment "Type"); offer groups use the mas:product_code
 * tag title (the same tag used to derive offer names elsewhere in Studio, e.g.
 * studio/src/translation/mas-collapsible-table-row.js). Both are already present on the
 * fragment data with no extra fetch. Missing/blank values fall into UNCATEGORIZED_GROUP.
 * @param {import('../reactivity/fragment-store.js').FragmentStore['value']} fragment
 * @param {string} groupBy - GROUP_BY_TEMPLATE or GROUP_BY_OFFER
 * @returns {string}
 */
export function getGroupName(fragment, groupBy) {
    let name;
    if (groupBy === GROUP_BY_TEMPLATE) {
        name = fragment?.model?.title;
    } else if (groupBy === GROUP_BY_OFFER) {
        name = fragment?.tags?.find((tag) => tag?.id?.startsWith(MAS_PRODUCT_CODE_PREFIX))?.title;
    }
    name = typeof name === 'string' ? name.trim() : '';
    return name || UNCATEGORIZED_GROUP;
}

/**
 * Partitions fragmentStores into groups by template or offer, sorted case-insensitively by name.
 * Returns null when groupBy is GROUP_BY_NONE so callers keep the current flat rendering path.
 * @param {import('../reactivity/fragment-store.js').FragmentStore[]} fragmentStores
 * @param {string} groupBy
 * @returns {{ name: string, stores: import('../reactivity/fragment-store.js').FragmentStore[] }[] | null}
 */
export function groupFragmentStores(fragmentStores, groupBy) {
    if (groupBy === GROUP_BY_NONE) return null;

    const groupsByName = new Map();
    for (const fs of fragmentStores) {
        const fragment = fs.get?.() ?? fs.value;
        const name = getGroupName(fragment, groupBy);
        if (!groupsByName.has(name)) groupsByName.set(name, []);
        groupsByName.get(name).push(fs);
    }

    return [...groupsByName.entries()]
        .map(([name, stores]) => ({ name, stores }))
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
}
