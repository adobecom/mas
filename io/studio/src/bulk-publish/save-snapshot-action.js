const { Core } = require('@adobe/aio-sdk');
const { recordSnapshot } = require('./snapshot.js');
const { readProjectFragment, updateProjectFragment, getProjectPaths } = require('./project.js');

const logger = Core.Logger('bulk-save-snapshot', { level: 'info' });

async function main(params) {
    const { projectId, authToken } = params;
    const odinEndpoint = params.aemOdinEndpoint || params.odinEndpoint;

    if (!projectId) return { statusCode: 400, body: { error: 'projectId is required' } };
    if (!authToken) return { statusCode: 400, body: { error: 'authToken is required' } };

    try {
        const { fragment } = await readProjectFragment(odinEndpoint, projectId, authToken);
        const paths = getProjectPaths(fragment);

        if (!paths.length) {
            return { statusCode: 200, body: { entries: [] } };
        }

        const entries = await recordSnapshot({ paths, odinEndpoint, authToken });
        await updateProjectFragment(odinEndpoint, projectId, authToken, { snapshots: entries });

        logger.info(JSON.stringify({ event: 'save-snapshot-complete', projectId, count: entries.length }));
        return { statusCode: 200, body: { entries } };
    } catch (error) {
        logger.error(JSON.stringify({ event: 'save-snapshot-error', projectId, error: error.message }));
        return { statusCode: 500, body: { error: error.message } };
    }
}

module.exports = { main };
