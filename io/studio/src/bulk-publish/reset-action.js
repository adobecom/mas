const { Core } = require('@adobe/aio-sdk');
const { errorResponse, checkMissingRequestInputs, getBearerToken, isAllowed, parseOwBody } = require('../../utils.js');
const {
    PROJECT_STATUS,
    readProjectFragment,
    updateProjectFragment,
    getProjectSnapshots,
    removePendingMarker,
} = require('./project.js');

const logger = Core.Logger('bulk-publish-reset', { level: 'info' });

// Escape hatch for a project stranded in Publishing by a worker crash the in-process handler could not
// reach (an OpenWhisk timeout or hard kill). Clears the pending marker so the next publish starts from
// a fresh snapshot rather than silently reusing the interrupted one.
async function main(params) {
    if (!params.projectId) params = parseOwBody(params);
    try {
        const odinEndpoint = params.aemOdinEndpoint || params.odinEndpoint;
        if (!odinEndpoint) {
            return errorResponse(400, 'missing parameter(s) [aemOdinEndpoint|odinEndpoint]', logger);
        }

        const authToken = getBearerToken(params);
        if (!(await isAllowed(authToken, params.allowedClientId))) {
            return errorResponse(401, 'Authorization failed', logger);
        }

        const missing = checkMissingRequestInputs(params, ['projectId'], ['Authorization']);
        if (missing) return errorResponse(400, missing, logger);

        const { projectId } = params;
        logger.info(JSON.stringify({ event: 'project-reset-start', projectId }));

        let fragment;
        try {
            const result = await readProjectFragment(odinEndpoint, projectId, authToken);
            fragment = result.fragment;
        } catch (err) {
            return errorResponse(500, `Failed to read project fragment: ${err.message}`, logger);
        }

        const entries = getProjectSnapshots(fragment);
        const fields = { status: PROJECT_STATUS.DRAFT, lastError: '' };
        if (entries.length) fields.snapshots = removePendingMarker(entries);

        try {
            await updateProjectFragment(odinEndpoint, projectId, authToken, fields);
        } catch (err) {
            return errorResponse(500, `Failed to reset project status: ${err.message}`, logger);
        }

        logger.info(JSON.stringify({ event: 'project-reset-complete', projectId }));
        return { statusCode: 200, body: { status: PROJECT_STATUS.DRAFT } };
    } catch (error) {
        logger.error(JSON.stringify({ event: 'reset-error', error: error.message }));
        return errorResponse(500, error.message || 'Internal server error', logger);
    }
}

module.exports = { main };
