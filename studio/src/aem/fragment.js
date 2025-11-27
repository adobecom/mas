const LOCALE_DEFAULTS = [
    'ar_MENA',
    'bg_BG',
    'cs_CZ',
    'da_DK',
    'de_DE',
    'el_GR',
    'en_US',
    'es_ES',
    'et_EE',
    'fi_FI',
    'fr_FR',
    'he_IL',
    'hr_HR',
    'hu_HU',
    'id_ID',
    'it_IT',
    'ja_JP',
    'ko_KR',
    'lt_LT',
    'lv_LV',
    'ms_MY',
    'nb_NO',
    'nl_NL',
    'pl_PL',
    'pt_BR',
    'ro_RO',
    'ru_RU',
    'sk_SK',
    'sl_SI',
    'sr_RS',
    'sv_SE',
    'th_TH',
    'tr_TR',
    'uk_UA',
    'vi_VN',
    'zh_CN',
    'zh_TW',
];

function extractLocaleFromPath(path) {
    if (!path) return null;
    const parts = path.split('/');
    for (const part of parts) {
        if (/^[a-z]{2}_[A-Z]{2}$/.test(part)) {
            return part;
        }
    }
    return null;
}

function getCorrespondingLocale(locale) {
    if (!locale) return null;
    const [language] = locale.split('_');
    for (const defaultLocale of LOCALE_DEFAULTS) {
        if (defaultLocale.startsWith(`${language}_`)) {
            return defaultLocale;
        }
    }
    return locale;
}

export class Fragment {
    path = '';
    hasChanges = false;
    status = '';

    fields = [];

    selected = false;

    initialValue;

    /**
     * @param {*} AEM Fragment JSON object
     */
    constructor({ id, etag, model, path, title, description, status, created, modified, published, fields, tags, references }) {
        this.id = id;
        this.model = model;
        this.etag = etag;
        this.path = path;
        this.name = path?.split('/')?.pop();
        this.title = title;
        this.description = description;
        this.status = status;
        this.created = created;
        this.modified = modified;
        this.published = published;
        this.tags = tags;
        this.fields = fields;
        this.references = references;
        this.tags = tags || [];
        this.initialValue = structuredClone(this);
    }

    get variant() {
        return this.fields.find((field) => field.name === 'variant')?.values?.[0];
    }

    get fragmentName() {
        return this.path.split('/').pop();
    }

    get statusVariant() {
        return this.status?.toLowerCase();
    }

    getTagTitle(id) {
        const tags = this.tags.filter((tag) => tag.id.includes(id));
        return tags[0]?.title;
    }

    refreshFrom(fragmentData) {
        Object.assign(this, fragmentData);
        this.initialValue = structuredClone(this);
        this.hasChanges = false;
    }

    /**
     * Updates the fragment entirely while preserving the initial value & hasChange status if not specified
     * @param {object} fragmentData
     * @param {Boolean | undefined} hasChanges
     */
    replaceFrom(fragmentData, hasChanges) {
        Object.assign(this, fragmentData);
        if (hasChanges === undefined) return;
        this.hasChanges = hasChanges;
    }

    discardChanges() {
        if (!this.hasChanges) return;
        Object.assign(this, this.initialValue);
        this.initialValue = structuredClone(this);
        this.hasChanges = false;
    }

    updateFieldInternal(fieldName, value) {
        this[fieldName] = value ?? '';
        this.hasChanges = true;
    }

    getField(fieldName) {
        return this.fields.find((field) => field.name === fieldName);
    }

    getFieldValue(fieldName, index = 0) {
        return this.fields.find((field) => field.name === fieldName)?.values?.[index];
    }

    getLocale() {
        return extractLocaleFromPath(this.path);
    }

    getDefaultLocale() {
        const locale = this.getLocale();
        return locale ? getCorrespondingLocale(locale) : null;
    }

    isVariation() {
        const locale = this.getLocale();
        if (!locale) return false;
        const defaultLocale = getCorrespondingLocale(locale);
        return locale !== defaultLocale;
    }

    getVariations() {
        const variationsField = this.fields.find((field) => field.name === 'variations');
        return variationsField?.values || [];
    }

    hasVariations() {
        const variations = this.getVariations();
        return variations.length > 0;
    }

    updateField(fieldName, value) {
        let change = false;
        this.fields
            .filter((field) => field.name === fieldName)
            .forEach((field) => {
                //handles encoding of values for characters like ✓
                const encodedValues = value.map((v) => {
                    if (typeof v === 'string') {
                        return v.normalize('NFC');
                    }
                    return v;
                });
                if (
                    field.values.length === encodedValues.length &&
                    field.values.every((v, index) => v === encodedValues[index])
                )
                    return;
                field.values = encodedValues;
                this.hasChanges = true;
                change = true;
            });
        if (fieldName === 'tags') this.newTags = value;
        return change;
    }

    getEffectiveFieldValue(fieldName, parentFragment, index = 0) {
        const ownValue = this.getFieldValue(fieldName, index);
        if (ownValue !== undefined && ownValue !== null && ownValue !== '') {
            return ownValue;
        }
        if (!parentFragment || !this.isVariation()) {
            return ownValue;
        }
        return parentFragment.getFieldValue(fieldName, index);
    }

    getEffectiveFieldValues(fieldName, parentFragment) {
        const ownField = this.getField(fieldName);
        if (ownField && ownField.values && ownField.values.length > 0) {
            return ownField.values;
        }
        if (!parentFragment || !this.isVariation()) {
            return ownField?.values || [];
        }
        const parentField = parentFragment.getField(fieldName);
        return parentField?.values || [];
    }

    getFieldState(fieldName, parentFragment) {
        if (!this.isVariation() || !parentFragment) {
            return 'no-parent';
        }
        const ownField = this.getField(fieldName);
        if (!ownField || !ownField.values || ownField.values.length === 0) {
            return 'inherited';
        }
        const parentField = parentFragment.getField(fieldName);
        if (!parentField || !parentField.values) {
            return 'overridden';
        }
        const areEqual =
            ownField.values.length === parentField.values.length &&
            ownField.values.every((v, i) => v === parentField.values[i]);
        return areEqual ? 'same-as-parent' : 'overridden';
    }

    isFieldOverridden(fieldName) {
        if (!this.isVariation()) {
            return false;
        }
        const field = this.getField(fieldName);
        return field && field.values && field.values.length > 0;
    }

    resetFieldToParent(fieldName) {
        const fieldIndex = this.fields.findIndex((field) => field.name === fieldName);
        if (fieldIndex !== -1) {
            this.fields.splice(fieldIndex, 1);
            this.hasChanges = true;
            return true;
        }
        return false;
    }
}
