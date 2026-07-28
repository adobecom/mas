import { fetch, getCountry, getRegionalLocale } from '../utils/common.js';
import { log, logDebug, logError } from '../utils/log.js';

// A M@S element in rich text (inline price, checkout link, …): <... data-wcs-osi="<osi>" ...>.
// Fields hold literal quotes (post-parse); this regex serves substitution, promo-code matching
// and WCS token building.
const MAS_ELEMENT_REGEXP = /<[^>]+data-wcs-osi="(?<osi>[^"]+)"[^>]*>/g;
const PROMOCODE_REGEXP = /data-promotion-code="(?<promotionCode>[^"]+)"/;

/**
 * Substitutes each comma-separated part of an OSI string independently, then rejoins.
 * Discount badges author a comma-joined OSI pair in a single data-wcs-osi attribute;
 * substituting the whole string as one key would always miss (MWPW-201714).
 */
function substituteOsi(osiString, substituteMap) {
    if (!substituteMap) return osiString;
    return osiString
        .split(',')
        .map((part) => substituteMap[part] ?? part)
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
            const promotionCode = element.match(PROMOCODE_REGEXP)?.groups?.promotionCode;
            const osi = substituteMap ? substituteOsi(rawOsi, substituteMap) : rawOsi;
            elements.push({ osi, rawOsi, promotionCode });
            if (osi === rawOsi) return element;
            logDebug(() => `Substituting OSI ${rawOsi} with ${osi}`, context);
            changed = true;
            return element.replace(`data-wcs-osi="${rawOsi}"`, `data-wcs-osi="${osi}"`);
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
    const osis = [].concat(fields.osi ?? []).concat(richTextOsis);
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
 * Single pass over the customized fragment tree. For each fragment it scans the rich text once,
 * and — when customize scoped it to an active promo project (context.promoScopeById) — applies its
 * promo code and substitutes its OSIs in that same pass. Runs after the `replace` transformer, so
 * OSIs injected via placeholder values are covered (MWPW-201862). Returns every final M@S element
 * (osi + inline promo code) the caller needs to build the WCS cache.
 * @returns {{ osi: string, promotionCode?: string }[]}
 */
function applyPromoScope(context) {
    const scopeById = context.promoScopeById ?? {};
    const masElements = [];
    for (const fragment of fragmentsOf(context.body)) {
        const scope = fragment.id != null ? scopeById[fragment.id] : undefined;
        const { fields } = fragment;
        const elements = scanMasElements(fields, scope?.substituteMap, context);
        if (scope && fields) {
            resolvePromoCode(
                fields,
                elements.map((element) => element.rawOsi),
                scope,
                context,
            );
            substituteOwnOsi(fields, scope.substituteMap);
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
    // Single pass over the customized tree: apply each in-scope fragment's promo code + OSI
    // substitution (MWPW-201862, runs after `replace`) and collect every M@S element for the cache.
    const masElements = applyPromoScope(context);

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
            // OSIs and inline promo codes are already final (substituted) from applyPromoScope above.
            if (promotionCode) {
                addToken({ osi, promotionCode });
                return;
            }
            // Bare markup OSIs (no own data-promotion-code, no matching reference) belong to the
            // top-level fragment itself — fall back to its own fields.promoCode (set by applyPromoScope).
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
        const country = getCountry(context);
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

export const transformer = {
    name: 'wcs',
    process: wcs,
};
export { MAS_ELEMENT_REGEXP, substituteOsi, scanMasElements, applyPromoScope };
