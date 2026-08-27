/**
 * Applies a `pzn-tag-diff-report.mjs` report to the live author environment.
 * Should NEVER be run by agents, only by humans, as it changes production content.
 *
 * Guardrails:
 *   - dry-run is the DEFAULT; `--live` is the only way to issue a write
 *   - `--author-host` is required and has NO default value anywhere in this file
 *   - `--i-have-reviewed ./tmp/mas-pzn-tag-inventory-acom.json` is required and must name a report that exists on disk;
 *     that file is also the input, so you cannot review one report and apply another
 *   - `--markets <CC,...>` is required: batches are one market wide (blast-radius control).
 *   - every fragment is re-fetched before writing; its live etag must equal the report's etag and
 *     its live `pznTags` must equal the report's `currentTags`, or the row is skipped as drifted
 *   - `createFragmentVersion` runs before every PUT (the primary rollback)
 *   - every PUT sends `If-Match: <etag>`
 *   - rows carrying a blocking flag are skipped unless explicitly allowed via `--allow-flags`
 *
 * Rollback: `--revert ./tmp/mas-pzn-tag-inventory-acom.json` replays the report's `currentTags` backwards. Revert
 * verifies the live tags still equal the report's `targetTags` before restoring, so it cannot
 * clobber an edit someone made after the forward pass.
 *
 * Publishing is NOT done here. A tag change does not reach runtime until the parent fragment is
 * republished with the `/pzn/` variation reference checked (§6.6).
 *
 * Auth:
 *   export MAS_IMS_TOKEN=<token>
 *   export MAS_API_KEY=mas-studio
 *
 * Usage:
 *   node pzn-tag-applier.mjs --author-host <host> --i-have-reviewed <report.json> --markets EC
 *   node pzn-tag-applier.mjs --author-host <host> --i-have-reviewed <report.json> --markets EC --live
 *   node pzn-tag-applier.mjs --author-host <host> --i-have-reviewed <report.json> --revert <report.json> --markets EC --live
 *
 * Exit codes: 0 = clean, 1 = bad usage / fatal error, 2 = one or more rows failed or drifted.
 */

import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHeaders, parseArgs, wait } from '../content/common.js';
import { BLOCKING_FLAGS, RULES } from './pzn-tag-mapping.mjs';

const THROTTLE_MS = 1000;

const { getFlag, hasFlag } = parseArgs(process.argv);

const authorHost = getFlag('--author-host');
const revertFile = getFlag('--revert');
const reviewedFile = getFlag('--i-have-reviewed');
const marketsArg = getFlag('--markets');
const live = hasFlag('--live');
const allowedFlags = new Set(
    (getFlag('--allow-flags') ?? '')
        .split(',')
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean),
);
const token = process.env.MAS_IMS_TOKEN;
const apiKey = process.env.MAS_API_KEY || 'mas-studio';

const usage = () =>
    console.error(
        'Usage: MAS_IMS_TOKEN=<token> node pzn-tag-applier.mjs --author-host <host> --i-have-reviewed <report.json> --markets <CC,...> [--live] [--revert <same report.json>] [--allow-flags FLAG,FLAG]',
    );

if (!authorHost) {
    console.error('--author-host is required and has no default. Name the environment you intend to write to.');
    usage();
    process.exit(1);
}
if (!reviewedFile) {
    console.error('--i-have-reviewed <report-file> is required: apply only a diff report you have actually read.');
    usage();
    process.exit(1);
}
if (!existsSync(resolve(reviewedFile))) {
    console.error(`Report file not found: ${resolve(reviewedFile)}`);
    process.exit(1);
}
if (revertFile && resolve(revertFile) !== resolve(reviewedFile)) {
    console.error('--revert and --i-have-reviewed name different files. Revert the report you reviewed.');
    process.exit(1);
}
if (!marketsArg) {
    console.error('--markets <CC,...> is required: batch one market at a time, verify, then move on (plan §8).');
    usage();
    process.exit(1);
}
if (!token) {
    console.error('MAS_IMS_TOKEN is required.');
    process.exit(1);
}

const markets = new Set(
    marketsArg
        .split(',')
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean),
);
const baseUrl = `https://${authorHost}`;
const headers = createHeaders(token, apiKey);
const cfUrl = `${baseUrl}/adobe/sites/cf/fragments`;
const reverting = Boolean(revertFile);

const sameTags = (a, b) => a.length === b.length && a.every((tag, index) => tag === b[index]);

async function fetchFragment(id) {
    const response = await fetch(`${cfUrl}/${id}`, { headers });
    if (!response.ok) {
        throw new Error(`GET ${id} failed: ${response.status} ${response.statusText}`);
    }
    const fragment = await response.json();
    fragment.etag = response.headers.get('Etag');
    return fragment;
}

async function createVersion(id, label) {
    const response = await fetch(`${cfUrl}/${id}/versions`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ label, comment: 'MWPW-203042 pznTags migration — pre-change snapshot' }),
    });
    if (!response.ok) {
        throw new Error(`Version snapshot failed: ${response.status} ${response.statusText}`);
    }
    return (response.headers.get('Location') ?? '').split('/').pop();
}

