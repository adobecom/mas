import { odinUrl, odinReferences } from '../utils/paths.js';
import { fetch, getFragmentId, getRequestInfos } from '../utils/common.js';
import { logDebug } from '../utils/log.js';

const COLLECTION_MODEL_ID = 'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL2NvbGxlY3Rpb24';
const SETTINGS_FRAGMENT_PATH = 'settings';

const PLAN_TYPE_LOCALES = [
    'en_US',
    'en_AU',
    'en_HK',
    'zh_HK',
    'en_ID',
    'id_ID',
    'en_MY',
    'ms_MY',
    'en_NZ',
    'en_PH',
    'fil_PH',
    'en_SG',
    'en_TH',
    'th_TH',
    'zh_TW',
    'en_VN',
    'vi_VN',
    'en_IN',
    'de_AT',
    'de_CH',
    'de_DE',
    'de_LU',
];

async function init(initContext) {
    console.log('[SETTINGS-INIT] PATH:', SETTINGS_FRAGMENT_PATH);
    const { surface, parsedLocale } = await getRequestInfos(initContext);
    const { preview } = initContext;

    if (!surface || !parsedLocale) {
        logDebug(() => 'Settings init: missing surface or locale', initContext);
        return { localeSettings: null };
    }

    const settingsUrl = odinUrl(surface, parsedLocale, SETTINGS_FRAGMENT_PATH, preview);
    const { id, status } = await getFragmentId(initContext, settingsUrl, 'settings-id');

    if (status !== 200) {
        logDebug(() => `Settings fragment not found for ${surface}/${parsedLocale}`, initContext);
        return { localeSettings: null };
    }

    const response = await fetch(odinReferences(id, false, preview), initContext, 'settings-fragment');

    if (response.status !== 200) {
        logDebug(() => 'Failed to fetch settings fragment', initContext);
        return { localeSettings: null };
    }

    const fields = response.body?.fields || {};
    const localeSettings = {
        showSecureLabel: fields.showSecureLabel ?? false,
        checkoutWorkflow: fields.checkoutWorkflow ?? '',
    };

    logDebug(() => `Loaded locale settings: ${JSON.stringify(localeSettings)}`, initContext);
    return { localeSettings };
}

function applyCollectionSettings(context, localeSettings) {
    if (context.body?.references) {
        Object.entries(context.body.references).forEach(([key, ref]) => {
            if (ref && ref.type === 'content-fragment') {
                const variant = ref.value?.fields?.variant;
                if (variant?.startsWith('plans')) {
                    applyPlansSettings(ref.value, context, localeSettings);
                }
                if (variant === 'mini') {
                    applyMiniSettings(ref.value, context, localeSettings);
                }
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

function applyPlansSettings(fragment, context, localeSettings) {
    const { locale } = context;
    fragment.settings = fragment.settings || {};

    if (localeSettings?.showSecureLabel) {
        fragment.settings.secureLabel = '{{secure-label}}';
    }

    if (localeSettings?.checkoutWorkflow) {
        fragment.settings.checkoutWorkflow = localeSettings.checkoutWorkflow;
    }
    if (fragment?.fields?.showPlanType != null) {
        fragment.settings.displayPlanType = fragment?.fields?.showPlanType;
    }
    if (fragment?.fields?.perUnitLabel) {
        fragment.priceLiterals ??= {};
        fragment.priceLiterals.perUnitLabel = fragment.fields.perUnitLabel;
    }
    if (PLAN_TYPE_LOCALES.includes(locale)) {
        fragment.settings.displayPlanType ??= true;
    }
}

function applyMiniSettings(fragment, context, localeSettings) {
    const { locale } = context;
    fragment.settings = fragment.settings || {};

    if (localeSettings?.showSecureLabel) {
        fragment.settings.secureLabel = '{{secure-label}}';
    }

    if (localeSettings?.checkoutWorkflow) {
        fragment.settings.checkoutWorkflow = localeSettings.checkoutWorkflow;
    }

    if (locale === 'en_AU') {
        fragment.settings.displayPlanType = true;
        fragment.settings.displayAnnual = true;
    }
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

    const settingsResult = await context.promises?.settings;
    const localeSettings = settingsResult?.localeSettings || null;

    if (context.body?.fields?.variant?.startsWith('plans')) {
        applyPlansSettings(context.body, context, localeSettings);
    }

    if (context.body?.fields?.variant === 'mini') {
        applyMiniSettings(context.body, context, localeSettings);
    }

    if (context.body?.model?.id === COLLECTION_MODEL_ID) {
        applyCollectionSettings(context, localeSettings);
    }

    return context;
}

export const transformer = {
    name: 'settings',
    init,
    process: settings,
};
export { applyCollectionSettings, PLAN_TYPE_LOCALES };
