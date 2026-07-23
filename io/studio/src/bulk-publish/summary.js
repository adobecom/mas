const FAILURES_CAP = 100;

function buildResult({ details, startedAt, finishedAt }) {
    const reasons = {};
    const failures = [];
    let published = 0;
    let failed = 0;

    for (const detail of details) {
        if (detail.status === 'published') {
            published += 1;
        } else if (detail.status === 'failed') {
            failed += 1;
            const reason = detail.reason || 'unknown';
            reasons[reason] = (reasons[reason] || 0) + 1;
            if (failures.length < FAILURES_CAP) failures.push({ path: detail.path, reason });
        }
    }

    return {
        total: details.length,
        published,
        failed,
        startedAt,
        finishedAt,
        reasons,
        failures,
        failuresTruncated: failed > FAILURES_CAP,
    };
}

module.exports = { buildResult, FAILURES_CAP };
