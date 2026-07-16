/**
 * Promotions transformer — discovers and activates promotional campaigns.
 *
 * ## Overview
 *
 * Promotion projects are content fragments stored under `/content/dam/mas/promotions/`.
 * Each project declares which surfaces, geos, and date ranges it targets, plus two
 * mechanisms to apply promo codes to fragments:
 *
 * 1. **Fragment references** — the project's `offers` field references child fragments
 *    that each carry an `osi` / `promoCode` pair.
 * 2. **Offer override lines** — the project's `offers` text lines encode rules as
 *    `<osis>:<promoCode>:<countries>` (comma-separated lists; empty = wildcard).
 *    Overrides take priority over fragment-based codes for the same OSI.
 *
 * ## Lifecycle (init / process)
 *
 * **`init`** runs in parallel with other transformer inits:
 *   - Fetches the promotions folder (cached for 5 min).
 *   - Filters projects by promotion tag, surface, geo, and date window.
 *   - Awaits `defaultLanguage` to resolve `defaultLocale` / `regionLocale`.
 *   - Hydrates ALL matched projects in parallel (for fragment OSI/promoCode data) and
 *     folder-searches their promo variations for `defaultLocale` and `regionLocale`.
 *   - Returns `{ activeProjects }` — array preserving the delivery listing (creation) order,
 *     which is the tie-break order. Each project carries its own `defaultVariations` /
 *     `regionVariations` maps (keyed by fragmentPath). Multiple projects can target the same
 *     fragment simultaneously; `customize` applies an explicit osi entry from whichever project
 *     has one (folder order only breaking ties), so per-country projects coexist.
 *
 * **`process`** runs sequentially before `customize`:
 *   - For each active project, builds its own `promoMap` (OSI → promoCode) from its
 *     promoCode and offer overrides, resolved for the current country.
 *   - Wildcard overrides (empty osis) are stored under the `'*'` key.
 *   - Places `context.promoProjects` (array of `{ project, promoMap, fragmentPaths }`).
 *   - `customize` walks this array per fragment: an explicit osi entry from any targeting
 *     project wins (folder order breaks ties), else a project-level wildcard promoCode applies.
 *     Projects with disjoint per-country entries therefore coexist on the same fragment.
 */
import { FRAGMENT_URL_PREFIX, MAS_ROOT, PATH_TOKENS, odinReferences } from '../utils/paths.js';
import { fetch, getRequestInfos, matchesGeo } from '../utils/common.js';
import { log, logDebug, logError } from '../utils/log.js';

const CONFIG_CACHE_TTL = 5 * 60 * 1000;
const PROMOTIONS_PATH = `${MAS_ROOT}/promotions`;

let projectsCache;
let promoVariationsCache = {};

export function clearPromoCache(preview = false) {
    if (preview) {
        localStorage.removeItem('promotions');
        localStorage.removeItem('promo-variations');
    } else {
        projectsCache = undefined;
        promoVariationsCache = {};
    }
}

function getCachedProjects(preview) {
    const cacheEntry = preview ? JSON.parse(localStorage.getItem('promotions')) : projectsCache;
    if (cacheEntry) {
        cacheEntry.isExpired = Math.abs(Date.now() - cacheEntry.timestamp) > CONFIG_CACHE_TTL;
        return cacheEntry;
    }
    return null;
}

function cacheProjects(preview, projects) {
    const cacheEntry = { projects, timestamp: Date.now() };
    if (preview) {
        localStorage.setItem('promotions', JSON.stringify(cacheEntry));
    } else {
        projectsCache = cacheEntry;
    }
    return projects;
}

