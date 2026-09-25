import {
    buildBulkPublishProjectDeepLink,
    buildCardsDeepLink,
    buildPromoProjectDeepLink,
    buildTranslationProjectDeepLink,
    extractLocaleFromPath,
    extractSurfaceFromPath,
} from '../utils.js';
import {
    BULK_PUBLISH_PROJECT_MODEL_PATH,
    BULK_PUBLISH_PROJECTS_FOLDER,
    CARD_MODEL_PATH,
    COLLECTION_MODEL_PATH,
    PATH_TOKENS,
    PROMOTION_MODEL_PATH,
    PROMOTIONS_PATH_PREFIX,
    TRANSLATION_PROJECT_MODEL_PATH,
} from '../constants.js';
import { Fragment } from '../aem/fragment.js';
import { getDefaultLocaleCode } from '../locales.js';
import { findPromotionProjectIdByTag, getPromotionTagFromFragment } from '../promotions/promotion-model.js';

/**
 * Verified cap for the GET-by-id `referencedBy` endpoint. `limit=99` is rejected with a 400;
 * 50 and below is accepted. The spec's "no maximum" claim is not to be trusted.
 */
export const REFERENCED_BY_PAGE_LIMIT = 50;

const MAS_CONTENT_ROOT = '/content/dam/mas';

/**
 * Parses a fragment path into its surface / locale / collection-relative segments in a single
 * `PATH_TOKENS` exec. The named groups give `surface` and `parsedLocale` directly, plus the greedy
 * `fragmentPath` capture that `extractSurfaceFromPath` / `extractLocaleFromPath` do not expose — so
 * this is one regex run rather than three for the same result.
 *
 * `PATH_TOKENS` is unanchored and mis-parses a handful of real tenant folders — most notably
 * `.../bulk-publish-projects/<name>`, whose folder segment gets captured as `parsedLocale`. That
 * bogus locale is suppressed here (set to `null`) rather than left to leak into the UI as a chip.
 *
 * @param {string} path
 * @returns {{ surface: string, parsedLocale: string|null, fragmentPath: string }|null}
 */
export function parsePathTokens(path) {
    const match = PATH_TOKENS.exec(path);
    if (!match?.groups) return null;
    const rawLocale = match.groups.parsedLocale;
    const parsedLocale = rawLocale === BULK_PUBLISH_PROJECTS_FOLDER ? null : rawLocale;
    return { surface: match.groups.surface, parsedLocale, fragmentPath: match.groups.fragmentPath };
}

/**
 * Excludes `pzn` grouped-variation parents (variations of a card, not collections).
 *
 * @param {string} path
 * @returns {boolean}
 */
export function isGroupedVariationReference(path) {
    return Fragment.isGroupedVariationPath(path);
}

/**
 * Excludes promo-variation parents, mirroring the `promotions/` path-prefix check used by
 * `promotion-model.js`.
 *
 * @param {string} fragmentPath the collection-relative segment produced by `parsePathTokens`
 * @returns {boolean}
 */
export function isPromoVariationReference(fragmentPath) {
    return fragmentPath.startsWith(PROMOTIONS_PATH_PREFIX);
}

/**
 * Excludes a reference that is simply a locale-variation of the fragment currently open — that
 * relationship is already expressed by the "Derived from" row, so it does not belong in this list.
 *
 * @param {string} refSurface
 * @param {string} refFragmentPath
 * @param {string} surface surface of the fragment currently open in the editor
 * @param {string} fragmentPath collection-relative segment of the fragment currently open
 * @returns {boolean}
 */
export function isSelfLocaleVariationReference(refSurface, refFragmentPath, surface, fragmentPath) {
    return Boolean(refSurface) && Boolean(surface) && refSurface === surface && refFragmentPath === fragmentPath;
}

/**
 * Excludes cross-surface clones (e.g. a `sandbox` variation showing up as a parent of a `nala`
 * card). This is the real false-positive vector the endpoint has today.
 *
 * @param {string} path
 * @param {string} surface surface of the fragment currently open in the editor
 * @returns {boolean}
 */
