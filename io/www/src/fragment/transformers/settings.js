import { odinUrl, odinReferences } from '../utils/paths.js';
import { fetch, getFragmentId, getRequestInfos } from '../utils/common.js';
import { logDebug } from '../utils/log.js';

const SETTINGS_ID_PATH = 'settings/index';
const COLLECTION_MODEL_ID = 'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL2NvbGxlY3Rpb24';
const CONFIG_CACHE_TTL = 5 * 60 * 1000;

/**
 * Available setting name definitions.
 */
export const SETTING_NAME_DEFINITIONS = [
    { name: 'addon', valueType: 'optional-text', editor: 'addon' },
    { name: 'secureLabel', valueType: 'optional-text', editor: 'text', propertyName: 'showSecureLabel' },
    { name: 'displayAnnual', valueType: 'boolean' },
    { name: 'displayPlanType', valueType: 'boolean', propertyName: 'showPlanType' },
    { name: 'quantitySelect', valueType: 'optional-text', editor: 'quantity-select' },
    { name: 'hideTrialCTAs', valueType: 'boolean' },
];

export const SETTING_NAME_BY_VALUE = new Map(SETTING_NAME_DEFINITIONS.map((definition) => [definition.name, definition]));

let settingsCache;

export function clearSettingsCache(preview = false) {
    if (preview) {
        console.log('Clearing settings preview cache');
        Object.keys(localStorage).forEach((key) => {
            if (key.startsWith('settings-')) {
                localStorage.removeItem(key);
            }
        });
    } else {
        settingsCache = undefined;
    }
}

async function cacheKey(context) {
    const { surface } = await getRequestInfos(context);
    return `settings-${surface}`;
}

async function getCachedSettings(context) {
    const key = await cacheKey(context);
    const cacheEntry = context.preview ? JSON.parse(localStorage.getItem(key)) : settingsCache?.[key];
    if (cacheEntry) {
        cacheEntry.isExpired = Date.now() - cacheEntry.timestamp > CONFIG_CACHE_TTL;
        return cacheEntry;
    }
    return null;
}

async function cache(context, settings) {
    const key = await cacheKey(context);
    const cacheEntry = {
        settings,
        timestamp: Date.now(),
    };
    if (context.preview) {
        localStorage.setItem(key, JSON.stringify(cacheEntry));
    } else {
        settingsCache = settingsCache || {};
        settingsCache[key] = cacheEntry;
    }
    return settings;
}

async function getSettingsId(context) {
    const { surface } = await getRequestInfos(context);
    if (!surface) return { status: 400, message: 'surface not available' };
    const { preview } = context;
    const settingsUrl = odinUrl(surface, { fragmentPath: SETTINGS_ID_PATH, preview });
    const { id, status, message } = await getFragmentId(context, settingsUrl, 'settings-id');
    if (status != 200) {
        return { status, message };
    }
    return { status: 200, id };
}

function normalizeBoolean(value) {
    if (value === true || value === 'true') return true;
    if (value === false || value === 'false') return false;
    return value;
}

export function extractValue(entry, fragment) {
    const definition = SETTING_NAME_BY_VALUE.get(entry.name);
    const propertyName = definition?.propertyName || entry.name;
    const localeValue = fragment.fields?.[propertyName];
    let booleanValue = normalizeBoolean(entry.booleanValue);
    let textValue = entry.textValue;
    if (typeof localeValue !== 'undefined') {
        if (['boolean', 'optional-text'].includes(entry.valuetype)) {
            booleanValue = normalizeBoolean(localeValue);
        }
        if (entry.valuetype === 'optional-text' && normalizeBoolean(localeValue) === false) {
            textValue = '';
        }
        if (entry.valuetype === 'text') {
            textValue = localeValue;
        }
    }
    switch (entry.valuetype) {
        case 'boolean':
            return booleanValue;
        case 'richText':
            return entry.richTextValue;
        case 'text':
            return textValue;
        case 'optional-text':
            return booleanValue ? textValue : '';
        default:
            return booleanValue;
    }
}

export function collectSettingEntries(settingFragment) {
    const { references } = settingFragment;
    const grouped = {};

    for (const ref of Object.values(references ?? {})) {
        const {
            value: { fields },
        } = ref;
        if (!fields) continue;
        const { name, locales, tags } = fields;
        if (!name) continue;
        if (!grouped[name]) {
            grouped[name] = { default: null, override: [] };
        }
        if (locales?.length > 0 || tags?.length > 0) {
            grouped[name].override.push(fields);
        } else {
            grouped[name].default = fields;
        }
    }

    return grouped;
}

export async function getSettings(context) {
    /* c8 ignore next 1 */
    if (context.hasExternalSettings) return context.settings;
    const cachedSettings = await getCachedSettings(context);
    if (cachedSettings && !cachedSettings.isExpired) return cachedSettings.settings;
    const { id } = await getSettingsId(context);
    if (!id) {
        return null;
    }
    const response = await fetch(odinReferences(id, true, context.preview), context, 'settings');

    if (response.status !== 200) {
        logDebug(() => 'Failed to fetch settings fragment', context);
        return null;
    }

    const settings = collectSettingEntries(response.body);
    return await cache(context, settings);
}

async function init(initContext) {
    return await getSettings(initContext);
}

