const { init } = require('@adobe/aio-lib-state');

const JOB_TTL = 60 * 60;

function buildJobKey(jobId) {
    return `bulk-edit.${jobId}`;
}

async function writeJob(jobId, value, ttl = JOB_TTL) {
    const state = await init();
    await state.put(buildJobKey(jobId), JSON.stringify(value), { ttl });
    return value;
}

async function readJob(jobId) {
    const state = await init();
    const result = await state.get(buildJobKey(jobId));
    if (!result?.value) return null;
    return JSON.parse(result.value);
}

async function patchJob(jobId, patch, ttl = JOB_TTL) {
    const current = (await readJob(jobId)) || {};
    return writeJob(jobId, { ...current, ...patch }, ttl);
}

module.exports = { JOB_TTL, buildJobKey, writeJob, readJob, patchJob };
