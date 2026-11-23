import {
    DICTIONARY_ENTRY_MODEL_ID,
    ROOT_PATH,
    TAG_MERCH_CARD,
    TAG_MERCH_CARD_COLLECTION,
    TAG_MODEL_ID_MAPPING,
} from '../constants.js';
import { showToast, extractLocaleFromPath } from '../utils.js';
import { isGeoTag } from '../editors/variation-utils.js';
import { Fragment } from '../aem/fragment.js';

/** Below this duration, a publish reference check is fast enough to safely offer Proceed. */
export const REFERENCE_CHECK_PROCEED_THRESHOLD_MS = 15000;

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function variationGeoCode(ref) {
    const fragment = new Fragment(ref);
    const pznTags = fragment.getFieldValues('pznTags') || [];
    const codes = pznTags.filter((tag) => isGeoTag(tag)).map((tag) => tag.split('/').pop());
    return codes.length ? codes[0] : undefined;
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

async function findReferences(aem, path, key, excludePath, signal, locale) {
    const modelIds = [
        TAG_MODEL_ID_MAPPING[TAG_MERCH_CARD],
        TAG_MODEL_ID_MAPPING[TAG_MERCH_CARD_COLLECTION],
        DICTIONARY_ENTRY_MODEL_ID,
    ];
    const cursor = await aem.sites.cf.fragments.search(
        { path, modelIds, query: `{{${key}}}`, sort: [{ on: 'modifiedOrCreated', order: 'DESC' }] },
        null,
        signal ? { signal } : undefined,
    );

    let refsFound = 0;
    let page;
    const references = [];
    const seenPaths = new Set();
    while (refsFound < 5) {
        page = await cursor.next();
        if (!page?.value) break;
        for (const item of page.value) {
            if (excludePath && item.path === excludePath) continue;
            if (seenPaths.has(item.path)) continue;
            if (!matchesPlaceholderKey(item, key)) continue;
            if (locale) {
                const language = locale.split('_')[0];
                const pathLocale = extractLocaleFromPath(item.path);
                const pznLocale = variationGeoCode(item);
                const langMatches =
                    pznLocale === language || pznLocale?.startsWith(`${language}_`) || pathLocale.startsWith(`${language}_`);
                if (!langMatches) continue;
            }
            seenPaths.add(item.path);
            references.push(item);
            refsFound++;
        }
    }

    return references;
}

/**
 * Searches the author instance for cards, collections, and placeholders that reference `key`.
 * Publish-side search is not available, so this only reflects the author state (known limitation).
 * @param {import('../aem/aem.js').AEM} aem
 * @param {{ key: string, surface: string, locale: string, excludePath?: string, signal?: AbortSignal }} params
 * @returns {Promise<{ references: object[], durationMs: number, allowProceed: boolean }>}
 */
export async function findPlaceholderReferences(aem, { key, excludePath, signal, surface, locale } = {}) {
    showToast('Searching for references ...');
    const path = surface === 'acom' ? ROOT_PATH : `${ROOT_PATH}/${surface}`;
    const references = await findReferences(aem, path, key, excludePath, signal, locale !== 'en_US' ? locale : null);
    return { references };
}

export async function findPlaceholderReferencesWithTimeout(aem, args) {
    const processAbortController = new AbortController();
    args.signal = processAbortController.signal;
    const startedAt = Date.now();
    const refsPromise = findPlaceholderReferences(aem, args);

    let timeoutId;
    let timedOut = false;
    const timeoutPromise = new Promise((resolve) => {
        timeoutId = setTimeout(() => {
            timedOut = true;
            resolve({ references: [] });
        }, REFERENCE_CHECK_PROCEED_THRESHOLD_MS);
    });

    const promises = [refsPromise];
    if (args.mode === 'publish') promises.push(timeoutPromise);
    const result = await Promise.race(promises);
    clearTimeout(timeoutId);
    result.durationMs = Date.now() - startedAt;
    result.allowProceed = args.mode === 'publish' ? !timedOut : result.references.length === 0;
    if (timedOut) processAbortController.abort();
    return result;
}
