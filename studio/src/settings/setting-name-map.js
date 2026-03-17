import { createQuantitySelectValue } from '../common/fields/quantity-select.js';
import { SETTING_NAME_BY_VALUE } from '../../../io/www/src/fragment/transformers/settings.js';

/**
 * Returns the setting definition by name.
 * @param {string} name
 * @returns {{ name: string, valueType: string, editor: string } | undefined}
 */
export const getSettingNameDefinition = (name) => SETTING_NAME_BY_VALUE.get(name);

/**
 * Returns deterministic default value for a setting name definition.
 * @param {{ editor: string }} definition
 * @returns {string | boolean}
 */
export const getSettingDefaultValue = (definition) => {
    if (definition.editor === 'boolean') return true;
    if (definition.editor === 'quantity-select') {
        return createQuantitySelectValue({ title: '', min: '1', step: '1' });
    }
    return '';
};
