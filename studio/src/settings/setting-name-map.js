import { createQuantitySelectValue } from '../common/fields/quantity-select.js';

/**
 * Available setting name definitions.
 */
export const SETTING_NAME_DEFINITIONS = [
    { name: 'addon', valueType: 'optional-text', editor: 'addon' },
    { name: 'secureLabel', valueType: 'optional-text', editor: 'text' },
    { name: 'displayAnnual', valueType: 'boolean' },
    { name: 'displayPlanType', valueType: 'boolean' },
    { name: 'quantitySelect', valueType: 'optional-text', editor: 'quantity-select' },
];

const SETTING_NAME_BY_VALUE = new Map(SETTING_NAME_DEFINITIONS.map((definition) => [definition.name, definition]));

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
