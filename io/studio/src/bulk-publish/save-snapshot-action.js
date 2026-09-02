const { Core } = require('@adobe/aio-sdk');
const { errorResponse, getBearerToken, isAllowed, parseOwBody } = require('../../utils.js');
const { recordSnapshot } = require('./snapshot.js');
const { readProjectFragment, updateProjectFragment, getProjectPaths } = require('./project.js');

const logger = Core.Logger('bulk-save-snapshot', { level: 'info' });

async function main(params) {
    if (!params.projectId) params = parseOwBody(params);
    try {
        const odinEndpoint = params.aemOdinEndpoint || params.odinEndpoint;
        if (!odinEndpoint) return errorResponse(400, 'missing odinEndpoint', logger);

        const authToken = getBearerToken(params);
        if (!(await isAllowed(authToken, params.allowedClientId))) {
            return errorResponse(401, 'Authorization failed', logger);
        }

        const { projectId } = params;
        if (!projectId) return errorResponse(400, 'projectId is required', logger);

        const { fragment } = await readProjectFragment(odinEndpoint, projectId, authToken);
        const paths = getProjectPaths(fragment);

        if (!paths.length) {
            return { statusCode: 200, body: { entries: [] } };
        }

        const { entries, failures } = await recordSnapshot({ paths, odinEndpoint, authToken });
        const lastError =
            failures.length > 0 ? `SAVE_SNAPSHOT:\n${failures.map((f) => `${f.path}: ${f.error}`).join('\n')}` : '';
        await updateProjectFragment(odinEndpoint, projectId, authToken, { snapshots: entries, lastError });

        logger.info(
            JSON.stringify({ event: 'save-snapshot-complete', projectId, count: entries.length, failures: failures.length }),
        );
        return { statusCode: 200, body: { entries, lastError } };
    } catch (error) {
        logger.error(JSON.stringify({ event: 'save-snapshot-error', error: error.message }));
        return errorResponse(500, error.message || 'Internal server error', logger);
    }
}

exports.main = main;
