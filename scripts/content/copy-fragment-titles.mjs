/**
 * Copies the top-level AEM fragment title of every en_US fragment of a surface
 * onto its counterparts in all other locales (ROW), including regional, grouped
 * (pzn) and promotion variations. Only the title is written: description, fields
 * and variations are left as they are. Nothing is published and missing
 * counterparts are logged and skipped, never created.
 *
 * DRY-RUN BY DEFAULT — pass --apply to write.
 *
 * Auth: author API needs an access token + api key, from the env or a .env file:
 *   MAS_ACCESS_TOKEN=<token>   # copy(adobeid.authorize()) from MAS Studio devtools
 *   MAS_API_KEY=mas-studio
 *
 * Usage:
 *   node copy-fragment-titles.mjs --surface <surface> [--bucket author-p22655-e59433] [--locale fr_FR] \
 *        [--concurrency 4] [--apply]
 *
 * Endpoints used:
 *   GET  {cf}/search?query=...   list en_US fragments (cursor paged)
 *   GET  {cf}?path={path}        resolve a counterpart by path -> items[0] (with etag)
 *   PUT  {cf}/{id}               full-body update {title,description,fields} + If-Match
 *
 * NOTE: a write refused by AEM as "locked by live relationship" is counted as failed.
 *
 * Rollout:
 *   1. --surface adobe-home --locale fr_FR            (dry run)
 *   2. the same command with --apply, then check that locale in Studio
 *   3. the full run without --locale, first as a dry run, then with --apply
 */

import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
    CARD_MODEL_ID,
    COLLECTION_MODEL_ID,
    ROOT_PATH,
    createHeaders,
    fetchIndexFragment,
    getValidLocaleCodes,
    listFolderFragments,
    parseArgs,
    wait,
} from './common.js';

const SOURCE_LOCALE = 'en_US';
const PATH_PATTERN = new RegExp(`^${ROOT_PATH}/([^/]+)/([^/]+)(/.+)$`);

export function getLocaleFromPath(path) {
    return PATH_PATTERN.exec(path ?? '')?.[2] ?? null;
}

export function swapLocale(path, locale) {
    const match = PATH_PATTERN.exec(path ?? '');
    return match ? `${ROOT_PATH}/${match[1]}/${locale}${match[3]}` : null;
}

export function selectTargetLocales(validLocaleCodes, { sourceLocale = SOURCE_LOCALE, localeFilter } = {}) {
    const targets = [...validLocaleCodes].filter((code) => code !== sourceLocale);
    if (!localeFilter) return targets;
    if (!targets.includes(localeFilter)) throw new Error(`${localeFilter} is not a valid target locale for this surface`);
    return [localeFilter];
}

export function isSourceFragment(fragment) {
    const modelId = fragment?.model?.id;
    return (
        (modelId === CARD_MODEL_ID || modelId === COLLECTION_MODEL_ID) &&
        getLocaleFromPath(fragment.path) === SOURCE_LOCALE &&
        Boolean(fragment.title?.trim())
    );
}

export function planTitleUpdate(sourceTitle, target) {
    if (!target) return 'missing';
    return target.title === sourceTitle ? 'unchanged' : 'update';
}

export function buildTitleUpdateBody(target, sourceTitle) {
    return { title: sourceTitle, description: target.description, fields: target.fields };
}

const OUTCOMES = ['updated', 'unchanged', 'missing', 'failed'];
const countOutcomes = (outcomes) => Object.fromEntries(OUTCOMES.map((o) => [o, outcomes.filter((x) => x === o).length]));

// results: [{ locale, outcome }] -> per-locale and total counts
export function summarize(results) {
    const locales = [...new Set(results.map((r) => r.locale))].sort();
    return {
        byLocale: Object.fromEntries(
            locales.map((l) => [l, countOutcomes(results.filter((r) => r.locale === l).map((r) => r.outcome))]),
        ),
        totals: countOutcomes(results.map((r) => r.outcome)),
    };
}

export function formatSummary({ byLocale, totals }, apply) {
    const row = (name, c) => [name, c.updated, c.unchanged, c.missing, c.failed].join('\t');
    return [
        `locale\t${apply ? 'updated' : 'would update'}\tunchanged\tmissing\tfailed`,
        ...Object.entries(byLocale).map(([locale, counts]) => row(locale, counts)),
        row('total', totals),
    ].join('\n');
}

const sourceKind = (path) => (path.includes('/pzn/') ? 'grouped' : path.includes('/promotions/') ? 'promotion' : 'fragment');

