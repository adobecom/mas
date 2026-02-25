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

let currentTestName = null;

/**
 * Set the current test name or tag (used when generating fragment title).
 * Called from test fixture so getFragmentTitle() can include it.
 * @param {string} name - Test title (e.g. from test.info().title)
 */
export function setCurrentTestName(name) {
    currentTestName = name || null;
}

/**
 * Get the current test name if set.
 * @returns {string|null}
 */
export function getCurrentTestName() {
    return currentTestName;
}

/**
 * Sanitize test name for use in fragment title (remove/replace chars unsafe for titles).
 * @param {string} name
 * @returns {string}
 */
function sanitizeTestName(name) {
    if (!name || typeof name !== 'string') return '';
    return name
        .replace(/[/\\:*?"<>|,@]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 80);
}

/**
 * Generate fragment title with run ID and optional test name/tag
 * @returns {string} Fragment title in format "MAS Nala Automation Fragment [runId]" or with " - TestName" when set
 */
export function getFragmentTitle() {
    const runId = getCurrentRunId();
    const base = `MAS Nala Automation Fragment [${runId}]`;
    const testName = sanitizeTestName(getCurrentTestName());
    return testName ? `${base} - ${testName}` : base;
}

// Default export for backward compatibility
export default {
    createRunId,
    getCurrentRunId,
    clearRunId,
    getFragmentSummary,
    setCurrentTestName,
    getCurrentTestName,
    getFragmentTitle,
};
