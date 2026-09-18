/**
 * Pure computation over the inventory file — reads one JSON file and writes another. Every
 * target tag comes from `pzn-prefix-mapping.mjs`, the same module the applier uses, so the
 * report and the write can never drift apart. The report IS the rollback plan: its `currentTags`
 * column is the exact restore target per (fragment, source), replayed by
 * `pzn-prefix-applier.mjs --revert` — keep it. Output goes to this folder's own gitignored `tmp/`
 * directory.
 *
 * Usage:
 *   node pzn-prefix-diff-report.mjs --inventory ./tmp/mas-pzn-prefix-inventory-acom.json
 *   node pzn-prefix-diff-report.mjs --inventory <file> --out /tmp/pzn-prefix-diff-report.json
 *
 * Exit codes: 0 = report written, 1 = bad usage / fatal error.
 */

import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from '../content/common.js';
import { BLOCKING_FLAGS, FLAGS, RULES, applyPrefixRename } from './pzn-prefix-mapping.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '../..');
const OUTPUT_DIR = resolve(SCRIPT_DIR, 'tmp');

const parentFragmentPath = (record) => `/content/dam/mas/${record.surface}/${record.locale}/${record.productArrangementCode}`;
const driftKey = (record) => `${record.surface}|${record.productArrangementCode}|${record.name}|${record.sourceField}`;

export function buildRow(record, driftedGroups, knownTagIds) {
    const result = applyPrefixRename(record.tags);
    const current = record.tags ?? [];
    const target = result.tags;
    const added = target.filter((tag) => !current.includes(tag));
    const removed = current.filter((tag) => !target.includes(tag));
    const flags = new Set();

    if (driftedGroups.has(driftKey(record))) flags.add(FLAGS.TAG_DRIFT);
    if (knownTagIds) {
        const missing = added.filter((tag) => !knownTagIds.has(tag));
        if (missing.length) flags.add(FLAGS.TAG_MISSING);
    }

    return {
        surface: record.surface,
        locale: record.locale,
        sourceField: record.sourceField,
        parentFragmentPath: parentFragmentPath(record),
        parentFragmentId: record.parentFragmentId,
        fragmentPath: record.path,
        fragmentId: record.id,
        currentTags: current,
        targetTags: target,
        added,
        removed,
        rule: result.rule,
        flags: [...flags],
        etag: record.etag, // fragment's version at the inventory snapshot time, for rollback
    };
}

export function groupByParentFragment(rows) {
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

/** Groups changing rows by the target tag they add — the applier's `--tags` batching key. */
export function groupByTargetTag(rows) {
    const groups = new Map();
    for (const row of rows) {
        for (const tag of row.added) {
            if (!groups.has(tag)) groups.set(tag, { tag, rows: [], flags: [] });
            groups.get(tag).rows.push(row);
        }
    }
    for (const group of groups.values()) {
        group.flags = [...new Set(group.rows.flatMap((row) => row.flags))];
    }
    return [...groups.values()].sort((a, b) => a.tag.localeCompare(b.tag));
}

/**
 * Pure computation over an inventory object — every field but `generatedAt` and `inventoryFile`,
 * which the caller (`main`) fills in since they depend on wall-clock time and the input path.
 */
export function buildReport(inventory) {
    const records = inventory.records ?? [];
    const driftedGroups = new Set((inventory.parents ?? []).filter((p) => p.tagDrift === 'drifted').map((p) => p.key));
    const knownTagIds = inventory.taxonomy ? new Set(inventory.taxonomy.existingTagIds) : null;

    const rows = records.map((record) => buildRow(record, driftedGroups, knownTagIds));

    const changing = rows.filter((row) => row.rule !== RULES.NOOP);
    const blocked = changing.filter((row) => row.flags.some((flag) => BLOCKING_FLAGS.includes(flag)));
    const byParentFragment = groupByParentFragment(rows);
    const byTargetTag = groupByTargetTag(changing);

    return {
        inventoryGeneratedAt: inventory.generatedAt ?? null,
        authorHost: inventory.authorHost ?? null,
        surface: inventory.surface ?? null,
        totals: {
            rows: rows.length,
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
        byParentFragment,
        byTargetTag,
    };
}

/**
 * Runs the diff-report step: reads the inventory file, computes the report via `buildReport`, and
 * writes the JSON output. All mutable state lives in this function's own scope — nothing is
 * shared at module level — so importing this module for its pure helpers above never triggers
 * `process.exit`.
 */
export async function run({ inventoryFile, outFile: outFileArg }) {
    const inventory = JSON.parse(await readFile(resolve(inventoryFile), 'utf8'));

    const surfaceSuffix = inventory.surface ? `-${inventory.surface}` : '';
    const outFile = resolve(outFileArg || `${OUTPUT_DIR}/mas-pzn-prefix-diff-report${surfaceSuffix}.json`);
    const insideRepo = outFile === REPO_ROOT || outFile.startsWith(REPO_ROOT + sep);
    const insideOutputDir = outFile === OUTPUT_DIR || outFile.startsWith(OUTPUT_DIR + sep);
    if (insideRepo && !insideOutputDir) {
        console.error(`Refusing to write the report inside the repository: ${outFile}`);
        console.error(
            `Point --out at ${OUTPUT_DIR} or an external scratch directory — this report carries live content paths and etags.`,
        );
        process.exit(1);
    }

    const report = {
        generatedAt: new Date().toISOString(),
        inventoryFile: resolve(inventoryFile),
        ...buildReport(inventory),
    };
    const { totals, byParentFragment: byParent, byTargetTag } = report;

    await mkdir(dirname(outFile), { recursive: true });
    await writeFile(outFile, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

    console.log(`Inventory: ${report.inventoryFile}`);
    console.log(`Rows: ${totals.rows}  changing: ${totals.changing}  noop: ${totals.noop}  blocked: ${totals.blocked}`);
    console.log('\nBy rule:');
    Object.entries(totals.byRule).forEach(([rule, count]) => console.log(`  ${rule.padEnd(16)} ${count}`));
    console.log('\nBy flag:');
    Object.entries(totals.byFlag).forEach(([flag, count]) => console.log(`  ${flag.padEnd(16)} ${count}`));
    console.log(
        `\nBy parent fragment: ${byParent.length} group(s), ${byParent.filter((g) => g.changing).length} with changes.`,
    );
    console.log('\nBy target tag (applier --tags batching key):');
    byTargetTag.forEach((group) => console.log(`  ${group.tag.padEnd(28)} ${group.rows.length} row(s)`));
    console.log(`\nWrote ${outFile}`);
    console.log(
        'Review it, then hand it to pzn-prefix-applier.mjs --i-have-reviewed <this file>. Keep it: it is the rollback plan.',
    );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const { getFlag } = parseArgs(process.argv);
    const inventoryFile = getFlag('--inventory');

    if (!inventoryFile) {
        console.error('Usage: node pzn-prefix-diff-report.mjs --inventory <inventory.json> [--out <file>]');
        process.exit(1);
    }

    run({ inventoryFile, outFile: getFlag('--out') }).catch((error) => {
        console.error(`\nReport failed: ${error.message}`);
        process.exit(1);
    });
}
