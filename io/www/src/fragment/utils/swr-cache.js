import { log, logDebug, logError } from './log.js';

const DEFAULT_TTL = 5 * 60 * 1000;
// Randomize each entry's TTL by ±20% so entries don't expire in lockstep across container
// instances — spreads refetches instead of bursting them onto Odin all at once.
const DEFAULT_JITTER = 0.2;
const DEFAULT_MAX_MEMORY_BYTES = 256 * 1024 * 1024;

/** Resolved by the loader of a `conditional` cache when the cached entry is still current (304). */
export const NOT_MODIFIED = Symbol('not-modified');

// One heap per container: every memory entry of every cache instance is tracked here, ordered from
// least to most recently used, so the least recently used ones (whatever their cache) are evicted
// while the estimated total size exceeds `maxBytes`, or the heap used exceeds the heap budget when one
// is set (see `setHeapBudget`). Sizes are serialized lengths, an estimate only.
const memory = { lru: new Map(), bytes: 0, evictions: 0, maxBytes: DEFAULT_MAX_MEMORY_BYTES, heap: null, caches: {} };

const sizeOf = (value) => JSON.stringify(value)?.length ?? 0;

function untrack(entry) {
    const ref = memory.lru.get(entry);
    if (!ref) return;
    memory.lru.delete(entry);
    memory.bytes -= entry.size;
    memory.caches[ref.name].entries--;
    memory.caches[ref.name].bytes -= entry.size;
}

function evict(entry) {
    const { name, backend, memoryKey } = memory.lru.get(entry);
    backend.store.delete(memoryKey);
    untrack(entry);
    memory.evictions++;
    memory.caches[name].evictions++;
}

function touch(backend, memoryKey, entry) {
    const ref = memory.lru.get(entry);
    backend.store.delete(memoryKey);
    backend.store.set(memoryKey, entry);
    memory.lru.delete(entry);
    memory.lru.set(entry, ref);
}

function store(name, backend, memoryKey, entry, maxEntries) {
    untrack(backend.store.get(memoryKey));
    backend.store.delete(memoryKey);
    backend.store.set(memoryKey, entry);
    memory.lru.set(entry, { name, backend, memoryKey });
    memory.bytes += entry.size;
    memory.caches[name] ??= { entries: 0, bytes: 0, evictions: 0 };
    memory.caches[name].entries++;
    memory.caches[name].bytes += entry.size;
    if (backend.store.size > maxEntries) evict(backend.store.values().next().value);
    enforceBudget();
}

function heapExcess() {
    const { heap } = memory;
    return heap.getHeapUsed() - heap.evicted - heap.maxUsed;
}

export function resetHeapEvictionCredit(collectedBefore = performance.now()) {
    const { heap } = memory;
    if (!heap) return;
    heap.credits = heap.credits.filter(({ timestamp }) => timestamp >= collectedBefore);
    heap.evicted = heap.credits.reduce((total, { bytes }) => total + bytes, 0);
}

function enforceBudget() {
    const { heap } = memory;
    const credited = heap?.evicted ?? 0;
    let excess = heap ? heapExcess() : memory.bytes - memory.maxBytes;
    while (excess > 0 && memory.lru.size > 1) {
        const entry = memory.lru.keys().next().value;
        excess -= entry.size;
        if (heap) heap.evicted += entry.size;
        evict(entry);
    }
    if (heap && heap.evicted > credited) {
        heap.credits.push({ timestamp: performance.now(), bytes: heap.evicted - credited });
    }
}

const untrackBackend = (backend) => {
    for (const entry of backend.store.values()) untrack(entry);
};

/**
 * Estimated memory held by all cache instances: totals and per cache name. `evictions` counts the entries evicted
 * (over `maxEntries` or the memory budget) since the container started.
 */
export const getMemoryStats = () => ({
    entries: memory.lru.size,
    bytes: memory.bytes,
    evictions: memory.evictions,
    maxBytes: memory.maxBytes,
    maxHeapUsed: memory.heap?.maxUsed,
    caches: structuredClone(memory.caches),
});

const MB = 1024 * 1024;
const formatSize = (bytes) => (bytes < MB ? `${Math.round(bytes / 1024)}KB` : `${(bytes / MB).toFixed(1)}MB`);

