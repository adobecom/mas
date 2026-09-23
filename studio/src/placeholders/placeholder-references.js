import { getDefaultLocaleCode } from '../../../io/www/src/fragment/locales.js';
import {
    DICTIONARY_ENTRY_MODEL_ID,
    ROOT_PATH,
    SURFACES,
    TAG_MERCH_CARD,
    TAG_MERCH_CARD_COLLECTION,
    TAG_MODEL_ID_MAPPING,
} from '../constants.js';

/** Below this duration, a publish reference check is fast enough to safely offer Proceed. */
export const REFERENCE_CHECK_PROCEED_THRESHOLD_MS = 15000;

/**
 * Same-surface + ACOM fallback paths to search for placeholder references, mirroring the
 * fallback convention `ensureDictionaryIndex` uses for the dictionary index chain.
 * @param {{ surface: string, locale: string }} params
 * @returns {string[]}
 */
export function buildPlaceholderReferenceScopes({ surface, locale }) {
    if (!surface || !locale) return [];
    const scopes = [`${ROOT_PATH}/${surface}/${locale}`];
    if (surface !== SURFACES.ACOM.name) {
        const fallbackLocale = getDefaultLocaleCode(surface, locale) ?? locale;
        const acomScope = `${ROOT_PATH}/${SURFACES.ACOM.name}/${fallbackLocale}`;
        if (!scopes.includes(acomScope)) scopes.push(acomScope);
    }
    return scopes;
}

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Whether any string field value of `fragmentLike` contains the `{{key}}` token
 * (tolerating inner whitespace, e.g. `{{ key }}`). AEM's fullText search is only used to
 * narrow candidates; this exact match is what avoids false positives from partial-token hits.
 * @param {{ fields?: Array<{ values?: unknown[] }> }} fragmentLike
 * @param {string} key
 * @returns {boolean}
 */
export function matchesPlaceholderKey(fragmentLike, key) {
    if (!key) return false;
    const pattern = new RegExp(`\\{\\{\\s*${escapeRegExp(key)}\\s*\\}\\}`, 'i');
    return (fragmentLike?.fields || []).some((field) =>
        (field.values || []).some((value) => typeof value === 'string' && pattern.test(value)),
    );
}

/**
 * Searches the author instance for cards, collections, and placeholders that reference `key`,
 * scoped to the same surface and its ACOM fallback. Publish-side search is not available, so
 * this only reflects the author state (known limitation).
 * @param {import('../aem/aem.js').AEM} aem
 * @param {{ key: string, surface: string, locale: string, excludePath?: string, signal?: AbortSignal }} params
 * @returns {Promise<{ references: object[], durationMs: number, allowProceed: boolean }>}
 */
export async function findPlaceholderReferences(aem, { key, surface, locale, excludePath, signal } = {}) {
    const startedAt = Date.now();
    const scopes = buildPlaceholderReferenceScopes({ surface, locale });
    const modelIds = [
        TAG_MODEL_ID_MAPPING[TAG_MERCH_CARD],
        TAG_MODEL_ID_MAPPING[TAG_MERCH_CARD_COLLECTION],
        DICTIONARY_ENTRY_MODEL_ID,
    ];
    const references = [];
    const seenPaths = new Set();

    for (const path of scopes) {
        const cursor = await aem.sites.cf.fragments.search(
            { path, modelIds, query: key, sort: [{ on: 'modifiedOrCreated', order: 'DESC' }] },
            null,
            signal ? { signal } : undefined,
        );
        for await (const page of cursor) {
            for await (const item of page) {
                if (excludePath && item.path === excludePath) continue;
                if (seenPaths.has(item.path)) continue;
                if (!matchesPlaceholderKey(item, key)) continue;
                seenPaths.add(item.path);
                references.push(item);
            }
        }
    }

    const durationMs = Date.now() - startedAt;
    return { references, durationMs, allowProceed: durationMs < REFERENCE_CHECK_PROCEED_THRESHOLD_MS };
}
