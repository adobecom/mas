/**
 * Pure computation over the inventory file — reads one
 * JSON file and writes another. Every target tag set comes from `pzn-tag-mapping.mjs`, the same
 * module the applier uses, so the report and the write can never drift apart. The report IS the
 * rollback plan: its `currentTags` column is the exact restore target per fragment, replayed by
 * `pzn-tag-applier.mjs --revert` — keep it. Output goes to this folder's own gitignored `tmp/`
 * directory.
 *
 * Usage:
 *   node pzn-tag-diff-report.mjs --inventory ./tmp/mas-pzn-tag-inventory-acom.json
 *   node pzn-tag-diff-report.mjs --inventory <file> --out /tmp/pzn-diff-report.json
 *
 * Exit codes: 0 = report written, 1 = bad usage / fatal error.
 */

import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from '../content/common.js';
import { matchesGeo } from '../../io/www/src/fragment/utils/common.js';
import {
    BLOCKING_FLAGS,
    FLAGS,
    RULES,
    LOCALE_TO_COUNTRY_MARKETS,
    UMBRELLA_ONLY_SURFACES,
    applyBoth,
    parseCountryTag,
} from './pzn-tag-mapping.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '../..');
const OUTPUT_DIR = resolve(SCRIPT_DIR, 'tmp');
const EN_US_TREE = 'en_US';

const { getFlag } = parseArgs(process.argv);

const inventoryFile = getFlag('--inventory');

if (!inventoryFile) {
    console.error('Usage: node pzn-tag-diff-report.mjs --inventory <inventory.json> [--out <file>]');
    process.exit(1);
}

const parentPath = (record) => `/content/dam/mas/${record.surface}/${record.locale}/${record.productArrangementCode}`;
const driftKey = (record) => `${record.surface}|${record.productArrangementCode}|${record.name}`;

function buildRow(record, driftedGroups, knownCountries) {
    // Umbrella children are registered only as en_US regions, so expansion is en_US-tree-only.
    const result = applyBoth(record.pznTags, {
        locale: record.locale,
        applyUmbrella: record.locale === EN_US_TREE,
        runLocaleToCountry: !UMBRELLA_ONLY_SURFACES.includes(record.surface),
    });
    const current = record.pznTags ?? [];
    const target = result.tags;
    const added = target.filter((tag) => !current.includes(tag));
    const removed = current.filter((tag) => !target.includes(tag));
    const flags = new Set(result.flags);

    if (driftedGroups.has(driftKey(record))) flags.add(FLAGS.TAG_DRIFT);
    if (knownCountries) {
        const missing = added.map(parseCountryTag).filter((country) => country && !knownCountries.has(country));
        if (missing.length) flags.add(FLAGS.TAG_MISSING);
    }

    return {
        surface: record.surface,
        locale: record.locale,
        parentFragmentPath: parentPath(record),
        parentFragmentId: record.parentFragmentId,
        variationPath: record.path,
        variationId: record.id,
        variant: record.variant,
        currentTags: current,
        targetTags: target,
        added,
        removed,
        rule: result.rule,
        flags: [...flags],
        etag: record.etag, // fragment's version at the inventory snapshot time, for rollback
        markets: result.localeToCountry.markets,
        // Batching key for the applier: localeToCountry markets plus the countries an umbrellaExpansion
        // adds, so a purely additive umbrella row still belongs to a market batch.
        batchMarkets: [...new Set([...result.localeToCountry.markets, ...added.map(parseCountryTag).filter(Boolean)])],
        demotedLocales: result.localeToCountry.mapped.map((entry) => entry.locale),
    };
}

/**
 * Cross-variation flags, which only exist relative to a row's siblings under the same parent:
 *  - COLLISION: two different variations of one parent collapse onto the same country tag. Score-10
 *    tie, resolved by reference order — never auto-resolve, escalate.
 *  - SCORE_DEMOTION_RISK: this row drops a locale tag from 20 to 10 while a sibling keeps a tag that
 *    still region-matches the same locale, so the sibling now outranks it.
 */
function addCrossVariationFlags(rows) {
    const byParent = new Map();
    for (const row of rows) {
        if (!byParent.has(row.parentFragmentPath)) byParent.set(row.parentFragmentPath, []);
        byParent.get(row.parentFragmentPath).push(row);
    }
    for (const siblings of byParent.values()) {
        const claimants = new Map();
        for (const row of siblings) {
            for (const market of row.markets) {
                if (!claimants.has(market)) claimants.set(market, new Set());
                claimants.get(market).add(row.variationId);
            }
        }
        for (const row of siblings) {
            if (row.markets.some((market) => claimants.get(market).size > 1)) row.flags.push(FLAGS.COLLISION);
            const outranked = row.demotedLocales.some((localeCode) =>
                siblings.some(
                    (other) =>
                        other.variationId !== row.variationId &&
                        matchesGeo(other.targetTags, { regionLocale: localeCode })?.region,
                ),
            );
            if (outranked) row.flags.push(FLAGS.SCORE_DEMOTION_RISK);
            row.flags = [...new Set(row.flags)];
        }
    }
}

