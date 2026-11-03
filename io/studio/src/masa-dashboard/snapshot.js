const CACHE_KEY = 'masa-dashboard';
const SNAPSHOT_TTL_SECONDS = 86400;
const STALE_AFTER_MS = 600000;
const MAX_SNAPSHOT_BYTES = 262144;

const count = (value) => Number.isSafeInteger(value) && value >= 0;
const number = (value) => Number.isFinite(value) && value >= 0;
const nullable = (check) => (value) => value === null || check(value);
const share = nullable((value) => number(value) && value <= 1);
const measure = nullable(number);
const category = (values) => {
    const allowed = new Set(values.split(' '));
    return (value) => allowed.has(value);
};
const answerType = category('explain diagnose route clarify decline none');
const outcome = category('answer fallback timeout model-unreachable none');
const cause = category('format studio-link citations code-unverified code-unquoted');
const probe = category(
    'aos_offer aos_search attachment browser_inspect card_search code_read code_search collection_tree docs_index docs_page docs_pr_patch fragment_inventory fragment_usage github_actions_read github_pr_checks github_pr_file github_pr_info github_pr_read grafana_panel grouped_variations_list io_fragment jira_issue jira_search knowledge_search milo_page nala_results odin_fragment_get odin_fragment_history osi_usage past_questions placeholder_trace prior_cases promo_code_lookup rendered_content settings_trace slack_thread splunk_search studio_inspect studio_link studio_screenshot traffic_breakdown wcs_offer wiki_page wiki_search',
);
const rejectionReason = category(
    'unknown-probe invalid-json invalid-input out-of-scope probe-error job-aborted budget-exhausted investigation-time-limit unknown',
);
const rejection = (value) => {
    if (typeof value !== 'string' || value.length > 240) return false;
    // Ingest replaces unvalidated model tool names before persisting the snapshot.
    const [reason] = value.split(' · ');
    return rejectionReason(reason) && value.startsWith(`${reason} · `);
};
// Keep in sync with mas-agent's approved dashboard model labels; new names require review.
const model = category('aifoundry/Qwen/Qwen-latest Qwen/Qwen3.8-27B unknown');
const timestamp = (value) =>
    typeof value === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value) && Number.isFinite(Date.parse(value));
const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const shape = (fields) => (value) =>
    object(value) &&
    Object.keys(value).length === Object.keys(fields).length &&
    Object.entries(fields).every(([key, check]) => Object.hasOwn(value, key) && check(value[key]));
const list = (check, max) => (value) => Array.isArray(value) && value.length <= max && value.every(check);
const counts = (keyCheck) => (value) =>
    object(value) &&
    Object.keys(value).length <= 256 &&
    Object.entries(value).every(([key, value]) => keyCheck(key) && count(value));

const spendingAmounts = {
    inputUsd: measure,
    outputUsd: measure,
    estimatedUsd: measure,
    pricedCalls: count,
    unpricedCalls: count,
};
const spendingShape = shape({
    currency: (value) => value === 'USD',
    inputUsdPerMillion: (value) => number(value) && value <= 1000000,
    outputUsdPerMillion: (value) => number(value) && value <= 1000000,
    ...spendingAmounts,
    daily: list(
        shape({ day: (value) => typeof value === 'string' && /^\d{4}-\d\d-\d\d$/.test(value), ...spendingAmounts }),
        31,
    ),
    models: list(shape({ model, ...spendingAmounts }), 3),
});
const windowFields = {
    generatedAt: timestamp,
    days: (value) => [1, 7, 30].includes(value),
    summary: shape({
        jobs: count,
        questions: count,
        requesters: count,
        jobStatuses: counts(category('queued running done failed interrupted stale')),
        jobKinds: counts(
            category(
                'question learn confirm curate review-digest investigation-batch investigation-control studio-investigation',
            ),
        ),
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
        kinds: counts(outcome),
        answerTypes: counts(answerType),
        confidence: counts(category('low medium high none')),
        repairCauses: counts(cause),
        downgradeCauses: counts(cause),
        fallbackCauses: counts(cause),
        layers: counts(category('odin io client milo deploy external unknown none')),
    }),
    intents: shape({
        rows: list(
            shape({
                intent: category('answer troubleshoot'),
                questions: count,
                answeredShare: share,
                wallMsP50: measure,
                wallMsP90: measure,
                roundsMean: measure,
                promptTokensMean: measure,
                answerTypes: counts(answerType),
            }),
            10,
        ),
        unlabelled: count,
        signals: counts(category('symptom retry thread url image')),
    }),
    model: shape({
        calls: count,
        errors: count,
        finishReasons: counts(category('stop length tool_calls content_filter function_call none')),
        servedModels: counts(model),
        durationMsP50: measure,
        durationMsP95: measure,
        rateLimited: count,
    }),
    queue: shape({ generatedAt: timestamp, queued: count, running: count, oldestQueuedAgeMs: measure }),
    learning: shape({
        recorded: count,
        labelled: count,
        labelledShare: share,
        outcomes: counts(category('unknown positive negative retried resolved corrected unresolved')),
        sources: counts(category('reaction retry settlement')),
    }),
    probes: list(
        shape({
            probe,
            calls: count,
            statuses: counts(
                category(
                    'ok unverified inconsistent not-found missing disabled out-of-scope unreachable unauthorized rate-limited error timeout rejected',
                ),
            ),
            okShare: share,
            meanMs: measure,
            p90Ms: measure,
        }),
        256,
    ),
    rejections: list(shape({ key: rejection, count }), 256),
    costliest: list(
        shape({
            jobId: (value) => /^job_[a-f0-9-]{36}$/.test(value),
            modelCalls: count,
            promptTokens: count,
            completionTokens: count,
            outcome: nullable((value) => outcome(value) || answerType(value)),
            probes: list(probe, 256),
        }),
        5,
    ),
};
const legacyWindowShape = shape(windowFields);
const pricedWindowShape = shape({ ...windowFields, spending: spendingShape });
const windowShape = (value) => legacyWindowShape(value) || pricedWindowShape(value);
const snapshotShape = shape({ generatedAt: timestamp, windows: shape({ 1: windowShape, 7: windowShape, 30: windowShape }) });

/** Validate the publisher contract before ingest anonymizes unknown tool names. */
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

/** Retain only registered probe names in rejection diagnostics. */
function safeRejectionKey(value) {
    const [reason, name, ...extra] = value.split(' · ');
    const safeName = !extra.length && probe(name) ? name : '?';
    return `${reason} · ${safeName}`;
}

module.exports = {
    CACHE_KEY,
    SNAPSHOT_TTL_SECONDS,
    STALE_AFTER_MS,
    MAX_SNAPSHOT_BYTES,
    validSnapshot,
    response,
    safeRejectionKey,
};
