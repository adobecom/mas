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
 *   GET  {cf}?path={path}        resolve a counterpart by path -> items[0]
 *   GET  {cf}/{id}               fresh read (etag) right before the write
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

export function getSourceTitle(fragment) {
    return fragment.title;
}

export function isSourceFragment(fragment) {
    const modelId = fragment?.model?.id;
    return (
        (modelId === CARD_MODEL_ID || modelId === COLLECTION_MODEL_ID) &&
        getLocaleFromPath(fragment.path) === SOURCE_LOCALE &&
        Boolean(getSourceTitle(fragment)?.trim())
    );
}

export function planTitleUpdate(sourceTitle, target) {
    if (!target) return 'missing';
    return target.title === sourceTitle ? 'unchanged' : 'update';
}

export function buildTitleUpdateBody(target, sourceTitle) {
    return { title: sourceTitle, description: target.description, fields: target.fields };
}

export function createSummary() {
    return { byLocale: {}, totals: { updated: 0, unchanged: 0, missing: 0, failed: 0 } };
}

export function recordResult(summary, locale, outcome) {
    summary.byLocale[locale] ??= { updated: 0, unchanged: 0, missing: 0, failed: 0 };
    summary.byLocale[locale][outcome] += 1;
    summary.totals[outcome] += 1;
}

const sourceKind = (path) => (path.includes('/pzn/') ? 'grouped' : path.includes('/promotions/') ? 'promotion' : 'fragment');

async function pool(items, size, worker) {
    const queue = items.slice();
    const errors = [];
    const runWorker = async () => {
        let item;
        while ((item = queue.shift()) !== undefined) {
            try {
                await worker(item);
            } catch (error) {
                errors.push(error);
            }
        }
    };
    await Promise.all(Array.from({ length: Math.min(size, items.length) || 1 }, runWorker));
    return errors;
}

export async function run({ baseUrl, headers, surface, localeFilter, apply, concurrency = 4 }) {
    const cf = `${baseUrl}/adobe/sites/cf/fragments`;

    const getFragmentById = async (id) => {
        const response = await fetch(`${cf}/${id}`, { headers });
        if (!response.ok) throw new Error(`GET ${id} -> ${response.status} ${response.statusText}`);
        const fragment = await response.json();
        fragment.etag = response.headers.get('Etag') ?? fragment.etag;
        return fragment;
    };

    const getFragmentByPath = async (path) => {
        const params = new URLSearchParams({ path });
        const response = await fetch(`${cf}?${params}`, { headers });
        if (!response.ok) throw new Error(`GET path ${path} -> ${response.status} ${response.statusText}`);
        const { items } = await response.json();
        return items?.length ? items[0] : null;
    };

    const writeTitle = async (target, sourceTitle) => {
        const response = await fetch(`${cf}/${target.id}`, {
            method: 'PUT',
            headers: { ...headers, 'If-Match': target.etag },
            body: JSON.stringify(buildTitleUpdateBody(target, sourceTitle)),
        });
        if (!response.ok) throw new Error(`PUT ${target.id} -> ${response.status} ${await response.text().catch(() => '')}`);
        await wait(1000);
    };

    const sources = (await listFolderFragments(baseUrl, headers, `${ROOT_PATH}/${surface}/${SOURCE_LOCALE}`)).filter(
        isSourceFragment,
    );
    console.log(`Sources with a title under ${surface}/${SOURCE_LOCALE}: ${sources.length}`);
    for (const source of sources) console.log(`  [${sourceKind(source.path)}] ${source.path} = '${getSourceTitle(source)}'`);

    const locales = selectTargetLocales(getValidLocaleCodes(surface), { localeFilter });
    const jobs = sources.flatMap((source) => locales.map((locale) => ({ source, locale })));
    console.log(`Target locales: ${locales.length}, jobs: ${jobs.length}\n`);

    const summary = createSummary();
    await pool(jobs, concurrency, async ({ source, locale }) => {
        const path = swapLocale(source.path, locale);
        const sourceTitle = getSourceTitle(source);
        try {
            let target = await getFragmentByPath(path);
            const plan = planTitleUpdate(sourceTitle, target);
            if (plan === 'missing') {
                console.log(`[${locale}] missing counterpart, skipped: ${path}`);
                recordResult(summary, locale, 'missing');
                return;
            }
            if (plan === 'unchanged') {
                recordResult(summary, locale, 'unchanged');
                return;
            }
            if (!apply) {
                console.log(`[${locale}] would update ${path}: title '${target.title}' -> '${sourceTitle}'`);
                recordResult(summary, locale, 'updated');
                return;
            }
            target = await getFragmentById(target.id); // fresh etag
            await writeTitle(target, sourceTitle);
            console.log(`[${locale}] updated ${path}: title '${target.title}' -> '${sourceTitle}'`);
            recordResult(summary, locale, 'updated');
        } catch (error) {
            console.error(`[${locale}] failed ${path}: ${error.message}`);
            recordResult(summary, locale, 'failed');
        }
    });

    console.log(`\nlocale\t${apply ? 'updated' : 'would update'}\tunchanged\tmissing\tfailed`);
    for (const [locale, counts] of Object.entries(summary.byLocale).sort(([a], [b]) => a.localeCompare(b))) {
        console.log(`${locale}\t${counts.updated}\t${counts.unchanged}\t${counts.missing}\t${counts.failed}`);
    }
    const { totals } = summary;
    console.log(`total\t${totals.updated}\t${totals.unchanged}\t${totals.missing}\t${totals.failed}`);
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
