async function cleanupClonedCards() {
    console.info(`---- Executing Nala Global Teardown: Cleaning up cloned cards ----\n`);

    try {
        // Import fragment tracker
        const { getExistingRunId, clearRunId } = await import('./fragment-tracker.js');

        // Get the current run ID
        const currentRunId = getExistingRunId();

        if (!currentRunId) {
            console.info('✅ No run ID found - no fragments to clean up');
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
        ];

        let totalFragmentsFound = 0;
        let totalFragmentsDeleted = 0;
        let allFailedFragments = [];

        try {
            // Check each path for fragments
            for (const pathFragment of pathsToCheck) {
                console.log(`📍 Checking path: ${pathFragment}`);

                await page.goto(`${baseURL}/studio.html${pathFragment}`);
                await page.waitForLoadState('domcontentloaded');

                await page.waitForFunction(
                    () => {
                        const repo = document.querySelector('mas-repository');
                        return repo && repo.aem && repo.aem.deleteFragment;
                    },
                    { timeout: 30000 },
                );

                // Wait a bit longer for fragments to be loaded from the test
                await page.waitForTimeout(3000);

                // If no fragments found, wait a bit more and check cache
                const fragmentCount = await page.evaluate(() => {
                    return document.querySelectorAll('mas-fragment-render').length;
                });

                if (fragmentCount === 0) {
                    await page.waitForTimeout(2000);
                }

                const cleanupResult = await page.evaluate((runId) => {
                    const repo = document.querySelector('mas-repository');
                    if (!repo || !repo.aem || !repo.aem.deleteFragment) {
                        return {
                            success: false,
                            error: 'mas-repository not ready for deletion',
                            deletedCount: 0,
                            failedCount: 0,
                            totalAttempted: 0,
                        };
                    }

                    // Find fragments with nala run ID in their title
                    const cache = document.createElement('aem-fragment').cache;
                    const masFragmentRenderElements = [...document.querySelectorAll('mas-fragment-render')];
                    const matchingFragments = [];

                    masFragmentRenderElements.forEach((element) => {
                        const dataId = element.getAttribute('data-id');
                        if (!dataId) return;

                        // Check if fragment title contains our run ID
                        if (cache) {
                            const fragmentData = cache.get(dataId);
                            if (fragmentData && fragmentData.title && fragmentData.title.includes(`[${runId}]`)) {
                                matchingFragments.push({
                                    id: dataId,
                                    title: fragmentData.title,
                                    fragment: fragmentData, // Store the full fragment object
                                });
                            }
                        }
                    });

                    // Also check if fragments might be in cache but not in DOM yet
                    if (matchingFragments.length === 0 && cache && cache.entries) {
                        const cacheEntries = [...cache.entries()];

                        cacheEntries.forEach(([id, fragment]) => {
                            if (fragment && fragment.title && fragment.title.includes(`[${runId}]`)) {
                                matchingFragments.push({
                                    id: id,
                                    title: fragment.title,
                                    fragment: fragment, // Store the full fragment object
                                });
                            }
                        });
                    }

                    if (matchingFragments.length === 0) {
                        return {
                            success: true,
                            deletedCount: 0,
                            deletedIds: [],
                            failedCount: 0,
                            totalAttempted: 0,
                            message: 'No fragments found with run ID',
                            fragmentsFound: 0,
                        };
                    }

                    // Delete each fragment
                    const deletePromises = matchingFragments.map(async (fragmentInfo) => {
                        try {
                            await repo.aem.deleteFragment(fragmentInfo.fragment);
                            return { id: fragmentInfo.id, success: true };
                        } catch (error) {
                            const errorMessage = error.message || error.toString();
                            return { id: fragmentInfo.id, success: false, error: errorMessage };
                        }
                    });

                    return Promise.allSettled(deletePromises).then((results) => {
                        const successful = results
                            .filter((result) => result.status === 'fulfilled' && result.value.success)
                            .map((result) => result.value.id);

                        const failed = results
                            .filter(
                                (result) =>
                                    result.status === 'rejected' || (result.status === 'fulfilled' && !result.value.success),
                            )
                            .map((result) => ({
                                id: result.status === 'fulfilled' ? result.value.id : 'unknown',
                                error: result.status === 'fulfilled' ? result.value.error : result.reason.message,
                            }));

                        return {
                            success: failed.length === 0,
                            deletedCount: successful.length,
                            deletedIds: successful,
                            failedCount: failed.length,
                            failedFragments: failed,
                            totalAttempted: matchingFragments.length,
                            fragmentsFound: matchingFragments.length,
                        };
                    });
                }, currentRunId);

                // Log results for this specific path
                if (cleanupResult.fragmentsFound > 0) {
                    console.log(`  ✅ Found ${cleanupResult.fragmentsFound} fragments, deleted ${cleanupResult.deletedCount}`);
                } else {
                    console.log(`  ➖ No fragments found in this path`);
                }

                // Accumulate results from this path
                totalFragmentsFound += cleanupResult.fragmentsFound || 0;
                totalFragmentsDeleted += cleanupResult.deletedCount || 0;

                if (cleanupResult.failedFragments) {
                    allFailedFragments.push(...cleanupResult.failedFragments);
                }
            }

            // Log the combined results from all paths
            console.log(`\n🎯 Found Total ${totalFragmentsFound} fragments to delete`);

            if (totalFragmentsDeleted > 0) {
                console.log(`✅ Successfully deleted ${totalFragmentsDeleted} fragments`);
            } else if (totalFragmentsFound === 0) {
                console.log('✅ No fragments found to clean up');
            }

            if (allFailedFragments.length > 0) {
                console.error(
                    `❌ Cleanup failed: ${allFailedFragments.length}/${totalFragmentsFound} fragments failed to delete`,
                );
                console.error('Failed fragments:');
                allFailedFragments.forEach((fragment) => {
                    console.error(`  - ${fragment.id}: ${fragment.error}`);
                });
            }

            clearRunId();

            await browser.close();

            // Save teardown request count to contribute to total suite count
            GlobalRequestCounter.saveCountToFileSync();

            return {
                success: allFailedFragments.length === 0,
                deletedCount: totalFragmentsDeleted,
                failedCount: allFailedFragments.length,
                totalAttempted: totalFragmentsFound,
            };
        } catch (error) {
            await browser.close();
            clearRunId();
            return { success: false, error: error.message, deletedCount: 0, failedCount: 0, totalAttempted: 0 };
        }
    } catch (error) {
        return { success: false, error: error.message, deletedCount: 0, failedCount: 0, totalAttempted: 0 };
    }
}

async function globalTeardown() {
    console.info(`\n---- Executing Nala Global Teardown ----\n`);
    try {
        await cleanupClonedCards();
    } catch (error) {
        console.error('❌ Global teardown failed:', error.message);
    }
    console.info(`---- Nala Global Teardown Complete ----\n`);
}

export default globalTeardown;