export function isCrossSurfaceReference(path, surface) {
    if (!surface) return false;
    return !path.startsWith(`${MAS_CONTENT_ROOT}/${surface}/`);
}

/**
 * Runs all four exclusion predicates against a single `referencedBy` item, relative to the
 * fragment currently open in the editor. Promotion projects skip them: they are stored globally
 * under `/content/dam/mas/promotions`, so every surface-based check would drop them.
 *
 * @param {Object} reference raw `referencedBy` item
 * @param {{ surface: string, parsedLocale: string|null, fragmentPath: string }} openFragmentTokens
 * @returns {boolean}
 */
export function isExcludedReference(reference, openFragmentTokens) {
    if (reference.model?.path === PROMOTION_MODEL_PATH) return false;
    if (isGroupedVariationReference(reference.path)) return true;
    if (isCrossSurfaceReference(reference.path, openFragmentTokens.surface)) return true;
    const tokens = parsePathTokens(reference.path);
    if (!tokens) return false;
    if (isPromoVariationReference(tokens.fragmentPath)) return true;
    return isSelfLocaleVariationReference(
        tokens.surface,
        tokens.fragmentPath,
        openFragmentTokens.surface,
        openFragmentTokens.fragmentPath,
    );
}

/**
 * Picks the representative row for a group of same-collection references across locales:
 * the fragment's own locale if present in the group, else the surface's default locale, else
 * whichever item happens to be first. Mirrors the tie-break `resolveHydratedParentFragment`
 * already uses.
 *
 * @param {Array<Object>} items decorated group items (each carrying a resolved `locale`)
 * @param {string} [openLocale] locale of the fragment currently open in the editor
 * @param {string} [defaultLocale] default locale of the group's surface
 * @returns {Object|null}
 */
export function chooseRepresentative(items, openLocale, defaultLocale) {
    if (!items?.length) return null;
    const byLocale = (locale) => (locale ? items.find((item) => item.locale === locale) : undefined);
    return byLocale(openLocale) ?? byLocale(defaultLocale) ?? items[0];
}

/**
 * Groups filtered, non-project references by logical collection across locales. The group key is
 * `surface + '/' + fragmentPath`, so locale copies collapse into one row; a path `PATH_TOKENS`
 * cannot parse keeps its raw path as the key rather than being dropped.
 *
 * @param {Array<Object>} items filtered `referencedBy` items (projects already removed)
 * @param {{ surface: string, parsedLocale: string|null, fragmentPath: string }} openFragmentTokens
 * @param {string} [openLocale] locale of the fragment currently open in the editor
 * @returns {Array<{ groupKey: string, title: string|null, modelPath: string|null, representative: Object|null, locales: string[], localeCount: number }>}
 */
export function groupReferencesByCollection(items, openFragmentTokens, openLocale) {
    const groups = new Map();
    for (const item of items) {
        const tokens = parsePathTokens(item.path);
        const groupKey = tokens ? `${tokens.surface}/${tokens.fragmentPath}` : item.path;
        const surface = tokens?.surface ?? openFragmentTokens.surface;
        const decorated = { ...item, locale: tokens?.parsedLocale ?? null, surface };
        if (!groups.has(groupKey)) groups.set(groupKey, []);
        groups.get(groupKey).push(decorated);
    }
    return Array.from(groups.entries()).map(([groupKey, groupItems]) => {
        const defaultLocale = getDefaultLocaleCode(groupItems[0]?.surface ?? openFragmentTokens.surface, openLocale);
        const representative = chooseRepresentative(groupItems, openLocale, defaultLocale);
        const locales = [...new Set(groupItems.map((item) => item.locale).filter(Boolean))];
        return {
            groupKey,
            title: representative?.title ?? null,
            modelPath: representative?.model?.path ?? null,
            representative: representative
                ? {
                      id: representative.id,
                      path: representative.path,
                      status: representative.status,
                      link: buildCardsDeepLink(representative, representative.path),
                  }
                : null,
            locales,
            localeCount: locales.length,
        };
    });
}

