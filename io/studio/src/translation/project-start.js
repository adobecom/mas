const { Core } = require('@adobe/aio-sdk');
const { errorResponse, checkMissingRequestInputs, getBearerToken } = require('../../utils');
const { Ims } = require('@adobe/aio-lib-ims');
const { fetchOdin, postToOdin, processBatchWithConcurrency } = require('../common.js');

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

        const translationData = getTranslationData(projectCF, params.surface, params.translationMapping);
        if (!translationData) {
            return errorResponse(400, 'Translation project is incomplete (missing items or locales)', logger);
        }

        const versioned = await versionTargetFragments(translationData, authToken);
        if (!versioned) {
            return errorResponse(500, 'Failed to version target fragments', logger);
        }

        const syncResult = await sendSyncRequestWithRetry(translationData.itemsToSync, translationData.locales, authToken);
        if (!syncResult.success) {
            return errorResponse(500, 'Failed to sync target fragments', logger);
        }

        const translationProject = await startTranslationProject(translationData, authToken);
        if (!translationProject) {
            return errorResponse(500, 'Failed to start translation project', logger);
        }

        const updatedProjectCF = await updateTranslationDate(projectCF, etag, authToken);
        if (!updatedProjectCF) {
            return errorResponse(500, 'Failed to update translation project submission date', logger);
        }
    } catch (error) {
        logger.error('Error calling the main action', error);
        return errorResponse(500, `Internal server error - ${error.message}`, logger);
    }

    return {
        statusCode: 200,
        body: {
            message: 'Translation project started',
        },
    };

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

    function getTranslationData(projectCF, surface, translationMapping = {}) {
        const itemsToTranslate = getItemsToTranslate(projectCF, surface);
        const itemsToSync = getItemsToSync(projectCF, surface);
        const locales = projectCF.fields.find((field) => field.name === 'targetLocales')?.values;
        if (!itemsToTranslate) {
            return null;
        }
        if (!locales || locales.length === 0) {
            logger.warn('No locales found in translation project');
            return null;
        }

        // set translation flow
        const translationFlow = translationMapping[surface];
        logger.info(`Translation flow: ${translationFlow}`);

        return {
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

    function getItemsToSync(projectCF, surface) {
        const items = [];
        const placeholdersFound = projectCF.fields.find((field) => field.name === 'placeholders')?.values?.length > 0;
        if (placeholdersFound) {
            items.push(ODIN_PATH(surface, 'en_US', 'dictionary/index'));
        }
        return items;
    }

    function getItemsToTranslate(projectCF) {
        // Gather items from all three separate arrays
        const fragments = projectCF.fields.find((field) => field.name === 'fragments')?.values || [];
        const collections = projectCF.fields.find((field) => field.name === 'collections')?.values || [];
        const placeholders = projectCF.fields.find((field) => field.name === 'placeholders')?.values || [];

        // Combine all items into a single array
        const itemsToTranslate = [...fragments, ...collections, ...placeholders];

        if (itemsToTranslate.length === 0) {
            logger.warn(`No items to translate found in translation project: ${projectCF.id}`);
            return null;
        }
        return itemsToTranslate;
    }

    async function versionTargetFragment(fragmentPath, { authToken, odinEndpoint }) {
        try {
            const response = await fetchOdin(odinEndpoint, `/adobe/sites/cf/fragments?path=${fragmentPath}`, authToken, {
                ignoreErrors: [404],
            });
            if (response.status === 404) {
                logger.info(`Fragment not found, skipping versioning: ${fragmentPath}`);
                return { success: true, item: fragmentPath, skipped: true };
            }
            if (response.ok) {
                const fragmentCF = await response.json();
                const { id } = fragmentCF;
                await postToOdin(odinEndpoint, `/adobe/sites/cf/fragments/${id}/versions`, authToken, {
                    label: 'Pre-translation version',
                    comment: `Versioning before translation, project ${params.projectId}`,
                });
            }
            return { success: true, item: fragmentPath };
        } catch (error) {
            logger.error(`Error versioning fragment ${fragmentPath}: ${error}`);
            return { success: false, item: fragmentPath, error: error.message || error.toString() };
        }
    }

    async function versionTargetFragments(translationData, authToken) {
        const { itemsToTranslate, itemsToSync, locales } = translationData;
        const itemsToVersion = [...itemsToTranslate, ...itemsToSync].reduce((acc, item) => {
            const match = item.match(PATH_TOKENS);
            const { surface, fragmentPath } = match?.groups || {};
            locales.forEach((locale) => {
                acc.push(`/content/dam/mas/${surface}/${locale}/${fragmentPath}`);
            });
            return acc;
        }, []);
        logger.info(`Versioning target items for ${itemsToVersion.length} items`);
        const config = {
            authToken,
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
        const { authToken, odinEndpoint, locPayload, maxRetries = 3 } = config;
        let lastError = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                logger.info(`Sending loc request for fragment ${item} (attempt ${attempt}/${maxRetries})`);

                const response = await postToOdin(
                    odinEndpoint,
                    `/bin/sendToLocalisationAsync?path=${item}`,
                    authToken,
                    locPayload,
                );
                return { success: true, item };
            } catch (error) {
                lastError = error.message || error.toString();
                logger.warn(`Error sending loc request for fragment ${item} (attempt ${attempt}/${maxRetries}): ${lastError}`);

                if (attempt < maxRetries) {
                    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                    logger.info(`Waiting ${delay}ms before retry...`);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                    continue;
                }
            }
        }

        logger.error(`Failed to send loc request for fragment ${item} after ${maxRetries} attempts: ${lastError}`);
        return { success: false, item, error: lastError };
    }

    // Helper function to send a single request with retry logic
    async function sendSyncRequestWithRetry(itemsToSync, targetLocales, authToken, maxRetries = 3) {
        let lastError = null;

        if (itemsToSync.length === 0) {
            logger.info('No items to sync, skipping sync request');
            return { success: true, items: [] };
        }

        const items = itemsToSync.map((item) => {
            return { contentPath: item, targetLocales };
        });

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                logger.info(`Sending sync request for ${items.length} fragment  (attempt ${attempt}/${maxRetries})`);

                const response = await postToOdin(params.odinEndpoint, '/bin/localeSync', authToken, { items });
                if (response.ok) {
                    return { success: true, items };
                }
            } catch (error) {
                lastError = error.message || error.toString();
                logger.warn(
                    `Error sending sync request for ${items.length} fragmens (attempt ${attempt}/${maxRetries}): ${lastError}`,
                );

                if (attempt < maxRetries) {
                    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                    logger.info(`Waiting ${delay}ms before retry...`);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                    continue;
                }
            }
        }

        logger.error(`Failed to send sync request for  ${items.length} fragments after ${maxRetries} attempts: ${lastError}`);
        return { success: false, items, error: lastError };
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
            const submissionDateFieldIndex = projectCF.fields.findIndex((field) => field.name === 'submissionDate');
            if (submissionDateFieldIndex === -1) {
                logger.error('Submission date field not found in translation project');
                throw new Error('Submission date field not found in translation project');
            }

            // update submissionDate field
            const path = `/fields/${submissionDateFieldIndex}/values`;

            // save translation project
            const response = await fetchOdin(params.odinEndpoint, `/adobe/sites/cf/fragments/${projectCF.id}`, authToken, {
                method: 'PATCH',
                body: [{ op: 'replace', path, value: [new Date().toISOString()] }],
                etag,
            });
            return response.ok;
        } catch (error) {
            logger.error(`Error updating translation project submission date: ${error}`);
            return false;
        }
    }
}

module.exports.main = main;
