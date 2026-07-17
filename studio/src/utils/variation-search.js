import { Fragment } from '../aem/fragment.js';
import { getDefaultLocaleCode } from '../../../io/www/src/fragment/locales.js';
import {
    getPromoNameFromPromoVariationPath,
    isPromoVariationPath,
    resolveDefaultPathFromPromoVariation,
} from '../promotions/promotion-model.js';
import { extractLocaleFromPath, extractSurfaceFromPath } from '../utils.js';

/** Tab keys for variation search UI. */
export const VARIATION_SEARCH_TABS = {
    LOCALE: 'locale',
    PROMOTION: 'promotion',
    GROUPED: 'grouped',
};

/**
 * Classifies a DAM path as a variation and returns the matching search tab.
 * @param {string} path
 * @returns {{ isVariation: boolean, tab: string|null }}
 */
export function classifyVariationByPath(path) {
    if (!path) return { isVariation: false, tab: null };
    if (Fragment.isGroupedVariationPath(path)) {
        return { isVariation: true, tab: VARIATION_SEARCH_TABS.GROUPED };
    }
    if (isPromoVariationPath(path)) {
        return { isVariation: true, tab: VARIATION_SEARCH_TABS.PROMOTION };
    }
    const localeCode = extractLocaleFromPath(path);
    const surface = extractSurfaceFromPath(path);
    if (localeCode && surface) {
        const defaultLocale = getDefaultLocaleCode(surface, localeCode);
        if (defaultLocale && defaultLocale !== localeCode) {
            return { isVariation: true, tab: VARIATION_SEARCH_TABS.LOCALE };
        }
    }
    return { isVariation: false, tab: null };
}

/**
 * Resolves the default-locale parent path for a regional locale variation.
 * @param {string} path
 * @returns {string|null}
 */
export function resolveLocaleVariationParentPath(path) {
    if (!path) return null;
    const localeCode = extractLocaleFromPath(path);
    const surface = extractSurfaceFromPath(path);
    if (!localeCode || !surface) return null;
    const defaultLocale = getDefaultLocaleCode(surface, localeCode);
    if (!defaultLocale || defaultLocale === localeCode) return null;
    return path.replace(`/${localeCode}/`, `/${defaultLocale}/`);
}

/**
 * Returns all candidate parent paths for a promo variation, ordered most-likely-first.
 * The caller should try each in turn and fall back to the next on a missing fragment.
 * @param {string} path
 * @returns {string[]}
 */
export function resolvePromoVariationParentPath(path) {
    if (!path) return [];
    const promoName = getPromoNameFromPromoVariationPath(path);
    if (!promoName) return [];
    return resolveDefaultPathFromPromoVariation(path, promoName);
}
