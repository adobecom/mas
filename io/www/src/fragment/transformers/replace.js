import { odinReferences, odinUrl, REFERENCES } from '../utils/paths.js';
import { fetch, getCountry, getFragmentId, getRegionalLocale, getRequestInfos } from '../utils/common.js';
import { getPlaceholdersBaselineSurface, getPlaceholdersRegionLocale } from '../locales.js';
import { createSwrCache } from '../utils/swr-cache.js';
import { log, logDebug, logError } from '../utils/log.js';

const DICTIONARY_ID_PATH = 'dictionary/index';
const PH_REGEXP = /{{(\s*([\w\-\_]+)\s*)}}/gi;

const TRANSFORMER_NAME = 'replace';

// Each dictionary layer (base or region, per surface+locale) is cached with jittered TTL,
// single-flight refills, and stale-while-revalidate. The shared `acom/<baseLocale>` global
// baseline is read by every placeholder request across every surface, so a synchronized
// expiry would herd the whole fleet onto one `direct-hydrated` Odin fetch — see createSwrCache.
const dictionaryCache = createSwrCache({ name: 'dictionary' });

export function clearDictionaryCache(preview = false) {
    dictionaryCache.clear(preview);
}

async function getDictionaryId(context, surface, locale) {
    const { preview } = context;
    const dictionaryUrl = odinUrl(surface, { locale, fragmentPath: DICTIONARY_ID_PATH, preview });
    const { id, status } = await getFragmentId(context, dictionaryUrl, `dictionary-id-${surface}-${locale}`);
    return status == 200 ? id : null;
}

function extractValue(ref) {
    const value = ref.value || ref.richTextValue?.value || '';
    // Escape control characters and double quotes before parsing
    return value.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').replace(/"/g, '\\"');
}

// Flattens a single `direct-hydrated` fragment response into `dictionary`: its own entries first
// (first-writer-wins, so a level already collected is not overwritten), then a sweep of the response
// references for any keyed entry not listed in `entries`. The shallow parent carries no `key`, so the
// sweep only ever picks up this level's own entries.
function collectEntries(fragment, references, dictionary) {
    const entries = fragment?.fields?.entries || [];
    //we just test truthy keys as we can have empty placeholders (treated different from absent ones)
    entries.forEach((entryId) => {
        const entry = references[entryId]?.value?.fields;
        if (entry?.key && !(entry.key in dictionary)) {
            dictionary[entry.key] = extractValue(entry);
        }
    });
    Object.keys(references).forEach((refId) => {
        const ref = references[refId]?.value?.fields;
        if (ref?.key && !(ref.key in dictionary)) {
            dictionary[ref.key] = extractValue(ref);
        }
    });
}

// One dictionary layer: the entries of a single `(surface, locale)` index, fetched `direct-hydrated`
// (its content `parent` is intentionally ignored — inheritance is expressed by the layering in
// `getDictionary`, not by walking parents). Cached under `${prefix}-${surface}-${locale}`; the loader
// resolves `null` on an absent index or failed fetch so a miss is never cached (see createSwrCache),
// and the caller substitutes an empty layer.
async function buildDictionaryLayer(context, surface, locale, prefix) {
    const layer = await dictionaryCache.get(context, `${prefix}-${surface}-${locale}`, async () => {
        const id = await getDictionaryId(context, surface, locale);
        if (!id) return null;
        const response = await fetch(odinReferences(id, context.preview, REFERENCES.DIRECT), context, `dictionary-${prefix}`);
        if (response.status != 200) return null;
        const dictionary = {};
        collectEntries(response.body, response.body.references || {}, dictionary);
        return dictionary;
    });
    return layer ?? {};
}

