const { init } = require('@adobe/aio-lib-state');

const JOB_PAYLOAD_TTL = 24 * 60 * 60;
const PROJECT_SUMMARY_TTL = 30 * 24 * 60 * 60;
const JOB_PAYLOAD_TTL_PARAM = 'translationJobPayloadTtl';
const PROJECT_SUMMARY_TTL_PARAM = 'translationProjectSummaryTtl';

function buildJobPayloadKey(jobId) {
    return `translation-job.${jobId}.payload`;
}

function buildProjectSummaryKey(projectId) {
    return `translation-status.project.${projectId}.summary`;
}

function createTimestamp() {
    return new Date().toISOString();
}

function getConfiguredTtl(params, paramName, defaultValue) {
    const configuredValue = params?.[paramName];
    if (configuredValue === undefined || configuredValue === '') {
        return defaultValue;
    }

    const parsedValue = Number.parseInt(configuredValue, 10);
    if (Number.isNaN(parsedValue) || parsedValue <= 0) {
        return defaultValue;
    }

    return parsedValue;
}

function mergeValues(currentValue, patchValue) {
    if (
        currentValue &&
        patchValue &&
        typeof currentValue === 'object' &&
        typeof patchValue === 'object' &&
        !Array.isArray(currentValue) &&
        !Array.isArray(patchValue)
    ) {
        const merged = { ...currentValue };
        for (const [key, value] of Object.entries(patchValue)) {
            merged[key] = mergeValues(currentValue[key], value);
        }
        return merged;
    }
    return patchValue;
}

async function writeValue(key, value, ttl) {
    const state = await init();
    const serialized = JSON.stringify(value);
    await state.put(key, serialized, { ttl });
    return value;
}

async function readValue(key) {
    const state = await init();
    const result = await state.get(key);
    if (!result?.value) {
        return null;
    }
    return JSON.parse(result.value);
}

async function deleteValue(key) {
    const state = await init();
    await state.delete(key);
}

async function putJobPayload(jobId, payload, options = {}) {
    const ttl = options.ttl ?? getConfiguredTtl(options.params, JOB_PAYLOAD_TTL_PARAM, JOB_PAYLOAD_TTL);
    return writeValue(buildJobPayloadKey(jobId), payload, ttl);
}

async function getJobPayload(jobId) {
    return readValue(buildJobPayloadKey(jobId));
}

async function deleteJobPayload(jobId) {
    return deleteValue(buildJobPayloadKey(jobId));
}

async function putProjectSummary(projectId, summary, options = {}) {
    const ttl = options.ttl ?? getConfiguredTtl(options.params, PROJECT_SUMMARY_TTL_PARAM, PROJECT_SUMMARY_TTL);
    const enrichedSummary = {
        ...summary,
        updatedAt: summary.updatedAt || createTimestamp(),
    };
    return writeValue(buildProjectSummaryKey(projectId), enrichedSummary, ttl);
}

async function getProjectSummary(projectId) {
    return readValue(buildProjectSummaryKey(projectId));
}

async function patchProjectSummary(projectId, summaryPatch, options = {}) {
    const currentSummary = (await getProjectSummary(projectId)) || {};
    const mergedSummary = mergeValues(currentSummary, summaryPatch);
    mergedSummary.updatedAt = options.updatedAt || createTimestamp();
    return putProjectSummary(projectId, mergedSummary, options);
}

module.exports = {
    JOB_PAYLOAD_TTL,
    PROJECT_SUMMARY_TTL,
    JOB_PAYLOAD_TTL_PARAM,
    PROJECT_SUMMARY_TTL_PARAM,
    buildJobPayloadKey,
    buildProjectSummaryKey,
    putJobPayload,
    getJobPayload,
    deleteJobPayload,
    putProjectSummary,
    getProjectSummary,
    patchProjectSummary,
};
