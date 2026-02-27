#!/usr/bin/env node

/**
 * Manual cleanup utility for MAS Studio fragments
 *
 * EXAMPLES:
 *
 * # Run with default values (2 days back, default automation test user)
 * node nala/utils/cleanup-cloned-cards.js
 *
 * # Preview what would be deleted without actually deleting (dry run)
 * node nala/utils/cleanup-cloned-cards.js --dry-run
 *
 * # Clean fragments for a different user
 * node nala/utils/cleanup-cloned-cards.js --user "<email>@adobe.com"
 *
 * # Clean fragments from last 7 days
 * node nala/utils/cleanup-cloned-cards.js --days 7
 *
 * # Clean fragments for specific user from last 5 days
 * node nala/utils/cleanup-cloned-cards.js --user "<email>@adobe.com" --days 5
 *
 * # Dry run with verbose output to see all details
 * node nala/utils/cleanup-cloned-cards.js --dry-run --verbose
 *
 * # Full example: specific user, 3 days back, dry run, verbose
 * node nala/utils/cleanup-cloned-cards.js --user "<email>@adobe.com" --days 3 --dry-run --verbose
 */

import { chromium, devices } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const currentDir = dirname(fileURLToPath(import.meta.url));
const authFile = join(currentDir, '../.auth/user.json');
async function cleanupClonedCards(options = {}) {
    const {
        baseURL = process.env.PR_BRANCH_LIVE_URL || process.env.LOCAL_TEST_LIVE_URL || 'https://main--mas--adobecom.aem.live',
        daysBack = 2,
        dryRun = false,
        verbose = false,
        user = process.env.IMS_EMAIL || 'cod23684+masautomation@adobetest.com',
    } = options;

    console.log('🧹 MAS Studio Fragment Cleanup Utility');
    console.log('=========================================');
    console.log(`Target URL      : ${baseURL}`);
    console.log(`Days back       : ${daysBack}`);
    console.log(`Target user     : ${user}`);
    console.log(`Dry run         : ${dryRun ? 'Yes' : 'No'}`);
    console.log('');

    try {
        // Calculate the cutoff date
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysBack);
        const cutoffDateStr = cutoffDate.toISOString().split('T')[0]; // YYYY-MM-DD format

        if (verbose) {
            console.log(`Cleaning fragments created after: ${cutoffDateStr}`);
        }

        // Launch browser with same config as teardown
        let browser;
        try {
            browser = await chromium.launch();
            const context = await browser.newContext({
                ...devices['Desktop Chrome'],
                storageState: authFile,
                bypassCSP: true,
            });
            const page = await context.newPage();

            // Set HTTP headers for chromium
            await page.setExtraHTTPHeaders({
                'sec-ch-ua': '"Chromium";v="123", "Not:A-Brand";v="8"',
            });

            // Same API-based search as global teardown. Browser function receives all data via payload (no Node refs).
            const searchAndDeleteClonedCardsByAPI = async ({
                rootPath,
                pathFragment,
                cutoffDate,
                targetUser,
                processedIds,
                isDryRun,
                isVerbose,
            }) => {
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
                const locale = params.get('locale') || 'en_US';
                const apiPath = `${rootPath}/${path}/${locale}`;
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
                            const createdBy = item.created?.by;
                            const createdAt = item.created?.at;
                            if (createdBy !== targetUser || !createdAt) continue;
                            const fragmentDate = String(createdAt).split('T')[0];
                            if (fragmentDate < cutoffDate) continue;
                            toDelete.push({
                                id: item.id,
                                title: item.title ?? '',
                                created: createdAt,
                                path: item.path,
                            });
                            if (isVerbose) {
                                console.log(`  Found: ${item.title ?? item.id} (${createdAt})`);
                            }
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
                if (isDryRun) {
                    return {
                        success: true,
                        deletedCount: 0,
                        deletedIds: [],
                        failedCount: 0,
                        totalAttempted: toDelete.length,
                        fragmentsFound: toDelete.length,
                        processedIds: toDelete.map((f) => f.id),
                        dryRunFragments: toDelete.map((f) => ({ id: f.id, title: f.title, created: f.created })),
                    };
                }
                const deleteOptions = { startToast: false, endToast: false };
                const results = await Promise.allSettled(
                    toDelete.map((item) =>
                        repo
                            .deleteFragment({ id: item.id }, deleteOptions)
                            .then(() => ({ id: item.id, success: true }))
                            .catch((err) => ({
                                id: item.id,
                                success: false,
                                error: (err?.message || String(err)).substring(0, 200),
                                path: item.path,
                            })),
                    ),
                );
                const successful = results.filter((r) => r.status === 'fulfilled' && r.value?.success).map((r) => r.value.id);
                const failed = results
                    .filter((r) => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value?.success))
                    .map((r) => ({
                        id: r.status === 'fulfilled' ? r.value?.id : 'unknown',
                        error:
                            r.status === 'fulfilled'
                                ? r.value?.error
                                : (r.reason?.message || String(r.reason)).substring(0, 200),
                        path: r.status === 'fulfilled' ? r.value?.path : undefined,
                    }));
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

            // Define paths to check for fragments (different locales/views)
            const pathsToCheck = [
                '#page=content&path=nala',
                '#locale=fr_FR&page=content&path=nala',
                '#locale=en_CA&page=content&path=nala',
                '#locale=en_GB&page=content&path=nala',
                '#locale=en_AU&page=content&path=nala',
            ];

            let totalFragmentsFound = 0;
            let totalFragmentsDeleted = 0;
            const allFailedFragments = [];
            const processedFragmentIds = new Set();

            if (verbose) {
                console.log('🏠 Navigating to studio home...');
            }
            await page.goto(`${baseURL}/studio.html`);
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(3000);

            for (const pathFragment of pathsToCheck) {
                console.log(`📍 Checking path: \x1b[33m${pathFragment}\x1b[0m`);

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
                    rootPath: '/content/dam/mas',
                    pathFragment,
                    cutoffDate: cutoffDateStr,
                    targetUser: user,
                    processedIds: Array.from(processedFragmentIds),
                    isDryRun: dryRun,
                    isVerbose: verbose,
                };
                const cleanupResult = await page.evaluate(searchAndDeleteClonedCardsByAPI, apiPayload);

                // Log results for this specific path
                if (cleanupResult.fragmentsFound > 0) {
                    if (dryRun) {
                        console.log(`  \x1b[33m⚠\x1b[0m  Would delete ${cleanupResult.fragmentsFound} fragments (dry run)`);
                        if (verbose && cleanupResult.dryRunFragments) {
                            cleanupResult.dryRunFragments.forEach((frag) => {
                                console.log(`      - ${frag.title} (${frag.created})`);
                            });
                        }
                    } else {
                        const failedCount = cleanupResult.failedCount || 0;
                        if (failedCount > 0) {
                            console.log(
                                `  \x1b[33m⚠\x1b[0m Found ${cleanupResult.fragmentsFound} fragments, deleted ${cleanupResult.deletedCount}, failed ${failedCount}`,
                            );
                            if (cleanupResult.failedFragments) {
                                cleanupResult.failedFragments.forEach((frag) => {
                                    const pathInfo = frag.path ? ` (path: ${frag.path})` : '';
                                    console.log(
                                        `      \x1b[31m✘\x1b[0m Failed: ${frag.id}${pathInfo} - ${frag.error || 'Unknown error'}`,
                                    );
                                });
                            }
                        } else {
                            console.log(
                                `  \x1b[32m✓\x1b[0m Found ${cleanupResult.fragmentsFound} fragments, deleted ${cleanupResult.deletedCount}`,
                            );
                        }
                    }
                } else {
                    console.log(`  ➖ No fragments found in this path`);
                }

                // Accumulate results from this path
                totalFragmentsFound += cleanupResult.fragmentsFound || 0;
                totalFragmentsDeleted += cleanupResult.deletedCount || 0;

                if (cleanupResult.failedFragments) {
                    allFailedFragments.push(...cleanupResult.failedFragments);
                }

                // Track processed fragment IDs to avoid duplicates in next path
                if (cleanupResult.processedIds) {
                    cleanupResult.processedIds.forEach((id) => processedFragmentIds.add(id));
                }
            }

            // Print summary
            console.log(`\n${'='.repeat(42)}`);
            console.log('Summary:');
            console.log(`  Total fragments found      : ${totalFragmentsFound}`);
            if (dryRun) {
                console.log(`  \x1b[33mWould delete (dry run)     : ${totalFragmentsFound}\x1b[0m`);
            } else {
                console.log(`  \x1b[32m✓\x1b[0m Successfully deleted     : ${totalFragmentsDeleted}`);
                if (allFailedFragments.length > 0) {
                    console.log(`  \x1b[31m✘\x1b[0m Failed to delete         : ${allFailedFragments.length}`);
                    console.log('\nFailed fragments:');
                    allFailedFragments.forEach((fragment) => {
                        const pathInfo = fragment.path ? ` (path: ${fragment.path})` : '';
                        console.log(`  \x1b[31m✘\x1b[0m ${fragment.id}${pathInfo}: ${fragment.error || 'Unknown error'}`);
                    });
                }
            }
            console.log('='.repeat(42));

            return {
                success: allFailedFragments.length === 0,
                deletedCount: totalFragmentsDeleted,
                failedCount: allFailedFragments.length,
                totalAttempted: totalFragmentsFound,
            };
        } catch (error) {
            throw error;
        } finally {
            // Always close browser if it was opened
            if (browser) {
                await browser.close();
            }
        }
    } catch (error) {
        console.error('\x1b[31m✘\x1b[0m Cleanup failed:', error.message);
        if (verbose) {
            console.error(error.stack);
        }
        process.exit(1);
    }
}