export async function getDictionary(context) {
    /* c8 ignore next 1 */
    if (context.hasExternalDictionary) return context.dictionary;
    const { surface } = await getRequestInfos(context);
    if (!surface) return context.dictionary || {};
    const baselineSurface = getPlaceholdersBaselineSurface();
    // Base = the request's own default locale (en_US page → en_US, en_GB page → en_GB). Region reaches
    // en_IN/en_AU by country even from an en_US request, without moving the shared regionLocale.
    const baseLocale = context.defaultLocale;
    const regionLocale = getPlaceholdersRegionLocale(surface, baseLocale, getCountry(context), getRegionalLocale(context));

    // Three layers, lowest → highest priority: the global baseline (shared, cache-friendly), the current
    // surface's baseline-language dictionary, and the region overlay. Layers that would duplicate a
    // lower one are skipped: the surface baseline when the request is already on the baseline surface,
    // the region overlay when the region is the baseline language itself.
    const globalBaseline = await buildDictionaryLayer(context, baselineSurface, baseLocale, 'base');
    const surfaceBaseline = surface === baselineSurface ? {} : await buildDictionaryLayer(context, surface, baseLocale, 'base');
    const regionOverlay =
        regionLocale === baseLocale ? {} : await buildDictionaryLayer(context, surface, regionLocale, 'region');

    logDebug(() => {
        const inherited = { ...globalBaseline, ...surfaceBaseline };
        const duplicates = Object.keys(regionOverlay).filter(
            (key) => key in inherited && inherited[key] === regionOverlay[key],
        );
        return `[replace] ${surface}/${regionLocale} placeholders duplicating baseline ${baseLocale}: ${duplicates.join(', ')}`;
    }, context);

    // Higher-priority layers win; an externally seeded context.dictionary wins over all.
    return { ...globalBaseline, ...surfaceBaseline, ...regionOverlay, ...context.dictionary };
}

function replaceValues(input, dictionary, calls) {
    const placeholders = input.matchAll(PH_REGEXP);
    let replaced = '';
    let nextIndex = 0;
    for (const match of placeholders) {
        //match without {{ }}
        const key = match[1];
        //we concatenate everything from last iteration to index of placeholder
        replaced = replaced + input.slice(nextIndex, match.index);
        //value will be key in case of undefined or circular reference
        let value = dictionary[key] == undefined || calls.includes(key) ? key : dictionary[key];
        if (value?.match(PH_REGEXP)) {
            //the value has nested PH
            calls.push(key);
            value = replaceValues(value, dictionary, calls);
            calls.pop();
        }
        //we concatenate value
        replaced = replaced + value;
        //and update index for next iteration
        nextIndex = match.index + match[0].length;
    }
    replaced = replaced + input.slice(nextIndex);
    return replaced;
}

async function init(context) {
    // Dictionary resolution needs the regional/default locales resolved by `defaultLanguage` (e.g. fr_BE
    // when locale=fr_FR + country=BE): the region overlay keys off `regionLocale`, the base off the
    // request's `defaultLocale` (with region flag) — see `getDictionary`. Merge that result into context.
    const fetchResult = await context?.promises?.defaultLanguage;
    // If defaultLanguage is missing or non-200 (e.g. fragment not found), skip dictionary fetch entirely.
    if (fetchResult?.status !== 200) return null;
    const merged = { ...context, ...fetchResult };
    return await getDictionary(merged);
}

async function replace(context) {
    let body = context.body;
    let bodyString = JSON.stringify(body);
    if (bodyString.match(PH_REGEXP)) {
        let dictionary = await context?.promises?.[TRANSFORMER_NAME];
        if (dictionary) {
            //we need to merge init dictionary with the one initiated in context
            dictionary = { ...dictionary, ...context.dictionary };
        } else {
            dictionary = await getDictionary(context);
        }
        if (dictionary && Object.keys(dictionary).length > 0) {
            bodyString = replaceValues(bodyString, dictionary, []);
            try {
                body = JSON.parse(bodyString);
                /* c8 ignore next 4 */
            } catch (e) {
                logError(`[replace] ${e.message}`, context);
                logDebug(() => `[replace] invalid json: ${bodyString}`, context);
            }
        }
    } else {
        log('no placeholders found in fragment content', context);
    }
    return {
        ...context,
        status: 200,
        body,
    };
}
export const transformer = {
    name: TRANSFORMER_NAME,
    process: replace,
    init,
};
