import { createServer } from 'node:http';
import { test, expect } from '../libs/docs-test.js';
import GlobalRequestCounter from '../libs/global-request-counter.js';

let server;
let baseURL;
let previousCounterFile;
let previousTrackedUrls;
const loads = { documents: 0, scripts: 0, valid: 0, invalid: 0 };

const script = `
window.initializations = (window.initializations || 0) + 1;
for (const name of ['mas:ready', 'aem:error', 'mas:failed']) {
    document.addEventListener(name, () => document.querySelector('#log').append(name + ';'));
}
async function refresh() {
    const valid = await fetch('/api/valid.json');
    const data = await valid.json();
    document.querySelector('#value').textContent = data.sequence;
    document.dispatchEvent(new CustomEvent('mas:ready'));
    const invalid = await fetch('/api/invalid.json');
    if (!invalid.ok) {
        document.dispatchEvent(new CustomEvent('aem:error'));
        document.dispatchEvent(new CustomEvent('mas:failed'));
    }
}
document.querySelector('#refresh').onclick = refresh;
refresh();`;

test.beforeAll(async () => {
    previousCounterFile = globalThis.requestCounter.counterFile;
    previousTrackedUrls = { ...globalThis.requestCounter.trackedUrls };
    server = createServer((request, response) => {
        if (request.url === '/app.js') {
            loads.scripts++;
            response.writeHead(200, { 'content-type': 'application/javascript' });
            response.end(script);
        } else if (request.url === '/api/valid.json') {
            loads.valid++;
            response.writeHead(200, { 'content-type': 'application/json' });
            response.end(JSON.stringify({ sequence: loads.valid }));
        } else if (request.url === '/api/invalid.json') {
            loads.invalid++;
            response.writeHead(404, { 'content-type': 'application/json' });
            response.end('{}');
        } else {
            loads.documents++;
            response.writeHead(200, { 'content-type': 'text/html' });
            response.end(
                '<!doctype html><div id="log"></div><div id="value"></div><button id="refresh">Refresh</button><script src="/app.js"></script>',
            );
        }
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    baseURL = `http://127.0.0.1:${server.address().port}`;
    GlobalRequestCounter.setTargetUrl(`${baseURL}/api/`, 'OFFLINE_DOCS_API');
});

test.beforeEach(async ({}, testInfo) => {
    globalThis.requestCounter.counterFile = testInfo.outputPath('request-count.json');
});

test.afterAll(async () => {
    try {
        expect(loads).toEqual({ documents: 2, scripts: 1, valid: 4, invalid: 4 });
    } finally {
        globalThis.requestCounter.counterFile = previousCounterFile;
        globalThis.requestCounter.trackedUrls = previousTrackedUrls;
        await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    }
});

for (const iteration of [1, 2]) {
    test(`fresh Docs load ${iteration} preserves live readiness, errors and refresh events`, async ({ page }) => {
        const events = 'mas:ready;aem:error;mas:failed;';
        await page.goto(baseURL);
        await expect(page.locator('#log')).toHaveText(events);
        expect(
            await page.evaluate(() => ({
                initializations: window.initializations,
                storage: localStorage.getItem('previous-test'),
                cookies: document.cookie,
            })),
        ).toEqual({ initializations: 1, storage: null, cookies: '' });
        await expect(page.locator('#value')).toHaveText(String(iteration * 2 - 1));
        await page.locator('#refresh').click();
        await expect(page.locator('#log')).toHaveText(events + events);
        await expect(page.locator('#value')).toHaveText(String(iteration * 2));
        expect(GlobalRequestCounter.getCurrentTotal('OFFLINE_DOCS_API')).toBe(4);
        await page.evaluate(() => {
            localStorage.setItem('previous-test', 'changed');
            document.cookie = 'previous-test=changed; path=/';
            document.querySelector('#log').textContent = 'Changed by previous test';
        });
    });
}