function groupByParentFragment(rows) {
    const groups = new Map();
    for (const row of rows) {
        if (!groups.has(row.parentFragmentPath)) {
            groups.set(row.parentFragmentPath, { parentFragmentPath: row.parentFragmentPath, rows: [], flags: [] });
        }
        groups.get(row.parentFragmentPath).rows.push(row);
    }
    for (const group of groups.values()) {
        group.flags = [...new Set(group.rows.flatMap((row) => row.flags))];
        group.changing = group.rows.filter((row) => row.rule !== RULES.NOOP).length;
    }
    return [...groups.values()].sort((a, b) => a.parentFragmentPath.localeCompare(b.parentFragmentPath));
}

function groupByMarket(rows) {
    const groups = new Map();
    for (const row of rows) {
        for (const market of row.batchMarkets) {
            if (!groups.has(market)) groups.set(market, { market, rows: [], flags: [] });
            groups.get(market).rows.push(row);
        }
    }
    for (const group of groups.values()) {
        group.flags = [...new Set(group.rows.flatMap((row) => row.flags))];
    }
    return [...groups.values()].sort((a, b) => a.market.localeCompare(b.market));
}

function printMarketReconciliation(byMarket) {
    const observed = new Set(byMarket.map((group) => group.market));
    const width = Math.max(...LOCALE_TO_COUNTRY_MARKETS.map((m) => m.length), 6);
    console.log('\nMarket reconciliation (plan §3 list vs. what the corpus actually carries):');
    console.log(`  ${'PLAN'.padEnd(width)}  CORPUS`);
    for (const market of LOCALE_TO_COUNTRY_MARKETS) {
        const group = byMarket.find((entry) => entry.market === market);
        console.log(`  ${market.padEnd(width)}  ${group ? `${group.rows.length} variation(s)` : '— not found —'}`);
    }
    const extra = [...observed].filter((market) => !LOCALE_TO_COUNTRY_MARKETS.includes(market)).sort();
    if (extra.length)
        console.log(`  Countries touched outside the plan list (umbrellaExpansion children): ${extra.join(', ')}`);
}

async function main() {
    const inventory = JSON.parse(await readFile(resolve(inventoryFile), 'utf8'));

    const surfaceSuffix = inventory.surface ? `-${inventory.surface}` : '';
    const outFile = resolve(getFlag('--out') || `${OUTPUT_DIR}/mas-pzn-tag-diff-report${surfaceSuffix}.json`);
    const insideRepo = outFile === REPO_ROOT || outFile.startsWith(REPO_ROOT + sep);
    const insideOutputDir = outFile === OUTPUT_DIR || outFile.startsWith(OUTPUT_DIR + sep);
    if (insideRepo && !insideOutputDir) {
        console.error(`Refusing to write the report inside the repository: ${outFile}`);
        console.error(
            `Point --out at ${OUTPUT_DIR} or an external scratch directory — this report carries live content paths and etags.`,
        );
        process.exit(1);
    }

    const records = inventory.records ?? [];
    const driftedGroups = new Set((inventory.parents ?? []).filter((p) => p.tagDrift === 'drifted').map((p) => p.key));
    const knownCountries = inventory.taxonomy ? new Set(inventory.taxonomy.existingCountries) : null;

    const rows = records.map((record) => buildRow(record, driftedGroups, knownCountries));
    addCrossVariationFlags(rows);

    const changing = rows.filter((row) => row.rule !== RULES.NOOP);
    const blocked = changing.filter((row) => row.flags.some((flag) => BLOCKING_FLAGS.includes(flag)));
    const byParent = groupByParentFragment(rows);
    const byMarket = groupByMarket(changing);

    const report = {
        generatedAt: new Date().toISOString(),
        inventoryFile: resolve(inventoryFile),
        inventoryGeneratedAt: inventory.generatedAt ?? null,
        authorHost: inventory.authorHost ?? null,
        surface: inventory.surface ?? null,
        totals: {
            variations: rows.length,
            changing: changing.length,
            noop: rows.length - changing.length,
            blocked: blocked.length,
            byRule: Object.fromEntries(
                Object.values(RULES).map((rule) => [rule, rows.filter((row) => row.rule === rule).length]),
            ),
            byFlag: Object.fromEntries(
                Object.values(FLAGS).map((flag) => [flag, rows.filter((row) => row.flags.includes(flag)).length]),
            ),
        },
        rows,
        byParentFragment: byParent,
        byMarket,
    };

    await mkdir(dirname(outFile), { recursive: true });
    await writeFile(outFile, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

    console.log(`Inventory: ${report.inventoryFile}`);
    console.log(
        `Variations: ${rows.length}  changing: ${changing.length}  noop: ${report.totals.noop}  blocked: ${blocked.length}`,
    );
    console.log('\nBy rule:');
    Object.entries(report.totals.byRule).forEach(([rule, count]) => console.log(`  ${rule.padEnd(12)} ${count}`));
    console.log('\nBy flag:');
    Object.entries(report.totals.byFlag).forEach(([flag, count]) => console.log(`  ${flag.padEnd(20)} ${count}`));
    console.log(
        `\nBy parent fragment: ${byParent.length} group(s), ${byParent.filter((g) => g.changing).length} with changes.`,
    );
    printMarketReconciliation(byMarket);
    console.log(`\nWrote ${outFile}`);
    console.log(
        'Review it, then hand it to pzn-tag-applier.mjs --i-have-reviewed <this file>. Keep it: it is the rollback plan.',
    );
}

main().catch((error) => {
    console.error(`\nReport failed: ${error.message}`);
    process.exit(1);
});
