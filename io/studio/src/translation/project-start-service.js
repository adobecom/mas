const { Core } = require('@adobe/aio-sdk');
const { errorResponse, checkMissingRequestInputs, getBearerToken } = require('../../utils');
const {
    fetchFragmentByPath,
    fetchOdin,
    getValue,
    getValues,
    postToOdinWithRetry,
    processBatchWithConcurrency,
} = require('../common.js');

const DEFAULT_BATCH_SIZE = 10;
const ODIN_PATH = (surface, locale, fragmentPath) => `/content/dam/mas/${surface}/${locale}/${fragmentPath}`;
const PATH_TOKENS = /\/content\/dam\/mas\/(?<surface>[\w-_]+)\/(?<parsedLocale>[\w-_]+)\/(?<fragmentPath>.+)/;
const logger = Core.Logger('translation', { level: 'info' });

async function prepareProjectStart(params, options = {}) {
    logger.info('Calling the main action');

    const requiredHeaders = ['Authorization'];
    const requiredParams = ['projectId', 'surface'];
    const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders);
    if (errorMessage) {
        throw createProjectStartError(400, errorMessage);
    }

    const authToken = getBearerToken(params);
    const { projectCF, etag } = await getTranslationProject(params.projectId, authToken, params);
    const translationFlow = params.translationFlow || params.translationMapping?.[params.surface] || null;
    const translationData = await getTranslationData(authToken, projectCF, params.surface, translationFlow, params);
    if (!translationData) {
        throw createProjectStartError(400, 'Translation project is incomplete (missing items or locales)');
    }

    const projectType = getValue(projectCF, 'projectType')?.value;
    const responseMessage = projectType === 'rollout' ? 'Rollout project started' : 'Translation project started';

    return {
        params,
        authToken,
        projectCF,
        etag,
        projectType,
        responseMessage,
        translationData,
        batchSize: params.batchSize || DEFAULT_BATCH_SIZE,
    };
}

async function runVersioningStage(context, options = {}) {
    return versionTargetFragments(context, options);
}

async function runPostVersioningStage(context) {
    const syncResult = await sendSyncRequests(
        context.translationData.itemsToSync,
        context.authToken,
        context.batchSize,
        context.params,
    );
    if (!syncResult.success) {
        throw createProjectStartError(500, 'Failed to sync target fragments');
    }

    logger.info(`Project type: ${context.projectType}`);
    if (context.projectType === 'rollout') {
        const rolloutOnlyProject = await startRolloutOnlyProject(context.translationData, context.authToken, context.params);
        if (!rolloutOnlyProject) {
            throw createProjectStartError(500, 'Failed to start rollout only project');
        }
    } else {
        const translationProject = await startTranslationProject(context.translationData, context.authToken, context.params);
        if (!translationProject) {
            throw createProjectStartError(500, 'Failed to start translation project');
        }
    }

    return {
        message: context.responseMessage,
    };
}

async function finalizeProjectStart(context) {
    if (context.params.skipSubmissionDateUpdate) {
        return {
            statusCode: 200,
            body: {
                message: context.responseMessage,
            },
        };
    }

    const updatedProjectCF = await updateTranslationDate(context.projectCF, context.etag, context.authToken, context.params);
    if (!updatedProjectCF?.success) {
        return errorResponse(500, 'Failed to update translation project submission date', logger);
    }

    return {
        statusCode: 200,
        body: {
            message: context.responseMessage,
            submissionDate: updatedProjectCF.submissionDate,
        },
    };
}

function getVersioningTargets(translationData) {
    const { itemsToTranslate, itemsToSync, locales } = translationData;
    const itemsToVersion = itemsToTranslate.flatMap((item) => {
        const { surface, fragmentPath } = item.match(PATH_TOKENS)?.groups || {};
        return locales.map((locale) => ({
            path: `/content/dam/mas/${surface}/${locale}/${fragmentPath}`,
        }));
    });
    itemsToVersion.push(...itemsToSync);
    return itemsToVersion;
}

function getVersioningItemCount(translationData) {
    return getVersioningTargets(translationData).length;
}

function createProjectStartError(statusCode, message, options = {}) {
    const error = new Error(message);
    error.statusCode = statusCode;
    Object.assign(error, options);
    return error;
}

function isProjectStartError(error) {
    return Number.isInteger(error?.statusCode);
}

async function getTranslationProject(projectId, authToken, params = {}) {
    try {
        const response = await fetchOdin(params.odinEndpoint, `/adobe/sites/cf/fragments/${projectId}`, authToken);
        const projectCF = await response.json();
        const etag = response.headers.get('etag');
        return { projectCF, etag };
    } catch (error) {
        logger.error(`Error fetching translation project: ${error}`);
        throw new Error(`Failed to fetch translation project: ${error.message || error.toString()}`);
    }
}

