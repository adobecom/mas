import { chromium, devices } from '@playwright/test';
import { getCurrentRunId, clearRunId } from './fragment-tracker.js';
import { readFragmentLedger, completeFragmentLedger } from './fragment-ledger.js';
import GlobalRequestCounter from '../libs/global-request-counter.js';
import { installEdsThrottleOnPage } from '../libs/eds-throttle.js';
import RequestCountingReporter from './request-counting-reporter.js';

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
    console.log(`\nFragment cleanup: ${results.totalDeleted}/${results.totalFound} deleted, ${results.totalFailed} failed.`);
}

/**
 * Clean the current execution only, using one authenticated maintenance page.
 */
async function globalTeardown() {
    if (process.env.SKIP_AUTH === 'true') return;
    const runId = getCurrentRunId();
    if (!runId) return;
    const ledger = readFragmentLedger();
    global.nalaCleanupResults = { totalFound: ledger.fragments.length, totalDeleted: 0, totalFailed: 0 };
    if (!ledger.fragments.length && !ledger.recover) {
        printCleanupSummary();
        completeFragmentLedger();
        clearRunId();
        return;
    }
    const browser = await chromium.launch({ args: ['--disable-web-security', '--disable-gpu'] });
    let stopCounting;
    try {
        const context = await browser.newContext({
            ...devices['Desktop Chrome'],
            storageState: './nala/.auth/user.json',
            bypassCSP: true,
        });
        const page = await context.newPage();
        await installEdsThrottleOnPage(page);
        stopCounting = await GlobalRequestCounter.init(page);
        const baseURL =
            process.env.PR_BRANCH_LIVE_URL || process.env.LOCAL_TEST_LIVE_URL || 'https://main--mas--adobecom.aem.live';
        await page.goto(`${baseURL}/studio.html#page=welcome&path=nala`, { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => document.querySelector('mas-repository')?.aem);

        const fragments = [...ledger.fragments];
        if (ledger.recover) {
            console.warn(`[NALA] Recovering unregistered creations for ${runId}`);
            fragments.push(
                ...(await evaluateCleanup(page, findRunFragments, {
                    runId,
                    locales: ['en_US', 'fr_FR', 'en_CA', 'en_GB', 'en_AU', 'translations'],
                    knownIds: fragments.map(({ id }) => id),
                })),
            );
        }
        global.nalaCleanupResults.totalFound = fragments.length;
        const failures = [];
        for (let start = 0; start < fragments.length; start += 10) {
            const result = await evaluateCleanup(page, deleteOwnedFragments, {
                fragments: fragments.slice(start, start + 10),
                runId,
            });
            global.nalaCleanupResults.totalDeleted += result.deletedIds.length + result.alreadyDeletedIds.length;
            failures.push(...result.failures);
        }
        if (failures.length) {
            throw new AggregateError(
                failures.map(({ id, message }) => new Error(`${id}: ${message}`)),
                'Fragment cleanup failed',
            );
        }
        completeFragmentLedger();
        clearRunId();
    } catch (error) {
        global.nalaCleanupResults.totalFailed = global.nalaCleanupResults.totalFound - global.nalaCleanupResults.totalDeleted;
        throw error;
    } finally {
        stopCounting?.();
        GlobalRequestCounter.saveCountToFileSync();
        await browser.close();
        printCleanupSummary();
        if (process.env.GITHUB_ACTIONS === 'true') new RequestCountingReporter().printRequestSummary();
    }
}

export default globalTeardown;