// Memory usage is logged on its own line, on the first call of a container, then at most once a minute.
const MEMORY_LOG_INTERVAL = 60 * 1000;
// Tells containers apart in the memory logs: an id per container, random as the runtime exposes none.
const CONTAINER_ID = globalThis.crypto.randomUUID().slice(0, 8);
let memoryLoggedAt = -Infinity;

/**
 * Logs the process memory and the caches sizes, e.g. "memory: process rss=140.2MB heap used 41.0MB of 62.5MB |
 * caches 6.1MB up to heap used 576.0MB in 548 entries, 12 evicted: response 4.0MB (180, 12 evicted),
 * request-metadata 75KB (180, 0 evicted), ... | container 3f9a1c2e up 42m" (largest cache first, entry count in
 * parentheses; evictions are counted since the container started). Server side only.
 */
export function logMemoryUsage(context) {
    const now = Date.now();
    if (now - memoryLoggedAt < MEMORY_LOG_INTERVAL) return;
    memoryLoggedAt = now;
    const { rss, heapUsed, heapTotal } = process.memoryUsage();
    const perCache = Object.entries(memory.caches)
        .sort(([, a], [, b]) => b.bytes - a.bytes)
        .map(([name, cache]) => `${name} ${formatSize(cache.bytes)} (${cache.entries}, ${cache.evictions} evicted)`)
        .join(', ');
    log(
        `memory: process rss=${formatSize(rss)} heap used ${formatSize(heapUsed)} of ${formatSize(heapTotal)} | caches ${formatSize(memory.bytes)} up to heap used ${formatSize(memory.heap?.maxUsed)} in ${memory.lru.size} entries, ${memory.evictions} evicted: ${perCache} | container ${CONTAINER_ID} up ${Math.round(process.uptime() / 60)}m`,
        context,
    );
}

export function resetMemoryLog() {
    memoryLoggedAt = -Infinity;
}

/** Sets the memory budget shared by all cache instances, evicting least recently used entries above it. */
export function setMemoryLimit(maxBytes) {
    memory.maxBytes = maxBytes;
    enforceBudget();
}

/**
 * Replaces the byte budget with the actual heap usage (where the runtime exposes it): least recently
 * used entries are evicted while `getHeapUsed()` exceeds `maxHeapUsed`. Called without arguments,
 * goes back to the byte budget.
 */
export function setHeapBudget(maxHeapUsed, getHeapUsed) {
    memory.heap = getHeapUsed ? { maxUsed: maxHeapUsed, getHeapUsed, evicted: 0, credits: [] } : null;
    enforceBudget();
}

/**
 * Creates a herd-protected cache: jittered TTL + single-flight refills + stale-while-revalidate.
 * One instance per logical dataset (e.g. dictionary layers, promotion projects). Entries are
 * `{ value, timestamp, ttl }`.
 *
 * Published reads use memory. Preview defaults to per-key localStorage (`<name>-<key>`)
 * unless `previewMemory` is enabled. Memory-only preview caches share an invalidation revision
 * in localStorage, so clearing one instance also invalidates other clients on the same origin.
 * Each memory backend keeps at most `maxEntries` (default 1000), evicting its least recently
 * used entry on overflow; all memory backends also share one budget (see `setMemoryLimit` and `setHeapBudget`).
 * Reads, refreshes and `set` move a key to the most recently used position. The read path:
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
 * `conditional` caches revalidate with ETags (e.g. Odin's): the loader receives `{ etagFor }`, where `etagFor(url)`
 * is the ETag of the cached entry to send as `If-None-Match` when it was fetched from that same `url` (none on a
 * cold read or when the url changed, e.g. a key resolving to another fragment id, whose 304 would otherwise renew
 * the previous fragment's value), and resolves `{ value, etag, url }` to store with the value, or `NOT_MODIFIED`
 * on a 304, which keeps the cached value, ETag and url and restarts its TTL.
 *
 * @param {{ name: string, ttl?: number, jitter?: number,
 *   previewTtl?: number, previewMemory?: boolean, maxEntries?: number, staleWhileRevalidate?: boolean,
 *   conditional?: boolean, shouldCache?: (value: *) => (boolean | { ttl: number }) }} options
 */
