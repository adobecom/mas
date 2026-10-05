const cooldowns = new Map();
const loggedRequests = new WeakSet();

export function retryAfterMs(value, now = Date.now()) {
    if (!value?.trim()) return 10000;
    const seconds = Number(value);
    if (Number.isFinite(seconds)) return seconds >= 0 ? seconds * 1000 : 10000;
    const date = Date.parse(value);
    return Number.isFinite(date) ? Math.max(0, date - now) : 10000;
}

function logRateLimit(request, headers) {
    const { origin, pathname } = new URL(request.url());
    const delay = retryAfterMs(headers['retry-after']);
    cooldowns.set(origin, Math.max(cooldowns.get(origin) ?? 0, Date.now() + delay));
    loggedRequests.add(request);
    console.warn(
        `[NALA] HTTP 429 ${request.method()} ${origin}${pathname}; ` +
            `Retry-After: ${headers['retry-after'] || 'missing/empty (10s fallback)'}; cooldown ${delay / 1000}s.`,
    );
}

export function logRateLimitedResponses(page) {
    page.on('response', (response) => {
        if (response.status() === 429 && !loggedRequests.has(response.request())) {
            logRateLimit(response.request(), response.headers());
        }
    });
}

export async function waitForRateLimit(url) {
    const { origin } = new URL(url);
    while ((cooldowns.get(origin) ?? 0) > Date.now()) {
        await new Promise((resolve) => setTimeout(resolve, cooldowns.get(origin) - Date.now()));
    }
}

/** Retry a static GET once; return persistent 429s to the browser unchanged. */
export async function fetchWithRateLimitRetry(route, beforeFetch) {
    for (let attempt = 0; attempt < 2; attempt++) {
        await beforeFetch();
        await waitForRateLimit(route.request().url());
        const response = await route.fetch({ maxRedirects: 0 });
        if (response.status() !== 429) return response;
        logRateLimit(route.request(), response.headers());
        if (attempt === 1 || response.headers()['set-cookie']) return response;
        await response.dispose();
        console.info('[NALA] Retrying static GET once after the origin cooldown.');
    }
}
