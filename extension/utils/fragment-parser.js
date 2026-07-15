function getLocaleHelpers() {
    if (typeof self !== 'undefined' && self.MASLocales) return self.MASLocales;
    if (typeof module !== 'undefined' && module.exports) {
        try {
            return require('./locales.js');
        } catch (err) {
            return null;
        }
    }
    return null;
}

class FragmentParser {
    parseFragmentData(fragmentData) {
        if (!fragmentData || !fragmentData.fields) {
            return null;
        }

        const parsed = {
            id: fragmentData.id,
            path: fragmentData.path,
            name: fragmentData.name,
            title: fragmentData.title,
            description: fragmentData.description,
            status: fragmentData.status,
            created: fragmentData.created?.date,
            modified: fragmentData.modified?.date,
            published: fragmentData.published?.date,
            tags:
                fragmentData.tags?.map((tag) => ({
                    id: tag.id,
                    title: tag.title,
                })) || [],
            fields: {},
        };

        const fields = fragmentData.fields;
        if (Array.isArray(fields)) {
            fields.forEach((field) => {
                const value = this.parseFieldValue(field);
                parsed.fields[field.name] = {
                    value,
                    multiple: field.multiple,
                    type: field.dataType || 'string',
                };
            });
        } else {
            Object.entries(fields).forEach(([name, value]) => {
                const isHtmlField = value && typeof value === 'object' && value.mimeType;
                const isMultiple = Array.isArray(value);

                let fieldValue;
                if (isHtmlField) {
                    fieldValue = value.value;
                } else if (value && typeof value === 'object' && !isMultiple) {
                    fieldValue = JSON.stringify(value);
                } else {
                    fieldValue = value;
                }

                parsed.fields[name] = {
                    value: fieldValue,
                    multiple: isMultiple,
                    type: isHtmlField ? 'html' : 'string',
                };
            });
        }

        return parsed;
    }

    parseFieldValue(field) {
        if (!field.values || field.values.length === 0) {
            return field.multiple ? [] : '';
        }

        if (field.multiple) {
            return field.values;
        }

        return field.values[0];
    }

    getCommonFields(parsedData) {
        const fields = parsedData.fields;
        return {
            variant: fields.variant?.value || 'unknown',
            cardTitle: fields.cardTitle?.value || fields.name?.value || parsedData.title,
            description: fields.description?.value || '',
            badge: fields.badge?.value || '',
            badgeColor: fields.badgeColor?.value || '',
            badgeBackgroundColor: fields.badgeBackgroundColor?.value || '',
            prices: fields.prices?.value || [],
            ctas: fields.ctas?.value || '',
            mnemonicIcon: fields.mnemonicIcon?.value || [],
            mnemonicAlt: fields.mnemonicAlt?.value || [],
            mnemonicLink: fields.mnemonicLink?.value || [],
        };
    }

    groupFieldsByCategory(parsedData) {
        const fields = parsedData.fields;
        const categories = {
            basic: {},
            styling: {},
            content: {},
            pricing: {},
            actions: {},
            metadata: {},
        };

        const fieldCategories = {
            basic: ['variant', 'name', 'cardTitle', 'size'],
            styling: ['badgeColor', 'badgeBackgroundColor', 'borderColor', 'backgroundColor'],
            content: ['description', 'shortDescription', 'badge', 'mnemonicIcon', 'mnemonicAlt', 'mnemonicLink'],
            pricing: ['prices', 'priceStrikethrough'],
            actions: ['ctas', 'ctaText', 'ctaUrl'],
            metadata: ['tags', 'created', 'modified', 'published', 'status'],
        };

        Object.keys(fields).forEach((fieldName) => {
            let assigned = false;
            for (const [category, fieldList] of Object.entries(fieldCategories)) {
                if (fieldList.includes(fieldName)) {
                    categories[category][fieldName] = fields[fieldName];
                    assigned = true;
                    break;
                }
            }
            if (!assigned) {
                categories.metadata[fieldName] = fields[fieldName];
            }
        });

        categories.metadata.tags = parsedData.tags;
        categories.metadata.created = parsedData.created;
        categories.metadata.modified = parsedData.modified;
        categories.metadata.published = parsedData.published;
        categories.metadata.status = parsedData.status;

        return categories;
    }

