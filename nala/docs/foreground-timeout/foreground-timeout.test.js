import { expect, test } from '@playwright/test';
import { build } from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// MWPW-206151 — merch-card offer-resolution timeouts falsely fire in frozen/
// backgrounded webviews. checkReady() now races a *foreground-time* budget
// (setForegroundTimeout) instead of a wall-clock setTimeout. A unit test can
// only fake `visibilitychange`; this spec proves the fix under a *genuine* JS
// freeze via CDP Debugger.pause (which suspends the renderer event loop, so
// pre-scheduled timers fire overdue on resume — exactly the webview scenario).

const CURRENT_DIR = dirname(fileURLToPath(import.meta.url));
const UTILS_SRC = resolve(CURRENT_DIR, '../../../web-components/src/utils.js');

// Bundle the *shipped* setForegroundTimeout into an IIFE global so the test
// exercises real code from web-components/src/utils.js — never a copy that can
// drift from the source under test.
async function bundleRealTimer() {
    const { outputFiles } = await build({
        stdin: {
            contents: `export { setForegroundTimeout } from ${JSON.stringify(UTILS_SRC)};`,
            resolveDir: CURRENT_DIR,
            loader: 'js',
        },
        bundle: true,
        format: 'iife',
        globalName: '__masTimer',
        write: false,
    });
    return outputFiles[0].text;
}

test.describe('merch-card foreground-time timeout (MWPW-206151)', () => {
    test.beforeEach(async ({ browserName }) => {
        test.skip(browserName !== 'chromium', 'Needs CDP (Debugger.pause).');
    });

    test('foreground timeout survives a webview freeze that trips a wall-clock timer @mas-foreground-timeout', async ({
        page,
    }) => {
        const timerBundle = await bundleRealTimer();
        const cdp = await page.context().newCDPSession(page);
        await cdp.send('Debugger.enable');

        await page.setContent('<!doctype html><meta charset="utf8"><body></body>');
        await page.addScriptTag({ content: timerBundle });

        // Two "cards" race the same resolution "work" against a timeout: one uses
        // a plain wall-clock setTimeout (old behaviour), the other the real
        // setForegroundTimeout (fix). visibilityState is made settable to model a
        // webview lifecycle (hidden fires before the freeze, visible after resume).
        await page.evaluate(() => {
            let vis = 'visible';
            Object.defineProperty(document, 'visibilityState', {
                configurable: true,
                get: () => vis,
            });
            window.__setVisible = (v) => {
                vis = v;
                document.dispatchEvent(new Event('visibilitychange'));
            };

            const BUDGET = 1500;
            // Offer resolution: the fetch/hydrate pipeline is suspended by the
            // freeze and only resumes stepping after unfreeze, then needs ~250ms
            // more of foreground time to settle. Modelled as "complete 250ms after
            // the page becomes visible again".
            const work = () =>
                new Promise((resolveWork) => {
                    document.addEventListener('visibilitychange', function onVis() {
                        if (document.visibilityState !== 'visible') return;
                        document.removeEventListener('visibilitychange', onVis);
                        setTimeout(() => resolveWork('success'), 250);
                    });
                });
            const wallClock = (ms) => new Promise((r) => setTimeout(() => r('timeout'), ms));

            window.__wallClockCard = Promise.race([work(), wallClock(BUDGET)]);
            window.__foregroundCard = Promise.race([
                work(),
                new Promise((r) => window.__masTimer.setForegroundTimeout(() => r('timeout'), BUDGET)),
            ]);
        });

        // ~200ms of foreground, then the page goes hidden BEFORE the freeze (real
        // Page Lifecycle order: hidden -> frozen).
        await page.waitForTimeout(200);
        await page.evaluate(() => window.__setVisible('hidden'));

        // Genuine JS suspension for 3s wall-clock (> BUDGET). CDP still responds
        // while the renderer event loop is halted.
        await cdp.send('Debugger.pause');
        await new Promise((r) => setTimeout(r, 3000));
        await cdp.send('Debugger.resume');

        // Page becomes visible again (resume).
        await page.evaluate(() => window.__setVisible('visible'));

        const [wallClockResult, foregroundResult] = await page.evaluate(() =>
            Promise.all([window.__wallClockCard, window.__foregroundCard]),
        );

        // Old behaviour: the wall-clock deadline elapsed during the freeze, so the
        // timer fires overdue on resume and beats the resuming pipeline.
        expect(wallClockResult, 'wall-clock timer falsely times out on freeze/resume').toBe('timeout');
        // Fix: the budget was paused while hidden, so the pipeline wins.
        expect(foregroundResult, 'foreground-time timer survives the freeze').toBe('success');
    });

    // NOTE: a live-page dist E2E was intentionally dropped. Reproducing the field
    // condition (offer/WCS resolution pending while the page is backgrounded past the
    // budget) is not tractable against the deployed docs page: a CDP freeze drops the
    // held sockets, holding the fragment yields an empty card that takes the success
    // path, and the offer/WCS call isn't cleanly interceptable — every variant
    // false-passed on the old bundle. Instead: this spec proves the fix LOGIC against
    // the real shipped source, and the existing "Check for uncommitted changes" step
    // in .github/workflows/web-components-pr.yaml (runs `npm run build`, then fails if
    // `git status --porcelain` is non-empty) proves that source is what ships in dist —
    // i.e. a src change committed without the rebuilt bundle fails CI.
});
