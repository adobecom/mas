import { fetch, getCountry, getFragmentId, getRegionalLocale, getRequestInfos, matchesGeo } from '../utils/common.js';
import { odinReferences, odinUrl, REFERENCES } from '../utils/paths.js';
import { createSwrCache } from '../utils/swr-cache.js';
import { log, logDebug, logError } from '../utils/log.js';

// Locale-independent: the offer-mapping index lives at `<surface>/offer-mapping/index` with no locale
// segment (geo scoping is expressed by each entry's `geos`, not by the path).
const OFFER_MAPPING_ID_PATH = 'offer-mapping/index';

// Offer-mapping entries are shared by every request on a surface regardless of country — geo filtering
// happens per request in `resolveOfferSubstituteMap` — so one jittered/SWR entry per surface serves
// the whole fleet and shields Odin from a herd on the shared index (see createSwrCache).
const offerMappingCache = createSwrCache({ name: 'offer-mapping' });

export function clearOfferMappingCache(preview = false) {
    offerMappingCache.clear(preview);
}

async function getOfferMappingId(context, surface) {
    const { preview } = context;
    const url = odinUrl(surface, { fragmentPath: OFFER_MAPPING_ID_PATH, preview });
    const { id, status } = await getFragmentId(context, url, `offer-mapping-id-${surface}`);
    return { id: status === 200 ? id : null, status };
}

// Flattens the index's `entries` (content-fragment refs) into offer-mapping records, reading the index
// fragment's own `entries` list against the direct-hydrated `references` map. Each entry carries a
// sourceOffer, a targetOffer and geos (CQ tag paths).
function collectMappings(fragment, references) {
    const entries = fragment?.fields?.entries || [];
    const mappings = [];
    entries.forEach((entryId) => {
        const fields = references[entryId]?.value?.fields;
        if (fields?.sourceoffer && fields?.targetoffer) {
            mappings.push({
                sourceOffer: fields.sourceoffer,
                targetOffer: fields.targetoffer,
                geos: fields.geos || [],
            });
        }
    });
    return mappings;
}

// One surface's offer-mapping index, fetched `direct-hydrated`. Cached under the surface key. A 404 is
// a STABLE absence (most surfaces author no mapping) so an empty list `[]` is cached to avoid a
// per-request herd on a folder that will never exist; any other non-200 is TRANSIENT and resolves
// `null` (NOT cached, so it retries) — same split as `replace`'s dictionary layers.
async function buildOfferMapping(context) {
    const { surface } = await getRequestInfos(context);
    if (!surface) return [];
    const mappings = await offerMappingCache.get(context, surface, async () => {
        const { id, status } = await getOfferMappingId(context, surface);
        if (!id) return status === 404 ? [] : null;
        const response = await fetch(odinReferences(id, context.preview, REFERENCES.DIRECT), context, 'offer-mapping');
        if (response.status !== 200) return null;
        return collectMappings(response.body, response.body.references || {});
    });
    logDebug(() => `using following offer mappings: ${JSON.stringify(mappings)}`, context);
    return mappings ?? [];
}

// Resolves the surface's mappings to a substitute map keyed by SOURCE osi for this request's geo. Only
// entries whose geos match the request country/region apply — an entry with empty geos never matches
// (matchesGeo returns null), so it is inert by design.
//
// Either side may be slash-joined `<osi>/<promoCode>` (authored via OST); slash (not comma) so a
// multi-OSI value — comma is the discount-badge OSI-pair separator (MWPW-201714) — is never mistaken
// for a promo code.
//   - TARGET promo: applied to the substituted placeholder as `data-promotion-code`.
//   - SOURCE promo: a MATCH CONDITION — the rule fires only on a direct placeholder whose osi AND
//     inline `data-promotion-code` both equal the source (MWPW-203764, see resolveTarget). It is stored
//     under `conditions`; a bare source (no promo) is the unconditional `default` target for that osi.
// The map value per source osi is `{ osi?, promotionCode?, conditions: [{ promotionCode, target }] }`.
function resolveOfferSubstituteMap(mappings, context) {
    const country = getCountry(context);
    const regionLocale = getRegionalLocale(context);
    const substituteMap = {};
    for (const { sourceOffer, targetOffer, geos } of mappings) {
        if (!matchesGeo(geos, { country, regionLocale })) continue;
        const [sourceOsi, sourcePromotionCode] = sourceOffer.split('/').map((part) => part.trim());
        const [osi, promotionCode] = targetOffer.split('/').map((part) => part.trim());
        const entry = (substituteMap[sourceOsi] ??= { conditions: [] });
        if (sourcePromotionCode) {
            entry.conditions.push({ promotionCode: sourcePromotionCode, target: { osi, promotionCode } });
        } else {
            entry.osi = osi;
            entry.promotionCode = promotionCode;
        }
        logDebug(() => `[offer-mapping] ${sourceOffer} -> ${targetOffer} for ${country}`, context);
    }
    return substituteMap;
}