export function resolveSettingEntry(fragment, locale, setting) {
    const defaultEntry = setting.default;
    const template = fragment.fields?.variant;
    if (!defaultEntry) return null;
    if (defaultEntry.templates?.length > 0 && !defaultEntry.templates.includes(template)) return null;
    const filteredLocale = setting.override.filter(
        (overrideSetting) =>
            !overrideSetting.locales || overrideSetting.locales.length === 0 || overrideSetting.locales.includes(locale),
    );
    if (filteredLocale.length == 0) return defaultEntry;
    // Find all overrides matching the locale; now select best by tags
    let bestMatch = defaultEntry;
    let maxTagMatches = -1;
    const tags = fragment.fields?.tags;
    if (filteredLocale.length > 1 && tags?.length > 0) {
        for (const overrideSetting of filteredLocale) {
            const tagMatches = overrideSetting.tags.filter((tag) => tags.includes(tag)).length;
            if (tagMatches > maxTagMatches) {
                maxTagMatches = tagMatches;
                bestMatch = overrideSetting;
            }
        }
    } else if (filteredLocale.length === 1) {
        // No tags or no fragment tags; just return the first matching override
        bestMatch = filteredLocale[0];
    }

    return { ...defaultEntry, ...bestMatch };
}

function applySettings(context, fragment, locale, settings) {
    for (const key of Object.keys(settings)) {
        const entry = resolveSettingEntry(fragment, locale, settings[key]);
        if (!entry) continue;
        fragment.settings = {
            ...fragment.settings,
            [entry.name]: extractValue(entry, fragment),
        };
    }
    //temporary fix waiting for MWPW-189860 to be implemented
    if (fragment?.fields?.perUnitLabel) {
        fragment.priceLiterals ??= {};
        fragment.priceLiterals.perUnitLabel = fragment.fields.perUnitLabel;
    }
    logDebug(() => `Applying settings for fragment ${fragment.id}: ${JSON.stringify(fragment.settings)}`, context);
}

function applyCollectionSettings(context, locale, settings) {
    if (context.body?.references) {
        Object.entries(context.body.references).forEach(([key, ref]) => {
            if (ref && ref.type === 'content-fragment') {
                applySettings(context, ref.value, locale, settings);
            }
        });
    }

    context.body.placeholders = {
        searchText: '{{coll-search-text}}',
        filtersText: '{{coll-filters-text}}',
        sortText: '{{coll-sort-text}}',
        popularityText: '{{coll-popularity-text}}',
        alphabeticallyText: '{{coll-alphabetically-text}}',
        noResultsText: '{{coll-no-results-text}}',
        plansSidenavTitle: '{{coll-plans-sidenav-title}}',
        catalogSidenavTitle: '{{coll-catalog-sidenav-title}}',
        catalogSidenavClose: '{{coll-catalog-sidenav-close}}',
        catalogSpecialOffersAlt: '{{catalog-special-offers-alt}}',
        sidenavFilterCategories: '{{sidenav-filter-categories}}',
        sidenavResources: '{{sidenav-resources}}',
        resultText: '{{coll-result-text}}',
        resultsText: '{{coll-results-text}}',
        resultMobileText: '{{coll-result-mobile-text}}',
        resultsMobileText: '{{coll-results-mobile-text}}',
        searchResultText: '{{coll-search-result-text}}',
        searchResultsText: '{{coll-search-results-text}}',
        searchResultMobileText: '{{coll-search-result-mobile-text}}',
        searchResultsMobileText: '{{coll-search-results-mobile-text}}',
        noSearchResultsText: '{{coll-no-search-results-text}}',
        noSearchResultsMobileText: '{{coll-no-search-results-mobile-text}}',
        showMoreText: '{{coll-show-more-text}}',
    };

    context.dictionary = {
        ...context?.dictionary,
        'coll-filter': '<span data-placeholder=\\"filter\\"></span>',
        'coll-result-count': '<span data-placeholder=\\"resultCount\\"></span>',
        'coll-search-term': '<span data-placeholder=\\"searchTerm\\"></span>',
    };

    context.body.settings = context.body.settings || {};
    context.body.settings.tagLabels =
        Object.fromEntries(['desktop', 'mobile', 'web'].map((label) => [label, `{{coll-tag-filter-${label}}}`])) || {};
}

function applyPriceLiterals(fragment) {
    if (fragment) {
        fragment.priceLiterals = {
            recurrenceLabel: '{{price-literal-recurrence-label}}',
            recurrenceAriaLabel: '{{price-literal-recurrence-aria-label}}',
            perUnitLabel: '{{price-literal-per-unit-label}}',
            perUnitAriaLabel: '{{price-literal-per-unit-aria-label}}',
            freeLabel: '{{price-literal-free-label}}',
            freeAriaLabel: '{{price-literal-free-aria-label}}',
            taxExclusiveLabel: '{{price-literal-tax-exclusive-label}}',
            taxInclusiveLabel: '{{price-literal-tax-inclusive-label}}',
            alternativePriceAriaLabel: '{{price-literal-alternative-price-aria-label}}',
            strikethroughAriaLabel: '{{price-literal-strikethrough-aria-label}}',
            planTypeLabel: '{{price-literal-plan-type-label}}',
        };
    }
}

async function settings(context) {
    applyPriceLiterals(context.body);

    const settings = await context.promises?.settings;

    logDebug(() => `Settings transformer: fetched settings ${JSON.stringify(settings)}`, context);

    const { body, locale } = context;

    if (settings) {
        if (body?.model?.id === COLLECTION_MODEL_ID) {
            applyCollectionSettings(context, locale, settings);
        } else {
            applySettings(context, body, locale, settings);
        }
    }

    return context;
}

export const transformer = {
    name: 'settings',
    init,
    process: settings,
};
export { applyCollectionSettings };
