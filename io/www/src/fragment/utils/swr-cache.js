import { logDebug, logError } from './log.js';

const DEFAULT_TTL = 5 * 60 * 1000;
// Randomize each entry's TTL by ±20% so entries don't expire in lockstep across container
// instances — spreads refetches instead of bursting them onto Odin all at once.
const DEFAULT_JITTER = 0.2;
const DEFAULT_MAX_MEMORY_BYTES = 256 * 1024 * 1024;

// One heap per container: every memory entry of every cache instance is tracked here, ordered from
// least to most recently used, so the least recently used ones (whatever their cache) are evicted
// while the estimated total size exceeds `maxBytes`. Sizes are serialized lengths, an estimate only.
const memory = { lru: new Map(), bytes: 0, maxBytes: DEFAULT_MAX_MEMORY_BYTES, caches: {} };

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
    const { backend, memoryKey } = memory.lru.get(entry);
    backend.store.delete(memoryKey);
    untrack(entry);
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
    memory.caches[name] ??= { entries: 0, bytes: 0 };
    memory.caches[name].entries++;
    memory.caches[name].bytes += entry.size;
    if (backend.store.size > maxEntries) evict(backend.store.values().next().value);
    while (memory.bytes > memory.maxBytes && memory.lru.size > 1) evict(memory.lru.keys().next().value);
}

const untrackBackend = (backend) => {
    for (const entry of backend.store.values()) untrack(entry);
};

/** Estimated memory held by all cache instances: totals and per cache name. */
export const getMemoryStats = () => ({
    entries: memory.lru.size,
    bytes: memory.bytes,
    maxBytes: memory.maxBytes,
    caches: structuredClone(memory.caches),
});

/** Sets the memory budget shared by all cache instances, evicting least recently used entries above it. */
export function setMemoryLimit(maxBytes) {
    memory.maxBytes = maxBytes;
    while (memory.bytes > memory.maxBytes && memory.lru.size > 1) evict(memory.lru.keys().next().value);
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
 * used entry on overflow; all memory backends also share one byte budget (see `setMemoryLimit`).
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

    function write(context, key, value, entryTtl = jitteredTtl(context), target = resolve(context, key)) {
        const entry = { value, timestamp: Date.now(), ttl: entryTtl };
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
         * @param {() => Promise<*>} loader resolves null/undefined to skip caching.
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
            const stale = entry && !context.preview;
            if (!backend.refills.has(memoryKey)) {
                let pending = (async () => {
                    const value = await loader();
                    if (value == null) return value;
                    const policy = shouldCache(value);
                    if (!policy) return value;
                    if (backends[mode] === backend) {
                        write(context, key, stale && policy !== true ? entry.value : value, policy.ttl, target);
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
        /**
         * Writes a fresh `value` for `key`, e.g. after the caller persisted it elsewhere, so this
         * instance does not keep serving the previous value until its TTL expires.
         */
        set(context, key, value) {
            write(context, key, value);
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
