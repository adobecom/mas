const { Core } = require('@adobe/aio-sdk');
const { errorResponse, checkMissingRequestInputs, getBearerToken, isAllowed, parseOwBody } = require('../../utils.js');
const { PROJECT_STATUS, readProjectFragment } = require('./project.js');
const { generateReport } = require('./report.js');
const { getValue } = require('../common.js');

const logger = Core.Logger('bulk-report', { level: 'info' });

const COMPLETE_STATUSES = [PROJECT_STATUS.PUBLISHED, PROJECT_STATUS.PARTIALLY_PUBLISHED, PROJECT_STATUS.FAILED];

async function main(params) {
    if (!params.projectId) params = parseOwBody(params);
    try {
        const odinEndpoint = params.aemOdinEndpoint || params.odinEndpoint;
        if (!odinEndpoint) {
            return errorResponse(400, 'missing parameter(s) [aemOdinEndpoint|odinEndpoint]', logger);
        }

        const missing = checkMissingRequestInputs(params, ['projectId'], ['Authorization']);
        if (missing) return errorResponse(400, missing, logger);

        const authToken = getBearerToken(params);
        if (!(await isAllowed(authToken, params.allowedClientId))) {
            return errorResponse(401, 'Authorization failed', logger);
        }

        const { projectId } = params;
        const { fragment } = await readProjectFragment(odinEndpoint, projectId, authToken);
        if (!COMPLETE_STATUSES.includes(getValue(fragment, 'status')?.value)) {
            return errorResponse(409, 'Project is not complete', logger);
        }

        const report = await generateReport({ projectId, project: fragment, odinEndpoint, authToken });
        const { live, failed, notLive } = report.summary;
        logger.info(JSON.stringify({ event: 'report-complete', projectId, live, failed, notLive }));
        for (const { path, message } of report.errors) {
            logger.warn(JSON.stringify({ event: 'report-item-error', path, message }));
        }
        return { statusCode: 200, body: report };
    } catch (error) {
        logger.error(JSON.stringify({ event: 'report-error', error: error.message }));
        return errorResponse(500, error.message || 'Internal server error', logger);
    }
}

exports.main = main;
