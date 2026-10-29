import { PAGE_NAMES } from '../constants.js';

/** Independently gate live investigations while the existing assistant and authoring flows remain available. */
export function isMasaInvestigationEnabled(documentRoot = document) {
    return documentRoot.querySelector('meta[name="mas-investigations-enabled"]')?.content === 'true';
}

/** Reads the independently configured Studio feature rollout flags. */
export function getStudioFeatures(documentRoot = document) {
    return {
        assistant: documentRoot.querySelector('meta[name="mas-assistant-enabled"]')?.content === 'true',
        offers: documentRoot.querySelector('meta[name="mas-offers-enabled"]')?.content === 'true',
    };
}

/** Allows existing pages independently of optional feature availability. */
export function isFeaturePageEnabled(page, features = getStudioFeatures()) {
    if (page === PAGE_NAMES.AI_ASSISTANT) return features.assistant;
    if (page === PAGE_NAMES.PRODUCT_CATALOG || page === PAGE_NAMES.PRODUCT_DETAIL) return features.offers;
    return true;
}
