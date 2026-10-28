const CACHE_KEY = 'masa-dashboard';
const SNAPSHOT_TTL_SECONDS = 86400;
const STALE_AFTER_MS = 600000;
const MAX_SNAPSHOT_BYTES = 262144;

const count = (value) => Number.isSafeInteger(value) && value >= 0;
const number = (value) => Number.isFinite(value) && value >= 0;
const nullable = (check) => (value) => value === null || check(value);
const share = nullable((value) => number(value) && value <= 1);
const measure = nullable(number);
const label = (value) => typeof value === 'string' && value.length > 0 && value.length <= 160;
const timestamp = (value) =>
    typeof value === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value) && Number.isFinite(Date.parse(value));
const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const shape = (fields) => (value) =>
    object(value) &&
    Object.keys(value).length === Object.keys(fields).length &&
    Object.entries(fields).every(([key, check]) => Object.hasOwn(value, key) && check(value[key]));
const list = (check, max) => (value) => Array.isArray(value) && value.length <= max && value.every(check);
const counts = (value) =>
    object(value) &&
    Object.keys(value).length <= 256 &&
    Object.entries(value).every(([key, value]) => label(key) && count(value));

const windowShape = shape({
    generatedAt: timestamp,
    days: (value) => [1, 7, 30].includes(value),
    summary: shape({
        jobs: count,
        questions: count,
        requesters: count,
        jobStatuses: counts,
        jobKinds: counts,
        outcomesRecorded: count,
        answeredShare: share,
        wallMsP50: measure,
        wallMsP90: measure,
        wallMsP95: measure,
        queueWaitDerived: shape({ p50Ms: measure, p95Ms: measure, jobs: count }),
        roundsMean: measure,
        promptTokensPerJobMean: measure,
        promptTokensPerJobP90: measure,
        promptTokens: count,
        completionTokens: count,
        cachedShare: share,
    }),
    daily: list(
        shape({
            day: (value) => typeof value === 'string' && /^\d{4}-\d\d-\d\d$/.test(value),
            jobs: count,
            promptTokens: count,
        }),
        31,
    ),
    outcomes: shape({
        kinds: counts,
        answerTypes: counts,
        confidence: counts,
        repairCauses: counts,
        downgradeCauses: counts,
        fallbackCauses: counts,
        layers: counts,
    }),
    intents: shape({
        rows: list(
            shape({
                intent: label,
                questions: count,
                answeredShare: share,
                wallMsP50: measure,
                wallMsP90: measure,
                roundsMean: measure,
                promptTokensMean: measure,
                answerTypes: counts,
            }),
            10,
        ),
        unlabelled: count,
        signals: counts,
    }),
    model: shape({
        calls: count,
        errors: count,
        finishReasons: counts,
        servedModels: counts,
        durationMsP50: measure,
        durationMsP95: measure,
        rateLimited: count,
    }),
    queue: shape({ generatedAt: timestamp, queued: count, running: count, oldestQueuedAgeMs: measure }),
    learning: shape({ recorded: count, labelled: count, labelledShare: share, outcomes: counts, sources: counts }),
    probes: list(shape({ probe: label, calls: count, statuses: counts, okShare: share, meanMs: measure, p90Ms: measure }), 256),
    rejections: list(shape({ key: label, count }), 256),
    costliest: list(
        shape({
            jobId: (value) => /^job_[a-f0-9-]{36}$/.test(value),
            modelCalls: count,
            promptTokens: count,
            completionTokens: count,
            outcome: nullable(label),
            probes: list(label, 256),
        }),
        5,
    ),
});
const snapshotShape = shape({ generatedAt: timestamp, windows: shape({ 1: windowShape, 7: windowShape, 30: windowShape }) });

/** Accept only the aggregate contract produced by mas-agent's dashboardSnapshot. */
function validSnapshot(snapshot, now = Date.now()) {
    if (!snapshotShape(snapshot)) return false;
    const age = now - Date.parse(snapshot.generatedAt);
    if (age < -300000 || age > SNAPSHOT_TTL_SECONDS * 1000) return false;
    return Object.entries(snapshot.windows).every(
        ([days, window]) =>
            window.days === Number(days) &&
            window.generatedAt === snapshot.generatedAt &&
            window.queue.generatedAt === snapshot.generatedAt,
    );
}

/** Prevent browser and intermediary caching of admin-only snapshots and failures. */
function response(statusCode, body) {
    return { statusCode, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body };
}

module.exports = { CACHE_KEY, SNAPSHOT_TTL_SECONDS, STALE_AFTER_MS, MAX_SNAPSHOT_BYTES, validSnapshot, response };
