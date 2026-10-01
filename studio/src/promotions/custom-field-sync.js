/**
 * Normalizes a list of custom-field entries, dropping blank names but keeping each
 * entry's original position so position-paired rename detection stays stable.
 * @param {Array<{ name?: string }>} [entries]
 * @returns {Array<{ name: string, index: number }>}
 */
export function normalizeCustomFieldEntries(entries = []) {
    return entries.map((entry, index) => ({ name: entry?.name?.trim() ?? '', index })).filter((entry) => entry.name);
}

/**
 * Diffs a default fragment's custom fields against a promo variation's, so a missing
 * field can be added and a renamed field can be corrected back to the default's naming.
 * A rename is only inferred when the default and promo entries share a position and
 * neither name exists on the other side; every other default-only name is reported as
 * missing rather than guessed to be a rename.
 * @param {{ defaultEntries?: Array<{ name?: string }>, promoEntries?: Array<{ name?: string }> }} params
 * @returns {{ missing: string[], renames: Array<{ from: string, to: string, index: number }>, extra: string[] }}
 */
export function diffCustomFields({ defaultEntries = [], promoEntries = [] } = {}) {
    const defaultList = normalizeCustomFieldEntries(defaultEntries);
    const promoList = normalizeCustomFieldEntries(promoEntries);
    const defaultNames = new Set(defaultList.map((entry) => entry.name));
    const promoNames = new Set(promoList.map((entry) => entry.name));
    const promoNameByIndex = new Map(promoList.map((entry) => [entry.index, entry.name]));

    const renames = [];
    const renamedDefaultNames = new Set();
    const renamedPromoNames = new Set();
    for (const { name: defaultName, index } of defaultList) {
        if (promoNames.has(defaultName)) continue;
        const promoName = promoNameByIndex.get(index);
        if (!promoName || promoName === defaultName || defaultNames.has(promoName)) continue;
        renames.push({ from: promoName, to: defaultName, index });
        renamedDefaultNames.add(defaultName);
        renamedPromoNames.add(promoName);
    }

    const missing = defaultList
        .map((entry) => entry.name)
        .filter((name) => !promoNames.has(name) && !renamedDefaultNames.has(name));
    const extra = promoList
        .map((entry) => entry.name)
        .filter((name) => !defaultNames.has(name) && !renamedPromoNames.has(name));

    return { missing, renames, extra };
}

/**
 * Custom-field renaming is only allowed on the default fragment; a promo variation's
 * custom-field names must stay in sync with it.
 * @param {{ isPromoVariation?: boolean }} params
 * @returns {boolean}
 */
export function isCustomFieldRenameAllowed({ isPromoVariation } = {}) {
    return !isPromoVariation;
}
