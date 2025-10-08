/**
 * Fragment Tracker - Provides a unique run identifier for fragments
 * Run ID is created once in global setup, then shared via environment variable
 */

/**
 * Generate a unique test run ID
 */
function generateTestRunId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `nala-run-${timestamp}-${random}`;
}

/**
 * Create and save a new run ID (called once in global setup)
 */
export function createRunId() {
    const runId = generateTestRunId();

    // Store in environment variable for cross-process sharing
    process.env.NALA_RUN_ID = runId;

    return runId;
}

/**
 * Get the current run ID (reads from environment variable)
 */
export function getCurrentRunId() {
    return process.env.NALA_RUN_ID || null;
}

/**
 * Clear the current run ID (after cleanup)
 */
export function clearRunId() {
    const runId = getCurrentRunId();
    if (runId) {
        console.log(`🧹 Clearing run ID: ${runId}`);
    }

    delete process.env.NALA_RUN_ID;
}

/**
 * Get summary of current run
 */
export function getFragmentSummary() {
    const runId = getCurrentRunId();
    return {
        testRunId: runId,
        hasRunId: !!runId,
    };
}

// Default export for backward compatibility
export default {
    createRunId,
    getCurrentRunId,
    clearRunId,
    getFragmentSummary,
};
