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
 *   - Hydrates the first matching project (for fragment OSI/promoCode data).
 *   - Folder-searches promo variations for `defaultLocale` and `regionLocale` (in parallel
 *     with hydration). Returns `{ activeProject }` with `defaultVariations` / `regionVariations`
 *     maps (keyed by fragmentPath) consumed by `customize` for promo variation merging.
 *
 * **`process`** runs sequentially before `customize`:
 *   - Builds a flat `promoMap` (OSI → promoCode) from the active project's fragments
 *     and offer overrides, resolved for the current country.
 *   - Wildcard overrides (empty osis) are stored under the `'*'` key.
 *   - The `promoMap` is placed on context; `customize` reads it via `context.promoMap`
 *     and applies promo codes to each fragment during tree traversal.
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
    const folderUrl = `${baseUrl}/?path=${PROMOTIONS_PATH}`;
    const response = await fetch(folderUrl, context, 'promotions-folder');
    if (response.status !== 200) {
        logDebug(() => `Failed to fetch promotions folder: ${response.message}`, context);
        return null;
    }

    const items = response.body?.items ?? [];
    const projects = items.map(({ id, path, name, fields }) => ({
        id,
        path,
        name,
        surfaces: fields?.surfaces ?? [],
        geos: fields?.geos ?? [],
        startDate: fields?.startDate ?? null,
        endDate: fields?.endDate ?? null,
        tags: fields?.tags ?? [],
        offerLines: fields?.offers ?? [],
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
 * Parses project-level offer override lines of the form "<osis>:<promocode>:<countries>"
 * where osis and countries are comma-separated lists (may be empty), promoCode is required.
 * @param {string[]} lines
 * @returns {{ osis: string[], promoCode: string, countries: string[] }[]}
 */
function parseOfferOverrides(lines) {
    return lines
        .map((line) => {
            const [osisPart, promoCode, countriesPart] = line.split(':');
            if (!promoCode?.trim()) return null;
            return {
                osis: osisPart
                    ? osisPart
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean)
                    : [],
                promoCode: promoCode.trim(),
                countries: countriesPart
                    ? countriesPart
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean)
                    : [],
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
    const url = `${baseUrl}/?path=${path}`;
    const response = await fetch(url, context, 'promo-variations');
    if (response.status !== 200) return cacheVariations(context.preview, cacheKey, {});
    const items = response.body?.items ?? [];
    const variations = {};
    const prefix = `promotions/${projectName}/`;
    for (const item of items) {
        const match = PATH_TOKENS.exec(item.path);
        if (match) {
            const fullFragPath = match.groups.fragmentPath;
            if (fullFragPath.startsWith(prefix)) {
                variations[fullFragPath.slice(prefix.length)] = item;
            }
        }
    }
    return cacheVariations(context.preview, cacheKey, variations);
}

/**
 * Fetches promotion projects, selects the first matching one, hydrates it for
 * OSI/promoCode data, and fetches promo variation folders for defaultLocale and
 * regionLocale. Returns { activeProject } consumed by `customize`.
 */
async function init(context) {
    // Fire projects fetch immediately — needs no context dependencies
    const projectsPromise = fetchProjects(context);

    // Resolve request info in parallel
    const { surface } = await getRequestInfos(context);
    if (!surface) return { status: 200, activeProject: null };

    const projects = await projectsPromise;
    if (!projects?.length) return { status: 200, activeProject: null };

    const instant = toInstant(context.preview ? context.instant : undefined);
    const { locale, country, regionLocale } = context;
    const effectiveRegionLocale = regionLocale ?? locale;

    let active = null;
    let matchCount = 0;
    for (const project of projects) {
        if (matchesProject(project, { surface, locale, country, regionLocale: effectiveRegionLocale, instant }, context)) {
            matchCount++;
            if (!active) active = project;
        }
    }
    if (matchCount > 1) {
        logDebug(() => `Multiple promotion projects matched (${matchCount}), using first: ${active.id}`, context);
    }
    if (!active) {
        return { status: 200, activeProject: null };
    } else {
        log(
            `Active promotion project "${active.name}" (${active.id}) matched for surface "${surface}", regionLocale "${regionLocale}", country "${country}"`,
            context,
        );
    }

    // Await defaultLanguage to get resolved locale info for variation folder searches
    const defaultLangResult = await context.promises?.defaultLanguage;
    const defaultLocale = defaultLangResult?.defaultLocale;
    if (!defaultLocale) return { status: 200, activeProject: null };
    const resolvedRegionLocale = defaultLangResult.regionLocale;

    const promoTag = active.tags.find((tag) => tag.startsWith(PROMO_TAG_PREFIX));
    const promoName = promoTag.slice(PROMO_TAG_PREFIX.length);
    const baseUrl = context.preview?.url ?? FRAGMENT_URL_PREFIX;

    // Hydrate project (for fragments/OSI data) and fetch variation folders in parallel
    const [hydrateResponse, defaultVariations, regionVariations] = await Promise.all([
        fetch(odinReferences(active.id, true, context.preview), context, 'promotions-hydrate'),
        fetchPromoVariations(baseUrl, surface, defaultLocale, promoName, context),
        resolvedRegionLocale && resolvedRegionLocale !== defaultLocale
            ? fetchPromoVariations(baseUrl, surface, resolvedRegionLocale, promoName, context)
            : {},
    ]);

    if (hydrateResponse.status !== 200) {
        logError(`Failed to hydrate promotion project ${active.id}: ${hydrateResponse.message}`, context);
        return { status: 200, activeProject: null };
    }

    const hydratedProject = hydrateResponse.body;
    const fragmentPaths = parseFragmentPaths(hydratedProject);
    const offerOverrides = parseOfferOverrides(active.offerLines);
    const promoCode = hydratedProject.fields?.promoCode ?? null;
    if (!fragmentPaths.length && !offerOverrides.length) {
        logDebug(() => `Promotion project ${active.id} has no fragments or offer overrides, skipping`, context);
        return { status: 200, activeProject: null };
    }
    logDebug(
        () =>
            `Active promotion project ${active.id} with ${fragmentPaths.length} fragments, ${offerOverrides.length} offer overrides, promoCode="${promoCode}", ${Object.keys(defaultVariations).length} default variations, ${Object.keys(regionVariations).length} region variations`,
        context,
    );

    return {
        status: 200,
        activeProject: {
            id: active.id,
            path: active.path,
            promoCode,
            fragmentPaths,
            offerOverrides,
            defaultVariations,
            regionVariations,
        },
    };
}

/**
 * Builds a flat OSI → promoCode lookup map from project-level promoCode and offer overrides.
 * Project-level promoCode is the default wildcard ('*').
 * Overrides can target specific OSIs or act as wildcards (empty osis list).
 * Specific OSI overrides take priority over the wildcard.
 */
function buildPromoMap(offerOverrides, country, projectPromoCode, context) {
    const map = {};
    if (projectPromoCode) {
        map['*'] = projectPromoCode;
    }
    for (const override of offerOverrides) {
        const countryMatch = override.countries.length === 0 || (country && override.countries.includes(country));
        if (!countryMatch) continue;
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
 * Builds the promoMap and promoFragmentPaths from the active project and places them on context
 * for the customize transformer to apply during fragment tree traversal.
 * Matching is done by fragmentPath (locale-independent) so translated fragments are handled correctly.
 */
async function promotions(context) {
    const { activeProject } = (await context.promises?.promotions) ?? {};
    if (!activeProject) return { ...context, status: 200 };
    const { fragmentPaths = [], offerOverrides = [], promoCode } = activeProject;
    const promoMap = buildPromoMap(offerOverrides, context.country, promoCode, context);
    const promoFragmentPaths = new Set(fragmentPaths);
    return { ...context, status: 200, promoMap, promoFragmentPaths };
}

export const transformer = {
    name: 'promotions',
    process: promotions,
    init,
};
