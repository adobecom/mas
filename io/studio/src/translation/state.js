const crypto = require('node:crypto');
const { init } = require('@adobe/aio-lib-state');

const JOB_PAYLOAD_TTL = 24 * 60 * 60;
const PROJECT_SUMMARY_TTL = 30 * 24 * 60 * 60;
const JOB_PAYLOAD_TTL_PARAM = 'translationJobPayloadTtl';
const PROJECT_SUMMARY_TTL_PARAM = 'translationProjectSummaryTtl';

const PENDING = 'PENDING';
const IN_PROGRESS = 'IN_PROGRESS';
const COMPLETED = 'COMPLETED';

function buildJobPayloadKey(jobId) {
    return `translation-job.${jobId}.payload`;
}

function buildProjectSummaryKey(projectId) {
    return `translation-status.project.${projectId}.summary`;
}

function taskSegment(title) {
    const readable = title.replace(/\./g, '-');
    const hash = crypto.createHash('sha1').update(title).digest('hex').slice(0, 8);
    return `${readable}-${hash}`;
}

function buildTaskIndexKeyPrefix(title) {
    return `translation-status.task.${taskSegment(title)}.`;
}

function buildTaskIndexKey(title, projectId) {
    return `${buildTaskIndexKeyPrefix(title)}${projectId}.index`;
}

function parseGlaasTaskName(glaasTaskName) {
    if (typeof glaasTaskName !== 'string') return null;
    const match = glaasTaskName.match(/^(.+)\.(\d{14})$/);
    if (!match) return null;
    const [, title, timestamp] = match;
    const year = Number(timestamp.slice(0, 4));
    const month = Number(timestamp.slice(4, 6));
    const day = Number(timestamp.slice(6, 8));
    const hours = Number(timestamp.slice(8, 10));
    const minutes = Number(timestamp.slice(10, 12));
    const seconds = Number(timestamp.slice(12, 14));
    const odinEpoch = Date.UTC(year, month - 1, day, hours, minutes, seconds);
    if (Number.isNaN(odinEpoch)) return null;
    return { title, timestamp, odinEpoch };
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

async function putTaskIndex(title, projectId, payload, options = {}) {
    const ttl = options.ttl ?? getConfiguredTtl(options.params, PROJECT_SUMMARY_TTL_PARAM, PROJECT_SUMMARY_TTL);
    return writeValue(buildTaskIndexKey(title, projectId), payload, ttl);
}

async function getTaskIndex(title, projectId) {
    return readValue(buildTaskIndexKey(title, projectId));
}

async function deleteTaskIndex(title, projectId) {
    return deleteValue(buildTaskIndexKey(title, projectId));
}

async function listTaskIndexEntries(title) {
    const state = await init();
    const prefix = buildTaskIndexKeyPrefix(title);
    const entries = [];
    for await (const { keys } of state.list({ match: `${prefix}*` })) {
        for (const key of keys) {
            const value = await readValue(key);
            if (value && value.title === title) entries.push(value);
        }
    }
    return entries;
}

async function findProjectIdByGlaasTaskName(glaasTaskName) {
    const parsed = parseGlaasTaskName(glaasTaskName);
    if (!parsed) return null;
    const candidates = await listTaskIndexEntries(parsed.title);
    if (candidates.length !== 1) return null;
    return candidates[0].projectId;
}

function emptyTransitions() {
    return { projectStarted: false, localeCompleted: null, projectCompleted: false };
}

async function recordFragmentLocaleStatus(projectId, sourcePath, locale, status, options = {}) {
    const summary = await getProjectSummary(projectId);
    if (!summary) {
        return { summary: null, transitions: emptyTransitions() };
    }

    const localeProgress = summary.locales?.progress?.[locale];
    if (!localeProgress || !localeProgress.fragments || !(sourcePath in localeProgress.fragments)) {
        return { summary, transitions: emptyTransitions() };
    }

    const transitions = emptyTransitions();
    const now = options.updatedAt || createTimestamp();
    const previousFragmentStatus = localeProgress.fragments[sourcePath].status;

    if (previousFragmentStatus === COMPLETED) {
        // COMPLETED is terminal — drop late or out-of-order events that would
        // demote a fragment back to IN_PROGRESS/PENDING (subsumes the
        // idempotent COMPLETED → COMPLETED case).
        return { summary, transitions };
    }

    if (previousFragmentStatus === status) {
        // idempotent: same fragment status reported again, no-op
        return { summary, transitions };
    }

    localeProgress.fragments[sourcePath] = { status, updatedAt: now };

    const completedCount = Object.values(localeProgress.fragments).filter((f) => f.status === COMPLETED).length;
    const previousLocaleStatus = localeProgress.status;
    localeProgress.completed = completedCount;
    if (completedCount === localeProgress.total) {
        localeProgress.status = COMPLETED;
        localeProgress.completedAt = now;
    } else if (completedCount > 0 || status === IN_PROGRESS) {
        localeProgress.status = IN_PROGRESS;
    } else {
        localeProgress.status = PENDING;
    }

    if (previousLocaleStatus !== COMPLETED && localeProgress.status === COMPLETED) {
        transitions.localeCompleted = locale;
    }

    const completedLocales = Object.values(summary.locales.progress).filter((l) => l.status === COMPLETED).length;
    summary.locales.completed = completedLocales;

    const previousSummaryStatus = summary.status;
    if (completedLocales === summary.locales.total) {
        summary.status = COMPLETED;
    } else if (previousSummaryStatus !== IN_PROGRESS && previousSummaryStatus !== COMPLETED) {
        summary.status = IN_PROGRESS;
    }

    if (previousSummaryStatus !== IN_PROGRESS && previousSummaryStatus !== COMPLETED && summary.status === IN_PROGRESS) {
        transitions.projectStarted = true;
    }
    if (previousSummaryStatus !== COMPLETED && summary.status === COMPLETED) {
        transitions.projectCompleted = true;
    }

    summary.updatedAt = now;
    await putProjectSummary(projectId, summary, { ...options, updatedAt: now });
    return { summary, transitions };
}

module.exports = {
    JOB_PAYLOAD_TTL,
    PROJECT_SUMMARY_TTL,
    JOB_PAYLOAD_TTL_PARAM,
    PROJECT_SUMMARY_TTL_PARAM,
    buildJobPayloadKey,
    buildProjectSummaryKey,
    buildTaskIndexKey,
    buildTaskIndexKeyPrefix,
    putJobPayload,
    getJobPayload,
    deleteJobPayload,
    putProjectSummary,
    getProjectSummary,
    patchProjectSummary,
    putTaskIndex,
    getTaskIndex,
    deleteTaskIndex,
    listTaskIndexEntries,
    parseGlaasTaskName,
    findProjectIdByGlaasTaskName,
    recordFragmentLocaleStatus,
};
