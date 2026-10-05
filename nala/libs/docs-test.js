import { test as base } from '@playwright/test';
import { installEdsThrottleOnPage, removePageRoutes } from './eds-throttle.js';
import GlobalRequestCounter from './global-request-counter.js';
import { getResourceMetrics } from './static-resource-cache.js';

export const test = base.extend({
    page: async ({ page, context }, use, testInfo) => {
        await installEdsThrottleOnPage(page);
        const stopCounting = await GlobalRequestCounter.init(context);
        const before = getResourceMetrics();
        try {
            await use(page);
        } finally {
            await removePageRoutes(page);
            stopCounting();
            GlobalRequestCounter.saveCountToFileSync();
            const after = getResourceMetrics();
            await testInfo.attach('Static resource requests', {
                body: JSON.stringify({
                    cacheHits: after.cacheHits - before.cacheHits,
                    upstreamRequests: after.upstreamRequests - before.upstreamRequests,
                }),
                contentType: 'application/json',
            });
        }
    },
});

export { expect } from '@playwright/test';
