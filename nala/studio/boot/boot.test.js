import { test, expect, miloLibs, setTestPage } from '../../libs/mas-test.js';
import { features } from './boot.spec.js';
import BootPage from './boot.page.js';

test.skip(({ browserName }) => browserName !== 'chromium', 'Not supported to run on multiple browsers.');

const BOOT_ASSET = /^\/(studio|web-components|io)\/.+\.(js|css)$/;

function studioUrl(baseURL, feature, params = {}) {
    const url = new URL(`${baseURL}${feature.path}${miloLibs}`);
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    url.hash = feature.browserParams;
    return url.href;
}

function trackBootAssets(page, baseURL) {
    const { origin } = new URL(baseURL);
    const assets = [];
    page.on('request', (request) => {
        const url = new URL(request.url());
        if (url.origin === origin && BOOT_ASSET.test(url.pathname)) assets.push(url);
    });
    return assets;
}

function assetsNotMatching(assets, versionPattern) {
    return assets.filter((url) => !versionPattern.test(url.searchParams.get('v') ?? '')).map((url) => url.pathname);
}

async function waitForStudio(page) {
    await page.waitForFunction(() => Boolean(customElements.get('mas-studio')));
}

test.describe('M@S Studio Boot', () => {
    // @MAS-Studio-Boot-versioned-assets — every Studio JS/CSS request carries a content hash
    test(`${features[0].name},${features[0].tags}`, async ({ page, baseURL }) => {
        const testPage = studioUrl(baseURL, features[0]);
        setTestPage(testPage);
        const assets = trackBootAssets(page, baseURL);

        await test.step('step-1: Load Studio', async () => {
            await page.goto(testPage);
            await waitForStudio(page);
        });

        await test.step('step-2: Verify every Studio asset request is versioned', async () => {
            expect(assets.length).toBeGreaterThan(50);
            expect(assetsNotMatching(assets, /^[0-9a-f]{8}$/)).toEqual([]);
        });
    });

    // @MAS-Studio-Boot-cache-salt — ?cb=N is appended to every version
    test(`${features[1].name},${features[1].tags}`, async ({ page, baseURL }) => {
        const { data } = features[1];
        const testPage = studioUrl(baseURL, features[1], { cb: data.cb });
        setTestPage(testPage);
        const assets = trackBootAssets(page, baseURL);

        await test.step('step-1: Load Studio with a cache salt', async () => {
            await page.goto(testPage);
            await waitForStudio(page);
        });

        await test.step('step-2: Verify every version carries the salt', async () => {
            expect(assets.length).toBeGreaterThan(50);
            expect(assetsNotMatching(assets, new RegExp(`^[0-9a-f]{8}-${data.cb}$`))).toEqual([]);
        });
    });

    // @MAS-Studio-Boot-salt-rejects-markup — a non-numeric cb is ignored and injects nothing
    test(`${features[2].name},${features[2].tags}`, async ({ page, baseURL }) => {
        const { data } = features[2];
        const testPage = studioUrl(baseURL, features[2], { cb: data.cb });
        setTestPage(testPage);
        const bootPage = new BootPage(page);
        const assets = trackBootAssets(page, baseURL);

        await test.step('step-1: Load Studio with markup in cb', async () => {
            await page.goto(testPage);
            await waitForStudio(page);
        });

        await test.step('step-2: Verify nothing was injected and no salt was applied', async () => {
            await expect(bootPage.injectedMarkup).toHaveCount(0);
            expect(assets.length).toBeGreaterThan(50);
            expect(assetsNotMatching(assets, /^[0-9a-f]{8}$/)).toEqual([]);
        });
    });

    // @MAS-Studio-Boot-invalid-versions-fallback — a corrupted versions block still boots Studio
    test(`${features[3].name},${features[3].tags}`, async ({ page, baseURL }) => {
        const testPage = studioUrl(baseURL, features[3]);
        setTestPage(testPage);
        const consoleErrors = [];
        const assets = trackBootAssets(page, baseURL);
        page.on('console', (message) => {
            if (message.type() === 'error') consoleErrors.push(message.text());
        });
        await page.route(
            (url) => url.pathname === '/studio.html',
            async (route) => {
                const response = await route.fetch();
                const html = await response.text();
                const body = html.replace(/(id="studio-versions">)[\s\S]*?(<\/script>)/, '$1{ "broken": <<<<<<< HEAD $2');
                await route.fulfill({ response, body });
            },
        );

        await test.step('step-1: Load Studio with a corrupted versions block', async () => {
            await page.goto(testPage);
            await waitForStudio(page);
        });

        await test.step('step-2: Verify the error was logged', async () => {
            expect(consoleErrors.some((text) => text.includes('invalid studio-versions block'))).toBe(true);
            const studioJs = assets.filter((url) => url.pathname === '/studio/src/studio.js');
            expect(studioJs.length).toBeGreaterThan(0);
            expect(studioJs.every((url) => !url.searchParams.has('v'))).toBe(true);
        });
    });

    // @MAS-Studio-Boot-spinner — spinner shows while loading and is removed once Studio loads
    test(`${features[4].name},${features[4].tags}`, async ({ page, baseURL }) => {
        const testPage = studioUrl(baseURL, features[4]);
        setTestPage(testPage);
        const bootPage = new BootPage(page);

        await test.step('step-1: Served page contains the spinner markup', async () => {
            const response = await page.goto(testPage);
            expect(await response.text()).toContain('class="studio-boot"');
        });

        await test.step('step-2: Spinner is removed once Studio loads', async () => {
            await waitForStudio(page);
            await expect(bootPage.spinner).toHaveCount(0);
            await expect(bootPage.error).toBeHidden();
        });

        await test.step('step-3: Errors after boot never show the boot error', async () => {
            await page.evaluate(() => {
                const filename = `${location.origin}/studio/src/late.js`;
                window.dispatchEvent(new ErrorEvent('error', { filename, message: 'nala late error' }));
            });
            await expect(bootPage.error).toBeHidden();
        });
    });

    // @MAS-Studio-Boot-failure-missing-module — a 404 on studio.js shows the error; Reload adds cb=1
    test(`${features[5].name},${features[5].tags}`, async ({ page, baseURL }) => {
        const { data } = features[5];
        const testPage = studioUrl(baseURL, features[5]);
        setTestPage(testPage);
        const bootPage = new BootPage(page);
        await page.route(
            (url) => url.pathname === data.failingPath,
            (route) => route.fulfill({ status: 404, body: 'not found' }),
        );

        await test.step('step-1: Load Studio with studio.js failing', async () => {
            await page.goto(testPage);
        });

        await test.step('step-2: Boot error replaces the spinner', async () => {
            await expect(bootPage.error).toBeVisible();
            await expect(bootPage.spinner).toHaveCount(0);
        });

        await test.step('step-3: Reload adds cb=1 and keeps the hash', async () => {
            await bootPage.reloadButton.click();
            await page.waitForURL((url) => url.searchParams.get('cb') === '1');
            expect(new URL(page.url()).hash).toBe(features[5].browserParams);
            await expect(bootPage.error).toBeVisible();
        });
    });

    // @MAS-Studio-Boot-failure-link-error — a module importing a missing export (the stale-mix error) shows the error
    test(`${features[6].name},${features[6].tags}`, async ({ page, baseURL }) => {
        const { data } = features[6];
        const testPage = studioUrl(baseURL, features[6]);
        setTestPage(testPage);
        const bootPage = new BootPage(page);
        await page.route(
            (url) => url.pathname === data.failingPath,
            (route) => route.fulfill({ status: 200, contentType: 'text/javascript', body: data.brokenModule }),
        );

        await test.step('step-1: Load Studio with a mismatched module', async () => {
            await page.goto(testPage);
        });

        await test.step('step-2: Boot error is shown', async () => {
            await expect(bootPage.error).toBeVisible();
            await expect(bootPage.spinner).toHaveCount(0);
        });
    });

    // @MAS-Studio-Boot-error-cleared-when-studio-loads — a non-fatal boot error does not stay over a working Studio
    test(`${features[7].name},${features[7].tags}`, async ({ page, baseURL }) => {
        const { data } = features[7];
        const testPage = studioUrl(baseURL, features[7]);
        setTestPage(testPage);
        const bootPage = new BootPage(page);
        const consoleErrors = [];
        page.on('console', (message) => {
            if (message.type() === 'error') consoleErrors.push(message.text());
        });
        await page.route(
            (url) => url.pathname === data.throwingPath,
            async (route) => {
                const response = await route.fetch();
                const body = await response.text();
                await route.fulfill({ response, body: `${body}\nthrow new Error('nala benign boot error');\n` });
            },
        );

        await test.step('step-1: Load Studio with mas.js throwing at the end', async () => {
            await page.goto(testPage);
            await waitForStudio(page);
        });

        await test.step('step-2: The error was detected, then cleared once Studio loaded', async () => {
            expect(consoleErrors.some((text) => text.includes('[M@S Studio] boot failed'))).toBe(true);
            await expect(bootPage.error).toBeHidden();
        });
    });

    // @MAS-Studio-Boot-css-error-cleared — a failing stylesheet does not leave the error over a working Studio
    test(`${features[8].name},${features[8].tags}`, async ({ page, baseURL }) => {
        const { data } = features[8];
        const testPage = studioUrl(baseURL, features[8]);
        setTestPage(testPage);
        const bootPage = new BootPage(page);
        await page.route(
            (url) => url.pathname === data.failingPath,
            (route) => route.fulfill({ status: 404, body: 'not found' }),
        );

        await test.step('step-1: Load Studio with a stylesheet failing', async () => {
            await page.goto(testPage);
            await waitForStudio(page);
        });

        await test.step('step-2: Boot error stays hidden and Studio is defined', async () => {
            await expect(bootPage.error).toBeHidden();
            expect(await page.evaluate(() => Boolean(customElements.get('mas-studio')))).toBe(true);
        });
    });

    // @MAS-Studio-Boot-lazy-view-failure — a lazy view failing to load shows the error; Reload adds cb=1
    test(`${features[9].name},${features[9].tags}`, async ({ page, baseURL }) => {
        const { data } = features[9];
        const testPage = studioUrl(baseURL, features[9]);
        setTestPage(testPage);
        const bootPage = new BootPage(page);
        await page.route(
            (url) => url.pathname === data.failingPath,
            (route) => route.fulfill({ status: 404, body: 'not found' }),
        );

        await test.step('step-1: Load the placeholders view with its module failing', async () => {
            await page.goto(testPage);
            await waitForStudio(page);
        });

        await test.step('step-2: Boot error is shown', async () => {
            await expect(bootPage.error).toBeVisible();
        });

        await test.step('step-3: Reload adds cb=1 and keeps the hash', async () => {
            await bootPage.reloadButton.click();
            await page.waitForURL((url) => url.searchParams.get('cb') === '1');
            expect(new URL(page.url()).hash).toBe(features[9].browserParams);
        });
    });
});