/**
 * Lists one row per project reference, deduplicated by path. Projects are never grouped across
 * locales, so rows carry no locale chip.
 *
 * @param {Array<Object>} items filtered `referencedBy` items of a single flat reference type
 * @param {(item: Object) => string|null} [buildLink] deep link for a row
 * @returns {Array<{ groupKey: string, title: string|null, modelPath: string|null, representative: Object|null, locales: string[], localeCount: number }>}
 */
export function groupFlatReferences(items, buildLink) {
    const byPath = new Map();
    for (const item of items) {
        if (!byPath.has(item.path)) byPath.set(item.path, item);
    }
    return Array.from(byPath.values()).map((item) => ({
        groupKey: item.path,
        title: item.title ?? null,
        modelPath: item.model?.path ?? null,
        representative: {
            id: item.id,
            path: item.path,
            status: item.status,
            link: buildLink ? buildLink(item) : null,
        },
        locales: [],
        localeCount: 0,
    }));
}

/**
 * Reference type buckets, in display order. `match` is evaluated top-to-bottom against a raw
 * `referencedBy` item; the last entry (`other`) is the catch-all. `grouping: 'locale'` collapses
 * locale copies into one row (collections/cards); `'flat'` lists one row per fragment (projects).
 */
export const REFERENCE_TYPES = [
    { key: 'collections', label: 'Collections', grouping: 'locale', match: (r) => r.model?.path === COLLECTION_MODEL_PATH },
    { key: 'cards', label: 'Cards', grouping: 'locale', match: (r) => r.model?.path === CARD_MODEL_PATH },
    {
        key: 'promoProjects',
        label: 'Promo Project',
        grouping: 'flat',
        match: (r) => r.model?.path === PROMOTION_MODEL_PATH,
        buildLink: (item) => buildPromoProjectDeepLink(item.id),
    },
    {
        key: 'bulkPublishProjects',
        label: 'Bulk Publish Project',
        grouping: 'flat',
        match: (r) => r.model?.path === BULK_PUBLISH_PROJECT_MODEL_PATH,
        buildLink: (item) => buildBulkPublishProjectDeepLink(item.id),
    },
    {
        key: 'localizationProjects',
        label: 'Translation Project',
        grouping: 'flat',
        match: (r) => r.model?.path === TRANSLATION_PROJECT_MODEL_PATH,
        buildLink: (item) => buildTranslationProjectDeepLink(item.id),
    },
    { key: 'other', label: 'Other', grouping: 'flat', match: () => true, buildLink: () => null },
];

// The artifact types shown in the "Related studio artifacts" box + modal, in display order. Cards
// and the "other" catch-all are classified for correctness but not surfaced in this UI (per Figma).
export const ARTIFACT_TYPE_KEYS = ['collections', 'bulkPublishProjects', 'promoProjects', 'localizationProjects'];

/**
 * Classifies a raw `referencedBy` item into one of REFERENCE_TYPES by its model, returning the
 * first matching type key (falls back to `other`).
 * @param {Object} reference
 * @returns {string}
 */
export function classifyReference(reference) {
    return (REFERENCE_TYPES.find((type) => type.match(reference)) ?? REFERENCE_TYPES[REFERENCE_TYPES.length - 1]).key;
}

/**
 * Fetches every page of `GET .../{id}/referencedBy`, following `cursor` until it is absent
 * (there is no empty-string sentinel). Requests are capped at `REFERENCED_BY_PAGE_LIMIT` — the
 * endpoint's `limit` parameter is undocumented but verified to reject values above 50.
 *
 * `aem.sites.cf.fragments.getReferencedByFragmentId` is expected to resolve a single page as
 * `{ items, cursor }`; this function owns the pagination loop so the aem layer stays a thin,
 * single-request client.
 *
 * @param {import('../aem/aem.js').AEM} aem
 * @param {string} fragmentId
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<Array<Object>>}
 */