async function fetchProjects(context) {
    const cached = getCachedProjects(context.preview);
    if (cached && !cached.isExpired) {
        logDebug(() => 'Using cached promotion projects', context);
        return cached.projects;
    }

    const baseUrl = context.preview?.url ?? FRAGMENT_URL_PREFIX;
    const allItems = [];
    let cursor;
    do {
        const url = `${baseUrl}/?path=${PROMOTIONS_PATH}&limit=50${cursor ? `&cursor=${cursor}` : ''}`;
        const response = await fetch(url, context, 'promotions-folder');
        if (response.status !== 200) {
            logDebug(() => `Failed to fetch promotions folder: ${response.message}`, context);
            return null;
        }
        allItems.push(...(response.body?.items ?? []));
        cursor = response.body?.cursor;
    } while (cursor);

    const projects = allItems.map(({ id, path, name, fields }) => ({
        id,
        path,
        name,
        surfaces: fields?.surfaces ?? [],
        geos: fields?.geos ?? [],
        startDate: fields?.startDate ?? null,
        endDate: fields?.endDate ?? null,
        tags: fields?.tags ?? [],
    }));

    return cacheProjects(context.preview, projects);
}

function toInstant(value) {
    if (!value) return Date.now();
    if (typeof value === 'number') return value;
    const t = new Date(value).getTime();
    return Number.isFinite(t) ? t : Date.now();
}

const PROMO_TAG_PREFIX = 'mas:promotion/';

/**
 * Parses offer substitution lines of the form "substitute:<baseOsi>:<substituteOsi>:<geo>[,<geo>...]".
 * Geos are comma-separated CQ tags (e.g. "mas:locale/en_AU,mas:country/au").
 * Lines without a geo are stored with geos=[] and skipped by buildSubstituteMap.
 * @param {string[]} lines
 * @returns {{ baseOsi: string, substituteOsi: string, geos: string[] }[]}
 */
function parseOfferSubstitutions(lines) {
    return lines
        .map((line) => {
            if (!line.startsWith('substitute|')) return null;
            const [, baseOsi, substituteOsi, geoStr = ''] = line.split('|');
            if (!baseOsi || !substituteOsi) return null;
            const geos = geoStr.split(',');
            return { baseOsi, substituteOsi, geos };
        })
        .filter(Boolean);
}

/**
 * Builds a flat baseOsi → substituteOsi lookup for the current geo.
 * @param {{ baseOsi: string, substituteOsi: string, geos: string[] }[]} substitutions
 * @param {{ regionLocale: string, country: string }} geoContext
 * @returns {Object}
 */
function buildSubstituteMap(substitutions, { regionLocale, country }) {
    const map = {};
    for (const sub of substitutions) {
        if (matchesGeo(sub.geos, { regionLocale, country })) {
            map[sub.baseOsi] = sub.substituteOsi;
        }
    }
    return map;
}

/**
 * Parses project-level offer override lines of the form "<osis>:<promocode>:<geo1>,<geo2>,..."
 * where osis is a comma-separated list (may be empty), promoCode is required,
 * and geos is a comma-separated list of geo tags (may be empty = wildcard).
 * @param {string[]} lines
 * @returns {{ osis: string[], promoCode: string, geos: string[] }[]}
 */
function parseOfferOverrides(lines) {
    return lines
        .map((line) => {
            if (line.startsWith('substitute|')) return null;
            const [osisPart, promoCode, geosPart = ''] = line.split('|');
            if (!promoCode) return null;
            return {
                osis: osisPart ? osisPart.split(',') : [],
                promoCode,
                geos: geosPart ? geosPart.split(',') : [],
            };
        })
        .filter(Boolean);
}

/**
 * Checks whether a promotion project applies to the current request
 * by verifying promotion tag, surface, date window, and geo targeting.
 */
