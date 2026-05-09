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
 *   - Hydrates the first matching project (its references contain promo variation fragments).
 *   - Returns `{ activeProject }` consumed by `customize` for promo variation merging.
 *
 * **`process`** runs sequentially before `customize`:
 *   - Builds a flat `promoMap` (OSI → promoCode) from the active project's fragments
 *     and offer overrides, resolved for the current country.
 *   - Wildcard overrides (empty osis) are stored under the `'*'` key.
 *   - The `promoMap` is placed on context; `customize` reads it via `context.promoMap`
 *     and applies promo codes to each fragment during tree traversal.
 */
import { FRAGMENT_URL_PREFIX, MAS_ROOT, odinReferences } from '../utils/paths.js';
import { fetch, getRequestInfos, matchesGeo } from '../utils/common.js';
import { log, logDebug, logError } from '../utils/log.js';

const CONFIG_CACHE_TTL = 5 * 60 * 1000;
const PROMOTIONS_PATH = `${MAS_ROOT}/promotions`;

let projectsCache;

export function clearPromoCache(preview = false) {
    if (preview) {
        localStorage.removeItem('promotions');
    } else {
        projectsCache = undefined;
    }
}

function getCachedProjects(preview) {
    const cacheEntry = preview ? JSON.parse(localStorage.getItem('promotions')) : projectsCache;
    if (cacheEntry) {
        cacheEntry.isExpired = Date.now() - cacheEntry.timestamp > CONFIG_CACHE_TTL;
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
    return new Date(value).getTime();
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
    const { geos } = project;
    if (geos.length > 0 && !matchesGeo(geos, { regionLocale, country })) {
        logDebug(
            () =>
                `Project "${project.name}" skipped: none of regionLocale="${regionLocale}", country="${country}" found in geos [${geos}]`,
            context,
        );
        return false;
    }
    return true;
}

/**
 * Extracts { id, osi, promoCode } from the hydrated project's offer references.
 * The id is the fragment reference key — used to gate promo treatment in customizeTree.
 */
function parseFragments(hydratedProject) {
    const { references } = hydratedProject;
    const fragmentRefs = hydratedProject.fields?.fragments ?? [];
    return fragmentRefs
        .map((refId) => {
            const ref = references?.[refId]?.value;
            if (!ref) return null;
            const { osi, promoCode } = ref.fields ?? {};
            if (!osi || !promoCode) return null;
            return { id: refId, osi, promoCode };
        })
        .filter(Boolean);
}

/**
 * Fetches promotion projects, selects the first matching one, hydrates it,
 * and returns { activeProject } with fragments, offer overrides, and references
 * for promo variation merging in the customize transformer.
 */
async function init(context) {
    // Fire projects fetch immediately — needs no context dependencies
    const projectsPromise = fetchProjects(context);

    // Resolve request info in parallel
    const { surface } = await getRequestInfos(context);
    if (!surface) return { status: 200, activeProject: null };

    const projects = await projectsPromise;
    if (!projects?.length) return { status: 200, activeProject: null };

    const instant = toInstant(context['mas.instant']);
    const { locale, country, regionLocale } = context;

    let active = null;
    let matchCount = 0;
    for (const project of projects) {
        if (matchesProject(project, { surface, locale, country, regionLocale, instant }, context)) {
            matchCount++;
            if (!active) active = project;
        }
    }
    if (matchCount > 1) {
        log(`Multiple promotion projects matched (${matchCount}), using first: ${active.id}`, context);
    }
    if (!active) return { status: 200, activeProject: null };

    const response = await fetch(odinReferences(active.id, true, context.preview), context, 'promotions-hydrate');
    if (response.status !== 200) {
        logError(`Failed to hydrate promotion project ${active.id}: ${response.message}`, context);
        return { status: 200, activeProject: null };
    }

    const hydratedProject = response.body;
    const fragments = parseFragments(hydratedProject);
    if (!fragments.length) {
        logDebug(() => `Promotion project ${active.id} has no fragments, skipping`, context);
        return { status: 200, activeProject: null };
    }
    logDebug(() => `Active promotion project ${active.id} with ${fragments.length} fragments`, context);

    return {
        status: 200,
        activeProject: {
            id: active.id,
            path: active.path,
            fields: hydratedProject.fields,
            fragments,
            variations: hydratedProject.fields?.variations ?? [],
            offerOverrides: parseOfferOverrides(active.offerLines),
            references: hydratedProject.references,
        },
    };
}

/**
 * Builds a flat OSI → promoCode lookup map from fragment references and offer overrides.
 * Overrides take priority over fragment entries for the same OSI.
 * Wildcard overrides (empty osis list) are stored under the '*' key.
 */
function buildPromoMap(fragments, offerOverrides, country) {
    const map = {};
    for (const { osi, promoCode } of fragments) {
        map[osi] = promoCode;
    }
    for (const override of offerOverrides) {
        const countryMatch = override.countries.length === 0 || (country && override.countries.includes(country));
        if (!countryMatch) continue;
        if (override.osis.length === 0) {
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
 * Builds the promoMap and promoFragmentIds from the active project and places them on context
 * for the customize transformer to apply during fragment tree traversal.
 * Only fragments whose id is in promoFragmentIds will receive promo treatment.
 */
async function promotions(context) {
    const { activeProject } = (await context.promises?.promotions) ?? {};
    if (!activeProject) return { ...context, status: 200 };
    const { fragments = [], offerOverrides = [] } = activeProject;
    const promoMap = buildPromoMap(fragments, offerOverrides, context.country);
    const promoFragmentIds = new Set(fragments.map((f) => f.id));
    return { ...context, status: 200, promoMap, promoFragmentIds };
}

export const transformer = {
    name: 'promotions',
    process: promotions,
    init,
};
