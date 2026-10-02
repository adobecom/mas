import { chromium, devices } from '@playwright/test';
import { getCurrentRunId, clearRunId } from './fragment-tracker.js';
import { readFragmentLedger, completeFragmentLedger } from './fragment-ledger.js';
import GlobalRequestCounter from '../libs/global-request-counter.js';
import { installEdsThrottleOnPage } from '../libs/eds-throttle.js';
import RequestCountingReporter from './request-counting-reporter.js';
import { USER_AGENT_DESKTOP } from '../../playwright.config.js';

/**
 * Delete exact run-owned IDs, verifying ownership and ETags from live responses.
 * A fragment deleted by its test is already clean; other errors remain failures.
 */
export async function deleteOwnedFragments({ fragments, runId }) {
    const repo = document.querySelector('mas-repository');
    const deletedIds = [];
    const alreadyDeletedIds = [];
    const failures = [];
    for (const entry of fragments) {
        try {
            const response = await fetch(`${repo.aem.cfFragmentsUrl}/${entry.id}`, { headers: repo.aem.headers });
            if (response.status === 404) {
                alreadyDeletedIds.push(entry.id);
                continue;
            }
            if (!response.ok) throw new Error(`Cannot inspect cleanup fragment ${entry.id}: HTTP ${response.status}`);
            const fragment = await response.json();
            if (!fragment.title.includes(runId) || fragment.path !== entry.path) {
                throw new Error(`Refusing to delete fragment not owned by this run: ${entry.id}`);
            }
            fragment.etag = response.headers.get('etag');
            if (!fragment.etag) throw new Error(`Missing live ETag for cleanup fragment ${entry.id}`);
            await repo.aem.sites.cf.fragments.delete(fragment);
            deletedIds.push(entry.id);
        } catch (error) {
            failures.push({ id: entry.id, message: error.message });
        }
    }
    return { deletedIds, alreadyDeletedIds, failures };
}

async function evaluateCleanup(page, operation, payload) {
    let timer;
    try {
        return await Promise.race([
            page.evaluate(operation, payload),
            new Promise((resolve, reject) => {
                timer = setTimeout(() => reject(new Error('Fragment cleanup exceeded its 90s operation limit')), 90000);
            }),
        ]);
    } finally {
        clearTimeout(timer);
    }
}

/**
 * Recover creations interrupted before their ID was registered. Filter at the
 * authoring API, never enumerate every fragment in the locale folders.
 */
export async function findRunFragments({ runId, locales, knownIds }) {
    const repo = document.querySelector('mas-repository');
    const fragments = [];
    const seen = new Set(knownIds);
    for (const locale of locales) {
        const cursor = repo.aem.sites.cf.fragments.search(
            { path: `/content/dam/mas/nala/${locale}`, query: runId },
            null,
            null,
        );
        for await (const items of cursor) {
            for (const { id, path, title } of items) {
                if (!seen.has(id) && title.includes(runId)) {
                    seen.add(id);
                    fragments.push({ id, path, title });
                }
            }
        }
    }
    return fragments;
}

/**
 * Print the cleanup outcome used by the existing Nala reporter.
 */
export function printCleanupSummary() {
    const results = global.nalaCleanupResults;
    if (!results) return;
    console.log('\n    ---------Fragment Cleanup Summary---------');
    console.log(`    # Total Fragments to delete: ${results.totalFound}`);
    console.log(`    # Deleted / already absent : ${results.totalDeleted}`);
    console.log(`    # Failed to clean up       : ${results.totalFailed}`);
}

/**
 * Clean the current execution only, using one authenticated maintenance page.
 */
