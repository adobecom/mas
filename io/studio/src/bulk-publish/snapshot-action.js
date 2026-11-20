const { Core } = require('@adobe/aio-sdk');
const { errorResponse, checkMissingRequestInputs, getBearerToken, isAllowed } = require('../../utils.js');
const { createSnapshot } = require('./snapshot.js');
const { authorizeProject } = require('./permissions.js');

const logger = Core.Logger('bulk-snapshot', { level: 'info' });

async function main(params) {
    try {
        const odinEndpoint = params.aemOdinEndpoint || params.odinEndpoint;
        if (!odinEndpoint) {
            return errorResponse(400, 'missing parameter(s) [aemOdinEndpoint|odinEndpoint]', logger);
        }

        const missing = checkMissingRequestInputs(params, ['paths', 'projectId'], ['Authorization']);
        if (missing) return errorResponse(400, missing, logger);

        const authToken = getBearerToken(params);
        if (!(await isAllowed(authToken, params.allowedClientId))) {
            return errorResponse(401, 'Authorization failed', logger);
        }

        const { paths, projectId, projectTitle = '' } = params;
        if (!Array.isArray(paths) || paths.length === 0) {
            return errorResponse(400, 'paths must be a non-empty array', logger);
        }

        const { permissions, assertPaths } = await authorizeProject(
            { projectId, odinEndpoint, authToken, paths },
            undefined,
            'snapshot',
        );
        const { entries, failures } = await createSnapshot({
            paths,
            projectId,
            projectTitle,
            odinEndpoint,
            authToken,
            assertPaths: permissions.surfaces ? assertPaths : undefined,
        });
        return { statusCode: 200, body: { entries, failures } };
    } catch (error) {
        if (error.statusCode) return errorResponse(error.statusCode, error.message, logger);
        logger.error(JSON.stringify({ event: 'snapshot-error', error: error.message }));
        return errorResponse(500, error.message || 'Internal server error', logger);
    }
}

exports.main = main;
