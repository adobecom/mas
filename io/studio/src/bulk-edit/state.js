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

module.exports = {
    JOB_TTL,
    USER_CSV_TTL,
    buildJobKey,
    buildUserCsvKey,
    encodeStateValue,
    decodeStateValue,
    writeJob,
    readJob,
    patchJob,
    writeUserCsv,
    readUserCsv,
};
