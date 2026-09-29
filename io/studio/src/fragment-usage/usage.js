/**
 * Fragment usage read action (MWPW-185891).
 *
 * Serves the pre-aggregated pages written by rollup.js. This path never touches Grafana, so it is
 * fast, cannot leak the service token, and cannot be made expensive by opening many fragments.
 *
 * Returns the pages that requested the fragment and, for each, the countries they were served
 * from, so the caller can group them by region.
 */

const { Core } = require('@adobe/aio-sdk');

const { getBearerToken, isAllowed, parseOwBody } = require('../../utils.js');
const { FRAGMENT_ID_PATTERN, prunePages, toEpochHour, topPages } = require('./pages');
const { readUsage } = require('./state');

/**
 * @param {object} params action inputs
 * @returns {Promise<object>} usage for one fragment
 */
async function main(params) {
    const logger = Core.Logger('fragment-usage', { level: params.LOG_LEVEL || 'info' });
    try {
        // `allowedClientId` is the package's Studio IMS client, so a valid token issued to any
        // other client is still refused.
        if (!(await isAllowed(getBearerToken(params), params.allowedClientId))) {
            return { statusCode: 401, body: 'Unauthorized: token is missing or invalid' };
        }

        // Fragment ids are UUIDs. Anything else is rejected rather than sanitised.
        const { fragmentId } = parseOwBody(params);
        if (!fragmentId || !FRAGMENT_ID_PATTERN.test(fragmentId)) {
            return { statusCode: 400, body: 'A valid fragmentId is required' };
        }

        const record = await readUsage(fragmentId);

        // No record means the rollup has never seen a request for this fragment. That is a real
        // answer -- no page requested it -- not an error, so the UI shows an empty list rather
        // than "unavailable".
        const pages = record?.pages || {};

        // The rollup only prunes fragments it rewrites, so a fragment that went quiet keeps its old
        // hours until the record expires. Pruning here keeps the list true to its 7-day label.
        const recentPages = prunePages(pages, toEpochHour(Date.now()));

        // No custom headers: I/O Runtime adds CORS only when the response carries none of its own.
        return {
            statusCode: 200,
            body: {
                available: true,
                fragmentId,
                updatedAt: record?.updatedAt || null,
                pages: topPages(recentPages),
            },
        };
    } catch (error) {
        logger.error('fragment usage read failed', error);
        return { statusCode: 500, body: 'ERROR in fragment usage' };
    }
}

exports.main = main;
