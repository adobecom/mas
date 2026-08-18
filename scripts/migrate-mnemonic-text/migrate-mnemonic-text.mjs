#!/usr/bin/env node
import { createWriteStream } from 'node:fs';
import { parseArgs } from 'node:util';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ALL_LOCALES = [
    'de',
    'fr',
    'ja',
    'ko',
    'zh-hans',
    'zh-hant',
    'pt-br',
    'es',
    'it',
    'nl',
    'sv',
    'da',
    'fi',
    'nb',
    'pl',
    'ru',
    'tr',
    'cs',
    'hu',
    'sk',
    'uk',
];

// --- Argument parsing ---

const { values: args } = parseArgs({
    options: {
        host: { type: 'string' },
        token: { type: 'string' },
        apply: { type: 'boolean', default: false },
        surface: { type: 'string' },
        locale: { type: 'string' },
        fragment: { type: 'string' },
        'no-skipped': { type: 'boolean', default: false },
        debug: { type: 'boolean', default: false },
        help: { type: 'boolean', default: false },
    },
    strict: false,
});

if (args.help || !args.host || !args.token) {
    console.log(`
Usage:
  node migrate-mnemonic-text.mjs --host <url> --token <bearer> [options]

Options:
  --host <url>          AEM author base URL (required)
  --token <token>       Bearer token (required)
  --apply               Actually save changes (default: dry-run)
  --surface <surfaces>  Comma-separated surface names (e.g. catalog,cc).
                        Recommended: run one surface at a time to limit blast radius.
                        Path: /content/dam/mas/<surface>[/<locale>]
  --locale <locales>    Comma-separated locale codes, or "all" (default: English only)
  --fragment <id|path>  Process a single fragment only (for testing)
  --no-skipped          Omit skipped items from the CSV report
  --debug               Print raw field names and types for each fragment
  --help                Show this message

Note: In --apply bulk mode a timestamped log file is written automatically.
`);
    process.exit(args.help ? 0 : 1);
}

const HOST = args.host.replace(/\/$/, '');
const TOKEN = args.token;
const APPLY = args.apply;
const DEBUG = args.debug;
const NO_SKIPPED = args['no-skipped'];
const SINGLE_FRAGMENT = args.fragment;
const SURFACE_ARG = args.surface;
const LOCALES_ARG = args.locale;

const BASE_CONTENT_PATH = '/content/dam/mas';

// Build list of absolute AEM content paths to search.
// Structure: /content/dam/mas[/<surface>][/<locale>]
// Running per-surface is recommended to isolate blast radius of a potential rollback.
function buildSearchPaths() {
    if (SINGLE_FRAGMENT) return [];

    const surfaces = SURFACE_ARG
        ? SURFACE_ARG.split(',')
              .map((s) => s.trim())
              .filter(Boolean)
        : [null]; // null = no surface prefix (root scope)

    const locales =
        LOCALES_ARG === 'all'
            ? [null, ...ALL_LOCALES]
            : LOCALES_ARG
              ? LOCALES_ARG.split(',')
                    .map((l) => l.trim())
                    .filter(Boolean)
              : [null]; // null = English/default (no locale suffix)

    const paths = [];
    for (const surface of surfaces) {
        for (const locale of locales) {
            let path = BASE_CONTENT_PATH;
            if (surface) path += `/${surface}`;
            if (locale) path += `/${locale}`;
            paths.push(path);
        }
    }
    return paths;
}

const searchPaths = buildSearchPaths();

// --- Logging ---

const surfaceTag = SURFACE_ARG ? SURFACE_ARG.replace(/,/g, '-') : 'all';
const localeTag = LOCALES_ARG || 'en';
const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const modeTag = APPLY ? 'apply' : 'dry-run';

// In apply-mode bulk runs, automatically write a timestamped log file so there
// is a paper trail of exactly which fragments were modified.
let logStream = null;
if (APPLY && !SINGLE_FRAGMENT) {
    const logFile = `mnemonic-migration-${surfaceTag}-${localeTag}-${ts}.log`;
    logStream = createWriteStream(logFile, { flags: 'a' });
    console.log(`Logging to: ${logFile}`);
}

// CSV report — always written (dry-run and apply) so results can be reviewed.
let csvStream = null;
if (!SINGLE_FRAGMENT) {
    const csvFile = `mnemonic-migration-${surfaceTag}-${localeTag}-${modeTag}-${ts}.csv`;
    csvStream = createWriteStream(csvFile, { flags: 'w' });
    csvStream.write('id,path,title,status,fields_changed,reason\n');
    console.log(`CSV report: ${csvFile}`);
}

