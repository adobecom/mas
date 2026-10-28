const { timingSafeEqual } = require('node:crypto');
const { init } = require('@adobe/aio-lib-state');
const { getBearerToken } = require('../../utils.js');
const { CACHE_KEY, SNAPSHOT_TTL_SECONDS, MAX_SNAPSHOT_BYTES, validSnapshot, response } = require('./snapshot.js');

/** Receives an authenticated aggregate snapshot; raw-http keeps input separate from configuration. */
async function main(params) {
    if (params.__ow_method !== 'post') return response(405, { error: 'Use POST.' });
    const secret = params.MAS_AGENT_DASHBOARD_PUSH_SECRET;
    if (!secret) return response(503, { error: 'Dashboard push is not configured.' });
    const token = getBearerToken(params) || '';
    const expected = Buffer.from(secret);
    const supplied = Buffer.from(token);
    if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
        return response(401, { error: 'Unauthorized.' });
    }
    if (params.__ow_headers['content-type']?.split(';')[0].trim().toLowerCase() !== 'application/json') {
        return response(415, { error: 'Use application/json.' });
    }
    if (typeof params.__ow_body !== 'string' || params.__ow_body.length > Math.ceil((MAX_SNAPSHOT_BYTES * 4) / 3) + 4) {
        return response(413, { error: 'Snapshot is missing or too large.' });
    }
    let snapshot;
    try {
        const body = Buffer.from(params.__ow_body, 'base64');
        if (body.length > MAX_SNAPSHOT_BYTES) return response(413, { error: 'Snapshot is too large.' });
        snapshot = JSON.parse(body.toString('utf8'));
    } catch {
        return response(400, { error: 'Invalid JSON snapshot.' });
    }
    if (!validSnapshot(snapshot)) return response(400, { error: 'Invalid aggregate snapshot.' });
    try {
        const state = await init();
        const previous = await state.get(CACHE_KEY);
        if (previous?.value && JSON.parse(previous.value).generatedAt >= snapshot.generatedAt) {
            return response(200, { accepted: false });
        }
        await state.put(CACHE_KEY, JSON.stringify(snapshot), { ttl: SNAPSHOT_TTL_SECONDS });
        return response(200, { accepted: true });
    } catch {
        return response(503, { error: 'Dashboard storage is unavailable.' });
    }
}

exports.main = main;
