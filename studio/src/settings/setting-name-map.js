import { createQuantitySelectValue } from '../common/fields/quantity-select.js';

/**
 * Available setting name definitions.
 */
export const SETTING_NAME_DEFINITIONS = [
    { name: 'showAddon', label: 'showAddon', valueType: 'boolean', editor: 'boolean' },
    { name: 'showPlanType', label: 'showPlanType', valueType: 'boolean', editor: 'boolean' },
    { name: 'showSecureTransaction', label: 'showSecureTransaction', valueType: 'boolean', editor: 'boolean' },
    { name: 'showBadge', label: 'showBadge', valueType: 'boolean', editor: 'boolean' },
    { name: 'showAcrobatAiAssistant', label: 'showAcrobatAiAssistant', valueType: 'text', editor: 'text' },
    { name: 'showFeatureFlag', label: 'showFeatureFlag', valueType: 'text', editor: 'text' },
    { name: 'displayAnnual', label: 'displayAnnual', valueType: 'boolean', editor: 'boolean' },
    { name: 'displayPlanType', label: 'displayPlanType', valueType: 'boolean', editor: 'boolean' },
    { name: 'showSecureLabel', label: 'showSecureLabel', valueType: 'boolean', editor: 'boolean' },
    { name: 'quantitySelect', label: 'quantitySelect', valueType: 'text', editor: 'quantity-select' },
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
    if (definition.editor === 'quantity-select') {
        return createQuantitySelectValue({ title: '', min: '1', step: '1' });
    }
    return '';
};
