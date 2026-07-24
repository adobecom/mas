const zlib = require('zlib');
const stateLib = require('@adobe/aio-lib-state');
const { init } = stateLib;

const JOB_RUNNING_TTL = 30 * 60;
const JOB_CACHE_TTL = 7 * 24 * 60 * 60;
const USER_CSV_TTL = JOB_CACHE_TTL;
const JOB_TTL = JOB_RUNNING_TTL;
let statePromise;

function getState() {
    statePromise ||= init();
    return statePromise;
}

function buildJobKey(jobId) {
    return `bulk-edit.${jobId}`;
}

function buildUserCsvKey(jobId) {
    return `bulk-edit.${jobId}.csv`;
}

function buildReportKey(jobId) {
    return `bulk-edit.${jobId}.report`;
}

function buildDryRunKey(jobId) {
    return `bulk-edit.${jobId}.dry-run`;
}

function buildResultsKey(jobId) {
    return `bulk-edit.${jobId}.results`;
}

function encodeStateValue(value) {
    return zlib.brotliCompressSync(JSON.stringify(value)).toString('base64');
}

function decodeStateValue(raw) {
    return JSON.parse(zlib.brotliDecompressSync(Buffer.from(raw, 'base64')).toString());
}

async function writeJob(jobId, value, ttl = JOB_RUNNING_TTL) {
    const state = await getState();
    await state.put(buildJobKey(jobId), encodeStateValue(value), { ttl });
    return value;
}

async function readJob(jobId) {
    const state = await getState();
    const result = await state.get(buildJobKey(jobId));
    if (!result?.value) return null;
    return decodeStateValue(result.value);
}

async function patchJob(jobId, patch, ttl = JOB_RUNNING_TTL) {
    const current = (await readJob(jobId)) || {};
    return writeJob(jobId, { ...current, ...patch }, ttl);
}

async function writeUserCsv(jobId, value, ttl = USER_CSV_TTL) {
    const state = await getState();
    await state.put(buildUserCsvKey(jobId), JSON.stringify(value), { ttl });
    return value;
}

async function readUserCsv(jobId) {
    const state = await getState();
    const result = await state.get(buildUserCsvKey(jobId));
    if (!result?.value) return null;
    return JSON.parse(result.value);
}

async function deleteUserCsv(jobId) {
    const state = await getState();
    await state.delete(buildUserCsvKey(jobId));
}

async function writeReport(jobId, value, ttl = JOB_CACHE_TTL) {
    const state = await getState();
    await state.put(buildReportKey(jobId), JSON.stringify(value), { ttl });
    return value;
}

async function readReport(jobId) {
    const state = await getState();
    const result = await state.get(buildReportKey(jobId));
    if (!result?.value) return null;
    return JSON.parse(result.value);
}

async function writeDryRun(jobId, value, ttl = JOB_CACHE_TTL) {
    const state = await getState();
    await state.put(buildDryRunKey(jobId), encodeStateValue(value), { ttl });
    return value;
}

async function readDryRun(jobId) {
    const state = await getState();
    const result = await state.get(buildDryRunKey(jobId));
    if (!result?.value) return null;
    return decodeStateValue(result.value);
}

async function writeResults(jobId, items, ttl = JOB_CACHE_TTL) {
    const state = await getState();
    await state.put(buildResultsKey(jobId), encodeStateValue(items || []), { ttl });
    return items;
}

async function readResults(jobId) {
    const state = await getState();
    const result = await state.get(buildResultsKey(jobId));
    if (!result?.value) return null;
    return decodeStateValue(result.value);
}

async function touchJobCache(jobId, job) {
    const ttl = JOB_CACHE_TTL;
    await writeJob(jobId, job, ttl);
    const [results, report, dryRun, userCsv] = await Promise.all([
        readResults(jobId),
        readReport(jobId),
        readDryRun(jobId),
        job.type !== 'replace' ? readUserCsv(jobId) : null,
    ]);
    await Promise.all([
        results?.length ? writeResults(jobId, results, ttl) : null,
        report ? writeReport(jobId, report, ttl) : null,
        dryRun?.length ? writeDryRun(jobId, dryRun, ttl) : null,
        userCsv ? writeUserCsv(jobId, userCsv, ttl) : null,
    ]);
}

module.exports = {
    JOB_TTL,
    JOB_RUNNING_TTL,
    JOB_CACHE_TTL,
    USER_CSV_TTL,
    buildJobKey,
    buildUserCsvKey,
    buildReportKey,
    buildDryRunKey,
    buildResultsKey,
    encodeStateValue,
    decodeStateValue,
    writeJob,
    readJob,
    patchJob,
    writeUserCsv,
    readUserCsv,
    deleteUserCsv,
    writeReport,
    readReport,
    writeDryRun,
    readDryRun,
    writeResults,
    readResults,
    touchJobCache,
};
