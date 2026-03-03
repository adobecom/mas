const ROOT_PATH = '/content/dam/mas';

/**
 * Search and delete fragments via AEM API: search by path/locale, keep only items whose title contains [runId], then delete.
 * Used as the default for all paths. Runs in the browser context.
 */
const searchAndDeleteFragmentsByAPI = async ({ runId, processedIds, pathFragment, rootPath }) => {
    const repo = document.querySelector('mas-repository');
    if (!repo?.aem?.sites?.cf?.fragments?.search || typeof repo.deleteFragment !== 'function') {
        return {
            success: false,
            error: 'mas-repository not ready for API search/delete',
            deletedCount: 0,
            failedCount: 0,
            totalAttempted: 0,
            fragmentsFound: 0,
        };
    }

    const params = new URLSearchParams(pathFragment.replace(/^#/, ''));
    const path = params.get('path') || 'nala';
    const locale = params.get('locale') || 'en_US'; // no locale in path => default en_US
    const apiPath = `${rootPath}/${path}/${locale}`;
    const runIdInTitle = `[${runId}]`; // only delete fragments whose title contains this
    const toDelete = [];

    try {
        const cursor = repo.aem.sites.cf.fragments.search(
            { path: apiPath, sort: [{ on: 'modifiedOrCreated', order: 'DESC' }] },
            null,
            null,
        );
        for await (const items of cursor) {
            for (const item of items || []) {
                if (!item?.id || processedIds.includes(item.id)) continue;
                const title = item.title ?? '';
                if (!title.includes(runIdInTitle)) continue;
                toDelete.push(item);
            }
        }
    } catch (error) {
        return {
            success: false,
            error: (error?.message || String(error)).substring(0, 200),
            deletedCount: 0,
            failedCount: 0,
            totalAttempted: 0,
            fragmentsFound: 0,
        };
    }

    if (toDelete.length === 0) {
        return {
            success: true,
            deletedCount: 0,
            deletedIds: [],
            failedCount: 0,
            totalAttempted: 0,
            fragmentsFound: 0,
            processedIds: [],
        };
    }

    const deleteOptions = { startToast: false, endToast: false };
    const results = await Promise.allSettled(
        toDelete.map((item) => repo.deleteFragment({ id: item.id }, deleteOptions).then(() => ({ id: item.id }))),
    );

    const successful = results.filter((r) => r.status === 'fulfilled' && r.value?.id).map((r) => r.value.id);
    const failed = results
        .filter((r) => r.status === 'rejected')
        .map((r) => ({ id: 'unknown', error: (r.reason?.message || String(r.reason)).substring(0, 200) }));

    return {
        success: failed.length === 0,
        deletedCount: successful.length,
        deletedIds: successful,
        failedCount: failed.length,
        failedFragments: failed,
        totalAttempted: toDelete.length,
        fragmentsFound: toDelete.length,
        processedIds: toDelete.map((i) => i.id),
    };
};

/**
 * Print cleanup summary from global results
 */
function printCleanupSummary() {
    // Read cleanup results from global variable set by teardown
    const cleanupResults = global.nalaCleanupResults;

    if (!cleanupResults) {
        return; // No cleanup results to display
    }

    console.log('\n    \x1b[1m\x1b[34m---------Fragment Cleanup Summary---------\x1b[0m');
    console.log(`    \x1b[1m\x1b[33m# Total Fragments to delete :\x1b[0m \x1b[32m${cleanupResults.totalFound}\x1b[0m`);

    if (cleanupResults.totalDeleted > 0) {
        console.log(
            `    \x1b[32m✓\x1b[0m \x1b[1m\x1b[33m Successfully deleted     :\x1b[0m \x1b[32m${cleanupResults.totalDeleted}\x1b[0m`,
        );
    } else if (cleanupResults.totalFound === 0) {
        console.log(`    \x1b[1m\x1b[33m  ➖ No fragments found to clean up\x1b[0m`);
    }

    if (cleanupResults.totalFailed > 0) {
        console.log(
            `    \x1b[31m✘\x1b[0m \x1b[1m\x1b[33m Failed to delete         :\x1b[0m \x1b[31m${cleanupResults.totalFailed}/${cleanupResults.totalFound}\x1b[0m`,
        );
    }
}

async function cleanupClonedCards() {
    console.info(`---- Executing Nala Global Teardown: Cleaning up cloned cards ----\n`);

    try {
        // Import fragment tracker
        const { getCurrentRunId, clearRunId } = await import('./fragment-tracker.js');

        // Get the current run ID
        const currentRunId = getCurrentRunId();

        if (!currentRunId) {
            console.info('\x1b[32m✓\x1b[0m No run ID found - no fragments to clean up');
            return { success: true, deletedCount: 0, deletedIds: [] };
        }

        console.log(`🔄 Searching for fragments with run ID: ${currentRunId}`);

        // Use the same browser configuration as mastest
        const { chromium, devices } = await import('@playwright/test');

        // Import request counter to track teardown requests
        const GlobalRequestCounter = (await import('../libs/global-request-counter.js')).default;

        const browser = await chromium.launch({
            args: ['--disable-web-security', '--disable-gpu'],
        });

        const authPath = './nala/.auth/user.json';
        const context = await browser.newContext({
            ...devices['Desktop Chrome'],
            storageState: authPath,
            bypassCSP: true,
        });
        const page = await context.newPage();

        // Set HTTP headers for chromium (same as mastest)
        await page.setExtraHTTPHeaders({
            'sec-ch-ua': '"Chromium";v="123", "Not:A-Brand";v="8"',
        });

        // Initialize request counter for teardown
        await GlobalRequestCounter.init(page);

        const baseURL =
            process.env.PR_BRANCH_LIVE_URL || process.env.LOCAL_TEST_LIVE_URL || 'https://main--mas--adobecom.aem.live';

        // Define paths to check for fragments (different locales/views)
        const pathsToCheck = [
            '#page=content&path=nala', // Default path
            '#locale=fr_FR&page=content&path=nala', // French locale path
            '#locale=en_CA&page=content&path=nala', // Canadian locale path
            '#locale=en_GB&page=content&path=nala', // British locale path
            '#locale=en_AU&page=content&path=nala', // Australian locale path
        ];

        let totalFragmentsFound = 0;
        let totalFragmentsDeleted = 0;
        const allFailedFragments = [];
        const processedFragmentIds = new Set(); // Track fragments we've already processed

        try {
            // On GitHub, navigate to studio home first to warm up the session
            if (process.env.GITHUB_ACTIONS === 'true') {
                await page.goto(`${baseURL}/studio.html`);
                await page.waitForLoadState('domcontentloaded');

                // Wait for mas-repository to initialize
                await page.waitForFunction(
                    () => {
                        const repo = document.querySelector('mas-repository');
                        return repo?.aem;
                    },
                    { timeout: 10000 },
                );
            }

            // Check each path for fragments (per-path try/catch so one failure doesn't skip the rest)
            const pathResults = []; // Track results per path for GitHub validation
            for (const pathFragment of pathsToCheck) {
                console.log(`📍 Checking path: \x1b[33m${pathFragment}\x1b[0m`);

                try {
                    await page.goto(`${baseURL}/studio.html${pathFragment}`);
                    await page.waitForLoadState('domcontentloaded');

                    await page.waitForFunction(
                        () => {
                            const repo = document.querySelector('mas-repository');
                            return repo?.aem?.sites?.cf?.fragments?.search && typeof repo.deleteFragment === 'function';
                        },
                        { timeout: 5000 },
                    );

                    await page.waitForTimeout(1000);

                    const apiPayload = {
                        runId: currentRunId,
                        processedIds: Array.from(processedFragmentIds),
                        pathFragment: pathFragment,
                        rootPath: ROOT_PATH,
                    };
                    let cleanupResult = await page.evaluate(searchAndDeleteFragmentsByAPI, apiPayload);

                    if (process.env.GITHUB_ACTIONS === 'true' && cleanupResult.fragmentsFound === 0 && !cleanupResult.error) {
                        console.log(`  ⚠️  No fragments found, waiting 3s and retrying...`);
                        await page.waitForTimeout(3000);
                        cleanupResult = await page.evaluate(searchAndDeleteFragmentsByAPI, apiPayload);
                        if (cleanupResult.fragmentsFound > 0) {
                            console.log(`  \x1b[32m✓\x1b[0m Retry found ${cleanupResult.fragmentsFound} fragments`);
                        }
                    }

                    // Log results for this specific path
                    if (cleanupResult.error) {
                        console.log(`  \x1b[31m✘\x1b[0m API error: ${cleanupResult.error}`);
                    } else if (cleanupResult.fragmentsFound > 0) {
                        console.log(
                            `  \x1b[32m✓\x1b[0m Found ${cleanupResult.fragmentsFound} fragments, deleted ${cleanupResult.deletedCount}`,
                        );
                    } else {
                        console.log(`  ➖ No fragments found in this path`);
                    }

                    // Use same fallback for found count (fragmentsFound can be missing from serialized result)
                    const found = cleanupResult.fragmentsFound ?? cleanupResult.totalAttempted ?? 0;
                    const deleted = cleanupResult.deletedCount ?? 0;

                    pathResults.push({ path: pathFragment, fragmentsFound: found });
                    totalFragmentsFound += found;
                    totalFragmentsDeleted += deleted;

                    if (cleanupResult.failedFragments) {
                        allFailedFragments.push(...cleanupResult.failedFragments);
                    }
                    if (cleanupResult.processedIds) {
                        cleanupResult.processedIds.forEach((id) => processedFragmentIds.add(id));
                    }
                } catch (pathError) {
                    const msg = pathError?.message ?? String(pathError);
                    console.error(`  \x1b[31m✘\x1b[0m Path failed: ${msg}`);
                    pathResults.push({ path: pathFragment, fragmentsFound: 0 });
                }
            }

            // Store cleanup results in global for reporter access (totalFound at least totalDeleted so summary is never 0 when we deleted)
            global.nalaCleanupResults = {
                totalFound: Math.max(totalFragmentsFound, totalFragmentsDeleted),
                totalDeleted: totalFragmentsDeleted,
                totalFailed: allFailedFragments.length,
                failedFragments: allFailedFragments,
            };

            // Log failed fragments details if any
            if (allFailedFragments.length > 0) {
                console.error(
                    `\x1b[31m✘\x1b[0m Cleanup failed: ${allFailedFragments.length}/${totalFragmentsFound} fragments failed to delete`,
                );
                console.error('Failed fragments:');
                allFailedFragments.forEach((fragment) => {
                    console.error(`  - ${fragment.id}: ${fragment.error}`);
                });
            }

            clearRunId();

            // Save teardown request count
            GlobalRequestCounter.saveCountToFileSync();

            // Only print summaries and validate if running on GitHub as a separate step
            // (locally, base-reporter will print them after test suite completes)
            if (process.env.GITHUB_ACTIONS === 'true') {
                // Print cleanup summary
                printCleanupSummary();

                // Print request summary
                const RequestCountingReporter = (await import('./request-counting-reporter.js')).default;
                const requestReporter = new RequestCountingReporter();
                requestReporter.printRequestSummary();

                // Fail if any path found no fragments (test suite should create fragments)
                const pathsWithNoFragments = pathResults.filter((result) => result.fragmentsFound === 0);

                if (pathsWithNoFragments.length > 0) {
                    const pathNames = pathsWithNoFragments.map((r) => r.path).join(', ');
                    throw new Error(
                        `No fragments found in the following paths on GitHub: ${pathNames}. This is unexpected after a test suite run. Fragment loading may have failed.`,
                    );
                }
            }

            return {
                success: allFailedFragments.length === 0,
                deletedCount: totalFragmentsDeleted,
                failedCount: allFailedFragments.length,
                totalAttempted: totalFragmentsFound,
            };
        } catch (error) {
            clearRunId();

            // Print summary if running on GitHub
            if (process.env.GITHUB_ACTIONS === 'true') {
                try {
                    GlobalRequestCounter.saveCountToFileSync();
                    const RequestCountingReporter = (await import('./request-counting-reporter.js')).default;
                    const reporter = new RequestCountingReporter();
                    reporter.printRequestSummary();
                } catch (summaryError) {
                    // Silently fail if summary printing fails
                }
            }

            return { success: false, error: error.message, deletedCount: 0, failedCount: 0, totalAttempted: 0 };
        } finally {
            if (browser) await browser.close().catch(() => {});
        }
    } catch (error) {
        return { success: false, error: error.message, deletedCount: 0, failedCount: 0, totalAttempted: 0 };
    }
}

async function globalTeardown() {
    if (process.env.SKIP_AUTH === 'true') return;
    console.info(`\n---- Executing Nala Global Teardown ----\n`);
    try {
        await cleanupClonedCards();
    } catch (error) {
        console.error('\x1b[31m✘\x1b[0m Global teardown failed:', error.message);
    }
    console.info(`---- Nala Global Teardown Complete ----\n`);
}

export default globalTeardown;
export { printCleanupSummary };
