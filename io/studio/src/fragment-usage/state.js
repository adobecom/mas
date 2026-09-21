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

module.exports = {
    readUsage,
    writeUsage,
    emptyRecord,
};