function csvEscape(val) {
    const str = String(val ?? '');
    return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str.replace(/"/g, '""')}"` : str;
}

function recordCsv(id, path, title, status, fieldsChanged, reason) {
    csvStream?.write(`${[id, path, title, status, fieldsChanged, reason].map(csvEscape).join(',')}\n`);
}

function log(...parts) {
    const line = parts.join(' ');

    console.log(line);
    logStream?.write(`${line}\n`);
}

function logError(...parts) {
    const line = parts.join(' ');

    console.error(line);
    logStream?.write(`${line}\n`);
}

const CF_URL = `${HOST}/adobe/sites/cf/fragments`;
const CF_SEARCH = `${CF_URL}/search`;

const HEADERS = {
    Authorization: `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
    pragma: 'no-cache',
    'cache-control': 'no-cache',
};

// --- HTML transformation ---

/**
 * Converts <mas-mnemonic ... mnemonic-text="VALUE" ...>...</mas-mnemonic>
 * to      <mas-mnemonic ...>VALUE</mas-mnemonic>
 *
 * - Skips empty mnemonic-text attributes
 * - Skips elements that already have text content matching the attribute value
 * - Handles mnemonic-text appearing anywhere in the opening tag
 *
 * @param {string} html
 * @returns {{ html: string, changed: boolean }}
 */
function transformHtml(html) {
    if (!html || !html.includes('mnemonic-text=')) return { html, changed: false };

    // Match opening tag + content + closing tag for mas-mnemonic
    // Handles multi-line content (s flag)
    const pattern = /<mas-mnemonic((?:[^>]|"[^"]*"|'[^']*')*?)>([\s\S]*?)<\/mas-mnemonic>/g;

    let changed = false;

    const result = html.replace(pattern, (match, attrs, innerContent) => {
        // Extract mnemonic-text value
        const mnemonicTextMatch = /\smnemonic-text="([^"]*)"/.exec(attrs);
        if (!mnemonicTextMatch) return match; // no mnemonic-text attr

        const mnemonicText = mnemonicTextMatch[1].trim();
        if (!mnemonicText) return match; // empty — skip

        // If text content already present and matches, just strip the attribute
        const trimmedInner = innerContent.trim();

        // Remove mnemonic-text attribute from attrs (including leading space)
        const newAttrs = attrs.replace(/\s+mnemonic-text="[^"]*"/, '');

        // Determine final text content
        const textContent = trimmedInner || mnemonicText;

        changed = true;
        return `<mas-mnemonic${newAttrs}>${textContent}</mas-mnemonic>`;
    });

    return { html: result, changed };
}

// --- AEM API helpers ---

async function fetchJson(url, options = {}) {
    const response = await fetch(url, { headers: HEADERS, ...options });
    if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(`HTTP ${response.status} ${response.statusText}: ${url}\n${body}`);
    }
    return response;
}

async function getFragmentById(id) {
    const res = await fetchJson(`${CF_URL}/${id}`);
    const etag = res.headers.get('Etag') || res.headers.get('etag');
    const fragment = await res.json();
    return { ...fragment, etag };
}

async function getFragmentByPath(path) {
    const params = new URLSearchParams({ path });
    const res = await fetchJson(`${CF_URL}?${params}`);
    const { items } = await res.json();
    if (!items?.length) throw new Error(`Fragment not found at path: ${path}`);
    return items[0];
}

async function saveFragment(fragment) {
    const { id, etag, title, description, fields } = fragment;

    const fieldsWithType = (fields || []).map((f) => ({
        ...f,
        type: f.type || 'text',
    }));

    const res = await fetch(`${CF_URL}/${id}`, {
        method: 'PUT',
        headers: {
            ...HEADERS,
            'If-Match': etag,
        },
        body: JSON.stringify({ title, description, fields: fieldsWithType }),
    });

    if (res.status === 412) {
        throw new ETagConflict('ETag conflict');
    }
    if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`PUT failed ${res.status}: ${body}`);
    }
    return res;
}

class ETagConflict extends Error {}

// --- Fragment processing ---

/**
 * Processes a single fragment: transforms HTML fields and optionally saves.
 * Returns a result object describing what was found/changed.
 */