function matchesProject(project, { surface, country, regionLocale, instant }, context) {
    if (!project.tags.some((tag) => tag.startsWith(PROMO_TAG_PREFIX))) {
        logDebug(() => `Project "${project.name}" skipped: no promo tag (expected prefix: ${PROMO_TAG_PREFIX})`, context);
        return false;
    }
    if (!project.surfaces.includes(surface)) {
        logDebug(() => `Project "${project.name}" skipped: surface "${surface}" not in [${project.surfaces}]`, context);
        return false;
    }
    const { geos } = project;
    if (geos.length > 0 && !matchesGeo(geos, { regionLocale, country })) {
        logDebug(
            () =>
                `Project "${project.name}" skipped: none of regionLocale="${regionLocale}", country="${country}" found in geos [${geos}]`,
            context,
        );
        return false;
    }
    if (project.startDate && instant < new Date(project.startDate).getTime()) {
        logDebug(
            () =>
                `Project "${project.name}" skipped: instant ${new Date(instant).toISOString()} is before startDate ${project.startDate}`,
            context,
        );
        return false;
    }
    if (project.endDate && instant > new Date(project.endDate).getTime()) {
        logDebug(
            () =>
                `Project "${project.name}" skipped: instant ${new Date(instant).toISOString()} is after endDate ${project.endDate}`,
            context,
        );
        return false;
    }
    return true;
}

/**
 * Extracts fragment paths from the hydrated project's fragment references.
 * These paths gate which fragments receive promo treatment in customizeTree.
 * Matching is by fragmentPath (locale-independent) so translated fragments are handled correctly.
 */
function parseFragmentPaths(hydratedProject) {
    const { references } = hydratedProject;
    const fragmentRefs = hydratedProject.fields?.fragments ?? [];
    return fragmentRefs
        .map((refId) => {
            const ref = references?.[refId]?.value;
            if (!ref) return null;
            const match = PATH_TOKENS.exec(ref.path ?? '');
            return match?.groups.fragmentPath ?? null;
        })
        .filter(Boolean);
}

function getCachedVariations(preview, key) {
    const store = preview ? JSON.parse(localStorage.getItem('promo-variations') ?? '{}') : promoVariationsCache;
    const entry = store[key];
    if (entry) {
        entry.isExpired = Math.abs(Date.now() - entry.timestamp) > CONFIG_CACHE_TTL;
        return entry;
    }
    return null;
}

function cacheVariations(preview, key, variations) {
    const entry = { variations, timestamp: Date.now() };
    if (preview) {
        const store = JSON.parse(localStorage.getItem('promo-variations') ?? '{}');
        store[key] = entry;
        localStorage.setItem('promo-variations', JSON.stringify(store));
    } else {
        promoVariationsCache[key] = entry;
    }
    return variations;
}

/**
 * Fetches all promo variation fragments from a locale-specific promotions folder.
 * Results are cached by surface/projectName/locale with the same TTL as projects.
 * Returns a map of fragmentPath → fragment item.
 */
async function fetchPromoVariations(baseUrl, surface, locale, projectName, context) {
    const cacheKey = `${surface}/${projectName}/${locale}`;
    const cached = getCachedVariations(context.preview, cacheKey);
    if (cached && !cached.isExpired) {
        logDebug(() => `Using cached promo variations for ${cacheKey}`, context);
        return cached.variations;
    }

    const path = `${MAS_ROOT}/${surface}/${locale}/promotions/${projectName}`;
    const variations = {};
    const prefix = `promotions/${projectName}/`;
    let cursor;
    let fetchedAnyPage = false;
    do {
        const url = `${baseUrl}/?path=${path}&limit=50${cursor ? `&cursor=${cursor}` : ''}`;
        const response = await fetch(url, context, `promo-variations-${projectName}-${locale}`);
        if (response.status !== 200) {
            // First-page failure (commonly: no variations folder) is expected → cache empty silently.
            // A later-page failure means a transient error mid-pagination; keep the pages already
            // collected rather than discarding them, and log how many we had.
            if (fetchedAnyPage) {
                logError(
                    `Promo variations for ${cacheKey}: page fetch failed (status ${response.status}) after collecting ${Object.keys(variations).length}; returning partial results`,
                    context,
                );
                return cacheVariations(context.preview, cacheKey, variations);
            }
            return cacheVariations(context.preview, cacheKey, {});
        }
        fetchedAnyPage = true;
        const items = response.body?.items ?? [];
        for (const item of items) {
            const match = PATH_TOKENS.exec(item.path);
            if (match) {
                const fullFragPath = match.groups.fragmentPath;
                if (fullFragPath.startsWith(prefix)) {
                    variations[fullFragPath.slice(prefix.length)] = item;
                }
            }
        }
        cursor = response.body?.cursor;
    } while (cursor);
    return cacheVariations(context.preview, cacheKey, variations);
}

