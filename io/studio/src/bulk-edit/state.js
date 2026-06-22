const zlib = require('zlib');
const stateLib = require('@adobe/aio-lib-state');
const { init } = stateLib;

const JOB_TTL = 30 * 60;
const USER_CSV_TTL = stateLib.MAX_TTL;

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

function encodeStateValue(value) {
    return zlib.brotliCompressSync(JSON.stringify(value)).toString('base64');
}

function decodeStateValue(raw) {
    return JSON.parse(zlib.brotliDecompressSync(Buffer.from(raw, 'base64')).toString());
}

async function writeJob(jobId, value, ttl = JOB_TTL) {
    const state = await init();
    await state.put(buildJobKey(jobId), encodeStateValue(value), { ttl });
    return value;
}

async function readJob(jobId) {
    const state = await init();
    const result = await state.get(buildJobKey(jobId));
    if (!result?.value) return null;
    return decodeStateValue(result.value);
}

async function patchJob(jobId, patch, ttl = JOB_TTL) {
    const current = (await readJob(jobId)) || {};
    return writeJob(jobId, { ...current, ...patch }, ttl);
}

async function writeUserCsv(jobId, value, ttl = USER_CSV_TTL) {
    const state = await init();
    await state.put(buildUserCsvKey(jobId), JSON.stringify(value), { ttl });
    return value;
}

async function readUserCsv(jobId) {
    const state = await init();
    const result = await state.get(buildUserCsvKey(jobId));
    if (!result?.value) return null;
    return JSON.parse(result.value);
}

async function deleteUserCsv(jobId) {
    const state = await init();
    await state.delete(buildUserCsvKey(jobId));
}

async function writeReport(jobId, value, ttl = JOB_TTL) {
    const state = await init();
    await state.put(buildReportKey(jobId), JSON.stringify(value), { ttl });
    return value;
}

async function readReport(jobId) {
    const state = await init();
    const result = await state.get(buildReportKey(jobId));
    if (!result?.value) return null;
    return JSON.parse(result.value);
}

async function writeDryRun(jobId, value, ttl = JOB_TTL) {
    const state = await init();
    await state.put(buildDryRunKey(jobId), encodeStateValue(value), { ttl });
    return value;
}

async function readDryRun(jobId) {
    const state = await init();
    const result = await state.get(buildDryRunKey(jobId));
    if (!result?.value) return null;
    return decodeStateValue(result.value);
}

module.exports = {
    JOB_TTL,
    USER_CSV_TTL,
    buildJobKey,
    buildUserCsvKey,
    buildReportKey,
    buildDryRunKey,
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
};
