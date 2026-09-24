/**
 * Cross-process, cross-machine, cross-PR "pause until" signal for a rate-limited domain.
 *
 * There is no shared memory between Playwright worker processes (even on the same machine),
 * let alone between the 3 separate self-hosted runners (SJ/Oregon/Noida) or between different
 * PRs' independent workflow runs. To let "one run hits 429 on ODIN" pause EVERY other concurrent
 * Nala run's calls to ODIN, we need state that lives OUTSIDE any single process/machine.
 *
 * This uses GitHub Actions *repository variables* (via the `gh` CLI, already present on GitHub
 * Actions runners) as that shared store — no new infrastructure required. Each domain gets one
 * variable (e.g. NALA_PAUSE_ODIN) holding an epoch-ms "paused until" timestamp.
 *
 * REQUIREMENTS TO VERIFY / SET UP (does not work out of the box):
 *   1. The workflow must grant `permissions: actions: write` (repository variables live under the
 *      Actions permission scope) and export `GH_TOKEN` (typically `${{ secrets.GITHUB_TOKEN }}`)
 *      into the job/step environment so `gh` is authenticated.
 *   2. `pull_request`-triggered runs from FORKED repos get a read-only GITHUB_TOKEN regardless of
 *      the `permissions:` block (a GitHub security restriction) — writes will silently fail. This
 *      is only safe as implemented for PRs from branches within the same repo (which this
 *      workflow already assumes, since it also passes IMS credentials as secrets that GitHub
 *      would not expose to fork PRs anyway).
 *   3. The `gh` CLI must be installed on the runner. GitHub-hosted runners have it preinstalled;
 *      self-hosted runners (SJ/Oregon/Noida/docs) must have it installed too — verify this, it is
 *      NOT assumed present. If missing, this module fails open (see below) rather than failing
 *      the test run.
 *
 * FAILURE MODE: if `gh` is missing, unauthenticated, or the API call otherwise fails, this module
 * logs one warning and behaves as if there is no shared pause (falls back to local, in-process
 * pausing only via network-guard.js). It never throws and never blocks a test on a broken
 * coordination channel — a broken cross-run signal should degrade gracefully, not hang CI.
 */

import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

/** How often (ms) each worker process re-checks the shared state for a given domain. Keeps API
 * call volume low — this is a periodic poll, not a per-request round trip. */
const REMOTE_CHECK_INTERVAL_MS = 5000;

let ghAvailable; // undefined = not yet probed, true/false = cached result for this process
let ghWarnedUnavailable = false;
const lastRemoteCheckAt = new Map(); // domainKey -> ms epoch of last remote check
const lastKnownRemotePause = new Map(); // domainKey -> ms epoch "paused until" last seen remotely

function varNameFor(domainKey) {
    const slug = String(domainKey)
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '_');
    return `NALA_PAUSE_${slug}`;
}

async function isGhCliAvailable() {
    if (process.env.NALA_SHARED_PAUSE_DISABLED === '1') return false;
    if (ghAvailable !== undefined) return ghAvailable;
    try {
        await execFileAsync('gh', ['--version']);
        ghAvailable = true;
    } catch {
        ghAvailable = false;
    }
    if (!ghAvailable && !ghWarnedUnavailable) {
        ghWarnedUnavailable = true;
        console.warn(
            '[NALA] gh CLI unavailable or unauthenticated — cross-run 429 pause propagation is DISABLED. ' +
                'Falling back to local (in-process) pausing only. See shared-pause-state.js header for setup requirements.\n',
        );
    }
    return ghAvailable;
}

async function readRemoteRaw(varName) {
    const { stdout } = await execFileAsync('gh', ['variable', 'get', varName]);
    const value = Number.parseInt(stdout.trim(), 10);
    return Number.isFinite(value) ? value : 0;
}

/**
 * Best-effort read of the shared "paused until" timestamp for a domain. Cached locally for
 * REMOTE_CHECK_INTERVAL_MS to avoid hammering the GitHub API from every worker on every request.
 * @param {string} domainKey
 * @returns {Promise<number>} epoch ms until which the domain is paused (0 = not paused / unknown)
 */
export async function getSharedPauseUntil(domainKey) {
    const now = Date.now();
    const lastCheck = lastRemoteCheckAt.get(domainKey) ?? 0;
    if (now - lastCheck < REMOTE_CHECK_INTERVAL_MS) {
        return lastKnownRemotePause.get(domainKey) ?? 0;
    }
    lastRemoteCheckAt.set(domainKey, now);

    if (!(await isGhCliAvailable())) return 0;
    try {
        const pauseUntil = await readRemoteRaw(varNameFor(domainKey));
        lastKnownRemotePause.set(domainKey, pauseUntil);
        return pauseUntil;
    } catch {
        // Most likely: variable doesn't exist yet (no 429 has ever been reported) — treat as clear.
        lastKnownRemotePause.set(domainKey, 0);
        return 0;
    }
}

/**
 * Best-effort broadcast of a pause to every other concurrent Nala run. Only extends the shared
 * pause — never shortens one already in effect from another run's more recent/longer 429.
 * @param {string} domainKey
 * @param {number} pauseUntilMs epoch ms until which callers should pause
 */
export async function reportSharedPause(domainKey, pauseUntilMs) {
    if (!(await isGhCliAvailable())) return;
    const varName = varNameFor(domainKey);
    try {
        let existing = 0;
        try {
            existing = await readRemoteRaw(varName);
        } catch {
            existing = 0;
        }
        if (existing >= pauseUntilMs) return; // a longer pause is already in effect; don't shorten it
        await execFileAsync('gh', ['variable', 'set', varName, '--body', String(pauseUntilMs)]);
        lastKnownRemotePause.set(domainKey, pauseUntilMs);
        lastRemoteCheckAt.set(domainKey, Date.now());
    } catch (error) {
        console.warn(`[NALA] Failed to broadcast shared pause for "${domainKey}" to other runs: ${error.message}\n`);
    }
}
