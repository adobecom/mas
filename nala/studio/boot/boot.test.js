import { test, expect, miloLibs, setTestPage } from '../../libs/mas-test.js';
import { features } from './boot.spec.js';
import BootPage from './boot.page.js';

test.skip(({ browserName }) => browserName !== 'chromium', 'Not supported to run on multiple browsers.');

const BOOT_ASSET = /^\/(studio|web-components)\/.+\.(js|css)$/;

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
            expect(assetsNotMatching(assets, /^[0-9a-f]{8}$/)).toEqual([]);
        });
    });

    // @MAS-Studio-Boot-invalid-versions-fallback — a corrupted versions block still boots Studio
    test(`${features[3].name},${features[3].tags}`, async ({ page, baseURL }) => {
        const testPage = studioUrl(baseURL, features[3]);
        setTestPage(testPage);
        const consoleErrors = [];
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
        });
    });
});
