import { CARD_MODEL_PATH, COLLECTION_MODEL_PATH } from '../constants.js';
import { fixFieldsDataExtraOptions, shouldApplyCorrector } from '../../../io/www/src/fragment/transformers/corrector.js';

/**
 * Applies corrector transformer logic to fragment data
 * Fixes data-extra-options attributes in ctas, description, and shortDescription fields
 * @param {object} fragmentData - Fragment data object with fields array
 * @param {string} surface - Surface name (e.g., 'adobe-home', 'sandbox', 'ccd')
 * @returns {void} - Modifies fragmentData in place
 */
export function applyCorrectorToFragment(fragmentData, surface) {
    if (!fragmentData || !fragmentData.fields || !Array.isArray(fragmentData.fields)) {
        return;
    }

    // Only apply for specific surfaces
    if (!shouldApplyCorrector(surface)) {
        return;
    }

    // Only apply for card or collection models
    const modelPath = fragmentData.model?.path;
    if (modelPath !== CARD_MODEL_PATH && modelPath !== COLLECTION_MODEL_PATH) {
        return;
    }

    // Convert Fragment structure to context.body.fields structure expected by fixFieldsDataExtraOptions
    const contextFields = {};
    const fieldsToFix = ['ctas', 'description', 'shortDescription'];
    const originalValues = {}; // Track original values to detect changes

    for (const fieldName of fieldsToFix) {
        const field = fragmentData.fields.find((f) => f.name === fieldName);
        if (field && field.values && Array.isArray(field.values) && field.values.length > 0) {
            const fieldValue = field.values[0];
            if (typeof fieldValue === 'string' && fieldValue.trim()) {
                // Store original value to detect if correction was made
                originalValues[fieldName] = fieldValue;
                // Store reference to original field for updating later
                contextFields[fieldName] = {
                    value: fieldValue,
                    _originalField: field,
                };
            }
        }
    }

    // Create context structure expected by fixFieldsDataExtraOptions
    const context = {
        body: {
            fields: contextFields,
        },
    };

    // Apply the corrector logic
    fixFieldsDataExtraOptions(context);

    // Copy fixed values back to Fragment structure and track corrections
    const correctedFields = [];
    for (const fieldName of fieldsToFix) {
        const contextField = context.body.fields[fieldName];
        if (contextField && contextFields[fieldName]?._originalField) {
            const fixedValue = typeof contextField === 'string' ? contextField : contextField.value;
            if (fixedValue) {
                const originalValue = originalValues[fieldName];
                // Always update the field value
                contextFields[fieldName]._originalField.values[0] = fixedValue;
                // Track if value actually changed
                if (originalValue && fixedValue !== originalValue) {
                    correctedFields.push(fieldName);
                }
            }
        }
    }

    // Log to LANA if corrections were made
    if (correctedFields.length > 0 && window.lana?.log) {
        const { pathname, search } = window.location;
        const page = `¶page=${pathname}${search}`;
        const facts = JSON.stringify({
            fragmentId: fragmentData.id || 'unknown',
            fragmentPath: fragmentData.path || 'unknown',
            fragmentTitle: fragmentData.title || 'unknown',
            modelPath: modelPath || 'unknown',
            surface: surface || 'unknown',
            correctedFields: correctedFields.join(','),
        });
        window.lana.log(`Corrector applied${page}¶facts=${facts}`, {
            clientId: 'merch-at-scale-studio',
            delimiter: '¶',
            sampleRate: 1,
            tags: 'studio',
        });
    }
}
