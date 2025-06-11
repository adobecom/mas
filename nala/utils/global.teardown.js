async function cleanupClonedCards() {
    console.info(
        '---- Executing Nala Global Teardown: Cleaning up cloned cards ----\n',
    );

    try {
        const { chromium } = await import('@playwright/test');
        const { existsSync } = await import('fs');
        const authFilePath = './nala/.auth/user.json';
        
        // Launch browser without authentication
        const browser = await chromium.launch();
        let context;
        
        // Try to use auth file if it exists, but proceed without it if not
        if (existsSync(authFilePath)) {
            try {
                context = await browser.newContext({
                    storageState: authFilePath,
                });
                console.info('Using authentication from stored file');
            } catch (authError) {
                console.warn(`⚠️ Error loading auth file: ${authError.message}`);
                context = await browser.newContext();
            }
        } else {
            console.warn('⚠️ Auth file not found, proceeding without authentication');
            context = await browser.newContext();
        }
        
        const page = await context.newPage();

        const baseURL =
            process.env.PR_BRANCH_LIVE_URL ||
            process.env.LOCAL_TEST_LIVE_URL ||
            'https://main--mas--adobecom.aem.live';

        await page.goto(`${baseURL}/studio.html`);
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(3000);

        console.info('Attempting to clean up cloned cards (may not work without auth)');
        
        // Continue with cleanup attempt even without authentication
        const cleanupResult = await page.evaluate(() => {
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

            const fragments = [...document.querySelectorAll('aem-fragment')]
                .map((fragment) => cache.get(fragment.data.id))
                .filter((fragment) => {
                    if (!fragment || !fragment.created) return false;

                    const today = new Date().toISOString().split('T')[0];
                    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
                        .toISOString()
                        .split('T')[0];

                    return (
                        (new RegExp(today).test(fragment.created.at) ||
                            new RegExp(yesterday).test(fragment.created.at)) &&
                        fragment.created.by ===
                            'cod23684+masautomation@adobetest.com'
                    );
                });

            console.log(`Found ${fragments.length} cloned cards to clean up`);

            // If we're not authenticated, just report what we found without attempting deletion
            if (!document.cookie.includes('ims_sid') && !sessionStorage.getItem('masAccessToken')) {
                return {
                    success: true,
                    notAuthenticated: true,
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
        });

        if (cleanupResult.success) {
            if (cleanupResult.notAuthenticated) {
                console.info(
                    `⚠️ Found ${cleanupResult.foundCount} cloned cards but couldn't delete them (not authenticated)`,
                );
                if (
                    cleanupResult.fragments &&
                    cleanupResult.fragments.length > 0
                ) {
                    console.info(
                        'Cards that would be deleted:',
                        cleanupResult.fragments.map(f => f.id).join(', '),
                    );
                }
            } else {
                console.info(
                    `✅ Successfully cleaned up ${cleanupResult.deletedCount} cloned cards`,
                );
                if (
                    cleanupResult.deletedIds &&
                    cleanupResult.deletedIds.length > 0
                ) {
                    console.info(
                        'Deleted card IDs:',
                        cleanupResult.deletedIds.join(', '),
                    );
                }
            }
        } else {
            console.error(`❌ Cleanup failed: ${cleanupResult.error}`);
            if (cleanupResult.attemptedCount) {
                console.error(
                    `Attempted to clean ${cleanupResult.attemptedCount} cards`,
                );
            }
        }

        await browser.close();
        return cleanupResult;
    } catch (error) {
        console.error('❌ Error during cleanup:', error.message);
        return { success: false, error: error.message };
    }
}

async function globalTeardown() {
    console.info('---- Executing Nala Global Teardown ----\n');

    if (
        process.env.GITHUB_ACTIONS === 'true' ||
        process.env.CIRCLECI ||
        process.env.LOCAL_TEST_LIVE_URL
    ) {
        await cleanupClonedCards();
    } else {
        console.info('Skipping cleanup - not in test environment');
    }

    console.info('---- Nala Global Teardown Complete ----\n');
}

export default globalTeardown; 