export async function fetchAllReferencingItems(aem, fragmentId, { signal } = {}) {
    const abortController = signal ? { signal } : undefined;
    const items = [];
    let cursor;
    do {
        const page = await aem.sites.cf.fragments.getReferencedByFragmentId(fragmentId, {
            cursor,
            limit: REFERENCED_BY_PAGE_LIMIT,
            abortController,
        });
        items.push(...(page?.items ?? []));
        cursor = page?.cursor;
    } while (cursor);
    return items;
}

/**
 * Finds the promotion project a promo variation belongs to. `referencedBy` never returns it: the
 * project's `fragments` field holds the default card, not the variation, so the variation's
 * `mas:promotion/` tag is the only link.
 *
 * @param {Object} fragment the fragment currently open in the editor
 * @param {() => Promise<Array<Object>>} [loadPromotionProjects]
 * @returns {Promise<Object|null>}
 */
async function findPromotionProjectForVariation(fragment, loadPromotionProjects) {
    const promotionTagId = getPromotionTagFromFragment(fragment);
    if (!promotionTagId || !loadPromotionProjects) return null;
    const projects = await loadPromotionProjects();
    const projectId = findPromotionProjectIdByTag(promotionTagId, projects);
    return projects.find((project) => project.id === projectId) ?? null;
}

/**
 * Resolves the "referenced by" list for the details panel: fetches every page of the GET-by-id
 * `referencedBy` endpoint, drops false positives (grouped/pzn variations, promo variations,
 * self-locale variations, cross-surface clones), then buckets what remains by reference type
 * (collections, cards, promo/bulk-publish/localization projects, other) in display order.
 * A promo variation also lists its own promotion project, resolved from its tag.
 *
 * @param {import('../aem/aem.js').AEM} aem
 * @param {Object} fragment the fragment currently open in the editor
 * @param {{ signal?: AbortSignal, loadPromotionProjects?: () => Promise<Array<Object>> }} [options]
 * @returns {Promise<Array<{ key: string, label: string, rows: Array<Object> }>>} ordered, non-empty type buckets
 */
export async function getReferencingFragments(aem, fragment, { signal, loadPromotionProjects } = {}) {
    // The open fragment is normally a card/collection whose path parses cleanly. If it does not
    // (e.g. a promo-type path that fails PATH_TOKENS), `surface` is null and the cross-surface and
    // self-locale exclusions become no-ops for this session — references are still listed, just
    // unfiltered on those two axes. Acceptable because those fragment types are not the subject here.
    const openFragmentTokens = parsePathTokens(fragment?.path) ?? {
        surface: extractSurfaceFromPath(fragment?.path),
        parsedLocale: extractLocaleFromPath(fragment?.path),
        fragmentPath: fragment?.path,
    };
    const openLocale = fragment?.locale ?? openFragmentTokens.parsedLocale;

    const items = await fetchAllReferencingItems(aem, fragment.id, { signal });
    const kept = items.filter((item) => !isExcludedReference(item, openFragmentTokens));

    const itemsByType = new Map(REFERENCE_TYPES.map((type) => [type.key, []]));
    for (const item of kept) {
        itemsByType.get(classifyReference(item)).push(item);
    }
    const promotionProject = await findPromotionProjectForVariation(fragment, loadPromotionProjects);
    if (promotionProject) itemsByType.get('promoProjects').push(promotionProject);

    const buckets = [];
    for (const type of REFERENCE_TYPES) {
        const typeItems = itemsByType.get(type.key);
        if (!typeItems.length) continue;
        const rows =
            type.grouping === 'locale'
                ? groupReferencesByCollection(typeItems, openFragmentTokens, openLocale)
                : groupFlatReferences(typeItems, type.buildLink);
        if (rows.length) buckets.push({ key: type.key, label: type.label, rows });
    }
    return buckets;
}
