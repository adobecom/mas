/**
 * Utilities for transforming version data between AEM format and internal format.
 * Handles field normalization, denormalization, and comparison.
 */

/**
 * Field configuration from version-page.js
 * This will be imported from version-page.js to maintain single source of truth
 */
let FIELD_CONFIG = null;

/**
 * Fields that must remain as arrays for merch-card hydration
 * These fields are accessed via .map() or array indexing in hydrate.js
 */
const ARRAY_FIELDS = new Set(['mnemonicIcon', 'mnemonicAlt', 'mnemonicLink', 'ctas', 'tags']);

/**
 * Set the field configuration
 * @param {Object} config - Field configuration object
 */
export function setFieldConfig(config) {
    FIELD_CONFIG = config;
}

/**
 * Normalize AEM data to flat fields object format
 * @param {Object} data - AEM fragment data
 * @returns {Object} Normalized fields object
 */
export function normalizeFields(data) {
    // Return if fields is already an object (not an array)
    if (data.fields && !Array.isArray(data.fields)) {
        return data.fields;
    }

    const sourceArray = data.fields || data.elements;
    if (!Array.isArray(sourceArray)) return {};

    const fields = {};
    sourceArray.forEach((element) => {
        if (!element.name) return;
        const value = element.value !== undefined ? element.value : element.values;
        if (value === undefined) return;

        // Keep array fields as arrays, unwrap single-item arrays for others
        if (ARRAY_FIELDS.has(element.name)) {
            fields[element.name] = Array.isArray(value) ? value : [value];
        } else if (Array.isArray(value)) {
            if (value.length === 0) return;
            fields[element.name] = value.length === 1 ? value[0] : value;
        } else {
            fields[element.name] = value;
        }
    });

    return fields;
}

/**
 * Convert flat fields object back to AEM array format
 * @param {Object} fieldsObject - Normalized fields object
 * @param {Object} currentFragment - Current fragment with field definitions
 * @returns {Array} AEM-formatted fields array
 */
export function denormalizeFields(fieldsObject, currentFragment) {
    const fieldsArray = [];

    // Create a map of field names to their definitions
    const fieldDefinitions = new Map();
    if (currentFragment.fields && Array.isArray(currentFragment.fields)) {
        currentFragment.fields.forEach((field) => {
            fieldDefinitions.set(field.name, field);
        });
    }

    for (const [name, value] of Object.entries(fieldsObject)) {
        const fieldDef = fieldDefinitions.get(name);
        if (!fieldDef) continue;

        let values;
        if (Array.isArray(value)) {
            values = value;
        } else if (value !== undefined && value !== null) {
            values = [value];
        } else {
            continue;
        }

        fieldsArray.push({
            ...fieldDef,
            values,
        });
    }

    return fieldsArray;
}

/**
 * Calculate differences between two versions
 * @param {Object} currentData - Current version data
 * @param {Object} selectedData - Selected version data
 * @returns {Array<{field: string, currentValue: any, selectedValue: any}>}
 */
export function calculateDifferences(currentData, selectedData) {
    if (!currentData || !selectedData) return [];

    const differences = [];
    const fields = normalizeFields(currentData);
    const selectedFields = normalizeFields(selectedData);
    const allKeys = new Set([...Object.keys(fields), ...Object.keys(selectedFields)]);

    allKeys.forEach((key) => {
        const currentValue = fields[key];
        let selectedValue = selectedFields[key];

        // Extract last segment from tags (e.g., 'caas:content-type/blog' → 'blog')
        if (key === 'tags') {
            if (Array.isArray(selectedValue)) {
                selectedValue = selectedValue.map((tag) => tag.split('/').pop());
            } else if (typeof selectedValue === 'object' && selectedValue !== null) {
                selectedValue = Object.values(selectedValue).map((tag) => tag.split('/').pop());
            }
        }

        const currentStr = JSON.stringify(currentValue);
        const selectedStr = JSON.stringify(selectedValue);

        if (currentStr !== selectedStr) {
            differences.push({
                field: key,
                currentValue,
                selectedValue,
            });
        }
    });

    return differences;
}

/**
 * Format field value for display
 * @param {any} value - Field value
 * @returns {string} Formatted value
 */
export function formatFieldValue(value) {
    if (!value) return false;
    if (typeof value === 'object') {
        if (Array.isArray(value)) {
            return value.join(', ');
        }
        return Object.values(value).join(', ');
    }

    return String(value);
}

/**
 * Get field label from config
 * @param {string} fieldName - Field name
 * @returns {string} User-friendly label
 */
export function getFieldLabel(fieldName) {
    if (!FIELD_CONFIG) {
        return fieldName;
    }
    return FIELD_CONFIG[fieldName]?.label || fieldName;
}

/**
 * Get field visibility from config
 * @param {string} fieldName - Field name
 * @returns {boolean} Whether field is visible on card
 */
export function getFieldVisible(fieldName) {
    if (!FIELD_CONFIG) {
        return false;
    }
    return FIELD_CONFIG[fieldName]?.visible || false;
}

/**
 * Get field hidden from config
 * @param {string} fieldName - Field name
 * @returns {boolean} Whether field is hidden
 */
export function getFieldHidden(fieldName) {
    if (!FIELD_CONFIG) {
        return false;
    }
    return FIELD_CONFIG[fieldName]?.hidden || false;
}