async function putTags(fragment, tags) {
    const fields = fragment.fields.map((field) =>
        field.name === 'pznTags'
            ? { ...field, type: field.type || 'text', values: tags }
            : { ...field, type: field.type || 'text' },
    );
    const response = await fetch(`${cfUrl}/${fragment.id}`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json', 'If-Match': fragment.etag },
        body: JSON.stringify({ title: fragment.title, description: fragment.description, fields }),
    });
    if (response.status === 412) {
        throw new Error('etag conflict (412) — fragment was modified by someone else');
    }
    if (!response.ok) {
        throw new Error(`PUT failed: ${response.status} ${response.statusText}`);
    }
}

function selectRows(report) {
    const rows = (report.rows ?? []).filter((row) => row.rule !== RULES.NOOP);
    const inBatch = rows.filter((row) => (row.batchMarkets ?? row.markets ?? []).some((market) => markets.has(market)));
    const skipped = [];
    const selected = [];
    for (const row of inBatch) {
        const blocking = (row.flags ?? []).filter((flag) => BLOCKING_FLAGS.includes(flag) && !allowedFlags.has(flag));
        if (blocking.length) skipped.push({ row, reason: `blocking flag(s): ${blocking.join(', ')}` });
        else selected.push(row);
    }
    return { rows, inBatch, selected, skipped };
}

async function applyRow(row) {
    const expected = reverting ? row.targetTags : row.currentTags;
    const next = reverting ? row.currentTags : row.targetTags;
    const fragment = await fetchFragment(row.variationId);
    const liveTags = fragment.fields?.find((field) => field.name === 'pznTags')?.values ?? [];

    if (!sameTags(liveTags, expected)) {
        return { status: 'drifted', detail: `live tags [${liveTags.join(', ')}] != expected [${expected.join(', ')}]` };
    }
    // Forward passes additionally pin the etag recorded at inventory time; a revert cannot, because
    // the forward pass itself changed it — the tag equality check above is the revert's guard.
    if (!reverting && row.etag && fragment.etag !== row.etag) {
        return { status: 'drifted', detail: `etag moved since the report was generated (${row.etag} → ${fragment.etag})` };
    }
    if (sameTags(liveTags, next)) {
        return { status: 'already-applied', detail: 'live tags already match the target' };
    }
    if (!live) {
        return { status: 'dry-run', detail: `[${liveTags.join(', ')}] → [${next.join(', ')}]` };
    }

    const versionId = await createVersion(fragment.id, `MWPW-203042-${reverting ? 'revert' : 'apply'}`);
    await putTags(fragment, next);
    return { status: 'written', detail: `version ${versionId} → [${next.join(', ')}]` };
}

async function main() {
    const report = JSON.parse(await readFile(resolve(reviewedFile), 'utf8'));
    const { rows, inBatch, selected, skipped } = selectRows(report);

    console.log(`Author:  ${baseUrl}`);
    console.log(`Report:  ${resolve(reviewedFile)} (generated ${report.generatedAt ?? 'unknown'})`);
    console.log(`Mode:    ${reverting ? 'REVERT' : 'APPLY'} — ${live ? 'LIVE (writes enabled)' : 'dry-run (no writes)'}`);
    console.log(`Markets: ${[...markets].join(', ')}`);
    if (report.authorHost && report.authorHost !== authorHost && !hasFlag('--allow-host-mismatch')) {
        console.error(
            `Report was generated against ${report.authorHost}, you are writing to ${authorHost}. Pass --allow-host-mismatch to override.`,
        );
        process.exit(1);
    }
    if (report.authorHost && report.authorHost !== authorHost) {
        console.log(`WARNING: report was generated against ${report.authorHost}, you are writing to ${authorHost}.`);
    }
    console.log(`Rows:    ${rows.length} changing in report, ${inBatch.length} in this batch, ${selected.length} eligible.\n`);

    for (const { row, reason } of skipped) {
        console.log(`  SKIP     ${row.variationPath}  (${reason})`);
    }

    const counts = { written: 0, 'dry-run': 0, drifted: 0, 'already-applied': 0, failed: 0 };
    for (const row of selected) {
        try {
            const { status, detail } = await applyRow(row);
            counts[status] += 1;
            console.log(`  ${status.toUpperCase().padEnd(15)} ${row.variationPath}  ${detail}`);
        } catch (error) {
            counts.failed += 1;
            console.log(`  FAILED          ${row.variationPath}  ${error.message}`);
        }
        await wait(THROTTLE_MS);
    }

    console.log(
        `\nwritten=${counts.written} dry-run=${counts['dry-run']} already-applied=${counts['already-applied']} drifted=${counts.drifted} failed=${counts.failed} skipped=${skipped.length}`,
    );
    if (!live) {
        console.log('Dry run only — nothing was written. Re-run with --live once the plan above looks right.');
    } else if (counts.written) {
        console.log(
            'Publish the parent fragments with the /pzn/ variation reference CHECKED, or the change never reaches runtime.',
        );
        console.log(
            `Rollback: node pzn-tag-applier.mjs --author-host ${authorHost} --i-have-reviewed ${resolve(reviewedFile)} --revert ${resolve(reviewedFile)} --markets ${[...markets].join(',')} --live`,
        );
    }
    if (counts.failed || counts.drifted) process.exit(2);
}

main().catch((error) => {
    console.error(`\nApplier failed: ${error.message}`);
    process.exit(1);
});