// Picks the target for a source-osi entry given the placeholder's inline promo code (undefined for a
// fragment's own osi — those carry no inline promo, so only the unconditional `default` applies). A
// source-promo condition wins over the bare default when the placeholder's promo matches it
// (precedence: most-specific first). `viaCondition` tells the caller the match keyed off the promo, so
// its target promo may override an existing one — whereas a bare rule's target promo must not, since an
// authored promo always wins. Project-scope overlays carry no `conditions`, hence the optional chain.
function resolveTarget(entry, elementPromo) {
    if (!entry) return undefined;
    if (elementPromo) {
        const condition = entry.conditions?.find((candidate) => candidate.promotionCode === elementPromo);
        if (condition) return { ...condition.target, viaCondition: true };
    }
    if (entry.osi != null) return { osi: entry.osi, promotionCode: entry.promotionCode, viaCondition: false };
    return undefined;
}

// A M@S element in rich text (inline price, checkout link, …): <... data-wcs-osi="<osi>" ...>.
// Fields hold literal quotes (post-parse); this regex serves substitution, promo-code matching
// and WCS token building.
const MAS_ELEMENT_REGEXP = /<[^>]+data-wcs-osi="(?<osi>[^"]+)"[^>]*>/g;
const PROMOCODE_REGEXP = /data-promotion-code="(?<promotionCode>[^"]+)"/;

/**
 * Substitutes each comma-separated part of an OSI string independently, then rejoins.
 * Discount badges author a comma-joined OSI pair in a single data-wcs-osi attribute;
 * substituting the whole string as one key would always miss (MWPW-201714).
 * `elementPromo` is the placeholder's inline promo code (if any); it selects a source-promo
 * conditioned rule over the bare default (see resolveTarget). Omitted for a fragment's own osi.
 */
function substituteOsi(osiString, substituteMap, elementPromo) {
    if (!substituteMap) return osiString;
    return osiString
        .split(',')
        .map((part) => resolveTarget(substituteMap[part], elementPromo)?.osi ?? part)
        .join(',');
}

/**
 * Yields the root fragment, then each referenced fragment. customize flattens the whole tree into
 * body.references (a flat id -> fragment map of all descendants), so root + references covers every
 * fragment here — there is no nested reference tree left to recurse into.
 */
function* fragmentsOf(body) {
    if (body) yield body;
    for (const ref of Object.values(body?.references ?? {})) {
        if (ref?.value) yield ref.value;
    }
}

/**
 * Scans a fragment's rich text fields once, returning every M@S element it references (osi plus
 * any inline promotion code). When a substituteMap is given, rewrites substituted OSIs in the same
 * pass and reports the final osi; the original osi is kept too, so promo code matching can look it
 * up in the project map. Headless fragments price against inline OSIs that differ from their own
 * osi field, so those must participate as well (MWPW-201713).
 * @returns {{ osi: string, rawOsi: string, promotionCode?: string }[]}
 */