async function getTranslationData(authToken, projectCF, surface, translationFlow = null, params = {}) {
    const locales = getValues(projectCF, 'targetLocales')?.values;
    if (!locales || locales.length === 0) {
        logger.warn('No locales found in translation project');
        return null;
    }
    const itemsToTranslate = getItemsToTranslate(projectCF);
    if (!itemsToTranslate) {
        return null;
    }
    const itemsToSync = await getItemsToSync(authToken, projectCF, locales, surface, params);

    logger.info(`Translation flow: ${translationFlow}`);

    return {
        title: getValue(projectCF, 'title')?.value || 'Untitled Project',
        itemsToTranslate,
        itemsToSync,
        locales,
        surface,
        translationFlow: translationFlow
            ? {
                  [translationFlow]: true,
              }
            : {},
    };
}

async function getItemsToSync(authToken, projectCF, locales, surface, params = {}) {
    const items = [];
    const placeholders = getValues(projectCF, 'placeholders')?.values || [];
    if (placeholders.length > 0) {
        for (const locale of locales) {
            const targetPlaceholders = placeholders.map((placeholder) => placeholder.replace('/en_US/', `/${locale}/`));
            const path = ODIN_PATH(surface, locale, 'dictionary/index');
            const { fragment, status, etag } = await fetchFragmentByPath(params.odinEndpoint, path, authToken);
            if (status === 200 && fragment) {
                const { values: existingEntries = [], path: existingEntriesPath } = getValues(fragment, 'entries');
                if (existingEntriesPath) {
                    const newValues = [...existingEntries, ...targetPlaceholders];
                    logger.info(`Adding ${path} (etag: ${etag}) to sync with entries=${newValues}`);
                    items.push({
                        id: fragment.id,
                        etag,
                        path,
                        update: {
                            name: 'entries',
                            path: `${existingEntriesPath}/values`,
                            value: newValues,
                        },
                    });
                }
            }
        }
    }
    return items;
}

function getItemsToTranslate(projectCF) {
    const fragments = getValues(projectCF, 'fragments')?.values || [];
    const collections = getValues(projectCF, 'collections')?.values || [];
    const placeholders = getValues(projectCF, 'placeholders')?.values || [];

    const itemsToTranslate = [...fragments, ...collections, ...placeholders];

    if (itemsToTranslate.length === 0) {
        logger.warn(`No items to translate found in translation project: ${projectCF.id}`);
        return null;
    }
    return itemsToTranslate;
}

async function versionTargetFragment(fragmentToVersion, { authToken, title, params }) {
    const { path } = fragmentToVersion;
    try {
        let id = fragmentToVersion.id;
        if (!id) {
            const { status, fragment } = await fetchFragmentByPath(params.odinEndpoint, path, authToken);
            if (status === 404) {
                logger.info(`Fragment not found for path ${path}, skipping versioning`);
                return { success: true, item: path };
            }
            ({ id } = fragment);
        }
        await postToOdinWithRetry(params.odinEndpoint, `/adobe/sites/cf/fragments/${id}/versions`, authToken, {
            label: 'Pre-translation version',
            comment: `Pre-translation project "${title}" (${params.projectId})`,
        });
        return { success: true, item: path };
    } catch (error) {
        logger.error(`Error versioning fragment ${path}: ${error}`);
        return { success: false, item: path, error: error.message || error.toString() };
    }
}

