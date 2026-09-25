import { expect, test } from '@playwright/test';
import { features } from './benchmark.spec.js';
import BenchmarkPage from './benchmark.page.js';
import { constructTestUrl } from '../../utils/commerce.js';
import { installNetworkGuard, attachResponseWatcher } from '../../libs/network-guard.js';

test.beforeEach(async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'Not supported to run on multiple browsers.');
    if (browserName === 'chromium') {
        await page.setExtraHTTPHeaders({ 'sec-ch-ua': '"Chromium";v="123", "Not:A-Brand";v="8"' });
    }
    // installNetworkGuard's context.route('**/*', ...) both paces/watches EDS+ODIN traffic AND
    // (as a side effect of any route interception) disables the HTTP cache for matched requests —
    // it replaces the previous standalone no-op `page.route('**', route => route.continue())`
    // that existed here only for that cache-disabling side effect. Keeping both would have been
    // actively harmful: Playwright resolves overlapping routes LIFO, so a later-registered no-op
    // page.route('**', ...) would shadow/bypass this context-level guard entirely.
    await installNetworkGuard(context);
    attachResponseWatcher(page); // page already exists — context.on('page') won't cover it
});

test.describe('Benchmark feature test suite', () => {
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const testPage = constructTestUrl(baseURL, features[0].path);
        console.info('[Test Page]: ', testPage);

        await test.step('step-1: Go to Merch Card Benchmark feature test page', async () => {
            await page.goto(testPage);
            await page.waitForLoadState('domcontentloaded');
            await expect(page).toHaveURL(`${baseURL}${features[0].path}`);
        });

        await test.step('step-2: Validate benchmark', async () => {
            const selector = '.ccd-slice';
            const benchmarkPage = new BenchmarkPage(page);
            const benchmark = await benchmarkPage.getBenchmark(selector);
            await expect(benchmark).toBeVisible();
            const limit = await benchmark.getAttribute('data-benchmark-limit');
            const previousLimit = await benchmark.getAttribute('data-benchmark-previous-limit');
            const limitMessage = previousLimit ? `${limit}ms (adjusted from ${previousLimit}ms)` : `${limit}ms`;
            const masks = await benchmarkPage.getMasks(selector);
            await expect(await masks.first()).toBeVisible();
            const times = await masks.evaluateAll((nodes) =>
                nodes.map((node) => {
                    const time = node.getAttribute('data-benchmark-time');
                    console.log(time);
                    return time;
                }),
            );

            console.log(times);
            expect(times.length).toBeGreaterThan(0);
            times.forEach((time) => {
                expect(
                    parseFloat(time) < parseFloat(limit),
                    `${time}ms should be less than limit ${limitMessage}`,
                ).toBeTruthy();
            });
        });
    });
});
