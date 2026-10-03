import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { isStaticResource, VARY_HEADERS } from './static-resource-cache.js';
import { installEdsThrottleOnPage } from './eds-throttle.js';

export const STATIC_HAR_URLS = /^https?:\/\/.*\.(?:js|css)(?:\?.*)?$/;
const ARCHIVES = ['docs', 'studio'];
const archiveUrls = new Map();
const RESPONSE_HEADERS = [
    'content-type',
    'cache-control',
    'vary',
    'access-control-allow-origin',
    'access-control-allow-credentials',
    'cross-origin-resource-policy',
    'cross-origin-embedder-policy',
];

export function initializeRunStaticHar(runId) {
    const directory = resolve('nala/.runs', runId, 'static');
    mkdirSync(directory, { recursive: true, mode: 0o700 });
    process.env.NALA_STATIC_HAR_DIR = directory;
    return () => {
        for (const name of ARCHIVES) {
            for (const suffix of ['.har', '.recording.har']) {
                const path = join(directory, `${name}${suffix}`);
                if (existsSync(path)) unlinkSync(path);
                archiveUrls.delete(path);
            }
        }
        delete process.env.NALA_STATIC_HAR_DIR;
    };
}

/**
 * Only the current invocation's archives are visible to its workers.
 */
export async function installRunStaticHar(page) {
    const urls = new Set();
    if (!process.env.NALA_STATIC_HAR_DIR) return urls;
    for (const name of ARCHIVES) {
        const path = join(process.env.NALA_STATIC_HAR_DIR, `${name}.har`);
        if (!existsSync(path)) continue;
        if (!archiveUrls.has(path)) {
            const { log } = JSON.parse(readFileSync(path, 'utf8'));
            archiveUrls.set(
                path,
                log.entries.map((entry) => entry.request.url),
            );
        }
        for (const url of archiveUrls.get(path)) urls.add(url);
        await page.routeFromHAR(path, { url: STATIC_HAR_URLS, notFound: 'fallback' });
    }
    return urls;
}

/**
 * Record sequential seed loads, then publish only successful public JS/CSS.
 * Raw browser headers/cookies never enter the archive used by test workers.
 */
export async function recordRunStaticHar({ browser, name, urls, contextOptions, ready }) {
    if (process.env.NALA_STATIC_CACHE_DISABLED === '1') return;
    const directory = process.env.NALA_STATIC_HAR_DIR;
    if (!directory) throw new Error('Static HAR recording requires an initialized Nala run');
    const rawPath = join(directory, `${name}.recording.har`);
    const path = join(directory, `${name}.har`);
    const allowed = new Set();
    const pending = [];
    const errors = [];
    const context = await browser.newContext({
        ...contextOptions,
        serviceWorkers: 'block',
        recordHar: { path: rawPath, urlFilter: STATIC_HAR_URLS, mode: 'minimal', content: 'embed' },
    });
    try {
        try {
            context.on('response', (response) => {
                if (!STATIC_HAR_URLS.test(response.url())) return;
                pending.push(
                    (async () => {
                        if (!(await isStaticResource(response.request()))) return;
                        if (response.status() === 404) {
                            console.warn(
                                `[NALA] Static HAR miss: HTTP 404 ${response.url()}; excluded from replay, test requests remain live.`,
                            );
                            return;
                        }
                        if (response.status() >= 400)
                            throw new Error(`Static HAR seed failed: HTTP ${response.status()} ${response.url()}`);
                        allowed.add(response.url());
                    })().catch((error) => errors.push(error)),
                );
            });
            context.on('requestfailed', (request) => {
                if (!STATIC_HAR_URLS.test(request.url())) return;
                pending.push(
                    (async () => {
                        if (await isStaticResource(request)) {
                            if ((await request.response())?.status() === 404) return;
                            throw new Error(`Static HAR seed failed: ${request.failure().errorText} ${request.url()}`);
                        }
                    })().catch((error) => errors.push(error)),
                );
            });
            for (const url of urls) {
                const page = await context.newPage();
                await installEdsThrottleOnPage(page, { replayHar: false, cache: false });
                console.info(`[NALA] Recording current-run ${name} static assets: ${url}`);
                const response = await page.goto(url, { waitUntil: 'load' });
                if (!response.ok()) throw new Error(`Static HAR seed navigation failed: HTTP ${response.status()} ${url}`);
                await ready(page);
                await page.waitForLoadState('networkidle');
            }
            await Promise.all(pending);
            if (errors.length) {
                throw new AggregateError(
                    errors,
                    `Failed to record static HAR seed:\n${errors.map((error) => error.message).join('\n')}`,
                );
            }
        } finally {
            await context.close();
        }
        const har = JSON.parse(readFileSync(rawPath, 'utf8'));
        har.log.entries = har.log.entries.filter((entry) => {
            const headers = Object.fromEntries(entry.response.headers.map(({ name, value }) => [name.toLowerCase(), value]));
            return (
                allowed.has(entry.request.url) &&
                entry.request.method === 'GET' &&
                entry.response.status === 200 &&
                !entry.request.cookies?.length &&
                !entry.request.headers.some(({ name }) => /^(authorization|cookie)$/i.test(name)) &&
                !headers['set-cookie'] &&
                !/no-store|private/i.test(headers['cache-control'] || '') &&
                (headers.vary || '')
                    .toLowerCase()
                    .split(',')
                    .every((name) => !name.trim() || VARY_HEADERS.includes(name.trim()))
            );
        });
        if (!har.log.entries.length) throw new Error(`Static HAR seed captured no public JS/CSS: ${name}`);
        for (const entry of har.log.entries) {
            entry.request.headers = entry.request.headers.filter(({ name }) => VARY_HEADERS.includes(name.toLowerCase()));
            entry.request.cookies = [];
            entry.response.headers = entry.response.headers.filter(({ name }) => RESPONSE_HEADERS.includes(name.toLowerCase()));
            entry.response.cookies = [];
        }
        writeFileSync(path, JSON.stringify(har), { mode: 0o600 });
        console.info(
            `[NALA] Current-run ${name} HAR: ${new Set(har.log.entries.map((entry) => entry.request.url)).size} assets`,
        );
    } finally {
        if (existsSync(rawPath)) unlinkSync(rawPath);
    }
}
