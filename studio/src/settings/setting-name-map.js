import { createQuantitySelectValue } from '../common/fields/quantity-select.js';

/**
 * Available setting name definitions.
 */
export const SETTING_NAME_DEFINITIONS = [
    { name: 'addon', label: 'Addon', valueType: 'optional-text', editor: 'placeholder' },
    { name: 'secureLabel', label: 'SecureLabel', valueType: 'optional-text', editor: 'placeholder' },
    { name: 'displayAnnual', label: 'display annual', valueType: 'boolean', editor: 'boolean' },
    { name: 'displayPlanType', label: 'display plan type', valueType: 'boolean', editor: 'boolean' },
    { name: 'quantitySelect', label: 'Quantity select', valueType: 'text', editor: 'quantity-select' },
];

const SETTING_NAME_BY_VALUE = new Map(SETTING_NAME_DEFINITIONS.map((definition) => [definition.name, definition]));

/**
 * Returns the setting definition by name.
 * @param {string} name
 * @returns {{ name: string, label: string, valueType: string, editor: string } | undefined}
 */
export const getSettingNameDefinition = (name) => SETTING_NAME_BY_VALUE.get(name);

/**
 * Returns deterministic default value for a setting name definition.
 * @param {{ editor: string }} definition
 * @returns {string | boolean}
 */
export const getSettingDefaultValue = (definition) => {
    if (definition.editor === 'boolean') return true;
    if (definition.editor === 'placeholder') return '';
    if (definition.editor === 'quantity-select') {
        return createQuantitySelectValue({ title: '', min: '1', step: '1' });
    }
    return '';
};