// worker must not throw; results keep the order of items
async function mapPool(items, size, worker) {
    const results = new Array(items.length);
    let next = 0;
    const runWorker = async () => {
        while (next < items.length) {
            const index = next++;
            results[index] = await worker(items[index]);
        }
    };
    await Promise.all(Array.from({ length: Math.min(size, items.length) }, runWorker));
    return results;
}

export async function run({ baseUrl, headers, surface, localeFilter, apply, concurrency = 4 }) {
    const cf = `${baseUrl}/adobe/sites/cf/fragments`;

    const writeTitle = async (target, sourceTitle) => {
        const response = await fetch(`${cf}/${target.id}`, {
            method: 'PUT',
            headers: { ...headers, 'If-Match': target.etag },
            body: JSON.stringify(buildTitleUpdateBody(target, sourceTitle)),
        });
        if (!response.ok) throw new Error(`PUT ${target.id} -> ${response.status} ${await response.text().catch(() => '')}`);
        await wait(1000);
    };

    // Logs and returns { locale, outcome }; never throws.
    const processJob = async ({ source, locale }) => {
        const path = swapLocale(source.path, locale);
        try {
            const target = await fetchIndexFragment(baseUrl, headers, path);
            const plan = planTitleUpdate(source.title, target);
            if (plan === 'missing') console.log(`[${locale}] missing counterpart, skipped: ${path}`);
            if (plan !== 'update') return { locale, outcome: plan };
            if (apply) await writeTitle(target, source.title);
            console.log(
                `[${locale}] ${apply ? 'updated' : 'would update'} ${path}: title '${target.title}' -> '${source.title}'`,
            );
            return { locale, outcome: 'updated' };
        } catch (error) {
            console.error(`[${locale}] failed ${path}: ${error.message}`);
            return { locale, outcome: 'failed' };
        }
    };

    const sources = (await listFolderFragments(baseUrl, headers, `${ROOT_PATH}/${surface}/${SOURCE_LOCALE}`)).filter(
        isSourceFragment,
    );
    console.log(`Sources with a title under ${surface}/${SOURCE_LOCALE}: ${sources.length}`);
    for (const source of sources) console.log(`  [${sourceKind(source.path)}] ${source.path} = '${source.title}'`);

    const locales = selectTargetLocales(getValidLocaleCodes(surface), { localeFilter });
    const jobs = sources.flatMap((source) => locales.map((locale) => ({ source, locale })));
    console.log(`Target locales: ${locales.length}, jobs: ${jobs.length}\n`);

    const summary = summarize(await mapPool(jobs, concurrency, processJob));
    console.log(`\n${formatSummary(summary, apply)}`);
    return summary;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    // Load a .env (cwd, then repo root) — mirrors repair-variations.mjs.
    if (typeof process.loadEnvFile === 'function') {
        const here = dirname(fileURLToPath(import.meta.url));
        for (const envPath of [resolve(process.cwd(), '.env'), resolve(here, '../../.env')]) {
            if (existsSync(envPath)) {
                process.loadEnvFile(envPath);
                break;
            }
        }
    }

    const { getFlag, hasFlag } = parseArgs(process.argv);
    const surface = getFlag('--surface');
    const bucket = getFlag('--bucket') || 'author-p22655-e59433';
    const localeFilter = getFlag('--locale');
    const concurrency = Number(getFlag('--concurrency')) || 4;
    const apply = hasFlag('--apply'); // dry-run unless --apply
    const accessToken = process.env.MAS_ACCESS_TOKEN;
    const apiKey = process.env.MAS_API_KEY;

    if (!surface || !accessToken || !apiKey) {
        console.error(
            'Usage: node copy-fragment-titles.mjs --surface <surface> [--bucket author-p22655-e59433] [--locale <code>] [--concurrency 4] [--apply]',
        );
        console.error('Set MAS_ACCESS_TOKEN and MAS_API_KEY (e.g. in .env).');
        process.exit(1);
    }

    console.log(apply ? '--apply (writes enabled)' : 'DRY-RUN (no writes; pass --apply to write)');
    run({
        baseUrl: `https://${bucket}.adobeaemcloud.com`,
        headers: createHeaders(accessToken, apiKey),
        surface,
        localeFilter,
        apply,
        concurrency,
    })
        .then((summary) => {
            if (summary.totals.failed) process.exit(2);
        })
        .catch((error) => {
            console.error(error.message ?? error);
            process.exit(1);
        });
}
