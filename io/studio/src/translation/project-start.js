const { Core } = require('@adobe/aio-sdk');
const { errorResponse, checkMissingRequestInputs, getBearerToken } = require('../../utils');
const { Ims } = require('@adobe/aio-lib-ims');
const {
    fetchFragmentByPath,
    fetchOdin,
    getValue,
    getValues,
    postToOdinWithRetry,
    processBatchWithConcurrency,
} = require('../common.js');

const logger = Core.Logger('translation', { level: 'info' });
const DEFAULT_BATCH_SIZE = 10;
const ODIN_PATH = (surface, locale, fragmentPath) => `/content/dam/mas/${surface}/${locale}/${fragmentPath}`;
const PATH_TOKENS = /\/content\/dam\/mas\/(?<surface>[\w-_]+)\/(?<parsedLocale>[\w-_]+)\/(?<fragmentPath>.+)/;

async function main(params) {
    const batchSize = params.batchSize || DEFAULT_BATCH_SIZE;

    try {
        logger.info('Calling the main action');

        const requiredHeaders = ['Authorization'];
        const requiredParams = ['projectId', 'surface'];
        const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders);
        if (errorMessage) {
            return errorResponse(400, errorMessage, logger);
        }

        const authToken = getBearerToken(params);
        const allowed = await isAllowed(authToken, params.allowedClientId);
        if (!allowed) {
            return errorResponse(401, 'Authorization failed', logger);
        }

        const { projectCF, etag } = await getTranslationProject(params.projectId, authToken);

        const translationData = await getTranslationData(authToken, projectCF, params.surface, params.translationMapping);
        if (!translationData) {
            return errorResponse(400, 'Translation project is incomplete (missing items or locales)', logger);
        }

        const versioned = await versionTargetFragments(translationData, authToken);
        if (!versioned) {
            return errorResponse(500, 'Failed to version target fragments', logger);
        }

        const syncResult = await sendSyncRequests(translationData.itemsToSync, authToken);
        if (!syncResult.success) {
            return errorResponse(500, 'Failed to sync target fragments', logger);
        }

        const translationProject = await startTranslationProject(translationData, authToken);
        if (!translationProject) {
            return errorResponse(500, 'Failed to start translation project', logger);
        }

        const updatedProjectCF = await updateTranslationDate(projectCF, etag, authToken);
        if (!updatedProjectCF?.success) {
            return errorResponse(500, 'Failed to update translation project submission date', logger);
        }

        return {
            statusCode: 200,
            body: {
                message: 'Translation project started',
                submissionDate: updatedProjectCF.submissionDate,
            },
        };
    } catch (error) {
        logger.error('Error calling the main action', error);
        return errorResponse(500, `Internal server error - ${error.message}`, logger);
    }

    async function isAllowed(token, allowedClientId) {
        logger.info(`Validating IMS token for client ID: ${allowedClientId}`);
        const ims = new Ims('prod');
        const imsValidation = await ims.validateTokenAllowList(token, [allowedClientId]);

        // Check if token is valid
        if (!imsValidation || !imsValidation.valid) {
            logger.error(`IMS token validation failed: ${JSON.stringify(imsValidation, null, 2)}`);
            return false;
        }

        return true;
    }

    async function getTranslationProject(projectId, authToken) {
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

    async function getTranslationData(authToken, projectCF, surface, translationMapping = {}) {
        const locales = getValues(projectCF, 'targetLocales')?.values;
        if (!locales || locales.length === 0) {
            logger.warn('No locales found in translation project');
            return null;
        }
        const itemsToTranslate = getItemsToTranslate(projectCF, surface);
        if (!itemsToTranslate) {
            return null;
        }
        const itemsToSync = await getItemsToSync(authToken, projectCF, locales, surface);

        // set translation flow
        const translationFlow = translationMapping[surface];
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

    async function getItemsToSync(authToken, projectCF, locales, surface) {
        const items = [];
        const placeholders = getValues(projectCF, 'placeholders')?.values || [];
        if (placeholders.length > 0) {
            for (const locale of locales) {
                const targetPlaceholders = placeholders.map((placeholder) => placeholder.replace('/en_US/', `/${locale}/`));
                const path = ODIN_PATH(surface, locale, 'dictionary/index');
                const { fragment, status, etag } = await fetchFragmentByPath(params.odinEndpoint, path, authToken);
                if (status === 200 && fragment) {
                    const { value: existingEntries = [], path: existingEntriesPath } = getValues(fragment, 'entries');
                    if (existingEntriesPath) {
                        items.push({
                            id: fragment.id,
                            etag,
                            path,
                            update: {
                                name: 'entries',
                                path: `${existingEntriesPath}/values`,
                                value: [...existingEntries, ...targetPlaceholders],
                            },
                        });
                    }
                }
            }
        }
        return items;
    }

    function getItemsToTranslate(projectCF) {
        // Gather items from all three separate arrays
        const fragments = getValues(projectCF, 'fragments')?.values || [];
        const collections = getValues(projectCF, 'collections')?.values || [];
        const placeholders = getValues(projectCF, 'placeholders')?.values || [];

        // Combine all items into a single array
        const itemsToTranslate = [...fragments, ...collections, ...placeholders];

        if (itemsToTranslate.length === 0) {
            logger.warn(`No items to translate found in translation project: ${projectCF.id}`);
            return null;
        }
        return itemsToTranslate;
    }

    async function versionTargetFragment(fragmentToVersion, { authToken, title }) {
        const { path } = fragmentToVersion;
        try {
            let id = fragmentToVersion.id;
            if (!id) {
                const { status, fragment } = await fetchFragmentByPath(params.odinEndpoint, path, authToken);
                if (status === 404) {
                    logger.info(`Fragment not found for path ${path}, skipping versioning`);
                    return { success: true, item: path };
                }
                if (status !== 200 || !fragment) {
                    logger.error(`Error fetching fragment for versioning at path ${path}: ${status}`);
                    return {
                        success: false,
                        item: path,
                        error: `Failed to fetch fragment for versioning, status code: ${status}`,
                    };
                }
                ({ id } = fragment);
            }
            await postToOdinWithRetry(params.odinEndpoint, `/adobe/sites/cf/fragments/${id}/versions`, authToken, {
                label: 'Pre-translation version',
                comment: `translation project "${title}" (${params.projectId})`,
            });
            return { success: true, item: path };
        } catch (error) {
            logger.error(`Error versioning fragment ${path}: ${error}`);
            return { success: false, item: path, error: error.message || error.toString() };
        }
    }

    async function versionTargetFragments(translationData, authToken) {
        const { itemsToTranslate, itemsToSync, locales, title } = translationData;
        const itemsToVersion = itemsToTranslate.reduce((acc, item) => {
            const match = item.match(PATH_TOKENS);
            const { surface, fragmentPath } = match?.groups || {};
            locales.forEach((locale) => {
                acc.push({
                    path: `/content/dam/mas/${surface}/${locale}/${fragmentPath}`,
                });
            });
            return acc;
        }, []);
        itemsToVersion.push(...itemsToSync);
        logger.info(`Versioning target items for ${itemsToVersion.length} items`);
        const config = {
            authToken,
            title,
            odinEndpoint: params.odinEndpoint,
        };
        // Process items in batches to respect RPS limit
        const results = await processBatchWithConcurrency(itemsToVersion, batchSize, (item) =>
            versionTargetFragment(item, config),
        );

        // Check if any requests failed
        const failures = results.filter((result) => !result.success);
        if (failures.length > 0) {
            logger.error(`${failures.length} request(s) failed: ${failures.map((failure) => failure.item).join(', ')}`);
            return false;
        }
        logger.info(`Successfully versioned ${results.length} target fragments`);
        return true;
    }

    // Helper function to send a single request with retry logic
    async function sendLocRequestWithRetry(item, config) {
        try {
            const { authToken, odinEndpoint, locPayload, maxRetries = 3 } = config;
            logger.info(`Sending loc request for fragment ${item}`);
            const success = await postToOdinWithRetry(
                odinEndpoint,
                `/bin/sendToLocalisationAsync?path=${item}`,
                authToken,
                locPayload,
                maxRetries,
            );
            return { success, item };
        } catch (error) {
            const lastError = error.message || error.toString();
            logger.error(`Failed to send loc request for fragment ${item} after retries: ${lastError}`);
            return { success: false, item, error: lastError };
        }
    }

    async function sendSyncRequest({ id, update: { name, value, path: updatePath }, path, etag }, { authToken }) {
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
            logger.error(`Error updating translation project submission date: ${error}`);
            return { success: false, path, error: error.message || error.toString() };
        }
    }

    // Helper function to send a single request with retry logic
    async function sendSyncRequests(itemsToSync, authToken) {
        const config = { authToken };
        // Process items in batches to respect RPS limit
        const results = await processBatchWithConcurrency(itemsToSync, batchSize, (item) => sendSyncRequest(item, config));

        // Check if any requests failed after all retries
        const failures = results.filter((result) => !result.success);
        if (failures.length > 0) {
            logger.error(`${failures.length} request(s) failed: ${failures.map((failure) => failure.item).join(', ')}`);
            return false;
        }

        logger.info(`Successfully sent ${results.length} sync requests`);
        return { success: true };
    }

    async function startTranslationProject(translationData = {}, authToken) {
        const { itemsToTranslate, locales, surface, translationFlow } = translationData;
        logger.info(`Starting translation project ${itemsToTranslate} for locales ${locales} and surface ${surface}`);

        const locPayload = {
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

        // Process items in batches to respect RPS limit
        const results = await processBatchWithConcurrency(itemsToTranslate, batchSize, (item) =>
            sendLocRequestWithRetry(item, config),
        );

        // Check if any requests failed after all retries
        const failures = results.filter((result) => !result.success);
        if (failures.length > 0) {
            logger.error(
                `${failures.length} request(s) failed after retries: ${failures.map((failure) => failure.item).join(', ')}`,
            );
            return false;
        }

        logger.info(`Successfully sent ${results.length} loc requests`);
        return true;
    }

    async function updateTranslationDate(projectCF, etag, authToken) {
        try {
            logger.info(`Updating translation project submission date for ${projectCF.id}`);

            // find field index of submissionDate
            const path = getValues(projectCF, 'submissionDate')?.path;
            if (!path) {
                logger.error('Submission date field not found in translation project');
                throw new Error('Submission date field not found in translation project');
            }

            // save translation project
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
}

module.exports.main = main;
