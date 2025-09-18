async function cleanupClonedCards() {
    console.info('---- Executing Nala Global Teardown: Cleaning up cloned cards ----\n');

    try {
        const { chromium } = await import('@playwright/test');
        const browser = await chromium.launch();
        const context = await browser.newContext({
            storageState: './nala/.auth/user.json',
        });
        const page = await context.newPage();

        const baseURL =
            process.env.PR_BRANCH_LIVE_URL || process.env.LOCAL_TEST_LIVE_URL || 'https://main--mas--adobecom.aem.live';

        await page.goto(`${baseURL}/studio.html`);
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(3000);

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
                    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

                    return (
                        (new RegExp(today).test(fragment.created.at) || new RegExp(yesterday).test(fragment.created.at)) &&
                        fragment.created.by === 'cod23684+masautomation@adobetest.com'
                    );
                });

            console.log(`Found ${fragments.length} cloned cards to clean up`);

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
            console.info(`✅ Successfully cleaned up ${cleanupResult.deletedCount} cloned cards`);
            if (cleanupResult.deletedIds && cleanupResult.deletedIds.length > 0) {
                console.info('Deleted card IDs:', cleanupResult.deletedIds.join(', '));
            }
        } else {
            console.error(`❌ Cleanup failed: ${cleanupResult.error}`);
            if (cleanupResult.attemptedCount) {
                console.error(`Attempted to clean ${cleanupResult.attemptedCount} cards`);
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

    if (process.env.GITHUB_ACTIONS === 'true' || process.env.CIRCLECI || process.env.LOCAL_TEST_LIVE_URL) {
        await cleanupClonedCards();
    } else {
        console.info('Skipping cleanup - not in test environment');
    }

    console.info('---- Nala Global Teardown Complete ----\n');
}

export default globalTeardown;
