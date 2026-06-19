/**
 * Run bulk-edit find in-process (loads io/studio/.env, uses I/O State cache).
 *
 * Usage:
 *   node scripts/content/bulk-edit-find.mjs --surface acom --find "school"
 *   node scripts/content/bulk-edit-find.mjs --surface acom --find "Buy now" --search-in buttonText
 *   node scripts/content/bulk-edit-find.mjs --surface acom --find "school" --locale en_US,fr_FR
 *   node scripts/content/bulk-edit-find.mjs --surface acom --find "school" --force-refresh
 */

import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs, wait } from './common.js';

const studioDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../io/studio');
const require = createRequire(import.meta.url);

try {
    for (const line of readFileSync(resolve(studioDir, '.env'), 'utf8').split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const i = trimmed.indexOf('=');
        if (i <= 0) continue;
        const key = trimmed.slice(0, i).trim();
        if (process.env[key] === undefined) process.env[key] = trimmed.slice(i + 1).trim();
    }
} catch {
    // io/studio/.env optional if vars are exported
}
if (process.env.AIO_runtime_namespace) process.env.__OW_NAMESPACE ??= process.env.AIO_runtime_namespace;
if (process.env.AIO_runtime_auth) process.env.__OW_API_KEY ??= process.env.AIO_runtime_auth;

const { getFlag, hasFlag } = parseArgs(process.argv);
const surface = getFlag('--surface');
const find = getFlag('--find');
const token = process.env.MAS_TOKEN || process.env.MAS_IMS_TOKEN;
const odinEndpoint = process.env.ODIN_ENDPOINT;

if (!surface || !find || !token || !odinEndpoint) {
    console.error('Usage: node bulk-edit-find.mjs --surface <s> --find <text>');
    console.error(
        '  [--search-in field|f1,f2] [--locale en_US|en_US,fr_FR] [--tags a,b] [--status PUBLISHED] [--match-case] [--force-refresh]',
    );
    console.error('Needs MAS_TOKEN and ODIN_ENDPOINT in io/studio/.env (plus AIO_runtime_* for I/O State).');
    process.exit(1);
}

function splitCsv(value) {
    if (value == null || value === '') return null;
    if (!value.includes(',')) return value;
    return value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
}

const bulkEdit = require(resolve(studioDir, 'src/bulk-edit/bulk-edit.js'));
const findWorker = require(resolve(studioDir, 'src/bulk-edit/find-worker.js'));
const { readJob, writeJob, patchJob, JOB_TTL } = require(resolve(studioDir, 'src/bulk-edit/state.js'));

const searchKey = {
    type: 'find',
    find,
    surface,
    searchIn: bulkEdit.normalizeSearchInKey(splitCsv(getFlag('--search-in')) ?? '*'),
    matchCase: hasFlag('--match-case'),
    status: getFlag('--status') || null,
    locale: bulkEdit.normalizeLocalesKey(splitCsv(getFlag('--locale'))),
    tags: (() => {
        const raw = splitCsv(getFlag('--tags'));
        if (!raw) return [];
        return Array.isArray(raw) ? raw : [raw];
    })(),
};

const forceRefresh = hasFlag('--force-refresh');
const jobId = bulkEdit.computeJobId(searchKey);

function formatOutput(job, { reused = false, status, total, truncated } = {}) {
    return {
        jobId,
        reused,
        status: status ?? job?.status,
        total: total ?? job?.total ?? 0,
        truncated: truncated ?? !!job?.truncated,
        done: (status ?? job?.status) === 'DONE' || (status ?? job?.status) === 'CANCELLED',
        items: job?.results ?? [],
    };
}

async function waitForJob(id) {
    while (true) {
        const job = await readJob(id);
        if (!job) throw new Error(`bulk-edit job ${id} not found`);
        if (job.status === 'DONE' || job.status === 'CANCELLED' || job.status === 'FAILED') return job;
        process.stderr.write(`\rwaiting… ${job.total ?? 0} matches`);
        await wait(500);
    }
}

let existing = await readJob(jobId);

if (forceRefresh && existing?.status === 'RUNNING' && !existing.cancelled) {
    await patchJob(jobId, { cancelled: true });
    existing = await readJob(jobId);
}

if (!forceRefresh && existing && !existing.cancelled && (existing.status === 'RUNNING' || existing.status === 'DONE')) {
    console.error(`jobId: ${jobId} (cached, ttl ${JOB_TTL}s)`);
    const job = existing.status === 'RUNNING' ? await waitForJob(jobId) : existing;
    if (job.status === 'FAILED') {
        console.error(job.error || 'search failed');
        process.exit(1);
    }
    console.log(JSON.stringify(formatOutput(job, { reused: true }), null, 2));
    process.exit(0);
}

await writeJob(jobId, {
    type: 'find',
    params: searchKey,
    status: 'RUNNING',
    results: [],
    total: 0,
    requestedAt: new Date().toISOString(),
});

console.error(`jobId: ${jobId}`);
const { statusCode, body } = await findWorker.main({ jobId, odinEndpoint, authToken: token });
if (statusCode !== 200) {
    console.error(body?.error || body);
    process.exit(1);
}

const job = await readJob(jobId);
console.log(JSON.stringify(formatOutput(job, { reused: false, ...body }), null, 2));
