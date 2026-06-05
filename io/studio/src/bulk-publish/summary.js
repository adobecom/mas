const FAILURES_CAP = 100;

function buildResult({ details, rolledOut = [], pending = [], startedAt, finishedAt }) {
    const pendingEntries = pending.map((path) => ({ path, status: 'failed', reason: 'rollout-pending' }));
    const allDetails = [...details, ...pendingEntries];

    const reasons = {};
    const failures = [];
    let published = 0;
    let failed = 0;

    for (const detail of allDetails) {
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
        total: allDetails.length,
        published,
        rolledOut: rolledOut.length,
        failed,
        rolloutPending: pending.length,
        startedAt,
        finishedAt,
        reasons,
        failures,
        failuresTruncated: failed > FAILURES_CAP,
    };
}

module.exports = { buildResult, FAILURES_CAP };
