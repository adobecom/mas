const COLLECTION_MODEL_ID =
    'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL2NvbGxlY3Rpb24';

function applyCollectionSettings(context) {
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

function applyPlansSettings(fragment, locale) {
    fragment.settings = {
        stockCheckboxLabel: '{{stock-checkbox-label}}',
        stockOfferOsis: '',
    };
    if (fragment?.fields?.showSecureLabel !== false) {
        fragment.settings.secureLabel = '{{secure-label}}';
    }
    if (fragment?.fields?.showPlanType != null) {
        fragment.settings.displayPlanType = fragment?.fields?.showPlanType;
    }
    if (locale === 'en_US') {
        fragment.settings.displayPlanType ??= true;
    }
}

async function settings(context) {
    const { locale } = context;
    if (context.body?.fields?.variant?.startsWith('plans')) {
        applyPlansSettings(context.body, locale);
    }

    if (context.body?.model?.id === COLLECTION_MODEL_ID) {
        applyCollectionSettings(context);
    }

    if (context.body?.references) {
        Object.entries(context.body.references).forEach(([key, ref]) => {
            if (
                ref &&
                ref.type === 'content-fragment' &&
                ref.value?.fields?.variant?.startsWith('plans')
            ) {
                applyPlansSettings(ref.value, locale);
            }
        });
    }
    return context;
}

exports.settings = settings;
