/**
 * Per-fragment usage storage for MWPW-185891.
 *
 * One State key per fragment rather than a single combined document. Reads are per-fragment, so
 * per-fragment keys keep every read tiny and, more importantly, keep the read action far away from
 * the 1MB Adobe I/O Runtime response cap -- a combined document across ~1,600 active fragments
 * would sit right on it.
 *
 * Values are brotli-compressed like the rest of io/studio's State usage; an hourly map is highly
 * repetitive and compresses well.
 */

const zlib = require('zlib');
const stateLib = require('@adobe/aio-lib-state');

const { PAGE_RETENTION_HOURS } = require('./pages');

/** Records outlive the data they hold, so a fragment that goes quiet expires instead of lingering. */
const USAGE_TTL = (PAGE_RETENTION_HOURS + 24) * 60 * 60;

const RECORD_VERSION = 1;

const ROLLUP_LEASE_KEY = 'fragment-usage-rollup.lease';

/**
 * The rollup action's timeout. The lease is never released, only left to lapse, and since it is
 * claimed after the run starts it always outlives the run.
 */
const ROLLUP_LEASE_TTL = 300;

/** Longest a claim may take to land after the lease was read as free; a slower claim is abandoned. */
const ROLLUP_LEASE_CLAIM_MS = 1000;

/**
 * How long a claim settles before it is confirmed. Longer than the claim bound, so every run that
 * read the lease as free has landed its claim before any of them re-reads it.
 */
const ROLLUP_LEASE_SETTLE_MS = 2000;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function buildUsageKey(fragmentId) {
    return `fragment-usage.${fragmentId}`;
}

function encodeStateValue(value) {
    return zlib.brotliCompressSync(JSON.stringify(value)).toString('base64');
}

function decodeStateValue(raw) {
    return JSON.parse(zlib.brotliDecompressSync(Buffer.from(raw, 'base64')).toString());
}

/**
 * Reads one fragment's usage record.
 * @param {string} fragmentId fragment id
 * @param {object} state optional pre-initialised State client, to reuse across a batch
 * @returns {Promise<object|null>} the record, or null when the fragment has never been requested
 */
async function readUsage(fragmentId, state) {
    const client = state || (await stateLib.init());
    const entry = await client.get(buildUsageKey(fragmentId));
    if (!entry?.value) return null;
    return decodeStateValue(entry.value);
}

/**
 * Writes one fragment's usage record.
 * @param {string} fragmentId fragment id
 * @param {object} record { version, updatedAt, hours, pages }
 * @param {object} state optional pre-initialised State client
 * @returns {Promise<object>} the record that was written
 */
async function writeUsage(fragmentId, record, state) {
    const client = state || (await stateLib.init());
    await client.put(buildUsageKey(fragmentId), encodeStateValue(record), { ttl: USAGE_TTL });
    return record;
}

function emptyRecord() {
    return { version: RECORD_VERSION, updatedAt: null, pages: {} };
}

/**
 * Claims the single rollup slot, so overlapping runs cannot interleave their read-merge-write of
 * the same record.
 *
 * State has no conditional writes, so two runs can both read the lease as free. Each claims it,
 * waits until every such claim has landed, and proceeds only if the lease still names it: the last
 * claim wins and every other run backs off. That holds while claims land within
 * ROLLUP_LEASE_CLAIM_MS, so a slower claim is abandoned rather than trusted.
 *
 * There is no release. State has no delete-if-still-mine and its SDK retries deletes, so a release
 * could remove a successor's lease and let a third run overlap it. Every lease, an abandoned claim
 * included, lapses with ROLLUP_LEASE_TTL instead, which an hourly schedule never waits on.
 * @param {string} owner id unique to this run
 * @param {object} state pre-initialised State client
 * @param {Function} sleep resolves after the given milliseconds; injectable for tests
 * @returns {Promise<boolean>} true when this run now holds the lease
 */
async function acquireRollupLease(owner, state, sleep = wait) {
    const readAt = Date.now();
    const entry = await state.get(ROLLUP_LEASE_KEY);
    if (entry?.value) return false;
    await state.put(ROLLUP_LEASE_KEY, owner, { ttl: ROLLUP_LEASE_TTL });
    if (Date.now() - readAt > ROLLUP_LEASE_CLAIM_MS) return false;
    await sleep(ROLLUP_LEASE_SETTLE_MS);
    const confirmed = await state.get(ROLLUP_LEASE_KEY);
    return confirmed?.value === owner;
}

module.exports = {
    readUsage,
    writeUsage,
    emptyRecord,
    acquireRollupLease,
};