async function processFragment(fragment) {
    const { id, title, fields, path } = fragment;
    const result = { id, path: path || '', title: title || id, fieldsChanged: [], skipped: false, error: null };

    if (!fields?.length) {
        result.skipped = true;
        return result;
    }

    if (DEBUG) {
        console.log(`  [debug] fields:`);
        fields.forEach((f) => console.log(`    name=${f.name} type=${f.type} values=${JSON.stringify(f.values?.slice(0, 1))}`));
    }

    // Check all fields with string values — AEM richtext type may vary ('text', 'html', 'richtext', etc.)
    // Returns transformed fields and the names of changed fields.
    const applyTransform = (sourceFields, tracking) =>
        sourceFields.map((field) => {
            const updatedValues = (field.values || []).map((val) => {
                if (typeof val !== 'string') return val;
                const { html, changed } = transformHtml(val);
                if (changed && tracking) tracking.push(field.name);
                return html;
            });
            return { ...field, values: updatedValues };
        });

    // Dry-check against snapshot to decide whether to skip
    applyTransform(fields, result.fieldsChanged);

    if (!result.fieldsChanged.length) {
        result.skipped = true;
        return result;
    }

    if (!APPLY) return result; // dry-run

    // Apply: re-fetch fresh fragment so we transform the latest content (not the stale snapshot),
    // avoiding silent overwrites if the fragment was edited between search and PUT.
    try {
        const fresh = await getFragmentById(id);
        const toSave = { ...fresh, fields: applyTransform(fresh.fields) };
        await saveFragment(toSave);
    } catch (err) {
        if (err instanceof ETagConflict) {
            // Retry once — re-fetch again to get the latest ETag and content
            try {
                const fresh = await getFragmentById(id);
                const toSave = { ...fresh, fields: applyTransform(fresh.fields) };
                await saveFragment(toSave);
            } catch (retryErr) {
                result.error = `ETag retry failed: ${retryErr.message}`;
            }
        } else {
            result.error = err.message;
        }
    }

    return result;
}

// --- Search with cursor pagination ---

async function* searchFragmentsWithMnemonicText(path) {
    const filter = {
        fullText: {
            text: encodeURIComponent('mnemonic-text'),
            queryMode: 'EDGES',
        },
    };
    if (path) filter.path = path;

    const query = JSON.stringify({ filter, sort: [{ on: 'created', order: 'DESC' }] });
    const params = new URLSearchParams({ query, limit: 50 });

    while (true) {
        const res = await fetchJson(`${CF_SEARCH}?${params}`);
        const { items, cursor } = await res.json();
        if (items?.length) yield items;
        if (!cursor) break;
        params.set('cursor', cursor);
    }
}

// --- Main ---

async function main() {
    log(`Mode: ${APPLY ? 'APPLY' : 'DRY-RUN'}`);
    log(`Host: ${HOST}`);

    const stats = { total: 0, converted: 0, skipped: 0, errors: 0 };

    if (SINGLE_FRAGMENT) {
        // Single-fragment mode
        log(`\nProcessing single fragment: ${SINGLE_FRAGMENT}`);
        let raw;
        if (UUID_RE.test(SINGLE_FRAGMENT)) {
            raw = await getFragmentById(SINGLE_FRAGMENT);
        } else {
            const found = await getFragmentByPath(SINGLE_FRAGMENT);
            raw = await getFragmentById(found.id);
        }

        const result = await processFragment(raw);
        stats.total = 1;

        if (result.error) {
            stats.errors++;
            logError(`  ✗ ERROR: ${result.error}`);
        } else if (result.skipped) {
            stats.skipped++;
            log(`  — No mnemonic-text found`);
        } else {
            stats.converted++;
            const action = APPLY ? '✓ Saved' : '~ Would update';
            log(`  ${action}: fields [${result.fieldsChanged.join(', ')}]`);
        }
    } else {
        // Bulk mode: search per computed path (surface × locale combinations)
        for (const path of searchPaths) {
            log(`\nSearching: ${path}`);

            for await (const batch of searchFragmentsWithMnemonicText(path)) {
                for (const fragment of batch) {
                    stats.total++;
                    const result = await processFragment(fragment);

                    if (result.error) {
                        stats.errors++;
                        logError(`  ✗ [${result.id}] ${result.title}: ${result.error}`);
                        recordCsv(result.id, result.path, result.title, 'error', '', result.error);
                    } else if (result.skipped) {
                        stats.skipped++;
                        if (!NO_SKIPPED) {
                            recordCsv(result.id, result.path, result.title, 'skipped', '', 'no mnemonic-text found');
                        }
                    } else {
                        stats.converted++;
                        const action = APPLY ? '✓' : '~';
                        log(`  ${action} [${result.id}] ${result.title} — fields: ${result.fieldsChanged.join(', ')}`);
                        recordCsv(
                            result.id,
                            result.path,
                            result.title,
                            APPLY ? 'converted' : 'would-convert',
                            result.fieldsChanged.join(';'),
                            '',
                        );
                    }
                }
            }
        }
    }

    log(`
=== Report ===
Total found : ${stats.total}
Converted   : ${stats.converted}${APPLY ? '' : ' (dry-run — not saved)'}
Skipped     : ${stats.skipped}
Errors      : ${stats.errors}
`);

    csvStream?.end();
    logStream?.end();
    if (stats.errors > 0) process.exit(1);
}

main().catch((err) => {
    logError('Fatal:', err.message);
    process.exit(1);
});