/**
 * Hydrates a single matched project and fetches its variation folders.
 * Returns the per-project activeProject shape, or `null` if hydration failed
 * or the project has no fragments and no offer overrides (nothing to apply).
 */
async function hydrateProject(project, { baseUrl, surface, defaultLocale, resolvedRegionLocale }, context) {
    const promoTag = project.tags.find((tag) => tag.startsWith(PROMO_TAG_PREFIX));
    const promoName = promoTag.slice(PROMO_TAG_PREFIX.length);

    const [hydrateResponse, defaultVariations, regionVariations] = await Promise.all([
        fetch(odinReferences(project.id, true, context.preview), context, `promotions-hydrate-${project.id}`),
        fetchPromoVariations(baseUrl, surface, defaultLocale, promoName, context),
        resolvedRegionLocale && resolvedRegionLocale !== defaultLocale
            ? fetchPromoVariations(baseUrl, surface, resolvedRegionLocale, promoName, context)
            : {},
    ]);

    if (hydrateResponse.status !== 200) {
        logError(`Failed to hydrate promotion project ${project.id}: ${hydrateResponse.message}`, context);
        return null;
    }

    const hydratedProject = hydrateResponse.body;
    const fragmentPaths = parseFragmentPaths(hydratedProject);
    const offerLines = hydratedProject.fields?.offers ?? [];
    const offerOverrides = parseOfferOverrides(offerLines);
    const offerSubstitutions = parseOfferSubstitutions(offerLines);
    const promoCode = hydratedProject.fields?.promoCode ?? null;
    const title = hydratedProject.fields?.title ?? null;
    if (!fragmentPaths.length && !offerOverrides.length && !offerSubstitutions.length) {
        logDebug(() => `Promotion project ${project.id} has no fragments or offer overrides, skipping`, context);
        return null;
    }
    logDebug(
        () =>
            `Active promotion project ${project.id} with ${fragmentPaths.length} fragments, ${offerOverrides.length} offer overrides, promoCode="${promoCode}", ${Object.keys(defaultVariations).length} default variations, ${Object.keys(regionVariations).length} region variations`,
        context,
    );

    return {
        id: project.id,
        path: project.path,
        title,
        promoCode,
        fragmentPaths,
        offerOverrides,
        offerSubstitutions,
        defaultVariations,
        regionVariations,
    };
}

/**
 * Fetches promotion projects, collects ALL projects matching the request's
 * surface/locale/time, hydrates each in parallel, and fetches their promo
 * variation folders. Returns `{ activeProjects }` (array, preserving folder
 * order) consumed by `customize`. Per-fragment "first applicable project"
 * resolution happens downstream in the customize transformer.
 */
