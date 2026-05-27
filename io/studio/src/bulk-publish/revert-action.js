const { Core } = require('@adobe/aio-sdk');
const { errorResponse, checkMissingRequestInputs, getBearerToken, isAllowed, parseOwBody } = require('../../utils.js');
const { revertSnapshot } = require('./snapshot.js');
const { PROJECT_STATUS, readProjectFragment, updateProjectFragment, getProjectSnapshots } = require('./project.js');

const logger = Core.Logger('bulk-revert', { level: 'info' });

async function main(params) {
    if (!params.projectId && !params.entries) params = parseOwBody(params);
    try {
        const odinEndpoint = params.aemOdinEndpoint || params.odinEndpoint;
        if (!odinEndpoint) {
            return errorResponse(400, 'missing parameter(s) [aemOdinEndpoint|odinEndpoint]', logger);
        }

        const authToken = getBearerToken(params);
        if (!(await isAllowed(authToken, params.allowedClientId))) {
            return errorResponse(401, 'Authorization failed', logger);
        }

        if (params.projectId) {
            return revertWithProject(params, odinEndpoint, authToken);
        }

        const missing = checkMissingRequestInputs(params, ['entries'], ['Authorization']);
        if (missing) return errorResponse(400, missing, logger);

        const { entries } = params;
        if (!Array.isArray(entries) || entries.length === 0) {
            return errorResponse(400, 'entries must be a non-empty array', logger);
        }

        const result = await revertSnapshot({ entries, odinEndpoint, authToken });
        return { statusCode: 200, body: result };
    } catch (error) {
        logger.error(JSON.stringify({ event: 'revert-error', error: error.message }));
        return errorResponse(500, error.message || 'Internal server error', logger);
    }
}

async function revertWithProject(params, odinEndpoint, authToken) {
    const { projectId } = params;
    logger.info(JSON.stringify({ event: 'project-revert-start', projectId }));

    let fragment;
    try {
        const result = await readProjectFragment(odinEndpoint, projectId, authToken);
        fragment = result.fragment;
    } catch (err) {
        return errorResponse(500, `Failed to read project fragment: ${err.message}`, logger);
    }

    const entries = getProjectSnapshots(fragment);

    if (!entries.length) {
        const lastError = 'REVERT:\nNo snapshot found. Please re-publish to create a snapshot.';
        await updateProjectFragment(odinEndpoint, projectId, authToken, {
            status: PROJECT_STATUS.PUBLISHED,
            lastError,
        }).catch(() => {});
        return { statusCode: 200, body: { status: PROJECT_STATUS.PUBLISHED, lastError } };
    }

    try {
        await updateProjectFragment(odinEndpoint, projectId, authToken, {
            status: PROJECT_STATUS.REVERTING,
            lastError: '',
        });
    } catch (err) {
        return errorResponse(500, `Failed to update project status: ${err.message}`, logger);
    }

    let revertResult;
    try {
        revertResult = await revertSnapshot({ entries, odinEndpoint, authToken });
    } catch (err) {
        const lastError = `REVERT:\n${err.message}`;
        await updateProjectFragment(odinEndpoint, projectId, authToken, {
            status: PROJECT_STATUS.PUBLISHED,
            lastError,
        }).catch(() => {});
        return { statusCode: 200, body: { status: PROJECT_STATUS.PUBLISHED, lastError } };
    }

    const { failures, skipped } = revertResult;

    let finalSnapshots = entries;
    if (skipped.length > 0) {
        const skipSet = new Set(skipped);
        finalSnapshots = entries.filter((e) => {
            try {
                return !skipSet.has(JSON.parse(e).fragmentId);
            } catch {
                return true;
            }
        });
    }

    const finalStatus = failures.length === 0 ? PROJECT_STATUS.REVERTED : PROJECT_STATUS.PUBLISHED;
    const finalError = failures.length === 0 ? '' : `REVERT:\n${failures.map((f) => `${f.path}: ${f.error}`).join('\n')}`;

    await updateProjectFragment(odinEndpoint, projectId, authToken, {
        status: finalStatus,
        snapshots: finalSnapshots,
        lastError: finalError,
    }).catch((err) => {
        logger.error(JSON.stringify({ event: 'project-revert-patch-error', projectId, error: err.message }));
    });

    logger.info(JSON.stringify({ event: 'project-revert-complete', projectId, finalStatus }));
    return { statusCode: 200, body: { status: finalStatus, lastError: finalError, failures, skipped } };
}

exports.main = main;
