const { Core } = require('@adobe/aio-sdk');
const { errorResponse, checkMissingRequestInputs, getBearerToken } = require('../../utils');
const {
    fetchFragmentByPath,
    fetchOdin,
    getTargetPath,
    getValue,
    getValues,
    getVariationParent,
    postToOdinWithRetry,
    processBatchWithConcurrency,
    putToOdin,
    patchToOdin,
} = require('../common.js');

const ODIN_PATH = (surface, locale, fragmentPath) => `/content/dam/mas/${surface}/${locale}/${fragmentPath}`;
const PATH_TOKENS = /\/content\/dam\/mas\/(?<surface>[\w-_]+)\/(?<parsedLocale>[\w-_]+)\/(?<fragmentPath>.+)/;
const logger = Core.Logger('translation', { level: 'info' });
const DEFAULT_BATCH_SIZE = 10;
const DEFAULT_RPS_LIMIT = 10;
const ODIN_LOC_TASK_NAME_MAX_LENGTH = 255;

function getOdinLocTaskNameValidationError(value) {
    const title = (value ?? '').trim();
    if (title.length === 0) {
        return 'Project title cannot be empty.';
    }
    if (title.length > ODIN_LOC_TASK_NAME_MAX_LENGTH) {
        return `Project title must be at most ${ODIN_LOC_TASK_NAME_MAX_LENGTH} characters.`;
    }
    if (!/[A-Za-z0-9]/.test(title)) {
        return 'Project title must include at least one letter or number.';
    }
    if (!/^[A-Za-z0-9._-]+$/.test(title)) {
        return 'Project title may only use letters, numbers, hyphens, underscores and dots.';
    }
    if (title.includes('..')) {
        return 'Project title cannot contain two dots in a row.';
    }
    return null;
}

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
    const translationTitle = (getValue(projectCF, 'title')?.value ?? '').trim();
    const taskNameError = getOdinLocTaskNameValidationError(translationTitle);
    if (taskNameError) {
        throw createProjectStartError(400, taskNameError);
    }
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
        batchSize: Number(params.batchSize) || DEFAULT_BATCH_SIZE,
        rpsLimit: Number(params.rpsLimit) || DEFAULT_RPS_LIMIT,
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
        context.rpsLimit,
    );
    if (!syncResult.success) {
        throw createProjectStartError(500, `Failed to sync: ${syncResult.error} target fragments`);
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
    if (itemsToTranslate?.length === 0) {
        logger.warn(`No items to translate found in translation project: ${projectCF.id}`);
        return null;
    }
    const { items: itemsToSync, success } = await getItemsToSync(authToken, projectCF, locales, surface, params);
    if (!success) {
        logger.error('Failed to get items to sync');
        return null;
    }

    logger.info(`Translation flow: ${translationFlow}`);

    return {
        title: getValue(projectCF, 'title')?.value?.trim(),
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
            logger.info(`Placeholder: Adding ${path} to sync with entries=${targetPlaceholders}`);
            items.push({
                path,
                update: {
                    name: 'entries',
                    value: targetPlaceholders,
                },
            });
        }
    }
    // for each grouped variation, add the parent fragments in target locales to the sync list
    const variations = getPznVariations(projectCF);
    if (variations.length === 0) {
        return { items, success: true };
    }
    // map of parentPath -> Set of grouped variation paths
    const newVariationsMap = new Map();
    for (const variationPath of variations) {
        try {
            const { parentFragment, status } = await getVariationParent(params.odinEndpoint, variationPath, authToken);
            if (status !== 200 || !parentFragment) {
                logger.error(`Grouped variation: Failed to get parent for ${variationPath}: ${status}`);
                return { items: [], success: false };
            }
            if (!newVariationsMap.has(parentFragment.path)) {
                newVariationsMap.set(parentFragment.path, new Set());
            }
            newVariationsMap.get(parentFragment.path).add(variationPath);
        } catch (error) {
            logger.error(`Grouped variation: Error finding parent for ${variationPath}: ${error.message}`);
            return { items: [], success: false };
        }
    }

    // For each parent fragment add items for all target locales
    for (const [parentPath, variationPaths] of newVariationsMap.entries()) {
        for (const locale of locales) {
            const path = getTargetPath(parentPath, locale);
            if (!path) continue;
            const value = [...variationPaths].map((variation) => getTargetPath(variation, locale)).filter(Boolean);

            if (value.length > 0) {
                logger.info(`Adding ${path} to sync with variations=${value}`);
                items.push({
                    path,
                    update: {
                        name: 'variations',
                        value,
                    },
                });
            }
        }
    }

    return { items, success: true };
}

function getItemsToTranslate(projectCF) {
    const fragments = getValues(projectCF, 'fragments')?.values || [];
    const collections = getValues(projectCF, 'collections')?.values || [];
    const placeholders = getValues(projectCF, 'placeholders')?.values || [];

    return [...fragments, ...collections, ...placeholders];
}

