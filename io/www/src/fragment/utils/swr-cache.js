import { logDebug, logError } from './log.js';

const DEFAULT_TTL = 5 * 60 * 1000;
// Randomize each entry's TTL by ±20% so entries don't expire in lockstep across container
// instances — spreads refetches instead of bursting them onto Odin all at once.
const DEFAULT_JITTER = 0.2;

/**
 * Creates a herd-protected cache: jittered TTL + single-flight refills + stale-while-revalidate.
 * One instance per logical dataset (e.g. dictionary layers, promotion projects). Entries are
 * `{ value, timestamp, ttl }`.
 *
 * Published reads use memory. Preview defaults to per-key localStorage (`<name>-<key>`)
 * unless `previewMemory` is enabled. Memory-only preview caches share an invalidation revision
 * in localStorage, so clearing one instance also invalidates other clients on the same origin.
 * Each memory backend keeps at most `maxEntries` (default 1000), evicting the oldest written
 * entry on overflow. Refreshing a key moves it to the newest position; reads do not.
 * Cached values remain in memory. The read path:
 *   - fresh entry         → return it;
 *   - expired, published  → serve stale, refill in the background (coalesced single-flight);
 *   - cold, or expired preview read → await the (coalesced) refill.
 *
 * Preview never serves expired entries; stale-while-revalidate applies to published reads only.
 *
 * A `loader` resolving to `null`/`undefined` signals "nothing to cache" (miss or fetch failure):
 * no entry is written, any existing stale entry survives untouched, and a later read retries.
 * `shouldCache` can also reject a loaded value without withholding it from awaiting readers.
 * Returning `{ ttl }` instead applies a short retry TTL to incomplete results. Published reads
 * keep an existing stale value during that backoff rather than replacing it with partial data.
 *
 * @param {{ name: string, ttl?: number, jitter?: number,
 *   previewTtl?: number, previewMemory?: boolean, maxEntries?: number,
 *   shouldCache?: (value: *) => (boolean | { ttl: number }) }} options
 */
export function createSwrCache({
    name,
    ttl = DEFAULT_TTL,
    jitter = DEFAULT_JITTER,
    previewTtl = ttl,
    previewMemory = false,
    maxEntries = 1000,
    shouldCache = () => true,
}) {
    const createBackend = () => ({ store: new Map(), refills: new Map() });
    const backends = { published: createBackend(), preview: createBackend() };
    const jitteredTtl = (context) => (context.preview ? previewTtl : ttl) * (1 + (Math.random() * 2 - 1) * jitter);
    const storageKey = (key) => `${name}-${key}`;
    const revisionKey = `mas-preview-cache-revision:${name}`;

    return {
        /**
         * Reads `key`, loading on miss/expiry with herd protection.
         * @param {*} context request context (preview endpoint isolates memory entries).
         * @param {string} key cache key within this instance's namespace.
         * @param {() => Promise<*>} loader resolves null/undefined to skip caching.
         */
        async get(context, key, loader) {
            const mode = context.preview ? 'preview' : 'published';
            let backend = backends[mode];
            if (context.preview && previewMemory) {
                const revision = localStorage.getItem(revisionKey);
                if (backend.revision !== revision) {
                    backend = backends[mode] = { ...createBackend(), revision };
                }
            }
            const memoryKey = context.preview ? `${context.preview.url ?? ''}:${key}` : key;
            const persistent = context.preview && !previewMemory;
            const entry = persistent
                ? JSON.parse(localStorage.getItem(storageKey(key)) ?? 'null')
                : backend.store.get(memoryKey);
            if (entry && entry.ttl > 0 && Date.now() - entry.timestamp <= entry.ttl) {
                logDebug(() => `[${name}] cache hit for "${key}"`, context);
                return entry.value;
            }
            const stale = entry && !context.preview;
            if (!backend.refills.has(memoryKey)) {
                let pending = (async () => {
                    const value = await loader();
                    if (value == null) return value;
                    const policy = shouldCache(value);
                    if (!policy) return value;
                    const refreshed = {
                        value: stale && policy !== true ? entry.value : value,
                        timestamp: Date.now(),
                        ttl: policy.ttl ?? jitteredTtl(context),
                    };
                    if (backends[mode] === backend) {
                        if (persistent) localStorage.setItem(storageKey(key), JSON.stringify(refreshed));
                        else {
                            backend.store.delete(memoryKey);
                            backend.store.set(memoryKey, refreshed);
                            if (backend.store.size > maxEntries) backend.store.delete(backend.store.keys().next().value);
                        }
                    }
                    return value;
                })();
                if (stale) {
                    pending = pending.catch((error) => {
                        logError(`[${name}] refill failed for "${key}": ${error.message}`, context);
                        return null;
                    });
                }
                backend.refills.set(
                    memoryKey,
                    pending.finally(() => {
                        backend.refills.delete(memoryKey);
                    }),
                );
            }
            if (stale) {
                logDebug(() => `[${name}] serving stale "${key}" while refilling`, context);
                return entry.value;
            }
            logDebug(() => `[${name}] cold read for "${key}", awaiting refill`, context);
            return backend.refills.get(memoryKey);
        },
        /** Drops entries and refills; a pending refill cannot repopulate the cleared backend. */
        clear(preview = false) {
            backends[preview ? 'preview' : 'published'] = createBackend();
            if (preview && previewMemory) {
                try {
                    localStorage.setItem(revisionKey, globalThis.crypto.randomUUID());
                } catch (error) {
                    if (error.name !== 'QuotaExceededError') throw error;
                    localStorage.removeItem(revisionKey);
                    logError(`[${name}] preview revision write exceeded storage quota; local cache cleared`, {});
                }
            } else if (preview) {
                Object.keys(localStorage).forEach((k) => {
                    if (k.startsWith(`${name}-`)) localStorage.removeItem(k);
                });
            }
        },
    };
}
