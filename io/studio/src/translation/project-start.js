const { Core } = require('@adobe/aio-sdk');
const { Ims } = require('@adobe/aio-lib-ims');
const { errorResponse, checkMissingRequestInputs, getBearerToken, isAllowed } = require('../../utils');
const { buildSiblingActionName, fetchOdin, getInternalValue, getValue, getValues, invokeAsyncAction } = require('../common.js');
const { putJobPayload, putProjectSummary, patchProjectSummary } = require('./state.js');
const { enqueueJob } = require('./queue.js');

const logger = Core.Logger('translation-starter', { level: 'info' });
const DISPATCHER_ACTION_NAME = 'translation-project-dispatcher';
const QUEUED_STATUS = 'QUEUED';

async function main(params) {
    try {
        const ims = new Ims('prod');
        const requiredHeaders = ['Authorization'];
        const requiredParams = ['projectId', 'surface'];
        const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders);
        if (errorMessage) {
            return errorResponse(400, errorMessage, logger);
        }

        const authToken = getBearerToken(params);
        const allowed = await isAllowed(authToken, params.allowedClientId, ims);
        if (!allowed) {
            return errorResponse(401, 'Authorization failed', logger);
        }

        const { projectCF, etag } = await getTranslationProject(params, authToken);
        const submissionDate = `${new Date().toISOString().split('.')[0]}Z`;
        await updateSubmissionMetadata(params, projectCF, etag, authToken, submissionDate);

        const jobId = projectCF.id;
        const projectType = getValue(projectCF, 'projectType')?.value || 'translation';
        const translationFlow = params.translationMapping?.[params.surface] || 'transcreation';
        const requestedBy = getInternalValue(projectCF, 'modified.by') || getInternalValue(projectCF, 'created.by') || null;

        logger.info(
            `Project start context: projectType=${projectType}, translationFlow=${translationFlow}, requestedBy=${requestedBy}`,
        );

        await putJobPayload(
            jobId,
            {
                jobId,
                projectId: params.projectId,
                surface: params.surface,
                authToken,
                projectType,
                translationFlow,
                requestedAt: submissionDate,
                requestedBy,
            },
            { params },
        );

        await putProjectSummary(
            params.projectId,
            {
                projectId: params.projectId,
                jobId,
                status: QUEUED_STATUS,
                submissionDate,
                queue: {
                    state: QUEUED_STATUS,
                    queuedAt: submissionDate,
                    startedAt: null,
                },
                dispatcher: {
                    invokedAt: null,
                },
                worker: {
                    activationId: null,
                    dispatchedAt: null,
                    startedAt: null,
                },
                versioning: {
                    startedAt: null,
                    completedAt: null,
                    durationMs: null,
                    itemCount: 0,
                    completedItemCount: 0,
                    failedItemCount: 0,
                },
                lastError: null,
            },
            { params, updatedAt: submissionDate },
        );

        await enqueueJob(jobId);
        logger.info(`Enqueued job ${jobId}`);

        const dispatcherActionName = buildSiblingActionName(params, DISPATCHER_ACTION_NAME, {
            overrideParamName: 'translationProjectStartDispatcherActionName',
        });
        await invokeAsyncAction(dispatcherActionName, { jobId }, params);
        await patchProjectSummary(
            params.projectId,
            {
                dispatcher: {
                    invokedAt: new Date().toISOString(),
                },
            },
            { params },
        );
        logger.info(`Invoked dispatcher action ${dispatcherActionName} for job ${jobId}`);

        return {
            statusCode: 202,
            body: {
                jobId,
                submissionDate,
            },
        };
    } catch (error) {
        logger.error('Error queuing translation project start', error);
        return errorResponse(500, `Internal server error - ${error.message}`, logger);
    }
}

async function getTranslationProject(params, authToken) {
    try {
        const response = await fetchOdin(params.odinEndpoint, `/adobe/sites/cf/fragments/${params.projectId}`, authToken);
        const projectCF = await response.json();
        const etag = response.headers.get('etag');
        return { projectCF, etag };
    } catch (error) {
        logger.error(`Error fetching translation project: ${error}`);
        throw new Error(`Failed to fetch translation project: ${error.message || error.toString()}`);
    }
}

async function updateSubmissionMetadata(params, projectCF, etag, authToken, submissionDate) {
    const submissionDateField = getValues(projectCF, 'submissionDate');
    if (!submissionDateField?.path) {
        throw new Error('Submission date field not found in translation project');
    }

    const operations = [{ op: 'replace', path: `${submissionDateField.path}/values`, value: [submissionDate] }];
    const statusField = getValues(projectCF, 'status');
    if (statusField?.path) {
        operations.push({ op: 'replace', path: `${statusField.path}/values`, value: [QUEUED_STATUS] });
    }

    const response = await fetchOdin(params.odinEndpoint, `/adobe/sites/cf/fragments/${projectCF.id}`, authToken, {
        method: 'PATCH',
        contentType: 'application/json-patch+json',
        etag,
        body: JSON.stringify(operations),
    });
    logger.info(`Updated submission metadata for ${projectCF.id}`);

    return response.json();
}

exports.main = main;
exports.DISPATCHER_ACTION_NAME = DISPATCHER_ACTION_NAME;
