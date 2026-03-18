/** Shared field grouping logic for compare-chart editor and preview. */

export const TITLE_FIELDS = new Set(['cardTitle', 'subtitle', 'mnemonicIcon']);
export const PRICE_FIELDS = new Set(['prices']);

export function getFieldGroup(fieldName) {
    if (TITLE_FIELDS.has(fieldName)) return 'title';
    if (PRICE_FIELDS.has(fieldName)) return 'price';
    return 'desc';
}

/** Sort fields into group order: title → price → desc. */
export function sortFieldsByGroup(fields) {
    return [
        ...fields.filter((f) => TITLE_FIELDS.has(f)),
        ...fields.filter((f) => PRICE_FIELDS.has(f)),
        ...fields.filter((f) => !TITLE_FIELDS.has(f) && !PRICE_FIELDS.has(f)),
    ];
}
