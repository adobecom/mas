import { ReactiveStore } from '../reactivity/reactive-store.js';

const trueValues = new Set(['true', '1', 'yes', 'on']);
const falseValues = new Set(['false', '0', 'no', 'off']);

const normalizeBoolean = (value) => {
    const normalized = `${value}`.trim().toLowerCase();
    if (trueValues.has(normalized)) return true;
    if (falseValues.has(normalized)) return false;
    return value;
};

/**
 * Normalizes a settings fragment into a UI row record.
 * @param {import('../aem/fragment.js').Fragment} fragment
 * @returns {object}
 */
export const normalizeSettingFragment = (fragment) => {
    const name = `${fragment.getFieldValue('name') || ''}`;
    const label = `${fragment.title || ''}`;
    const dataField = fragment.getFieldValue('data');
    const data = dataField ? JSON.parse(dataField) : {};
    const valueType = `${fragment.getFieldValue('valuetype') || 'text'}`;
    const rawValue =
        valueType === 'boolean'
            ? fragment.getFieldValue('booleanValue')
            : valueType === 'richText'
              ? fragment.getFieldValue('richTextValue')
              : fragment.getFieldValue('textValue');
    const overridesField = fragment.getFieldValue('overrides');
    const overrides = overridesField ? JSON.parse(overridesField) : [];
    const locales = fragment.getFieldValues('locales');
    const tags = fragment.getFieldValues('tags');

    return {
        id: fragment.id,
        name,
        label,
        description: `${fragment.description || ''}`,
        locale: locales.join(', ') || 'All',
        locales,
        templateIds: fragment.getFieldValues('templates'),
        templateSummary: '',
        value: normalizeBoolean(rawValue),
        valueType,
        data,
        overrides,
        tags,
        modifiedBy: fragment.modified?.by || '',
        modifiedAt: fragment.modified?.at || '',
        status: fragment.status,
        fragment,
    };
};

/**
 * Generic reactive store for a single settings row backed by a Fragment.
 */
export class SettingStore extends ReactiveStore {
    constructor(fragment, record = null) {
        super(record || normalizeSettingFragment(fragment));
    }

    refreshFromFragment(fragment) {
        this.set({
            ...this.value,
            ...normalizeSettingFragment(fragment),
        });
    }

    refreshFromRecord(record) {
        this.set({
            ...this.value,
            ...record,
        });
    }

    setTemplateSummary(templateSummary) {
        this.set({
            ...this.value,
            templateSummary,
        });
    }

    setTemplates(templateIds) {
        this.set({
            ...this.value,
            templateIds: [...templateIds],
        });
    }

    setValue(value) {
        const normalized = normalizeBoolean(value);
        this.set({
            ...this.value,
            value: normalized,
            data: {
                ...this.value.data,
                value: normalized,
            },
        });
    }

    patchData(patch) {
        this.set({
            ...this.value,
            data: {
                ...this.value.data,
                ...patch,
            },
        });
    }

    setOverrides(overrides) {
        this.set({
            ...this.value,
            overrides: [...overrides],
        });
    }

    addOverride(override) {
        this.set({
            ...this.value,
            overrides: [...this.value.overrides, override],
        });
    }

    removeOverride(overrideId) {
        this.set({
            ...this.value,
            overrides: this.value.overrides.filter((override, index) => override.id !== overrideId && index !== overrideId),
        });
    }

    dispose() {
        this.setMeta('disposed', true);
    }
}