export function createSwrCache({
    name,
    ttl = DEFAULT_TTL,
    jitter = DEFAULT_JITTER,
    previewTtl = ttl,
    previewMemory = false,
    maxEntries = 1000,
    staleWhileRevalidate = true,
    conditional = false,
    shouldCache = () => true,
}) {
    // `superseded`: keys whose pending refill must not write its value, `set` having written a newer one meanwhile
    const createBackend = () => ({ store: new Map(), refills: new Map(), superseded: new Set() });
    const backends = { published: createBackend(), preview: createBackend() };
    const jitteredTtl = (context) => (context.preview ? previewTtl : ttl) * (1 + (Math.random() * 2 - 1) * jitter);
    const storageKey = (key) => `${name}-${key}`;
    const revisionKey = `mas-preview-cache-revision:${name}`;

    function resolve(context, key) {
        const mode = context.preview ? 'preview' : 'published';
        let backend = backends[mode];
        if (context.preview && previewMemory) {
            const revision = localStorage.getItem(revisionKey);
            if (backend.revision !== revision) {
                untrackBackend(backend);
                backend = backends[mode] = { ...createBackend(), revision };
            }
        }
        const memoryKey = context.preview ? `${context.preview.url ?? ''}:${key}` : key;
        return { mode, backend, memoryKey, persistent: context.preview && !previewMemory };
    }

    function write(context, key, { value, etag, url }, entryTtl = jitteredTtl(context), target = resolve(context, key)) {
        const entry = { value, etag, url, timestamp: Date.now(), ttl: entryTtl };
        if (target.persistent) {
            localStorage.setItem(storageKey(key), JSON.stringify(entry));
            return;
        }
        store(name, target.backend, target.memoryKey, { ...entry, size: sizeOf(value) }, maxEntries);
    }

    return {
        /**
         * Reads `key`, loading on miss/expiry with herd protection.
         * @param {*} context request context (preview endpoint isolates memory entries).
         * @param {string} key cache key within this instance's namespace.
         * @param {({ etagFor }) => Promise<*>} loader resolves null/undefined to skip caching; see `conditional`
         *   for what it resolves in conditional caches.
         */
        async get(context, key, loader) {
            const target = resolve(context, key);
            const { mode, backend, memoryKey, persistent } = target;
            const entry = persistent
                ? JSON.parse(localStorage.getItem(storageKey(key)) ?? 'null')
                : backend.store.get(memoryKey);
            if (entry && !persistent) touch(backend, memoryKey, entry);
            if (entry && entry.ttl > 0 && Date.now() - entry.timestamp <= entry.ttl) {
                logDebug(() => `[${name}] cache hit for "${key}"`, context);
                return entry.value;
            }
            const stale = entry && !context.preview && staleWhileRevalidate;
            if (!backend.refills.has(memoryKey)) {
                let pending = (async () => {
                    const loaded = await loader({ etagFor: (url) => (url === entry?.url ? entry.etag : undefined) });
                    const notModified = loaded === NOT_MODIFIED;
                    const { value, etag, url } = notModified ? entry : conditional ? (loaded ?? {}) : { value: loaded };
                    if (value == null) return value;
                    if (notModified) {
                        logDebug(
                            () => `[${name}] "${key}" not modified (304, etag ${etag}): keeping the cached value`,
                            context,
                        );
                    }
                    const policy = shouldCache(value);
                    if (!policy) return value;
                    if (backends[mode] === backend && !backend.superseded.has(memoryKey)) {
                        write(context, key, stale && policy !== true ? entry : { value, etag, url }, policy.ttl, target);
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
                        backend.superseded.delete(memoryKey);
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
        /**
         * Writes a fresh `value` for `key`, e.g. after the caller persisted it elsewhere, so this
         * instance does not keep serving the previous value until its TTL expires. A refill already
         * in progress for `key` then leaves this value in place.
         */
        set(context, key, value) {
            const target = resolve(context, key);
            if (target.backend.refills.has(target.memoryKey)) target.backend.superseded.add(target.memoryKey);
            write(context, key, { value }, jitteredTtl(context), target);
        },
        /** Drops entries and refills; a pending refill cannot repopulate the cleared backend. */
        clear(preview = false) {
            const mode = preview ? 'preview' : 'published';
            untrackBackend(backends[mode]);
            backends[mode] = createBackend();
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
