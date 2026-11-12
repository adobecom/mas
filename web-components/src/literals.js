import { Defaults } from './defaults.js';
import { equalsCaseInsensitive } from './utilities.js';

const priceLiterals = window.masPriceLiterals;

// Locales whose literals are not those of their language.
const LITERALS_LANGUAGE = new Map([
    ['id_ID', 'in'],
    ['zh_TW', 'zh-hant'],
    ['zh_HK', 'zh-hant'],
]);

/**
 * Returns the price literals of the settings locale or language,
 * falling back to the default language, from `window.masPriceLiterals`.
 * @param {{ locale?: string, language: string }} settings
 */
export function getPriceLiterals({ locale, language }) {
    if (!Array.isArray(priceLiterals)) return {};
    const find = (lang) =>
        priceLiterals.find((candidate) =>
            equalsCaseInsensitive(candidate.lang, lang),
        );
    const literals =
        find(LITERALS_LANGUAGE.get(locale) ?? language) ??
        find(Defaults.language);
    return literals ? Object.freeze(literals) : {};
}