async function versionTargetFragments(context, options = {}) {
    const { translationData, authToken, batchSize, params } = context;
    const itemsToVersion = getVersioningTargets(translationData);
    const onBatchCompleted = options.onBatchCompleted;
    logger.info(`Versioning target items for ${itemsToVersion.length} items`);
    const config = {
        authToken,
        title: translationData.title,
        params,
    };

    const results = [];
    let completedItemCount = 0;
    let failedItemCount = 0;

    for (let i = 0; i < itemsToVersion.length; i += batchSize) {
        const batch = itemsToVersion.slice(i, i + batchSize);
        logger.info(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(itemsToVersion.length / batchSize)}`);

        const batchResults = await Promise.all(batch.map((item) => versionTargetFragment(item, config)));
        results.push(...batchResults);

        completedItemCount += batchResults.filter((result) => result.success).length;
        failedItemCount += batchResults.filter((result) => !result.success).length;

        if (onBatchCompleted) {
            await onBatchCompleted({
                completedItemCount,
                failedItemCount,
                itemCount: itemsToVersion.length,
            });
        }
    }

    if (failedItemCount > 0) {
        const failures = results.filter((result) => !result.success);
        logger.error(`${failures.length} request(s) failed: ${failures.map((failure) => failure.item).join(', ')}`);
    }

    logger.info(`Successfully versioned ${results.length} target fragments`);
    return {
        success: failedItemCount === 0,
        itemCount: itemsToVersion.length,
        completedItemCount,
        failedItemCount,
    };
}

async function sendLocRequestWithRetry(config) {
    try {
        const { authToken, odinEndpoint, locPayload, maxRetries = 3 } = config;
        logger.info('Sending loc request');
        const success = await postToOdinWithRetry(
            odinEndpoint,
            '/bin/sendToLocalisationAsync',
            authToken,
            locPayload,
            maxRetries,
        );
        return { success };
    } catch (error) {
        const lastError = error.message || error.toString();
        logger.error(`Failed to send loc request after retries: ${lastError}`);
        return { success: false, error: lastError };
    }
}

async function sendSyncRequest({ id, update: { name, value, path: updatePath }, path, etag }, { authToken, params }) {
    try {
        logger.info(`Updating ${name} for ${path} (${id})`);
        const response = await fetchOdin(params.odinEndpoint, `/adobe/sites/cf/fragments/${id}`, authToken, {
            method: 'PATCH',
            contentType: 'application/json-patch+json',
            etag,
            body: JSON.stringify([{ op: 'replace', path: updatePath, value }]),
        });
        await response.json();
        return { success: true };
    } catch (error) {
        logger.error(`Error syncing element: ${error}`);
        return { success: false, path, error: error.message || error.toString() };
    }
}

async function sendSyncRequests(itemsToSync, authToken, batchSize, params = {}) {
    const config = { authToken, params };
    const results = await processBatchWithConcurrency(itemsToSync, batchSize, (item) => sendSyncRequest(item, config));

    const failures = results.filter((result) => !result.success);
    if (failures.length > 0) {
        logger.error(`${failures.length} request(s) failed: ${failures.map((failure) => failure.item).join(', ')}`);
        return { success: false };
    }

    logger.info(`Successfully sent ${results.length} sync requests`);
    return { success: true };
}

async function startTranslationProject(translationData = {}, authToken, params = {}) {
    const { itemsToTranslate, locales, surface, translationFlow } = translationData;
    logger.info(`Starting translation project ${itemsToTranslate} for locales ${locales} and surface ${surface}`);

    const locPayload = {
        includeNestedCFs: false,
        syncNestedCFs: false,
        taskName: translationData.title,
        cfPaths: itemsToTranslate,
        targetLocales: locales,
        ...(translationFlow || {}),
    };

    logger.info(`locPayload: ${JSON.stringify(locPayload)}`);

    const config = {
        authToken,
        odinEndpoint: params.odinEndpoint,
        locPayload,
        maxRetries: 3,
    };

    const result = await sendLocRequestWithRetry(config);
    if (!result.success) {
        logger.error(`Failed to send loc request: ${result.error}`);
        return false;
    }

    logger.info('Successfully sent loc request');
    return true;
}

async function startRolloutOnlyProject(translationData, authToken, params = {}) {
    const { itemsToTranslate, locales, surface } = translationData;
    logger.info(`Starting rollout only project ${itemsToTranslate} for locales ${locales} and surface ${surface}`);

    const items = itemsToTranslate.map((item) => ({
        contentPath: item,
        targetLocales: locales,
        syncNestedCFs: false,
    }));

    const locPayload = {
        items,
    };

    logger.info(`locPayload: ${JSON.stringify(locPayload)}`);

    const config = {
        authToken,
        odinEndpoint: params.odinEndpoint,
        locPayload,
        maxRetries: 3,
    };

    const result = await sendRolloutRequestWithRetry(config);
    if (!result.success) {
        logger.error(`Failed to send rollout request: ${result.error}`);
        return false;
    }

    logger.info('Successfully sent rollout request');
    return true;
}

async function sendRolloutRequestWithRetry(config) {
    try {
        const { authToken, odinEndpoint, locPayload, maxRetries = 3 } = config;
        logger.info('Sending rollout request');
        const success = await postToOdinWithRetry(odinEndpoint, '/bin/localeSync', authToken, locPayload, maxRetries);
        return { success };
    } catch (error) {
        const lastError = error.message || error.toString();
        logger.error(`Failed to send rollout request after retries: ${lastError}`);
        return { success: false, error: lastError };
    }
}

async function updateTranslationDate(projectCF, etag, authToken, params = {}) {
    try {
        logger.info(`Updating translation project submission date for ${projectCF.id}`);

        const path = getValues(projectCF, 'submissionDate')?.path;
        if (!path) {
            logger.error('Submission date field not found in translation project');
            throw new Error('Submission date field not found in translation project');
        }

        const response = await fetchOdin(params.odinEndpoint, `/adobe/sites/cf/fragments/${projectCF.id}`, authToken, {
            method: 'PATCH',
            contentType: 'application/json-patch+json',
            etag,
            body: JSON.stringify([
                { op: 'replace', path: `${path}/values`, value: [`${new Date().toISOString().split('.')[0]}Z`] },
            ]),
        });
        const updatedFragment = await response.json();
        const submissionDate = getValue(updatedFragment, 'submissionDate')?.value;
        return { success: true, submissionDate };
    } catch (error) {
        logger.error(`Error updating translation project submission date: ${error}`);
        return false;
    }
}

module.exports = {
    DEFAULT_BATCH_SIZE,
    prepareProjectStart,
    runVersioningStage,
    runPostVersioningStage,
    finalizeProjectStart,
    getVersioningItemCount,
    createProjectStartError,
    isProjectStartError,
};