function getPznVariations(projectCF) {
    return getValues(projectCF, 'fragments')?.values?.filter((path) => path?.includes('/pzn/')) || [];
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
    const { translationData, authToken, batchSize, rpsLimit, params } = context;
    const itemsToVersion = getVersioningTargets(translationData);
    const onBatchCompleted = options.onBatchCompleted;
    logger.info(`Versioning target items for ${itemsToVersion.length} items`);
    const config = { authToken, title: translationData.title, params };

    let runningCompleted = 0;
    let runningFailed = 0;

    const results = await processBatchWithConcurrency(
        itemsToVersion,
        batchSize,
        (item) => versionTargetFragment(item, config),
        rpsLimit,
        onBatchCompleted &&
            (async (batchResults) => {
                runningCompleted += batchResults.filter((r) => r.success).length;
                runningFailed += batchResults.filter((r) => !r.success).length;
                await onBatchCompleted({
                    completedItemCount: runningCompleted,
                    failedItemCount: runningFailed,
                    itemCount: itemsToVersion.length,
                });
            }),
    );

    const failures = results.filter((result) => !result.success);
    const completedItemCount = results.length - failures.length;
    const failedItemCount = failures.length;

    if (failedItemCount > 0) {
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

async function sendSyncRequest({ path, update: { name, value } }, { authToken, params }) {
    try {
        const { fragment, status, etag } = await fetchFragmentByPath(params.odinEndpoint, path, authToken);
        if (status !== 200 || !fragment) {
            const errorMsg = `Failed to fetch fragment at ${path}: ${status}`;
            logger.error(`Error syncing element ${path}: ${errorMsg}`);
            return { success: false, path, error: errorMsg };
        }

        const { id } = fragment;
        const existing = getValues(fragment, name);
        const existingValues = existing?.values ?? [];
        const merged = [...existingValues];
        for (const v of value) {
            if (!merged.includes(v)) merged.push(v);
        }

        // Variations fields are locked by live relationships and cannot be updated via PATCH
        // Use PUT with full fragment instead
        if (name === 'variations') {
            if (merged.length === existingValues.length && merged.every((v, i) => v === existingValues[i])) {
                logger.info(`No change for variations at ${path}, skipping sync`);
                return { success: true };
            }

            // If variations field doesn't exist, add it; otherwise update the variations field in the fields array
            const variationsField = fragment.fields.find((f) => f.name === 'variations');
            const updatedFields = variationsField
                ? fragment.fields.map((field) => (field.name === 'variations' ? { ...field, values: merged } : field))
                : [
                      ...fragment.fields,
                      {
                          name: 'variations',
                          type: 'content-fragment',
                          multiple: true,
                          values: merged,
                      },
                  ];

            // Send PUT request with full fragment
            return await putToOdin(params.odinEndpoint, id, authToken, {
                title: fragment.title,
                description: fragment.description || '',
                fields: updatedFields,
                etag,
            });
        }

        // For non-variations fields, use PATCH
        const updatePath = existing?.path ? `${existing.path}/values` : null;
        if (!updatePath) {
            const errorMsg = `Field ${name} not found in fragment at ${path}`;
            logger.error(`Error syncing element ${path}: ${errorMsg}`);
            return { success: false, path, error: errorMsg };
        }

        const patchBody = [{ op: 'replace', path: updatePath, value: merged }];
        return await patchToOdin(params.odinEndpoint, id, authToken, patchBody, etag);
    } catch (error) {
        logger.error(`Error syncing element: ${error}`);
        const errorMsg = `${error.message || error.toString()}`;
        return { success: false, path, error: errorMsg };
    }
}

async function sendSyncRequests(itemsToSync, authToken, batchSize, params = {}, rpsLimit = null) {
    const config = { authToken, params };
    const results = await processBatchWithConcurrency(
        itemsToSync,
        batchSize,
        (item) => sendSyncRequest(item, config),
        rpsLimit,
    );

    const failures = results.filter((result) => !result.success);
    if (failures.length > 0) {
        const errorMsg = `${failures.length} request(s) failed: ${failures.map((failure) => failure.path || 'unknown').join(', ')}`;
        return { success: false, error: errorMsg };
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

async function updateProjectStatus(projectId, status, authToken, params = {}, etag = null) {
    const { projectCF, etag: fetchedEtag } = await getTranslationProject(projectId, authToken, params);
    const statusField = getValues(projectCF, 'status');
    if (!statusField?.path) {
        logger.info(`Status field not found in translation project ${projectId}, skipping status update to ${status}`);
        return { success: false, skipped: true };
    }

    const response = await fetchOdin(params.odinEndpoint, `/adobe/sites/cf/fragments/${projectId}`, authToken, {
        method: 'PATCH',
        contentType: 'application/json-patch+json',
        etag: etag ?? fetchedEtag,
        body: JSON.stringify([{ op: 'replace', path: `${statusField.path}/values`, value: [status] }]),
    });

    return { success: true, etag: response.headers.get('etag') };
}

module.exports = {
    prepareProjectStart,
    runVersioningStage,
    runPostVersioningStage,
    finalizeProjectStart,
    getVersioningItemCount,
    createProjectStartError,
    isProjectStartError,
    updateProjectStatus,
};
