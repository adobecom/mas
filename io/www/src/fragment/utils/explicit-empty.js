/**
 * Persisted sentinel for variation fields intentionally cleared to empty.
 * Stored in AEM as the field value; normalized to empty string(s) at publish time.
 */
export const EXPLICIT_EMPTY_SENTINEL = 'explicit_empty';

/**
 * Fragment fields that must never store the explicit_empty sentinel (metadata / structural).
 */
export const FIELDS_DISALLOWING_EXPLICIT_EMPTY = Object.freeze([
    'variations',
    'tags',
    'originalId',
    'locReady',
    'showSecureLabel',
    'showPlanType',
    'compatVersion',
    'variant',
]);

/**
 * @param {string} fieldName
 * @returns {boolean}
 */
export function fieldAllowsExplicitEmpty(fieldName) {
    return !FIELDS_DISALLOWING_EXPLICIT_EMPTY.includes(fieldName);
}

/**
 * Removes explicit_empty from values for fields that cannot persist the sentinel.
 * @param {string} fieldName
 * @param {Array|undefined} values
 * @param {{ multiple?: boolean }} [options]
 * @returns {Array|undefined}
 */
export function coerceValuesWithoutExplicitEmpty(fieldName, values, { multiple = false } = {}) {
    if (!Array.isArray(values) || fieldAllowsExplicitEmpty(fieldName)) {
        return values;
    }
    if (fieldValuesArePersistedExplicitEmpty(values)) {
        return multiple ? [] : [''];
    }
    if (values.some(isExplicitEmptySentinel)) {
        return values.map((value) => (isExplicitEmptySentinel(value) ? '' : value));
    }
    return values;
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
 * Replaces persisted explicit-empty sentinels in flat fragment.fields for publish.
 * @param {Record<string, *>|undefined} fields
 * @returns {Record<string, *>|undefined}
 */
export function normalizeExplicitEmptyInFields(fields) {
    if (!fields || typeof fields !== 'object') {
        return fields;
    }

    for (const [fieldName, fieldValue] of Object.entries(fields)) {
        if (!fieldAllowsExplicitEmpty(fieldName)) {
            if (Array.isArray(fieldValue) && fieldValuesArePersistedExplicitEmpty(fieldValue)) {
                fields[fieldName] = [];
            } else if (isExplicitEmptySentinel(fieldValue)) {
                fields[fieldName] = '';
            } else if (fieldValue && typeof fieldValue === 'object' && isExplicitEmptySentinel(fieldValue.value)) {
                fields[fieldName] = { ...fieldValue, value: '' };
            }
            continue;
        }

        if (Array.isArray(fieldValue)) {
            if (fieldValuesArePersistedExplicitEmpty(fieldValue)) {
                fields[fieldName] = [];
            } else {
                fields[fieldName] = fieldValue.map((value) => (isExplicitEmptySentinel(value) ? '' : value));
            }
            continue;
        }

        if (fieldValue && typeof fieldValue === 'object' && 'value' in fieldValue) {
            if (isExplicitEmptySentinel(fieldValue.value)) {
                fields[fieldName] = { ...fieldValue, value: '' };
            }
            continue;
        }

        if (isExplicitEmptySentinel(fieldValue)) {
            fields[fieldName] = '';
        }
    }

    return fields;
}

/**
 * Maps persisted explicit_empty sentinels in AEM author field rows to empty values for preview/cache.
 * @param {Array<{name: string, values?: Array, multiple?: boolean}>|undefined} fields
 * @returns {Array<{name: string, values?: Array, multiple?: boolean}>|undefined}
 */
export function normalizeExplicitEmptyInAuthorFields(fields) {
    if (!Array.isArray(fields)) {
        return fields;
    }

    return fields.map((field) => {
        const values = field.values ?? [];

        if (!fieldAllowsExplicitEmpty(field.name)) {
            return {
                ...field,
                values: coerceValuesWithoutExplicitEmpty(field.name, values, {
                    multiple: field.multiple === true,
                }),
            };
        }

        if (fieldValuesArePersistedExplicitEmpty(values)) {
            const emptyValues = field.multiple === true ? [] : [''];
            return { ...field, values: emptyValues };
        }

        if (field.multiple === true && values.some(isExplicitEmptySentinel)) {
            return {
                ...field,
                values: values.map((value) => (isExplicitEmptySentinel(value) ? '' : value)),
            };
        }

        return field;
    });
}