// CLI interface
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const args = process.argv.slice(2);
    const options = {};

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        if (arg === '--help' || arg === '-h') {
            console.log(`
MAS Studio Fragment Cleanup Utility

Usage:
  node cleanup-cloned-cards.js [options]

Options:
  --days <number>   Number of days back to clean (default: 2)
  --url <url>       Base URL to clean (default: from env or main--mas--adobecom.aem.live)
  --user <email>    Target user email (default: IMS_EMAIL env var or cod23684+masautomation@adobetest.com)
  --dry-run         Preview what would be deleted without actually deleting
  --verbose, -v     Show detailed output
  --help, -h        Show this help message

Examples:
  # Dry run to preview what would be deleted
  node cleanup-cloned-cards.js --dry-run

  # Clean fragments from last 7 days with verbose output
  node cleanup-cloned-cards.js --days 7 --verbose

  # Clean fragments for a specific user
  node cleanup-cloned-cards.js --user "myemail@example.com"

  # Clean from a specific URL
  node cleanup-cloned-cards.js --url https://main--mas--adobecom.aem.live

  # Combine options
  node cleanup-cloned-cards.js --days 3 --user "test@example.com" --dry-run --verbose
            `);
            process.exit(0);
        } else if (arg === '--days') {
            options.daysBack = parseInt(args[++i], 10);
        } else if (arg === '--url') {
            options.baseURL = args[++i];
        } else if (arg === '--user') {
            options.user = args[++i];
        } else if (arg === '--dry-run') {
            options.dryRun = true;
        } else if (arg === '--verbose' || arg === '-v') {
            options.verbose = true;
        }
    }

    cleanupClonedCards(options);
}

export { cleanupClonedCards };