function scanMasElements(fields, substituteMap, context) {
    const elements = [];
    if (!fields) return elements;
    for (const [key, field] of Object.entries(fields)) {
        if (key === 'osi') continue;
        // text/html fields arrive as { mimeType, value } objects (odinSchemaTransform).
        const value = typeof field === 'string' ? field : field?.value;
        if (typeof value !== 'string' || !value.includes('data-wcs-osi')) continue;
        let changed = false;
        const rewritten = value.replace(MAS_ELEMENT_REGEXP, (element, rawOsi) => {
            const isLocked = element.includes('data-locked-osi="true"');
            const existingPromo = element.match(PROMOCODE_REGEXP)?.groups?.promotionCode;
            const osi = substituteMap && !isLocked ? substituteOsi(rawOsi, substituteMap, existingPromo) : rawOsi;
            // A mapping whose target carries a promo code (`<osi>/<promoCode>`) applies it to this
            // substituted placeholder as data-promotion-code (MWPW-203764). rawOsi may be a comma-joined
            // pair (discount badges, MWPW-201714), so match each half. A source-promo conditioned rule
            // (viaCondition — it only matched because the element already carries that promo) may
            // override the existing promo; a bare rule's target promo applies only when the element has
            // none of its own, since an authored promo always wins.
            let injectedPromo;
            if (substituteMap && !isLocked) {
                for (const part of rawOsi.split(',')) {
                    const target = resolveTarget(substituteMap[part], existingPromo);
                    if (!target?.promotionCode) continue;
                    if (target.viaCondition || !existingPromo) {
                        injectedPromo = target.promotionCode;
                        break;
                    }
                }
            }
            const promotionCode = injectedPromo ?? existingPromo;
            elements.push({ osi, rawOsi, promotionCode });
            let updated = element;
            if (osi !== rawOsi) updated = updated.replace(`data-wcs-osi="${rawOsi}"`, `data-wcs-osi="${osi}"`);
            if (injectedPromo && injectedPromo !== existingPromo) {
                // Overriding an element's own promo (conditioned match) replaces its attribute in place;
                // adding one to a promo-free element inserts it right after data-wcs-osi.
                updated = existingPromo
                    ? updated.replace(/data-promotion-code="[^"]*"/, `data-promotion-code="${injectedPromo}"`)
                    : updated.replace(/data-wcs-osi="[^"]*"/, (match) => `${match} data-promotion-code="${injectedPromo}"`);
            }
            if (updated === element) return element;
            logDebug(
                () => `Substituting OSI ${rawOsi} with ${osi}${injectedPromo ? ` (promo ${injectedPromo})` : ''}`,
                context,
            );
            changed = true;
            return updated;
        });
        if (changed) fields[key] = typeof field === 'string' ? rewritten : { ...field, value: rewritten };
    }
    return elements;
}

/**
 * Sets a fragment's promoCode from its promo project scope. The fragment's own osi has priority,
 * then any OSIs referenced in its rich text; an explicit osi entry (directly or via the project's
 * osi substitution) wins over the project wildcard ('*'). `richTextOsis` are the original
 * (pre-substitution) OSIs collected by scanMasElements.
 */
function resolvePromoCode(fields, richTextOsis, { promoMap, substituteMap }, context) {
    // No osi (own or referenced in rich text) => nothing priceable, so no promo code (not even wildcard).
    // Each entry may itself be a comma-joined OSI pair (discount badges, MWPW-201714) — split before matching.
    const osis = []
        .concat(fields.osi ?? [])
        .concat(richTextOsis)
        .flatMap((osi) => osi.split(','));
    if (!osis.length) return;
    let explicitPromoCode;
    for (const osi of osis) {
        if (promoMap[osi]) {
            explicitPromoCode = promoMap[osi];
            break;
        }
        const substituted = substituteMap?.[osi];
        if (substituted && promoMap[substituted]) {
            explicitPromoCode = promoMap[substituted];
            logDebug(() => `osi ${osi} substituted by ${substituted} matched promoCode ${explicitPromoCode}`, context);
            break;
        }
    }
    const promoCode = explicitPromoCode ?? promoMap['*'];
    if (promoCode) {
        logDebug(() => `Setting promoCode ${promoCode} on fragment osi ${fields.osi}`, context);
        fields.promoCode = promoCode;
    }
}

