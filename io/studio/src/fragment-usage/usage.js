/**
 * Fragment usage read action (MWPW-185891).
 *
 * Serves the pre-aggregated pages written by rollup.js. This path never touches Grafana, so it is
 * fast, cannot leak the service token, and cannot be made expensive by opening many fragments.
 *
 * Returns the pages that requested the fragment and, for each, the countries they were served
 * from, so the caller can group them by region.
 */

const { Ims } = require('@adobe/aio-lib-ims');

const { topPages } = require('./pages');
const { readUsage } = require('./state');

/** Fragment ids are UUIDs. Anything else is rejected rather than sanitised. */
const FRAGMENT_ID_PATTERN = /^[\w-]+$/;

const authorize = async (headers = {}) => {
    const authHeader = headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) return false;
    const token = authHeader.slice(7);
    if (!token) return false;
    const imsValidation = await new Ims('prod').validateToken(token);
    return imsValidation.valid;
};

/**
 * @param {object} params action inputs
 * @returns {Promise<object>} usage for one fragment
 */
async function main(params) {
    try {
        if (!(await authorize(params.__ow_headers))) {
            return { statusCode: 401, body: 'Unauthorized: token is missing or invalid' };
        }

        const { fragmentId } = params;
        if (!fragmentId || !FRAGMENT_ID_PATTERN.test(fragmentId)) {
            return { statusCode: 400, body: 'A valid fragmentId is required' };
        }

        const record = await readUsage(fragmentId);

        // No record means the rollup has never seen a request for this fragment. That is a real
        // answer -- no page requested it -- not an error, so the UI shows an empty list rather
        // than "unavailable".
        const pages = record?.pages || {};

        // No custom headers: I/O Runtime adds CORS only when the response carries none of its own.
        return {
            statusCode: 200,
            body: {
                available: true,
                fragmentId,
                updatedAt: record?.updatedAt || null,
                pages: topPages(pages),
            },
        };
    } catch (error) {
        return { statusCode: 500, body: `ERROR in fragment usage: ${error.message}` };
    }
}

exports.main = main;
exports.FRAGMENT_ID_PATTERN = FRAGMENT_ID_PATTERN;
