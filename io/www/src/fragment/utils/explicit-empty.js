/**
 * Persisted sentinel for variation fields intentionally cleared to empty.
 * Stored in AEM as the field value; normalized to empty string(s) at publish time.
 */
export const EXPLICIT_EMPTY_SENTINEL = '<explicit_empty/>';

/** Fields that may store the explicit_empty sentinel as a persisted override. */
const EXPLICIT_EMPTY_ALLOWED_FIELDS = ['badge'];

/** Whether a field is allowed to store the explicit_empty sentinel. */
export function isExplicitEmptyField(fieldName) {
    return EXPLICIT_EMPTY_ALLOWED_FIELDS.includes(fieldName);
}

/**
 * @param {*} value
 * @returns {boolean}
 */
export function isExplicitEmptySentinel(value) {
    return value === EXPLICIT_EMPTY_SENTINEL;
}

/**
 * @param {Array|undefined} values
 * @returns {boolean}
 */
export function fieldValuesArePersistedExplicitEmpty(values) {
    return Array.isArray(values) && values.length === 1 && isExplicitEmptySentinel(values[0]);
}

/**
 * @returns {string[]}
 */
export function toPersistedExplicitEmptyValues() {
    return [EXPLICIT_EMPTY_SENTINEL];
}

/**
 * Whether an array of field values contains at least one non-empty entry.
 * Used to determine if a parent field has content worth clearing via the explicit-empty sentinel.
 * @param {Array|undefined} parentValues
 * @returns {boolean}
 */
export function parentValuesHaveContent(parentValues) {
    return (parentValues || []).some((value) => value !== null && value !== undefined && String(value).trim() !== '');
}

/**
 * Normalizes explicit_empty sentinels to empty values at publish/preview time.
 *
 * Accepts two shapes:
 *  - AEM author format: Array<{name: string, values?: Array, multiple?: boolean}>
 *    Respects the `multiple` flag: single-value fields get `['']`, multi-value get `[]`.
 *  - Flat publish format: Record<string, *>
 *    No `multiple` context; persisted sentinel arrays always become `[]`.
 *
 * @param {Array<{name: string, values?: Array, multiple?: boolean}>|Record<string, *>|undefined} fields
 * @returns {Array|Record<string, *>|undefined}
 */
export function normalizeExplicitEmptyInFields(fields) {
    if (Array.isArray(fields)) {
        return fields.map((field) => {
            const values = field.values ?? [];
            const multiple = field.multiple === true;

            if (fieldValuesArePersistedExplicitEmpty(values)) {
                return { ...field, values: multiple ? [] : [''] };
            }

            if (values.some(isExplicitEmptySentinel)) {
                return {
                    ...field,
                    values: values.map((v) => (isExplicitEmptySentinel(v) ? '' : v)),
                };
            }

            return field;
        });
    }

    if (!fields || typeof fields !== 'object') return fields;

    const result = {};
    for (const [fieldName, fieldValue] of Object.entries(fields)) {
        if (Array.isArray(fieldValue)) {
            result[fieldName] = fieldValuesArePersistedExplicitEmpty(fieldValue)
                ? []
                : fieldValue.map((v) => (isExplicitEmptySentinel(v) ? '' : v));
        } else if (isExplicitEmptySentinel(fieldValue)) {
            result[fieldName] = '';
        } else if (fieldValue && typeof fieldValue === 'object' && isExplicitEmptySentinel(fieldValue.value)) {
            result[fieldName] = { ...fieldValue, value: '' };
        } else {
            result[fieldName] = fieldValue;
        }
    }
    return result;
}
