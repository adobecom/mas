import { test as base } from '@playwright/test';
import { installEdsThrottleOnPage, removePageRoutes, getPageRouteMetrics } from './eds-throttle.js';
import GlobalRequestCounter from './global-request-counter.js';
import { getResourceMetrics } from './static-resource-cache.js';

export async function reportStaticResourceRequests(testInfo, before, routeMetrics = {}) {
    const after = getResourceMetrics();
    await testInfo.attach('Static resource requests', {
        body: JSON.stringify({
            cacheHits: after.cacheHits - before.cacheHits,
            upstreamRequests: after.upstreamRequests - before.upstreamRequests,
            ...routeMetrics,
        }),
        contentType: 'application/json',
    });
}

export const test = base.extend({
    page: async ({ page, context }, use, testInfo) => {
        await installEdsThrottleOnPage(page);
        const stopCounting = await GlobalRequestCounter.init(context);
        const before = getResourceMetrics();
        try {
            await use(page);
        } finally {
            try {
                await removePageRoutes(page);
            } finally {
                stopCounting();
                GlobalRequestCounter.saveCountToFileSync();
                await reportStaticResourceRequests(testInfo, before, getPageRouteMetrics(page));
            }
        }
    },
});

export { expect } from '@playwright/test';
