/**
 * Caches async loads by key for `ttl` ms. Concurrent callers share one load, and a failed load is
 * evicted so the next call retries. Returns `(key, load) => Promise`.
 */
export function createTtlCache(ttl) {
    const entries = new Map();
    return (key, load) => {
        const now = Date.now();
        const hit = entries.get(key);
        if (hit && now - hit.at < ttl) return hit.promise;
        for (const [oldKey, entry] of entries) if (now - entry.at >= ttl) entries.delete(oldKey);
        const entry = { at: now, promise: load() };
        entry.promise.catch(() => {
            if (entries.get(key) === entry) entries.delete(key);
        });
        entries.set(key, entry);
        return entry.promise;
    };
}
