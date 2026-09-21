/**
 * Hourly usage rollup (MWPW-185891).
 *
 * Runs on a schedule (once per hour). The Grafana queries cover EVERY fragment for the window, so
 * the cost does not grow with the number of fragments in Studio.
 *
 * This exists because querying live per fragment is not viable: a single fragment's referer
 * breakdown rescans a very large number of rows. Pre-aggregating turns the read path into a State
 * lookup with no Grafana call at all.
 *
 * The job overlaps its window deliberately (see LOOKBACK_HOURS) and merges by hour rather than
 * adding, so a retried, delayed, or double-fired alarm cannot double count.
 */

const { Core } = require('@adobe/aio-sdk');
const stateLib = require('@adobe/aio-lib-state');

const { fetchHourlyPages } = require('./grafana');
const { mergePages, prunePages, toEpochHour, HOUR_MS } = require('./pages');
const { readUsage, writeUsage, emptyRecord } = require('./state');

/**
 * How far back each run re-reads. Two hours rather than one so a late or skipped run still repairs
 * the previous hour, and so the hour that was still in progress last time gets its final count.
 */
const LOOKBACK_HOURS = 2;

/**
 * Aggregates a window of Grafana data into the stored records.
 * @param {object} params action inputs
 * @returns {Promise<object>} run summary
 */
async function main(params) {
    const logger = Core.Logger('fragment-usage-rollup', { level: params.LOG_LEVEL || 'info' });
    const startedAt = Date.now();

    try {
        const token = params.GRAFANA_SERVICE_TOKEN;
        if (!token) {
            return { statusCode: 503, body: 'Rollup not configured (missing GRAFANA_SERVICE_TOKEN)' };
        }

        const toMs = Date.now();
        const fromMs = toMs - LOOKBACK_HOURS * HOUR_MS;

        const pagesByFragment = await fetchHourlyPages(fromMs, toMs, {
            token,
            url: params.GRAFANA_SERVICE_URL,
        });

        const nowHour = toEpochHour(toMs);
        const updatedAt = new Date(toMs).toISOString();
        const state = await stateLib.init();

        let fragments = 0;
        let pages = 0;

        for (const [fragmentId, hourlyPages] of Object.entries(pagesByFragment)) {
            const stored = (await readUsage(fragmentId, state)) || emptyRecord();

            // Records written while the traffic panel existed still carry an hourly count map.
            // Spreading `stored` would copy it forward on every run, so it is dropped explicitly
            // and ages out with the first rewrite rather than surviving until the record expires.
            delete stored.hours;

            const mergedPages = prunePages(mergePages(stored.pages ?? {}, hourlyPages), nowHour);
            await writeUsage(fragmentId, { ...stored, updatedAt, pages: mergedPages }, state);
            fragments += 1;
            pages += Object.values(hourlyPages).reduce((sum, byPage) => sum + Object.keys(byPage).length, 0);
        }

        const summary = { fragments, pages, durationMs: Date.now() - startedAt };
        logger.info('fragment usage rollup complete', summary);

        // Only a summary is returned. Returning the per-fragment grid would approach the 1MB
        // Adobe I/O Runtime response cap.
        return { statusCode: 200, body: summary };
    } catch (error) {
        logger.error('fragment usage rollup failed', error);
        return { statusCode: 500, body: `ERROR in fragment usage rollup: ${error.message}` };
    }
}

exports.main = main;
exports.LOOKBACK_HOURS = LOOKBACK_HOURS;