    formatFieldForDisplay(fieldData, truncate = true) {
        let value = fieldData.value;

        if (value && typeof value === 'object' && !Array.isArray(value)) {
            if (value.value !== undefined) {
                value = value.value;
            } else if (value.mimeType) {
                value = value.value || '';
            } else {
                value = JSON.stringify(value, null, 2);
            }
        }

        if (Array.isArray(value)) {
            value = value
                .map((item) => {
                    if (item && typeof item === 'object') {
                        return item.value || JSON.stringify(item);
                    }
                    return item;
                })
                .join(', ');
        }

        if (typeof value === 'string' && value.length > 100 && truncate) {
            return { text: value.substring(0, 100) + '...', fullText: value, truncated: true };
        }

        return { text: String(value ?? ''), fullText: String(value ?? ''), truncated: false };
    }

    parseVariationInfo(fragmentData) {
        const path = fragmentData.path;
        if (!path) {
            return {
                locale: null,
                surface: null,
                fragmentPath: null,
                isVariation: false,
                localeDefaultLocale: null,
                localeDefaultPath: null,
                variations: [],
            };
        }

        const pathMatch = path.match(/\/content\/dam\/mas\/([^/]+)\/([^/]+)\/(.+)/);
        if (!pathMatch) {
            return {
                locale: null,
                surface: null,
                fragmentPath: null,
                isVariation: false,
                localeDefaultLocale: null,
                localeDefaultPath: null,
                variations: [],
            };
        }

        const [, surface, locale, fragmentPath] = pathMatch;
        const locales = getLocaleHelpers();
        const isLocaleDefault = locales ? locales.isDefaultLocale(locale, surface) : locale === 'en_US';

        let localeDefaultLocale = null;
        let localeDefaultPath = null;

        if (!isLocaleDefault) {
            const language = locale.split('_')[0];
            localeDefaultLocale = (locales && locales.getDefaultLocaleForLanguage(language, surface)) || 'en_US';
            localeDefaultPath = `/content/dam/mas/${surface}/${localeDefaultLocale}/${fragmentPath}`;
        }

        const variations = this.extractVariations(fragmentData);

        return {
            locale,
            surface,
            fragmentPath,
            isVariation: !isLocaleDefault,
            localeDefaultLocale,
            localeDefaultPath,
            variations,
        };
    }

    extractVariations(fragmentData) {
        const buckets = { locale: [], promo: [], grouped: [] };
        const fields = fragmentData.fields;
        const references = fragmentData.references || {};

        let variationIds = [];
        if (Array.isArray(fields)) {
            const variationsField = fields.find((f) => f.name === 'variations');
            variationIds = variationsField?.values || [];
        } else if (fields?.variations) {
            variationIds = Array.isArray(fields.variations) ? fields.variations : [];
        }

        const seen = new Set();
        variationIds.forEach((varId) => {
            if (seen.has(varId)) return;

            const ref = references[varId];
            const refData = ref?.value || ref;
            if (!refData || !refData.path) return;

            const match = refData.path.match(/\/content\/dam\/mas\/([^/]+)\/([^/]+)\/(.+)/);
            if (!match) return;

            seen.add(varId);
            const [, varSurface, varLocale, varFragmentPath] = match;
            const baseEntry = {
                id: refData.id || varId,
                path: refData.path,
                surface: varSurface,
                locale: varLocale,
                fragmentPath: varFragmentPath,
            };

            if (refData.path.includes('/pzn/')) {
                const pznCountries = (refData.tags || [])
                    .map((t) => t && (t.id || t))
                    .filter((id) => typeof id === 'string' && id.startsWith('mas:pzn/country/'))
                    .map((id) => id.slice('mas:pzn/country/'.length));
                const nameSegments = varFragmentPath.split('/');
                const name = nameSegments[nameSegments.length - 1];
                buckets.grouped.push({ ...baseEntry, type: 'grouped', pznCountries, name });
                return;
            }

            const promoTag = (refData.tags || [])
                .map((t) => t && (t.id || t))
                .find((id) => typeof id === 'string' && id.startsWith('mas:promotion/'));
            if (promoTag) {
                const promotionName = promoTag.slice('mas:promotion/'.length);
                buckets.promo.push({ ...baseEntry, type: 'promo', promotionName });
                return;
            }

            buckets.locale.push({ ...baseEntry, type: 'locale' });
        });

        return buckets;
    }

    getLocaleDisplayName(localeCode) {
        const locales = getLocaleHelpers();
        return locales ? locales.getLocaleDisplayName(localeCode) : localeCode;
    }
}

if (typeof window !== 'undefined') {
    window.MASFragmentParser = new FragmentParser();
}
