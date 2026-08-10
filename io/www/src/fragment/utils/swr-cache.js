import { logDebug } from './log.js';

const DEFAULT_TTL = 5 * 60 * 1000;
// Randomize each entry's TTL by ±20% so entries don't expire in lockstep across container
// instances — spreads refetches instead of bursting them onto Odin all at once.
const DEFAULT_JITTER = 0.2;

/**
 * Creates a herd-protected cache: jittered TTL + single-flight refills + stale-while-revalidate.
 * One instance per logical dataset (e.g. dictionary layers, promotion projects). Entries are
 * `{ value, timestamp, ttl }`.
 *
 * Two backends share one read path: in-memory (published/module reads) or per-key localStorage
 * (`<name>-<key>`, preview/studio reads, so a studio reload doesn't refetch). The read path:
 *   - fresh entry         → return it;
 *   - expired, published  → serve stale, refill in the background (coalesced single-flight);
 *   - cold, or any preview read → await the (coalesced) refill.
 *
 * Preview never serves stale — authors must see fresh data immediately after editing — so the
 * stale-while-revalidate protection applies to published reads only.
 *
 * A `loader` resolving to `null`/`undefined` signals "nothing to cache" (miss or fetch failure):
 * no entry is written, any existing stale entry survives untouched, and a later read retries.
 *
 * @param {{ name: string, ttl?: number, jitter?: number }} options `name` namespaces the
 *   localStorage keys and debug logs; `ttl` is the base lifetime (ms); `jitter` the ± fraction.
 */
export function createSwrCache({ name, ttl = DEFAULT_TTL, jitter = DEFAULT_JITTER }) {
    let store = {};
    // In-flight refill promises keyed by cache key (single-flight): while one is pending,
    // concurrent reads serve stale / await it rather than each firing their own fetch.
    let refills = {};

    const jitteredTtl = () => ttl * (1 + (Math.random() * 2 - 1) * jitter);
    const storageKey = (key) => `${name}-${key}`;

    const readEntry = (context, key) =>
        context.preview ? JSON.parse(localStorage.getItem(storageKey(key)) ?? 'null') : store[key];

    const writeEntry = (context, key, entry) => {
        if (context.preview) localStorage.setItem(storageKey(key), JSON.stringify(entry));
        else store[key] = entry;
    };

    const refill = async (context, key, loader) => {
        const value = await loader();
        if (value == null) return value;
        writeEntry(context, key, { value, timestamp: Date.now(), ttl: jitteredTtl() });
        return value;
    };

    return {
        /**
         * Reads `key`, loading via `loader()` on miss/expiry with herd protection.
         * @param {*} context request context (only `preview` is read here).
         * @param {string} key cache key within this instance's namespace.
         * @param {() => Promise<*>} loader fetches the value; resolve `null`/`undefined` to skip caching.
         */
        async get(context, key, loader) {
            const entry = readEntry(context, key);
            if (entry && Date.now() - entry.timestamp <= entry.ttl) {
                logDebug(() => `[${name}] cache hit for "${key}"`, context);
                return entry.value;
            }
            if (!refills[key]) {
                refills[key] = refill(context, key, loader).finally(() => {
                    refills[key] = undefined;
                });
            }
            if (entry && !context.preview) {
                logDebug(() => `[${name}] serving stale "${key}" while refilling`, context);
                return entry.value;
            }
            logDebug(() => `[${name}] cold read for "${key}", awaiting refill`, context);
            return refills[key];
        },
        /** Drops all entries (and in-flight refills). `preview` clears the localStorage backend. */
        clear(preview = false) {
            refills = {};
            if (preview) {
                Object.keys(localStorage).forEach((k) => {
                    if (k.startsWith(`${name}-`)) localStorage.removeItem(k);
                });
            } else {
                store = {};
            }
        },
    };
}