async function globalTeardown() {
    console.info('\n---- Executing Nala Global Teardown: Cleaning up cloned cards ----\n');
    if (process.env.SKIP_AUTH === 'true') {
        console.info('[NALA teardown] Cleanup skipped: SKIP_AUTH=true.');
        return;
    }
    const runId = getCurrentRunId();
    if (!runId) {
        console.info('[NALA teardown] No run ID found; no fragments to clean up.');
        return;
    }
    const ledger = readFragmentLedger();
    console.info(`[NALA teardown] Run: ${runId}`);
    console.info(
        `[NALA teardown] ${ledger.fragments.length} recorded fragments; recovery search ${ledger.recover ? 'required' : 'not required'}.`,
    );
    global.nalaCleanupResults = { totalFound: ledger.fragments.length, totalDeleted: 0, totalFailed: 0 };
    if (!ledger.fragments.length && !ledger.recover) {
        console.info('[NALA teardown] No pending fragments; skipping browser startup.');
        printCleanupSummary();
        completeFragmentLedger();
        clearRunId();
        return;
    }
    console.info('[NALA teardown] Starting authenticated cleanup browser.');
    const browser = await chromium.launch({ args: ['--disable-web-security', '--disable-gpu'] });
    let stopCounting;
    try {
        const context = await browser.newContext({
            ...devices['Desktop Chrome'],
            userAgent: USER_AGENT_DESKTOP,
            extraHTTPHeaders: { 'sec-ch-ua': '"Chromium";v="123", "Not:A-Brand";v="8"' },
            storageState: './nala/.auth/user.json',
            bypassCSP: true,
            serviceWorkers: 'block',
        });
        const page = await context.newPage();
        page.on('pageerror', (error) => console.error(`[NALA teardown] Page error: ${error.message}`));
        page.on('requestfailed', (request) => {
            const url = new URL(request.url());
            console.error(
                `[NALA teardown] Request failed: ${request.method()} ${url.origin}${url.pathname} (${request.failure().errorText})`,
            );
        });
        page.on('response', (response) => {
            if (response.status() < 400) return;
            const url = new URL(response.url());
            console.error(`[NALA teardown] HTTP ${response.status()}: ${url.origin}${url.pathname}`);
        });
        await installEdsThrottleOnPage(page);
        stopCounting = await GlobalRequestCounter.init(page);
        const baseURL =
            process.env.PR_BRANCH_LIVE_URL || process.env.LOCAL_TEST_LIVE_URL || 'https://main--mas--adobecom.aem.live';
        console.info(`[NALA teardown] Loading Studio at ${baseURL}; restoring saved authentication.`);
        await page.goto(`${baseURL}/studio.html#page=welcome&path=nala`, { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => document.querySelector('mas-repository')?.aem);
        console.info('[NALA teardown] Authenticated repository ready.');

        const fragments = [...ledger.fragments];
        if (ledger.recover) {
            console.info(`[NALA teardown] Searching Nala locale and translation paths for interrupted creations.`);
            fragments.push(
                ...(await evaluateCleanup(page, findRunFragments, {
                    runId,
                    locales: ['en_US', 'fr_FR', 'en_CA', 'en_GB', 'en_AU', 'translations'],
                    knownIds: fragments.map(({ id }) => id),
                })),
            );
            console.info(
                `[NALA teardown] Recovery complete: ${fragments.length - ledger.fragments.length} additional fragments.`,
            );
        }
        global.nalaCleanupResults.totalFound = fragments.length;
        const failures = [];
        for (let start = 0; start < fragments.length; start += 10) {
            console.info(
                `[NALA teardown] Deleting batch ${Math.floor(start / 10) + 1}/${Math.ceil(fragments.length / 10)} (${Math.min(10, fragments.length - start)} fragments).`,
            );
            const result = await evaluateCleanup(page, deleteOwnedFragments, {
                fragments: fragments.slice(start, start + 10),
                runId,
            });
            global.nalaCleanupResults.totalDeleted += result.deletedIds.length + result.alreadyDeletedIds.length;
            for (const id of result.deletedIds) console.info(`[NALA teardown] Deleted fragment: ${id}`);
            for (const id of result.alreadyDeletedIds) console.info(`[NALA teardown] Fragment already absent: ${id}`);
            for (const { id, message } of result.failures) console.error(`[NALA teardown] Failed fragment ${id}: ${message}`);
            failures.push(...result.failures);
        }
        if (failures.length) {
            throw new AggregateError(
                failures.map(({ id, message }) => new Error(`${id}: ${message}`)),
                'Fragment cleanup failed',
            );
        }
        completeFragmentLedger();
        console.info('[NALA teardown] Run-owned fragment cleanup completed.');
        clearRunId();
    } catch (error) {
        global.nalaCleanupResults.totalFailed = global.nalaCleanupResults.totalFound - global.nalaCleanupResults.totalDeleted;
        throw error;
    } finally {
        stopCounting?.();
        GlobalRequestCounter.saveCountToFileSync();
        for (const context of browser.contexts()) {
            for (const page of context.pages()) await page.unrouteAll({ behavior: 'wait' });
        }
        await browser.close();
        printCleanupSummary();
        if (process.env.GITHUB_ACTIONS === 'true') new RequestCountingReporter().printRequestSummary();
    }
}

export default globalTeardown;
