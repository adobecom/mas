const COLLECTION_MODEL_ID = 'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL2NvbGxlY3Rpb24';
const PLAN_TYPE_LOCALES = ['en_US', 'en_AU', 'en_HK', 'zh_HK', 'en_ID', 'id_ID', 'en_MY', 'ms_MY', 'en_NZ', 'en_PH', 'fil_PH', 'en_SG', 'en_TH', 'th_TH', 'zh_TW', 'en_VN', 'vi_VN'];

function applyCollectionSettings(context) {
    if (context.body?.references) {
        Object.entries(context.body.references).forEach(([key, ref]) => {
            if (ref && ref.type === 'content-fragment') {
                const variant = ref.value?.fields?.variant;
                if (variant?.startsWith('plans')) {
                    applyPlansSettings(ref.value, context);
                }
                if (variant === 'mini') {
                    applyMiniSettings(ref.value, context);
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
        resultText: '{{coll-result-text}}',
        resultsText: '{{coll-results-text}}',
        resultMobileText: '{{coll-result-mobile-text}}',
        resultsMobileText: '{{coll-results-mobile-text}}',
        searchResultText: '{{coll-search-result-text}}',
        searchResultsText: '{{coll-search-results-text}}',
        searchResultMobileText: '{{coll-search-result-mobile-text}}',
        searchResultsMobileText: '{{coll-search-results-mobile-text}}',
        noSearchResultsText: '{{coll-no-search-results-text}}',
        showMoreText: '{{coll-show-more-text}}',
    };
    context.dictionary = {
        ...context?.dictionary,
        'coll-filter': '<span data-placeholder=\\"filter\\"></span>',
        'coll-result-count': '<span data-placeholder=\\"resultCount\\"></span>',
        'coll-search-term': '<span data-placeholder=\\"searchTerm\\"></span>',
    };
}

function applyPlansSettings(fragment, context) {
    const { locale } = context;
    fragment.settings = {};
    if (fragment?.fields?.showSecureLabel !== false) {
        fragment.settings.secureLabel = '{{secure-label}}';
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

function applyMiniSettings(fragment, context) {
    const { locale } = context;
    if (locale === 'en_AU') {
        fragment.settings = {
            displayPlanType: true,
            displayAnnual: true,
        };
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

    if (context.body?.fields?.variant?.startsWith('plans')) {
        applyPlansSettings(context.body, context);
    }

    if (context.body?.fields?.variant === 'mini') {
        applyMiniSettings(context.body, context);
    }

    if (context.body?.model?.id === COLLECTION_MODEL_ID) {
        applyCollectionSettings(context);
    }

    return context;
}

export const transformer = {
    name: 'settings',
    process: settings,
};
export { applyCollectionSettings };