/** Substitutes a fragment's own osi field (string or array), scoped to its promo project map. */
function substituteOwnOsi(fields, substituteMap) {
    if (fields.osi == null) return;
    fields.osi = Array.isArray(fields.osi)
        ? fields.osi.map((osi) => substituteOsi(osi, substituteMap))
        : substituteOsi(fields.osi, substituteMap);
}

/**
 * Single pass over the customized fragment tree. For each fragment it scans the rich text once and
 * substitutes OSIs from the effective map — the surface-wide, geo-scoped offer-mapping fallback
 * (`offerMap`, MWPW-203764) overlaid by any active promo project's own substitutions
 * (`context.promoScopeById`, which win). When a fragment is promo-scoped its promo code is applied in
 * the same pass. Runs after the `replace` transformer, so OSIs injected via placeholder values are
 * covered (MWPW-201862). Returns every final M@S element (osi + inline promo code) the caller needs to
 * build the WCS cache.
 * @returns {{ osi: string, promotionCode?: string }[]}
 */
function updateOffers(context, offerMap = {}) {
    const scopeById = context.promoScopeById ?? {};
    const masElements = [];
    for (const fragment of fragmentsOf(context.body)) {
        const scope = fragment.id != null ? scopeById[fragment.id] : undefined;
        const { fields } = fragment;
        // Offer-mapping (`{ osi, promotionCode }` values) is the surface-level, geo-scoped fallback; a
        // promo project's own substitutions (plain osi strings) win — normalize them into the same
        // `{ osi }` shape and overlay. Overriding a source also drops its offer-mapping promo, since the
        // normalized scope entry carries no promotionCode (MWPW-203764).
        const substituteMap = { ...offerMap };
        for (const [source, osi] of Object.entries(scope?.substituteMap ?? {})) {
            substituteMap[source] = { osi };
        }
        const hasSubstitutions = Object.keys(substituteMap).length > 0;
        const elements = scanMasElements(fields, hasSubstitutions ? substituteMap : undefined, context);
        if (scope && fields) {
            // Promo code matching keys off the promo project's own (string) map only.
            resolvePromoCode(
                fields,
                elements.map((element) => element.rawOsi),
                scope,
                context,
            );
        }
        if (fields && hasSubstitutions) {
            substituteOwnOsi(fields, substituteMap);
        }
        for (const { osi, promotionCode } of elements) masElements.push({ osi, promotionCode });
    }
    return masElements;
}

async function fetchArtifact(osi, promotionCode, wcsContext, idx) {
    const url = new URL(wcsContext.wcsURL);
    url.searchParams.set('country', wcsContext.country);
    url.searchParams.set('locale', wcsContext.locale);
    url.searchParams.set('landscape', wcsContext.landscape);
    url.searchParams.set('api_key', wcsContext.context.api_key);
    if (wcsContext.language) {
        url.searchParams.set('language', wcsContext.language);
    }
    url.searchParams.set('offer_selector_ids', osi);
    if (promotionCode) {
        url.searchParams.set('promotion_code', promotionCode);
    }
    const response = await fetch(url.toString(), wcsContext.context, `wcs-req-${idx}`);
    if (response.status === 200) {
        return response.body;
    }
    return null;
}

async function computeCache(tokens, wcsContext) {
    const cache = {};
    let idx = 0;
    const promises = tokens.map(
        ({ osi, promotionCode }) =>
            new Promise(async (resolve, reject) => {
                const response = await fetchArtifact(osi, promotionCode, wcsContext, idx++);
                if (response) {
                    const { resolvedOffers } = response;
                    const cacheKey = [
                        osi,
                        wcsContext.country.toLowerCase(),
                        wcsContext.language?.toLowerCase(),
                        promotionCode?.toLowerCase(),
                    ]
                        .filter((val) => val)
                        .join('-');
                    resolve({
                        cacheKey,
                        resolvedOffers,
                    });
                } else {
                    reject('failed wcs request');
                }
            }),
    );
    const responses = await Promise.allSettled(promises);
    responses.forEach((response) => {
        if (response.status === 'fulfilled') {
            const { cacheKey, resolvedOffers } = response.value;
            cache[cacheKey] = resolvedOffers;
        }
    });
    return cache;
}

