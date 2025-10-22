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
        user = 'cod23684+masautomation@adobetest.com',
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

            // Define paths to check for fragments (different locales/views)
            const pathsToCheck = [
                '#page=content&path=nala', // Default path
                '#locale=fr_FR&page=content&path=nala', // French locale path
            ];

            let totalFragmentsFound = 0;
            let totalFragmentsDeleted = 0;
            let allFailedFragments = [];
            const processedFragmentIds = new Set();
            // Navigate to studio home first to warm up the session
            if (verbose) {
                console.log('🏠 Navigating to studio home...');
            }
            await page.goto(`${baseURL}/studio.html`);
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(3000);

            // Check each path for fragments
            for (const pathFragment of pathsToCheck) {
                console.log(`📍 Checking path: \x1b[33m${pathFragment}\x1b[0m`);

                await page.goto(`${baseURL}/studio.html${pathFragment}`);
                await page.waitForLoadState('domcontentloaded');

                await page.waitForFunction(
                    () => {
                        const repo = document.querySelector('mas-repository');
                        return repo && repo.aem && repo.aem.deleteFragment;
                    },
                    { timeout: 5000 },
                );

                // Wait for fragments to load
                try {
                    await page.waitForSelector('mas-fragment-render', { timeout: 8000, state: 'attached' });
                    await page.waitForTimeout(2000);
                } catch (error) {
                    // No fragments found within timeout, continue anyway
                }

                const cleanupResult = await page.evaluate(
                    ({ cutoffDate, targetUser, processedIds, isDryRun, isVerbose }) => {
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

                        // Find fragments matching criteria
                        const cache = document.createElement('aem-fragment').cache;
                        const masFragmentRenderElements = [...document.querySelectorAll('mas-fragment-render')];
                        const matchingFragments = [];

                        masFragmentRenderElements.forEach((element) => {
                            const dataId = element.getAttribute('data-id');
                            if (!dataId) return;

                            // Skip if already processed in a previous path
                            if (processedIds.includes(dataId)) return;

                            if (cache) {
                                const fragmentData = cache.get(dataId);
                                if (fragmentData) {
                                    // Check if fragment matches criteria:
                                    // 1. Created by target user
                                    // 2. Created after cutoff date
                                    const createdBy = fragmentData.created?.by;
                                    const createdAt = fragmentData.created?.at;

                                    if (createdBy === targetUser && createdAt) {
                                        // Extract date from ISO string (e.g., "2025-03-21T10:30:00.000Z")
                                        const fragmentDate = createdAt.split('T')[0];

                                        if (fragmentDate >= cutoffDate) {
                                            matchingFragments.push({
                                                id: dataId,
                                                title: fragmentData.title,
                                                created: createdAt,
                                                fragment: fragmentData,
                                            });

                                            if (isVerbose) {
                                                console.log(`  Found: ${fragmentData.title} (${createdAt})`);
                                            }
                                        }
                                    }
                                }
                            }
                        });

                        if (matchingFragments.length === 0) {
                            return {
                                success: true,
                                deletedCount: 0,
                                deletedIds: [],
                                failedCount: 0,
                                totalAttempted: 0,
                                message: 'No fragments found matching criteria',
                                fragmentsFound: 0,
                            };
                        }

                        // If dry run, just return what would be deleted
                        if (isDryRun) {
                            return {
                                success: true,
                                deletedCount: 0,
                                deletedIds: [],
                                failedCount: 0,
                                totalAttempted: matchingFragments.length,
                                fragmentsFound: matchingFragments.length,
                                processedIds: matchingFragments.map((f) => f.id),
                                dryRunFragments: matchingFragments.map((f) => ({
                                    id: f.id,
                                    title: f.title,
                                    created: f.created,
                                })),
                            };
                        }

                        // Delete each fragment
                        const deletePromises = matchingFragments.map(async (fragmentInfo) => {
                            try {
                                await repo.aem.deleteFragment(fragmentInfo.fragment);
                                return { id: fragmentInfo.id, success: true };
                            } catch (error) {
                                const errorMessage = error.message || error.toString();
                                // Treat 404 errors as success (fragment already deleted)
                                if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
                                    return { id: fragmentInfo.id, success: true, wasAlreadyDeleted: true };
                                }
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
                                        result.status === 'rejected' ||
                                        (result.status === 'fulfilled' && !result.value.success),
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
                                processedIds: matchingFragments.map((f) => f.id),
                            };
                        });
                    },
                    {
                        cutoffDate: cutoffDateStr,
                        targetUser: user,
                        processedIds: Array.from(processedFragmentIds),
                        isDryRun: dryRun,
                        isVerbose: verbose,
                    },
                );

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
                        console.log(
                            `  \x1b[32m✓\x1b[0m Found ${cleanupResult.fragmentsFound} fragments, deleted ${cleanupResult.deletedCount}`,
                        );
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
            console.log('\n' + '='.repeat(42));
            console.log('Summary:');
            console.log(`  Total fragments found      : ${totalFragmentsFound}`);
            if (dryRun) {
                console.log(`  \x1b[33mWould delete (dry run)     : ${totalFragmentsFound}\x1b[0m`);
            } else {
                console.log(`  \x1b[32m✓\x1b[0m Successfully deleted     : ${totalFragmentsDeleted}`);
                if (allFailedFragments.length > 0) {
                    console.log(`  \x1b[31m✘\x1b[0m Failed to delete         : ${allFailedFragments.length}`);
                    if (verbose) {
                        console.log('\nFailed fragments:');
                        allFailedFragments.forEach((fragment) => {
                            console.log(`  - ${fragment.id}: ${fragment.error}`);
                        });
                    }
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
  --user <email>    Target user email (default: cod23684+masautomation@adobetest.com)
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