async function init(context) {
    // Fire projects fetch immediately — needs no context dependencies
    const projectsPromise = fetchProjects(context);

    // Resolve surface, projects, and defaultLanguage (which carries regionLocale) all in parallel.
    // regionLocale is NOT available on the init-phase context — it is computed by defaultLanguage.init
    // and only placed on context during the process phase. We must read it from the promise.
    const [{ surface }, projects, defaultLangResult] = await Promise.all([
        getRequestInfos(context),
        projectsPromise,
        context.promises?.defaultLanguage,
    ]);

    if (!surface) return { status: 200, activeProjects: [] };
    if (!projects?.length) return { status: 200, activeProjects: [] };

    const defaultLocale = defaultLangResult?.defaultLocale;
    if (!defaultLocale) return { status: 200, activeProjects: [] };
    const resolvedRegionLocale = defaultLangResult.regionLocale;

    const instant = toInstant(context.preview ? context.instant : undefined);
    const { locale, country } = context;
    const effectiveRegionLocale = resolvedRegionLocale ?? locale;

    const matched = projects
        .filter((project) =>
            matchesProject(project, { surface, locale, country, regionLocale: effectiveRegionLocale, instant }, context),
        )
        .sort((a, b) => (a.endDate ? 0 : 1) - (b.endDate ? 0 : 1));
    if (!matched.length) return { status: 200, activeProjects: [] };

    log(
        `${matched.length} promotion project(s) matched for surface "${surface}", regionLocale "${effectiveRegionLocale}", country "${country}": ${matched.map((p) => `"${p.name}" (${p.id})`).join(', ')}`,
        context,
    );

    const baseUrl = context.preview?.url ?? FRAGMENT_URL_PREFIX;

    // Hydrate all matched projects concurrently. allSettled (not all) isolates per-project
    // failures: if one project's hydration rejects, the others are still served.
    const settled = await Promise.allSettled(
        matched.map((project) => hydrateProject(project, { baseUrl, surface, defaultLocale, resolvedRegionLocale }, context)),
    );
    const activeProjects = [];
    settled.forEach((result, i) => {
        if (result.status === 'rejected') {
            logError(`Failed to hydrate promotion project ${matched[i].id}: ${result.reason}`, context);
        } else if (result.value) {
            activeProjects.push(result.value);
        }
    });

    return { status: 200, activeProjects };
}

/**
 * Builds a flat OSI → promoCode lookup map from project-level promoCode and offer overrides.
 * Project-level promoCode is the default wildcard ('*').
 * Overrides can target specific OSIs or act as wildcards (empty osis list).
 * Specific OSI overrides take priority over the wildcard.
 */
function buildPromoMap(offerOverrides, { regionLocale, country }, projectPromoCode, context) {
    const map = {};
    if (projectPromoCode) {
        map['*'] = projectPromoCode;
    }
    for (const override of offerOverrides) {
        if (override.geos?.length && !matchesGeo(override.geos, { regionLocale, country })) continue;
        if (override.osis.length === 0) {
            if (map['*'] && map['*'] !== override.promoCode) {
                log(`Project promoCode "${map['*']}" overridden by wildcard offer override "${override.promoCode}"`, context);
            }
            map['*'] = override.promoCode;
        } else {
            for (const osi of override.osis) {
                map[osi] = override.promoCode;
            }
        }
    }
    return map;
}

/**
 * For each active project, builds its own promoMap and fragmentPaths Set and
 * places the per-project array on context for the customize transformer to
 * walk per-fragment during tree traversal. Order is preserved (folder order
 * from Odin) as a tie-break; customize applies an explicit osi entry from any
 * targeting project, so projects with disjoint per-country entries coexist.
 * Matching is done by fragmentPath (locale-independent) so translated fragments are handled correctly.
 */
async function promotions(context) {
    const { activeProjects = [] } = (await context.promises?.promotions) ?? {};
    const { regionLocale, country } = context;
    const promoProjects = activeProjects.map((project) => ({
        project,
        promoMap: buildPromoMap(project.offerOverrides, { regionLocale, country }, project.promoCode, context),
        substituteMap: buildSubstituteMap(project.offerSubstitutions ?? [], { regionLocale, country }),
        fragmentPaths: new Set(project.fragmentPaths),
    }));
    const substituteMap = Object.assign({}, ...promoProjects.map((p) => p.substituteMap));
    promoProjects.forEach(({ project, promoMap, substituteMap: sm }) => {
        logDebug(
            () => `Project "${project.id}" promoMap: ${JSON.stringify(promoMap)}, substituteMap: ${JSON.stringify(sm)}`,
            context,
        );
    });
    return { ...context, status: 200, promoProjects, substituteMap };
}

export const transformer = {
    name: 'promotions',
    process: promotions,
    init,
};