async function wcs(context) {
    // Prefer the offer-mapping prefetched in `init` (parallel with the other transformer inits);
    // fall back to a lazy build when the pipeline ran without inits (e.g. unit tests).
    const mappings = (await context.promises?.wcs) ?? (await buildOfferMapping(context));
    const offerMap = resolveOfferSubstituteMap(mappings, context);
    // Single pass over the customized tree: apply the offer-mapping fallback + each in-scope fragment's
    // promo code and OSI substitution (MWPW-201862, runs after `replace`) and collect every M@S
    // element for the cache.
    const masElements = updateOffers(context, offerMap);

    const wcsConfigs = context.wcsConfiguration;
    if (!wcsConfigs || wcsConfigs.length === 0) {
        log('No WCS configurations available', context);
        return context;
    }
    if (masElements.length > 0) {
        // Promo codes applied to referenced cards live on each card's fields.promoCode (keyed by its base osi),
        // not in the price HTML nor on the collection root. Build a base-osi -> promoCode lookup to fill the cache
        // with the right promotion_code for each card's offer. The same osi may be used by several cards with
        // different promo treatments (e.g. one with a promo, one without), so also track osis used without a promo
        // to fill their plain (no promo) entry too.
        const promoCodeByOsi = {};
        const noPromoOsis = new Set();
        for (const ref of Object.values(context.body.references ?? {})) {
            const fields = ref?.value?.fields;
            if (!fields?.osi) continue;
            const { osi } = fields;
            if (fields.promoCode) {
                promoCodeByOsi[osi] = fields.promoCode;
            } else {
                noPromoOsis.add(osi);
            }
        }
        const tokenMap = new Map();
        const tokenKey = ({ osi, promotionCode }) => `${osi}-${promotionCode || ''}`;
        const addToken = (token) => {
            const key = tokenKey(token);
            if (!tokenMap.has(key)) tokenMap.set(key, token);
        };
        masElements.forEach(({ osi, promotionCode }) => {
            // OSIs and inline promo codes are already final (substituted) from updateOffers above.
            if (promotionCode) {
                addToken({ osi, promotionCode });
                return;
            }
            // Bare markup OSIs (no own data-promotion-code, no matching reference) belong to the
            // top-level fragment itself — fall back to its own fields.promoCode (set by updateOffers).
            const promoCode = promoCodeByOsi[osi] ?? context.body.fields?.promoCode;
            if (promoCode) addToken({ osi, promotionCode: promoCode });
            // Cache the plain (no promo) offer when no card promotes this osi, or when a card shares
            // this osi without a promo of its own (mixed case) — otherwise that card would miss the cache.
            if (!promoCode || noPromoOsis.has(osi)) addToken({ osi });
        });

        if (context.body.fields?.osi) {
            const token = {
                osi: context.body.fields.osi,
                promotionCode: context.body.fields.promoCode,
            };
            tokenMap.set(tokenKey(token), token);
        }

        // Convert Map values back to array
        const tokens = Array.from(tokenMap.values());
        const country = context.wcsCountry ?? getCountry(context);
        const wcsContext = {
            locale: getRegionalLocale(context),
            country,
            context,
        };
        context.body.wcs ??= {};
        for (const config of wcsConfigs) {
            wcsContext.wcsURL = config.wcsURL;
            wcsContext.landscape = config.landscape || 'PUBLISHED';
            if (country !== 'GB') wcsContext.language = 'MULT';
            context.body.wcs ??= {};
            try {
                context.body.wcs[config.env] = await computeCache(tokens, wcsContext);
                /* c8 ignore next 3*/
            } catch (error) {
                logError(`Error computing WCS cache for ${config.env}: ${error.message}`, context);
            }
        }
    } else {
        log('No WCS placeholders found in fragment content', context);
    }
    return context;
}

async function init(context) {
    return buildOfferMapping(context);
}

export const transformer = {
    name: 'wcs',
    process: wcs,
    init,
};
export {
    MAS_ELEMENT_REGEXP,
    substituteOsi,
    resolveTarget,
    scanMasElements,
    updateOffers,
    buildOfferMapping,
    resolveOfferSubstituteMap,
};
