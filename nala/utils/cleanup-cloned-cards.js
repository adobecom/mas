#!/usr/bin/env node

import { chromium } from '@playwright/test';
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
    } = options;

    console.log('🧹 MAS Studio Cloned Cards Cleanup Utility');
    console.log('==========================================');
    console.log(`Target URL: ${baseURL}`);
    console.log(`Days back: ${daysBack}`);
    console.log(`Dry run: ${dryRun ? 'Yes' : 'No'}`);
    console.log('');

    let browser;
    try {
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({
            storageState: authFile,
        });
        const page = await context.newPage();

        if (verbose) {
            page.on('console', (msg) => console.log('Browser:', msg.text()));
        }

        console.log('📱 Navigating to MAS Studio...');
        await page.goto(`${baseURL}/studio.html`);
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(3000);

        console.log('🔍 Scanning for cloned cards...');

        const cleanupResult = await page.evaluate(
            ({ daysBack, dryRun }) => {
                const repo = document.querySelector('mas-repository');
                if (!repo) {
                    return {
                        success: false,
                        error: 'mas-repository not found',
                    };
                }

                const cache = document.createElement('aem-fragment').cache;
                if (!cache) {
                    return {
                        success: false,
                        error: 'aem-fragment cache not found',
                    };
                }

                const targetDates = [];
                for (let i = 0; i < daysBack; i++) {
                    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
                    targetDates.push(date.toISOString().split('T')[0]);
                }

                const fragments = [...document.querySelectorAll('aem-fragment')]
                    .map((fragment) => cache.get(fragment.data.id))
                    .filter((fragment) => {
                        if (!fragment || !fragment.created) return false;

                        const isTargetDate = targetDates.some((date) => new RegExp(date).test(fragment.created.at));

                        return isTargetDate && fragment.created.by === 'cod23684+masautomation@adobetest.com';
                    });

                console.log(`Found ${fragments.length} cloned cards to clean up`);

                if (dryRun) {
                    return {
                        success: true,
                        dryRun: true,
                        foundCount: fragments.length,
                        fragments: fragments.map((f) => ({
                            id: f.id,
                            createdAt: f.created.at,
                            createdBy: f.created.by,
                        })),
                    };
                }

                const deletePromises = fragments.map((fragment) => {
                    console.log(`Deleting fragment: ${fragment.id}`);
                    return repo.aem.deleteFragment(fragment);
                });

                return Promise.all(deletePromises)
                    .then(() => ({
                        success: true,
                        deletedCount: fragments.length,
                        deletedIds: fragments.map((f) => f.id),
                    }))
                    .catch((error) => ({
                        success: false,
                        error: error.message,
                        attemptedCount: fragments.length,
                    }));
            },
            { daysBack, dryRun },
        );

        if (cleanupResult.success) {
            if (cleanupResult.dryRun) {
                console.log(`🔍 DRY RUN: Found ${cleanupResult.foundCount} cloned cards that would be deleted`);
                if (cleanupResult.fragments && cleanupResult.fragments.length > 0) {
                    console.log('\nCards that would be deleted:');
                    cleanupResult.fragments.forEach((f) => {
                        console.log(`  - ${f.id} (created: ${f.createdAt})`);
                    });
                }
            } else {
                console.log(`\x1b[32m✓\x1b[0m Successfully cleaned up ${cleanupResult.deletedCount} cloned cards`);
                if (cleanupResult.deletedIds && cleanupResult.deletedIds.length > 0) {
                    console.log('\nDeleted card IDs:');
                    cleanupResult.deletedIds.forEach((id) => console.log(`  - ${id}`));
                }
            }
        } else {
            console.error(`\x1b[31m✘\x1b[0m Cleanup failed: ${cleanupResult.error}`);
            if (cleanupResult.attemptedCount) {
                console.error(`Attempted to clean ${cleanupResult.attemptedCount} cards`);
            }
            process.exit(1);
        }

        return cleanupResult;
    } catch (error) {
        console.error('\x1b[31m✘\x1b[0m Error during cleanup:', error.message);
        if (verbose) {
            console.error(error.stack);
        }
        process.exit(1);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    const args = process.argv.slice(2);
    const options = {};

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--dry-run':
                options.dryRun = true;
                break;
            case '--verbose':
                options.verbose = true;
                break;
            case '--days':
                options.daysBack = parseInt(args[++i]) || 2;
                break;
            case '--url':
                options.baseURL = args[++i];
                break;
            case '--help':
                console.log(`
MAS Studio Cloned Cards Cleanup Utility

Usage: node cleanup-cloned-cards.js [options]

Options:
  --dry-run     Show what would be deleted without actually deleting
  --verbose     Show detailed output
  --days N      Number of days back to search (default: 2)
  --url URL     Base URL to use (default: from environment)
  --help        Show this help message

Examples:
  node cleanup-cloned-cards.js --dry-run
  node cleanup-cloned-cards.js --days 7 --verbose
  node cleanup-cloned-cards.js --url https://main--mas--adobecom.aem.live
                `);
                process.exit(0);
        }
    }

    cleanupClonedCards(options);
}

export { cleanupClonedCards };
